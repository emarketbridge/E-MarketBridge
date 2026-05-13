import { Router, type IRouter } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, ordersTable, productsTable, orderItemsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/analytics/dashboard", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const storeId = req.user!.storeId;

  let totalProductsResult: { count: number }[];
  let totalOrdersResult: { count: number }[];
  let totalRevenueResult: { sum: string | null }[];
  let pendingOrdersResult: { count: number }[];

  if (storeId) {
    totalProductsResult = await db
      .select({ count: count() })
      .from(productsTable)
      .where(eq(productsTable.storeId, storeId));

    const { inArray, sql } = await import("drizzle-orm");
    const storeProductIds = (
      await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.storeId, storeId))
    ).map((p) => p.id);

    if (storeProductIds.length > 0) {
      const orderIdsResult = await db
        .select({ orderId: orderItemsTable.orderId })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.productId, storeProductIds));
      const orderIds = [...new Set(orderIdsResult.map((o) => o.orderId))];

      if (orderIds.length > 0) {
        totalOrdersResult = await db
          .select({ count: count() })
          .from(ordersTable)
          .where(inArray(ordersTable.id, orderIds));

        totalRevenueResult = await db
          .select({ sum: sql<string>`sum(${ordersTable.totalAmount})` })
          .from(ordersTable)
          .where(inArray(ordersTable.id, orderIds));

        pendingOrdersResult = await db
          .select({ count: count() })
          .from(ordersTable)
          .where(inArray(ordersTable.id, orderIds));
      } else {
        totalOrdersResult = [{ count: 0 }];
        totalRevenueResult = [{ sum: "0" }];
        pendingOrdersResult = [{ count: 0 }];
      }
    } else {
      totalOrdersResult = [{ count: 0 }];
      totalRevenueResult = [{ sum: "0" }];
      pendingOrdersResult = [{ count: 0 }];
    }
  } else {
    totalProductsResult = [{ count: 0 }];
    totalOrdersResult = [{ count: 0 }];
    totalRevenueResult = [{ sum: "0" }];
    pendingOrdersResult = [{ count: 0 }];
  }

  res.json({
    totalSales: totalOrdersResult[0]?.count ?? 0,
    totalOrders: totalOrdersResult[0]?.count ?? 0,
    totalProducts: totalProductsResult[0]?.count ?? 0,
    totalRevenue: parseFloat(totalRevenueResult[0]?.sum ?? "0"),
    pendingOrders: pendingOrdersResult[0]?.count ?? 0,
  });
});

router.get("/analytics/sales-by-month", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { sql } = await import("drizzle-orm");

  const rows = await db.execute(
    sql`SELECT 
      TO_CHAR(created_at, 'Mon YYYY') as month,
      TO_CHAR(created_at, 'YYYY-MM') as month_key,
      COUNT(*)::int as sales,
      COALESCE(SUM(total_amount), 0)::float as revenue
    FROM orders
    GROUP BY month, month_key
    ORDER BY month_key DESC
    LIMIT 12`
  );

  const result = (rows.rows as { month: string; sales: number; revenue: number }[])
    .reverse()
    .map((row) => ({
      month: row.month,
      sales: Number(row.sales),
      revenue: Number(row.revenue),
    }));

  res.json(result);
});

router.get("/analytics/top-products", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const storeId = req.user!.storeId;

  const { sql } = await import("drizzle-orm");

  let query;
  if (storeId) {
    query = sql`SELECT 
      p.id as product_id,
      p.name,
      COALESCE(SUM(oi.quantity), 0)::int as total_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0)::float as revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    WHERE p.store_id = ${storeId}
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5`;
  } else {
    query = sql`SELECT 
      p.id as product_id,
      p.name,
      COALESCE(SUM(oi.quantity), 0)::int as total_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0)::float as revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5`;
  }

  const rows = await db.execute(query);

  res.json(
    (rows.rows as { product_id: number; name: string; total_sold: number; revenue: number }[]).map((row) => ({
      productId: Number(row.product_id),
      name: row.name,
      totalSold: Number(row.total_sold),
      revenue: Number(row.revenue),
    }))
  );
});

export default router;
