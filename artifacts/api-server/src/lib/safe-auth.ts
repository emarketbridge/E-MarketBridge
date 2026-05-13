import bcrypt from "bcryptjs";

export function userCreatedAtIso(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(0).toISOString();
}

/**
 * Compare password to stored hash without throwing on missing/invalid hashes.
 */
export async function comparePasswordHash(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (hash == null || typeof hash !== "string" || hash.length === 0) {
    return false;
  }
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
