import { getDb, closeDb } from "./connection";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

async function runMigrations() {
  const db = getDb();
  
  try {
    console.log("Starting database migrations...");

    await db`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const migrationsDir = join(import.meta.dir, "migrations");
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration file(s)`);

    const appliedMigrations = await db<Array<{ name: string }>>`
      SELECT name FROM migrations ORDER BY name
    `;
    const appliedNames = new Set(appliedMigrations.map((m) => m.name));

    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (appliedNames.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`Applying migration: ${file}`);

      const migrationPath = join(migrationsDir, file);
      const sql = await readFile(migrationPath, "utf-8");

      await db.begin(async (tx) => {
        await tx.unsafe(sql);

        await tx`INSERT INTO migrations (name) VALUES (${file})`;
      });

      appliedCount++;
      console.log(`Applied migration: ${file}`);
    }

    if (appliedCount === 0) {
      console.log("Database is up to date. No migrations to apply.");
    } else {
      console.log(`Successfully applied ${appliedCount} migration(s)`);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

if (import.meta.main) {
  runMigrations()
    .then(() => {
      console.log("Migrations completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}

