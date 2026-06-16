import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).max(128).optional(),
}).refine((data) => !data.newPassword || !!data.currentPassword, {
  message: 'currentPassword is required to set a new password',
  path: ['currentPassword'],
});

function generateAccessToken(userId: string, email: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return jwt.sign({ id: userId, email }, secret, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign({ id: userId }, secret, { expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d` });
}

function setRefreshCookie(res: Response, token: string): void {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/api/v1/auth',
  });
}

// POST /register
router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body as z.infer<typeof registerSchema>;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.$transaction(async (tx: typeof prisma) => {
    const newUser = await tx.user.create({ data: { email, name, passwordHash } });
    await tx.household.create({ data: { name: `${name}'s Household`, members: { create: { userId: newUser.id, role: 'OWNER' } } } });
    return newUser;
  });

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// POST /login
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  let payload: { id: string };
  try {
    payload = jwt.verify(token, secret) as { id: string };
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token not found or expired' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token } });

  const newRefreshToken = generateRefreshToken(user.id);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: user.id, expiresAt },
  });

  const accessToken = generateAccessToken(user.id, user.email);
  setRefreshCookie(res, newRefreshToken);

  res.json({ accessToken });
});

// GET /me
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});

// PATCH /me
router.patch('/me', requireAuth, validate(updateMeSchema), async (req: Request, res: Response): Promise<void> => {
  const { name, currentPassword, newPassword } = req.body as z.infer<typeof updateMeSchema>;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const data: { name?: string; passwordHash?: string } = {};

  if (name) {
    data.name = name;
  }

  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword!, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    data.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  res.json({ id: updated.id, email: updated.email, name: updated.name });
});

// POST /logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.json({ message: 'Logged out' });
});

export default router;
