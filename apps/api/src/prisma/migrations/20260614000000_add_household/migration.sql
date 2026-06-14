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
CREATE UNIQUE INDEX "HouseholdInvite_code_key" ON "HouseholdInvite"("code");
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- Add householdId to Pet (nullable first for data migration)
ALTER TABLE "Pet" ADD COLUMN "householdId" TEXT;

-- Migrate existing data: create a Household per User and move their pets
DO $$
DECLARE
    u RECORD;
    h_id TEXT;
BEGIN
    FOR u IN SELECT id, name FROM "User" LOOP
        h_id := gen_random_uuid()::text;
        INSERT INTO "Household" ("id", "name") VALUES (h_id, u.name || '''s Household');
        INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role")
            VALUES (gen_random_uuid()::text, h_id, u.id, 'OWNER');
        UPDATE "Pet" SET "householdId" = h_id WHERE "userId" = u.id;
    END LOOP;
END $$;

-- Make householdId NOT NULL now that data is migrated
ALTER TABLE "Pet" ALTER COLUMN "householdId" SET NOT NULL;

-- AddForeignKey constraints
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old userId from Pet
ALTER TABLE "Pet" DROP CONSTRAINT IF EXISTS "Pet_userId_fkey";
ALTER TABLE "Pet" DROP COLUMN IF EXISTS "userId";
