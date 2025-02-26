const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Function to get Electron user data path when running as script
function getUserDataPath() {
  // If running in Electron context
  if (app && typeof app.getPath === 'function') {
    return app.getPath('userData');
  }
  
  // Fallback for running as standalone script
  const userDataPath = process.platform === 'win32'
    ? path.join(process.env.APPDATA, 'medatlas')
    : process.platform === 'darwin'
      ? path.join(process.env.HOME, 'Library', 'Application Support', 'medatlas')
      : path.join(process.env.HOME, '.config', 'medatlas');
  
  return userDataPath;
}

// Function to clean up cache directories
function cleanCache() {
  const userDataPath = getUserDataPath();
  
  // Cache directories to clean
  const cacheDirs = [
    path.join(userDataPath, 'Cache'),
    path.join(userDataPath, 'Code Cache'),
    path.join(userDataPath, 'GPUCache')
  ];
  
  console.log('Cleaning cache directories...');
  
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        console.log(`Removing cache directory: ${dir}`);
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to remove cache directory ${dir}:`, err);
      }
    }
  });
}

// Function to repair database
function repairDatabase() {
  const userDataPath = getUserDataPath();
  const dbPath = path.join(userDataPath, 'medatlas.db');
  const dbJournalPath = path.join(userDataPath, 'medatlas.db-journal');
  
  console.log('Checking database files...');
  
  // Check for and remove journal files (which indicate incomplete transactions)
  if (fs.existsSync(dbJournalPath)) {
    try {
      console.log('Removing database journal file...');
      fs.unlinkSync(dbJournalPath);
    } catch (err) {
      console.error('Failed to remove database journal file:', err);
    }
  }
  
  // Check if database file exists but is empty or corrupted
  if (fs.existsSync(dbPath)) {
    try {
      const stats = fs.statSync(dbPath);
      if (stats.size < 1024) { // If file is suspiciously small (less than 1KB)
        console.log('Database file appears to be corrupted (too small). Removing...');
        fs.unlinkSync(dbPath);
        console.log('You will need to run db:init to recreate the database.');
      } else {
        console.log('Database file exists and appears to be valid.');
      }
    } catch (err) {
      console.error('Error checking database file:', err);
    }
  } else {
    console.log('Database file does not exist. You will need to run db:init.');
  }
}

// Main function
function cleanUp() {
  console.log('Starting cleanup process...');
  
  cleanCache();
  repairDatabase();
  
  console.log('Cleanup completed.');
  console.log('You may need to run "npm run db:init" if your database was removed or corrupted.');
}

// Run the cleanup
cleanUp(); 