import * as functions from "firebase-functions";

/**
 * Validate that required fields exist in the request data.
 * Throws HttpsError if any field is missing.
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter(
    (f) => data[f] === undefined || data[f] === null || data[f] === ""
  );
  if (missing.length > 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Missing required fields: ${missing.join(", ")}`
    );
  }
}

/**
 * Sanitize a string (trim + basic XSS prevention).
 */
export function sanitize(input: string): string {
  return input.trim().replace(/<[^>]*>/g, "");
}

/**
 * Generate a slug from a string (for URLs, IDs).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Paginate a Firestore query.
 */
export function paginationParams(data: { limit?: number; startAfter?: string }) {
  return {
    limit: Math.min(data.limit || 25, 100),
    startAfter: data.startAfter || null,
  };
}
