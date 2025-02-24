<template>
  <div class="min-h-screen bg-surface-darker text-white p-8">
    <!-- Header -->
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">MedAtlas Demo</h1>
      
      <!-- Demo Controls -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Simulation Panel -->
        <div class="bg-surface-dark/30 backdrop-blur-sm rounded-xl p-6 border border-white/5">
          <h2 class="text-lg font-semibold mb-4">Simulation Controls</h2>
          
          <!-- Demo Credentials -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-white/60 mb-2">Quick Login:</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="cred in demoCredentials"
                :key="cred.username"
                @click="simulateLogin(cred)"
                class="px-3 py-2 bg-surface-dark hover:bg-surface-darker text-sm rounded border border-white/10 transition-colors"
              >
                {{ cred.label }}
              </button>
            </div>
          </div>

          <!-- Barcode Simulation -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-white/60 mb-2">Simulate Barcode Scan:</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="barcode in demoBarcodes"
                :key="barcode.id"
                @click="simulateScan(barcode)"
                class="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-sm rounded border border-sky-500/20 transition-colors"
              >
                {{ barcode.label }}
              </button>
            </div>
          </div>

          <!-- Demo Steps -->
          <div class="mt-6">
            <h3 class="text-sm font-medium text-white/60 mb-2">Demo Steps:</h3>
            <ol class="list-decimal list-inside space-y-2 text-sm text-white/80">
              <li>Login as Operator or Supervisor</li>
              <li>Scan an employee badge</li>
              <li>Scan a shipment barcode</li>
              <li>Watch the job appear in tracking</li>
              <li>Try different combinations</li>
            </ol>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="bg-surface-dark/30 backdrop-blur-sm rounded-xl p-6 border border-white/5">
          <h2 class="text-lg font-semibold mb-4">Live System Status</h2>
          
          <!-- Current User -->
          <div class="mb-4 p-3 bg-surface-darker rounded border border-white/10">
            <div class="text-sm text-white/60">Current User:</div>
            <div v-if="currentUser" class="font-medium">
              {{ currentUser.username }} ({{ currentUser.role }})
            </div>
            <div v-else class="text-white/40">Not logged in</div>
          </div>

          <!-- Last Scan -->
          <div class="mb-4 p-3 bg-surface-darker rounded border border-white/10">
            <div class="text-sm text-white/60">Last Scan:</div>
            <div v-if="lastScan" class="font-medium">
              {{ lastScan.type }}: {{ lastScan.value }}
            </div>
            <div v-else class="text-white/40">No scans yet</div>
          </div>

          <!-- Active Jobs -->
          <div>
            <div class="text-sm text-white/60 mb-2">Active Jobs:</div>
            <div class="space-y-2">
              <div
                v-for="job in activeJobs"
                :key="job.id"
                class="p-3 bg-surface-darker rounded border border-white/10"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium">{{ job.shipmentId }}</div>
                    <div class="text-sm text-white/60">{{ job.employeeId }}</div>
                  </div>
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-sky-500/20 text-sky-400">
                    {{ job.status }}
                  </span>
                </div>
              </div>
              <div v-if="activeJobs.length === 0" class="text-white/40 text-center py-4">
                No active jobs
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Log -->
      <div class="bg-surface-dark/30 backdrop-blur-sm rounded-xl p-6 border border-white/5">
        <h2 class="text-lg font-semibold mb-4">System Log</h2>
        <div class="h-48 overflow-y-auto font-mono text-sm">
          <div
            v-for="(log, index) in systemLogs"
            :key="index"
            class="py-1 border-b border-white/5 last:border-0"
          >
            <span class="text-white/40">{{ log.timestamp }}</span>
            <span :class="getLogTypeClass(log.type)" class="ml-2">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Demo data
const demoCredentials = [
  { username: 'kiosk', password: 'medatlas2024', label: 'Login as Operator' },
  { username: 'supervisor', password: 'atlas2024', label: 'Login as Supervisor' }
]

const demoBarcodes = [
  { id: 'EMP001', label: 'Employee Badge #1', type: 'employee' },
  { id: 'EMP002', label: 'Employee Badge #2', type: 'employee' },
  { id: 'SHIP001', label: 'Shipment #1', type: 'shipment' },
  { id: 'SHIP002', label: 'Shipment #2', type: 'shipment' }
]

// State
const currentUser = ref<{ username: string; role: string } | null>(null)
const lastScan = ref<{ type: string; value: string } | null>(null)
const activeJobs = ref<Array<{
  id: number;
  shipmentId: string;
  employeeId: string;
  status: string;
}>>([])
const systemLogs = ref<Array<{
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}>>([])

// Helper functions
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  systemLogs.value.unshift({ timestamp, type, message })
}

const getLogTypeClass = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-400'
    case 'warning': return 'text-yellow-400'
    case 'error': return 'text-red-400'
    default: return 'text-white/80'
  }
}

// Simulation functions
const simulateLogin = (cred: { username: string; password: string }) => {
  const role = cred.username === 'kiosk' ? 'KIOSK_OPERATOR' : 'KIOSK_SUPERVISOR'
  currentUser.value = { username: cred.username, role }
  addLog(`User ${cred.username} logged in as ${role}`, 'success')
}

const simulateScan = (barcode: { id: string; type: string }) => {
  lastScan.value = { type: barcode.type, value: barcode.id }
  addLog(`Scanned ${barcode.type}: ${barcode.id}`, 'info')

  if (barcode.type === 'shipment' && lastScan.value?.type === 'employee') {
    const newJob = {
      id: Date.now(),
      shipmentId: barcode.id,
      employeeId: lastScan.value.value,
      status: 'In Progress'
    }
    activeJobs.value.unshift(newJob)
    addLog(`New job created: ${barcode.id}`, 'success')
  }
}
</script> 