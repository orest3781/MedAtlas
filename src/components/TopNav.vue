<template>
  <div 
    v-if="!isAuthPage"
    class="h-16 bg-surface-dark border-b border-accent/20 fixed top-0 left-0 right-0 z-50"
  >
    <div class="h-full flex items-center justify-between w-full px-6">
      <!-- Logo and System Name -->
      <div class="flex items-center flex-1">
        <div class="flex flex-col items-start">
          <div class="text-lg font-bold tracking-wider flex items-center gap-[1px] relative">
            <span class="bg-gradient-to-r from-sky-400 to-sky-500 bg-clip-text text-transparent">Med</span>
            <span class="bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">Atlas</span>
            <div class="ekg-line absolute -bottom-2 w-full">
              <svg width="100%" height="12" viewBox="0 0 120 12" preserveAspectRatio="none">
                <path
                  class="ekg-path"
                  d="M 0,6 
                     L 18,6 
                     L 20,6 
                     L 22,2 
                     L 24,10 
                     L 26,1 
                     L 28,11 
                     L 30,6 
                     L 32,6 
                     L 120,6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="0.75"
                  pathLength="100"
                />
              </svg>
            </div>
          </div>
        </div>
        <div class="ml-4 flex items-center border-l border-white/10 pl-4">
          <div class="flex flex-col min-w-[140px]">
            <span class="text-sm font-medium text-white/70 truncate">{{ formattedTime }}</span>
            <span class="text-xs text-white/50 truncate">{{ formattedDate }}</span>
          </div>
        </div>
      </div>

      <!-- Center Navigation -->
      <div class="flex items-center justify-center flex-1">
        <div class="inline-flex items-center gap-1">
          <router-link
            v-if="hasAccess('ADMIN')"
            to="/admin"
            class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-white/5 focus:outline-none transition-colors"
            :class="[$route.path.startsWith('/admin') ? 'bg-primary text-white' : 'text-white/70']"
          >
            <UserGroupIcon class="h-5 w-5 mr-1.5" />
            Admin Panel
          </router-link>

          <router-link
            v-if="hasAccess('RECEIVING')"
            to="/receiving"
            class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-white/5 focus:outline-none transition-colors"
            :class="[$route.path === '/receiving' ? 'bg-primary text-white' : 'text-white/70']"
          >
            <ArrowDownTrayIcon class="h-5 w-5 mr-1.5" />
            Receiving
          </router-link>

          <router-link
            v-if="hasAccess('DASHBOARD')"
            to="/"
            class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-white/5 focus:outline-none transition-colors"
            :class="[$route.path === '/' ? 'bg-primary text-white' : 'text-white/70']"
          >
            <Squares2X2Icon class="h-5 w-5 mr-1.5" />
            Dashboard
          </router-link>

          <router-link
            v-if="hasAccess('QUEUE')"
            to="/queue"
            class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-white/5 focus:outline-none transition-colors"
            :class="[$route.path === '/queue' ? 'bg-primary text-white' : 'text-white/70']"
          >
            <QueueListIcon class="h-5 w-5 mr-1.5" />
            Queue
          </router-link>
        </div>
      </div>

      <!-- User Profile (Right-aligned) -->
      <div class="flex items-center justify-end flex-1">
        <div class="flex items-center space-x-2">
          <div :class="['h-8 w-8 rounded-full ring-2 ring-white/10 flex items-center justify-center', avatarStyle]">
            <span class="text-white text-sm font-medium">{{ userInitials }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-white text-sm font-medium">{{ userDisplayName }}</span>
            <span class="text-white/50 text-xs">{{ authStore.user?.role || 'Not logged in' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { 
  ListBulletIcon,
  Squares2X2Icon,
  QueueListIcon,
  ArrowDownTrayIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MedAtlasLogo from './MedAtlasLogo.vue'

const route = useRoute()
const authStore = useAuthStore()

// Time and Date handling
const currentTime = ref(new Date())

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(currentTime.value)
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(currentTime.value)
})

let timeInterval: number | undefined

onMounted(() => {
  // Update time every second
  timeInterval = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

const userDisplayName = computed(() => {
  return authStore.user?.name || 'Admin User'
})

const isActive = (path: string) => route.path === path

const hasAccess = (feature: string): boolean => {
  if (!authStore.isAuthenticated) return false

  switch (feature) {
    case 'RECEIVING':
      return authStore.canAccessReceiving
    case 'QUEUE':
      return authStore.canAccessQueue
    case 'DASHBOARD':
      return true
    default:
      return false
  }
}

const navItems = computed(() => [
  {
    name: 'Dashboard',
    path: '/',
    feature: 'DASHBOARD'
  },
  {
    name: 'Receiving',
    path: '/receiving',
    feature: 'RECEIVING'
  },
  {
    name: 'Queue',
    path: '/queue',
    feature: 'QUEUE'
  }
].filter(item => hasAccess(item.feature)))

const avatarStyle = computed(() => {
  switch (authStore.user?.role) {
    case 'ADMIN':
      return 'bg-red-500'
    case 'SUPERVISOR':
      return 'bg-purple-500'
    case 'LEAD_PRODUCTION_TECHNICIAN':
      return 'bg-blue-500'
    case 'PRODUCTION_TECHNICIAN':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
})

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'AU'
  const names = authStore.user.name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
})

const showUserProfile = computed(() => {
  return route.path === '/' || route.path === '/queue'
})

// Check if we're on an auth page
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/signin' || route.path === '/sign-in'
})
</script>

<style scoped>
.ekg-line {
  @apply text-sky-400/60;
  pointer-events: none;
}

.ekg-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: ekg-draw 2s linear infinite;
}

@keyframes ekg-draw {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: -100;
  }
}
</style> 