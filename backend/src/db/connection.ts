import postgres from "postgres";
import { getDatabaseUrl, dbConfig } from "../config/db.config";

let sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql {
  if (!sql) {
    const connectionString = getDatabaseUrl();
    
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is required. Please check your .env file."
      );
    }
    
    sql = postgres(connectionString, {
      max: dbConfig.max,
      idle_timeout: dbConfig.idleTimeoutMillis / 1000,
      connect_timeout: dbConfig.connectionTimeoutMillis / 1000,
      onnotice: () => {},
      transform: {
        undefined: null,
      },
    });

    sql.listen("error", (err) => {
      console.error("Database connection error:", err);
    });
  }

  return sql;
}

export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
