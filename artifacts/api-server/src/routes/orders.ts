import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, usersTable } from "@workspace/db";
import {
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  CreateOrderBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type OrderItemRow = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  productName?: string | null;
};

function formatOrder(order: typeof ordersTable.$inferSelect, items: OrderItemRow[], buyerName?: string | null) {
  return {
    id: order.id,
    buyerId: order.buyerId,
    buyerName: buyerName ?? null,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    shippingAddress: order.shippingAddress,
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName ?? null,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const { userId, role, storeId } = req.user!;

  let orders: (typeof ordersTable.$inferSelect)[];

  if (role === "buyer") {
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.buyerId, userId))
      .orderBy(desc(ordersTable.createdAt));
  } else {
    // Admin sees orders that contain products from their store
    if (!storeId) {
      res.json([]);
      return;
    }
    const storeProductIds = (
      await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.storeId, storeId))
    ).map((p) => p.id);

    if (storeProductIds.length === 0) {
      res.json([]);
      return;
    }

    const { inArray } = await import("drizzle-orm");
    const relevantOrderIds = (
      await db
        .select({ orderId: orderItemsTable.orderId })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.productId, storeProductIds))
    ).map((o) => o.orderId);

    if (relevantOrderIds.length === 0) {
      res.json([]);
      return;
    }

    orders = await db
      .select()
      .from(ordersTable)
      .where(inArray(ordersTable.id, relevantOrderIds))
      .orderBy(desc(ordersTable.createdAt));
  }

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select({
          id: orderItemsTable.id,
          orderId: orderItemsTable.orderId,
          productId: orderItemsTable.productId,
          productName: productsTable.name,
          quantity: orderItemsTable.quantity,
          price: orderItemsTable.price,
        })
        .from(orderItemsTable)
        .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(eq(orderItemsTable.orderId, order.id));

      const [buyer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.buyerId));
      return formatOrder(order, items, buyer?.name);
    })
  );

  res.json(result);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { shippingAddress, items } = parsed.data;

  // Fetch products to compute total
  let total = 0;
  const enrichedItems: { productId: number; quantity: number; price: number }[] = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = parseFloat(product.price);
    total += price * item.quantity;
    enrichedItems.push({ productId: item.productId, quantity: item.quantity, price });

    // Decrement stock
    await db
      .update(productsTable)
      .set({ stock: Math.max(0, product.stock - item.quantity) })
      .where(eq(productsTable.id, product.id));
  }

  const [order] = await db
    .insert(ordersTable)
    .values({ buyerId: req.user!.userId, totalAmount: String(total), shippingAddress })
    .returning();

  const insertedItems = await db
    .insert(orderItemsTable)
    .values(
      enrichedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: String(item.price),
      }))
    )
    .returning();

  const namedItems = await Promise.all(
    insertedItems.map(async (item) => {
      const [product] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, item.productId));
      return { ...item, productName: product?.name ?? null };
    })
  );

  res.status(201).json(formatOrder(order, namedItems));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select({
      id: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      quantity: orderItemsTable.quantity,
      price: orderItemsTable.price,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  const [buyer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.buyerId));

  res.json(formatOrder(order, items, buyer?.name));
});

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select({
      id: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      quantity: orderItemsTable.quantity,
      price: orderItemsTable.price,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  res.json(formatOrder(order, items));
});

export default router;
