import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as petService from '../services/petService';

const router = Router();

const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(50),
  breed: z.string().max(100).optional(),
  birthDate: z.string().datetime().optional(),
  sex: z.enum(['male', 'female', 'unknown']),
  neutered: z.boolean().optional().default(false),
  weightGoalKg: z.number().positive().optional(),
});

const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().min(1).max(50).optional(),
  breed: z.string().max(100).optional(),
  birthDate: z.string().datetime().optional(),
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  neutered: z.boolean().optional(),
  weightGoalKg: z.number().positive().optional(),
});

// GET / — list user's pets
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const pets = await petService.listPets(userId);
  res.json(pets);
});

// POST / — create pet
router.post('/', requireAuth, validate(createPetSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const body = req.body as z.infer<typeof createPetSchema>;

  const pet = await petService.createPet(userId, {
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
  });

  res.status(201).json(pet);
});

// GET /:id — get pet details
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const pet = await petService.getPet(req.params['id']!, userId);

  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  res.json(pet);
});

// PATCH /:id — update pet
router.patch('/:id', requireAuth, validate(updatePetSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const body = req.body as z.infer<typeof updatePetSchema>;

  const pet = await petService.updatePet(req.params['id']!, userId, {
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
  });

  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  res.json(pet);
});

// DELETE /:id — delete pet
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const deleted = await petService.deletePet(req.params['id']!, userId);

  if (!deleted) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  res.status(204).send();
});

// POST /:id/photo — upload photo
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const photoUrl = `/uploads/${userId}/${req.params['id']}/${file.filename}`;
  const pet = await petService.updatePetPhoto(req.params['id']!, userId, photoUrl);

  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  res.json({ photoUrl: pet.photoUrl });
});

export default router;
