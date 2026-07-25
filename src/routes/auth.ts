import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// ── helpers ──────────────────────────────────────────────
function signTokens(id: string, email: string, role: string) {
  const access = jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as NonNullable<jwt.SignOptions['expiresIn']> }
  );
  const refresh = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as NonNullable<jwt.SignOptions['expiresIn']> }
  );
  return { access, refresh };
}

function safeUser(user: { id: string; firstName: string; lastName: string; email: string; role: string; avatarUrl: string | null }) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
}

// ── POST /api/auth/register ───────────────────────────────
const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  password:  z.string().min(8),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados inválidos.', errors: parsed.error.flatten() });

  const { firstName, lastName, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ message: 'E-mail já cadastrado.' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashed },
  });

  const { access, refresh } = signTokens(user.id, user.email, user.role);
  return res.status(201).json({ message: 'Conta criada com sucesso!', token: access, refreshToken: refresh, user: safeUser(user) });
});

// ── POST /api/auth/login ──────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados inválidos.' });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

  const { access, refresh } = signTokens(user.id, user.email, user.role);
  return res.json({ token: access, refreshToken: refresh, user: safeUser(user) });
});

// ── POST /api/auth/refresh ────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token obrigatório.' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

    const { access, refresh } = signTokens(user.id, user.email, user.role);
    return res.json({ token: access, refreshToken: refresh });
  } catch {
    return res.status(401).json({ message: 'Refresh token inválido.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  return res.json({ user: safeUser(user) });
});

export default router;
