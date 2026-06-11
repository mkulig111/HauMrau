import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPet } from '../services/petService';
import * as eventService from '../services/eventService';

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
  const petId = req.params['id']!;

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
  const petId = req.params['id']!;

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
  const petId = req.params['id']!;
  const eventId = req.params['eventId']!;

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

// DELETE /pets/:id/events/:eventId
router.delete('/:eventId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;
  const eventId = req.params['eventId']!;

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
