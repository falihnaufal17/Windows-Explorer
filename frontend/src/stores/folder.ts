import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService, type Folder, type FolderWithChildren, type File } from '../services/api'

export const useFolderStore = defineStore('folder', () => {
  const folderTree = ref<FolderWithChildren[]>([])
  const selectedFolderId = ref<number | null>(null)
  const selectedFolderChildren = ref<Folder[]>([])
  const selectedFolderFiles = ref<File[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const selectedFolder = computed(() => {
    if (selectedFolderId.value === null) return null
    return findFolderInTree(folderTree.value, selectedFolderId.value)
  })

  const breadcrumbPath = computed(() => {
    if (selectedFolderId.value === null) return []
    
    const path: FolderWithChildren[] = []
    let currentFolder = findFolderInTree(folderTree.value, selectedFolderId.value)
    
    while (currentFolder) {
      path.unshift(currentFolder)
      if (currentFolder.parentId === null) {
        break
      }
      currentFolder = findFolderInTree(folderTree.value, currentFolder.parentId)
    }
    
    return path
  })

  function findFolderInTree(
    tree: FolderWithChildren[],
    id: number
  ): FolderWithChildren | null {
    for (const folder of tree) {
      if (folder.id === id) {
        return folder
      }
      if (folder.children) {
        const found = findFolderInTree(folder.children, id)
        if (found) return found
      }
    }
    return null
  }

  function initializeFolderExpansion(folders: FolderWithChildren[]): void {
    folders.forEach(folder => {
      if (folder.isExpanded === undefined) {
        folder.isExpanded = false
      }
      if (folder.children && folder.children.length > 0) {
        initializeFolderExpansion(folder.children)
      }
    })
  }

  async function loadFolderTree() {
    loading.value = true
    error.value = null
    try {
      const tree = await apiService.getFolderTree()
      initializeFolderExpansion(tree)
      folderTree.value = tree
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load folder tree'
      console.error('Error loading folder tree:', err)
    } finally {
      loading.value = false
    }
  }

  async function selectFolder(folderId: number | null) {
    selectedFolderId.value = folderId
    
    if (folderId === null) {
      selectedFolderChildren.value = []
      selectedFolderFiles.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      const [children, files] = await Promise.all([
        apiService.getFolderChildren(folderId),
        apiService.getFilesByFolderId(folderId)
      ])
      selectedFolderChildren.value = children
      selectedFolderFiles.value = files
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load folder content'
      console.error('Error loading folder content:', err)
      selectedFolderChildren.value = []
      selectedFolderFiles.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    folderTree,
    selectedFolderId,
    selectedFolder,
    selectedFolderChildren,
    selectedFolderFiles,
    breadcrumbPath,
    loading,
    error,
    loadFolderTree,
    selectFolder,
  }
})
