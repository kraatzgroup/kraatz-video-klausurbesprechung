const { Client } = require('pg');
require('dotenv').config();

// Secure database configuration using environment variables
function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  }
  
  return new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports = { createDatabaseClient };
