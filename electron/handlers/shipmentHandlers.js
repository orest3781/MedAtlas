const { ipcMain } = require('electron')
const db = require('../services/database')

function registerShipmentHandlers() {
  // Create shipment
  ipcMain.handle('shipment:create', async (event, data) => {
    try {
      const shipment = await db.createShipment(data)
      await db.logAudit(event.sender.id, 'CREATE', 'SHIPMENT', shipment.id, data)
      return { data: shipment }
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // List shipments
  ipcMain.handle('shipment:list', async (event, filters) => {
    try {
      const shipments = await db.getShipments(filters)
      return { data: shipments }
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Update shipment status
  ipcMain.handle('shipment:update-status', async (event, { shipmentId, status }) => {
    try {
      const shipment = await db.updateShipmentStatus(shipmentId, status)
      await db.logAudit(event.sender.id, 'UPDATE', 'SHIPMENT', shipmentId, { status })
      return { data: shipment }
    } catch (error) {
      throw new Error(error.message)
    }
  })

  // Generate shipment label
  ipcMain.handle('shipment:generate-label', async (event, shipmentId) => {
    try {
      // TODO: Implement actual label generation
      return {
        data: {
          labelUrl: `/labels/${shipmentId}.pdf`
        }
      }
    } catch (error) {
      throw new Error(error.message)
    }
  })
}

module.exports = {
  registerShipmentHandlers
} 