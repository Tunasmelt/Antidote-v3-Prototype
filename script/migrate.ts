import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "../server/db";

async function main() {
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("Migrations completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
