import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallback.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/repository/:owner/:name',
      name: 'repository-detail',
      component: () => import('@/views/RepositoryDetailView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for initial auth check to complete
  if (!authStore.isInitialized) {
    await authStore.checkAuth()
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
  } else if (to.path === '/' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

