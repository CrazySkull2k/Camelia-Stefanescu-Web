import { randomBytes } from "node:crypto";

function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeSecret(bytes = 32) {
  return toBase64Url(randomBytes(bytes));
}

const secrets = {
  APPOINTMENT_RESUME_SECRET: makeSecret(32),
  CRON_SECRET: makeSecret(32),
  GOOGLE_CALENDAR_WEBHOOK_TOKEN: makeSecret(32),
  QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY: makeSecret(32),
  RESEND_WEBHOOK_SECRET: makeSecret(32),
};

process.stdout.write(
  [
    "# Generated fortress secrets",
    "# Paste these values into your production environment file or secret manager.",
    "# QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY is a 32-byte base64url key accepted by the app.",
    "",
    ...Object.entries(secrets).map(([key, value]) => `${key}=${value}`),
    "",
  ].join("\n"),
);
