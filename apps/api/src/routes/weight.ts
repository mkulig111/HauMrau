import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPet } from '../services/petService';
import * as weightService from '../services/weightService';

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router({ mergeParams: true });

const addWeightSchema = z.object({
  weightKg: z.number().positive(),
  note: z.string().max(500).optional(),
  loggedAt: z.string().datetime().optional(),
});

// GET /pets/:id/weight
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));

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
  const petId = String(String(req.params['petId']));

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

// POST /pets/:id/weight/import
router.post('/import', requireAuth, memUpload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(req.params['petId']);

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const text = req.file.buffer.toString('utf-8');
  const lines = text.split(/\r?\n/);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { skipped++; continue; }

    const cols = line.split(',');
    if (cols.length < 2) { skipped++; continue; }

    const rawDate = cols[0].trim();
    const rawWeight = cols[1].trim();

    // Skip header rows
    const lowerDate = rawDate.toLowerCase();
    if (lowerDate === 'data' || lowerDate === 'date') { skipped++; continue; }

    const parsedDate = new Date(rawDate);
    const parsedWeight = parseFloat(rawWeight.replace(',', '.'));

    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${i + 1}: invalid date "${rawDate}"`);
      skipped++;
      continue;
    }
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      errors.push(`Row ${i + 1}: invalid weight "${rawWeight}"`);
      skipped++;
      continue;
    }

    await weightService.addWeightLog(petId, { weightKg: parsedWeight, loggedAt: parsedDate });
    imported++;
  }

  res.json({ imported, skipped, errors });
});

// DELETE /pets/:id/weight/:entryId
router.delete('/:entryId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));
  const entryId = String(String(req.params['entryId']));

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
