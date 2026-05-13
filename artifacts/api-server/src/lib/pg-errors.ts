/** PostgreSQL / driver / network signals that should surface as 503, not 500. */

function errorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null || !("code" in err)) return undefined;
  const c = (err as { code?: unknown }).code;
  if (typeof c === "string") return c;
  if (typeof c === "number") return String(c);
  return undefined;
}

function isPgSqlState(code: string): boolean {
  return code.length === 5 && /^[0-9][0-9A-Z]{4}$/.test(code);
}

export function pgErrorCode(err: unknown): string | undefined {
  const c = errorCode(err);
  return c && isPgSqlState(c) ? c : undefined;
}

export function isPostgresUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === "23505";
}

export function isPostgresMissingRelationOrColumn(err: unknown): boolean {
  const c = pgErrorCode(err);
  return c === "42P01" || c === "42703";
}

/** DB unreachable, pool exhausted, missing table, TLS, etc. */
export function isInfrastructureDbError(err: unknown): boolean {
  if (isPostgresMissingRelationOrColumn(err)) return true;

  const code = errorCode(err);
  if (code && isPgSqlState(code)) {
    if (code.startsWith("08")) return true;
    if (code.startsWith("57")) return true;
    if (code.startsWith("53")) return true;
    if (code === "3F000") return true;
    if (code === "40001" || code === "40P01") return true;
  }

  if (code && !isPgSqlState(code)) {
    if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET"].includes(code)) {
      return true;
    }
  }

  if (err instanceof Error) {
    if (/relation ["'][^"']+["'] does not exist/i.test(err.message)) return true;
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNRESET|certificate/i.test(err.message)) {
      return true;
    }
  }

  return false;
}
