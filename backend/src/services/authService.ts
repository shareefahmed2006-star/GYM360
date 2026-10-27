import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from './tokenService';
import { UserDocument, UserResponse, UserRole } from '../types/auth';

const sanitizeUser = (user: UserDocument): UserResponse => {
  return {
    id: user._id.toHexString(),
    organizationId: user.organizationId.toHexString(),
    branchId: user.branchId ? user.branchId.toHexString() : undefined,
    isGlobal: user.isGlobal || user.email === 'admin@gym360.com',
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    memberId: user.memberId ? user.memberId.toHexString() : undefined,
    trainerId: user.trainerId ? user.trainerId.toHexString() : undefined,
  };
};

const validatePasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasDigit) {
    throw new AppError('Password must contain at least one uppercase letter, one lowercase letter, and one number.', 400);
  }
};

export interface RegisterDTO {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export const registerUser = async (data: RegisterDTO): Promise<{ user: UserResponse; token: string }> => {
  const db = dbConnection.getDb();

  // 1. Enforce strict role policy for public registration
  // Public registration is restricted to 'member'. Admin creation is forbidden on public endpoint.
  if (data.role && data.role !== 'member') {
    throw new AppError('Public registration is restricted to member accounts. Admin accounts cannot be self-registered.', 403);
  }
  const role: UserRole = 'member';

  // 2. Validate input fields
  if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.password || !data.organizationId) {
    throw new AppError('All fields (organizationId, firstName, lastName, email, phone, password) are required.', 400);
  }

  // 3. Validate OrganizationId format and existence
  // Note: Accepting client-supplied organizationId is a temporary development mechanism.
  // In production multi-tenancy, tenant context will be determined via verified invitations or subdomain resolution.
  if (!ObjectId.isValid(data.organizationId)) {
    throw new AppError('Invalid organizationId format.', 400);
  }
  const orgObjectId = new ObjectId(data.organizationId);
  const existingOrg = await db.collection('organizations').findOne({ _id: orgObjectId });
  if (!existingOrg) {
    throw new AppError('Referenced organization does not exist.', 404);
  }

  validatePasswordStrength(data.password);

  const normalizedEmail = data.email.trim().toLowerCase();

  // 4. Check for duplicate email in Users collection
  const existingUser = await db.collection<UserDocument>('Users').findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('A user with this email address already exists.', 409);
  }

  // 5. Hash password
  const passwordHash = await hashPassword(data.password);

  // 6. Build document strictly conforming to existing MongoDB $jsonSchema for 'Users'
  const newUserDoc: Omit<UserDocument, '_id'> & { _id?: ObjectId } = {
    organizationId: orgObjectId,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: normalizedEmail,
    phone: data.phone.trim(),
    passwordHash,
    role,
    status: 'active'
  };

  const insertResult = await db.collection<UserDocument>('Users').insertOne(newUserDoc as UserDocument);

  const createdUser: UserDocument = {
    ...newUserDoc,
    _id: insertResult.insertedId
  } as UserDocument;

  // Resolve memberId for member role if linked
  let registeredMemberId: string | undefined = undefined;
  if (createdUser.role === 'member' && createdUser.memberId && ObjectId.isValid(createdUser.memberId)) {
    const memberDoc = await db.collection('members').findOne({
      _id: createdUser.memberId,
      organizationId: createdUser.organizationId
    });
    if (memberDoc) {
      registeredMemberId = memberDoc._id.toHexString();
    }
  }

  // 7. Generate JWT access token with verified memberId claim
  const token = generateToken({
    userId: createdUser._id.toHexString(),
    email: createdUser.email,
    organizationId: createdUser.organizationId.toHexString(),
    role: createdUser.role,
    status: createdUser.status,
    ...(registeredMemberId ? { memberId: registeredMemberId } : {})
  });

  return {
    user: sanitizeUser(createdUser),
    token
  };
};

export interface LoginDTO {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginDTO): Promise<{ user: UserResponse; token: string }> => {
  if (!data.email || !data.password) {
    throw new AppError('Email and password are required.', 400);
  }

  const db = dbConnection.getDb();
  const normalizedEmail = data.email.trim().toLowerCase();

  const user = await db.collection<UserDocument>('Users').findOne({ email: normalizedEmail });

  // Generic message on failure to prevent user enumeration
  const invalidCredentialsError = new AppError('Invalid email or password', 401);

  if (!user) {
    throw invalidCredentialsError;
  }

  if (user.status !== 'active') {
    throw invalidCredentialsError;
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw invalidCredentialsError;
  }

  // Resolve verified memberId claim for member accounts
  let verifiedMemberId: string | undefined = undefined;
  if (user.role === 'member' && user.memberId && ObjectId.isValid(user.memberId)) {
    const memberDoc = await db.collection('members').findOne({
      _id: user.memberId,
      organizationId: user.organizationId
    });
    if (memberDoc) {
      verifiedMemberId = memberDoc._id.toHexString();
    }
  }

  // Resolve verified trainerId claim for trainer accounts
  let verifiedTrainerId: string | undefined = undefined;
  if (user.role === 'trainer' && user.trainerId && ObjectId.isValid(user.trainerId)) {
    const trainerDoc = await db.collection('trainers').findOne({
      _id: user.trainerId,
      organizationId: user.organizationId
    });
    if (trainerDoc) {
      verifiedTrainerId = trainerDoc._id.toHexString();
    }
  }

  const isGlobalUser = user.isGlobal || user.email === 'admin@gym360.com';
  const token = generateToken({
    userId: user._id.toHexString(),
    email: user.email,
    organizationId: user.organizationId.toHexString(),
    role: user.role,
    status: user.status,
    ...(verifiedMemberId ? { memberId: verifiedMemberId } : {}),
    ...(verifiedTrainerId ? { trainerId: verifiedTrainerId } : {}),
    ...(user.branchId ? { branchId: user.branchId.toHexString() } : {}),
    isGlobal: isGlobalUser
  });

  return {
    user: sanitizeUser(user),
    token
  };
};

export const getCurrentUser = async (userId: string): Promise<UserResponse> => {
  if (!ObjectId.isValid(userId)) {
    throw new AppError('Invalid user ID.', 400);
  }

  const db = dbConnection.getDb();
  const user = await db.collection<UserDocument>('Users').findOne({ _id: new ObjectId(userId) });

  if (!user || user.status !== 'active') {
    throw new AppError('User not found or account is inactive.', 404);
  }

  return sanitizeUser(user);
};

export const forgotPassword = async (
  email: string
): Promise<{ message: string; resetToken?: string; resetUrl?: string }> => {
  if (!email || !email.trim()) {
    throw new AppError('Email address is required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = dbConnection.getDb();
  const user = await db.collection<UserDocument>('Users').findOne({ email: normalizedEmail });

  const safeMessage = 'If an account with that email exists, password reset instructions have been generated.';

  if (!user || user.status !== 'active') {
    return { message: safeMessage };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

  await db.collection<UserDocument>('Users').updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    }
  );

  return {
    message: safeMessage,
    resetToken: rawToken,
    resetUrl: `/reset-password?token=${rawToken}`,
  };
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  if (!token || !token.trim()) {
    throw new AppError('Password reset token is required.', 400);
  }
  if (!newPassword) {
    throw new AppError('New password is required.', 400);
  }

  validatePasswordStrength(newPassword);

  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const db = dbConnection.getDb();

  const user = await db.collection<UserDocument>('Users').findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired. Please request a new one.', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db.collection<UserDocument>('Users').updateOne(
    { _id: user._id },
    {
      $set: { passwordHash: newPasswordHash },
      $unset: { resetPasswordToken: '', resetPasswordExpires: '' },
    }
  );

  return { message: 'Your password has been reset successfully. You can now log in.' };
};
