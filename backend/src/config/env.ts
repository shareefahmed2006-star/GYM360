import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  dbName: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  allowedOrigins: string[];
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
};

const parseAllowedOrigins = (nodeEnv: string): string[] => {
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  if (rawOrigins && rawOrigins.trim().length > 0) {
    const list = rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    if (list.length > 0) {
      return list;
    }
  }

  // In production, require explicit ALLOWED_ORIGINS configuration and fail safely if missing
  if (nodeEnv === 'production') {
    throw new Error('Environment variable ALLOWED_ORIGINS is required and cannot be empty in production mode.');
  }

  // Local development fallback origins
  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
};

const currentEnv = getEnvVar('NODE_ENV', 'development');

export const config: EnvConfig = {
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  nodeEnv: currentEnv,
  mongoUri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/GYM360'),
  dbName: getEnvVar('MONGODB_DB_NAME', 'GYM360'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '1d'),
  allowedOrigins: parseAllowedOrigins(currentEnv),
};
