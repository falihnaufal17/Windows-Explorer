export const appConfig = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",
  env: process.env.NODE_ENV || "development",
  apiPrefix: "/api/v1",
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
} as const;
