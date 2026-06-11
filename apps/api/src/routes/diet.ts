import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPet } from '../services/petService';
import * as dietService from '../services/dietService';
import type { ActivityFactor } from '../services/dietService';

const router = Router({ mergeParams: true });

const dietPlanSchema = z.object({
  targetKcal: z.number().int().positive(),
  dryFoodG: z.number().positive().optional(),
  wetFoodG: z.number().positive().optional(),
  waterMlTarget: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  activeFrom: z.string().datetime().optional(),
  activeTo: z.string().datetime().optional(),
});

const mealLogSchema = z.object({
  type: z.string().min(1).max(50),
  amountG: z.number().positive().optional(),
  amountMl: z.number().positive().optional(),
  kcal: z.number().int().positive().optional(),
  loggedAt: z.string().datetime().optional(),
});

const activityFactorValues = ['neutered_indoor', 'intact_indoor', 'active', 'weight_loss', 'weight_gain'] as const;

// GET /pets/:id/diet/plan
router.get('/plan', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const plan = await dietService.getActiveDietPlan(petId);
  if (!plan) {
    res.status(404).json({ error: 'No active diet plan' });
    return;
  }

  res.json(plan);
});

// POST /pets/:id/diet/plan
router.post('/plan', requireAuth, validate(dietPlanSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof dietPlanSchema>;
  const plan = await dietService.createDietPlan(petId, {
    ...body,
    activeFrom: body.activeFrom ? new Date(body.activeFrom) : undefined,
    activeTo: body.activeTo ? new Date(body.activeTo) : undefined,
  });

  res.status(201).json(plan);
});

// GET /pets/:id/diet/log?date=YYYY-MM-DD
router.get('/log', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const date = (req.query['date'] as string | undefined) ?? new Date().toISOString().slice(0, 10);
  const logs = await dietService.getMealLogs(petId, date);
  res.json(logs);
});

// POST /pets/:id/diet/log
router.post('/log', requireAuth, validate(mealLogSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof mealLogSchema>;
  const entry = await dietService.addMealLog(petId, {
    ...body,
    loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
  });

  res.status(201).json(entry);
});

// DELETE /pets/:id/diet/log/:entryId
router.delete('/log/:entryId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;
  const entryId = req.params['entryId']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const deleted = await dietService.deleteMealLog(entryId, petId);
  if (!deleted) {
    res.status(404).json({ error: 'Meal log entry not found' });
    return;
  }

  res.status(204).send();
});

// GET /pets/:id/diet/suggest
router.get('/suggest', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const factorParam = (req.query['activityFactor'] as string | undefined) ?? 'neutered_indoor';

  if (!activityFactorValues.includes(factorParam as ActivityFactor)) {
    res.status(400).json({
      error: 'Invalid activityFactor',
      valid: activityFactorValues,
    });
    return;
  }

  // Find the latest weight for this pet
  const { prisma } = await import('../lib/db');
  const latestWeight = await prisma.weightLog.findFirst({
    where: { petId },
    orderBy: { loggedAt: 'desc' },
  });

  if (!latestWeight) {
    res.status(400).json({ error: 'No weight data available for this pet. Add a weight entry first.' });
    return;
  }

  const factor = factorParam as ActivityFactor;
  const dailyKcal = dietService.calculateDailyKcal(latestWeight.weightKg, factor);

  res.json({
    weightKg: latestWeight.weightKg,
    activityFactor: factor,
    dailyKcal,
    rer: Math.round(70 * Math.pow(latestWeight.weightKg, 0.75)),
  });
});

export default router;
