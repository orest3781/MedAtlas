const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');

// Development admin credentials
const ADMIN_USER = {
  id: 1,
  name: 'Admin User',
  email: 'admin',
  role: 'ADMIN',
  status: 'active',
  created_at: new Date().toISOString(),
  last_login: null
};

const ADMIN_PASSWORD = 'admin';

function registerAuthHandlers() {
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
      // For development, check against hardcoded admin credentials
      if (email === 'admin' && password === 'admin') {
        return {
          user: ADMIN_USER,
          token: 'dev-token'
        };
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('auth:logout', async () => {
    return { success: true };
  });

  ipcMain.handle('auth:check', async (_, token) => {
    if (token === 'dev-token') {
      return {
        user: ADMIN_USER
      };
    }
    throw new Error('Invalid token');
  });
}

module.exports = {
  registerAuthHandlers
}; 