import { defineStore } from 'pinia'
import { useRolesStore } from './roles'
import type { Role, Permission } from './roles'

interface User {
  id: string
  name: string
  role: Role
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isSupervisor: (state) => state.user?.role === 'SUPERVISOR',
    isReceiving: (state) => state.user?.role === 'RECEIVING',
    isProdTechnician: (state) => state.user?.role === 'PROD-TECHNICIAN',
    
    // Permission-based getters
    hasPermission: (state) => (permission: Permission) => {
      if (!state.user) return false
      const rolesStore = useRolesStore()
      return rolesStore.hasPermission(state.user.role, permission)
    },

    userRole: (state) => state.user?.role,
    
    // Commonly used permission checks
    canAccessReceiving: (state) => {
      if (!state.user) return false
      const rolesStore = useRolesStore()
      return rolesStore.hasPermission(state.user.role, 'access_receiving')
    },

    canManageQueue: (state) => {
      if (!state.user) return false
      const rolesStore = useRolesStore()
      return rolesStore.hasPermission(state.user.role, 'manage_queue')
    },

    canAccessAdmin: (state) => {
      if (!state.user) return false
      const rolesStore = useRolesStore()
      return rolesStore.hasPermission(state.user.role, 'access_admin')
    },

    userPermissions: (state) => {
      if (!state.user) return []
      const rolesStore = useRolesStore()
      return rolesStore.getRolePermissions(state.user.role)
    }
  },

  actions: {
    async login(username: string, password: string) {
      // Mock login - replace with actual API call
      const mockUsers: Record<string, User> = {
        admin: {
          id: '1',
          name: 'Admin User',
          role: 'ADMIN',
          email: 'admin@example.com'
        },
        supervisor: {
          id: '2',
          name: 'Supervisor User',
          role: 'SUPERVISOR',
          email: 'supervisor@example.com'
        },
        receiving: {
          id: '3',
          name: 'Receiving User',
          role: 'RECEIVING',
          email: 'receiving@example.com'
        },
        tech: {
          id: '4',
          name: 'Production Tech',
          role: 'PROD-TECHNICIAN',
          email: 'tech@example.com'
        }
      }

      const user = mockUsers[username]
      if (user && password === 'password') {
        this.user = user
        this.isAuthenticated = true
        return true
      }
      throw new Error('Invalid credentials')
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
}) 