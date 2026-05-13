import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, storesTable } from "@workspace/db";
import type { User } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";
import { comparePasswordHash, userCreatedAtIso } from "../lib/safe-auth";
import {
  isPostgresMissingRelationOrColumn,
  isPostgresUniqueViolation,
} from "../lib/pg-errors";

const router: IRouter = Router();

function issueToken(user: Pick<User, "id" | "role" | "storeId">): string | null {
  try {
    return signToken({ userId: user.id, role: user.role, storeId: user.storeId ?? null });
  } catch (e) {
    logger.error({ err: e }, "signToken failed");
    return null;
  }
}

function authJsonBody(user: User, token: string) {
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      createdAt: userCreatedAtIso(user.createdAt),
    },
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const inserted = await db.insert(usersTable).values({ name, email, password: hashed, role }).returning();
    const user = inserted[0];
    if (!user) {
      logger.error("Register insert returned no row");
      res.status(503).json({ error: "Could not create account" });
      return;
    }

    const token = issueToken(user);
    if (!token) {
      res.status(503).json({ error: "Could not issue session" });
      return;
    }

    res.status(201).json(authJsonBody(user, token));
  } catch (err) {
    if (isPostgresUniqueViolation(err)) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    if (isPostgresMissingRelationOrColumn(err)) {
      res.status(503).json({ error: "Database schema error" });
      return;
    }
    logger.error({ err }, "register failed");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await comparePasswordHash(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = issueToken(user);
    if (!token) {
      res.status(503).json({ error: "Could not issue session" });
      return;
    }

    res.json(authJsonBody(user, token));
  } catch (err) {
    if (isPostgresMissingRelationOrColumn(err)) {
      res.status(503).json({ error: "Database schema error" });
      return;
    }
    logger.error({ err }, "login failed");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const store = user.storeId
      ? await db.select().from(storesTable).where(eq(storesTable.id, user.storeId))
      : [];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId ?? store[0]?.id ?? null,
      createdAt: userCreatedAtIso(user.createdAt),
    });
  } catch (err) {
    if (isPostgresMissingRelationOrColumn(err)) {
      res.status(503).json({ error: "Database schema error" });
      return;
    }
    logger.error({ err }, "auth/me failed");
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

export default router;
