import app from "@/app";
import { env } from "@/config/env";
import { prisma } from "@/database/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
