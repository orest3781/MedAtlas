import { ref } from 'vue'

export interface ShipmentData {
  clientId: number
  projectId: number
  boxCount: number
  priority: 'normal' | 'urgent' | 'rush'
  carrier?: string
  trackingNumber?: string
  notes?: string
}

export interface Shipment extends ShipmentData {
  id: string
  clientName: string
  projectName: string
  status: 'pending' | 'processing' | 'completed'
  createdAt: string
  updatedAt: string
}

export function useShipments() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const createShipment = async (data: ShipmentData): Promise<Shipment> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await window.api.createShipment(data)
      return result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getShipments = async (filters?: {
    status?: string
    search?: string
    startDate?: string
    endDate?: string
  }): Promise<Shipment[]> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await window.api.listShipments(filters)
      return result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateShipmentStatus = async (
    shipmentId: string,
    status: Shipment['status']
  ): Promise<Shipment> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await window.api.updateShipmentStatus(shipmentId, status)
      return result.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateLabel = async (shipmentId: string): Promise<string> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await window.api.generateLabel(shipmentId)
      return result.data.labelUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    createShipment,
    getShipments,
    updateShipmentStatus,
    generateLabel
  }
} 