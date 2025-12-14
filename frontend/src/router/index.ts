import { createRouter, createWebHistory } from 'vue-router'
import WindowsExplorer from '../components/WindowsExplorer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'explorer',
      component: WindowsExplorer,
    },
  ],
})

export default router
