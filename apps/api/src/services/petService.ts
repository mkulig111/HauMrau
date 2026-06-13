import { prisma } from '../lib/db';

export type Pet = Awaited<ReturnType<typeof prisma.pet.findFirstOrThrow>>;

export interface CreatePetData {
  name: string;
  species: string;
  breed?: string;
  birthDate?: Date;
  sex: string;
  neutered?: boolean;
  weightGoalKg?: number;
}

export interface UpdatePetData {
  name?: string;
  species?: string;
  breed?: string;
  birthDate?: Date;
  sex?: string;
  neutered?: boolean;
  weightGoalKg?: number;
  photoUrl?: string;
}

async function getUserHouseholdIds(userId: string): Promise<string[]> {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    select: { householdId: true },
  });
  return memberships.map((m) => m.householdId);
}

async function getUserPrimaryHouseholdId(userId: string): Promise<string | null> {
  const owned = await prisma.householdMember.findFirst({
    where: { userId, role: 'OWNER' },
    select: { householdId: true },
  });
  if (owned) return owned.householdId;

  const any = await prisma.householdMember.findFirst({
    where: { userId },
    select: { householdId: true },
  });
  return any?.householdId ?? null;
}

export async function listPets(userId: string): Promise<Pet[]> {
  const householdIds = await getUserHouseholdIds(userId);
  return prisma.pet.findMany({
    where: { householdId: { in: householdIds } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPet(id: string, userId: string): Promise<Pet | null> {
  const householdIds = await getUserHouseholdIds(userId);
  return prisma.pet.findFirst({
    where: { id, householdId: { in: householdIds } },
  });
}

export async function createPet(userId: string, data: CreatePetData): Promise<Pet> {
  const householdId = await getUserPrimaryHouseholdId(userId);
  if (!householdId) throw new Error('User has no household');

  return prisma.pet.create({
    data: {
      ...data,
      householdId,
    },
  });
}

export async function updatePet(id: string, userId: string, data: UpdatePetData): Promise<Pet | null> {
  const pet = await getPet(id, userId);
  if (!pet) return null;

  return prisma.pet.update({
    where: { id },
    data,
  });
}

export async function deletePet(id: string, userId: string): Promise<boolean> {
  const pet = await getPet(id, userId);
  if (!pet) return false;

  await prisma.pet.delete({ where: { id } });
  return true;
}

export async function updatePetPhoto(id: string, userId: string, photoUrl: string): Promise<Pet | null> {
  const pet = await getPet(id, userId);
  if (!pet) return null;

  return prisma.pet.update({
    where: { id },
    data: { photoUrl },
  });
}
