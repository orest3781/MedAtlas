<template>
  <div class="min-h-screen bg-surface-darker">
    <!-- Admin Header -->
    <header class="bg-surface-dark border-b border-accent/20 px-6 py-4">
      <h1 class="text-2xl font-semibold text-white">Administration</h1>
    </header>

    <div class="flex">
      <!-- Admin Sidebar -->
      <aside class="w-64 min-h-[calc(100vh-4rem)] bg-surface-dark border-r border-accent/20">
        <nav class="p-4">
          <router-link 
            v-for="item in menuItems" 
            :key="item.path"
            :to="item.path"
            class="block px-4 py-2 mb-1 rounded-lg text-white/70 hover:text-white hover:bg-accent/10 transition-colors"
            :class="{ 'bg-accent/10 text-white': isActive(item.path) }"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </aside>

      <!-- Admin Content -->
      <main class="flex-1 p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const menuItems = [
  { name: 'Users & Operators', path: '/admin/users' },
  { name: 'Roles & Permissions', path: '/admin/roles' },
  { name: 'Clients & Projects', path: '/admin/client-projects' },
  { name: 'Workflows', path: '/admin/workflows' },
  { name: 'Templates', path: '/admin/templates' },
  { name: 'SLA Configuration', path: '/admin/sla' },
  { name: 'Integrations', path: '/admin/integrations' },
  { name: 'System Logs', path: '/admin/logs' },
  { name: 'Settings', path: '/admin/settings' }
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 