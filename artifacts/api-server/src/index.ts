import app from "./app";
import { logger } from "./lib/logger";
import { verifyUsersTableReady } from "./lib/db-ready";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main(): Promise<void> {
  if (process.env.SKIP_DB_READINESS_CHECK !== "1") {
    const ready = await verifyUsersTableReady();
    if (!ready.ok) {
      if (process.env.NODE_ENV === "production") {
        logger.error(ready.message);
        process.exit(1);
      }
      logger.warn(ready.message);
    }
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
