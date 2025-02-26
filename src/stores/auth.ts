import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/database'
import { useRolesStore } from './roles'
import type { Role, Permission } from './roles'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  
  const canAccessReceiving = computed(() => {
    if (!user.value) return false
    return ['ADMIN', 'SUPERVISOR', 'RECEIVING'].includes(user.value.role)
  })
  
  const canAccessQueue = computed(() => {
    if (!user.value) return false
    return ['ADMIN', 'SUPERVISOR', 'PROD-TECHNICIAN'].includes(user.value.role)
  })

  // Actions
  const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await window.api.login({ email, password })
      user.value = response.user
      token.value = response.token
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to login'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      await window.api.logout()
      user.value = null
      token.value = null
      error.value = null
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const checkAuth = async () => {
    if (!token.value) return false
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await window.api.checkAuth(token.value)
      user.value = response.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
      user.value = null
      token.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  const isSupervisor = computed(() => user.value?.role === 'SUPERVISOR')
  const isReceiving = computed(() => user.value?.role === 'RECEIVING')
  const isProdTechnician = computed(() => user.value?.role === 'PROD-TECHNICIAN')
  
  // Permission-based getters
  const hasPermission = (permission: Permission) => {
    if (!user.value) return false
    const rolesStore = useRolesStore()
    return rolesStore.hasPermission(user.value.role, permission)
  }

  const userRole = computed(() => user.value?.role)
  
  // Commonly used permission checks
  const canManageQueue = computed(() => {
    if (!user.value) return false
    const rolesStore = useRolesStore()
    return rolesStore.hasPermission(user.value.role, 'manage_queue')
  })

  const canAccessAdmin = computed(() => {
    if (!user.value) return false
    const rolesStore = useRolesStore()
    return rolesStore.hasPermission(user.value.role, 'access_admin')
  })

  const userPermissions = computed(() => {
    if (!user.value) return []
    const rolesStore = useRolesStore()
    return rolesStore.getRolePermissions(user.value.role)
  })

  return {
    // State
    user,
    token,
    error,
    isLoading,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isSupervisor,
    isReceiving,
    isProdTechnician,
    hasPermission,
    userRole,
    canAccessReceiving,
    canManageQueue,
    canAccessAdmin,
    userPermissions,
    
    // Actions
    login,
    logout,
    checkAuth
  }
}) 