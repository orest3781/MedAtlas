<template>
  <TransitionGroup
    tag="div"
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-2 opacity-0"
    class="fixed bottom-0 right-0 z-50 p-4 space-y-4"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm"
      :class="getToastClass(toast.type)"
    >
      <div class="flex-shrink-0">
        <component
          :is="getToastIcon(toast.type)"
          class="w-5 h-5"
          :class="getIconClass(toast.type)"
        />
      </div>
      <p class="text-sm font-medium" :class="getTextClass(toast.type)">
        {{ toast.message }}
      </p>
      <button
        @click="removeToast(toast.id)"
        class="flex-shrink-0 ml-auto"
        :class="getCloseButtonClass(toast.type)"
      >
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { TransitionGroup } from 'vue'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastClass = (type: ToastType): string => {
  const classes = {
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20'
  }
  return classes[type]
}

const getToastIcon = (type: ToastType) => {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }
  return icons[type]
}

const getIconClass = (type: ToastType): string => {
  const classes = {
    success: 'text-green-400 dark:text-green-300',
    error: 'text-red-400 dark:text-red-300',
    warning: 'text-yellow-400 dark:text-yellow-300',
    info: 'text-blue-400 dark:text-blue-300'
  }
  return classes[type]
}

const getTextClass = (type: ToastType): string => {
  const classes = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200'
  }
  return classes[type]
}

const getCloseButtonClass = (type: ToastType): string => {
  const classes = {
    success: 'text-green-500 hover:text-green-600 dark:text-green-300 dark:hover:text-green-200',
    error: 'text-red-500 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200',
    warning: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-300 dark:hover:text-yellow-200',
    info: 'text-blue-500 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200'
  }
  return classes[type]
}
</script> 