import type { ShipmentData } from '../../src/composables/useShipments'

export function validateShipmentData(data: ShipmentData): string | null {
  // Required fields
  if (!data.clientId) {
    return 'Client ID is required'
  }

  if (!data.projectId) {
    return 'Project ID is required'
  }

  if (!data.boxCount || data.boxCount < 1) {
    return 'Box count must be at least 1'
  }

  if (!data.priority || !['normal', 'urgent', 'rush'].includes(data.priority)) {
    return 'Invalid priority value'
  }

  // Optional fields with validation
  if (data.carrier && !['fedex', 'ups', 'usps', 'dhl'].includes(data.carrier)) {
    return 'Invalid carrier'
  }

  if (data.trackingNumber && data.trackingNumber.length > 100) {
    return 'Tracking number is too long'
  }

  if (data.notes && data.notes.length > 1000) {
    return 'Notes are too long (maximum 1000 characters)'
  }

  return null
} 