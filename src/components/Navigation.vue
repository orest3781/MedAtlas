<template>
  <nav class="flex space-x-2">
    <router-link
      to="/"
      class="px-4 py-2 rounded-lg transition-colors"
      :class="[
        route.path === '/'
          ? 'bg-primary text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      ]"
    >
      Dashboard
    </router-link>

    <router-link
      to="/queue"
      class="px-4 py-2 rounded-lg transition-colors"
      :class="[
        route.path.startsWith('/queue')
          ? 'bg-primary text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      ]"
    >
      Queue
    </router-link>

    <router-link
      to="/receiving"
      class="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      :class="[
        route.path.startsWith('/receiving')
          ? 'bg-primary text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      ]"
      v-if="userHasAccess(['production_technician', 'lead_technician', 'supervisor', 'admin'])"
    >
      <svg 
        class="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
        />
      </svg>
      Receiving
    </router-link>

    <router-link
      to="/admin"
      class="px-4 py-2 rounded-lg transition-colors"
      :class="[
        route.path.startsWith('/admin')
          ? 'bg-primary text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      ]"
      v-if="userHasAccess(['admin', 'supervisor'])"
    >
      Admin Panel
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const userHasAccess = (roles: string[]) => {
  if (!authStore.user) return false
  
  if (roles.includes('admin') && authStore.isAdmin) return true
  if (roles.includes('supervisor') && authStore.hasPermission('canManageJobs')) return true
  if (roles.includes('production_technician') && authStore.hasPermission('canAccessReceiving')) return true
  
  return false
}
</script> 