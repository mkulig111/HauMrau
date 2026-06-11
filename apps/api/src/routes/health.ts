import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { getPet } from '../services/petService';
import { prisma } from '../lib/db';

const router = Router({ mergeParams: true });

const createHealthRecordSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().datetime(),
  type: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
});

const createVaccinationSchema = z.object({
  name: z.string().min(1).max(100),
  administeredAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  clinic: z.string().max(200).optional(),
  batchNumber: z.string().max(100).optional(),
});

const updateVaccinationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  administeredAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  clinic: z.string().max(200).optional(),
  batchNumber: z.string().max(100).optional(),
  documentUrl: z.string().url().optional(),
});

// GET /pets/:id/health
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const records = await prisma.healthRecord.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
  });

  res.json(records);
});

// POST /pets/:id/health
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const parseResult = createHealthRecordSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const body = parseResult.data;
  const fileUrl = req.file ? `/uploads/${userId}/${petId}/${req.file.filename}` : undefined;

  const record = await prisma.healthRecord.create({
    data: {
      petId,
      title: body.title,
      date: new Date(body.date),
      type: body.type,
      description: body.description,
      fileUrl,
    },
  });

  res.status(201).json(record);
});

// GET /pets/:id/vaccinations
router.get('/vaccinations', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const vaccinations = await prisma.vaccination.findMany({
    where: { petId },
    orderBy: { administeredAt: 'desc' },
  });

  res.json(vaccinations);
});

// POST /pets/:id/vaccinations
router.post('/vaccinations', requireAuth, validate(createVaccinationSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const body = req.body as z.infer<typeof createVaccinationSchema>;
  const vaccination = await prisma.vaccination.create({
    data: {
      petId,
      name: body.name,
      administeredAt: new Date(body.administeredAt),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      clinic: body.clinic,
      batchNumber: body.batchNumber,
    },
  });

  res.status(201).json(vaccination);
});

// PATCH /pets/:id/vaccinations/:vacId
router.patch('/vaccinations/:vacId', requireAuth, validate(updateVaccinationSchema), async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const petId = req.params['id']!;
  const vacId = req.params['vacId']!;

  const pet = await getPet(petId, userId);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }

  const existing = await prisma.vaccination.findFirst({ where: { id: vacId, petId } });
  if (!existing) {
    res.status(404).json({ error: 'Vaccination not found' });
    return;
  }

  const body = req.body as z.infer<typeof updateVaccinationSchema>;
  const vaccination = await prisma.vaccination.update({
    where: { id: vacId },
    data: {
      ...body,
      administeredAt: body.administeredAt ? new Date(body.administeredAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    },
  });

  res.json(vaccination);
});

export default router;
