import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import storesRouter from "./stores";
import productsRouter from "./products";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(storesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(analyticsRouter);

export default router;
