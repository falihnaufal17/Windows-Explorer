import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { appConfig } from "./config/app.config";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { routes } from "./routes";
import { testConnection, closeDb } from "./db/connection";

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
        documentation: {
          info: {
            title: "Windows Explorer API",
            version: "1.0.0",
            description: "API documentation for Windows Explorer backend service",
          },
          tags: [
            { name: "Folders", description: "Folder management endpoints" },
            { name: "Health", description: "Health check endpoints" },
          ],
          components: {
            schemas: {
              Folder: {
                type: "object",
                properties: {
                  id: {
                    oneOf: [{ type: "string" }, { type: "integer" }],
                    description: "Folder ID",
                    example: 1,
                  },
                  name: {
                    type: "string",
                    description: "Folder name",
                    example: "Documents",
                  },
                  parentId: {
                    oneOf: [{ type: "integer" }, { type: "null" }],
                    description: "Parent folder ID (null for root folders)",
                    example: null,
                  },
                  path: {
                    type: "string",
                    description: "Full path of the folder",
                    example: "/Documents",
                  },
                  isExpanded: {
                    type: "boolean",
                    description: "Whether the folder is expanded in the UI",
                    example: false,
                  },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    description: "Creation timestamp",
                  },
                  updatedAt: {
                    type: "string",
                    format: "date-time",
                    description: "Last update timestamp",
                  },
                },
                required: ["id", "name", "parentId", "path", "isExpanded"],
              },
              FolderWithChildren: {
                type: "object",
                allOf: [
                  { $ref: "#/components/schemas/Folder" },
                  {
                    type: "object",
                    properties: {
                      children: {
                        type: "array",
                        items: { $ref: "#/components/schemas/FolderWithChildren" },
                        description: "Child folders",
                      },
                      subfolderCount: {
                        type: "integer",
                        description: "Number of subfolders",
                        example: 5,
                      },
                    },
                  },
                ],
              },
              CreateFolderDto: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Folder name (required, cannot contain / or \\)",
                    example: "New Folder",
                  },
                  parentId: {
                    oneOf: [{ type: "integer" }, { type: "null" }],
                    description: "Parent folder ID (optional, null for root folder)",
                    example: 1,
                  },
                },
                required: ["name"],
              },
              UpdateFolderDto: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Folder name (cannot contain / or \\)",
                    example: "Updated Folder Name",
                  },
                  parentId: {
                    oneOf: [{ type: "integer" }, { type: "null" }],
                    description: "Parent folder ID",
                    example: 2,
                  },
                  isExpanded: {
                    type: "boolean",
                    description: "Expansion state",
                    example: true,
                  },
                },
              },
              MoveFolderDto: {
                type: "object",
                properties: {
                  parentId: {
                    oneOf: [{ type: "integer" }, { type: "null" }],
                    description: "New parent folder ID (null to make it a root folder)",
                    example: 2,
                  },
                },
              },
              ErrorResponse: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "Error message",
                  },
                  error: {
                    type: "string",
                    example: "Detailed error description",
                  },
                },
                required: ["success", "message"],
              },
            },
          },
        },
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
