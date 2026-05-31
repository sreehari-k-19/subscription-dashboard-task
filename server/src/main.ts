import { buildApp } from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";
import { startScheduler } from "./jobs/scheduler";

async function main() {
  await connectDB();

  const app = buildApp();

  startScheduler();

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  process.exit(0);
});

main();
