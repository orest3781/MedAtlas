import { ref, onMounted, onUnmounted } from 'vue'

interface ErrorOptions {
  showNotification?: boolean;
  reportToMain?: boolean;
  rethrow?: boolean;
}

interface MainProcessError {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  data?: any;
}

const defaultOptions: ErrorOptions = {
  showNotification: true,
  reportToMain: true,
  rethrow: false
}

/**
 * Composable for standardized error handling across the Vue application
 */
export function useErrorHandler() {
  const error = ref<Error | null>(null)
  const isHandlingError = ref(false)
  
  // Global error notification system reference
  let notificationSystem: any = null
  
  // Keep track of the main process error handler cleanup function
  let cleanupMainProcessErrorListener: (() => void) | null = null
  
  /**
   * Initialize the error notification system and main process error listeners
   */
  const initErrorHandling = () => {
    // Store reference to notification system if it exists
    if (window.notificationSystem) {
      notificationSystem = window.notificationSystem
    }
    
    // Set up listener for main process errors
    if (window.electronAPI?.errorHandler) {
      cleanupMainProcessErrorListener = window.electronAPI.errorHandler.onMainProcessError(
        (mainError: MainProcessError) => {
          handleMainProcessError(mainError)
        }
      )
    }
  }
  
  /**
   * Handle errors from the main Electron process
   */
  const handleMainProcessError = (mainError: MainProcessError) => {
    console.warn('[Main Process Error]', mainError)
    
    if (notificationSystem) {
      notificationSystem.addNotification({
        title: `System Error${mainError.code ? ` (${mainError.code})` : ''}`,
        message: mainError.message || 'Unknown error occurred',
        level: 'error',
        position: 'tr', // top-right
        autoDismiss: 10
      })
    }
  }
  
  /**
   * Handle errors from the renderer process
   */
  const handleError = (err: unknown, options: ErrorOptions = defaultOptions) => {
    // Prevent handling the same error multiple times
    if (isHandlingError.value) return
    
    isHandlingError.value = true
    const mergedOptions = { ...defaultOptions, ...options }
    const normalizedError = err instanceof Error ? err : new Error(String(err))
    
    console.error('[Error Handler]', normalizedError)
    error.value = normalizedError
    
    // Send error to main process for logging
    if (mergedOptions.reportToMain && window.electronAPI?.errorHandler) {
      window.electronAPI.errorHandler.report({
        message: normalizedError.message,
        stack: normalizedError.stack,
        name: normalizedError.name,
        // Add additional properties if available
        ...(normalizedError as any)
      })
    }
    
    // Show notification if requested and notification system exists
    if (mergedOptions.showNotification && notificationSystem) {
      notificationSystem.addNotification({
        title: 'Application Error',
        message: normalizedError.message || 'An unexpected error occurred',
        level: 'error',
        position: 'tr',
        autoDismiss: 5
      })
    }
    
    // Reset error handling state
    setTimeout(() => {
      isHandlingError.value = false
    }, 100)
    
    // Optionally rethrow for error boundaries to catch
    if (mergedOptions.rethrow) {
      throw normalizedError
    }
    
    return normalizedError
  }
  
  /**
   * Clear the current error
   */
  const clearError = () => {
    error.value = null
  }
  
  /**
   * Create a wrapped function that catches errors
   */
  const withErrorHandling = <T extends (...args: any[]) => any>(
    fn: T,
    options: ErrorOptions = defaultOptions
  ): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        const result = fn(...args)
        
        // Handle promises
        if (result instanceof Promise) {
          return result.catch((err) => {
            handleError(err, options)
            return undefined as any
          }) as ReturnType<T>
        }
        
        return result
      } catch (err) {
        handleError(err, options)
        return undefined as any
      }
    }
  }
  
  // Set up error handling on component mount
  onMounted(() => {
    initErrorHandling()
  })
  
  // Clean up on component unmount
  onUnmounted(() => {
    if (cleanupMainProcessErrorListener) {
      cleanupMainProcessErrorListener()
      cleanupMainProcessErrorListener = null
    }
  })
  
  return {
    error,
    handleError,
    clearError,
    withErrorHandling
  }
}

// Type definitions for the window object extensions
declare global {
  interface Window {
    notificationSystem?: any;
    electronAPI?: {
      errorHandler: {
        report: (error: any) => void;
        onMainProcessError: (callback: (error: MainProcessError) => void) => () => void;
      };
    };
  }
} 