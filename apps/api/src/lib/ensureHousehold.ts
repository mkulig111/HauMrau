import { prisma } from './db';

export async function ensureHouseholdSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Household" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HouseholdMember" (
        "id" TEXT NOT NULL,
        "householdId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'MEMBER',
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HouseholdInvite" (
        "id" TEXT NOT NULL,
        "householdId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "usedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
      )
    `);

    // Unique indexes (IF NOT EXISTS requires PostgreSQL 9.5+)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "HouseholdMember_householdId_userId_key"
      ON "HouseholdMember"("householdId", "userId")
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "HouseholdInvite_code_key"
      ON "HouseholdInvite"("code")
    `);

    // Foreign keys — add only if not present
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "HouseholdMember"
          ADD CONSTRAINT "HouseholdMember_householdId_fkey"
          FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "HouseholdMember"
          ADD CONSTRAINT "HouseholdMember_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "HouseholdInvite"
          ADD CONSTRAINT "HouseholdInvite_householdId_fkey"
          FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "HouseholdInvite"
          ADD CONSTRAINT "HouseholdInvite_createdById_fkey"
          FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // Add householdId to Pet if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Pet" ADD COLUMN "householdId" TEXT;
      EXCEPTION WHEN duplicate_column THEN NULL; END $$
    `);

    // Data migration: create household per user and assign their pets
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        u RECORD;
        hid TEXT;
      BEGIN
        FOR u IN
          SELECT id, name FROM "User"
          WHERE id NOT IN (SELECT "userId" FROM "HouseholdMember")
        LOOP
          hid := replace(gen_random_uuid()::text, '-', '');
          INSERT INTO "Household" ("id", "name") VALUES (hid, u.name || '''s Household');
          INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role")
            VALUES (replace(gen_random_uuid()::text, '-', ''), hid, u.id, 'OWNER');
          UPDATE "Pet" SET "householdId" = hid WHERE "userId" = u.id AND "householdId" IS NULL;
        END LOOP;
      END $$
    `);

    // Make householdId NOT NULL if all pets have it set
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Pet" ALTER COLUMN "householdId" SET NOT NULL;
      EXCEPTION WHEN others THEN NULL; END $$
    `);

    // Add Pet -> Household FK if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Pet"
          ADD CONSTRAINT "Pet_householdId_fkey"
          FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // Drop old Pet.userId FK and column if still present
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Pet" DROP CONSTRAINT "Pet_userId_fkey";
      EXCEPTION WHEN undefined_object THEN NULL; END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Pet" DROP COLUMN "userId";
      EXCEPTION WHEN undefined_column THEN NULL; END $$
    `);

    console.log('[DB] Household schema ensured');
  } catch (err) {
    console.error('[DB] Failed to ensure household schema:', err);
    throw err;
  }
}
