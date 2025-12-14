import { getDb } from "../db/connection";
import { File, FileWithFolder, CreateFileDto, UpdateFileDto } from "../models/file.model";
import { storageService } from "./storage.service";

class FileService {
  private addUrlsToFile(file: File | FileWithFolder): FileWithFolder {
    const fileWithUrls = {
      ...file,
      previewUrl: storageService.generatePreviewUrl(file.id),
      downloadUrl: storageService.generateStorageUrl(file.id),
    };
    return fileWithUrls;
  }
  private async generatePath(name: string, folderId: number | null): Promise<string> {
    if (!folderId) {
      return `/${name}`;
    }

    const db = getDb();
    const folder = await db<{ path: string }[]>`
      SELECT path FROM folders WHERE id = ${folderId} LIMIT 1
    `;

    if (!folder[0]) {
      throw new Error("Folder not found");
    }

    return `${folder[0].path}/${name}`;
  }

  async findAll(): Promise<File[]> {
    const db = getDb();
    const results = await db<File[]>`
      SELECT 
        id,
        name,
        path,
        mime_type as "mimeType",
        size,
        storage_path as "storagePath",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM files
      ORDER BY path ASC
    `;
    return results;
  }

  async findById(id: string | number): Promise<File | null> {
    const db = getDb();
    const results = await db<File[]>`
      SELECT 
        id,
        name,
        path,
        mime_type as "mimeType",
        size,
        storage_path as "storagePath",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM files
      WHERE id = ${id}
      LIMIT 1
    `;
    return results[0] || null;
  }

  async findByFolderId(folderId: number | null): Promise<FileWithFolder[]> {
    const db = getDb();

    if (folderId === null) {
      const results = await db<FileWithFolder[]>`
        SELECT 
          f.id,
          f.name,
          f.path,
          f.mime_type as "mimeType",
          f.size,
          f.storage_path as "storagePath",
          f.created_at as "createdAt",
          f.updated_at as "updatedAt",
          NULL as "folderId"
        FROM files f
        WHERE f.id NOT IN (
          SELECT file_id FROM folders_files
        )
        ORDER BY f.name ASC
      `;
      return results;
    }

    const results = await db<FileWithFolder[]>`
      SELECT 
        f.id,
        f.name,
        f.path,
        f.mime_type as "mimeType",
        f.size,
        f.storage_path as "storagePath",
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        ff.folder_id as "folderId"
      FROM files f
      INNER JOIN folders_files ff ON f.id = ff.file_id
      WHERE ff.folder_id = ${folderId}
      ORDER BY f.name ASC
    `;
    return results;
  }

  async create(data: CreateFileDto): Promise<FileWithFolder> {
    const db = getDb();

    if (data.folderId) {
      const folder = await db<{ id: number }[]>`
        SELECT id FROM folders WHERE id = ${data.folderId} LIMIT 1
      `;
      if (!folder[0]) {
        throw new Error("Folder not found");
      }
    }

    const path = await this.generatePath(data.name, data.folderId || null);

    if (data.folderId) {
      const existing = await db<{ id: number }[]>`
        SELECT f.id
        FROM files f
        INNER JOIN folders_files ff ON f.id = ff.file_id
        WHERE f.name = ${data.name}
        AND ff.folder_id = ${data.folderId}
        LIMIT 1
      `;
      if (existing.length > 0) {
        throw new Error("A file with this name already exists in the same folder");
      }
    } else {
      const existing = await db<{ id: number }[]>`
        SELECT f.id
        FROM files f
        WHERE f.name = ${data.name}
        AND f.id NOT IN (SELECT file_id FROM folders_files)
        LIMIT 1
      `;
      if (existing.length > 0) {
        throw new Error("A file with this name already exists in the root");
      }
    }

    const fileResults = await db<File[]>`
      INSERT INTO files (name, path, mime_type, size, storage_path)
      VALUES (${data.name}, ${path}, ${data.mimeType || null}, ${data.size || 0}, NULL)
      RETURNING 
        id,
        name,
        path,
        mime_type as "mimeType",
        size,
        storage_path as "storagePath",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    const file = fileResults[0];

    if (data.folderId) {
      await db`
        INSERT INTO folders_files (folder_id, file_id)
        VALUES (${data.folderId}, ${file.id})
      `;
    }

    return this.addUrlsToFile({
      ...file,
      folderId: data.folderId || null,
    });
  }

  async createWithUpload(
    uploadedFile: globalThis.File,
    folderId: number | null
  ): Promise<FileWithFolder> {
    const db = getDb();

    if (folderId) {
      const folder = await db<{ id: number }[]>`
        SELECT id FROM folders WHERE id = ${folderId} LIMIT 1
      `;
      if (!folder[0]) {
        throw new Error("Folder not found");
      }
    }

    const fileName = uploadedFile.name;
    const mimeType = uploadedFile.type || null;
    const size = uploadedFile.size;

    const path = await this.generatePath(fileName, folderId || null);

    if (folderId) {
      const existing = await db<{ id: number }[]>`
        SELECT f.id
        FROM files f
        INNER JOIN folders_files ff ON f.id = ff.file_id
        WHERE f.name = ${fileName}
        AND ff.folder_id = ${folderId}
        LIMIT 1
      `;
      if (existing.length > 0) {
        throw new Error("A file with this name already exists in the same folder");
      }
    } else {
      const existing = await db<{ id: number }[]>`
        SELECT f.id
        FROM files f
        WHERE f.name = ${fileName}
        AND f.id NOT IN (SELECT file_id FROM folders_files)
        LIMIT 1
      `;
      if (existing.length > 0) {
        throw new Error("A file with this name already exists in the root");
      }
    }

    const fileResults = await db<File[]>`
      INSERT INTO files (name, path, mime_type, size, storage_path)
      VALUES (${fileName}, ${path}, ${mimeType}, ${size}, NULL)
      RETURNING 
        id,
        name,
        path,
        mime_type as "mimeType",
        size,
        storage_path as "storagePath",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    const file = fileResults[0];

    try {
      const storagePath = await storageService.saveFile(uploadedFile, file.id as number);

      const updatedResults = await db<File[]>`
        UPDATE files
        SET storage_path = ${storagePath}
        WHERE id = ${file.id}
        RETURNING 
          id,
          name,
          path,
          mime_type as "mimeType",
          size,
          storage_path as "storagePath",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      const updatedFile = updatedResults[0];

      if (folderId) {
        await db`
          INSERT INTO folders_files (folder_id, file_id)
          VALUES (${folderId}, ${updatedFile.id})
        `;
      }

      return this.addUrlsToFile({
        ...updatedFile,
        folderId: folderId || null,
      });
    } catch (error) {
      await db`DELETE FROM files WHERE id = ${file.id}`;
      throw error;
    }
  }

  async update(id: string | number, data: UpdateFileDto): Promise<FileWithFolder | null> {
    const db = getDb();

    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const currentFolder = await db<{ folder_id: number | null }[]>`
      SELECT folder_id FROM folders_files WHERE file_id = ${id} LIMIT 1
    `;
    const currentFolderId = currentFolder[0]?.folder_id || null;

    if (data.folderId !== undefined && data.folderId !== currentFolderId) {
      if (data.folderId) {
        const folder = await db<{ id: number }[]>`
          SELECT id FROM folders WHERE id = ${data.folderId} LIMIT 1
        `;
        if (!folder[0]) {
          throw new Error("Folder not found");
        }

        const duplicate = await db<{ id: number }[]>`
          SELECT f.id
          FROM files f
          INNER JOIN folders_files ff ON f.id = ff.file_id
          WHERE f.name = ${data.name || existing.name}
          AND ff.folder_id = ${data.folderId}
          AND f.id != ${id}
          LIMIT 1
        `;
        if (duplicate.length > 0) {
          throw new Error("A file with this name already exists in the target folder");
        }
      } else {
        const duplicate = await db<{ id: number }[]>`
          SELECT f.id
          FROM files f
          WHERE f.name = ${data.name || existing.name}
          AND f.id NOT IN (SELECT file_id FROM folders_files)
          AND f.id != ${id}
          LIMIT 1
        `;
        if (duplicate.length > 0) {
          throw new Error("A file with this name already exists in the root");
        }
      }
    } else if (data.name !== undefined && data.name !== existing.name) {
      const targetFolderId = data.folderId !== undefined ? data.folderId : currentFolderId;
      if (targetFolderId) {
        const duplicate = await db<{ id: number }[]>`
          SELECT f.id
          FROM files f
          INNER JOIN folders_files ff ON f.id = ff.file_id
          WHERE f.name = ${data.name}
          AND ff.folder_id = ${targetFolderId}
          AND f.id != ${id}
          LIMIT 1
        `;
        if (duplicate.length > 0) {
          throw new Error("A file with this name already exists in the same folder");
        }
      } else {
        const duplicate = await db<{ id: number }[]>`
          SELECT f.id
          FROM files f
          WHERE f.name = ${data.name}
          AND f.id NOT IN (SELECT file_id FROM folders_files)
          AND f.id != ${id}
          LIMIT 1
        `;
        if (duplicate.length > 0) {
          throw new Error("A file with this name already exists in the root");
        }
      }
    }

    let newPath = existing.path;
    if (data.name !== undefined || data.folderId !== undefined) {
      const finalName = data.name || existing.name;
      const finalFolderId = data.folderId !== undefined ? data.folderId : currentFolderId;
      newPath = await this.generatePath(finalName, finalFolderId);
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }
    if (data.mimeType !== undefined) {
      updates.push(`mime_type = $${values.length + 1}`);
      values.push(data.mimeType);
    }
    if (data.size !== undefined) {
      updates.push(`size = $${values.length + 1}`);
      values.push(data.size);
    }
    if (newPath !== existing.path) {
      updates.push(`path = $${values.length + 1}`);
      values.push(newPath);
    }

    if (updates.length > 0) {
      values.push(id);
      const query = `
        UPDATE files
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING 
          id,
          name,
          path,
          mime_type as "mimeType",
          size,
          storage_path as "storagePath",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const results = await db.unsafe<File[]>(query, values);
      const updatedFile = results[0];

      if (data.folderId !== undefined) {
        await db`
          DELETE FROM folders_files WHERE file_id = ${id}
        `;

        if (data.folderId) {
          await db`
            INSERT INTO folders_files (folder_id, file_id)
            VALUES (${data.folderId}, ${id})
          `;
        }
      }

      return this.addUrlsToFile({
        ...updatedFile,
        folderId: data.folderId !== undefined ? data.folderId : currentFolderId,
      });
    }

    return this.addUrlsToFile({
      ...existing,
      folderId: currentFolderId,
    });
  }

  async delete(id: string | number): Promise<boolean> {
    const db = getDb();

    const file = await this.findById(id);

    const results = await db`
      DELETE FROM files
      WHERE id = ${id}
      RETURNING id
    `;

    if (results.length > 0 && file) {
      try {
        await storageService.deleteFile(file.id as number);
      } catch (error) {
        console.error(`Failed to delete file from disk for fileId ${file.id}:`, error);
      }
    }

    return results.length > 0;
  }
}

export const fileService = new FileService();

