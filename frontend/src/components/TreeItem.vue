<script lang="ts">
import { defineComponent, type PropType, computed } from 'vue'
import type { FolderWithChildren } from '../services/api'

export default defineComponent({
  name: 'TreeItem',
  props: {
    folder: {
      type: Object as PropType<FolderWithChildren>,
      required: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    selectedId: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  emits: ['folderClick', 'toggleExpand'],
  setup(props, { emit }) {
    const hasChildren = computed(() => {
      return (props.folder.children && props.folder.children.length > 0) || 
             (props.folder.subfolderCount !== undefined && props.folder.subfolderCount > 0)
    })

    const isExpanded = computed(() => {
      return props.folder.isExpanded === true
    })

    function handleFolderClick(event: MouseEvent) {
      emit('folderClick', props.folder, event)
    }

    function handleToggleExpand(event: MouseEvent) {
      emit('toggleExpand', props.folder, event)
    }

    function handleChildFolderClick(folder: FolderWithChildren, event: MouseEvent) {
      emit('folderClick', folder, event)
    }

    function handleChildToggleExpand(folder: FolderWithChildren, event: MouseEvent) {
      emit('toggleExpand', folder, event)
    }

    return {
      hasChildren,
      isExpanded,
      handleFolderClick,
      handleToggleExpand,
      handleChildFolderClick,
      handleChildToggleExpand,
    }
  },
})
</script>

<template>
  <div class="tree-item">
    <div
      :class="['tree-node', { selected: selectedId === folder.id }]"
      :style="{ paddingLeft: level * 20 + 8 + 'px' }"
    >
      <span
        class="expand-icon"
        :class="{ 'has-children': hasChildren }"
        @click.stop="handleToggleExpand"
      >
        <template v-if="hasChildren">
          <span class="expand-arrow" :class="{ expanded: isExpanded }">▶</span>
        </template>
        <template v-else>
          <span class="expand-spacer">&nbsp;</span>
        </template>
      </span>
      <span 
        class="folder-content"
        @click="handleFolderClick"
      >
        <span class="folder-icon">📁</span>
        <span class="folder-name">{{ folder.name }}</span>
      </span>
    </div>
    <transition name="tree-children">
      <div v-if="isExpanded && folder.children && folder.children.length > 0" class="tree-children">
        <TreeItem
          v-for="child in folder.children"
          :key="child.id"
          :folder="child"
          :level="level + 1"
          :selected-id="selectedId"
          @folder-click="handleChildFolderClick"
          @toggle-expand="handleChildToggleExpand"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.tree-item {
  margin: 0;
}

.tree-node {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background-color 0.15s;
  gap: 6px;
}

.folder-content {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
  gap: 6px;
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: 2px;
  transition: background-color 0.15s;
  min-width: 0;
}

.folder-content:hover {
  background-color: #e8e8e8;
}

.tree-node.selected .folder-content {
  background-color: transparent;
}

.tree-node.selected {
  background-color: #0078d4;
  color: white;
}

.tree-node.selected .folder-content:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.tree-node.selected .folder-icon {
  filter: brightness(0) invert(1);
}

.expand-icon {
  width: 16px;
  text-align: center;
  font-size: 10px;
  color: #666;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-icon.has-children {
  cursor: pointer;
}

.expand-icon.has-children:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.tree-node.selected .expand-icon {
  color: white;
}

.tree-node.selected .expand-icon.has-children:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.expand-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
  transform-origin: center;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.expand-spacer {
  display: inline-block;
  width: 100%;
}

.folder-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-children {
  margin-left: 0;
  overflow: hidden;
}

.tree-children-enter-active {
  transition: all 0.2s ease-out;
}

.tree-children-leave-active {
  transition: all 0.2s ease-in;
}

.tree-children-enter-from {
  opacity: 0;
  max-height: 0;
}

.tree-children-enter-to {
  opacity: 1;
  max-height: 1000px;
}

.tree-children-leave-from {
  opacity: 1;
  max-height: 1000px;
}

.tree-children-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
