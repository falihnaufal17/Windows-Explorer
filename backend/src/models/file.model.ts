import { BaseModel } from "./base.model";

export interface File extends BaseModel {
  name: string;
  path: string;
  mimeType: string | null;
  size: number;
  storagePath: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileWithFolder extends File {
  folderId?: number | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
}

export interface CreateFileDto {
  name: string;
  folderId?: number | null;
  mimeType?: string | null;
  size?: number;
}

export interface UpdateFileDto {
  name?: string;
  folderId?: number | null;
  mimeType?: string | null;
  size?: number;
}

export interface MoveFileDto {
  folderId?: number | null;
}

