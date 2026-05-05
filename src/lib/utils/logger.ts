type LogLevel = "info" | "warn" | "error";

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? ` ${safeStringify(meta)}` : "";
  const formatted = `[${level.toUpperCase()}] ${message}${payload}`;

  if (level === "error") {
    console.error(formatted);
    return;
  }

  if (level === "warn") {
    console.warn(formatted);
    return;
  }

  console.info(formatted);
}
