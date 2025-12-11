import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test";
import { folderService } from "../../services/folder.service";
import * as dbConnection from "../../db/connection";
import type { Folder, CreateFolderDto, UpdateFolderDto } from "../../models/folder.model";

describe("FolderService", () => {
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
  });

  describe("findAll", () => {
    it("should return all folders ordered by path", async () => {
      const mockFolders: Folder[] = [
        {
          id: 1,
          name: "Folder A",
          parentId: null,
          path: "/Folder A",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: 2,
          name: "Folder B",
          parentId: null,
          path: "/Folder B",
          isExpanded: false,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockFolders));

      const result = await folderService.findAll();

      expect(result).toEqual(mockFolders);
      expect(result.length).toBe(2);
    });

    it("should return empty array when no folders exist", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await folderService.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe("findById", () => {
    it("should return folder when found", async () => {
      const mockFolder: Folder = {
        id: 1,
        name: "Test Folder",
        parentId: null,
        path: "/Test Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([mockFolder]));

      const result = await folderService.findById(1);

      expect(result).toEqual(mockFolder);
    });

    it("should return null when folder not found", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await folderService.findById(999);

      expect(result).toBeNull();
    });

    it("should handle string id", async () => {
      const mockFolder: Folder = {
        id: 1,
        name: "Test Folder",
        parentId: null,
        path: "/Test Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([mockFolder]));

      const result = await folderService.findById("1");

      expect(result).toEqual(mockFolder);
    });
  });

  describe("findChildren", () => {
    it("should return children of a folder", async () => {
      const mockChildren: Folder[] = [
        {
          id: 2,
          name: "Child 1",
          parentId: 1,
          path: "/Parent/Child 1",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: 3,
          name: "Child 2",
          parentId: 1,
          path: "/Parent/Child 2",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockChildren));

      const result = await folderService.findChildren(1);

      expect(result).toEqual(mockChildren);
      expect(result.length).toBe(2);
    });

    it("should return root folders when parentId is null", async () => {
      const mockRoots: Folder[] = [
        {
          id: 1,
          name: "Root 1",
          parentId: null,
          path: "/Root 1",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockRoots));

      const result = await folderService.findChildren(null);

      expect(result).toEqual(mockRoots);
    });

    it("should return empty array when folder has no children", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await folderService.findChildren(1);

      expect(result).toEqual([]);
    });
  });

  describe("findRoots", () => {
    it("should return root folders", async () => {
      const mockRoots: Folder[] = [
        {
          id: 1,
          name: "Root 1",
          parentId: null,
          path: "/Root 1",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler.mockReturnValueOnce(Promise.resolve(mockRoots));

      const result = await folderService.findRoots();

      expect(result).toEqual(mockRoots);
    });
  });

  describe("countSubfolders", () => {
    it("should return count of subfolders", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ count: 3 }]));

      const result = await folderService.countSubfolders(1);

      expect(result).toBe(3);
    });

    it("should return 0 when folder has no subfolders", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ count: 0 }]));

      const result = await folderService.countSubfolders(1);

      expect(result).toBe(0);
    });
  });

  describe("create", () => {
    it("should create a root folder successfully", async () => {
      const createDto: CreateFolderDto = {
        name: "New Folder",
      };

      const mockCreatedFolder: Folder = {
        id: 1,
        name: "New Folder",
        parentId: null,
        path: "/New Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFolder]));

      const result = await folderService.create(createDto);

      expect(result).toEqual(mockCreatedFolder);
      expect(result.name).toBe("New Folder");
      expect(result.parentId).toBeNull();
      expect(result.path).toBe("/New Folder");
    });

    it("should create a subfolder successfully", async () => {
      const createDto: CreateFolderDto = {
        name: "Subfolder",
        parentId: 1,
      };

      const mockParent: Folder = {
        id: 1,
        name: "Parent",
        parentId: null,
        path: "/Parent",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockCreatedFolder: Folder = {
        id: 2,
        name: "Subfolder",
        parentId: 1,
        path: "/Parent/Subfolder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ path: "/Parent" }]))
        .mockReturnValueOnce(Promise.resolve([mockCreatedFolder]));

      spyOn(folderService, "findById").mockResolvedValue(mockParent);

      const result = await folderService.create(createDto);

      expect(result).toEqual(mockCreatedFolder);
      expect(result.parentId).toBe(1);
      expect(result.path).toBe("/Parent/Subfolder");
    });

    it("should throw error when parent folder not found", async () => {
      const createDto: CreateFolderDto = {
        name: "Subfolder",
        parentId: 999,
      };

      spyOn(folderService, "findById").mockResolvedValue(null);

      await expect(folderService.create(createDto)).rejects.toThrow(
        "Parent folder not found"
      );
    });

    it("should throw error when folder name already exists in same location", async () => {
      const createDto: CreateFolderDto = {
        name: "Existing Folder",
        parentId: null,
      };

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      await expect(folderService.create(createDto)).rejects.toThrow(
        "A folder with this name already exists in the same location"
      );
    });
  });

  describe("update", () => {
    it("should update folder name successfully", async () => {
      const existingFolder: Folder = {
        id: 1,
        name: "Old Name",
        parentId: null,
        path: "/Old Name",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFolderDto = {
        name: "New Name",
      };

      const updatedFolder: Folder = {
        ...existingFolder,
        name: "New Name",
        path: "/New Name",
        updatedAt: new Date("2024-01-02"),
      };

      spyOn(folderService, "findById").mockResolvedValue(existingFolder);

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve([{ path: "/" }]))
        .mockReturnValueOnce(Promise.resolve([updatedFolder]));

      const result = await folderService.update(1, updateDto);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("New Name");
      expect(result?.path).toBe("/New Name");
    });

    it("should update folder expansion state", async () => {
      const existingFolder: Folder = {
        id: 1,
        name: "Folder",
        parentId: null,
        path: "/Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFolderDto = {
        isExpanded: true,
      };

      const updatedFolder: Folder = {
        ...existingFolder,
        isExpanded: true,
      };

      spyOn(folderService, "findById").mockResolvedValue(existingFolder);

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([updatedFolder]));

      const result = await folderService.update(1, updateDto);

      expect(result).not.toBeNull();
      expect(result?.isExpanded).toBe(true);
    });

    it("should return null when folder not found", async () => {
      spyOn(folderService, "findById").mockResolvedValue(null);

      const result = await folderService.update(999, { name: "New Name" });

      expect(result).toBeNull();
    });

    it("should return existing folder when no updates provided", async () => {
      const existingFolder: Folder = {
        id: 1,
        name: "Folder",
        parentId: null,
        path: "/Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      spyOn(folderService, "findById").mockResolvedValue(existingFolder);

      const result = await folderService.update(1, {});

      expect(result).toEqual(existingFolder);
    });

    it("should throw error when moving folder creates circular reference", async () => {
      const existingFolder: Folder = {
        id: 1,
        name: "Folder",
        parentId: null,
        path: "/Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFolderDto = {
        parentId: 2,
      };

      spyOn(folderService, "findById").mockResolvedValue(existingFolder);
      spyOn(folderService as any, "wouldCreateCircularReference").mockResolvedValue(true);

      await expect(folderService.update(1, updateDto)).rejects.toThrow(
        "Cannot move folder: would create a circular reference"
      );
    });

    it("should throw error when duplicate name exists in target location", async () => {
      const existingFolder: Folder = {
        id: 1,
        name: "Folder",
        parentId: null,
        path: "/Folder",
        isExpanded: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const updateDto: UpdateFolderDto = {
        parentId: 2,
      };

      spyOn(folderService, "findById").mockResolvedValue(existingFolder);
      spyOn(folderService as any, "wouldCreateCircularReference").mockResolvedValue(false);

      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 3 }]));

      await expect(folderService.update(1, updateDto)).rejects.toThrow(
        "A folder with this name already exists in the target location"
      );
    });
  });

  describe("delete", () => {
    it("should delete folder successfully", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      const result = await folderService.delete(1);

      expect(result).toBe(true);
    });

    it("should return false when folder not found", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await folderService.delete(999);

      expect(result).toBe(false);
    });

    it("should handle string id", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([{ id: 1 }]));

      const result = await folderService.delete("1");

      expect(result).toBe(true);
    });
  });

  describe("findTree", () => {
    it("should return folder tree structure", async () => {
      const mockRootFolders: Folder[] = [
        {
          id: 1,
          name: "Root",
          parentId: null,
          path: "/Root",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      const mockChildren: Folder[] = [
        {
          id: 2,
          name: "Child",
          parentId: 1,
          path: "/Root/Child",
          isExpanded: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockQueryHandler
        .mockReturnValueOnce(Promise.resolve(mockRootFolders))
        .mockReturnValueOnce(Promise.resolve(mockChildren))
        .mockReturnValueOnce(Promise.resolve([{ count: 0 }]))
        .mockReturnValueOnce(Promise.resolve([]));

      spyOn(folderService, "countSubfolders").mockResolvedValue(0);

      const result = await folderService.findTree(null);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });

    it("should return empty tree when no folders exist", async () => {
      mockQueryHandler.mockReturnValueOnce(Promise.resolve([]));

      const result = await folderService.findTree(null);

      expect(result).toEqual([]);
    });
  });
});
