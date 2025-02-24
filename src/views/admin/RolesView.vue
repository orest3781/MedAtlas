<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-surface-darker rounded-xl p-6 mb-8 shadow-lg border border-white/10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Role Management</h2>
          <p class="text-white/60 text-sm">Configure roles and their associated permissions</p>
        </div>
      </div>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 gap-6">
      <div v-for="role in roles" :key="role.id" 
        class="bg-surface-dark rounded-xl border border-white/10 overflow-hidden">
        <div class="p-6">
          <!-- Role Header -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <h3 class="text-xl font-semibold text-white">{{ role.name }}</h3>
              <p class="text-white/60 mt-1">{{ role.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="viewRoleDetails(role)"
                class="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <EyeIcon class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Permissions Categories -->
          <div class="space-y-6">
            <div v-for="(permissions, category) in groupedPermissions(role.permissions)" 
              :key="category" class="space-y-2">
              <h4 class="text-sm font-medium text-white/40 uppercase tracking-wider">
                {{ formatCategory(category) }}
              </h4>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="permission in permissions" :key="permission"
                  class="flex items-center gap-2 text-white/80 text-sm bg-surface-darker rounded-lg p-2">
                  <CheckCircleIcon class="w-4 h-4 text-success" />
                  {{ formatPermission(permission) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Details Modal -->
    <TransitionRoot appear :show="showRoleModal" as="template">
      <Dialog as="div" @close="closeRoleModal" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-2xl bg-surface-dark rounded-xl border border-white/10 overflow-hidden">
                <div class="p-6">
                  <div class="flex items-center justify-between mb-6">
                    <DialogTitle class="text-xl font-semibold text-white">
                      {{ selectedRole?.name }} Details
                    </DialogTitle>
                    <button
                      @click="closeRoleModal"
                      class="text-white/60 hover:text-white transition-colors"
                    >
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <div v-if="selectedRole" class="space-y-6">
                    <!-- Role Info -->
                    <div>
                      <h4 class="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
                        Description
                      </h4>
                      <p class="text-white/80">{{ selectedRole.description }}</p>
                    </div>

                    <!-- Permissions List -->
                    <div>
                      <h4 class="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                        Permissions
                      </h4>
                      <div class="space-y-4">
                        <div v-for="(permissions, category) in groupedPermissions(selectedRole.permissions)" 
                          :key="category">
                          <h5 class="text-sm font-medium text-white/60 mb-2">
                            {{ formatCategory(category) }}
                          </h5>
                          <div class="bg-surface-darker rounded-lg p-4">
                            <div class="grid grid-cols-2 gap-3">
                              <div v-for="permission in permissions" :key="permission"
                                class="flex items-center gap-2 text-white/80 text-sm">
                                <CheckCircleIcon class="w-4 h-4 text-success" />
                                {{ formatPermission(permission) }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { EyeIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useRolesStore } from '@/stores/roles'
import type { Permission } from '@/stores/roles'

const rolesStore = useRolesStore()
const roles = computed(() => rolesStore.getAllRoles)

// Modal state
const showRoleModal = ref(false)
const selectedRole = ref<(typeof roles.value)[0] | null>(null)

// Group permissions by category
const groupedPermissions = (permissions: Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = permission.split('_')[0]
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
}

// Format text helpers
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const formatPermission = (permission: string) => {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Modal handlers
const viewRoleDetails = (role: typeof roles.value[0]) => {
  selectedRole.value = role
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedRole.value = null
}
</script> 