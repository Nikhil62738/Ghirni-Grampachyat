require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const ensureSeedData = require("./src/utils/ensureSeedData");
const { initCronJobs } = require("./src/jobs/cronJobs");
const { getEmailMode } = require("./src/services/emailService");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();

  // Automatically ensure the super admin + settings exist on every boot.
  // This is idempotent, so there is no need to run `npm run seed` manually.
  try {
    await ensureSeedData();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("\u26A0\uFE0F  Auto-seed skipped:", err.message);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\u2705 GP Ghirni Tax API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    // eslint-disable-next-line no-console
    console.log(`\u2709\uFE0F  Email mode: ${getEmailMode()}`);
    initCronJobs();
  });

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Closing server...`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("\u274C Failed to start server:", err);
  process.exit(1);
});
