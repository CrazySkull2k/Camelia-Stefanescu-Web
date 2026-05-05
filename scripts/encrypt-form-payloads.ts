import { createCipheriv, randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

type SubmissionRecord = {
  id: string;
  payload_json: unknown;
  payload_encrypted: unknown;
};

type EncryptedPayloadEnvelope = {
  v: 1;
  alg: "A256GCM";
  iv: string;
  tag: string;
  ciphertext: string;
};

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  return Buffer.from(normalized, "base64");
}

function parseEncryptionKey(rawKey: string) {
  const normalized = rawKey
    .trim()
    .replace(/^base64url:/i, "")
    .replace(/^base64:/i, "")
    .replace(/^hex:/i, "");

  const key = /^[a-f0-9]{64}$/i.test(normalized)
    ? Buffer.from(normalized, "hex")
    : decodeBase64Url(normalized);

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY must be 32 bytes encoded as base64url or hex.",
    );
  }

  return key;
}

function encryptJsonPayload(payload: unknown, key: Buffer): EncryptedPayloadEnvelope {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: "A256GCM",
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

function hasPlainPayload(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length,
  );
}

async function main() {
  const key = parseEncryptionKey(env("QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY"));
  const shouldWrite = process.env.CONFIRM_ENCRYPT_FORM_PAYLOADS === "1";
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase
    .from("form_submissions")
    .select("id, payload_json, payload_encrypted")
    .is("payload_encrypted", null)
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  const candidates = ((data ?? []) as SubmissionRecord[]).filter((submission) =>
    hasPlainPayload(submission.payload_json),
  );

  if (!shouldWrite) {
    console.log(
      `Dry run: ${candidates.length} submissions would be encrypted. Set CONFIRM_ENCRYPT_FORM_PAYLOADS=1 to write changes.`,
    );
    return;
  }

  let encrypted = 0;

  for (const submission of candidates) {
    const envelope = encryptJsonPayload(submission.payload_json, key);
    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        payload_json: {},
        payload_encrypted: envelope,
        payload_encrypted_at: new Date().toISOString(),
        payload_encryption_key_id: "primary",
      })
      .eq("id", submission.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    encrypted += 1;
  }

  console.log(`Encrypted ${encrypted} form submissions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
