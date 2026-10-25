const path = require('path');
const dotenv = require('dotenv');

// Load .env.staging if present
dotenv.config({ path: path.resolve(__dirname, '../.env.staging') });

// Enforce staging isolation defaults
process.env.PORT = process.env.PORT || '5001';
process.env.NODE_ENV = 'production';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GYM360_STAGING';
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'GYM360_STAGING';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'gym360_staging_isolated_super_secret_jwt_key_2026_min_32_chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:4173,http://127.0.0.1:4173,http://localhost:4174,http://127.0.0.1:4174,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174';

console.log('[Staging Launcher] Initializing GYM360 Staging Instance...');
console.log(`[Staging Launcher] Port: ${process.env.PORT}`);
console.log(`[Staging Launcher] Database: ${process.env.MONGODB_DB_NAME}`);
console.log(`[Staging Launcher] Allowed Origins: ${process.env.ALLOWED_ORIGINS}`);

require('../dist/server.js');
