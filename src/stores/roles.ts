import { defineStore } from 'pinia'

export type Permission = 
  // Core Permissions
  | 'view_dashboard'
  | 'access_admin'
  | 'manage_users'
  | 'manage_settings'
  
  // Document Operations
  | 'scan_documents'
  | 'edit_documents'
  | 'delete_documents'
  | 'quality_control'
  
  // Project Management
  | 'view_projects'
  | 'manage_projects'
  | 'assign_projects'
  
  // Production
  | 'view_queue'
  | 'manage_queue'
  | 'access_receiving'

export type Role = 'ADMIN' | 'SUPERVISOR' | 'RECEIVING' | 'PROD-TECHNICIAN'

interface RoleDefinition {
  name: string
  description: string
  permissions: Permission[]
}

interface RolesState {
  roles: Record<Role, RoleDefinition>
}

export const useRolesStore = defineStore('roles', {
  state: (): RolesState => ({
    roles: {
      ADMIN: {
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: [
          // Core
          'view_dashboard',
          'access_admin',
          'manage_users',
          'manage_settings',
          // Documents
          'scan_documents',
          'edit_documents',
          'delete_documents',
          'quality_control',
          // Projects
          'view_projects',
          'manage_projects',
          'assign_projects',
          // Production
          'view_queue',
          'manage_queue',
          'access_receiving'
        ]
      },
      SUPERVISOR: {
        name: 'Supervisor',
        description: 'Full operational access without admin panel',
        permissions: [
          // Core
          'view_dashboard',
          'manage_users',
          // Documents
          'scan_documents',
          'edit_documents',
          'delete_documents',
          'quality_control',
          // Projects
          'view_projects',
          'manage_projects',
          'assign_projects',
          // Production
          'view_queue',
          'manage_queue',
          'access_receiving'
        ]
      },
      'PROD-TECHNICIAN': {
        name: 'Production Technician',
        description: 'Access to dashboard and queue management',
        permissions: [
          // Core
          'view_dashboard',
          // Production
          'view_queue',
          'manage_queue'
        ]
      },
      RECEIVING: {
        name: 'Receiving',
        description: 'Access to receiving operations only',
        permissions: [
          // Production
          'access_receiving'
        ]
      }
    }
  }),

  getters: {
    getRolePermissions: (state) => (role: Role) => {
      return state.roles[role]?.permissions || []
    },

    hasPermission: (state) => (role: Role, permission: Permission) => {
      return state.roles[role]?.permissions.includes(permission) || false
    },

    getRoleInfo: (state) => (role: Role) => {
      return state.roles[role]
    },

    getAllRoles: (state) => {
      return Object.entries(state.roles).map(([key, value]) => ({
        id: key,
        ...value
      }))
    }
  }
}) 