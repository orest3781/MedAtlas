const { contextBridge, ipcRenderer } = require('electron')

// Validate types for security reasons
function validateArgs(args) {
  // Types that can be cloned by the Structured Clone Algorithm
  // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
  const isValid = args.every(arg => {
    const type = typeof arg
    return arg === null ||
      arg === undefined ||
      type === 'boolean' ||
      type === 'number' ||
      type === 'string' ||
      type === 'object' || // includes arrays, maps, sets, dates, etc.
      type === 'bigint'
  })

  if (!isValid) {
    throw new Error('Invalid argument types. Arguments must be serializable.')
  }
}

// Error handling utility
const errorHandler = {
  init() {
    // Listen for errors from the main process
    ipcRenderer.on('main:error', (_, error) => {
      console.error('Error from main process:', error)
      
      // Dispatch an event that the app can listen for
      window.dispatchEvent(new CustomEvent('main:error', { detail: error }))
    })
  },
  
  send(error) {
    // Send errors to the main process
    if (error instanceof Error) {
      const serializedError = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        // Add any custom properties that exist on the error
        ...(Object.getOwnPropertyNames(error).reduce((acc, prop) => {
          if (prop !== 'message' && prop !== 'stack' && prop !== 'name') {
            acc[prop] = error[prop]
          }
          return acc
        }, {}))
      }
      
      ipcRenderer.send('error', serializedError)
    } else {
      ipcRenderer.send('error', { message: String(error) })
    }
  }
}

// Create the exposed API
const api = {
  // Auth methods
  auth: {
    login: async (username, password) => {
      validateArgs([username, password])
      try {
        return await ipcRenderer.invoke('auth:login', username, password)
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    logout: async () => {
      try {
        return await ipcRenderer.invoke('auth:logout')
      } catch (error) {
        console.error('Logout failed:', error)
        throw error
      }
    },
    getCurrentUser: async () => {
      try {
        return await ipcRenderer.invoke('auth:getCurrentUser')
      } catch (error) {
        console.error('Get current user failed:', error)
        throw error
      }
    }
  },
  
  // Database methods - users
  users: {
    getAll: async () => {
      try {
        return await ipcRenderer.invoke('users:getAll')
      } catch (error) {
        console.error('Get all users failed:', error)
        throw error
      }
    },
    get: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('users:get', id)
      } catch (error) {
        console.error(`Get user ${id} failed:`, error)
        throw error
      }
    },
    create: async (userData) => {
      validateArgs([userData])
      try {
        return await ipcRenderer.invoke('users:create', userData)
      } catch (error) {
        console.error('Create user failed:', error)
        throw error
      }
    },
    update: async (id, userData) => {
      validateArgs([id, userData])
      try {
        return await ipcRenderer.invoke('users:update', id, userData)
      } catch (error) {
        console.error(`Update user ${id} failed:`, error)
        throw error
      }
    },
    archive: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('users:archive', id)
      } catch (error) {
        console.error(`Archive user ${id} failed:`, error)
        throw error
      }
    }
  },
  
  // Database methods - clients
  clients: {
    getAll: async () => {
      try {
        return await ipcRenderer.invoke('clients:getAll')
      } catch (error) {
        console.error('Get all clients failed:', error)
        throw error
      }
    },
    get: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('clients:get', id)
      } catch (error) {
        console.error(`Get client ${id} failed:`, error)
        throw error
      }
    },
    create: async (clientData) => {
      validateArgs([clientData])
      try {
        return await ipcRenderer.invoke('clients:create', clientData)
      } catch (error) {
        console.error('Create client failed:', error)
        throw error
      }
    },
    update: async (id, clientData) => {
      validateArgs([id, clientData])
      try {
        return await ipcRenderer.invoke('clients:update', id, clientData)
      } catch (error) {
        console.error(`Update client ${id} failed:`, error)
        throw error
      }
    },
    archive: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('clients:archive', id)
      } catch (error) {
        console.error(`Archive client ${id} failed:`, error)
        throw error
      }
    }
  },
  
  // Database methods - projects
  projects: {
    getAll: async () => {
      try {
        return await ipcRenderer.invoke('projects:getAll')
      } catch (error) {
        console.error('Get all projects failed:', error)
        throw error
      }
    },
    getByClient: async (clientId) => {
      validateArgs([clientId])
      try {
        return await ipcRenderer.invoke('projects:getByClient', clientId)
      } catch (error) {
        console.error(`Get projects for client ${clientId} failed:`, error)
        throw error
      }
    },
    get: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('projects:get', id)
      } catch (error) {
        console.error(`Get project ${id} failed:`, error)
        throw error
      }
    },
    create: async (projectData) => {
      validateArgs([projectData])
      try {
        return await ipcRenderer.invoke('projects:create', projectData)
      } catch (error) {
        console.error('Create project failed:', error)
        throw error
      }
    },
    update: async (id, projectData) => {
      validateArgs([id, projectData])
      try {
        return await ipcRenderer.invoke('projects:update', id, projectData)
      } catch (error) {
        console.error(`Update project ${id} failed:`, error)
        throw error
      }
    },
    archive: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('projects:archive', id)
      } catch (error) {
        console.error(`Archive project ${id} failed:`, error)
        throw error
      }
    }
  },
  
  // Database methods - jobs
  jobs: {
    getAll: async () => {
      try {
        return await ipcRenderer.invoke('jobs:getAll')
      } catch (error) {
        console.error('Get all jobs failed:', error)
        throw error
      }
    },
    getByProject: async (projectId) => {
      validateArgs([projectId])
      try {
        return await ipcRenderer.invoke('jobs:getByProject', projectId)
      } catch (error) {
        console.error(`Get jobs for project ${projectId} failed:`, error)
        throw error
      }
    },
    get: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('jobs:get', id)
      } catch (error) {
        console.error(`Get job ${id} failed:`, error)
        throw error
      }
    },
    create: async (jobData) => {
      validateArgs([jobData])
      try {
        return await ipcRenderer.invoke('jobs:create', jobData)
      } catch (error) {
        console.error('Create job failed:', error)
        throw error
      }
    },
    update: async (id, jobData) => {
      validateArgs([id, jobData])
      try {
        return await ipcRenderer.invoke('jobs:update', id, jobData)
      } catch (error) {
        console.error(`Update job ${id} failed:`, error)
        throw error
      }
    },
    archive: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('jobs:archive', id)
      } catch (error) {
        console.error(`Archive job ${id} failed:`, error)
        throw error
      }
    }
  },
  
  // Shipment methods
  shipments: {
    getAll: async () => {
      try {
        return await ipcRenderer.invoke('shipments:getAll')
      } catch (error) {
        console.error('Get all shipments failed:', error)
        throw error
      }
    },
    getByJob: async (jobId) => {
      validateArgs([jobId])
      try {
        return await ipcRenderer.invoke('shipments:getByJob', jobId)
      } catch (error) {
        console.error(`Get shipments for job ${jobId} failed:`, error)
        throw error
      }
    },
    get: async (id) => {
      validateArgs([id])
      try {
        return await ipcRenderer.invoke('shipments:get', id)
      } catch (error) {
        console.error(`Get shipment ${id} failed:`, error)
        throw error
      }
    },
    create: async (shipmentData) => {
      validateArgs([shipmentData])
      try {
        return await ipcRenderer.invoke('shipments:create', shipmentData)
      } catch (error) {
        console.error('Create shipment failed:', error)
        throw error
      }
    },
    update: async (id, shipmentData) => {
      validateArgs([id, shipmentData])
      try {
        return await ipcRenderer.invoke('shipments:update', id, shipmentData)
      } catch (error) {
        console.error(`Update shipment ${id} failed:`, error)
        throw error
      }
    },
    updateStatus: async (id, status, notes) => {
      validateArgs([id, status, notes])
      try {
        return await ipcRenderer.invoke('shipments:updateStatus', id, status, notes)
      } catch (error) {
        console.error(`Update shipment ${id} status failed:`, error)
        throw error
      }
    }
  },
  
  // System methods
  system: {
    getDatabaseStats: async () => {
      try {
        return await ipcRenderer.invoke('system:getDatabaseStats')
      } catch (error) {
        console.error('Get database stats failed:', error)
        throw error
      }
    },
    getSystemInfo: async () => {
      try {
        return await ipcRenderer.invoke('system:getSystemInfo')
      } catch (error) {
        console.error('Get system info failed:', error)
        throw error
      }
    },
    getLogs: async (maxCount = 100) => {
      validateArgs([maxCount])
      try {
        return await ipcRenderer.invoke('system:getLogs', maxCount)
      } catch (error) {
        console.error('Get logs failed:', error)
        throw error
      }
    }
  },
  
  // Error handling
  errorHandler: {
    // Allow the renderer to send errors to the main process
    report: (error) => {
      try {
        errorHandler.send(error)
      } catch (sendError) {
        console.error('Failed to send error to main process:', sendError)
      }
    },
    
    // Add a listener for errors from the main process
    onMainProcessError: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function')
      }
      
      // Add event listener
      window.addEventListener('main:error', (event) => {
        callback(event.detail)
      })
      
      // Return a function to remove the listener
      return () => {
        window.removeEventListener('main:error', callback)
      }
    }
  }
}

// Expose protected methods for the renderer process through a secure contextBridge
contextBridge.exposeInMainWorld('electronAPI', api)

// Initialize error handling
errorHandler.init()

// Additional error handling for uncaught exceptions in the renderer
window.addEventListener('error', (event) => {
  errorHandler.send(event.error || new Error(event.message))
})

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.send(event.reason || new Error('Unhandled Promise rejection'))
})

console.log('Preload script loaded successfully') 