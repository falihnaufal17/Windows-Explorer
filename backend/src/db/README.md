# Database Setup

This directory contains database connection, migration, and related utilities.

## Structure

```
db/
├── connection.ts          # Database connection singleton
├── migrate.ts             # Migration runner
├── create-migration.ts    # Migration file generator
└── migrations/            # SQL migration files
    ├── 001_create_migrations_table.sql
    └── 002_create_examples_table.sql
```

## Configuration

Database configuration is managed through environment variables. See `.env.example` for available options.

You can use either:
- **DATABASE_URL**: Full PostgreSQL connection string
- **Individual parameters**: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

## Running Migrations

### Apply all pending migrations:
```bash
bun run db:migrate
```

### Create a new migration:
```bash
bun run db:migrate:create <migration-name>
```

Example:
```bash
bun run db:migrate:create add_users_table
```

This will create a file like `003_add_users_table.sql` in the `migrations/` directory.

## Migration Files

Migration files are numbered sequentially (001_, 002_, etc.) and executed in order. Each migration:

1. Is executed in a transaction (all or nothing)
2. Is recorded in the `migrations` table after successful execution
3. Will be skipped if already applied

## Writing Migrations

Migration files are plain SQL. Example:

```sql
-- Migration: add_users_table
-- Created: 2024-01-01T00:00:00.000Z

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**Important:**
- Use `IF NOT EXISTS` for idempotency
- Always test migrations on a development database first
- Never modify already-applied migrations (create a new one instead)

## Connection Pooling

The database connection uses connection pooling for better performance:
- Maximum connections: 10 (configurable via `DB_MAX_CONNECTIONS`)
- Idle timeout: 30 seconds (configurable via `DB_IDLE_TIMEOUT`)
- Connection timeout: 2 seconds (configurable via `DB_CONNECTION_TIMEOUT`)

## Usage in Services

```typescript
import { getDb } from "../db/connection";

const db = getDb();

// Query example
const results = await db`
  SELECT * FROM examples WHERE status = ${"active"}
`;

// Insert example
const [newRecord] = await db`
  INSERT INTO examples (name, status)
  VALUES (${"Test"}, ${"active"})
  RETURNING *
`;
```
