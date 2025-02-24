import { DatabaseService } from '../services/database.js';

async function checkData() {
  const db = new DatabaseService();
  const dbInstance = await db.getDb();
  
  console.log('\nChecking seeded data...\n');
  
  // Check users
  const users = await dbInstance.all('SELECT id, name, email, role FROM users LIMIT 5');
  console.log('Sample Users:');
  console.log(users);
  
  // Check clients
  const clients = await dbInstance.all('SELECT id, name, contact_name, email FROM clients LIMIT 5');
  console.log('\nSample Clients:');
  console.log(clients);
  
  // Check projects with client names
  const projects = await dbInstance.all(`
    SELECT p.id, p.name, c.name as client_name, p.status, p.sla_hours 
    FROM projects p 
    JOIN clients c ON p.client_id = c.id 
    LIMIT 5
  `);
  console.log('\nSample Projects:');
  console.log(projects);
  
  // Check shipments with project and client info
  const shipments = await dbInstance.all(`
    SELECT s.id, s.tracking_number, p.name as project_name, c.name as client_name, s.status, s.box_count
    FROM shipments s
    JOIN projects p ON s.project_id = p.id
    JOIN clients c ON p.client_id = c.id
    LIMIT 5
  `);
  console.log('\nSample Shipments:');
  console.log(shipments);
  
  // Check jobs with shipment and operator info
  const jobs = await dbInstance.all(`
    SELECT j.id, j.status, j.current_step, s.tracking_number, u.name as operator_name
    FROM jobs j
    JOIN shipments s ON j.shipment_id = s.id
    JOIN users u ON j.operator_id = u.id
    LIMIT 5
  `);
  console.log('\nSample Jobs:');
  console.log(jobs);
}

checkData().catch(console.error); 