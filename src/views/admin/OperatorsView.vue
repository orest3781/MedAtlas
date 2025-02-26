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
    <div v-if="loading || usersStore.loading[-1]" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-white/60">Loading team members...</p>
      </div>
    </div>

    <div v-else-if="usersStore.error" class="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
      <p class="text-error">{{ usersStore.error }}</p>
      <button 
        @click="usersStore.fetchUsers()"
        class="mt-4 px-4 py-2 bg-error/20 hover:bg-error/30 text-error rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <div v-else-if="operators.length === 0" class="bg-surface-darker rounded-xl p-6 text-center border border-white/10">
      <p class="text-white/60">No team members found</p>
      <button 
        @click="showAddOperatorModal = true"
        class="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
      >
        Add Your First Team Member
      </button>
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="operator in activeOperators" :key="operator.id" 
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
              <span class="px-3 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
                active
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
              <div class="grid grid-cols-2 gap-2 w-[160px]">
                <button
                  @click="editOperator(operator)"
                  class="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors flex items-center justify-center"
                >
                  Edit
                </button>
                <button
                  @click="toggleOperatorStatus(operator)"
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center justify-center bg-error/10 text-error hover:bg-error/20',
                    usersStore.isUserLoading(operator.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  ]"
                  :disabled="usersStore.isUserLoading(operator.id)"
                >
                  <span v-if="usersStore.isUserLoading(operator.id)" class="inline-block animate-spin mr-1">⟳</span>
                  <span>Deactivate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inactive Team Members Section -->
      <div v-if="inactiveOperators.length > 0" class="bg-surface-darker rounded-xl p-6 border border-white/10">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-white/90">Inactive Team Members</h3>
          <p class="text-sm text-white/60">These team members currently don't have access to the system</p>
        </div>
        
        <div class="space-y-3">
          <div v-for="operator in inactiveOperators" :key="operator.id" 
               class="flex items-center justify-between p-4 bg-surface-dark rounded-lg border border-white/5">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-base font-medium">
                {{ operator.name.charAt(0) }}
              </div>
              <div>
                <h4 class="text-white/90 font-medium">{{ operator.name }}</h4>
                <p class="text-white/40 text-sm">{{ operator.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="editOperator(operator)"
                class="px-3 py-1 text-primary/80 hover:text-primary hover:bg-primary/10 rounded transition-colors text-sm"
              >
                Edit
              </button>
              <button
                @click="toggleOperatorStatus(operator)"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center justify-center bg-success/10 text-success hover:bg-success/20',
                  usersStore.isUserLoading(operator.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                ]"
                :disabled="usersStore.isUserLoading(operator.id)"
              >
                <span v-if="usersStore.isUserLoading(operator.id)" class="inline-block animate-spin mr-1">⟳</span>
                <span>Activate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Archived Team Members Section -->
      <div v-if="archivedOperators.length > 0" class="mt-8 bg-surface-darker rounded-xl p-6 border border-white/10">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-white/90">Archived Team Members</h3>
          <p class="text-sm text-white/60">Historical record of previous team members</p>
        </div>
        
        <div class="space-y-3">
          <div v-for="operator in archivedOperators" :key="operator.id" 
               class="flex items-center justify-between p-4 bg-surface-dark rounded-lg border border-white/5">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-base font-medium">
                {{ operator.name.charAt(0) }}
              </div>
              <div>
                <h4 class="text-white/90 font-medium">{{ operator.name }}</h4>
                <div class="text-white/40 text-sm space-y-1">
                  <p>{{ operator.email }}</p>
                  <p>Archived on: {{ new Date(operator.archived_at).toLocaleDateString() }}</p>
                  <p>Reason: {{ operator.archive_reason }}</p>
                  <p>By: {{ operator.archived_by_name }}</p>
                </div>
              </div>
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
              <label class="block text-sm font-medium text-white/60 mb-1">Password</label>
              <input
                v-model="operatorForm.password"
                type="password"
                :required="!editingOperator"
                :placeholder="editingOperator ? 'Leave blank to keep current password' : 'Enter password'"
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

            <!-- Delete button for inactive users -->
            <div v-if="editingOperator?.status === 'inactive'" class="mt-4 pt-4 border-t border-white/10">
              <button
                type="button"
                @click="confirmDelete"
                class="w-full px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Team Member</span>
              </button>
              <p class="mt-2 text-xs text-white/40 text-center">This action cannot be undone</p>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from '@vue/runtime-core'
import { useRolesStore } from '@/stores/roles'
import { useUsersStore } from '@/stores/users'
import type { Role, User, RolePermissions } from '@/types/database'
import type { ArchivedUser } from '@/stores/users'

interface OperatorFormData {
  name: string
  email: string
  password?: string
  role: Role
  status: 'active' | 'inactive'
}

type OperatorWithLastActive = User & {
  lastActive: string
}

const rolesStore = useRolesStore()
const usersStore = useUsersStore()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const roleFilter = ref('all')
const showAddOperatorModal = ref(false)
const editingOperator = ref<OperatorWithLastActive | null>(null)
const loading = ref(false)

const operatorForm = ref<OperatorFormData>({
  name: '',
  email: '',
  password: '',
  role: 'OPERATOR',
  status: 'active'
})

const operators = computed<OperatorWithLastActive[]>(() => {
  console.log('Current users in store:', usersStore.users)
  return usersStore.users.map((user: User) => ({
    ...user,
    lastActive: user.last_login || user.created_at
  }))
})

const filteredOperators = computed(() => {
  console.log('Filtering operators:', operators.value)
  let filtered = [...operators.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(op => 
      op.name.toLowerCase().includes(query) ||
      op.email.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(op => op.status === statusFilter.value)
  }
  
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(op => op.role === roleFilter.value)
  }
  
  console.log('Filtered operators:', filtered)
  return filtered
})

const handleOperatorSubmit = async () => {
  try {
    loading.value = true
    const formData = { ...operatorForm.value }
    
    if (editingOperator.value?.id) {
      // For updates, remove password if not changed
      if (!formData.password) {
        delete formData.password
      }
      await usersStore.updateUser(editingOperator.value.id, formData)
    } else {
      // For new users, ensure password is set
      if (!formData.password) {
        throw new Error('Password is required for new users')
      }
      await usersStore.createUser(formData)
    }
    
    await usersStore.fetchUsers() // Refresh the users list
    showAddOperatorModal.value = false
    resetForm()
  } catch (error) {
    console.error('Error submitting operator:', error)
    alert(error instanceof Error ? error.message : 'Failed to save user')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  operatorForm.value = {
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    status: 'active'
  }
  editingOperator.value = null
}

const editOperator = (operator: OperatorWithLastActive) => {
  editingOperator.value = operator
  operatorForm.value = {
    name: operator.name,
    email: operator.email,
    role: operator.role,
    status: operator.status
  }
  showAddOperatorModal.value = true
}

const toggleOperatorStatus = async (operator: OperatorWithLastActive) => {
  try {
    const newStatus = operator.status === 'active' ? 'inactive' : 'active'
    await usersStore.updateUser(operator.id.toString(), { status: newStatus })
  } catch (error) {
    console.error('Error toggling operator status:', error)
    alert('Failed to update operator status')
  }
}

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

const groupedPermissions = computed<Record<string, Array<keyof RolePermissions>>>(() => {
  const grouped: Record<string, Array<keyof RolePermissions>> = {}
  const permissions = rolesStore.getRolePermissions(operatorForm.value.role)
  
  for (const permission of permissions) {
    const category = permission.replace(/^can/, '').split(/(?=[A-Z])/)[0]
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(permission)
  }
  
  return grouped
})

const getRoleSummary = (role: Role): string => {
  const permissions: Record<Role, string> = {
    'ADMIN': 'Full access to all system features and settings',
    'SUPERVISOR': 'Access to operations and team management',
    'PROD-TECHNICIAN': 'Access to production queue and tasks',
    'RECEIVING': 'Access to receiving and shipment features',
    'OPERATOR': 'Basic access to assigned tasks'
  }
  return permissions[role] || 'Unknown role permissions'
}

const hasPermission = (permission: keyof RolePermissions): boolean => {
  return rolesStore.hasPermission(permission)
}

const activeOperators = computed(() => {
  return filteredOperators.value.filter(op => op.status === 'active')
})

const inactiveOperators = computed(() => {
  return filteredOperators.value.filter(op => op.status === 'inactive')
})

const confirmDelete = async () => {
  if (!editingOperator.value?.id) return
  
  const name = editingOperator.value.name
  const reason = prompt(`Please provide a reason for archiving ${name}:`)
  
  if (reason) {
    try {
      loading.value = true
      await usersStore.archiveUser(editingOperator.value.id.toString(), reason)
      showAddOperatorModal.value = false
      resetForm()
      await usersStore.fetchUsers() // Refresh the active users list
      await usersStore.fetchArchivedUsers() // Fetch the archived users
    } catch (error) {
      console.error('Error archiving user:', error)
      alert('Failed to archive user')
    } finally {
      loading.value = false
    }
  }
}

const archivedOperators = computed(() => {
  return usersStore.archivedUsers.map((user: ArchivedUser) => ({
    ...user,
    lastActive: user.last_login || user.created_at
  }))
})

onMounted(async () => {
  try {
    loading.value = true
    console.log('Component mounted, fetching users...')
    await Promise.all([
      usersStore.fetchUsers(),
      usersStore.fetchArchivedUsers()
    ])
    console.log('Users fetched:', usersStore.users)
  } catch (error) {
    console.error('Error in component mount:', error)
    alert('Failed to load team members. Please try refreshing the page.')
  } finally {
    loading.value = false
  }
})
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