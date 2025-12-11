import { BaseModel } from "./base.model";

export interface Folder extends BaseModel {
  name: string;
  parentId: number | null;
  path: string;
  isExpanded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  subfolderCount?: number;
}

export interface CreateFolderDto {
  name: string;
  parentId?: number | null;
}

export interface UpdateFolderDto {
  name?: string;
  parentId?: number | null;
  isExpanded?: boolean;
}

export interface MoveFolderDto {
  parentId?: number | null;
}

