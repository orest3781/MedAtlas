<template>
  <div class="min-h-screen bg-[#0f1729] flex">
    <!-- Error Display -->
    <div v-if="error" class="fixed inset-0 flex items-center justify-center z-50 bg-[#0f1729]">
      <div class="bg-surface-dark p-6 rounded-lg border border-error/20 max-w-md">
        <h3 class="text-error text-lg font-medium mb-2">Application Error</h3>
        <p class="text-white/70 mb-4">{{ error.message }}</p>
        <button 
          @click="clearError(); window.location.reload()" 
          class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>

    <!-- NotificationSystem Component -->
    <NotificationSystem ref="notificationSystem" />

    <!-- Left Sidebar - Ready for Delivery -->
    <Transition name="nav">
      <nav v-if="!isAuthPage && !isKioskMode && !isAdminRoute && !isReceivingRoute" 
        :class="[
          'w-80 fixed left-0 z-10 border-r border-accent/20 bg-[#0f1729] px-4 py-4',
          !isAuthPage ? 'top-16 h-[calc(100vh-4rem)]' : 'top-0 h-screen'
        ]"
      >
        <!-- Ready for Delivery -->
        <div class="mb-6">
          <div class="px-2 mb-4 flex items-center justify-between">
            <span class="text-[10px] text-white/40 font-medium uppercase tracking-wider">Ready for Delivery</span>
            <span class="text-[10px] text-success px-2 py-1 rounded-full bg-success/10">{{ completedJobs.length }}</span>
          </div>
          <TransitionGroup 
            name="completed" 
            tag="div" 
            class="space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-surface-darker px-1"
          >
            <div v-for="job in completedJobs" :key="job.id" 
                 class="p-4 bg-surface-dark rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
              <div class="text-sm font-medium text-white/80 truncate">{{ job.clientName }}</div>
              <div class="text-xs text-white/40 truncate">{{ job.projectName }}</div>
              <div class="text-xs text-white/40 font-mono truncate">{{ job.jobId }}</div>
              <div class="mt-3 flex items-center gap-2">
                <span class="text-xs text-success bg-success/10 px-2.5 py-1 rounded">Complete</span>
                <span class="text-xs text-white/40">{{ formatElapsedTime(job.steps.REPREP.lastUpdated) }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </nav>
    </Transition>

    <!-- Main Content Area -->
    <div :class="[
      'flex-1 transition-all duration-300 ease-in-out',
      !isKioskMode && !isAdminRoute && !isAuthPage && !isReceivingRoute && 'ml-80 mr-80'
    ]">
      <!-- Top Navigation -->
      <TopNav />

      <div :class="[
        'min-h-screen w-full',
        !isKioskMode && !isAuthPage && 'pt-16'
      ]">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <Suspense>
              <template #default>
                <div class="w-full">
                  <component :is="Component" />
                </div>
              </template>
              <template #fallback>
                <div class="flex items-center justify-center h-screen">
                  <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              </template>
            </Suspense>
          </transition>
        </router-view>
      </div>
    </div>

    <!-- Right Navigation -->
    <Transition name="nav">
      <nav v-if="!isAuthPage && !isKioskMode && !isAdminRoute && !isReceivingRoute" 
        :class="[
          'w-80 fixed right-0 z-10 border-l border-accent/20 bg-[#0f1729] px-2',
          !isAuthPage ? 'top-16 h-[calc(100vh-4rem)]' : 'top-0 h-screen'
        ]"
      >
        <!-- Quick Stats -->
        <div class="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-surface-darker">
          <div class="mb-6">
            <div class="px-2 mb-2">
              <span class="text-[10px] text-white/40 font-medium uppercase tracking-wider">Quick Stats</span>
            </div>
            <div class="p-3 bg-surface-dark rounded-lg border border-white/10">
              <div class="text-white/60 text-sm mb-1">Active Jobs</div>
              <div class="text-white font-medium text-lg">{{ activeJobs.length }}</div>
            </div>
            <div class="p-3 bg-surface-dark rounded-lg border border-white/10 mt-2">
              <div class="text-white/60 text-sm mb-1">Completed</div>
              <div class="text-white font-medium text-lg">{{ completedJobs.length }}</div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="mb-6">
            <div class="px-2 mb-2">
              <span class="text-[10px] text-white/40 font-medium uppercase tracking-wider">Activity</span>
            </div>
            <div class="p-3 bg-surface-dark rounded-lg border border-white/10">
              <div class="text-white/60 text-sm leading-tight">New shipment added to Project 001</div>
              <div class="text-white/40 text-xs mt-1">2 mins ago</div>
            </div>
            <div class="p-3 bg-surface-dark rounded-lg border border-white/10 mt-2">
              <div class="text-white/60 text-sm leading-tight">SLA alert for Client 0023</div>
              <div class="text-white/40 text-xs mt-1">15 mins ago</div>
            </div>
          </div>
        </div>
      </nav>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useJobStore } from './stores/jobs'
import { useAuthStore } from './stores/auth'
import { ref, onMounted, computed, onErrorCaptured, provide } from 'vue'
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline'
import TopNav from './components/TopNav.vue'
import { useErrorHandler } from './composables/useErrorHandler'
import NotificationSystem from './components/NotificationSystem.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const jobStore = useJobStore()
const notificationSystem = ref(null)

const { completedJobs, activeJobs } = storeToRefs(jobStore)
const { error, handleError, clearError } = useErrorHandler()

// Make error handler available to all components
provide('errorHandler', { handleError, clearError })

// Enhanced error handling
onErrorCaptured((e: Error, instance, info) => {
  console.error(`Global error caught from ${instance?.$options?.name || 'unknown component'}:`, e, info)
  handleError(e, { 
    showNotification: true,
    reportToMain: true,
    // Don't rethrow as we're handling it here
    rethrow: false
  })
  
  // Return false to prevent the error from propagating further
  return false
})

// Date time handling
const currentDateTime = ref('')
let timeInterval: number | undefined

const updateDateTime = () => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  currentDateTime.value = now.toLocaleDateString('en-US', options)
}

onMounted(() => {
  try {
    updateDateTime()
    timeInterval = window.setInterval(updateDateTime, 1000)

    // Initialize the electron API connection
    if (window.electronAPI) {
      console.log('Electron API available')
      
      // Test for connectivity with main process
      window.electronAPI.system.getSystemInfo()
        .then(info => {
          console.log('System info:', info)
        })
        .catch(err => {
          handleError(err, { showNotification: true })
        })
    }

    // Initialize stores if needed
    if (!authStore.isAuthenticated && route.path !== '/login') {
      router.push('/login')
    }
  } catch (e) {
    handleError(e, { 
      showNotification: true,
      reportToMain: true
    })
  }
})

onMounted(() => {
  return () => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
  }
})

const formatElapsedTime = (timestamp: string): string => {
  const now = new Date()
  const updated = new Date(timestamp)
  const diffInMinutes: number = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}h${minutes}m ago`
  }
}

const isKioskMode = computed(() => route.meta.layout === 'kiosk')
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/signin' || route.path === '/sign-in'
})
const isReceivingRoute = computed(() => route.path === '/receiving')
</script>

<style>
/* Remove fade transitions */
.instant-enter-active,
.instant-leave-active {
  transition: none;
}

.instant-enter-from,
.instant-leave-to {
  opacity: 0;
}

/* Job card animations */
.job-move, 
.job-enter-active,
.job-leave-active {
  transition: all 0.5s ease;
}

.job-enter-from,
.job-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Ensure proper stacking during move */
.job-leave-active {
  position: absolute;
}

/* Completed jobs drawer animations */
.completed-enter-active,
.completed-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.completed-enter-from,
.completed-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateX(-20px);
}

/* Hover animations */
.hover-slide {
  transition: transform 0.2s ease;
}

.hover-slide:hover {
  transform: translateX(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Navigation transitions */
.nav-enter-active,
.nav-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.nav-enter-from,
.nav-leave-to {
  opacity: 0;
}

/* Left nav specific */
nav:first-of-type.nav-enter-from,
nav:first-of-type.nav-leave-to {
  transform: translateX(-20px);
}

/* Right nav specific */
nav:last-of-type.nav-enter-from,
nav:last-of-type.nav-leave-to {
  transform: translateX(20px);
}
</style>