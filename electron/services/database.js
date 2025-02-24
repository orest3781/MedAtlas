const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const bcrypt = require('bcryptjs')

class DatabaseService {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'medatlas.db')
    this.db = new Database(dbPath)
    this.db.pragma('foreign_keys = ON')
  }

  // User operations
  createUser({ name, email, password, role }) {
    const hashedPassword = bcrypt.hashSync(password, 10)
    return this.db.prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      'user-' + Date.now(),
      name,
      email,
      hashedPassword,
      role
    )
  }

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
  createClient({ name, contactName, email, phone }) {
    return this.db.prepare(`
      INSERT INTO clients (id, name, contact_name, email, phone)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      'client-' + Date.now(),
      name,
      contactName,
      email,
      phone
    )
  }

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
  createProject({ clientId, name, description, slaHours }) {
    return this.db.prepare(`
      INSERT INTO projects (id, client_id, name, description, sla_hours)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      'project-' + Date.now(),
      clientId,
      name,
      description,
      slaHours
    )
  }

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
  createJob({ shipmentId, operatorId, currentStep }) {
    const jobId = 'job-' + Date.now()
    
    // Start a transaction
    const transaction = this.db.transaction((jobId, shipmentId, operatorId, currentStep) => {
      // Create the job
      this.db.prepare(`
        INSERT INTO jobs (id, shipment_id, operator_id, current_step)
        VALUES (?, ?, ?, ?)
      `).run(jobId, shipmentId, operatorId, currentStep)

      // Create initial job steps
      const steps = ['PREP', 'SCAN', 'QC', 'INDEX', 'REPREP']
      const stepStmt = this.db.prepare(`
        INSERT INTO job_steps (id, job_id, step_name)
        VALUES (?, ?, ?)
      `)

      steps.forEach(step => {
        stepStmt.run('step-' + Date.now() + Math.random(), jobId, step)
      })

      // Return the created job with its steps
      return this.getJobById(jobId)
    })

    return transaction(jobId, shipmentId, operatorId, currentStep)
  }

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

module.exports = DatabaseService 