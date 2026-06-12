import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPet } from '../services/petService';
import * as eventService from '../services/eventService';

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const EVENT_TYPE_MAP: Record<string, string> = {
  vet_visit: 'VET_VISIT',
  deworming: 'DEWORMING',
  grooming: 'GROOMING',
  weight_check: 'WEIGHT_CHECK',
  other: 'OTHER',
  wizyta: 'VET_VISIT',
  odrobaczanie: 'DEWORMING',
  pielęgnacja: 'GROOMING',
  waga: 'WEIGHT_CHECK',
  inne: 'OTHER',
};

const VALID_EVENT_TYPES = new Set(['VET_VISIT', 'DEWORMING', 'GROOMING', 'WEIGHT_CHECK', 'OTHER']);

function normalizeEventType(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (VALID_EVENT_TYPES.has(upper)) return upper;
  const lower = raw.trim().toLowerCase();
  return EVENT_TYPE_MAP[lower] ?? null;
}

const router = Router({ mergeParams: true });

const createEventSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  remindAt: z.string().datetime().optional(),
});

const updateEventSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  scheduledAt: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  done: z.boolean().optional(),
  remindAt: z.string().datetime().optional(),
});

// GET /pets/:id/events?upcoming=true&limit=10
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const upcoming = req.query['upcoming'] === 'true';
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 10;

  const events = await eventService.listEvents(petId, { upcoming, limit });
  res.json(events);
});

// POST /pets/:id/events
router.post('/', requireAuth, validate(createEventSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof createEventSchema>;
  const event = await eventService.createEvent(petId, {
    ...body,
    scheduledAt: new Date(body.scheduledAt),
    remindAt: body.remindAt ? new Date(body.remindAt) : undefined,
  });

  res.status(201).json(event);
});

// PATCH /pets/:id/events/:eventId
router.patch('/:eventId', requireAuth, validate(updateEventSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));
  const eventId = String(String(req.params['eventId']));

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof updateEventSchema>;
  const event = await eventService.updateEvent(eventId, petId, {
    ...body,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    remindAt: body.remindAt ? new Date(body.remindAt) : undefined,
  });

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json(event);
});

// POST /pets/:id/events/import
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

    const rawTitle = cols[0].trim();
    const rawDate = cols[1].trim();
    const rawType = cols[2]?.trim() ?? 'OTHER';
    const rawLocation = cols[3]?.trim() ?? '';
    const rawNotes = cols[4]?.trim() ?? '';

    // Skip header rows
    const lower = rawTitle.toLowerCase();
    if (lower === 'tytul' || lower === 'tytul' || lower === 'title') { skipped++; continue; }

    if (!rawTitle) {
      errors.push(`Row ${i + 1}: missing title`);
      skipped++;
      continue;
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${i + 1}: invalid date "${rawDate}"`);
      skipped++;
      continue;
    }

    const eventType = normalizeEventType(rawType || 'OTHER');
    if (!eventType) {
      errors.push(`Row ${i + 1}: unknown event type "${rawType}"`);
      skipped++;
      continue;
    }

    await eventService.createEvent(petId, {
      title: rawTitle,
      type: eventType,
      scheduledAt: parsedDate,
      location: rawLocation || undefined,
      notes: rawNotes || undefined,
    });
    imported++;
  }

  res.json({ imported, skipped, errors });
});

// DELETE /pets/:id/events/:eventId
router.delete('/:eventId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = String(String(req.params['petId']));
  const eventId = String(String(req.params['eventId']));

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const deleted = await eventService.deleteEvent(eventId, petId);
  if (!deleted) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.status(204).send();
});

export default router;
