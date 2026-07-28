/**
 * Best-effort human-readable message for a caught `unknown` error.
 *
 * Not every thrown value is an `Error` instance — Supabase/PostgREST error
 * objects in particular can be plain `{ message, details, hint, code }`
 * shapes that fail `instanceof Error`. Falling back straight to a generic
 * "unknown error" string in that case throws away exactly the detail an
 * admin needs to diagnose a misconfigured key/URL, so this checks for a
 * duck-typed `message` string before giving up.
 */
export function describeUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
