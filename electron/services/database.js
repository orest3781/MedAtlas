const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { app } = require('electron');
const { promisify } = require('util');
const { errorHandler, AppError, ErrorCodes } = require('./errorHandler');

class DatabaseService {
  constructor() {
    this.ready = false;
    this.db = null;
    this.initializationPromise = null;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async init() {
    // If already initializing, return the promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Create a new initialization promise
    this.initializationPromise = this._initWithRetry();
    return this.initializationPromise;
  }

  async _initWithRetry(retryCount = 0) {
    if (!app.isReady()) {
      await new Promise(resolve => app.on('ready', resolve));
    }
    
    try {
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'medatlas.db');
      console.log('Database path:', this.dbPath);
      
      // Close any existing connection
      if (this.db) {
        try {
          this.db.close();
          this.db = null;
        } catch (err) {
          const wrappedError = errorHandler.handleError(
            err, 
            'database', 
            { action: 'close_connection', dbPath: this.dbPath }
          );
          console.warn('Error closing existing database connection:', wrappedError.message);
        }
      }
      
      // Attempt to open the database with better error handling
      try {
        this.db = new Database(this.dbPath, { 
          verbose: console.log,
          fileMustExist: false
        });
      } catch (err) {
        errorHandler.logError(err, { 
          action: 'open_database', 
          dbPath: this.dbPath,
          retryCount 
        });
        
        if (retryCount < this.maxRetries) {
          console.log(`Retrying database initialization (${retryCount + 1}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this._initWithRetry(retryCount + 1);
        }
        
        throw new AppError(
          `Failed to open database after ${this.maxRetries} attempts: ${err.message}`,
          ErrorCodes.DB_CONNECTION_ERROR,
          { dbPath: this.dbPath, retryCount },
          err
        );
      }
      
      await this.initializeSchema();
      await this.createInitialAdmin();
      this.ready = true;
      errorHandler.log('Database initialization completed successfully', 'info', { dbPath: this.dbPath });
    } catch (error) {
      const wrappedError = errorHandler.handleError(
        error, 
        'database', 
        { action: 'init_database', dbPath: this.dbPath }
      );
      this.ready = false;
      this.initializationPromise = null;
      throw wrappedError;
    }
  }

  // Check if database is ready for use
  isReady() {
    return this.ready && this.db !== null;
  }

  // Wait until database is ready
  async waitUntilReady(timeout = 10000) {
    if (this.isReady()) {
      return true;
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (this.isReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new AppError(
      `Database not ready after ${timeout}ms`,
      ErrorCodes.DB_INITIALIZATION_ERROR,
      { timeout, dbPath: this.dbPath }
    );
  }

  // Helper method to run SQL with better-sqlite3
  run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return { 
        id: result.lastInsertRowid,
        changes: result.changes 
      };
    } catch (error) {
      throw errorHandler.handleError(
        error, 
        'database',
        { action: 'run_sql', sql, params }
      );
    }
  }

  // Helper method to get a single row
  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      throw errorHandler.handleError(
        error, 
        'database',
        { action: 'get_row', sql, params }
      );
    }
  }

  // Helper method to get all rows
  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      throw errorHandler.handleError(
        error, 
        'database',
        { action: 'get_all_rows', sql, params }
      );
    }
  }

  async initializeSchema() {
    try {
      // Check if schema needs to be initialized
      const tableExists = await this.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );

      if (!tableExists) {
        console.log('Initializing database schema...');
        
        // Create tables one by one
        const statements = [
          // Users table
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
          )`,
          
          // Archived users table
          `CREATE TABLE IF NOT EXISTS archived_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            last_login DATETIME,
            archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            archive_reason TEXT,
            archived_by INTEGER,
            FOREIGN KEY (archived_by) REFERENCES users(id)
          )`,
          
          // Clients table
          `CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_name TEXT,
            email TEXT,
            phone TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          
          // Projects table
          `CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            sla_hours INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
          )`,
          
          // Shipments table
          `CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            tracking_number TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            box_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
          )`,
          
          // Jobs table
          `CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id INTEGER NOT NULL,
            operator_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            current_step TEXT,
            started_at DATETIME,
            completed_at DATETIME,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id),
            FOREIGN KEY (operator_id) REFERENCES users(id)
          )`,
          
          // Job steps table
          `CREATE TABLE IF NOT EXISTS job_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            step_name TEXT NOT NULL,
            operator_id INTEGER,
            progress INTEGER DEFAULT 0,
            started_at DATETIME,
            completed_at DATETIME,
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            FOREIGN KEY (operator_id) REFERENCES users(id)
          )`,
          
          // Audit logs table
          `CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`,
          
          // Create indexes
          `CREATE INDEX IF NOT EXISTS idx_archived_users_email ON archived_users(email)`,
          `CREATE INDEX IF NOT EXISTS idx_archived_users_archived_at ON archived_users(archived_at)`,
          `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
          `CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)`,
          `CREATE INDEX IF NOT EXISTS idx_shipments_project ON shipments(project_id)`,
          `CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number)`,
          `CREATE INDEX IF NOT EXISTS idx_jobs_shipment ON jobs(shipment_id)`,
          `CREATE INDEX IF NOT EXISTS idx_jobs_operator ON jobs(operator_id)`,
          `CREATE INDEX IF NOT EXISTS idx_job_steps_job ON job_steps(job_id)`,
          `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`,
          `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`
        ];

        // Execute each statement in sequence
        for (const sql of statements) {
          await this.run(sql);
        }
        
        console.log('Database schema initialized successfully');
      } else {
        console.log('Database schema already exists');
        // Verify all tables exist
        const tables = [
          'users', 'archived_users', 'clients', 'projects', 
          'shipments', 'jobs', 'job_steps', 'audit_logs'
        ];
        
        for (const table of tables) {
          const exists = await this.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [table]
          );
          if (!exists) {
            console.log(`Table ${table} is missing, reinitializing schema...`);
            // Force reinitialization by recursively calling with cleared check
            await this.run("DROP TABLE IF EXISTS users");
            return this.initializeSchema();
          }
        }
      }
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }

  async createInitialAdmin() {
    try {
      const adminExists = await this.get('SELECT * FROM users WHERE role = ?', ['ADMIN']);
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        await this.run(
          'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
          ['Admin User', 'admin', hashedPassword, 'ADMIN', 'active']
        );
        console.log('Initial admin user created');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating initial admin:', error);
      throw error;
    }
  }

  // User operations
  async login(credentials) {
    try {
      const user = await this.get('SELECT * FROM users WHERE email = ?', [credentials.email]);
      
      if (!user) {
        throw new AppError(
          'User not found',
          ErrorCodes.AUTH_USER_NOT_FOUND,
          { email: credentials.email }
        );
      }

      const validPassword = await bcrypt.compare(credentials.password, user.password);
      if (!validPassword) {
        throw new AppError(
          'Invalid password',
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          { email: credentials.email }
        );
      }

      // Update last login
      await this.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // Only wrap errors that aren't already AppErrors
      if (!(error instanceof AppError)) {
        error = errorHandler.handleError(
          error, 
          'auth',
          { action: 'login', email: credentials?.email }
        );
      } else {
        // Just log AppErrors
        errorHandler.logError(error);
      }
      throw error;
    }
  }

  async createUser(user) {
    const result = await this.run(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [user.name, user.email, user.password, user.role, user.status]
    );
    return { id: result.id, ...user };
  }

  async getUsers() {
    return this.all('SELECT id, name, email, role, status, created_at, last_login FROM users');
  }

  async updateUser(id, { name, email, role, status, password }) {
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (password) {
      updates.push('password = ?');
      params.push(password);
    }

    params.push(id);
    
    await this.run(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    return await this.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  // Client operations
  async createClient(client) {
    const result = await this.run(
      'INSERT INTO clients (name, contact_name, email, phone, status) VALUES (?, ?, ?, ?, ?)',
      [client.name, client.contact_name, client.email, client.phone, client.status]
    );
    return { id: result.id, ...client };
  }

  async getClients() {
    return await this.all('SELECT * FROM clients');
  }

  async updateClient(id, { name, contactName, email, phone, status }) {
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (contactName) {
      updates.push('contact_name = ?');
      params.push(contactName);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    params.push(id);

    await this.run(`
      UPDATE clients 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    return await this.get('SELECT * FROM clients WHERE id = ?', [id]);
  }

  // Project operations
  async createProject(project) {
    const result = await this.run(
      'INSERT INTO projects (client_id, name, description, status, sla_hours) VALUES (?, ?, ?, ?, ?)',
      [project.client_id, project.name, project.description, project.status, project.sla_hours]
    );
    return { id: result.id, ...project };
  }

  async getProjects() {
    return await this.all(`
      SELECT 
        p.*,
        c.name as client_name,
        c.contact_name as client_contact_name
      FROM projects p
      JOIN clients c ON p.client_id = c.id
    `);
  }

  // Shipment operations
  async createShipment(shipment) {
    const result = await this.run(
      'INSERT INTO shipments (project_id, tracking_number, status, box_count) VALUES (?, ?, ?, ?)',
      [shipment.project_id, shipment.tracking_number, shipment.status || 'pending', shipment.box_count]
    );
    return { id: result.id, ...shipment };
  }

  async getShipments() {
    return await this.all(`
      SELECT 
        s.*,
        p.name as project_name,
        c.name as client_name
      FROM shipments s
      JOIN projects p ON s.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      ORDER BY s.created_at DESC
    `);
  }

  async updateShipmentStatus(id, status) {
    await this.run('UPDATE shipments SET status = ? WHERE id = ?', [status, id]);
    return await this.get('SELECT * FROM shipments WHERE id = ?', [id]);
  }

  // Job operations
  async createJob(job) {
    const result = await this.run(
      'INSERT INTO jobs (shipment_id, operator_id, status, current_step, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [job.shipment_id, job.operator_id, job.status, job.current_step, job.started_at, job.completed_at]
    );
    return { id: result.id, ...job };
  }

  async getJobs() {
    const jobs = await this.all(`
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
    `);

    const stepsStmt = this.db.prepare(`
      SELECT *
      FROM job_steps
      WHERE job_id = ?
      ORDER BY step_name
    `);

    return jobs.map(job => ({
      ...job,
      steps: stepsStmt.all(job.id)
    }));
  }

  async updateJobStep(jobId, stepName, { progress, operatorId }) {
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
      `).run(progress, operatorId, progress, progress, jobId, stepName);

      // If this step is completed, update the job's current step to the next one
      if (progress === 100) {
        const steps = ['PREP', 'SCAN', 'QC', 'INDEX', 'REPREP'];
        const currentIndex = steps.indexOf(stepName);
        
        if (currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          this.db.prepare(`
            UPDATE jobs
            SET current_step = ?
            WHERE id = ?
          `).run(nextStep, jobId);
        } else {
          // All steps completed
          this.db.prepare(`
            UPDATE jobs
            SET 
              status = 'completed',
              completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(jobId);
        }
      }

      return this.getJobById(jobId);
    });

    return transaction(jobId, stepName, progress, operatorId);
  }

  // Audit logging
  async logAudit(userId, action, entityType, entityId, details) {
    const result = await this.run(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, JSON.stringify(details)]
    );
    return result;
  }

  async getAuditLogs(filters = {}) {
    let query = `
      SELECT 
        al.*,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (filters.userId) {
      conditions.push('al.user_id = ?');
      params.push(filters.userId);
    }
    if (filters.action) {
      conditions.push('al.action = ?');
      params.push(filters.action);
    }
    if (filters.entityType) {
      conditions.push('al.entity_type = ?');
      params.push(filters.entityType);
    }
    if (filters.fromDate) {
      conditions.push('al.created_at >= ?');
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push('al.created_at <= ?');
      params.push(filters.toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return await this.all(query, ...params);
  }

  // Database management
  async getDatabaseStats() {
    return {
      users: await this.get('SELECT COUNT(*) as count FROM users'),
      clients: await this.get('SELECT COUNT(*) as count FROM clients'),
      projects: await this.get('SELECT COUNT(*) as count FROM projects'),
      activeJobs: await this.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'in_progress'"),
      completedJobs: await this.get("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'"),
      auditLogs: await this.get('SELECT COUNT(*) as count FROM audit_logs')
    };
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
      });
    }
  }

  // Add archiveUser method
  async archiveUser(userId, archiveReason, archivedBy) {
    const user = await this.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    const transaction = this.db.transaction((userId, user, reason, archivedBy) => {
      // Insert into archived_users
      this.db.prepare(`
        INSERT INTO archived_users (
          original_id, name, email, role, status, 
          created_at, last_login, archive_reason, archived_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.created_at,
        user.last_login,
        reason,
        archivedBy
      );

      // Delete from users
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      return this.db.prepare('SELECT * FROM archived_users WHERE original_id = ?').get(userId);
    });

    return transaction(userId, user, archiveReason, archivedBy);
  }

  // Add method to get archived users
  async getArchivedUsers() {
    return await this.all(`
      SELECT 
        au.*,
        u.name as archived_by_name
      FROM archived_users au
      LEFT JOIN users u ON au.archived_by = u.id
      ORDER BY au.archived_at DESC
    `);
  }
}

module.exports = DatabaseService; 