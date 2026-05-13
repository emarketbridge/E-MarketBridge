-- Run in Supabase SQL Editor if `public.users` does not exist yet.
-- Matches Drizzle schema: lib/db/src/schema/users.ts

CREATE TABLE IF NOT EXISTS public.users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'buyer',
  store_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'buyer'))
);
