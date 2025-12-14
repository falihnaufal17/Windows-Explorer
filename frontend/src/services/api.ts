const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export interface Folder {
  id: number
  name: string
  parentId: number | null
  path: string
  isExpanded: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[]
  subfolderCount?: number
}

export interface File {
  id: number
  name: string
  path: string
  mimeType: string | null
  size: number
  storagePath: string | null
  folderId?: number | null
  previewUrl?: string | null
  downloadUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

class ApiService {
  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    const result: ApiResponse<T> = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'API request failed')
    }
    
    return result.data
  }

  async getFolderTree(parentId?: number | null): Promise<FolderWithChildren[]> {
    const query = parentId !== undefined ? `?parentId=${parentId}` : ''
    return this.request<FolderWithChildren[]>(`/folders/tree${query}`)
  }

  async getFolderChildren(folderId: number): Promise<Folder[]> {
    return this.request<Folder[]>(`/folders/${folderId}/children`)
  }

  async getFilesByFolderId(folderId: number | null): Promise<File[]> {
    const folderIdParam = folderId === null ? 'root' : folderId.toString()
    return this.request<File[]>(`/files/folder/${folderIdParam}`)
  }
}

export const apiService = new ApiService()
