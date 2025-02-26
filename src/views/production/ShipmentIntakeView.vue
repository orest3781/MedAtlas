<template>
  <div class="min-h-screen bg-surface-darker p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-white">Shipment Intake</h1>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-4 py-2 bg-surface-dark rounded-lg">
            <span class="text-white/60 text-sm">Today's Shipments:</span>
            <span class="text-white font-medium">{{ todayShipments.length }}</span>
          </div>
        </div>
      </div>

      <!-- New Shipment Form -->
      <div class="bg-surface-dark rounded-lg border border-accent/20 p-6 mb-6">
        <h2 class="text-lg font-medium text-white mb-4">New Shipment</h2>
        <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Client Selection -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Client</label>
            <select v-model="form.clientId" 
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="">Select Client</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </option>
            </select>
          </div>

          <!-- Project Selection -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Project</label>
            <select v-model="form.projectId"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="">Select Project</option>
              <option v-for="project in filteredProjects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <!-- Box Count -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Box Count</label>
            <input type="number" v-model="form.boxCount" min="1"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Priority</label>
            <select v-model="form.priority"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="rush">Rush</option>
            </select>
          </div>

          <!-- Carrier -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Carrier</label>
            <select v-model="form.carrier"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="">Select Carrier</option>
              <option value="fedex">FedEx</option>
              <option value="ups">UPS</option>
              <option value="usps">USPS</option>
              <option value="dhl">DHL</option>
            </select>
          </div>

          <!-- Tracking Number -->
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">Tracking Number</label>
            <input type="text" v-model="form.trackingNumber"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>

          <!-- Notes -->
          <div class="md:col-span-2 lg:col-span-3">
            <label class="block text-sm font-medium text-white/60 mb-2">Notes</label>
            <textarea v-model="form.notes" rows="3"
              class="w-full bg-surface-darker border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
          </div>

          <!-- Submit Button -->
          <div class="md:col-span-2 lg:col-span-3">
            <button type="submit"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoading">
              <template v-if="isLoading">
                <SpinnerIcon class="w-5 h-5 inline" />
                Processing...
              </template>
              <template v-else>
                Create Shipment
              </template>
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Shipments -->
      <div class="bg-surface-dark rounded-lg border border-accent/20 p-6">
        <h2 class="text-lg font-medium text-white mb-4">Recent Shipments</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left border-b border-accent/20">
                <th class="pb-3 text-sm font-medium text-white/60">ID</th>
                <th class="pb-3 text-sm font-medium text-white/60">Client</th>
                <th class="pb-3 text-sm font-medium text-white/60">Project</th>
                <th class="pb-3 text-sm font-medium text-white/60">Boxes</th>
                <th class="pb-3 text-sm font-medium text-white/60">Priority</th>
                <th class="pb-3 text-sm font-medium text-white/60">Status</th>
                <th class="pb-3 text-sm font-medium text-white/60">Created</th>
                <th class="pb-3 text-sm font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in shipments" :key="shipment.id"
                class="border-b border-accent/10 hover:bg-surface-darker transition-colors">
                <td class="py-3 text-sm text-white font-mono">{{ shipment.id }}</td>
                <td class="py-3 text-sm text-white">{{ shipment.clientName }}</td>
                <td class="py-3 text-sm text-white">{{ shipment.projectName }}</td>
                <td class="py-3 text-sm text-white">{{ shipment.boxCount }}</td>
                <td class="py-3 text-sm">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getPriorityClass(shipment.priority)">
                    {{ formatPriority(shipment.priority) }}
                  </span>
                </td>
                <td class="py-3 text-sm">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusClass(shipment.status)">
                    {{ formatStatus(shipment.status) }}
                  </span>
                </td>
                <td class="py-3 text-sm text-white/60">{{ formatDate(shipment.createdAt) }}</td>
                <td class="py-3 text-sm">
                  <button @click="generateLabel(shipment.id)"
                    class="px-3 py-1 text-xs font-medium text-white bg-primary/20 hover:bg-primary/30 rounded transition-colors">
                    Generate Label
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useShipments, type ShipmentData, type Shipment } from '@/composables/useShipments'
import { useToast } from '@/composables/useToast'
import SpinnerIcon from '@/components/icons/SpinnerIcon.vue'

const { createShipment, getShipments, generateLabel, isLoading, error } = useShipments()
const { showToast } = useToast()

// Form state
const form = ref<ShipmentData>({
  clientId: 0,
  projectId: 0,
  boxCount: 1,
  priority: 'normal',
  carrier: '',
  trackingNumber: '',
  notes: ''
})

// Data
const clients = ref<{ id: number; name: string }[]>([])
const projects = ref<{ id: number; clientId: number; name: string }[]>([])
const shipments = ref<Shipment[]>([])

// Computed
const filteredProjects = computed(() => {
  if (!form.value.clientId) return []
  return projects.value.filter(p => p.clientId === form.value.clientId)
})

const todayShipments = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return shipments.value.filter(s => s.createdAt.startsWith(today))
})

// Methods
const handleSubmit = async () => {
  try {
    const result = await createShipment(form.value)
    showToast('Shipment created successfully', 'success')
    // Reset form
    form.value = {
      clientId: 0,
      projectId: 0,
      boxCount: 1,
      priority: 'normal',
      carrier: '',
      trackingNumber: '',
      notes: ''
    }
    // Refresh shipments list
    loadShipments()
  } catch (err) {
    showToast(error.value || 'Failed to create shipment', 'error')
  }
}

const loadShipments = async () => {
  try {
    const result = await getShipments()
    shipments.value = result
  } catch (err) {
    showToast('Failed to load shipments', 'error')
  }
}

const handleGenerateLabel = async (shipmentId: string) => {
  try {
    const labelUrl = await generateLabel(shipmentId)
    // Handle the label URL (e.g., open in new window, download, etc.)
    window.open(labelUrl, '_blank')
  } catch (err) {
    showToast('Failed to generate label', 'error')
  }
}

const getPriorityClass = (priority: string) => {
  const classes = {
    normal: 'bg-white/10 text-white',
    urgent: 'bg-warning/20 text-warning',
    rush: 'bg-error/20 text-error'
  }
  return classes[priority] || classes.normal
}

const getStatusClass = (status: string) => {
  const classes = {
    pending: 'bg-white/10 text-white',
    processing: 'bg-primary/20 text-primary',
    completed: 'bg-success/20 text-success'
  }
  return classes[status] || classes.pending
}

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

// Initialize
onMounted(async () => {
  try {
    // Load clients
    const clientsResult = await window.api.getClients()
    clients.value = clientsResult

    // Load projects
    const projectsResult = await window.api.getProjects()
    projects.value = projectsResult

    // Load shipments
    await loadShipments()
  } catch (err) {
    showToast('Failed to load initial data', 'error')
  }
})
</script> 