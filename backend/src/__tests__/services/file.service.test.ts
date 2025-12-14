import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { fileService } from "../../services/file.service";
import * as dbConnection from "../../db/connection";
import { storageService } from "../../services/storage.service";
import type { File, FileWithFolder, CreateFileDto, UpdateFileDto } from "../../models/file.model";

describe("FileService", () => {
  let mockDb: any;
  let mockQueryHandler: any;

  beforeEach(() => {
    mockQueryHandler = mock(() => Promise.resolve([]));
    
    const mockDbFunction = (() => {
      const fn = mockQueryHandler as any;
      fn.unsafe = mock(() => Promise.resolve([]));
      return fn;
    })();
    
    mockDb = mockDbFunction;

    spyOn(dbConnection, "getDb").mockReturnValue(mockDb as any);
    
    // Mock storage service methods
    spyOn(storageService, "generatePreviewUrl").mockReturnValue("http://localhost:3000/api/v1/files/1/preview");
    spyOn(storageService, "generateStorageUrl").mockReturnValue("http://localhost:3000/api/v1/files/1/download");
    spyOn(storageService, "saveFile").mockResolvedValue("http://localhost:3000/api/v1/files/1/download");
    spyOn(storageService, "deleteFile").mockResolvedValue();
  });

  describe("findAll", () => {
    it("should return all files ordered by path", async () => {
      const mockFiles: File[] = [
        {
          id: 1,
          name: "file1.pdf",
          path: "/file1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          storagePath: "http://localhost:3000/api/v1/files/1/download",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: 2,
          name: "file2.jpg",
          path: "/file2.jpg",
          mimeType: "image/jpeg",
          size: 2048,
          storagePath: "http://localhost:3000/api/v1/files/2/download",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockFiles));

      const result = await fileService.findAll();

      expect(result).toEqual(mockFiles);
      expect(result.length).toBe(2);
    });

    it("should return empty array when no files exist", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await fileService.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe("findById", () => {
    it("should return file when found", async () => {
      const mockFile: File = {
        id: 1,
        name: "test.pdf",
        path: "/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([mockFile]));

      const result = await fileService.findById(1);

      expect(result).toEqual(mockFile);
    });

    it("should return null when file not found", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await fileService.findById(999);

      expect(result).toBeNull();
    });

    it("should handle string id", async () => {
      const mockFile: File = {
        id: 1,
        name: "test.pdf",
        path: "/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([mockFile]));

      const result = await fileService.findById("1");

      expect(result).toEqual(mockFile);
    });
  });

  describe("findByFolderId", () => {
    it("should return files in a folder", async () => {
      const mockFiles: FileWithFolder[] = [
        {
          id: 1,
          name: "file1.pdf",
          path: "/Folder/file1.pdf",
          mimeType: "application/pdf",
          size: 1024,
          storagePath: "http://localhost:3000/api/v1/files/1/download",
          folderId: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: 2,
          name: "file2.jpg",
          path: "/Folder/file2.jpg",
          mimeType: "image/jpeg",
          size: 2048,
          storagePath: "http://localhost:3000/api/v1/files/2/download",
          folderId: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockFiles));

      const result = await fileService.findByFolderId(1);

      expect(result).toEqual(mockFiles);
      expect(result.length).toBe(2);
    });

    it("should return root level files when folderId is null", async () => {
      const mockRootFiles: FileWithFolder[] = [
        {
          id: 1,
          name: "root-file.pdf",
          path: "/root-file.pdf",
          mimeType: "application/pdf",
          size: 1024,
          storagePath: "http://localhost:3000/api/v1/files/1/download",
          folderId: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockRootFiles));

      const result = await fileService.findByFolderId(null);

      expect(result).toEqual(mockRootFiles);
      expect(result[0].folderId).toBeNull();
    });

    it("should return empty array when folder has no files", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await fileService.findByFolderId(1);

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a root file successfully", async () => {
      const createDto: CreateFileDto = {
        name: "new-file.pdf",
        mimeType: "application/pdf",
        size: 1024,
      };

      const mockCreatedFile: File = {
        id: 1,
        name: "new-file.pdf",
        path: "/new-file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFile]));

      const result = await fileService.create(createDto);

      expect(result.name).toBe("new-file.pdf");
      expect(result.folderId).toBeNull();
      expect(result.path).toBe("/new-file.pdf");
      expect(result.previewUrl).toBeDefined();
      expect(result.downloadUrl).toBeDefined();
    });

    it("should create a file in a folder successfully", async () => {
      const createDto: CreateFileDto = {
        name: "sub-file.pdf",
        folderId: 1,
        mimeType: "application/pdf",
        size: 1024,
      };

      const mockParentFolder = { path: "/Parent" };
      const mockCreatedFile: File = {
        id: 1,
        name: "sub-file.pdf",
        path: "/Parent/sub-file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]))
        .mockReturnValueOnce(Promise.resolve([mockParentFolder]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFile]));

      const result = await fileService.create(createDto);

      expect(result.name).toBe("sub-file.pdf");
      expect(result.folderId).toBe(1);
      expect(result.path).toBe("/Parent/sub-file.pdf");
    });

    it("should throw error when parent folder not found", async () => {
      const createDto: CreateFileDto = {
        name: "file.pdf",
        folderId: 999,
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      await expect(fileService.create(createDto)).rejects.toThrow(
        "Folder not found"
      );
    });

    it("should throw error when file name already exists in same folder", async () => {
      const createDto: CreateFileDto = {
        name: "existing.pdf",
        folderId: 1,
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]))
        .mockReturnValueOnce(Promise.resolve([{ path: "/Folder" }]))
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      await expect(fileService.create(createDto)).rejects.toThrow(
        "A file with this name already exists in the same folder"
      );
    });

    it("should throw error when file name already exists in root", async () => {
      const createDto: CreateFileDto = {
        name: "existing.pdf",
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      await expect(fileService.create(createDto)).rejects.toThrow(
        "A file with this name already exists in the root"
      );
    });
  });

  describe("createWithUpload", () => {
    it("should create file with upload successfully", async () => {
      const mockFile = new File(["content"], "uploaded.pdf", {
        type: "application/pdf",
      });
      const folderId = 1;

      const mockParentFolder = { path: "/Folder" };
      const mockCreatedFile: File = {
        id: 1,
        name: "uploaded.pdf",
        path: "/Folder/uploaded.pdf",
        mimeType: "application/pdf",
        size: 7,
        storagePath: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockUpdatedFile: File = {
        ...mockCreatedFile,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]))
        .mockReturnValueOnce(Promise.resolve([mockParentFolder]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFile]))
        .mockReturnValueOnce(Promise.resolve([mockUpdatedFile]));

      const result = await fileService.createWithUpload(mockFile, folderId);

      expect(result.name).toBe("uploaded.pdf");
      expect(result.folderId).toBe(1);
      expect(result.storagePath).toBe("http://localhost:3000/api/v1/files/1/download");
      expect(storageService.saveFile).toHaveBeenCalled();
    });

    it("should create root file with upload successfully", async () => {
      const mockFile = new File(["content"], "root-upload.pdf", {
        type: "application/pdf",
      });

      const mockCreatedFile: File = {
        id: 1,
        name: "root-upload.pdf",
        path: "/root-upload.pdf",
        mimeType: "application/pdf",
        size: 7,
        storagePath: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockUpdatedFile: File = {
        ...mockCreatedFile,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFile]))
        .mockReturnValueOnce(Promise.resolve([mockUpdatedFile]));

      const result = await fileService.createWithUpload(mockFile, null);

      expect(result.name).toBe("root-upload.pdf");
      expect(result.folderId).toBeNull();
      expect(storageService.saveFile).toHaveBeenCalled();
    });

    it("should throw error when parent folder not found", async () => {
      const mockFile = new File(["content"], "file.pdf", {
        type: "application/pdf",
      });

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      await expect(fileService.createWithUpload(mockFile, 999)).rejects.toThrow(
        "Folder not found"
      );
    });

    it("should delete file record if storage save fails", async () => {
      const mockFile = new File(["content"], "file.pdf", {
        type: "application/pdf",
      });

      const mockCreatedFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 7,
        storagePath: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFile]));

      spyOn(storageService, "saveFile").mockRejectedValueOnce(
        new Error("Storage error")
      );

      await expect(fileService.createWithUpload(mockFile, null)).rejects.toThrow(
        "Storage error"
      );

      expect(mockQueryHandler).toHaveBeenCalled();
    });

    it("should throw error when file name already exists", async () => {
      const mockFile = new File(["content"], "existing.pdf", {
        type: "application/pdf",
      });

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]))
        .mockReturnValueOnce(Promise.resolve([{ path: "/Folder" }]))
        .mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      await expect(fileService.createWithUpload(mockFile, 1)).rejects.toThrow(
        "A file with this name already exists in the same folder"
      );
    });
  });

  describe("update", () => {
    it("should update file name successfully", async () => {
      const existingFile: File = {
        id: 1,
        name: "old-name.pdf",
        path: "/old-name.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFileDto = {
        name: "new-name.pdf",
      };

      const updatedFile: File = {
        ...existingFile,
        name: "new-name.pdf",
        path: "/new-name.pdf",
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ folder_id: null }]))
        .mockReturnValueOnce(Promise.resolve([{ path: "/" }]))
        .mockReturnValueOnce(Promise.resolve([updatedFile]));

      const result = await fileService.update(1, updateDto);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("new-name.pdf");
      expect(result?.path).toBe("/new-name.pdf");
      expect(result?.previewUrl).toBeDefined();
      expect(result?.downloadUrl).toBeDefined();
    });

    it("should update file mime type and size", async () => {
      const existingFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFileDto = {
        mimeType: "application/zip",
        size: 2048,
      };

      const updatedFile: File = {
        ...existingFile,
        mimeType: "application/zip",
        size: 2048,
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ folder_id: null }]))
        .mockReturnValueOnce(Promise.resolve([updatedFile]));

      const result = await fileService.update(1, updateDto);

      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe("application/zip");
      expect(result?.size).toBe(2048);
    });

    it("should move file to different folder", async () => {
      const existingFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/Folder1/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFileDto = {
        folderId: 2,
      };

      const updatedFile: File = {
        ...existingFile,
        path: "/Folder2/file.pdf",
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ folder_id: 1 }]))
        .mockReturnValueOnce(Promise.resolve([{ id: 2 }]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ path: "/Folder2" }]))
        .mockReturnValueOnce(Promise.resolve([updatedFile]));

      const result = await fileService.update(1, updateDto);

      expect(result).not.toBeNull();
      expect(result?.folderId).toBe(2);
      expect(result?.path).toBe("/Folder2/file.pdf");
    });

    it("should return null when file not found", async () => {
      spyOn(fileService, "findById").mockResolvedValue(null);

      const result = await fileService.update(999, { name: "new-name.pdf" });

      expect(result).toBeNull();
    });

    it("should throw error when target folder not found", async () => {
      const existingFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFileDto = {
        folderId: 999,
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ folder_id: null }]))
        .mockReturnValueOnce(Promise.resolve([]));

      await expect(fileService.update(1, updateDto)).rejects.toThrow(
        "Folder not found"
      );
    });

    it("should throw error when duplicate name exists in target folder", async () => {
      const existingFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFileDto = {
        folderId: 2,
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ folder_id: null }]))
        .mockReturnValueOnce(Promise.resolve([{ id: 2 }]))
        .mockReturnValueOnce(Promise.resolve([{ id: 3 }]));

      await expect(fileService.update(1, updateDto)).rejects.toThrow(
        "A file with this name already exists in the target folder"
      );
    });

    it("should return existing file when no updates provided", async () => {
      const existingFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      spyOn(fileService, "findById").mockResolvedValue(existingFile);

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ folder_id: null }]));

      const result = await fileService.update(1, {});

      expect(result).not.toBeNull();
      expect(result?.name).toBe("file.pdf");
      expect(result?.previewUrl).toBeDefined();
      expect(result?.downloadUrl).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete file successfully", async () => {
      const mockFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      spyOn(fileService, "findById").mockResolvedValue(mockFile);
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      const result = await fileService.delete(1);

      expect(result).toBe(true);
      expect(storageService.deleteFile).toHaveBeenCalledWith(1);
    });

    it("should return false when file not found", async () => {
      spyOn(fileService, "findById").mockResolvedValue(null);
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await fileService.delete(999);

      expect(result).toBe(false);
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });

    it("should handle string id", async () => {
      const mockFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      spyOn(fileService, "findById").mockResolvedValue(mockFile);
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      const result = await fileService.delete("1");

      expect(result).toBe(true);
    });

    it("should continue deletion even if file deletion from disk fails", async () => {
      const mockFile: File = {
        id: 1,
        name: "file.pdf",
        path: "/file.pdf",
        mimeType: "application/pdf",
        size: 1024,
        storagePath: "http://localhost:3000/api/v1/files/1/download",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      spyOn(fileService, "findById").mockResolvedValue(mockFile);
      spyOn(storageService, "deleteFile").mockRejectedValueOnce(
        new Error("Disk deletion failed")
      );
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      const result = await fileService.delete(1);

      expect(result).toBe(true);
    });
  });
});

