export type ErrorCode =
  | "INVALID_INPUT"
  | "TARGET_NOT_FOUND"
  | "STORE_ERROR"
  | "UNSUPPORTED_VERTICAL"
  | "UNKNOWN_TOOL";

export type ToolError = {
  code: ErrorCode;
  message: string;
  details?: unknown;
};

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: ToolError };
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(code: ErrorCode, message: string, details?: unknown): Err {
  return { ok: false, error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}
