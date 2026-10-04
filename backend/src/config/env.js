const dotenv = require('dotenv');
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in production environment');
  }
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be defined in production environment');
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mindcraft',
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mindcraft',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? undefined : 'dev_secret_key_change_in_production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JUDGE0_URL: process.env.JUDGE0_URL || 'http://localhost:2358',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@mindcraft.io',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || (isProduction ? undefined : 'AdminSecurePassword2026!'),
};

