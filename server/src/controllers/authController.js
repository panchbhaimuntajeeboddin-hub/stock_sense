import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

// In-Memory Fallback Store for seamless API execution when local DB is offline
const inMemoryUsers = new Map();

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'stocksense_dev_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 1. REGISTER USER
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole = ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(role)
      ? role
      : 'WAREHOUSE_STAFF';

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    try {
      // Check database
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        res.status(400);
        throw new Error('User with this email already exists');
      }

      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: validRole
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });
    } catch (dbError) {
      if (dbError.message && dbError.message.includes('User with this email already exists')) {
        throw dbError;
      }
      // Database offline fallback
      if (inMemoryUsers.has(normalizedEmail)) {
        res.status(400);
        throw new Error('User with this email already exists');
      }

      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: validRole,
        createdAt: new Date().toISOString()
      };
      inMemoryUsers.set(normalizedEmail, user);
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. LOGIN USER
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    try {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (dbError) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user && inMemoryUsers.has(normalizedEmail)) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET CURRENT LOGGED IN USER
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// 4. FORGOT PASSWORD (REQUEST OTP)
export const requestPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please provide your email address');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    try {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (err) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user && inMemoryUsers.has(normalizedEmail)) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user) {
      res.status(404);
      throw new Error('User with this email was not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    try {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { resetOtp: otp, resetOtpExpires: expiresAt }
      });
    } catch (err) {
      user.resetOtp = otp;
      user.resetOtpExpires = expiresAt;
      inMemoryUsers.set(normalizedEmail, user);
    }

    const responsePayload = {
      success: true,
      message: `OTP code sent to ${email}`
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.otp = otp;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// 5. VERIFY OTP
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and 6-digit OTP code');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    try {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (err) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user && inMemoryUsers.has(normalizedEmail)) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user || !user.resetOtp || user.resetOtp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP code');
    }

    if (user.resetOtpExpires && new Date(user.resetOtpExpires) < new Date()) {
      res.status(400);
      throw new Error('OTP code has expired. Please request a new one.');
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now reset your password.'
    });
  } catch (error) {
    next(error);
  }
};

// 6. RESET PASSWORD
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP code, and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    try {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (err) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user && inMemoryUsers.has(normalizedEmail)) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user || !user.resetOtp || user.resetOtp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP verification code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          password: hashedPassword,
          resetOtp: null,
          resetOtpExpires: null
        }
      });
    } catch (err) {
      user.password = hashedPassword;
      user.resetOtp = null;
      user.resetOtpExpires = null;
      inMemoryUsers.set(normalizedEmail, user);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
