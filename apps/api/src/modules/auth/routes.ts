import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@suvidha/database';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'suvidha-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

// Validation schemas
const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const registerSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  language: z.enum(['en', 'hi']).default('en'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

// Generate OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock implementation)
router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP (in production, use Redis)
    otpStore.set(phone, { otp, expiresAt });

    // In production, send OTP via SMS
    console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Remove in production - only for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    next(error);
  }
});

// Verify OTP and Login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    // Verify OTP - in dev mode, accept '123456' as fallback
    const storedOtp = otpStore.get(phone);
    const isValidOtp = (storedOtp && storedOtp.otp === otp && storedOtp.expiresAt > new Date()) ||
      (process.env.NODE_ENV === 'development' && otp === '123456');

    if (!isValidOtp) {
      throw new ApiError('Invalid or expired OTP', 400);
    }

    // Clear OTP
    otpStore.delete(phone);

    // Find user
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new ApiError('User not found. Please register first.', 404);
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
        kioskId: req.headers['x-kiosk-id'] as string,
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Verify OTP - in dev mode, accept '123456' as fallback
    const storedOtp = otpStore.get(data.phone);
    const isValidOtp = (storedOtp && storedOtp.otp === data.otp && storedOtp.expiresAt > new Date()) ||
      (process.env.NODE_ENV === 'development' && data.otp === '123456');

    if (!isValidOtp) {
      throw new ApiError('Invalid or expired OTP', 400);
    }

    // Clear OTP
    otpStore.delete(data.phone);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingUser) {
      throw new ApiError('User already exists. Please login.', 400);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        language: data.language,
        isVerified: true,
      },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError('Refresh token required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        refreshToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new ApiError('Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: session.user.id, phone: session.user.phone, role: session.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: { token: newAccessToken },
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Delete session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
