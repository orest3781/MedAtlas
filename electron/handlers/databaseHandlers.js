const { ipcMain } = require('electron')
let db

/**
 * Register all database-related IPC handlers
 * @param {import('../services/database')} databaseService The database service instance
 */
function registerDatabaseHandlers(databaseService) {
  // Store the database service reference
  db = databaseService
  
  if (!db || !db.isReady()) {
    console.warn('Warning: Database not ready when registering handlers')
  }

  // User handlers
  ipcMain.handle('users:create', async (event, userData) => {
    try {
      const user = await db.createUser(userData)
      await db.logAudit(event.sender.id, 'CREATE', 'USER', user.id, userData)
      return user
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('users:getAll', async () => {
    try {
      return await db.getUsers()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('users:update', async (event, id, userData) => {
    try {
      const user = await db.updateUser(id, userData)
      await db.logAudit(event.sender.id, 'UPDATE', 'USER', id, userData)
      return user
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('users:archive', async (event, id, reason) => {
    try {
      const archivedUser = await db.archiveUser(id, reason, event.sender.id)
      await db.logAudit(event.sender.id, 'ARCHIVE', 'USER', id, { reason })
      return archivedUser
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('users:getArchived', async () => {
    try {
      return await db.getArchivedUsers()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Client handlers
  ipcMain.handle('clients:getAll', async () => {
    try {
      return await db.getClients()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('clients:create', async (event, clientData) => {
    try {
      const client = await db.createClient(clientData)
      await db.logAudit(event.sender.id, 'CREATE', 'CLIENT', client.id, clientData)
      return client
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('clients:update', async (event, id, clientData) => {
    try {
      const client = await db.updateClient(id, clientData)
      await db.logAudit(event.sender.id, 'UPDATE', 'CLIENT', id, clientData)
      return client
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Project handlers
  ipcMain.handle('projects:getAll', async () => {
    try {
      return await db.getProjects()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('projects:create', async (event, projectData) => {
    try {
      const project = await db.createProject(projectData)
      await db.logAudit(event.sender.id, 'CREATE', 'PROJECT', project.id, projectData)
      return project
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Job handlers
  ipcMain.handle('jobs:getAll', async () => {
    try {
      return await db.getJobs()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('jobs:create', async (event, jobData) => {
    try {
      const job = await db.createJob(jobData)
      await db.logAudit(event.sender.id, 'CREATE', 'JOB', job.id, jobData)
      return job
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('jobs:updateStep', async (event, jobId, stepData) => {
    try {
      const job = await db.updateJobStep(jobId, stepData.stepName, {
        progress: stepData.progress,
        operatorId: stepData.operatorId
      })
      await db.logAudit(event.sender.id, 'UPDATE', 'JOB_STEP', jobId, stepData)
      return job
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Shipment handlers
  ipcMain.handle('shipments:getAll', async () => {
    try {
      return await db.getShipments()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('shipments:create', async (event, shipmentData) => {
    try {
      const shipment = await db.createShipment(shipmentData)
      await db.logAudit(event.sender.id, 'CREATE', 'SHIPMENT', shipment.id, shipmentData)
      return shipment
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('shipments:updateStatus', async (event, id, status) => {
    try {
      const shipment = await db.updateShipmentStatus(id, status)
      await db.logAudit(event.sender.id, 'UPDATE', 'SHIPMENT', id, { status })
      return shipment
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // System handlers
  ipcMain.handle('system:getStats', async () => {
    try {
      return await db.getDatabaseStats()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('audit:getLogs', async (event, filters) => {
    try {
      return await db.getAuditLogs(filters)
    } catch (error) {
      throw new Error(error.message)
    }
  })

  console.log('All database IPC handlers registered successfully')
}

module.exports = {
  registerDatabaseHandlers
} 