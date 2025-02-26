import React from 'react';
import { useEffect, useState } from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center mb-6">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Something went wrong</h2>
        </div>
        
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Error details:</div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
            {error.message || 'Unknown error occurred'}
            {error.stack && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {error.stack.split('\n').slice(0, 3).join('\n')}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Report to main process error handler
    if (window.electronAPI?.errorHandler) {
      window.electronAPI.errorHandler.report({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        source: 'react'
      });
    }
    
    // Log to console
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetErrorBoundary={() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
          }}
        />
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary wrapper for functional components
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  
  const handleError = (e) => {
    console.error('Error caught by useErrorHandler:', e);
    setError(e);
    
    // Report to main process
    if (window.electronAPI?.errorHandler) {
      window.electronAPI.errorHandler.report(e);
    }
  };
  
  // This will re-throw the error during render to be caught by the nearest ErrorBoundary
  if (error) {
    throw error;
  }
  
  return handleError;
};

// Component to catch global errors and errors from the main process
export const GlobalErrorListener = () => {
  const handleError = useErrorHandler();
  
  useEffect(() => {
    // Listen for errors from the main process
    let removeListener = null;
    
    if (window.electronAPI?.errorHandler) {
      removeListener = window.electronAPI.errorHandler.onMainProcessError((error) => {
        console.warn('Error from main process:', error);
        
        // Show notification for main process errors
        // (instead of crashing the UI)
        if (window.notificationSystem) {
          window.notificationSystem.addNotification({
            title: 'System Error',
            message: `${error.message || 'Unknown error'}`,
            level: 'error',
            position: 'tr',
            autoDismiss: 5,
          });
        }
      });
    }
    
    // Global unhandled error handler
    const handleGlobalError = (event) => {
      handleError(event.error || new Error('Unknown error occurred'));
      // Prevent default browser error handling
      event.preventDefault();
    };
    
    // Global unhandled promise rejection handler
    const handleRejection = (event) => {
      handleError(event.reason || new Error('Unhandled Promise rejection'));
      // Prevent default browser error handling
      event.preventDefault();
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      if (removeListener) removeListener();
    };
  }, [handleError]);
  
  return null;
};

// Default export is the class component
export default ErrorBoundaryClass; 