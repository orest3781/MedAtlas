import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Job, JobStatus, JobStep } from '@/types/database'

export const useJobStore = defineStore('jobs', () => {
  const jobs = ref<Job[]>([])
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  // Getters
  const activeJobs = computed(() => {
    return jobs.value.filter(job => job.status !== 'completed')
  })

  const completedJobs = computed(() => {
    return jobs.value.filter(job => job.status === 'completed')
  })

  // Actions
  const setJobs = (newJobs: Job[]) => {
    jobs.value = newJobs
  }

  const fetchJobs = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await window.api.getJobs()
      jobs.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch jobs'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    isLoading.value = true
    error.value = null

    try {
      await window.api.updateJobStatus(jobId, status)
      const jobIndex = jobs.value.findIndex(job => job.id === jobId)
      if (jobIndex !== -1) {
        jobs.value[jobIndex].status = status
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job status'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const updateJobStep = async (jobId: string, stepId: string, status: string) => {
    isLoading.value = true
    error.value = null

    try {
      await window.api.updateJobStep(jobId, stepId, status)
      const jobIndex = jobs.value.findIndex(job => job.id === jobId)
      if (jobIndex !== -1) {
        const stepIndex = jobs.value[jobIndex].steps.findIndex(step => step.id === stepId)
        if (stepIndex !== -1) {
          jobs.value[jobIndex].steps[stepIndex].status = status
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job step'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    jobs,
    error,
    isLoading,
    
    // Getters
    activeJobs,
    completedJobs,
    
    // Actions
    setJobs,
    fetchJobs,
    updateJobStatus,
    updateJobStep
  }
}) 