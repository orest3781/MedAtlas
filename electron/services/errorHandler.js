const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Error codes to categorize different types of errors
 */
const ErrorCodes = {
  // Database errors
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_INITIALIZATION_ERROR: 'DB_INITIALIZATION_ERROR',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // IPC errors
  IPC_HANDLER_NOT_FOUND: 'IPC_HANDLER_NOT_FOUND',
  IPC_INVALID_PARAMS: 'IPC_INVALID_PARAMS',
  
  // General errors
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_STATE_CONFLICT: 'RESOURCE_STATE_CONFLICT'
};

/**
 * Custom application error class with additional metadata
 */
class AppError extends Error {
  constructor(message, code = ErrorCodes.UNEXPECTED_ERROR, details = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Serializes the error for transmission via IPC
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * Error handler service for centralized error management
 */
class ErrorHandlerService {
  constructor() {
    this.logFilePath = null;
    this.errorListeners = [];
    this.isInitialized = false;
    this.shouldLogToConsole = true;
    this.shouldLogToFile = true;
  }

  /**
   * Initialize the error handler service
   */
  init() {
    if (this.isInitialized) return;

    try {
      // Set up log directory in the user data folder
      const userDataPath = app.isReady() 
        ? app.getPath('userData') 
        : path.join(process.env.APPDATA || process.env.HOME || '.', 'medatlas');
      
      const logDir = path.join(userDataPath, 'logs');
      
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Set log file path with date stamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFilePath = path.join(logDir, `error-log-${timestamp}.log`);
      
      this.isInitialized = true;
      this.log('Error handling service initialized', 'info');
    } catch (error) {
      console.error('Failed to initialize error handler service:', error);
      // Even if initialization fails, we still want to be able to handle errors
      this.isInitialized = true;
      this.shouldLogToFile = false;
    }
  }

  /**
   * Handle an error in a standardized way
   * @param {Error|AppError|string} error - The error to handle
   * @param {string} source - Source of the error (e.g., 'database', 'ipc', 'auth')
   * @param {Object} contextData - Additional context data for the error
   * @returns {AppError} A standardized AppError object
   */
  handleError(error, source = 'unknown', contextData = {}) {
    // Ensure service is initialized
    if (!this.isInitialized) {
      this.init();
    }

    // Convert string errors to AppError
    if (typeof error === 'string') {
      error = new AppError(error, ErrorCodes.UNEXPECTED_ERROR, contextData);
    }
    
    // Convert regular Errors to AppError
    if (!(error instanceof AppError)) {
      let code = ErrorCodes.UNEXPECTED_ERROR;
      
      // Try to infer error code from the error message or source
      if (source === 'database' || error.message.includes('database')) {
        code = ErrorCodes.DB_QUERY_ERROR;
      } else if (source === 'auth' || error.message.includes('auth')) {
        code = ErrorCodes.AUTH_UNAUTHORIZED;
      } else if (source === 'fs' || error.message.includes('file')) {
        code = ErrorCodes.FILE_SYSTEM_ERROR;
      }
      
      error = new AppError(
        error.message,
        code,
        contextData,
        error
      );
    }

    // Add source to details
    if (!error.details) error.details = {};
    error.details.source = source;
    
    // Log the error
    this.logError(error, contextData);
    
    // Notify error listeners
    this.notifyListeners(error);
    
    return error;
  }

  /**
   * Log an error or message
   * @param {AppError|Error|string} errorOrMessage - Error object or message to log
   * @param {string} level - Log level (error, warn, info)
   * @param {Object} additionalData - Additional data to log
   */
  log(errorOrMessage, level = 'error', additionalData = {}) {
    if (!this.isInitialized) {
      this.init();
    }

    const timestamp = new Date().toISOString();
    
    // Format the log entry
    let logEntry;
    if (errorOrMessage instanceof Error) {
      const serializedError = errorOrMessage instanceof AppError 
        ? errorOrMessage.toJSON()
        : {
            message: errorOrMessage.message,
            stack: errorOrMessage.stack
          };
          
      logEntry = {
        timestamp,
        level,
        ...serializedError,
        ...additionalData
      };
    } else {
      logEntry = {
        timestamp,
        level,
        message: errorOrMessage,
        ...additionalData
      };
    }
    
    // Convert to string for logging
    const logString = JSON.stringify(logEntry);
    
    // Log to console
    if (this.shouldLogToConsole) {
      const consoleMethod = level === 'error' ? 'error' 
        : level === 'warn' ? 'warn' 
        : 'log';
      console[consoleMethod](logString);
    }
    
    // Log to file
    if (this.shouldLogToFile && this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logString + '\n');
      } catch (e) {
        console.error('Failed to write to error log file:', e);
      }
    }
  }

  /**
   * Log an error specifically
   * @param {AppError|Error} error - The error to log
   * @param {Object} contextData - Additional context data
   */
  logError(error, contextData = {}) {
    this.log(error, 'error', contextData);
  }

  /**
   * Add a listener to be notified of errors
   * @param {Function} listener - Function to call when errors occur
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.errorListeners.push(listener);
    }
  }

  /**
   * Remove an error listener
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    const index = this.errorListeners.indexOf(listener);
    if (index !== -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners about an error
   * @param {AppError} error - The error that occurred
   */
  notifyListeners(error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
}

// Create and export a singleton instance
const errorHandler = new ErrorHandlerService();

module.exports = {
  errorHandler,
  AppError,
  ErrorCodes
}; 