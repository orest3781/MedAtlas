<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-surface-darker rounded-xl p-6 mb-8 shadow-lg border border-white/10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Client & Project Management</h2>
          <p class="text-white/60 text-sm">Manage your clients and their associated projects in one place</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="showNewProjectModal = true"
            :disabled="!authStore.hasPermission('canCreateProject')"
            :class="[
              'group px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2',
              authStore.hasPermission('canCreateProject')
                ? 'bg-primary/90 hover:bg-primary'
                : 'bg-gray-600/50 cursor-not-allowed'
            ]"
          >
            <FolderPlusIcon class="h-5 w-5" />
            New Project
          </button>
          <button
            @click="showNewClientModal = true"
            :disabled="!authStore.hasPermission('canCreateClient')"
            :class="[
              'group px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2',
              authStore.hasPermission('canCreateClient')
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-gray-600/50 cursor-not-allowed'
            ]"
          >
            <UserPlusIcon class="h-5 w-5" />
            New Client
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="relative col-span-2">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search clients and projects..."
          class="w-full px-4 py-2.5 bg-surface-dark border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <MagnifyingGlassIcon class="absolute right-3 top-2.5 h-5 w-5 text-white/40" />
      </div>
      <select
        v-model="viewMode"
        class="px-4 py-2.5 bg-surface-dark border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <option value="all">All Items</option>
        <option value="clients">Clients Only</option>
        <option value="projects">Projects Only</option>
      </select>
    </div>

    <!-- Client and Project List -->
    <div class="space-y-4">
      <TransitionGroup name="list">
        <div
          v-for="client in filteredClients"
          :key="client.id"
          class="bg-surface-dark rounded-lg overflow-hidden border border-white/10 transition-all duration-200 hover:border-white/20"
        >
          <!-- Client Header -->
          <div
            class="px-6 py-4 flex items-center justify-between cursor-pointer group"
            @click="toggleClient(client.id)"
          >
            <div class="flex items-center space-x-4">
              <div class="flex flex-col">
                <div class="flex items-center space-x-3">
                  <span class="text-lg font-medium text-white group-hover:text-primary transition-colors">
                    {{ client.name }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="client.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'"
                  >
                    {{ client.status }}
                  </span>
                </div>
                <span class="text-sm text-white/40">{{ client.contact.email }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <span class="px-2.5 py-1 rounded-lg text-sm bg-surface-darker text-white/60">
                  {{ client.projects.length }} Projects
                </span>
              </div>
              <ChevronDownIcon 
                class="h-5 w-5 text-white/40 transform transition-transform duration-200"
                :class="{ 'rotate-180': expandedClients.includes(client.id) }"
              />
            </div>
          </div>

          <!-- Projects List -->
          <div v-show="expandedClients.includes(client.id)">
            <div class="border-t border-white/5">
              <TransitionGroup name="list">
                <div
                  v-for="project in client.projects"
                  :key="project.id"
                  class="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div class="flex items-center space-x-4">
                    <div class="flex flex-col">
                      <div class="flex items-center space-x-3">
                        <span class="text-white/90 group-hover:text-white transition-colors">
                          {{ project.name }}
                        </span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="project.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'"
                        >
                          {{ project.status }}
                        </span>
                      </div>
                      <span class="text-sm text-white/40">
                        {{ project.status === 'completed' ? `Completed ${formatDate(project.dateCompleted)}` : `Due ${formatDate(project.deadline)}` }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click.stop="editProject(project)"
                      :disabled="!authStore.hasPermission('canEditProject')"
                      class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click.stop="viewProjectDetails(project)"
                      class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <EyeIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- New/Edit Client Modal -->
    <Modal
      v-if="showNewClientModal"
      :title="editingClient ? 'Edit Client' : 'New Client'"
      @close="closeClientModal"
    >
      <!-- Modal content here -->
    </Modal>

    <!-- New/Edit Project Modal -->
    <Modal
      v-if="showNewProjectModal"
      :title="editingProject ? 'Edit Project' : 'New Project'"
      @close="closeProjectModal"
    >
      <!-- Modal content here -->
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  UserPlusIcon,
  FolderPlusIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import Modal from '../../components/Modal.vue'
import { useAuthStore } from '../../stores/auth'

// Types
interface Contact {
  name: string
  email: string
  phone: string
}

interface Project {
  id: string
  name: string
  status: 'active' | 'completed'
  deadline: string
  dateCompleted?: string
}

interface Client {
  id: string
  name: string
  status: 'active' | 'inactive'
  contact: Contact
  projects: Project[]
}

// State
const searchQuery = ref('')
const viewMode = ref('all')
const expandedClients = ref<string[]>([])
const showNewClientModal = ref(false)
const showNewProjectModal = ref(false)
const editingClient = ref<Client | null>(null)
const editingProject = ref<Project | null>(null)

// Store
const authStore = useAuthStore()

// Mock data (replace with actual data from your store)
const clients = ref<Client[]>([
  {
    id: 'C1',
    name: 'MedFirst Healthcare',
    status: 'active',
    contact: {
      name: 'John Smith',
      email: 'john.smith@medfirst.com',
      phone: '(555) 123-4567'
    },
    projects: [
      {
        id: 'P1',
        name: 'Patient Records 2023',
        status: 'active',
        deadline: '2024-03-20'
      },
      {
        id: 'P2',
        name: 'Insurance Claims Q1',
        status: 'completed',
        deadline: '2024-02-15',
        dateCompleted: '2024-02-14'
      }
    ]
  },
  // Add more mock clients as needed
])

// Computed
const filteredClients = computed(() => {
  let filtered = clients.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.projects.some(project => project.name.toLowerCase().includes(query))
    )
  }

  if (viewMode.value === 'clients') {
    filtered = filtered.map(client => ({
      ...client,
      projects: []
    }))
  } else if (viewMode.value === 'projects') {
    filtered = filtered.filter(client => client.projects.length > 0)
  }

  return filtered
})

// Methods
const toggleClient = (clientId: string) => {
  const index = expandedClients.value.indexOf(clientId)
  if (index === -1) {
    expandedClients.value.push(clientId)
  } else {
    expandedClients.value.splice(index, 1)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const closeClientModal = () => {
  showNewClientModal.value = false
  editingClient.value = null
}

const closeProjectModal = () => {
  showNewProjectModal.value = false
  editingProject.value = null
}

const editProject = (project: Project) => {
  editingProject.value = project
  showNewProjectModal.value = true
}

const viewProjectDetails = (project: Project) => {
  // Implement project details view
  console.log('View project details:', project.id)
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 