import type { User, Client, Project, Shipment, Job, JobStep, AuditLog } from './database'

declare global {
  interface Window {
    api: {
      // Auth
      login: (credentials: { username: string; password: string }) => Promise<User>
      
      // Users
      createUser: (userData: Partial<User>) => Promise<User>
      getUsers: () => Promise<User[]>
      updateUser: (id: string, userData: Partial<User>) => Promise<User>
      deleteUser: (id: string) => Promise<void>
      
      // Clients
      createClient: (clientData: Partial<Client>) => Promise<Client>
      getClients: () => Promise<Client[]>
      updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>
      deleteClient: (id: string) => Promise<void>
      
      // Projects
      createProject: (projectData: Partial<Project>) => Promise<Project>
      getProjects: () => Promise<Project[]>
      updateProject: (id: string, projectData: Partial<Project>) => Promise<Project>
      deleteProject: (id: string) => Promise<void>
      
      // Shipments
      createShipment: (shipmentData: Partial<Shipment>) => Promise<Shipment>
      getShipments: () => Promise<Shipment[]>
      updateShipment: (id: string, shipmentData: Partial<Shipment>) => Promise<Shipment>
      deleteShipment: (id: string) => Promise<void>
      
      // Jobs
      createJob: (jobData: Partial<Job>) => Promise<Job>
      getJobs: () => Promise<Job[]>
      updateJob: (id: string, jobData: Partial<Job>) => Promise<Job>
      deleteJob: (id: string) => Promise<void>
      updateJobStep: (jobId: string, stepData: {
        stepName: JobStep['step_name']
        progress: number
        operatorId: string
      }) => Promise<Job>
      
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