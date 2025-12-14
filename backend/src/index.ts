import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { appConfig } from "./config/app.config";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { routes } from "./routes";
import { testConnection, closeDb } from "./db/connection";
import { swaggerDocumentation } from "./docs/swagger.config";

async function startServer() {
  console.log("Testing database connection...");
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error("Failed to connect to database. Please check your configuration.");
    process.exit(1);
  }
  
  console.log("Database connection successful");

  const app = new Elysia()
    .use(
      swagger({
        documentation: swaggerDocumentation as any,
      })
    )
    .use(loggerMiddleware)
    .use(errorMiddleware)
    
    .get(
      "/",
      () => ({
        success: true,
        message: "Welcome to the Windows Explorer API",
        version: "1.0.0",
        endpoints: {
          health: `${appConfig.apiPrefix}/health`,
          folders: `${appConfig.apiPrefix}/folders`,
        },
      }),
      {
        detail: {
          tags: ["Health"],
          summary: "API Information",
          description: "Get API information and available endpoints",
          responses: {
            200: {
              description: "API information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Welcome to the Windows Explorer API" },
                      version: { type: "string", example: "1.0.0" },
                      endpoints: {
                        type: "object",
                        properties: {
                          health: { type: "string", example: "/api/v1/health" },
                          folders: { type: "string", example: "/api/v1/folders" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }
    )
    
    .use(routes)
    
    .listen({
      port: appConfig.port,
      hostname: appConfig.host,
    });

  console.log(
    `API server is running at http://${app.server?.hostname}:${app.server?.port}`
  );
  console.log(`API endpoints available at http://${app.server?.hostname}:${app.server?.port}${appConfig.apiPrefix}`);

  process.on("SIGINT", async () => {
    console.log("\n Shutting down gracefully...");
    await closeDb();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n Shutting down gracefully...");
    await closeDb();
    process.exit(0);
  });

  return app;
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default startServer();
