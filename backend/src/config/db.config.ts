export const dbConfig = {
  max: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "2000", 10),
} as const;

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || "";
}
