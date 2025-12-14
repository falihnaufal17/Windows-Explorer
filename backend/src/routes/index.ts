import { Elysia } from "elysia";
import { folderController } from "../controllers/folder.controller";
import { fileController } from "../controllers/file.controller";
import { appConfig } from "../config/app.config";

export const routes = new Elysia({ prefix: appConfig.apiPrefix })
  .use(folderController)
  .use(fileController)
  .get(
    "/health",
    () => ({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the server is running and healthy",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Server is healthy" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    }
  );

