import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try multiple paths for monorepo compatibility
const envPath = path.join(process.cwd(), 'apps', 'api', '.env');
const localEnvPath = path.resolve(__dirname, '../.env');
const result1 = dotenv.config({ path: envPath });
const result2 = dotenv.config({ path: localEnvPath });

// Debug: Log env loading status
console.log(`[ENV] Trying path: ${envPath}, loaded: ${!result1.error}`);
console.log(`[ENV] Trying path: ${localEnvPath}, loaded: ${!result2.error}`);
console.log(`[ENV] FAST2SMS_API_KEY set: ${!!process.env.FAST2SMS_API_KEY}`);

// Import routes
import authRoutes from './modules/auth/routes';
import billingRoutes from './modules/billing/routes';
import connectionRoutes from './modules/connection/routes';
import grievanceRoutes from './modules/grievance/routes';
import notificationRoutes from './modules/notification/routes';
import adminRoutes from './modules/admin/routes';
import sigmRoutes from './modules/sigm/routes';
import paymentRoutes from './modules/payment/routes';
import uploadRoutes from './modules/upload/routes';
import serviceRequestRoutes from './modules/service-request/routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SUVIDHA API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sigm', sigmRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SUVIDHA API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;
