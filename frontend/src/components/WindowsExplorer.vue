<script setup lang="ts">
import { onMounted } from 'vue'
import { useFolderStore } from '../stores/folder'
import type { FolderWithChildren, File } from '../services/api'
import TreeItem from './TreeItem.vue'

const store = useFolderStore()

onMounted(() => {
  store.loadFolderTree()
})

function toggleExpand(folder: FolderWithChildren, event: MouseEvent) {
  event.stopPropagation()
  folder.isExpanded = !folder.isExpanded
}

function handleFolderClick(folder: FolderWithChildren, event: MouseEvent) {
  event.stopPropagation()
  store.selectFolder(folder.id)
}

function handleFileClick(file: File) {
  if (file.previewUrl) {
    window.open(file.previewUrl, '_blank')
  } else if (file.downloadUrl) {
    window.open(file.downloadUrl, '_blank')
  }
}

function getFileIcon(file: File): string {
  if (!file.mimeType) return '📄'
  
  const mimeType = file.mimeType.toLowerCase()
  
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
  if (mimeType.startsWith('text/')) return '📄'
  
  return '📄'
}
</script>

<template>
  <div class="windows-explorer">
    <div class="explorer-header">
      <h2>Windows Explorer</h2>
    </div>
    
    <div class="explorer-content">
      <div class="left-panel">
        <div class="panel-header">
          <h3>Folders</h3>
        </div>
        <div class="panel-content tree-panel">
          <div v-if="store.loading && store.folderTree.length === 0" class="loading">
            Loading folders...
          </div>
          <div v-else-if="store.error" class="error">
            {{ store.error }}
          </div>
          <div v-else-if="store.folderTree.length === 0" class="empty">
            No folders found
          </div>
          <div v-else class="tree-container">
            <TreeItem
              v-for="folder in store.folderTree"
              :key="folder.id"
              :folder="folder"
              :level="0"
              :selected-id="store.selectedFolderId"
              @folder-click="handleFolderClick"
              @toggle-expand="toggleExpand"
            />
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="panel-header">
          <div class="breadcrumb-container">
            <div class="breadcrumb">
              <span 
                class="breadcrumb-item"
                :class="{ 'breadcrumb-root': true, 'active': store.selectedFolderId === null }"
                @click="store.selectFolder(null)"
              >
                Home
              </span>
              <template v-for="(folder, index) in store.breadcrumbPath" :key="folder.id">
                <span class="breadcrumb-separator">›</span>
                <span 
                  class="breadcrumb-item"
                  :class="{ 'active': index === store.breadcrumbPath.length - 1 }"
                  @click="store.selectFolder(folder.id)"
                >
                  {{ folder.name }}
                </span>
              </template>
            </div>
          </div>
        </div>
        <div class="panel-content contents-panel">
          <div v-if="store.loading && store.selectedFolderId !== null" class="loading">
            Loading contents...
          </div>
          <div v-else-if="store.error && store.selectedFolderId !== null" class="error">
            {{ store.error }}
          </div>
          <div v-else-if="store.selectedFolderId === null" class="empty">
            No folder selected
          </div>
          <div v-else-if="store.selectedFolderChildren.length === 0 && store.selectedFolderFiles.length === 0" class="empty">
            This folder is empty
          </div>
          <div v-else class="contents-grid">
            <div
              v-for="subfolder in store.selectedFolderChildren"
              :key="`folder-${subfolder.id}`"
              class="content-item folder-item"
              @click="store.selectFolder(subfolder.id)"
            >
              <div class="content-icon">📁</div>
              <div class="content-name">{{ subfolder.name }}</div>
            </div>
            <div
              v-for="file in store.selectedFolderFiles"
              :key="`file-${file.id}`"
              class="content-item file-item"
              @click="handleFileClick(file)"
            >
              <div class="content-icon">{{ getFileIcon(file) }}</div>
              <div class="content-name">{{ file.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.windows-explorer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.explorer-header {
  background-color: #2d2d2d;
  color: white;
  padding: 12px 16px;
  border-bottom: 1px solid #1a1a1a;
}

.explorer-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.explorer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  min-width: 200px;
}

.right-panel {
  flex: 1;
}

.panel-header {
  background-color: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
  padding: 10px 16px;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
}

.breadcrumb-item {
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  color: #666;
  user-select: none;
  white-space: nowrap;
}

.breadcrumb-item:hover {
  background-color: #e0e0e0;
  color: #333;
}

.breadcrumb-item.active {
  color: #0078d4;
  font-weight: 500;
  cursor: default;
}

.breadcrumb-item.active:hover {
  background-color: transparent;
}

.breadcrumb-item.breadcrumb-root {
  color: #333;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #999;
  user-select: none;
  padding: 0 2px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-panel {
  background-color: #fafafa;
}

.tree-container {
  user-select: none;
}

.contents-panel {
  background-color: white;
}

.contents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
}

.content-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s, transform 0.1s;
  text-align: center;
}

.content-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.folder-item:hover {
  background-color: #e3f2fd;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.content-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.content-name {
  font-size: 12px;
  color: #333;
  word-break: break-word;
  max-width: 100px;
}

.loading,
.error,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 14px;
}

.error {
  color: #d32f2f;
}

.panel-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
