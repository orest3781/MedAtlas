import { defineStore } from 'pinia'
import type { User } from '@/types/database'

export interface ArchivedUser extends User {
  archived_at: string
  archive_reason: string
  archived_by_name: string
}

interface UserFormData {
  name: string
  email: string
  password?: string
  role: User['role']
  status: User['status']
}

interface UsersState {
  users: User[]
  archivedUsers: ArchivedUser[]
  loading: Record<number, boolean>  // Track loading state per user
  error: string | null
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    archivedUsers: [],
    loading: {},
    error: null
  }),

  actions: {
    async createUser(userData: UserFormData) {
      this.setLoading(-1, true)  // Use -1 for new users
      this.error = null
      try {
        const user = await window.api.createUser(userData)
        this.users.push(user)
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create user'
        throw error
      } finally {
        this.setLoading(-1, false)
      }
    },

    async updateUser(id: string, userData: Partial<User>) {
      const userId = parseInt(id)
      this.setLoading(userId, true)
      this.error = null
      try {
        const updatedUser = await window.api.updateUser(id, userData)
        // Update local state
        const index = this.users.findIndex(user => user.id === userId)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...updatedUser }
        }
        return updatedUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update user'
        console.error('Error updating user:', error)
        throw error
      } finally {
        this.setLoading(userId, false)
      }
    },

    async fetchUsers() {
      this.setLoading(-1, true)  // Use -1 for global loading
      this.error = null
      try {
        console.log('Fetching users...')
        const response = await window.api.getUsers()
        console.log('Users response:', response)
        
        if (Array.isArray(response)) {
          this.users = response.map(user => ({
            ...user,
            role: user.role || 'OPERATOR',
            status: user.status || 'active'
          }))
        } else {
          console.error('Invalid users response format:', response)
          this.error = 'Invalid response format from server'
        }
        
        console.log('Processed users:', this.users)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch users'
        console.error('Error fetching users:', error)
      } finally {
        this.setLoading(-1, false)
      }
    },

    async archiveUser(id: string, reason: string) {
      const userId = parseInt(id)
      this.setLoading(userId, true)
      this.error = null
      try {
        const archivedUser = await window.api.archiveUser(id, reason)
        // Remove from active users
        this.users = this.users.filter(user => user.id !== userId)
        // Add to archived users
        this.archivedUsers.unshift(archivedUser)
        return archivedUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to archive user'
        throw error
      } finally {
        this.setLoading(userId, false)
      }
    },

    async fetchArchivedUsers() {
      this.setLoading(-2, true) // Use -2 for archived users loading
      this.error = null
      try {
        const archivedUsers = await window.api.getArchivedUsers()
        this.archivedUsers = archivedUsers
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch archived users'
        console.error('Error fetching archived users:', error)
      } finally {
        this.setLoading(-2, false)
      }
    },

    // Helper method to set loading state
    setLoading(userId: number, isLoading: boolean) {
      if (isLoading) {
        this.loading = { ...this.loading, [userId]: true }
      } else {
        const { [userId]: _, ...rest } = this.loading
        this.loading = rest
      }
    },

    // Helper method to check if a specific user is loading
    isUserLoading(userId: number): boolean {
      return !!this.loading[userId]
    }
  }
}) 