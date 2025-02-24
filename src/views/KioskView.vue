<!-- KioskView.vue -->
<template>
  <div class="kiosk-view" @mousemove="handleMouseMove">
    <!-- Background -->
    <KioskBackground />
    
    <!-- Content -->
    <div class="min-h-screen flex flex-col p-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-4xl font-bold tracking-wider text-sky-400">MedAtlas</div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex">
        <!-- Left Side - Check In -->
        <div class="w-[300px] px-4">
          <div class="check-in-card-container">
            <div class="rotating-border"></div>
            <div 
              class="check-in-card group"
              @click="openScanModal"
            >
              <div class="flex flex-col items-center gap-4">
                <div class="barcode-icon group-hover:scale-110 transition-transform duration-300">
                  <div class="flex items-end h-20 w-[240px] justify-between">
                    <!-- Start bars -->
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <!-- First heartbeat -->
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <div class="h-12 w-[2px] bg-sky-400"></div>
                    <div class="h-16 w-[1px] bg-sky-400"></div>
                    <div class="h-20 w-[3px] bg-sky-400"></div>
                    <div class="h-4 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <!-- Middle section -->
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <!-- Second heartbeat -->
                    <div class="h-12 w-[2px] bg-sky-400"></div>
                    <div class="h-16 w-[1px] bg-sky-400"></div>
                    <div class="h-20 w-[3px] bg-sky-400"></div>
                    <div class="h-4 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <!-- Third heartbeat -->
                    <div class="h-12 w-[2px] bg-sky-400"></div>
                    <div class="h-16 w-[1px] bg-sky-400"></div>
                    <div class="h-20 w-[3px] bg-sky-400"></div>
                    <div class="h-4 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <!-- End bars -->
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                    <div class="h-8 w-[2px] bg-sky-400"></div>
                    <div class="h-8 w-[1px] bg-sky-400"></div>
                  </div>
                  <!-- Add small text below -->
                  <div class="text-[10px] text-sky-400/60 text-center mt-2">SCAN</div>
                </div>
                <h2 class="text-4xl font-bold text-white group-hover:text-sky-400 transition-colors duration-300">CHECK IN</h2>
              </div>
            </div>
          </div>
          
          <!-- Status Cards -->
          <div class="mt-8 space-y-4">
            <!-- Active Jobs Card -->
            <div class="status-card group">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="text-white/60 text-sm">Total Active Jobs</div>
                  <div class="text-2xl font-bold text-white">{{ currentJobs.length }}</div>
                </div>
                <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                  <div class="w-6 h-6 border-2 border-sky-400 rounded-lg"></div>
                </div>
              </div>
            </div>

            <!-- Average Processing Time Card -->
            <div class="status-card group">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="text-white/60 text-sm">Avg Processing Time</div>
                  <div class="text-2xl font-bold text-white">1.5h</div>
                </div>
                <div class="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                  <div class="w-6 h-6 border-2 border-sky-400 rounded-full flex items-center justify-center">
                    <div class="w-2.5 h-2.5 bg-sky-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed Jobs Card -->
            <div class="status-card group">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="text-white/60 text-sm">Completed Today</div>
                  <div class="text-2xl font-bold text-white">24</div>
                </div>
                <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <div class="w-6 h-6 border-2 border-green-400 rounded-lg flex items-center justify-center">
                    <div class="w-3 h-3 bg-green-400"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Queue Status Card -->
            <div class="status-card group">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="text-white/60 text-sm">Queue Status</div>
                  <div class="text-2xl font-bold text-white">{{ queueStatus.text }}</div>
                </div>
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                  {
                    'bg-green-500/10 group-hover:bg-green-500/20': queueStatus.color === 'green',
                    'bg-sky-500/10 group-hover:bg-sky-500/20': queueStatus.color === 'sky',
                    'bg-yellow-500/10 group-hover:bg-yellow-500/20': queueStatus.color === 'yellow',
                    'bg-red-500/10 group-hover:bg-red-500/20': queueStatus.color === 'red'
                  }
                ]">
                  <div class="w-6 h-6">
                    <div :class="[
                      'w-full h-1.5 rounded-full mb-1',
                      {
                        'bg-green-400': queueStatus.color === 'green',
                        'bg-sky-400': queueStatus.color === 'sky',
                        'bg-yellow-400': queueStatus.color === 'yellow',
                        'bg-red-400': queueStatus.color === 'red'
                      }
                    ]"></div>
                    <div :class="[
                      'h-1.5 rounded-full mb-1',
                      {
                        'w-4/5 bg-green-400': queueStatus.color === 'green',
                        'w-full bg-sky-400': queueStatus.color === 'sky',
                        'w-3/5 bg-yellow-400': queueStatus.color === 'yellow',
                        'w-2/5 bg-red-400': queueStatus.color === 'red'
                      }
                    ]"></div>
                    <div :class="[
                      'h-1.5 rounded-full',
                      {
                        'w-3/5 bg-green-400': queueStatus.color === 'green',
                        'w-4/5 bg-sky-400': queueStatus.color === 'sky',
                        'w-2/5 bg-yellow-400': queueStatus.color === 'yellow',
                        'w-1/5 bg-red-400': queueStatus.color === 'red'
                      }
                    ]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Jobs Grid -->
        <div class="flex-1">
          <div class="flex items-center">
            <!-- Left Arrow with Page Number -->
            <div v-if="totalPages > 1" class="flex flex-col items-center w-[60px]">
              <div class="h-6 text-white/60 text-lg font-medium">
                {{ currentPage > 1 ? currentPage - 1 : '' }}
              </div>
              <button 
                @click="prevPage"
                :disabled="currentPage === 1"
                class="p-4 rounded-xl text-white/60 hover:text-white hover:bg-surface-dark/90 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-300 backdrop-blur-sm border border-white/10"
              >
                <ChevronLeftIcon class="w-8 h-8" />
              </button>
            </div>

            <div class="flex-1">
              <div class="jobs-grid">
                <div v-for="job in paginatedJobs" :key="job.id" 
                  class="job-card flex flex-col justify-between"
                  :class="[
                    { 'recently-created': job.id === recentlyCreatedJob?.id },
                    getCardBorderColor(job)
                  ]"
                >
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span :class="['status-badge', 
                        job.status === 'In Progress' ? 'bg-sky-500/20 text-sky-400' : 'bg-yellow-500/20 text-yellow-400']"
                      >
                        {{ job.status }}
                      </span>
                      <!-- Time Status Badge -->
                      <span v-if="job.steps[job.currentStep].lastUpdated"
                            :class="[
                              'status-badge text-sm',
                              {
                                'bg-green-500/20 text-green-400': getStepStatus(job, job.currentStep).color === 'green',
                                'bg-yellow-500/20 text-yellow-400': getStepStatus(job, job.currentStep).color === 'yellow',
                                'bg-red-500/20 text-red-400': getStepStatus(job, job.currentStep).color === 'red'
                              }
                            ]"
                      >
                        {{ getStepStatus(job, job.currentStep).text }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-white text-xl">Shipment {{ job.shipmentId }}</div>
                      <div class="text-white/60">{{ job.steps[job.currentStep].operator || job.employeeId }}</div>
                    </div>
                  </div>

                  <!-- Start Time -->
                  <div class="text-4xl font-bold text-white/80 mb-4">Started: {{ job.startTime }}</div>

                  <!-- Progress Steps -->
                  <div class="flex items-center gap-2">
                    <template v-for="step in workflowSteps" :key="step">
                      <div class="flex-1 group relative">
                        <div class="flex items-center justify-between mb-1">
                          <div class="flex items-center gap-2">
                            <div class="text-white/60 text-[10px] font-medium">{{ step }}</div>
                            <div v-if="job.steps[step].operator" 
                                 class="text-white/40 text-[10px] px-1 py-0.5 bg-white/5 rounded">
                              {{ getInitials(job.steps[step].operator) }}
                            </div>
                          </div>
                          <div v-if="job.steps[step].progress === 100" 
                               class="text-green-500">
                            <CheckIcon class="w-3 h-3" />
                          </div>
                          <div v-else-if="job.steps[step].lastUpdated" 
                               class="text-white/40 text-[10px]">
                            {{ job.steps[step].progress }}%
                          </div>
                        </div>
                        <div class="bg-white/5 rounded-full h-1">
                          <div class="h-1 rounded-full transition-all duration-300"
                               :class="getProgressBarColor(job, step)"
                               :style="{ width: `${getStepProgress(job, step)}%` }">
                          </div>
                        </div>
                      </div>
                      <div v-if="step !== workflowSteps[workflowSteps.length-1]" class="w-4"></div>
                    </template>
                  </div>
                </div>

                <!-- Empty Job Card Placeholders -->
                <div v-for="i in Math.max(0, 9 - paginatedJobs.length)" :key="'empty-'+i" 
                  class="job-card empty">
                </div>
              </div>

              <!-- Page Indicator -->
              <div v-if="totalPages > 1" class="text-center mt-4 text-white/60">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
            </div>

            <!-- Right Arrow with Page Number -->
            <div v-if="totalPages > 1" class="flex flex-col items-center w-[60px]">
              <div class="h-6 text-white/60 text-lg font-medium">
                {{ currentPage < totalPages ? currentPage + 1 : '' }}
              </div>
              <button 
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="p-4 rounded-xl text-white/60 hover:text-white hover:bg-surface-dark/90 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-300 backdrop-blur-sm border border-white/10"
              >
                <ChevronRightIcon class="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scan Modal -->
    <Transition name="modal">
      <div v-if="showScanModal" class="fixed inset-0 flex items-center justify-center z-50">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeScanModal"></div>
        <div class="relative bg-surface-dark/90 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/10">
          <!-- Modal Header -->
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-white">
              {{ scanStep === 'employee' ? 'Scan Employee Badge' : 'Scan Shipment Barcode' }}
            </h2>
            <p class="text-white/60 mt-2">
              {{ scanStep === 'employee' ? 'Please scan your employee badge or use the test ID below' : 'Please scan the shipment barcode or use the test ID below' }}
            </p>
          </div>

          <!-- Scan Input -->
          <div class="space-y-6">
            <div class="relative">
              <input
                ref="scanInput"
                v-model="scanValue"
                type="text"
                :placeholder="scanStep === 'employee' ? 'Employee ID' : 'Shipment ID'"
                class="w-full px-6 py-4 bg-surface-darker border-2 border-white/10 rounded-xl text-white text-lg focus:outline-none focus:border-sky-500 transition-colors"
                @keyup.enter="handleScan"
                autocomplete="off"
              />
              <button 
                class="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-sm"
                @click="useDefaultValue"
              >
                Use Test ID
              </button>
            </div>

            <!-- Preview -->
            <div v-if="scanStep === 'shipment' && employeeId" 
              class="p-4 rounded-xl bg-surface-darker/50 border border-white/10"
            >
              <div class="text-sm text-white/60">Employee ID:</div>
              <div class="text-lg text-white font-medium">{{ employeeId }}</div>
            </div>

            <!-- Status Message -->
            <div v-if="statusMessage" 
              :class="[
                'p-4 rounded-xl text-sm font-medium',
                statusMessage.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              ]"
            >
              {{ statusMessage.text }}
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button
                @click="closeScanModal"
                class="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                v-if="scanStep === 'shipment'"
                @click="resetScan"
                class="flex-1 px-6 py-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-xl text-sm font-medium transition-colors"
              >
                Scan New Badge
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from '@vue/runtime-core'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import KioskBackground from '../components/KioskBackground.vue'
import { useJobs } from '@/composables/useJobs'
import { useShipments } from '@/composables/useShipments'
import type { Job } from '@/types/database'

// Time display
const currentTime = ref(new Date().toLocaleString())
setInterval(() => {
  currentTime.value = new Date().toLocaleString()
}, 1000)

// Use composables
const { 
  jobs: currentJobs,
  loading: jobsLoading,
  error: jobsError,
  activeJobs,
  completedJobsToday,
  averageProcessingTime,
  queueStatus,
  loadJobs,
  createJob,
  updateJobStep
} = useJobs()

const {
  loading: shipmentsLoading,
  error: shipmentsError,
  getShipmentByTracking,
  updateShipmentStatus
} = useShipments()

// Load initial data
onMounted(async () => {
  await loadJobs()
})

// Scan state
const showScanModal = ref(false)
const scanStep = ref<'employee' | 'shipment'>('employee')
const scanValue = ref('')
const employeeId = ref('')
const statusMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)
const scanInput = ref<HTMLInputElement | null>(null)
const recentlyCreatedJob = ref<Job | null>(null)

// Default test values
const DEFAULT_EMPLOYEE_ID = 'EMP123'
const DEFAULT_SHIPMENT_ID = 'SHIP456'

// Update type definitions
interface StepData {
  progress: number;
  lastUpdated: string | null;
  operator?: string | null;
}

interface JobSteps {
  PREP: StepData;
  SCAN: StepData;
  QC: StepData;
  INDEX: StepData;
  REPREP: StepData;
}

interface Job {
  id: number;
  shipmentId: string;
  employeeId: string;
  startTime: string;
  status: string;
  steps: JobSteps;
  currentStep: keyof JobSteps;
}

// Card hover state
const isOverCard = ref(false)

// Workflow steps
const workflowSteps = ['PREP', 'SCAN', 'QC', 'INDEX', 'REPREP']

// Update type annotations in functions
const getStepProgress = (job: Job, step: keyof JobSteps): number => {
  return job.steps[step].progress
}

const getProgressBarColor = (job: Job, step: keyof JobSteps): string => {
  const stepData = job.steps[step]
  if (!stepData.lastUpdated) return 'bg-white/20'
  
  const now = new Date()
  const lastUpdated = new Date(stepData.lastUpdated)
  const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
  
  if (stepData.progress === 100) return 'bg-green-500'
  if (hoursElapsed <= 1) return 'bg-green-500'
  if (hoursElapsed <= 2) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getCardBorderColor = (job: Job): string => {
  const currentStepData = job.steps[job.currentStep]
  if (!currentStepData.lastUpdated) return 'border-white/10'
  
  const now = new Date()
  const lastUpdated = new Date(currentStepData.lastUpdated)
  const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
  
  if (hoursElapsed <= 1) return 'border-green-500/50'
  if (hoursElapsed <= 2) return 'border-yellow-500/50'
  return 'border-red-500/50'
}

// Modal controls
const openScanModal = () => {
  showScanModal.value = true
  focusScanInput()
}

const closeScanModal = () => {
  showScanModal.value = false
  resetScan()
}

const focusScanInput = () => {
  setTimeout(() => {
    scanInput.value?.focus()
  }, 0)
}

const useDefaultValue = () => {
  scanValue.value = scanStep.value === 'employee' ? DEFAULT_EMPLOYEE_ID : DEFAULT_SHIPMENT_ID
  handleScan()
}

const handleScan = async () => {
  if (!scanValue.value) {
    statusMessage.value = { 
      type: 'error', 
      text: `Please scan ${scanStep.value === 'employee' ? 'employee badge' : 'shipment barcode'}` 
    }
    return
  }

  try {
    if (scanStep.value === 'employee') {
      // Handle employee badge scan
      employeeId.value = scanValue.value
      scanStep.value = 'shipment'
      statusMessage.value = { type: 'success', text: 'Employee verified. Please scan shipment barcode.' }
    } else {
      // Handle shipment barcode scan
      const shipment = await getShipmentByTracking(scanValue.value)
      if (!shipment) {
        statusMessage.value = { type: 'error', text: 'Shipment not found' }
        return
      }
      
      await createNewJob(employeeId.value, shipment.id)
    }
  } catch (err) {
    statusMessage.value = { type: 'error', text: 'An error occurred' }
    console.error(err)
  }

  // Clear scan value and refocus
  scanValue.value = ''
  focusScanInput()
}

const createNewJob = async (empId: string, shipmentId: string) => {
  try {
    const job = await createJob(shipmentId, empId)
    recentlyCreatedJob.value = job
    
    // Update shipment status
    await updateShipmentStatus(shipmentId, 'in_progress')
    
    setTimeout(() => {
      recentlyCreatedJob.value = null
    }, 5000)

    statusMessage.value = { type: 'success', text: 'Job created successfully' }
    setTimeout(() => {
      closeScanModal()
      resetScan()
    }, 1500)
  } catch (err) {
    statusMessage.value = { type: 'error', text: 'Failed to create job' }
    console.error(err)
  }
}

const resetScan = () => {
  scanStep.value = 'employee'
  scanValue.value = ''
  employeeId.value = ''
  statusMessage.value = null
  focusScanInput()
}

const handleMouseMove = () => {
  // Empty function but kept to prevent template errors
}

const handleCardEnter = () => {
  isOverCard.value = true
}

const handleCardLeave = () => {
  isOverCard.value = false
}

// Clean up on unmount
onUnmounted(() => {
  // Empty function but kept to prevent template errors
})

// Add formatElapsedTime function
const formatElapsedTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Not started'
  const now = new Date()
  const updated = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}h${minutes}m ago`
  }
}

// Add getInitials helper function
const getInitials = (name: string | null): string => {
  if (!name) return ''
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

// Add getStepStatus function
const getStepStatus = (job: Job, step: keyof JobSteps): { color: string; text: string } => {
  const stepData = job.steps[step]
  if (!stepData.lastUpdated) return { color: 'gray', text: 'Not Started' }
  
  const now = new Date()
  const lastUpdated = new Date(stepData.lastUpdated)
  const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
  
  if (stepData.progress === 100) return { color: 'green', text: 'Complete' }
  if (hoursElapsed <= 1) return { color: 'green', text: '< 1h' }
  if (hoursElapsed <= 2) return { color: 'yellow', text: '1-2h' }
  return { color: 'red', text: '> 2h' }
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 9

const totalPages = computed(() => Math.ceil(currentJobs.length / itemsPerPage))

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return currentJobs.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
</script>

<style scoped>
.kiosk-view {
  @apply min-h-screen bg-[#0f1729] text-white;
}

.check-in-card-container {
  position: relative;
  height: 200px;
  border-radius: 0.75rem;
  background: rgba(15, 23, 41, 0.9);
  padding: 2px;
}

.rotating-border {
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  border: 2px solid rgba(56, 189, 248, 0.1);
}

.rotating-border::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgb(56, 189, 248);
  border-radius: 50%;
  box-shadow: 
    0 0 15px rgba(56, 189, 248, 0.8),
    0 0 30px rgba(56, 189, 248, 0.4);
  animation: move-node 3s linear infinite;
  transform-origin: center;
}

.check-in-card {
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 1;
  background: rgba(15, 23, 41, 0.9);
  border-radius: 0.75rem;
  @apply flex items-center justify-center cursor-pointer backdrop-blur-sm;
}

@keyframes move-node {
  0% {
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
  }
  25% {
    left: 100%;
    top: 0;
    transform: translate(-50%, -50%);
  }
  50% {
    left: 100%;
    top: 100%;
    transform: translate(-50%, -50%);
  }
  75% {
    left: 0;
    top: 100%;
    transform: translate(-50%, -50%);
  }
  100% {
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
  }
}

.jobs-grid {
  @apply grid grid-cols-3 gap-4 w-full max-w-[1400px] mx-auto px-4;
  min-height: calc(100vh - 200px);
  grid-template-rows: repeat(3, 1fr);
}

.job-card {
  @apply bg-surface-dark/90 backdrop-blur-sm rounded-xl p-4
    border-2
    transition-all duration-300 hover:bg-surface-dark
    flex flex-col relative;
  min-height: 0;
}

.job-card.empty {
  @apply opacity-30;
}

.job-card.recently-created {
  @apply bg-sky-500/5 border-sky-500/30;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

/* Scrollbar Styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
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

/* Remove all mouse glow related styles */
.mouse-glow-container,
.mouse-glow-node,
.background-glow,
.glow-node {
  display: none;
}

/* Keep other styles */
.kiosk-view {
  @apply min-h-screen bg-[#0f1729] text-white;
}

/* Remove tooltip styles */
.group:hover .tooltip {
  display: none;
}

/* Add new styles for pagination buttons */
button {
  @apply focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-[#0f1729];
}

.ekg-line {
  animation: ekg-pulse 2s ease-in-out infinite;
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
}

@keyframes ekg-pulse {
  0% {
    stroke-dashoffset: 400;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -400;
  }
}

.status-card {
  @apply bg-surface-dark/90 backdrop-blur-sm rounded-xl p-4 border-2 border-white/10
    transition-all duration-300 hover:border-sky-500/50 hover:bg-surface-dark cursor-pointer;
}
</style> 