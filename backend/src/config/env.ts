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

  // Fallback to allowing all origins so Vercel and cloud clients connect cleanly
  return ['*'];
};

const currentEnv = getEnvVar('NODE_ENV', 'development');

export const config: EnvConfig = {
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  nodeEnv: currentEnv,
  mongoUri: getEnvVar('MONGODB_URI', 'mongodb+srv://shareefahmed2006_db_user:RapnkYy94nPmzkn0@cluster0.meonxyq.mongodb.net/GYM360?retryWrites=true&w=majority'),
  dbName: getEnvVar('MONGODB_DB_NAME', 'GYM360'),
  jwtSecret: getEnvVar('JWT_SECRET', 'gym360_production_super_secret_jwt_key_2026_min_32_chars'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '1d'),
  allowedOrigins: parseAllowedOrigins(currentEnv),
};
