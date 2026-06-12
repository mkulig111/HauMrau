import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './lib/db';

const BCRYPT_ROUNDS = 12;

const users = [
  { name: 'Mateusz', email: 'mateusz@petcare.pl', password: 'Mat123' },
  { name: 'Monika',  email: 'monika@petcare.pl',  password: 'Monia6665' },
];

async function seed() {
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`User ${u.email} already exists, skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    await prisma.user.create({ data: { email: u.email, name: u.name, passwordHash } });
    console.log(`Created user: ${u.name} (${u.email})`);
  }
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
