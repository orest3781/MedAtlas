import { registerShipmentHandlers } from './handlers/shipmentHandlers'

app.whenReady().then(() => {
  // Register IPC handlers
  registerShipmentHandlers()
}) 