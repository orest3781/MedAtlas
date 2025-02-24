import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export class DatabaseService {
  constructor(dbPath = 'medatlas.db') {
    this.dbPath = dbPath;
    this.dbPromise = this.initializeDatabase();
  }

  async initializeDatabase() {
    return open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });
  }

  async getDb() {
    return await this.dbPromise;
  }

  async initializeSchema() {
    const db = await this.getDb();
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        sla_hours INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
      
      CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        tracking_number TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        box_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_shipments_project ON shipments(project_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
      
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id INTEGER NOT NULL,
        operator_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        current_step TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_jobs_shipment ON jobs(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_operator ON jobs(operator_id);
      
      CREATE TABLE IF NOT EXISTS job_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        step_name TEXT NOT NULL,
        operator_id INTEGER,
        progress INTEGER DEFAULT 0,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_job_steps_job ON job_steps(job_id);
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    `);
  }

  async createUser(user) {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [user.name, user.email, user.password, user.role, user.status]
    );
    return { id: result.lastID, ...user };
  }

  async createClient(client) {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO clients (name, contact_name, email, phone, status) VALUES (?, ?, ?, ?, ?)',
      [client.name, client.contact_name, client.email, client.phone, client.status]
    );
    return { id: result.lastID, ...client };
  }

  async createProject(project) {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO projects (client_id, name, description, status, sla_hours) VALUES (?, ?, ?, ?, ?)',
      [project.client_id, project.name, project.description, project.status, project.sla_hours]
    );
    return { id: result.lastID, ...project };
  }

  async createShipment(shipment) {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO shipments (project_id, tracking_number, status, box_count) VALUES (?, ?, ?, ?)',
      [shipment.project_id, shipment.tracking_number, shipment.status, shipment.box_count]
    );
    return { id: result.lastID, ...shipment };
  }

  async createJob(job) {
    const db = await this.getDb();
    const result = await db.run(
      'INSERT INTO jobs (shipment_id, operator_id, status, current_step, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [job.shipment_id, job.operator_id, job.status, job.current_step, job.started_at, job.completed_at]
    );
    return { id: result.lastID, ...job };
  }

  async getShipments() {
    const db = await this.getDb();
    return db.all(`
      SELECT s.*, p.name as project_name, c.name as client_name
      FROM shipments s
      JOIN projects p ON s.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      ORDER BY s.created_at DESC
    `);
  }

  // User operations
  getUsers() {
    return this.db.prepare('SELECT id, name, email, role, status, created_at, last_login FROM users').all()
  }

  updateUser(id, { name, email, role, status, password }) {
    const updates = []
    const params = []

    if (name) {
      updates.push('name = ?')
      params.push(name)
    }
    if (email) {
      updates.push('email = ?')
      params.push(email)
    }
    if (role) {
      updates.push('role = ?')
      params.push(role)
    }
    if (status) {
      updates.push('status = ?')
      params.push(status)
    }
    if (password) {
      updates.push('password = ?')
      params.push(bcrypt.hashSync(password, 10))
    }

    params.push(id)
    
    return this.db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).get(...params)
  }

  // Client operations
  getClients() {
    return this.db.prepare('SELECT * FROM clients').all()
  }

  updateClient(id, { name, contactName, email, phone, status }) {
    const updates = []
    const params = []

    if (name) {
      updates.push('name = ?')
      params.push(name)
    }
    if (contactName) {
      updates.push('contact_name = ?')
      params.push(contactName)
    }
    if (email) {
      updates.push('email = ?')
      params.push(email)
    }
    if (phone) {
      updates.push('phone = ?')
      params.push(phone)
    }
    if (status) {
      updates.push('status = ?')
      params.push(status)
    }

    params.push(id)
    
    return this.db.prepare(`
      UPDATE clients 
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).get(...params)
  }

  // Project operations
  getProjects() {
    return this.db.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        c.contact_name as client_contact_name
      FROM projects p
      JOIN clients c ON p.client_id = c.id
    `).all()
  }

  // Job operations
  getJobById(jobId) {
    const job = this.db.prepare(`
      SELECT 
        j.*,
        s.tracking_number,
        s.box_count,
        p.name as project_name,
        c.name as client_name
      FROM jobs j
      JOIN shipments s ON j.shipment_id = s.id
      JOIN projects p ON s.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE j.id = ?
    `).get(jobId)

    if (!job) return null

    const steps = this.db.prepare(`
      SELECT *
      FROM job_steps
      WHERE job_id = ?
      ORDER BY step_name
    `).all(jobId)

    return { ...job, steps }
  }

  getJobs() {
    const jobs = this.db.prepare(`
      SELECT 
        j.*,
        s.tracking_number,
        s.box_count,
        p.name as project_name,
        c.name as client_name
      FROM jobs j
      JOIN shipments s ON j.shipment_id = s.id
      JOIN projects p ON s.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      ORDER BY j.started_at DESC
    `).all()

    const stepsStmt = this.db.prepare(`
      SELECT *
      FROM job_steps
      WHERE job_id = ?
      ORDER BY step_name
    `)

    return jobs.map(job => ({
      ...job,
      steps: stepsStmt.all(job.id)
    }))
  }

  updateJobStep(jobId, stepName, { progress, operatorId }) {
    const transaction = this.db.transaction((jobId, stepName, progress, operatorId) => {
      // Update the step
      this.db.prepare(`
        UPDATE job_steps
        SET 
          progress = ?,
          operator_id = ?,
          started_at = CASE 
            WHEN started_at IS NULL AND ? > 0 THEN CURRENT_TIMESTAMP
            ELSE started_at
          END,
          completed_at = CASE 
            WHEN ? = 100 THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END
        WHERE job_id = ? AND step_name = ?
      `).run(progress, operatorId, progress, progress, jobId, stepName)

      // If this step is completed, update the job's current step to the next one
      if (progress === 100) {
        const steps = ['PREP', 'SCAN', 'QC', 'INDEX', 'REPREP']
        const currentIndex = steps.indexOf(stepName)
        
        if (currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1]
          this.db.prepare(`
            UPDATE jobs
            SET current_step = ?
            WHERE id = ?
          `).run(nextStep, jobId)
        } else {
          // All steps completed
          this.db.prepare(`
            UPDATE jobs
            SET 
              status = 'completed',
              completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(jobId)
        }
      }

      return this.getJobById(jobId)
    })

    return transaction(jobId, stepName, progress, operatorId)
  }

  // Audit logging
  logAudit(userId, action, entityType, entityId, details) {
    return this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'audit-' + Date.now(),
      userId,
      action,
      entityType,
      entityId,
      JSON.stringify(details)
    )
  }

  getAuditLogs(filters = {}) {
    let query = `
      SELECT 
        al.*,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `
    const conditions = []
    const params = []

    if (filters.userId) {
      conditions.push('al.user_id = ?')
      params.push(filters.userId)
    }
    if (filters.action) {
      conditions.push('al.action = ?')
      params.push(filters.action)
    }
    if (filters.entityType) {
      conditions.push('al.entity_type = ?')
      params.push(filters.entityType)
    }
    if (filters.fromDate) {
      conditions.push('al.created_at >= ?')
      params.push(filters.fromDate)
    }
    if (filters.toDate) {
      conditions.push('al.created_at <= ?')
      params.push(filters.toDate)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY al.created_at DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    return this.db.prepare(query).all(...params)
  }

  // Database management
  getDatabaseStats() {
    return {
      users: this.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      clients: this.db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
      projects: this.db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
      activeJobs: this.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'in_progress'").get().count,
      completedJobs: this.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get().count,
      auditLogs: this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count
    }
  }

  close() {
    this.db.close()
  }
} 