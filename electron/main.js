const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')
const DatabaseService = require('./services/database')

// Initialize electron store
const store = new Store()

let mainWindow
let db

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function setupIpcHandlers() {
  // Auth handlers
  ipcMain.handle('auth:login', async (event, credentials) => {
    try {
      const user = await db.login(credentials)
      return user
    } catch (error) {
      throw new Error(error.message)
    }
  })

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

  // Client handlers
  ipcMain.handle('clients:create', async (event, clientData) => {
    try {
      const client = await db.createClient(clientData)
      await db.logAudit(event.sender.id, 'CREATE', 'CLIENT', client.id, clientData)
      return client
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('clients:getAll', async () => {
    try {
      return await db.getClients()
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
  ipcMain.handle('projects:create', async (event, projectData) => {
    try {
      const project = await db.createProject(projectData)
      await db.logAudit(event.sender.id, 'CREATE', 'PROJECT', project.id, projectData)
      return project
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('projects:getAll', async () => {
    try {
      return await db.getProjects()
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Job handlers
  ipcMain.handle('jobs:create', async (event, jobData) => {
    try {
      const job = await db.createJob(jobData)
      await db.logAudit(event.sender.id, 'CREATE', 'JOB', job.id, jobData)
      return job
    } catch (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('jobs:getAll', async () => {
    try {
      return await db.getJobs()
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

  // Audit log handlers
  ipcMain.handle('audit:getLogs', async (event, filters) => {
    try {
      return await db.getAuditLogs(filters)
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
}

app.whenReady().then(() => {
  db = new DatabaseService()
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup
app.on('before-quit', () => {
  if (db) {
    db.close()
  }
}) 