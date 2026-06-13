-- CreateTable Household
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable HouseholdMember
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable HouseholdInvite
CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdInvite_code_key" ON "HouseholdInvite"("code");

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add householdId column to Pet (nullable initially for data migration)
ALTER TABLE "Pet" ADD COLUMN "householdId" TEXT;

-- Data migration: create a household for each existing user, make them OWNER, assign their pets
DO $$
DECLARE
  u RECORD;
  hid TEXT;
BEGIN
  FOR u IN SELECT id, name FROM "User" LOOP
    -- generate a cuid-like id using gen_random_uuid
    hid := replace(gen_random_uuid()::text, '-', '');
    INSERT INTO "Household" ("id", "name") VALUES (hid, u.name || '''s Household');
    INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role")
      VALUES (replace(gen_random_uuid()::text, '-', ''), hid, u.id, 'OWNER');
    UPDATE "Pet" SET "householdId" = hid WHERE "userId" = u.id;
  END LOOP;
END $$;

-- Now make householdId NOT NULL (it should be set for all pets now)
ALTER TABLE "Pet" ALTER COLUMN "householdId" SET NOT NULL;

-- AddForeignKey for Pet.householdId
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old Pet.userId FK and column
ALTER TABLE "Pet" DROP CONSTRAINT IF EXISTS "Pet_userId_fkey";
ALTER TABLE "Pet" DROP COLUMN IF EXISTS "userId";

-- Drop old User.pets relation (no DB change needed, just schema)
