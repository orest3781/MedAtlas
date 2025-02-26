-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  box_count INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'normal',
  carrier TEXT,
  tracking_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipments_client ON shipments (client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_project ON shipments (project_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments (created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS shipments_updated_at
AFTER UPDATE ON shipments
BEGIN
  UPDATE shipments SET updated_at = DATETIME('now')
  WHERE id = NEW.id;
END; 