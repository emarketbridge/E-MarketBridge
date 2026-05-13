import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable } from "@workspace/db";
import { ProcessPaymentBody, GetPaymentParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/payments", requireAuth, async (req, res): Promise<void> => {
  const parsed = ProcessPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, paymentMethod } = parsed.data;

  // Simulated payment gateway
  // Cash on delivery: always succeeds immediately
  // Card: fake gateway that always succeeds (replace with Stripe/PayMob/Dinarak for production)
  let transactionId: string | null = null;
  let status: "pending" | "completed" | "failed" = "completed";

  if (paymentMethod === "cash_on_delivery") {
    status = "pending"; // COD is pending until delivery
  } else if (paymentMethod === "card") {
    // Simulated card payment — always succeeds in test mode
    // To integrate a real gateway (Stripe, PayMob, Dinarak, MadfooatCom):
    // 1. Install the SDK: npm install stripe
    // 2. Add your API key to environment variables
    // 3. Call the real payment API and handle the response
    transactionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    status = "completed";
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({ orderId, paymentMethod, transactionId, status })
    .returning();

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
  });
});

router.get("/payments/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, params.data.orderId));

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
  });
});

export default router;
