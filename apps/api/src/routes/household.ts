import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as householdService from '../services/householdService';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const households = await householdService.getHousehold(req.user!.id);
  res.json(households);
});

router.post('/invite', requireAuth, validate(z.object({ householdId: z.string() })), async (req: Request, res: Response): Promise<void> => {
  const invite = await householdService.generateInviteCode(req.user!.id, req.body.householdId);
  res.json({ code: invite.code, expiresAt: invite.expiresAt });
});

router.post('/join', requireAuth, validate(z.object({ code: z.string().min(1) })), async (req: Request, res: Response): Promise<void> => {
  try {
    await householdService.joinHousehold(req.user!.id, req.body.code);
    const households = await householdService.getHousehold(req.user!.id);
    res.json(households);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to join' });
  }
});

router.delete('/:householdId/leave', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await householdService.leaveHousehold(req.user!.id, String(req.params['householdId']));
    res.json({ message: 'Left household' });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to leave' });
  }
});

export default router;
