import { Elysia } from "elysia";
import { fileService } from "../services/file.service";
import { storageService } from "../services/storage.service";
import { ResponseView } from "../views/response.view";
import { CreateFileDto, UpdateFileDto, MoveFileDto } from "../models/file.model";

export const fileController = new Elysia({ prefix: "/files" })
  .get(
    "/",
    async () => {
      const files = await fileService.findAll();
      return ResponseView.success(files, "Files retrieved successfully");
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Get all files",
        description: "Retrieve a list of all files in the system",
        responses: {
          200: {
            description: "List of files retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Files retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/File" },
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
    "/:id",
    async ({ params, set }) => {
      const file = await fileService.findById(params.id);
      
      if (!file) {
        set.status = 404;
        return ResponseView.error("File not found");
      }

      return ResponseView.success(file, "File retrieved successfully");
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Get file by ID",
        description: "Retrieve a specific file by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "File retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File retrieved successfully" },
                    data: { $ref: "#/components/schemas/File" },
                  },
                },
              },
            },
          },
          404: {
            description: "File not found",
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
    "/folder/:folderId",
    async ({ params, set }) => {
      const folderId = params.folderId === "root" ? null : Number(params.folderId);
      
      if (params.folderId !== "root" && isNaN(folderId as number)) {
        set.status = 400;
        return ResponseView.error("Invalid folder ID");
      }

      const files = await fileService.findByFolderId(folderId);
      return ResponseView.success(files, "Files retrieved successfully");
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Get files in a folder",
        description: "Retrieve all files in a specific folder. Use 'root' as folderId to get root-level files",
        parameters: [
          {
            name: "folderId",
            in: "path",
            description: "Folder ID or 'root' for root-level files",
            required: true,
            schema: { type: "string", example: "1" },
          },
        ],
        responses: {
          200: {
            description: "Files retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Files retrieved successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/FileWithFolder" },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid folder ID",
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
        const data = body as CreateFileDto;
        
        if (!data.name || data.name.trim() === "") {
          set.status = 400;
          return ResponseView.error("File name is required");
        }

        if (data.name.includes("/") || data.name.includes("\\")) {
          set.status = 400;
          return ResponseView.error("File name cannot contain path separators");
        }

        const file = await fileService.create(data);
        set.status = 201;
        return ResponseView.success(file, "File created successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to create file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Create a new file",
        description: "Create a new file with an optional folder. File name cannot contain path separators (/, \\)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateFileDto" },
              example: {
                name: "document.pdf",
                folderId: 1,
                mimeType: "application/pdf",
                size: 1024,
              },
            },
          },
        },
        responses: {
          201: {
            description: "File created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File created successfully" },
                    data: { $ref: "#/components/schemas/FileWithFolder" },
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

  .post(
    "/upload",
    async ({ body, set }) => {
      try {
        const formData = body as Record<string, unknown>;
        
        let uploadedFile: File | null = null;
        let folderId: number | null = null;

        for (const [key, value] of Object.entries(formData)) {
          if (value instanceof File) {
            uploadedFile = value;
          } else if (key === "folderId" || key === "folder_id") {
            const parsed = typeof value === "string" ? Number(value) : value;
            folderId = parsed && !isNaN(parsed as number) ? (parsed as number) : null;
          }
        }

        if (!uploadedFile) {
          set.status = 400;
          return ResponseView.error("File is required. Please include a file in the multipart form data.");
        }

        if (uploadedFile.name.includes("/") || uploadedFile.name.includes("\\")) {
          set.status = 400;
          return ResponseView.error("File name cannot contain path separators");
        }

        const file = await fileService.createWithUpload(uploadedFile, folderId);
        set.status = 201;
        return ResponseView.success(file, "File uploaded successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to upload file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Upload a file",
        description: "Upload a file to the server. The file will be stored on disk and a record will be created in the database.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "The file to upload",
                  },
                  folderId: {
                    type: "string",
                    description: "Optional folder ID to place the file in",
                    example: "1",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File uploaded successfully" },
                    data: { $ref: "#/components/schemas/FileWithFolder" },
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

  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const data = body as UpdateFileDto;
        
        if (data.name !== undefined) {
          if (!data.name || data.name.trim() === "") {
            set.status = 400;
            return ResponseView.error("File name cannot be empty");
          }

          if (data.name.includes("/") || data.name.includes("\\")) {
            set.status = 400;
            return ResponseView.error("File name cannot contain path separators");
          }
        }

        const file = await fileService.update(params.id, data);

        if (!file) {
          set.status = 404;
          return ResponseView.error("File not found");
        }

        return ResponseView.success(file, "File updated successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to update file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Update a file",
        description: "Update file properties such as name, folder, mime type, or size",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateFileDto" },
              example: {
                name: "updated-document.pdf",
                mimeType: "application/pdf",
                size: 2048,
              },
            },
          },
        },
        responses: {
          200: {
            description: "File updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File updated successfully" },
                    data: { $ref: "#/components/schemas/FileWithFolder" },
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
            description: "File not found",
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
        const data = body as MoveFileDto;
        const file = await fileService.update(params.id, { folderId: data.folderId });

        if (!file) {
          set.status = 404;
          return ResponseView.error("File not found");
        }

        return ResponseView.success(file, "File moved successfully");
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
        return ResponseView.error(
          "Failed to move file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Move a file",
        description: "Move a file to a different folder. Set folderId to null to move it to root",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID to move",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MoveFileDto" },
              example: {
                folderId: 2,
              },
            },
          },
        },
        responses: {
          200: {
            description: "File moved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File moved successfully" },
                    data: { $ref: "#/components/schemas/FileWithFolder" },
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
            description: "File or folder not found",
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
    "/:id/preview",
    async ({ params, set }) => {
      try {
        const file = await fileService.findById(params.id);

        if (!file) {
          set.status = 404;
          return ResponseView.error("File not found");
        }

        const fileBuffer = await storageService.readFile(file.id as number);
        
        set.headers["Content-Type"] = file.mimeType || "application/octet-stream";
        set.headers["Content-Disposition"] = `inline; filename="${file.name}"`;
        set.headers["Content-Length"] = file.size.toString();
        
        set.headers["Cache-Control"] = "public, max-age=3600";
        set.headers["ETag"] = `"${file.id}-${file.updatedAt?.getTime() || Date.now()}"`;

        return fileBuffer;
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
        return ResponseView.error(
          "Failed to preview file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Preview a file",
        description: "Preview a file by its ID. Returns the file content with inline disposition, allowing it to be displayed in the browser (for images, PDFs, etc.) instead of being downloaded.",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID to preview",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "File previewed successfully",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
              "image/*": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
              "text/*": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          404: {
            description: "File not found",
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

  .get(
    "/:id/download",
    async ({ params, set }) => {
      try {
        const file = await fileService.findById(params.id);

        if (!file) {
          set.status = 404;
          return ResponseView.error("File not found");
        }

        const fileBuffer = await storageService.readFile(file.id as number);
        
        set.headers["Content-Type"] = file.mimeType || "application/octet-stream";
        set.headers["Content-Disposition"] = `attachment; filename="${file.name}"`;
        set.headers["Content-Length"] = file.size.toString();

        return fileBuffer;
      } catch (error) {
        set.status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
        return ResponseView.error(
          "Failed to download file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Download a file",
        description: "Download a file by its ID. Returns the file content with appropriate headers.",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID to download",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "File downloaded successfully",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          404: {
            description: "File not found",
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
        const deleted = await fileService.delete(params.id);

        if (!deleted) {
          set.status = 404;
          return ResponseView.error("File not found");
        }

        return ResponseView.success(null, "File deleted successfully");
      } catch (error) {
        set.status = 500;
        return ResponseView.error(
          "Failed to delete file",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    {
      detail: {
        tags: ["Files"],
        summary: "Delete a file",
        description: "Delete a file by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "File ID to delete",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: {
          200: {
            description: "File deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "File deleted successfully" },
                    data: { nullable: true },
                  },
                },
              },
            },
          },
          404: {
            description: "File not found",
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

