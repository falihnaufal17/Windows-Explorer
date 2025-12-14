import { mkdir, writeFile, readFile, unlink, stat, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { appConfig } from "../config/app.config";

export class StorageService {
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.storageDir = join(process.cwd(), "uploads");
    this.baseUrl = appConfig.baseUrl;
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    if (!existsSync(this.storageDir)) {
      await mkdir(this.storageDir, { recursive: true });
    }
  }

  private generateStoragePath(originalName: string, fileId: number): string {
    const timestamp = Date.now();
    const extension = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";
    const baseName = originalName.includes(".")
      ? originalName.substring(0, originalName.lastIndexOf("."))
      : originalName;

    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${fileId}_${timestamp}_${sanitized}${extension}`;
    
    return join(this.storageDir, filename);
  }

  generateStorageUrl(fileId: number | string): string {
    return `${this.baseUrl}${appConfig.apiPrefix}/files/${fileId}/download`;
  }

  generatePreviewUrl(fileId: number | string): string {
    return `${this.baseUrl}${appConfig.apiPrefix}/files/${fileId}/preview`;
  }

  async saveFile(file: globalThis.File, fileId: number): Promise<string> {
    await this.ensureStorageDir();
    
    const storagePath = this.generateStoragePath(file.name, fileId);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await writeFile(storagePath, buffer);

    return this.generateStorageUrl(fileId);
  }

  async findFilePathByFileId(fileId: number | string): Promise<string | null> {
    if (!existsSync(this.storageDir)) {
      return null;
    }

    try {
      const files = await readdir(this.storageDir);
      const fileIdStr = fileId.toString();

      const matchingFile = files.find(file => file.startsWith(`${fileIdStr}_`));
      
      if (matchingFile) {
        return join(this.storageDir, matchingFile);
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding file for fileId ${fileId}:`, error);
      return null;
    }
  }

  async readFile(storagePathOrFileId: string | number): Promise<Buffer> {
    let filePath: string;
    
    if (typeof storagePathOrFileId === "number") {
      const foundPath = await this.findFilePathByFileId(storagePathOrFileId);
      if (!foundPath) {
        throw new Error("File not found on disk");
      }
      filePath = foundPath;
    } else if (storagePathOrFileId.includes(this.storageDir)) {
      filePath = storagePathOrFileId;
    } else {
      const fileIdMatch = storagePathOrFileId.match(/\/files\/(\d+)\/(?:download|preview)/);
      if (fileIdMatch) {
        const fileId = parseInt(fileIdMatch[1], 10);
        const foundPath = await this.findFilePathByFileId(fileId);
        if (!foundPath) {
          throw new Error("File not found on disk");
        }
        filePath = foundPath;
      } else {
        throw new Error("Invalid storage path or URL");
      }
    }
    
    if (!existsSync(filePath)) {
      throw new Error("File not found on disk");
    }
    
    return await readFile(filePath);
  }

  async deleteFile(storagePathOrFileId: string | number): Promise<void> {
    let filePath: string | null = null;
    
    if (typeof storagePathOrFileId === "number") {
      filePath = await this.findFilePathByFileId(storagePathOrFileId);
    } else if (storagePathOrFileId.includes(this.storageDir)) {
      filePath = storagePathOrFileId;
    } else if (storagePathOrFileId.includes("/files/") && (storagePathOrFileId.includes("/download") || storagePathOrFileId.includes("/preview"))) {
      const fileIdMatch = storagePathOrFileId.match(/\/files\/(\d+)\/(?:download|preview)/);
      if (fileIdMatch) {
        const fileId = parseInt(fileIdMatch[1], 10);
        filePath = await this.findFilePathByFileId(fileId);
      }
    }
    
    if (!filePath || !existsSync(filePath)) {
      return;
    }
    
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async getFileStats(storagePath: string): Promise<{ size: number; mtime: Date }> {
    if (!existsSync(storagePath)) {
      throw new Error("File not found on disk");
    }
    
    const stats = await stat(storagePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  getStorageDir(): string {
    return this.storageDir;
  }
}

export const storageService = new StorageService();

