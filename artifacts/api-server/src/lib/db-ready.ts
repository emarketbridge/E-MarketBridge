import { pool } from "@workspace/db";

export type DbReadyResult = { ok: true } | { ok: false; message: string };

export async function verifyUsersTableReady(): Promise<DbReadyResult> {
  try {
    const { rows } = await pool.query<{ exists: boolean }>(
      `select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'users'
      ) as exists`,
    );
    if (!rows[0]?.exists) {
      return {
        ok: false,
        message: "public.users is missing; apply lib/db/sql/001_public_users.sql in Supabase.",
      };
    }
    return { ok: true };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `Database connection failed: ${detail}` };
  }
}
