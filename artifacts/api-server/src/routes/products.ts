import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, productsTable, storesTable } from "@workspace/db";
import {
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  CreateProductBody,
  DeleteProductParams,
  ListProductsQueryParams,
  ListStoreProductsParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db
    .select({
      id: productsTable.id,
      storeId: productsTable.storeId,
      storeName: storesTable.storeName,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      stock: productsTable.stock,
      category: productsTable.category,
      images: productsTable.images,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(storesTable, eq(productsTable.storeId, storesTable.id))
    .where(eq(productsTable.stock, productsTable.stock))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  res.json(
    products.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, storeId, search } = query.data;

  let dbQuery = db
    .select({
      id: productsTable.id,
      storeId: productsTable.storeId,
      storeName: storesTable.storeName,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      stock: productsTable.stock,
      category: productsTable.category,
      images: productsTable.images,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(storesTable, eq(productsTable.storeId, storesTable.id))
    .$dynamic();

  const conditions = [];
  if (category) {
    conditions.push(eq(productsTable.category, category));
  }
  if (storeId) {
    conditions.push(eq(productsTable.storeId, Number(storeId)));
  }
  if (search) {
    conditions.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.description, `%${search}%`)
      )!
    );
  }

  if (conditions.length > 0) {
    const [first, ...rest] = conditions;
    if (rest.length > 0) {
      const { and } = await import("drizzle-orm");
      dbQuery = dbQuery.where(and(first, ...rest));
    } else {
      dbQuery = dbQuery.where(first);
    }
  }

  const products = await dbQuery.orderBy(desc(productsTable.createdAt));

  res.json(
    products.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/products", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, req.user!.userId));
  if (!store) {
    res.status(400).json({ error: "You must create a store first" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ ...parsed.data, storeId: store.id, price: String(parsed.data.price) })
    .returning();

  res.status(201).json({
    id: product.id,
    storeId: product.storeId,
    storeName: store.storeName,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    stock: product.stock,
    category: product.category,
    images: product.images,
    createdAt: product.createdAt.toISOString(),
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db
    .select({
      id: productsTable.id,
      storeId: productsTable.storeId,
      storeName: storesTable.storeName,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      stock: productsTable.stock,
      category: productsTable.category,
      images: productsTable.images,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(storesTable, eq(productsTable.storeId, storesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    ...result,
    price: parseFloat(result.price),
    createdAt: result.createdAt.toISOString(),
  });
});

router.patch("/products/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) {
    updateData.price = String(parsed.data.price);
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    id: product.id,
    storeId: product.storeId,
    storeName: null,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    stock: product.stock,
    category: product.category,
    images: product.images,
    createdAt: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/stores/:storeId/products", async (req, res): Promise<void> => {
  const params = ListStoreProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const products = await db
    .select({
      id: productsTable.id,
      storeId: productsTable.storeId,
      storeName: storesTable.storeName,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      stock: productsTable.stock,
      category: productsTable.category,
      images: productsTable.images,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(storesTable, eq(productsTable.storeId, storesTable.id))
    .where(eq(productsTable.storeId, params.data.storeId));

  res.json(
    products.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

export default router;
