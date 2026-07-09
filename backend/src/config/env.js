require('dotenv').config();

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  MONGODB_URI: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/btms'),

  JWT_SECRET: required('JWT_SECRET', 'dev_jwt_secret_change_me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev_jwt_refresh_secret_change_me'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  RATE_LIMIT_WINDOW_MINUTES: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,

  MAX_UPLOAD_SIZE_MB: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,
};

module.exports = env;
