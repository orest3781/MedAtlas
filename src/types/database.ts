import { Role } from './roles'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  created_at: string
  last_login: string | null
}

export interface Client {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  status: 'active' | 'inactive'
  sla_hours: number | null
  created_at: string
  client_name?: string
  client_contact_name?: string
}

export interface Shipment {
  id: string
  project_id: string
  tracking_number: string | null
  status: 'pending' | 'in_progress' | 'completed'
  box_count: number
  created_at: string
}

export interface Job {
  id: string
  shipment_id: string
  operator_id: string
  status: 'in_progress' | 'completed'
  current_step: JobStep['step_name']
  started_at: string
  completed_at: string | null
  tracking_number?: string
  box_count?: number
  project_name?: string
  client_name?: string
  steps?: JobStep[]
}

export interface JobStep {
  id: string
  job_id: string
  step_name: 'PREP' | 'SCAN' | 'QC' | 'INDEX' | 'REPREP'
  operator_id: string | null
  progress: number
  started_at: string | null
  completed_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: string
  created_at: string
  user_name?: string
}

export interface DatabaseStats {
  users: number
  clients: number
  projects: number
  activeJobs: number
  completedJobs: number
  auditLogs: number
} 