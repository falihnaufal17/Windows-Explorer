export const swaggerDocumentation = {
  info: {
    title: "Windows Explorer API",
    version: "1.0.0",
    description: "API documentation for Windows Explorer backend service",
  },
  tags: [
    { name: "Folders", description: "Folder management endpoints" },
    { name: "Files", description: "File management endpoints" },
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
      File: {
        type: "object",
        properties: {
          id: {
            oneOf: [{ type: "string" }, { type: "integer" }],
            description: "File ID",
            example: 1,
          },
          name: {
            type: "string",
            description: "File name",
            example: "document.pdf",
          },
          path: {
            type: "string",
            description: "Full path of the file",
            example: "/Documents/document.pdf",
          },
          mimeType: {
            oneOf: [{ type: "string" }, { type: "null" }],
            description: "MIME type of the file",
            example: "application/pdf",
          },
          size: {
            type: "integer",
            description: "File size in bytes",
            example: 1024,
          },
          storagePath: {
            oneOf: [{ type: "string" }, { type: "null" }],
            description: "URL to access the file (download or preview)",
            example: "http://localhost:3000/api/v1/files/1/download",
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
        required: ["id", "name", "path", "mimeType", "size"],
      },
      FileWithFolder: {
        type: "object",
        allOf: [
          { $ref: "#/components/schemas/File" },
          {
            type: "object",
            properties: {
              folderId: {
                oneOf: [{ type: "integer" }, { type: "null" }],
                description: "Folder ID containing this file",
                example: 1,
              },
              previewUrl: {
                oneOf: [{ type: "string" }, { type: "null" }],
                description: "URL to preview the file (inline display)",
                example: "http://localhost:3000/api/v1/files/1/preview",
              },
              downloadUrl: {
                oneOf: [{ type: "string" }, { type: "null" }],
                description: "URL to download the file",
                example: "http://localhost:3000/api/v1/files/1/download",
              },
            },
          },
        ],
      },
      CreateFileDto: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "File name (required, cannot contain / or \\)",
            example: "document.pdf",
          },
          folderId: {
            oneOf: [{ type: "integer" }, { type: "null" }],
            description: "Folder ID to place the file in (optional, null for root)",
            example: 1,
          },
          mimeType: {
            oneOf: [{ type: "string" }, { type: "null" }],
            description: "MIME type of the file",
            example: "application/pdf",
          },
          size: {
            type: "integer",
            description: "File size in bytes",
            example: 1024,
          },
        },
        required: ["name"],
      },
      UpdateFileDto: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "File name (cannot contain / or \\)",
            example: "updated-document.pdf",
          },
          folderId: {
            oneOf: [{ type: "integer" }, { type: "null" }],
            description: "Folder ID",
            example: 2,
          },
          mimeType: {
            oneOf: [{ type: "string" }, { type: "null" }],
            description: "MIME type",
            example: "application/pdf",
          },
          size: {
            type: "integer",
            description: "File size in bytes",
            example: 2048,
          },
        },
      },
      MoveFileDto: {
        type: "object",
        properties: {
          folderId: {
            oneOf: [{ type: "integer" }, { type: "null" }],
            description: "New folder ID (null to move to root)",
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
};

