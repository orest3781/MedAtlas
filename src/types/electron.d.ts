import type { User, Client, Project, Shipment, Job, JobStep, AuditLog } from './database'
import { ShipmentData, Shipment } from '../composables/useShipments'

interface ElectronAPI {
  invoke(channel: string, ...args: any[]): Promise<any>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Auth
      login: (credentials: { email: string; password: string }) => Promise<any>
      logout: () => Promise<void>
      
      // Users
      getUsers: () => Promise<any[]>
      createUser: (userData: any) => Promise<any>
      updateUser: (id: number, userData: any) => Promise<any>
      archiveUser: (id: number, reason: string) => Promise<any>
      getArchivedUsers: () => Promise<any[]>
      
      // Clients
      getClients: () => Promise<any[]>
      createClient: (clientData: any) => Promise<any>
      updateClient: (id: number, clientData: any) => Promise<any>
      
      // Projects
      getProjects: () => Promise<any[]>
      createProject: (projectData: any) => Promise<any>
      
      // Jobs
      getJobs: () => Promise<any[]>
      createJob: (jobData: any) => Promise<any>
      updateJobStep: (jobId: string, stepData: any) => Promise<any>
      
      // System
      getStats: () => Promise<any>
      getLogs: (filters: any) => Promise<any[]>
      
      // Shipment operations
      createShipment: (data: ShipmentData) => Promise<{ data: Shipment }>
      listShipments: (filters?: {
        status?: string
        search?: string
        startDate?: string
        endDate?: string
      }) => Promise<{ data: Shipment[] }>
      updateShipmentStatus: (shipmentId: string, status: string) => Promise<{ data: Shipment }>
      generateLabel: (shipmentId: string) => Promise<{ data: { labelUrl: string } }>
      
      // Audit Logs
      getAuditLogs: (filters?: {
        userId?: string
        action?: string
        entityType?: string
        fromDate?: string
        toDate?: string
        limit?: number
      }) => Promise<AuditLog[]>
      
      // System
      getDatabaseStats: () => Promise<{
        users: number
        clients: number
        projects: number
        activeJobs: number
        completedJobs: number
        auditLogs: number
      }>
      backupDatabase: () => Promise<string>
      restoreDatabase: (backupPath: string) => Promise<void>
    }
  }
}

export {} 