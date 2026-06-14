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

export async function listPets(userId: string): Promise<Pet[]> {
  return prisma.pet.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPet(id: string, userId: string): Promise<Pet | null> {
  return prisma.pet.findFirst({
    where: { id, userId },
  });
}

export async function createPet(userId: string, data: CreatePetData): Promise<Pet> {
  return prisma.pet.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updatePet(id: string, userId: string, data: UpdatePetData): Promise<Pet | null> {
  const pet = await prisma.pet.findFirst({ where: { id, userId } });
  if (!pet) return null;

  return prisma.pet.update({
    where: { id },
    data,
  });
}

export async function deletePet(id: string, userId: string): Promise<boolean> {
  const pet = await prisma.pet.findFirst({ where: { id, userId } });
  if (!pet) return false;

  await prisma.pet.delete({ where: { id } });
  return true;
}

export async function updatePetPhoto(id: string, userId: string, photoUrl: string): Promise<Pet | null> {
  const pet = await prisma.pet.findFirst({ where: { id, userId } });
  if (!pet) return null;

  return prisma.pet.update({
    where: { id },
    data: { photoUrl },
  });
}
