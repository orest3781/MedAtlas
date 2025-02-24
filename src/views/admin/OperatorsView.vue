<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header Card -->
    <div class="bg-surface-darker rounded-xl p-6 mb-8 shadow-lg border border-white/10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Team Access Control</h2>
          <p class="text-white/60 text-sm">Manage scanning operators and system access permissions</p>
        </div>
        <button
          @click="showAddOperatorModal = true"
          class="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 shadow-lg"
        >
          <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span class="text-white font-medium">New Team Member</span>
        </button>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="bg-surface-darker rounded-xl p-6 mb-8 shadow-lg border border-white/10">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search team members..."
              class="w-full h-11 pl-11 pr-4 bg-surface-dark rounded-lg border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            />
            <svg
              class="absolute left-4 top-3.5 w-4 h-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div class="flex gap-4">
          <select
            v-model="statusFilter"
            class="h-11 px-4 bg-surface-dark rounded-lg border border-white/10 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            v-model="roleFilter"
            class="h-11 px-4 bg-surface-dark rounded-lg border border-white/10 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="PROD-TECHNICIAN">Production Technician</option>
            <option value="RECEIVING">Receiving</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Team Members Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="operator in filteredOperators" :key="operator.id" 
           class="bg-surface-darker rounded-xl border border-white/10 shadow-lg overflow-hidden hover:border-primary/30 transition-all duration-200">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-lg font-medium">
                {{ operator.name.charAt(0) }}
              </div>
              <div>
                <h3 class="text-white font-medium">{{ operator.name }}</h3>
                <p class="text-white/60 text-sm">{{ operator.email }}</p>
              </div>
            </div>
            <span :class="[
              'px-3 py-1 text-xs font-medium rounded-full',
              operator.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
            ]">
              {{ operator.status }}
            </span>
          </div>
          
          <div class="flex items-center gap-2 mb-4">
            <span :class="[
              'px-3 py-1 text-xs font-medium rounded-full',
              operator.role === 'admin' ? 'bg-primary/20 text-primary' :
              operator.role === 'supervisor' ? 'bg-warning/20 text-warning' :
              operator.role === 'lead_technician' ? 'bg-info/20 text-info' :
              'bg-success/20 text-success'
            ]">
              {{ formatRoleDisplay(operator.role) }}
            </span>
            <span class="text-white/40 text-xs">ID: {{ operator.id }}</span>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <span class="text-white/40 text-sm">
              {{ formatLastActive(operator.lastActive) }}
            </span>
            <div class="flex gap-2">
              <button
                @click="editOperator(operator)"
                class="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
              >
                Edit
              </button>
              <button
                @click="toggleOperatorStatus(operator)"
                :class="[
                  'px-3 py-1 text-sm rounded transition-colors',
                  operator.status === 'active' 
                    ? 'text-error hover:bg-error/10' 
                    : 'text-success hover:bg-success/10'
                ]"
              >
                {{ operator.status === 'active' ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Modal Title -->
    <Transition name="modal">
      <div v-if="showAddOperatorModal" class="fixed inset-0 flex items-center justify-center z-50">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddOperatorModal = false"></div>
        <div class="relative bg-surface-dark w-full max-w-md rounded-lg shadow-xl border border-white/10 p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-medium text-white/90">
              {{ editingOperator ? 'Update Team Member Details' : 'Add New Team Member' }}
            </h3>
            <button @click="showAddOperatorModal = false" class="text-white/60 hover:text-white/90">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleOperatorSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white/60 mb-1">Employee ID</label>
              <input
                v-model="operatorForm.id"
                type="text"
                required
                :disabled="!!editingOperator"
                pattern="[0-9]{4}"
                placeholder="4-digit employee ID"
                title="Enter a unique 4-digit employee ID"
                class="w-full px-4 py-2 bg-surface-darker border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-white/60 mb-1">Name</label>
              <input
                v-model="operatorForm.name"
                type="text"
                required
                placeholder="Enter full name"
                class="w-full px-4 py-2 bg-surface-darker border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-white/60 mb-1">Email</label>
              <input
                v-model="operatorForm.email"
                type="email"
                required
                placeholder="Enter email address"
                class="w-full px-4 py-2 bg-surface-darker border border-white/10 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-white/60 mb-1">Role</label>
              <div class="space-y-2">
                <select
                  v-model="operatorForm.role"
                  required
                  class="w-full px-4 py-2 bg-surface-darker border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a role</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="SUPERVISOR">Supervisor (Operations Access)</option>
                  <option value="PROD-TECHNICIAN">Production Technician (Queue Access)</option>
                  <option value="RECEIVING">Receiving (Receiving Access)</option>
                </select>
                <p v-if="operatorForm.role" class="text-xs text-white/60 px-1">
                  {{ getRoleSummary(operatorForm.role) }}
                </p>
              </div>
            </div>

            <button
              type="submit"
              class="w-full mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>{{ editingOperator ? 'Update Team Member' : 'Add Team Member' }}</span>
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/runtime-core'
import { computed } from '@vue/runtime-core'
import { useRolesStore } from '@/stores/roles'
import type { Role } from '@/stores/roles'

// Update interface with new role types
interface Operator {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  lastActive: string;
}

const rolesStore = useRolesStore()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const roleFilter = ref('all')
const showAddOperatorModal = ref(false)
const editingOperator = ref<Operator | null>(null)

const operatorForm = ref({
  id: '',
  name: '',
  email: '',
  role: '' as Role,
  status: 'active',
  lastActive: new Date().toISOString()
})

// Get permissions for selected role
const selectedRolePermissions = computed(() => {
  if (!operatorForm.value.role) return []
  return rolesStore.getRolePermissions(operatorForm.value.role)
})

// Mock data
const operators = ref<Operator[]>([
  {
    id: '1001',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'ADMIN',
    status: 'active',
    lastActive: new Date().toISOString()
  },
  {
    id: '1002',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'SUPERVISOR',
    status: 'active',
    lastActive: new Date().toISOString()
  },
  {
    id: '1003',
    name: 'Mike Brown',
    email: 'mike@example.com',
    role: 'PROD-TECHNICIAN',
    status: 'active',
    lastActive: new Date().toISOString()
  },
  {
    id: '1004',
    name: 'Lisa Davis',
    email: 'lisa@example.com',
    role: 'RECEIVING',
    status: 'active',
    lastActive: new Date().toISOString()
  }
])

// Computed
const filteredOperators = computed(() => {
  return operators.value.filter(operator => {
    const matchesSearch = operator.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         operator.id.includes(searchQuery.value) ||
                         operator.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'all' || operator.status === statusFilter.value
    const matchesRole = roleFilter.value === 'all' || operator.role === roleFilter.value

    return matchesSearch && matchesStatus && matchesRole
  })
})

// Methods
const formatLastActive = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

const editOperator = (operator: Operator) => {
  editingOperator.value = operator
  operatorForm.value = { ...operator }
  showAddOperatorModal.value = true
}

const toggleOperatorStatus = (operator: Operator) => {
  operator.status = operator.status === 'active' ? 'inactive' : 'active'
}

const handleOperatorSubmit = () => {
  if (editingOperator.value) {
    // Update existing operator
    const index = operators.value.findIndex(o => o.id === editingOperator.value!.id)
    if (index !== -1) {
      operators.value[index] = { ...operators.value[index], ...operatorForm.value }
    }
  } else {
    // Add new operator
    operators.value.push({
      ...operatorForm.value,
      status: 'active',
      lastActive: new Date().toISOString()
    })
  }

  // Reset form and close modal
  operatorForm.value = {
    id: '',
    name: '',
    email: '',
    role: '' as Role,
    status: 'active',
    lastActive: new Date().toISOString()
  }
  editingOperator.value = null
  showAddOperatorModal.value = false
}

const formatRoleDisplay = (role: string) => {
  return role.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatPermissionDisplay = (permission: string) => {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const groupedPermissions = computed(() => {
  const grouped = {}
  selectedRolePermissions.value.forEach(permission => {
    const category = permission.split('_')[0]
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(permission)
  })
  return grouped
})

// Get role summary
const getRoleSummary = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
      return 'Full system access including admin panel, user management, and all operations'
    case 'SUPERVISOR':
      return 'Access to all operations including user management, but no admin panel access'
    case 'PROD-TECHNICIAN':
      return 'Access to dashboard and production queue management'
    case 'RECEIVING':
      return 'Access to receiving operations only'
    default:
      return ''
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style> 