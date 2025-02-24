import { ref, computed } from 'vue'
import type { Job, JobStep } from '@/types/database'

export function useJobs() {
  const jobs = ref<Job[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load all jobs
  const loadJobs = async () => {
    try {
      loading.value = true
      jobs.value = await window.api.getJobs()
    } catch (err) {
      error.value = 'Failed to load jobs'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Create a new job
  const createJob = async (shipmentId: string, operatorId: string) => {
    try {
      loading.value = true
      const job = await window.api.createJob({
        shipment_id: shipmentId,
        operator_id: operatorId,
        status: 'in_progress',
        current_step: 'PREP',
        started_at: new Date().toISOString(),
        completed_at: null
      })
      jobs.value.unshift(job)
      return job
    } catch (err) {
      error.value = 'Failed to create job'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update job step
  const updateJobStep = async (jobId: string, stepName: string, progress: number, operatorId: string) => {
    try {
      loading.value = true
      const updatedJob = await window.api.updateJobStep(jobId, {
        stepName,
        progress,
        operatorId
      })
      
      // Update the job in the local state
      const index = jobs.value.findIndex(j => j.id === jobId)
      if (index !== -1) {
        jobs.value[index] = updatedJob
      }
      
      return updatedJob
    } catch (err) {
      error.value = 'Failed to update job step'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const activeJobs = computed(() => 
    jobs.value.filter(job => job.status === 'in_progress')
  )

  const completedJobsToday = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return jobs.value.filter(job => {
      if (!job.completed_at) return false
      const completedDate = new Date(job.completed_at)
      return completedDate >= today
    }).length
  })

  const averageProcessingTime = computed(() => {
    const completedJobs = jobs.value.filter(job => job.completed_at)
    if (completedJobs.length === 0) return 0

    const totalTime = completedJobs.reduce((sum, job) => {
      const start = new Date(job.started_at)
      const end = new Date(job.completed_at!)
      return sum + (end.getTime() - start.getTime())
    }, 0)

    return totalTime / completedJobs.length / (1000 * 60 * 60) // Convert to hours
  })

  const queueStatus = computed(() => {
    const delayedJobs = activeJobs.value.filter(job => {
      const stepData = job.steps?.find(s => s.step_name === job.current_step)
      if (!stepData?.started_at) return false
      
      const now = new Date()
      const lastUpdated = new Date(stepData.started_at)
      const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
      
      return hoursElapsed > 2
    })

    const totalJobs = activeJobs.value.length
    const delayedCount = delayedJobs.length
    const delayRatio = delayedCount / (totalJobs || 1)

    if (delayRatio === 0 && totalJobs < 5) return { text: 'Optimal', color: 'green' }
    if (delayRatio === 0) return { text: 'Busy', color: 'sky' }
    if (delayRatio < 0.3) return { text: 'Delayed', color: 'yellow' }
    return { text: 'Backlogged', color: 'red' }
  })

  return {
    jobs,
    loading,
    error,
    activeJobs,
    completedJobsToday,
    averageProcessingTime,
    queueStatus,
    loadJobs,
    createJob,
    updateJobStep
  }
} 