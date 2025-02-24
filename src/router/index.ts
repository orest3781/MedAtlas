import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DashboardView from '../views/DashboardView.vue'
import QueueView from '../views/QueueView.vue'
import AdminView from '../views/AdminView.vue'
import KioskView from '../views/KioskView.vue'
import DemoView from '../views/DemoView.vue'
import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/queue',
    name: 'queue',
    component: QueueView
  },
  {
    path: '/receiving',
    name: 'receiving',
    component: () => import('../views/production/ShipmentIntakeView.vue'),
    meta: { 
      requiresAuth: true,
      requiredPermission: 'canAccessReceiving'
    }
  },
  {
    path: '/kiosk',
    name: 'kiosk',
    component: KioskView,
    meta: {
      layout: 'kiosk',
      fullscreen: true
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    redirect: '/admin/users',
    meta: {
      requiresAdmin: true
    },
    children: [
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/OperatorsView.vue')
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('../views/admin/RolesView.vue')
      },
      {
        path: 'clients',
        name: 'admin-clients',
        component: () => import('../views/admin/ClientsView.vue')
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: () => import('../views/admin/ProjectsView.vue')
      },
      {
        path: 'workflows',
        name: 'admin-workflows',
        component: () => import('../views/admin/WorkflowsView.vue')
      },
      {
        path: 'templates',
        name: 'admin-templates',
        component: () => import('../views/admin/TemplatesView.vue')
      },
      {
        path: 'sla',
        name: 'admin-sla',
        component: () => import('../views/admin/SLAView.vue')
      },
      {
        path: 'integrations',
        name: 'admin-integrations',
        component: () => import('../views/admin/IntegrationsView.vue')
      },
      {
        path: 'logs',
        name: 'admin-logs',
        component: () => import('../views/admin/LogsView.vue')
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/admin/SettingsView.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../views/ReportsView.vue'),
    meta: {
      requiresAuth: true,
      requiredPermission: 'canAccessReports'
    }
  },
  {
    path: '/demo',
    name: 'demo',
    component: DemoView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // Check for specific permission requirements
    const requiredPermission = to.meta.requiredPermission as string | undefined
    if (requiredPermission && !authStore[requiredPermission]) {
      next({ name: 'dashboard' })
      return
    }
  }

  // Check for admin access
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authStore.isAdmin) {
      next('/')
      return
    }
  }

  // Check for role-based access
  if (to.meta.roles) {
    const requiredRoles = to.meta.roles as string[]
    if (!requiredRoles.includes(authStore.userRole)) {
      next('/')
      return
    }
  }

  next()
})

export default router 