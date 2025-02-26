export type Role = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'PROD-TECHNICIAN' | 'RECEIVING'
export type Status = 'active' | 'inactive'
export type JobStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed'
export type JobPriority = 'low' | 'medium' | 'high'
export type StepStatus = 'pending' | 'in_progress' | 'completed'
export type StepName = 'PREP' | 'SCAN' | 'QC' | 'INDEX' | 'REPREP'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: Status
  created_at: string
  last_login: string | null
}

export interface Client {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  status: Status
  created_at: string
}

export interface Project {
  id: number
  client_id: number
  name: string
  description: string | null
  status: Status
  sla_hours: number | null
  created_at: string
}

export interface ShipmentData {
  clientId: number
  projectId: number
  boxCount: number
  priority: string
  carrier: string
  trackingNumber: string
  notes: string
}

export interface Shipment {
  id: string
  clientId: number
  clientName: string
  projectId: number
  projectName: string
  boxCount: number
  priority: string
  status: string
  carrier: string
  trackingNumber: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface JobStep {
  id: string
  name: string
  order: number
  status: StepStatus
  operatorId?: number
  startTime?: string
  endTime?: string
}

export interface Job {
  id: string
  clientId: number
  clientName: string
  projectId: number
  projectName: string
  status: JobStatus
  priority: JobPriority
  steps: JobStep[]
  startTime: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: number
  user_id: number
  action: string
  entity_type: string
  entity_id: number
  details: string
  created_at: string
  user_name?: string // Joined field
}

export interface RolePermissions {
  canCreateUser: boolean
  canEditUser: boolean
  canDeleteUser: boolean
  canViewUsers: boolean
  canCreateClient: boolean
  canEditClient: boolean
  canDeleteClient: boolean
  canViewClients: boolean
  canCreateProject: boolean
  canEditProject: boolean
  canDeleteProject: boolean
  canViewProjects: boolean
  canManageJobs: boolean
  canViewJobs: boolean
  canViewReports: boolean
  canManageSettings: boolean
  canAccessReceiving: boolean
}

export interface DatabaseStats {
  users: number
  clients: number
  projects: number
  activeJobs: number
  completedJobs: number
  auditLogs: number
} 