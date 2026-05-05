import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

export type EncryptedPayloadEnvelope = {
  v: 1;
  alg: "A256GCM";
  iv: string;
  tag: string;
  ciphertext: string;
};

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  return Buffer.from(normalized, "base64");
}

function parseEncryptionKey(rawKey?: string) {
  const value = rawKey?.trim();

  if (!value) {
    throw new Error(
      "Configureaza QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY pentru criptarea chestionarelor.",
    );
  }

  const normalized = value
    .replace(/^base64url:/i, "")
    .replace(/^base64:/i, "")
    .replace(/^hex:/i, "");

  const key = /^[a-f0-9]{64}$/i.test(normalized)
    ? Buffer.from(normalized, "hex")
    : decodeBase64Url(normalized);

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY trebuie sa fie o cheie de 32 bytes codata base64url sau hex.",
    );
  }

  return key;
}

function getQuestionnairePayloadEncryptionKey() {
  return parseEncryptionKey(process.env.QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY);
}

function isEncryptedPayloadEnvelope(value: unknown): value is EncryptedPayloadEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const envelope = value as Partial<EncryptedPayloadEnvelope>;

  return (
    envelope.v === 1 &&
    envelope.alg === "A256GCM" &&
    typeof envelope.iv === "string" &&
    typeof envelope.tag === "string" &&
    typeof envelope.ciphertext === "string"
  );
}

export function encryptJsonPayload(payload: unknown): EncryptedPayloadEnvelope {
  const key = getQuestionnairePayloadEncryptionKey();
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

export function decryptJsonPayload(envelope: unknown) {
  if (!isEncryptedPayloadEnvelope(envelope)) {
    throw new Error("Payload-ul criptat nu are formatul asteptat.");
  }

  const key = getQuestionnairePayloadEncryptionKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    decodeBase64Url(envelope.iv),
  );
  decipher.setAuthTag(decodeBase64Url(envelope.tag));

  const plaintext = Buffer.concat([
    decipher.update(decodeBase64Url(envelope.ciphertext)),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext) as unknown;
}

export function resolveStoredQuestionnairePayload(input: {
  payloadEncrypted?: unknown;
  payloadJson?: unknown;
}) {
  if (input.payloadEncrypted) {
    return decryptJsonPayload(input.payloadEncrypted);
  }

  return input.payloadJson ?? {};
}
