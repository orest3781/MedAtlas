import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import { DatabaseService } from '../services/database.js'

class DatabaseSeeder {
  constructor() {
    this.db = new DatabaseService()
    this.users = []
    this.clients = []
    this.projects = []
    this.shipments = []
    this.jobs = []
  }

  async seedAll() {
    try {
      console.log('Starting database seeding...')
      
      await this.db.initializeSchema()
      console.log('Database schema initialized')
      
      await this.seedUsers(20)
      await this.seedClients(50)
      await this.seedProjects(100)
      await this.seedShipments(200)
      await this.seedJobs(300)
      
      console.log('Database seeding completed successfully!')
    } catch (error) {
      console.error('Error seeding database:', error)
      throw error
    }
  }

  async seedUsers(count) {
    console.log(`Seeding ${count} users...`)
    const roles = ['admin', 'manager', 'operator']
    
    for (let i = 0; i < count; i++) {
      const user = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        role: roles[Math.floor(Math.random() * roles.length)],
        status: 'active'
      }
      
      const result = await this.db.createUser(user)
      this.users.push(result)
    }
    console.log('Users seeded successfully')
  }

  async seedClients(count) {
    console.log(`Seeding ${count} clients...`)
    
    for (let i = 0; i < count; i++) {
      const client = {
        name: faker.company.name(),
        contact_name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        status: 'active'
      }
      
      const result = await this.db.createClient(client)
      this.clients.push(result)
    }
    console.log('Clients seeded successfully')
  }

  async seedProjects(count) {
    console.log(`Seeding ${count} projects...`)
    
    for (let i = 0; i < count; i++) {
      const client = this.clients[Math.floor(Math.random() * this.clients.length)]
      const project = {
        client_id: client.id,
        name: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        status: ['active', 'completed', 'on-hold'][Math.floor(Math.random() * 3)],
        sla_hours: [24, 48, 72][Math.floor(Math.random() * 3)]
      }
      
      const result = await this.db.createProject(project)
      this.projects.push(result)
    }
    console.log('Projects seeded successfully')
  }

  async seedShipments(count) {
    console.log(`Seeding ${count} shipments...`)
    
    for (let i = 0; i < count; i++) {
      const project = this.projects[Math.floor(Math.random() * this.projects.length)]
      const shipment = {
        project_id: project.id,
        tracking_number: faker.string.alphanumeric(12).toUpperCase(),
        status: ['pending', 'received', 'processing', 'completed'][Math.floor(Math.random() * 4)],
        box_count: faker.number.int({ min: 1, max: 10 })
      }
      
      const result = await this.db.createShipment(shipment)
      this.shipments.push(result)
    }
    console.log('Shipments seeded successfully')
  }

  async seedJobs(count) {
    console.log(`Seeding ${count} jobs...`)
    
    for (let i = 0; i < count; i++) {
      const shipment = this.shipments[Math.floor(Math.random() * this.shipments.length)]
      const operator = this.users.find(u => u.role === 'operator') || this.users[0]
      const started_at = faker.date.past()
      
      const job = {
        shipment_id: shipment.id,
        operator_id: operator.id,
        status: ['pending', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
        current_step: ['intake', 'scanning', 'indexing', 'qa'][Math.floor(Math.random() * 4)],
        started_at: started_at,
        completed_at: Math.random() > 0.3 ? faker.date.between({ from: started_at, to: new Date() }) : null
      }
      
      const result = await this.db.createJob(job)
      this.jobs.push(result)
    }
    console.log('Jobs seeded successfully')
  }
}

// Run the seeder
const seeder = new DatabaseSeeder()
seeder.seedAll().catch(console.error) 