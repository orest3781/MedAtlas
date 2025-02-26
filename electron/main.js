const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store')
const fs = require('fs')
const DatabaseService = require('./services/database.js')
const { errorHandler, AppError, ErrorCodes } = require('./services/errorHandler')
const { registerAuthHandlers } = require('./handlers/auth')
const { registerShipmentHandlers } = require('./handlers/shipmentHandlers')
const { registerDatabaseHandlers } = require('./handlers/databaseHandlers')

// Initialize error handler first
errorHandler.init()

// Log application start
errorHandler.log(`Application starting - ${app.getName()} v${app.getVersion()}`, 'info', {
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
  environment: process.env.NODE_ENV || 'production'
})

// Set up global error handlers
process.on('uncaughtException', (error) => {
  const appError = errorHandler.handleError(error, 'process', { type: 'uncaughtException' })
  
  // Show error dialog for uncaught exceptions in production
  if (process.env.NODE_ENV !== 'development') {
    dialog.showErrorBox(
      'Unexpected Error',
      `An unexpected error occurred: ${appError.message}\n\nThe application will now close.`
    )
  }
  
  // Force quit the app
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(
    reason instanceof Error ? reason : new Error(String(reason)), 
    'process', 
    { type: 'unhandledRejection' }
  )
})

// Initialize electron store
const store = new Store()

let mainWindow = null
let db

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  errorHandler.log('Another instance is already running, quitting', 'info')
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    errorHandler.log('Second instance detected, focusing main window', 'info')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Initialize database service
db = new DatabaseService()

// Global error handler for IPC requests
function setupGlobalIpcErrorHandler() {
  // Add a global error handler for IPC
  ipcMain.on('error', (event, error) => {
    errorHandler.handleError(error, 'renderer', { sender: event.sender.id })
  })

  // Intercept all ipcMain.handle calls to add consistent error handling
  const originalHandle = ipcMain.handle
  ipcMain.handle = function (channel, listener) {
    return originalHandle.call(ipcMain, channel, async (event, ...args) => {
      try {
        // Check if db is initialized
        if (channel.startsWith('users:') || 
            channel.startsWith('clients:') || 
            channel.startsWith('projects:') || 
            channel.startsWith('jobs:') || 
            channel.startsWith('audit:') || 
            channel.startsWith('system:')) {
          if (!db || !db.isReady()) {
            errorHandler.log(`Database not ready when handling ${channel}`, 'error')
            throw new AppError(
              'Database not initialized',
              ErrorCodes.DB_INITIALIZATION_ERROR,
              { channel }
            )
          }
        }
        return await listener(event, ...args)
      } catch (error) {
        const appError = error instanceof AppError 
          ? error 
          : errorHandler.handleError(
              error, 
              'ipc', 
              { 
                channel, 
                args: JSON.stringify(args, null, 2).substring(0, 1000), // Truncate for safety
                senderId: event.sender.id
              }
            )
        
        // Send error to renderer if in development mode
        if (process.env.NODE_ENV === 'development') {
          event.sender.send('main:error', appError.toJSON())
        }
        
        // Rethrow a serializable error object
        throw appError.toJSON()
      }
    })
  }
  
  // Add handler to get application logs
  ipcMain.handle('system:getLogs', async (event, maxCount = 100) => {
    try {
      // Only authorized users should be able to access logs
      // This would be better with proper authentication checks
      
      if (!errorHandler.logFilePath || !fs.existsSync(errorHandler.logFilePath)) {
        return { success: false, error: 'No log file available' }
      }
      
      const logs = fs.readFileSync(errorHandler.logFilePath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line)
          } catch (e) {
            return { message: line, parseError: true }
          }
        })
        .slice(-maxCount) // Get last maxCount entries
      
      return { success: true, logs }
    } catch (error) {
      throw errorHandler.handleError(error, 'system', { action: 'getLogs' })
    }
  })
}

// Fix cache permissions before app starts
function fixCachePermissions() {
  const userDataPath = app.getPath('userData');
  const cacheDirs = [
    path.join(userDataPath, 'Cache'),
    path.join(userDataPath, 'Code Cache'),
    path.join(userDataPath, 'GPUCache')
  ];
  
  cacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        errorHandler.log(`Removed cache directory: ${dir}`, 'info')
      }
    } catch (err) {
      errorHandler.handleError(err, 'cache', { action: 'clean', path: dir })
      console.warn(`Warning: Could not remove cache directory ${dir}:`, err.message);
    }
  });
}

async function createWindow() {
  try {
    // Initialize error handlers first
    setupGlobalIpcErrorHandler()
    
    // Fix cache permissions
    fixCachePermissions()
    
    // Initialize database first
    await db.init()
    errorHandler.log('Database initialized successfully', 'info')

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus()
      return mainWindow
    }

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      backgroundColor: '#0f1729',
      title: 'MedAtlas - Advanced Tracking, Logistics, & Administration System',
      frame: true,
      autoHideMenuBar: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
        // Disable disk cache to prevent permission issues
        cache: false
      },
      show: false
    })

    // Set Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self';",
            "script-src 'self';",
            "style-src 'self' 'unsafe-inline';",
            "img-src 'self' data: https:;",
            "font-src 'self' data:;",
            "connect-src 'self' https:;",
            "worker-src 'self';"
          ].join(' ')
        }
      })
    })

    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
      errorHandler.log('Main window ready and displayed', 'info')
    })

    // Set up error handler for renderer process crashes
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      errorHandler.handleError(
        new Error(`Renderer process crashed: ${details.reason}`),
        'renderer',
        details
      )
      
      if (process.env.NODE_ENV !== 'development') {
        dialog.showErrorBox(
          'Application Error',
          `The application encountered a problem: ${details.reason}.\n\nPlease restart the application.`
        )
      }
    })

    // Register IPC handlers
    registerAuthHandlers()
    registerShipmentHandlers()
    registerDatabaseHandlers(db)

    // Load the app
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      mainWindow.webContents.openDevTools()
      errorHandler.log('Loaded from dev server: ' + process.env.VITE_DEV_SERVER_URL, 'info')
    } else {
      const htmlPath = path.join(__dirname, '../dist/index.html')
      mainWindow.loadFile(htmlPath)
      errorHandler.log('Loaded from file: ' + htmlPath, 'info')
    }

    mainWindow.on('closed', () => {
      mainWindow = null
      errorHandler.log('Main window closed', 'info')
    })

    return mainWindow
  } catch (error) {
    const appError = errorHandler.handleError(error, 'window', { action: 'create' })
    
    dialog.showErrorBox(
      'Error Starting Application',
      `Failed to start the application: ${appError.message}`
    )
    
    app.quit()
  }
}

// Initialize database and IPC handlers
app.whenReady().then(async () => {
  try {
    // Initialize database first
    await db.init()
    errorHandler.log('Database initialized successfully', 'info')
    
    // Register all IPC handlers
    setupIpcHandlers()
    registerAuthHandlers()
    registerShipmentHandlers()
    registerDatabaseHandlers(db)
    
    if (!mainWindow) {
      createWindow()
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    const appError = errorHandler.handleError(error, 'app', { action: 'initialization' })
    
    dialog.showErrorBox(
      'Error Starting Application',
      `Failed to initialize application: ${appError.message}`
    )
    
    app.quit()
  }
})

app.on('window-all-closed', () => {
  errorHandler.log('All windows closed', 'info')
  
  if (process.platform !== 'darwin') {
    if (db) {
      db.close()
      db = null
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  errorHandler.log('Application quitting', 'info')
  
  if (db) {
    db.close()
    db = null
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy()
    mainWindow = null
  }
})

// Handle hot reloading in development
if (process.env.VITE_DEV_SERVER_URL) {
  try {
    require('electron-reloader')(module, {
      debug: process.env.NODE_ENV === 'development',
      ignore: [
        'node_modules/**/*',
        'dist/**/*',
        'dist-electron/**/*',
        // Don't watch Vue frontend files since they're handled by Vite
        'src/**/*',
        // Don't watch SQLite database files or journals
        '*.db',
        '*.db-journal',
        // Don't watch large storage folders
        '.git/**/*',
        'public/**/*'
      ],
      // Only watch main process files that we care about
      watchPatterns: [
        'electron/**/*.js',
        'electron/**/*.ts',
        'package.json'
      ],
      watchMain: true,
      // In development, we want to keep trying even if there are errors
      stopOnError: process.env.NODE_ENV === 'production',
      // Wait for current operations to finish before reloading
      gracefulReload: true
    });
    errorHandler.log('Electron hot reload configured', 'info');
  } catch (e) { 
    errorHandler.handleError(e, 'hot-reload', { action: 'configure' });
    // Don't fail the app if hot reload fails
  }
}

// Setup IPC handlers
function setupIpcHandlers() {
  // User handlers
  ipcMain.handle('users:create', async (event, userData) => {
    try {
      const user = await db.createUser(userData)
      await db.logAudit(event.sender.id, 'CREATE', 'USER', user.id, userData)
      return user
    } catch (error) {
      throw error // Will be caught by the global error handler
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

  // Add archive handlers
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