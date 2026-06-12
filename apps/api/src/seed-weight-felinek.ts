import 'dotenv/config';
import { prisma } from './lib/db';

const entries = [
  { date: '2018-01-17', weightKg: 3.800 },
  { date: '2018-02-17', weightKg: 3.400 },
  { date: '2018-04-26', weightKg: 3.600 },
  { date: '2020-03-25', weightKg: 3.700 },
  { date: '2020-07-16', weightKg: 3.810 },
  { date: '2020-07-26', weightKg: 3.920 },
  { date: '2020-08-02', weightKg: 4.040 },
  { date: '2020-08-23', weightKg: 3.960 },
  { date: '2020-12-28', weightKg: 3.500 },
  { date: '2021-01-06', weightKg: 3.430 },
  { date: '2021-01-27', weightKg: 3.400 },
  { date: '2021-02-19', weightKg: 3.240 },
  { date: '2021-04-01', weightKg: 3.230 },
  { date: '2021-04-22', weightKg: 3.270 },
  { date: '2021-06-01', weightKg: 3.400 },
  { date: '2021-06-25', weightKg: 3.430 },
  { date: '2021-06-27', weightKg: 3.390 },
  { date: '2021-07-08', weightKg: 3.550 },
  { date: '2021-07-30', weightKg: 3.680 },
  { date: '2021-08-22', weightKg: 3.800 },
  { date: '2021-11-12', weightKg: 3.100 },
  { date: '2021-11-27', weightKg: 3.270 },
  { date: '2022-06-14', weightKg: 3.480 },
  { date: '2022-07-25', weightKg: 3.650 },
  { date: '2022-09-29', weightKg: 3.320 },
  { date: '2022-11-26', weightKg: 3.280 },
  { date: '2023-01-08', weightKg: 3.300 },
  { date: '2023-01-17', weightKg: 3.090 },
  { date: '2023-02-10', weightKg: 3.290 },
  { date: '2023-03-16', weightKg: 2.870 },
  { date: '2023-04-05', weightKg: 2.900 },
  { date: '2023-06-05', weightKg: 3.140 },
  { date: '2023-06-14', weightKg: 3.190 },
  { date: '2024-07-11', weightKg: 3.330 },
  { date: '2025-02-19', weightKg: 3.000 },
  { date: '2025-09-17', weightKg: 2.960 },
  { date: '2025-11-18', weightKg: 2.980 },
];

async function seedWeight() {
  const pet = await prisma.pet.findFirst({ where: { name: { contains: 'Felink' } } })
    ?? await prisma.pet.findFirst({ where: { name: { contains: 'felink' } } })
    ?? await prisma.pet.findFirst({ where: { name: { contains: 'Felin' } } });

  if (!pet) {
    console.error('Nie znaleziono zwierzęcia o imieniu Felinek. Dostępne zwierzęta:');
    const all = await prisma.pet.findMany({ select: { name: true, id: true } });
    all.forEach(p => console.log(` - ${p.name} (${p.id})`));
    process.exit(1);
  }

  console.log(`Znaleziono: ${pet.name} (id: ${pet.id})`);

  for (const e of entries) {
    await prisma.weightLog.create({
      data: { petId: pet.id, weightKg: e.weightKg, loggedAt: new Date(e.date + 'T12:00:00.000Z') },
    });
    console.log(`Dodano: ${e.weightKg} kg — ${e.date}`);
  }

  await prisma.$disconnect();
  console.log(`Gotowe! Dodano ${entries.length} wpisów.`);
}

seedWeight().catch((e) => { console.error(e); process.exit(1); });
