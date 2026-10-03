// Structured server logger. Dependency-free and runtime-agnostic (edge, Node and the
// standalone realtime process): one JSON line in production, a readable line otherwise.
// Client components keep using `console`.

type Level = "error" | "warn" | "info";
type LogContext = Record<string, unknown>;

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
  cause?: SerializedError;
};

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /pass(word|wd)?|token|secret|authorization|cookie|api[-_]?key|credential/i;
const MAX_DEPTH = 5;

export function redact(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Error) return serializeError(value);
  if (seen.has(value)) return "[Circular]";
  if (depth >= MAX_DEPTH) return "[Truncated]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1, seen),
    ])
  );
}

export function serializeError(error: unknown, depth = 0): SerializedError {
  if (!(error instanceof Error)) {
    return { name: "NonError", message: stringify(error) };
  }

  const digest = (error as Error & { digest?: unknown }).digest;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(typeof digest === "string" ? { digest } : {}),
    ...(error.cause === undefined || depth >= MAX_DEPTH ?
      {}
    : { cause: serializeError(error.cause, depth + 1) }),
  };
}

function stringify(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(redact(value)) ?? String(value);
  } catch {
    return String(value);
  }
}

export function formatLog(
  level: Level,
  message: string,
  error?: unknown,
  context?: LogContext,
  production = process.env.NODE_ENV === "production"
) {
  const serialized = error === undefined ? undefined : serializeError(error);
  const safeContext = context && (redact(context) as LogContext);

  if (production) {
    return JSON.stringify({
      level,
      time: new Date().toISOString(),
      message,
      ...(serialized && { error: serialized }),
      ...(safeContext && { context: safeContext }),
    });
  }

  const lines = [`[${level}] ${message}`];
  if (serialized) {
    const digest = serialized.digest ? ` (digest ${serialized.digest})` : "";
    lines.push(`${serialized.name}: ${serialized.message}${digest}`);
    if (serialized.stack) lines.push(serialized.stack);
    for (let cause = serialized.cause; cause; cause = cause.cause) {
      lines.push(`Caused by ${cause.name}: ${cause.message}`);
    }
  }
  if (safeContext) lines.push(JSON.stringify(safeContext));
  return lines.join("\n");
}

function log(level: Level) {
  return (message: string, error?: unknown, context?: LogContext) => {
    console[level](formatLog(level, message, error, context));
  };
}

export const logger = {
  error: log("error"),
  warn: log("warn"),
  info: log("info"),
};
