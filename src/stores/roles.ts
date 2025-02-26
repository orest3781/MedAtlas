import { defineStore } from 'pinia'
import type { Role, RolePermissions } from '@/types/database'

const rolePermissionsMap: Record<Role, RolePermissions> = {
  'ADMIN': {
    canCreateUser: true,
    canEditUser: true,
    canDeleteUser: true,
    canViewUsers: true,
    canCreateClient: true,
    canEditClient: true,
    canDeleteClient: true,
    canViewClients: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canViewProjects: true,
    canManageJobs: true,
    canViewJobs: true,
    canViewReports: true,
    canManageSettings: true,
    canAccessReceiving: true
  },
  'SUPERVISOR': {
    canCreateUser: false,
    canEditUser: true,
    canDeleteUser: false,
    canViewUsers: true,
    canCreateClient: true,
    canEditClient: true,
    canDeleteClient: false,
    canViewClients: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: false,
    canViewProjects: true,
    canManageJobs: true,
    canViewJobs: true,
    canViewReports: true,
    canManageSettings: false,
    canAccessReceiving: true
  },
  'OPERATOR': {
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canViewUsers: false,
    canCreateClient: false,
    canEditClient: false,
    canDeleteClient: false,
    canViewClients: true,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewProjects: true,
    canManageJobs: true,
    canViewJobs: true,
    canViewReports: false,
    canManageSettings: false,
    canAccessReceiving: false
  },
  'PROD-TECHNICIAN': {
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canViewUsers: false,
    canCreateClient: false,
    canEditClient: false,
    canDeleteClient: false,
    canViewClients: true,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewProjects: true,
    canManageJobs: true,
    canViewJobs: true,
    canViewReports: false,
    canManageSettings: false,
    canAccessReceiving: true
  },
  'RECEIVING': {
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canViewUsers: false,
    canCreateClient: false,
    canEditClient: false,
    canDeleteClient: false,
    canViewClients: true,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canViewProjects: true,
    canManageJobs: false,
    canViewJobs: true,
    canViewReports: false,
    canManageSettings: false,
    canAccessReceiving: true
  }
}

interface RolesState {
  currentRole: Role | null
}

export const useRolesStore = defineStore('roles', {
  state: (): RolesState => ({
    currentRole: null
  }),

  getters: {
    permissions(): RolePermissions {
      if (!this.currentRole) {
        return Object.fromEntries(
          Object.keys(rolePermissionsMap.OPERATOR).map(key => [key, false])
        ) as RolePermissions
      }
      return rolePermissionsMap[this.currentRole]
    },

    hasPermission() {
      return (permission: keyof RolePermissions): boolean => {
        return this.permissions[permission]
      }
    }
  },

  actions: {
    setRole(role: Role) {
      this.currentRole = role
    },

    getRolePermissions(role: Role): Array<keyof RolePermissions> {
      return Object.entries(rolePermissionsMap[role])
        .filter(([_, value]) => value)
        .map(([key]) => key as keyof RolePermissions)
    }
  }
}) 