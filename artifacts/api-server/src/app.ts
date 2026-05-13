import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { isInfrastructureDbError } from "./lib/pg-errors";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, service: "E-MarketBridge API" });
});

app.use("/api", router);

app.use((_req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: "Not found" });
  }
});

function httpStatusFromError(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const o = err as Record<string, unknown>;
  for (const key of ["statusCode", "status"] as const) {
    const n = Number(o[key]);
    if (Number.isFinite(n) && n >= 400 && n < 600) return n;
  }
  return undefined;
}

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err }, "unhandled route error");
  if (res.headersSent) {
    return;
  }

  const path = req.originalUrl?.split("?")[0] ?? "";

  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (path.startsWith("/api") && isInfrastructureDbError(err)) {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }

  const fromErr = httpStatusFromError(err);
  let status = fromErr ?? 500;

  if (path.startsWith("/api/auth") && status === 500) {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }

  if (status === 500) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const message =
    typeof (err as Error)?.message === "string" ? (err as Error).message : "Request error";
  res.status(status).json({ error: message });
};

app.use(errorHandler);

export default app;
