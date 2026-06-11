import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPet } from '../services/petService';
import * as weightService from '../services/weightService';

const router = Router({ mergeParams: true });

const addWeightSchema = z.object({
  weightKg: z.number().positive(),
  note: z.string().max(500).optional(),
  loggedAt: z.string().datetime().optional(),
});

// GET /pets/:id/weight
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const { from, to, limit } = req.query;

  const logs = await weightService.getWeightHistory(petId, {
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });

  res.json(logs);
});

// POST /pets/:id/weight
router.post('/', requireAuth, validate(addWeightSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof addWeightSchema>;
  const entry = await weightService.addWeightLog(petId, {
    ...body,
    loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
  });

  res.status(201).json(entry);
});

// DELETE /pets/:id/weight/:entryId
router.delete('/:entryId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;
  const entryId = req.params['entryId']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const deleted = await weightService.deleteWeightLog(entryId, petId);
  if (!deleted) {
    res.status(404).json({ error: 'Weight entry not found' });
    return;
  }

  res.status(204).send();
});

export default router;
