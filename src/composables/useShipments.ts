import { ref } from 'vue'
import type { Shipment } from '@/types/database'

export function useShipments() {
  const shipments = ref<Shipment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load all shipments
  const loadShipments = async () => {
    try {
      loading.value = true
      shipments.value = await window.api.getShipments()
    } catch (err) {
      error.value = 'Failed to load shipments'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Get shipment by tracking number
  const getShipmentByTracking = async (trackingNumber: string) => {
    try {
      loading.value = true
      const result = shipments.value.find(s => s.tracking_number === trackingNumber)
      if (result) return result

      // If not in local state, load all shipments and try again
      await loadShipments()
      return shipments.value.find(s => s.tracking_number === trackingNumber)
    } catch (err) {
      error.value = 'Failed to find shipment'
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create a new shipment
  const createShipment = async (shipmentData: Partial<Shipment>) => {
    try {
      loading.value = true
      const shipment = await window.api.createShipment(shipmentData)
      shipments.value.unshift(shipment)
      return shipment
    } catch (err) {
      error.value = 'Failed to create shipment'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update shipment status
  const updateShipmentStatus = async (id: string, status: Shipment['status']) => {
    try {
      loading.value = true
      const updatedShipment = await window.api.updateShipment(id, { status })
      
      // Update in local state
      const index = shipments.value.findIndex(s => s.id === id)
      if (index !== -1) {
        shipments.value[index] = updatedShipment
      }
      
      return updatedShipment
    } catch (err) {
      error.value = 'Failed to update shipment status'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    shipments,
    loading,
    error,
    loadShipments,
    getShipmentByTracking,
    createShipment,
    updateShipmentStatus
  }
} 