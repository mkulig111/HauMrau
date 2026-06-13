import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as householdService from '../services/householdService';

const router = Router();

// GET / — list user's households
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const households = await householdService.getHousehold(req.user!.id);
  res.json(households);
});

// POST /invite — generate invite code for a household
router.post('/invite', requireAuth, validate(z.object({ householdId: z.string() })), async (req: Request, res: Response): Promise<void> => {
  try {
    const invite = await householdService.generateInviteCode(req.user!.id, req.body.householdId);
    res.json({ code: invite.code, expiresAt: invite.expiresAt });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /join — join a household via invite code
router.post('/join', requireAuth, validate(z.object({ code: z.string().min(1) })), async (req: Request, res: Response): Promise<void> => {
  try {
    const household = await householdService.joinHousehold(req.user!.id, req.body.code.trim().toUpperCase());
    res.json(household);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /:householdId/leave — leave a household
router.delete('/:householdId/leave', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await householdService.leaveHousehold(req.user!.id, req.params['householdId']);
    res.status(204).send();
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
