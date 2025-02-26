import { ipcMain } from 'electron'
import { db } from '../database'
import { generateUniqueId } from '../utils/idGenerator'
import { validateShipmentData } from '../utils/validators'
import type { ShipmentData } from '../../src/composables/useShipments'

export function registerShipmentHandlers() {
  // Create shipment
  ipcMain.handle('shipment:create', async (_, data: ShipmentData) => {
    try {
      // Validate input data
      const validationError = validateShipmentData(data)
      if (validationError) {
        return {
          success: false,
          error: validationError
        }
      }

      // Generate unique shipment ID
      const shipmentId = generateUniqueId('SHIP')

      // Get client and project names
      const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(data.clientId)
      const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(data.projectId)

      if (!client || !project) {
        return {
          success: false,
          error: 'Invalid client or project ID'
        }
      }

      // Insert shipment
      const now = new Date().toISOString()
      const shipment = {
        id: shipmentId,
        client_id: data.clientId,
        project_id: data.projectId,
        box_count: data.boxCount,
        priority: data.priority,
        carrier: data.carrier,
        tracking_number: data.trackingNumber,
        notes: data.notes,
        status: 'pending',
        created_at: now,
        updated_at: now
      }

      db.prepare(\`
        INSERT INTO shipments (
          id, client_id, project_id, box_count, priority,
          carrier, tracking_number, notes, status,
          created_at, updated_at
        ) VALUES (
          @id, @client_id, @project_id, @box_count, @priority,
          @carrier, @tracking_number, @notes, @status,
          @created_at, @updated_at
        )
      \`).run(shipment)

      // Return created shipment with client and project names
      return {
        success: true,
        data: {
          ...shipment,
          clientName: client.name,
          projectName: project.name
        }
      }
    } catch (error) {
      console.error('Error creating shipment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create shipment'
      }
    }
  })

  // List shipments
  ipcMain.handle('shipment:list', async (_, filters?: {
    status?: string
    search?: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      let query = \`
        SELECT 
          s.*,
          c.name as client_name,
          p.name as project_name
        FROM shipments s
        JOIN clients c ON s.client_id = c.id
        JOIN projects p ON s.project_id = p.id
        WHERE 1=1
      \`
      const params: any = {}

      if (filters?.status && filters.status !== 'all') {
        query += ' AND s.status = @status'
        params.status = filters.status
      }

      if (filters?.search) {
        query += \`
          AND (
            s.id LIKE @search
            OR c.name LIKE @search
            OR p.name LIKE @search
            OR s.tracking_number LIKE @search
          )
        \`
        params.search = \`%\${filters.search}%\`
      }

      if (filters?.startDate) {
        query += ' AND s.created_at >= @startDate'
        params.startDate = filters.startDate
      }

      if (filters?.endDate) {
        query += ' AND s.created_at <= @endDate'
        params.endDate = filters.endDate
      }

      query += ' ORDER BY s.created_at DESC'

      const shipments = db.prepare(query).all(params)

      return {
        success: true,
        data: shipments.map(s => ({
          id: s.id,
          clientId: s.client_id,
          clientName: s.client_name,
          projectId: s.project_id,
          projectName: s.project_name,
          boxCount: s.box_count,
          priority: s.priority,
          carrier: s.carrier,
          trackingNumber: s.tracking_number,
          notes: s.notes,
          status: s.status,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }))
      }
    } catch (error) {
      console.error('Error listing shipments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list shipments'
      }
    }
  })

  // Update shipment status
  ipcMain.handle('shipment:update-status', async (_, {
    shipmentId,
    status
  }: {
    shipmentId: string
    status: string
  }) => {
    try {
      const now = new Date().toISOString()

      const result = db.prepare(\`
        UPDATE shipments
        SET status = @status,
            updated_at = @updatedAt
        WHERE id = @id
        RETURNING *
      \`).get({
        id: shipmentId,
        status,
        updatedAt: now
      })

      if (!result) {
        return {
          success: false,
          error: 'Shipment not found'
        }
      }

      // Get client and project names
      const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(result.client_id)
      const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(result.project_id)

      return {
        success: true,
        data: {
          id: result.id,
          clientId: result.client_id,
          clientName: client.name,
          projectId: result.project_id,
          projectName: project.name,
          boxCount: result.box_count,
          priority: result.priority,
          carrier: result.carrier,
          trackingNumber: result.tracking_number,
          notes: result.notes,
          status: result.status,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        }
      }
    } catch (error) {
      console.error('Error updating shipment status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update shipment status'
      }
    }
  })

  // Generate shipment label
  ipcMain.handle('shipment:generate-label', async (_, shipmentId: string) => {
    try {
      // Get shipment details
      const shipment = db.prepare(\`
        SELECT 
          s.*,
          c.name as client_name,
          p.name as project_name
        FROM shipments s
        JOIN clients c ON s.client_id = c.id
        JOIN projects p ON s.project_id = p.id
        WHERE s.id = ?
      \`).get(shipmentId)

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        }
      }

      // TODO: Implement actual label generation logic
      // For now, return a mock URL
      return {
        success: true,
        data: {
          labelUrl: \`/labels/\${shipmentId}.pdf\`
        }
      }
    } catch (error) {
      console.error('Error generating label:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate label'
      }
    }
  })
} 