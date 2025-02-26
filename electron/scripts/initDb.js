const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class DatabaseService {
  constructor(dbPath = 'medatlas.db') {
    this.dbPath = path.join(process.cwd(), dbPath);
    this.db = new Database(this.dbPath);
  }

  async createInitialAdmin() {
    try {
      const adminExists = this.db.prepare('SELECT * FROM users WHERE role = ?').get(['ADMIN']);
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        this.db.prepare(
          'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)'
        ).run(['Admin User', 'admin', hashedPassword, 'ADMIN', 'active']);
        console.log('Initial admin user created');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating initial admin:', error);
      throw error;
    }
  }

  async initializeSchema() {
    // Create users table
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `).run();
    console.log('Schema initialized');
  }
}

async function initializeDatabase() {
  try {
    // Delete existing database file if it exists
    const dbPath = path.join(process.cwd(), 'medatlas.db');
    if (fs.existsSync(dbPath)) {
      console.log('Removing existing database...');
      fs.unlinkSync(dbPath);
    }

    // Create new database
    console.log('Creating new database...');
    const db = new DatabaseService();
    
    // Initialize schema
    await db.initializeSchema();
    
    // Create initial admin user
    await db.createInitialAdmin();
    
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 