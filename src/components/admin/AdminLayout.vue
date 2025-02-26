<!-- AdminLayout.vue -->
<template>
  <div class="min-h-screen bg-[#0f1729]">
    <!-- Admin Header -->
    <header class="sticky top-0 z-40 bg-surface-dark border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-semibold text-white">Admin Panel</h1>
            <!-- Desktop Navigation -->
            <nav class="hidden md:flex space-x-8">
              <router-link
                v-for="item in navigationItems"
                :key="item.path"
                :to="item.path"
                class="text-sm font-medium transition-colors relative group"
                :class="[
                  $route.path.startsWith(item.path)
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <component :is="item.icon" class="w-5 h-5" />
                  <span>{{ item.name }}</span>
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform"
                  :class="{ '!scale-x-100': $route.path.startsWith(item.path) }"
                ></div>
              </router-link>
            </nav>
          </div>
          
          <!-- Mobile Menu Button -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden rounded-md p-2 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Bars3Icon v-if="!mobileMenuOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Menu -->
    <div
      v-show="mobileMenuOpen"
      class="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
      @click="mobileMenuOpen = false"
    >
      <div 
        class="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-surface-dark p-6"
        @click.stop
      >
        <nav class="flex flex-col space-y-2">
          <router-link
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              $route.path.startsWith(item.path)
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumbs -->
      <div class="mb-8">
        <nav class="flex" aria-label="Breadcrumb">
          <ol role="list" class="flex items-center space-x-4">
            <li>
              <div>
                <router-link to="/admin" class="text-white/60 hover:text-white">
                  <HomeIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span class="sr-only">Home</span>
                </router-link>
              </div>
            </li>
            <li v-for="(crumb, index) in breadcrumbs" :key="index">
              <div class="flex items-center">
                <ChevronRightIcon class="h-5 w-5 flex-shrink-0 text-white/40" aria-hidden="true" />
                <router-link
                  :to="crumb.path"
                  :class="[
                    'ml-4 text-sm font-medium',
                    index === breadcrumbs.length - 1
                      ? 'text-white cursor-default'
                      : 'text-white/60 hover:text-white'
                  ]"
                  :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
                >
                  {{ crumb.name }}
                </router-link>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-white">{{ currentPageTitle }}</h1>
        <p class="mt-2 text-sm text-white/60">{{ currentPageDescription }}</p>
      </div>

      <!-- Page Content -->
      <div class="bg-surface-dark rounded-xl border border-white/10 overflow-hidden">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChevronRightIcon,
  UsersIcon,
  BuildingOfficeIcon,
  FolderIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navigationItems = [
  { name: 'Users', path: '/admin/users', icon: UsersIcon },
  { name: 'Roles', path: '/admin/roles', icon: ShieldCheckIcon },
  { name: 'Clients & Projects', path: '/admin/client-projects', icon: BuildingOfficeIcon },
  { name: 'Workflows', path: '/admin/workflows', icon: ArrowsRightLeftIcon },
  { name: 'Templates', path: '/admin/templates', icon: DocumentDuplicateIcon },
  { name: 'SLA', path: '/admin/sla', icon: ClockIcon },
  { name: 'Integrations', path: '/admin/integrations', icon: Cog6ToothIcon },
  { name: 'Logs', path: '/admin/logs', icon: DocumentTextIcon },
  { name: 'Settings', path: '/admin/settings', icon: DocumentChartBarIcon }
]

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return paths.map((path, index) => ({
    name: path.charAt(0).toUpperCase() + path.slice(1),
    path: '/' + paths.slice(0, index + 1).join('/')
  }))
})

const currentPageTitle = computed(() => {
  const currentRoute = navigationItems.find(item => route.path.startsWith(item.path))
  return currentRoute?.name || 'Admin'
})

const currentPageDescription = computed(() => {
  switch (route.path) {
    case '/admin/settings':
      return 'Configure system-wide settings and preferences.'
    case '/admin/users':
      return 'Manage user accounts, roles, and permissions.'
    case '/admin/client-projects':
      return 'Manage clients and their associated projects in one place.'
    case '/admin/workflows':
      return 'Configure workflow templates and processes.'
    case '/admin/templates':
      return 'Manage document templates and forms.'
    case '/admin/sla':
      return 'Configure Service Level Agreement settings.'
    case '/admin/integrations':
      return 'Manage third-party integrations and APIs.'
    case '/admin/logs':
      return 'View system logs and activity history.'
    default:
      return 'Admin Panel'
  }
})
</script>

<style scoped>
.router-link-active {
  @apply text-white;
}

.router-link-active .nav-indicator {
  @apply scale-x-100;
}
</style> 