import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

async function createMigration() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error("Please provide a migration name");
    console.log("Usage: bun run db:migrate:create <migration-name>");
    process.exit(1);
  }

  const sanitizedName = migrationName.replace(/[^a-zA-Z0-9_]/g, "_");

  const migrationsDir = join(import.meta.dir, "migrations");
  
  if (!existsSync(migrationsDir)) {
    await mkdir(migrationsDir, { recursive: true });
  }

  const files = await import("fs/promises").then((fs) => 
    fs.readdir(migrationsDir)
  );
  const migrationFiles = files.filter((f) => f.endsWith(".sql"));
  const nextNumber = String(migrationFiles.length + 1).padStart(3, "0");

  const fileName = `${nextNumber}_${sanitizedName}.sql`;
  const filePath = join(migrationsDir, fileName);

  const template = `-- Migration: ${sanitizedName}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS your_table (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
`;

  await writeFile(filePath, template, "utf-8");

  console.log(`Created migration: ${fileName}`);
  console.log(`Edit the file at: ${filePath}`);
}

if (import.meta.main) {
  createMigration().catch((error) => {
    console.error("Error creating migration:", error);
    process.exit(1);
  });
}

