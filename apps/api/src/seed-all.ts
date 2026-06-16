import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './lib/db';

const BCRYPT_ROUNDS = 12;

const mruczekWeights = [
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

const felinkaWeights = [
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

async function seedAll() {
  // Users
  const usersData = [
    { name: 'Mateusz', email: 'mateusz@petcare.pl', password: 'Mat123' },
    { name: 'Monika',  email: 'monika@petcare.pl',  password: 'Monia6665' },
  ];

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
      await prisma.user.create({ data: { email: u.email, name: u.name, passwordHash } });
      console.log(`✓ Użytkownik: ${u.name}`);
    } else {
      console.log(`- Użytkownik już istnieje: ${u.name}`);
    }
  }

  const mateusz = await prisma.user.findUnique({ where: { email: 'mateusz@petcare.pl' } });
  if (!mateusz) { console.error('Brak użytkownika Mateusz'); process.exit(1); }

  const membership = await prisma.householdMember.findFirst({ where: { userId: mateusz.id } });
  if (!membership) { console.error('Brak gospodarstwa domowego dla Mateusza'); process.exit(1); }
  const householdId = membership.householdId;

  // Pets
  const petsData = [
    { name: 'Mruczek', species: 'CAT', sex: 'MALE',   neutered: true,  weightGoalKg: 4.5 },
    { name: 'Felinka', species: 'CAT', sex: 'FEMALE',  neutered: true,  weightGoalKg: 3.5 },
  ];

  for (const p of petsData) {
    const existing = await prisma.pet.findFirst({ where: { name: p.name, householdId } });
    if (!existing) {
      await prisma.pet.create({ data: { ...p, householdId } });
      console.log(`✓ Zwierzę: ${p.name}`);
    } else {
      console.log(`- Zwierzę już istnieje: ${p.name}`);
    }
  }

  // Weight logs
  const mruczek = await prisma.pet.findFirst({ where: { name: 'Mruczek', householdId } });
  const felinka = await prisma.pet.findFirst({ where: { name: 'Felinka', householdId } });

  if (mruczek) {
    const existing = await prisma.weightLog.count({ where: { petId: mruczek.id } });
    if (existing === 0) {
      for (const e of mruczekWeights) {
        await prisma.weightLog.create({ data: { petId: mruczek.id, weightKg: e.weightKg, loggedAt: new Date(e.date) } });
      }
      console.log(`✓ Waga Mruczek: ${mruczekWeights.length} wpisów`);
    } else {
      console.log(`- Waga Mruczek już istnieje (${existing} wpisów)`);
    }
  }

  if (felinka) {
    const existing = await prisma.weightLog.count({ where: { petId: felinka.id } });
    if (existing === 0) {
      for (const e of felinkaWeights) {
        await prisma.weightLog.create({ data: { petId: felinka.id, weightKg: e.weightKg, loggedAt: new Date(e.date + 'T12:00:00.000Z') } });
      }
      console.log(`✓ Waga Felinka: ${felinkaWeights.length} wpisów`);
    } else {
      console.log(`- Waga Felinka już istnieje (${existing} wpisów)`);
    }
  }

  await prisma.$disconnect();
  console.log('\nGotowe!');
}

seedAll().catch((e) => { console.error(e); process.exit(1); });
