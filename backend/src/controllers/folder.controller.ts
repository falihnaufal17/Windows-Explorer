import { Elysia } from "elysia";
import { folderService } from "../services/folder.service";
import { ResponseView } from "../views/response.view";
import { CreateFolderDto, UpdateFolderDto, MoveFolderDto } from "../models/folder.model";

export const folderController = new Elysia({ prefix: "/folders" })
  .get(
    "/",
    async () => {
      const folders = await folderService.findAll();
      return ResponseView.success(folders, "Folders retrieved successfully");
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Get all folders",
        description: "Retrieve a list of all folders in the system",
        responses: {
          200: {
            description: "List of folders retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folders retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Folder" },
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

  .get(
    "/tree",
    async ({ query }) => {
      const parentId = query.parentId ? Number(query.parentId) : null;
      const tree = await folderService.findTree(parentId);
      return ResponseView.success(tree, "Folder tree retrieved successfully");
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Get folder tree",
        description: "Retrieve a hierarchical tree structure of folders, optionally starting from a specific parent folder",
        parameters: [
          {
            name: "parentId",
            in: "query",
            description: "Optional parent folder ID to start the tree from",
            required: false,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Folder tree retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder tree retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/FolderWithChildren" },
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

  .get(
    "/roots",
    async () => {
      const roots = await folderService.findRoots();
      return ResponseView.success(roots, "Root folders retrieved successfully");
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Get root folders",
        description: "Retrieve all root-level folders (folders without a parent)",
        responses: {
          200: {
            description: "Root folders retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Root folders retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Folder" },
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

  .get(
    "/:id/children",
    async ({ params, set }) => {
      const folder = await folderService.findById(params.id);
      
      if (!folder) {
        set.status = 404;
        return ResponseView.error("Folder not found");
      }

      const children = await folderService.findChildren(folder.id as number);
      return ResponseView.success(children, "Folder children retrieved successfully");
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Get folder children",
        description: "Retrieve all direct child folders of a specific folder",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Folder children retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder children retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Folder" },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .get(
    "/:id",
    async ({ params, set }) => {
      const folder = await folderService.findById(params.id);
      
      if (!folder) {
        set.status = 404;
        return ResponseView.error("Folder not found");
      }

      return ResponseView.success(folder, "Folder retrieved successfully");
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Get folder by ID",
        description: "Retrieve a specific folder by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Folder retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder retrieved successfully" },
                    data: { $ref: "#/components/schemas/Folder" },
                  },
                },
              },
            },
          },
          404: {
            description: "Folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = body as CreateFolderDto;
        
        if (!data.name || data.name.trim() === "") {
          set.status = 400;
          return ResponseView.error("Folder name is required");
        }

        if (data.name.includes("/") || data.name.includes("\\")) {
          set.status = 400;
          return ResponseView.error("Folder name cannot contain path separators");
        }

        const folder = await folderService.create(data);
        set.status = 201;
        return ResponseView.success(folder, "Folder created successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to create folder",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Create a new folder",
        description: "Create a new folder with an optional parent folder. Folder name cannot contain path separators (/, \\)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateFolderDto" },
              example: {
                name: "New Folder",
                parentId: 1,
              },
            },
          },
        },
        responses: {
          201: {
            description: "Folder created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder created successfully" },
                    data: { $ref: "#/components/schemas/Folder" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request - validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Parent folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const data = body as UpdateFolderDto;
        
        if (data.name !== undefined) {
          if (!data.name || data.name.trim() === "") {
            set.status = 400;
            return ResponseView.error("Folder name cannot be empty");
          }

          if (data.name.includes("/") || data.name.includes("\\")) {
            set.status = 400;
            return ResponseView.error("Folder name cannot contain path separators");
          }
        }

        const folder = await folderService.update(params.id, data);

        if (!folder) {
          set.status = 404;
          return ResponseView.error("Folder not found");
        }

        return ResponseView.success(folder, "Folder updated successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to update folder",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Update a folder",
        description: "Update folder properties such as name, parent, or expansion state",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateFolderDto" },
              example: {
                name: "Updated Folder Name",
                isExpanded: true,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Folder updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder updated successfully" },
                    data: { $ref: "#/components/schemas/Folder" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request - validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .patch(
    "/:id/move",
    async ({ params, body, set }) => {
      try {
        const data = body as MoveFolderDto;
        const folder = await folderService.update(params.id, { parentId: data.parentId });

        if (!folder) {
          set.status = 404;
          return ResponseView.error("Folder not found");
        }

        return ResponseView.success(folder, "Folder moved successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to move folder",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Move a folder",
        description: "Move a folder to a different parent folder. Set parentId to null to make it a root folder",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID to move",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MoveFolderDto" },
              example: {
                parentId: 2,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Folder moved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder moved successfully" },
                    data: { $ref: "#/components/schemas/Folder" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request - validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Folder or parent folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .patch(
    "/:id/toggle-expand",
    async ({ params, set }) => {
      try {
        const folder = await folderService.findById(params.id);

        if (!folder) {
          set.status = 404;
          return ResponseView.error("Folder not found");
        }

        const updated = await folderService.update(params.id, {
          isExpanded: !folder.isExpanded,
        });

        return ResponseView.success(updated, "Folder expansion toggled successfully");
      } catch (error) {
        set.status = 500;
        return ResponseView.error(
          "Failed to toggle folder expansion",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Toggle folder expansion",
        description: "Toggle the expansion state of a folder (expanded/collapsed)",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Folder expansion toggled successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder expansion toggled successfully" },
                    data: { $ref: "#/components/schemas/Folder" },
                  },
                },
              },
            },
          },
          404: {
            description: "Folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const deleted = await folderService.delete(params.id);

        if (!deleted) {
          set.status = 404;
          return ResponseView.error("Folder not found");
        }

        return ResponseView.success(null, "Folder deleted successfully");
      } catch (error) {
        set.status = 500;
        return ResponseView.error(
          "Failed to delete folder",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Folders"],
        summary: "Delete a folder",
        description: "Delete a folder by its ID. This will also delete all child folders recursively",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Folder ID to delete",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "Folder deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Folder deleted successfully" },
                    data: { nullable: true },
                  },
                },
              },
            },
          },
          404: {
            description: "Folder not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  );

