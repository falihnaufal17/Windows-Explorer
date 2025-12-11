import { getDb } from "../db/connection";
import { Folder, FolderWithChildren, CreateFolderDto, UpdateFolderDto } from "../models/folder.model";

class FolderService {
  private async generatePath(name: string, parentId: number | null): Promise<string> {
    if (!parentId) {
      return `/${name}`;
    }

    const db = getDb();
    const parent = await db<Folder[]>`
      SELECT path FROM folders WHERE id = ${parentId} LIMIT 1
    `;

    if (!parent[0]) {
      throw new Error("Parent folder not found");
    }

    return `${parent[0].path}/${name}`;
  }

  private async wouldCreateCircularReference(
    folderId: number,
    newParentId: number | null
  ): Promise<boolean> {
    if (!newParentId) {
      return false;
    }

    if (folderId === newParentId) {
      return true;
    }

    const db = getDb();
    let currentParentId: number | null = newParentId;

    while (currentParentId) {
      if (currentParentId === folderId) {
        return true;
      }

      const parent: { parent_id: number | null }[] = await db<{ parent_id: number | null }[]>`
        SELECT parent_id FROM folders WHERE id = ${currentParentId} LIMIT 1
      `;

      if (!parent[0]) {
        break;
      }

      currentParentId = parent[0].parent_id;
    }

    return false;
  }

  async findAll(): Promise<Folder[]> {
    const db = getDb();
    const results = await db<Folder[]>`
      SELECT 
        id,
        name,
        parent_id as "parentId",
        path,
        is_expanded as "isExpanded",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM folders
      ORDER BY path ASC
    `;
    return results;
  }

  async findTree(parentId: number | null = null): Promise<FolderWithChildren[]> {
    const db = getDb();
    const results = await db<Folder[]>`
      SELECT 
        id,
        name,
        parent_id as "parentId",
        path,
        is_expanded as "isExpanded",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM folders
      WHERE parent_id ${parentId === null ? db`IS NULL` : db`= ${parentId}`}
      ORDER BY name ASC
    `;

    const foldersWithChildren: FolderWithChildren[] = await Promise.all(
      results.map(async (folder) => {
        const children = await this.findTree(folder.id as number);
        const subfolderCount = await this.countSubfolders(folder.id as number);
        
        return {
          ...folder,
          children: children.length > 0 ? children : undefined,
          subfolderCount,
        };
      })
    );

    return foldersWithChildren;
  }

  async findById(id: string | number): Promise<Folder | null> {
    const db = getDb();
    const results = await db<Folder[]>`
      SELECT 
        id,
        name,
        parent_id as "parentId",
        path,
        is_expanded as "isExpanded",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM folders
      WHERE id = ${id}
      LIMIT 1
    `;
    return results[0] || null;
  }

  async findChildren(parentId: number | null): Promise<Folder[]> {
    const db = getDb();
    const results = await db<Folder[]>`
      SELECT 
        id,
        name,
        parent_id as "parentId",
        path,
        is_expanded as "isExpanded",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM folders
      WHERE parent_id ${parentId === null ? db`IS NULL` : db`= ${parentId}`}
      ORDER BY name ASC
    `;
    return results;
  }

  async countSubfolders(parentId: number): Promise<number> {
    const db = getDb();
    const results = await db<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM folders
      WHERE parent_id = ${parentId}
    `;
    return Number(results[0]?.count || 0);
  }

  async create(data: CreateFolderDto): Promise<Folder> {
    const db = getDb();

    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new Error("Parent folder not found");
      }
    }

    const existing = await db<Folder[]>`
      SELECT id FROM folders
      WHERE name = ${data.name}
      AND parent_id ${data.parentId === null ? db`IS NULL` : db`= ${data.parentId ?? 0}`}
      LIMIT 1
    `;

    if (existing.length > 0) {
      throw new Error("A folder with this name already exists in the same location");
    }

    const path = await this.generatePath(data.name, data.parentId || null);

    const results = await db<Folder[]>`
      INSERT INTO folders (name, parent_id, path, is_expanded)
      VALUES (${data.name}, ${data.parentId || null}, ${path}, false)
      RETURNING 
        id,
        name,
        parent_id as "parentId",
        path,
        is_expanded as "isExpanded",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    return results[0];
  }

  async update(id: string | number, data: UpdateFolderDto): Promise<Folder | null> {
    const db = getDb();
    
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    if (data.parentId !== undefined && data.parentId !== existing.parentId) {
      const wouldCreateCircular = await this.wouldCreateCircularReference(
        existing.id as number,
        data.parentId
      );

      if (wouldCreateCircular) {
        throw new Error("Cannot move folder: would create a circular reference");
      }

      const duplicate = await db<Folder[]>`
        SELECT id FROM folders
        WHERE name = ${data.name || existing.name}
        AND parent_id ${data.parentId === null ? db`IS NULL` : db`= ${data.parentId}`}
        AND id != ${id}
        LIMIT 1
      `;

      if (duplicate.length > 0) {
        throw new Error("A folder with this name already exists in the target location");
      }
    }

    let newPath = existing.path;
    if (data.name !== undefined || data.parentId !== undefined) {
      const finalName = data.name || existing.name;
      const finalParentId = data.parentId !== undefined ? data.parentId : existing.parentId;
      newPath = await this.generatePath(finalName, finalParentId);
    }

    if (newPath !== existing.path) {
      const updates: string[] = [];
      const values: (string | number | boolean | null)[] = [];

      if (data.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(data.name);
      }
      if (data.parentId !== undefined) {
        updates.push(`parent_id = $${values.length + 1}`);
        values.push(data.parentId);
      }
      if (data.isExpanded !== undefined) {
        updates.push(`is_expanded = $${values.length + 1}`);
        values.push(data.isExpanded);
      }
      updates.push(`path = $${values.length + 1}`);
      values.push(newPath);

      values.push(id);
      const query = `
        UPDATE folders
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING 
          id,
          name,
          parent_id as "parentId",
          path,
          is_expanded as "isExpanded",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const results = await db.unsafe<Folder[]>(query, values);
      const updatedFolder = results[0];

      if (updatedFolder) {
        await this.updateDescendantPaths(updatedFolder.id as number, newPath);
      }

      return updatedFolder;
    } else {
      const updates: string[] = [];
      const values: (string | number | boolean | null)[] = [];

      if (data.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(data.name);
      }
      if (data.parentId !== undefined) {
        updates.push(`parent_id = $${values.length + 1}`);
        values.push(data.parentId);
      }
      if (data.isExpanded !== undefined) {
        updates.push(`is_expanded = $${values.length + 1}`);
        values.push(data.isExpanded);
      }

      if (updates.length === 0) {
        return existing;
      }

      values.push(id);
      const query = `
        UPDATE folders
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING 
          id,
          name,
          parent_id as "parentId",
          path,
          is_expanded as "isExpanded",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const results = await db.unsafe<Folder[]>(query, values);
      return results[0] || null;
    }
  }

  private async updateDescendantPaths(parentId: number, parentPath: string): Promise<void> {
    const db = getDb();
    const children = await db<{ id: number; name: string }[]>`
      SELECT id, name FROM folders WHERE parent_id = ${parentId}
    `;

    for (const child of children) {
      const newChildPath = `${parentPath}/${child.name}`;
      await db`
        UPDATE folders
        SET path = ${newChildPath}
        WHERE id = ${child.id}
      `;

      await this.updateDescendantPaths(child.id, newChildPath);
    }
  }

  async delete(id: string | number): Promise<boolean> {
    const db = getDb();
    const results = await db`
      DELETE FROM folders
      WHERE id = ${id}
      RETURNING id
    `;
    return results.length > 0;
  }

  async findRoots(): Promise<Folder[]> {
    return this.findChildren(null);
  }
}

export const folderService = new FolderService();

