import 'dotenv/config';
import { prisma } from './lib/db';

const entries = [
  { date: '2025-09-10T17:44:00.000Z', weightKg: 4.380 },
  { date: '2025-04-22T22:48:00.000Z', weightKg: 4.600 },
  { date: '2025-01-14T09:19:00.000Z', weightKg: 4.400 },
  { date: '2024-09-25T19:03:00.000Z', weightKg: 5.000 },
  { date: '2024-05-20T15:17:00.000Z', weightKg: 4.800 },
  { date: '2023-09-21T19:31:00.000Z', weightKg: 4.810 },
  { date: '2023-07-26T06:17:00.000Z', weightKg: 4.560 },
  { date: '2022-12-25T12:45:00.000Z', weightKg: 5.100 },
  { date: '2022-12-03T10:56:00.000Z', weightKg: 5.030 },
  { date: '2022-05-17T17:18:00.000Z', weightKg: 5.450 },
  { date: '2022-01-16T16:01:00.000Z', weightKg: 4.890 },
  { date: '2022-01-02T11:45:00.000Z', weightKg: 4.600 },
];

async function seedWeight() {
  const pet = await prisma.pet.findFirst({ where: { name: 'Mruczek' } });
  if (!pet) {
    console.error('Nie znaleziono zwierzęcia o imieniu Mruczek');
    process.exit(1);
  }
  console.log(`Znaleziono: ${pet.name} (id: ${pet.id})`);

  for (const e of entries) {
    await prisma.weightLog.create({
      data: { petId: pet.id, weightKg: e.weightKg, loggedAt: new Date(e.date) },
    });
    console.log(`Dodano: ${e.weightKg} kg — ${e.date}`);
  }

  await prisma.$disconnect();
  console.log('Gotowe!');
}

seedWeight().catch((e) => { console.error(e); process.exit(1); });
