import { prisma } from '../lib/db';
import { DietPlan, MealLog } from '@prisma/client';

export interface CreateDietPlanData {
  targetKcal: number;
  dryFoodG?: number;
  wetFoodG?: number;
  waterMlTarget?: number;
  notes?: string;
  activeFrom?: Date;
  activeTo?: Date;
}

export interface CreateMealLogData {
  type: string;
  amountG?: number;
  amountMl?: number;
  kcal?: number;
  loggedAt?: Date;
}

export type ActivityFactor =
  | 'neutered_indoor'
  | 'intact_indoor'
  | 'active'
  | 'weight_loss'
  | 'weight_gain';

const activityFactors: Record<ActivityFactor, number> = {
  neutered_indoor: 1.2,
  intact_indoor: 1.4,
  active: 1.6,
  weight_loss: 0.8,
  weight_gain: 1.8,
};

export async function getActiveDietPlan(petId: string): Promise<DietPlan | null> {
  const now = new Date();
  return prisma.dietPlan.findFirst({
    where: {
      petId,
      activeFrom: { lte: now },
      OR: [{ activeTo: null }, { activeTo: { gte: now } }],
    },
    orderBy: { activeFrom: 'desc' },
  });
}

export async function createDietPlan(petId: string, data: CreateDietPlanData): Promise<DietPlan> {
  // Close existing active plan
  const now = new Date();
  await prisma.dietPlan.updateMany({
    where: {
      petId,
      activeFrom: { lte: now },
      OR: [{ activeTo: null }, { activeTo: { gte: now } }],
    },
    data: { activeTo: now },
  });

  return prisma.dietPlan.create({
    data: {
      petId,
      targetKcal: data.targetKcal,
      dryFoodG: data.dryFoodG,
      wetFoodG: data.wetFoodG,
      waterMlTarget: data.waterMlTarget,
      notes: data.notes,
      activeFrom: data.activeFrom ?? now,
      activeTo: data.activeTo,
    },
  });
}

export async function getMealLogs(petId: string, date: string): Promise<MealLog[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.mealLog.findMany({
    where: {
      petId,
      loggedAt: { gte: start, lte: end },
    },
    orderBy: { loggedAt: 'asc' },
  });
}

export async function addMealLog(petId: string, data: CreateMealLogData): Promise<MealLog> {
  return prisma.mealLog.create({
    data: {
      petId,
      type: data.type,
      amountG: data.amountG,
      amountMl: data.amountMl,
      kcal: data.kcal,
      loggedAt: data.loggedAt ?? new Date(),
    },
  });
}

export async function deleteMealLog(entryId: string, petId: string): Promise<boolean> {
  const entry = await prisma.mealLog.findFirst({ where: { id: entryId, petId } });
  if (!entry) return false;

  await prisma.mealLog.delete({ where: { id: entryId } });
  return true;
}

export function calculateDailyKcal(weightKg: number, factor: ActivityFactor): number {
  const rer = 70 * Math.pow(weightKg, 0.75);
  const multiplier = activityFactors[factor];
  return Math.round(rer * multiplier);
}

export { activityFactors };
