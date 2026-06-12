import { prisma } from '../lib/db';

export type WeightLog = Awaited<ReturnType<typeof prisma.weightLog.findFirstOrThrow>>;

export interface CreateWeightLogData {
  weightKg: number;
  note?: string;
  loggedAt?: Date;
}

export interface WeightHistoryOptions {
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function getWeightHistory(
  petId: string,
  options: WeightHistoryOptions = {}
): Promise<WeightLog[]> {
  const { from, to, limit = 100 } = options;

  return prisma.weightLog.findMany({
    where: {
      petId,
      ...(from || to
        ? {
            loggedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { loggedAt: 'asc' },
    take: limit,
  });
}

export async function addWeightLog(petId: string, data: CreateWeightLogData): Promise<WeightLog> {
  return prisma.weightLog.create({
    data: {
      petId,
      weightKg: data.weightKg,
      note: data.note,
      loggedAt: data.loggedAt ?? new Date(),
    },
  });
}

export async function deleteWeightLog(entryId: string, petId: string): Promise<boolean> {
  const entry = await prisma.weightLog.findFirst({ where: { id: entryId, petId } });
  if (!entry) return false;

  await prisma.weightLog.delete({ where: { id: entryId } });
  return true;
}
