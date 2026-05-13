import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, storesTable, usersTable } from "@workspace/db";
import { GetStoreParams, UpdateStoreParams, UpdateStoreBody, CreateStoreBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/stores", async (_req, res): Promise<void> => {
  const stores = await db.select().from(storesTable);
  res.json(
    stores.map((s) => ({
      id: s.id,
      userId: s.userId,
      storeName: s.storeName,
      logo: s.logo,
      description: s.description,
      location: s.location,
      ruralArea: s.ruralArea,
      contactInfo: s.contactInfo,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/stores", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db
    .insert(storesTable)
    .values({ ...parsed.data, userId: req.user!.userId })
    .returning();

  await db
    .update(usersTable)
    .set({ storeId: store.id })
    .where(eq(usersTable.id, req.user!.userId));

  res.status(201).json({
    id: store.id,
    userId: store.userId,
    storeName: store.storeName,
    logo: store.logo,
    description: store.description,
    location: store.location,
    ruralArea: store.ruralArea,
    contactInfo: store.contactInfo,
    createdAt: store.createdAt.toISOString(),
  });
});

router.get("/stores/my", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, req.user!.userId));
  if (!store) {
    res.status(404).json({ error: "No store found" });
    return;
  }
  res.json({
    id: store.id,
    userId: store.userId,
    storeName: store.storeName,
    logo: store.logo,
    description: store.description,
    location: store.location,
    ruralArea: store.ruralArea,
    contactInfo: store.contactInfo,
    createdAt: store.createdAt.toISOString(),
  });
});

router.get("/stores/:id", async (req, res): Promise<void> => {
  const params = GetStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, params.data.id));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json({
    id: store.id,
    userId: store.userId,
    storeName: store.storeName,
    logo: store.logo,
    description: store.description,
    location: store.location,
    ruralArea: store.ruralArea,
    contactInfo: store.contactInfo,
    createdAt: store.createdAt.toISOString(),
  });
});

router.patch("/stores/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db
    .update(storesTable)
    .set(parsed.data)
    .where(eq(storesTable.id, params.data.id))
    .returning();

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json({
    id: store.id,
    userId: store.userId,
    storeName: store.storeName,
    logo: store.logo,
    description: store.description,
    location: store.location,
    ruralArea: store.ruralArea,
    contactInfo: store.contactInfo,
    createdAt: store.createdAt.toISOString(),
  });
});

export default router;
