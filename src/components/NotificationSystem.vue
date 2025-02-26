<template>
  <div class="notification-system fixed right-4 top-20 z-50 flex flex-col gap-2">
    <!-- Use transition-group for smooth animations when adding/removing notifications -->
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification px-4 py-3 rounded-lg shadow-lg max-w-md transform transition-all flex items-start gap-3',
          getNotificationClasses(notification.level)
        ]"
        @click="removeNotification(notification.id)"
      >
        <!-- Icon based on notification level -->
        <div>
          <!-- Success icon -->
          <svg v-if="notification.level === 'success'" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          
          <!-- Info icon -->
          <svg v-else-if="notification.level === 'info'" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
          </svg>
          
          <!-- Warning icon -->
          <svg v-else-if="notification.level === 'warning'" class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          
          <!-- Error icon -->
          <svg v-else class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        
        <!-- Notification content -->
        <div class="flex-1">
          <div v-if="notification.title" class="font-medium mb-0.5">{{ notification.title }}</div>
          <div class="text-sm">{{ notification.message }}</div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Interface for notification objects
const Notification = {
  id: String,
  title: String,
  message: String,
  level: String, // 'success', 'info', 'warning', 'error'
  autoDismiss: Boolean,
  dismissTimeout: Number
}

// Store notifications in a reactive array
const notifications = ref([])
const timeoutIds = ref({})

// Add notification to the stack
const addNotification = (notification) => {
  // Generate a unique ID if not provided
  const id = notification.id || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  // Set default properties
  const newNotification = {
    id,
    level: 'info',
    autoDismiss: true,
    dismissTimeout: 5000, // 5 seconds
    ...notification
  }
  
  // Add to the stack
  notifications.value.push(newNotification)
  
  // Set up auto-dismiss if enabled
  if (newNotification.autoDismiss) {
    timeoutIds.value[id] = setTimeout(() => {
      removeNotification(id)
    }, newNotification.dismissTimeout)
  }
  
  return id
}

// Remove notification by ID
const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
  
  // Clear timeout if it exists
  if (timeoutIds.value[id]) {
    clearTimeout(timeoutIds.value[id])
    delete timeoutIds.value[id]
  }
}

// Clear all notifications
const clearNotifications = () => {
  // Clear all timeouts
  Object.values(timeoutIds.value).forEach(timeoutId => {
    clearTimeout(timeoutId)
  })
  
  // Reset data
  timeoutIds.value = {}
  notifications.value = []
}

// Get CSS classes based on notification level
const getNotificationClasses = (level) => {
  switch (level) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
    default:
      return 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
  }
}

// Expose the notification system to the global window object
// so it can be used by the error handler
onMounted(() => {
  // Create notification system API
  window.notificationSystem = {
    addNotification,
    removeNotification,
    clearNotifications
  }
})

// Clean up on unmount
onUnmounted(() => {
  // Clear all timeouts to prevent memory leaks
  Object.values(timeoutIds.value).forEach(timeoutId => {
    clearTimeout(timeoutId)
  })
  
  // Remove global reference
  if (window.notificationSystem) {
    window.notificationSystem = undefined
  }
})

// Expose methods to be used by other components
defineExpose({
  addNotification,
  removeNotification,
  clearNotifications
})
</script>

<style scoped>
/* Transition animations for notifications */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.notification {
  cursor: pointer;
}
</style> 