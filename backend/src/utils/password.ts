import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    // If hash is not a valid bcrypt hash (e.g., legacy "TEMP_PASSWORD"), bcrypt.compare returns false
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Defensive check to avoid unhandled crashes on non-bcrypt hashes
    return false;
  }
};
