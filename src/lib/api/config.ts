/**
 * Single source of truth for the FastAPI backend base URL.
 *
 * The literal `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"`
 * was previously copy-pasted into 6+ files. Importing from here keeps every
 * call site in lockstep with the deployed backend.
 */
export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";
