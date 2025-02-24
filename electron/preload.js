import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  
  // Users
  createUser: (userData) => ipcRenderer.invoke('users:create', userData),
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  updateUser: (id, userData) => ipcRenderer.invoke('users:update', id, userData),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),
  
  // Clients
  createClient: (clientData) => ipcRenderer.invoke('clients:create', clientData),
  getClients: () => ipcRenderer.invoke('clients:getAll'),
  updateClient: (id, clientData) => ipcRenderer.invoke('clients:update', id, clientData),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),
  
  // Projects
  createProject: (projectData) => ipcRenderer.invoke('projects:create', projectData),
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  updateProject: (id, projectData) => ipcRenderer.invoke('projects:update', id, projectData),
  deleteProject: (id) => ipcRenderer.invoke('projects:delete', id),
  
  // Shipments
  createShipment: (shipmentData) => ipcRenderer.invoke('shipments:create', shipmentData),
  getShipments: () => ipcRenderer.invoke('shipments:getAll'),
  updateShipment: (id, shipmentData) => ipcRenderer.invoke('shipments:update', id, shipmentData),
  deleteShipment: (id) => ipcRenderer.invoke('shipments:delete', id),
  
  // Jobs
  createJob: (jobData) => ipcRenderer.invoke('jobs:create', jobData),
  getJobs: () => ipcRenderer.invoke('jobs:getAll'),
  updateJob: (id, jobData) => ipcRenderer.invoke('jobs:update', id, jobData),
  deleteJob: (id) => ipcRenderer.invoke('jobs:delete', id),
  updateJobStep: (jobId, stepData) => ipcRenderer.invoke('jobs:updateStep', jobId, stepData),
  
  // Audit Logs
  getAuditLogs: (filters) => ipcRenderer.invoke('audit:getLogs', filters),
  
  // System
  getDatabaseStats: () => ipcRenderer.invoke('system:getStats'),
  backupDatabase: () => ipcRenderer.invoke('system:backup'),
  restoreDatabase: (backupPath) => ipcRenderer.invoke('system:restore', backupPath)
}) 