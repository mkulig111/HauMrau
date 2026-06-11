import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

import authRouter from './routes/auth';
import petsRouter from './routes/pets';
import weightRouter from './routes/weight';
import dietRouter from './routes/diet';
import eventsRouter from './routes/events';
import healthRouter from './routes/health';
import { startNotificationScheduler } from './services/notificationService';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for uploads
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/pets', petsRouter);
app.use('/api/v1/pets/:id/weight', weightRouter);
app.use('/api/v1/pets/:id/diet', dietRouter);
app.use('/api/v1/pets/:id/events', eventsRouter);
app.use('/api/v1/pets/:id/health', healthRouter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);

  if (err.message.includes('File type') && err.message.includes('not allowed')) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.message === 'File too large') {
    res.status(400).json({ error: 'File size exceeds 10MB limit' });
    return;
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`[Server] PetCare API running on port ${PORT}`);
  startNotificationScheduler();
});

export default app;
