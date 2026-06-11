import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays } from 'date-fns'
import type { EventUrgency, WeightTrend } from '../types'
import type { WeightLog } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75)
}

export const activityFactors = {
  neutered_indoor: 1.2,
  intact_indoor: 1.4,
  active: 1.6,
  weight_loss: 0.8,
  weight_gain: 1.8,
} as const

export function dailyKcal(weightKg: number, factor: number): number {
  return Math.round(calculateRER(weightKg) * factor)
}

export function getEventUrgency(scheduledAt: Date): EventUrgency {
  const daysUntil = differenceInDays(scheduledAt, new Date())
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 3) return 'urgent'
  if (daysUntil <= 14) return 'upcoming'
  return 'ok'
}

export function weightTrend(entries: WeightLog[]): WeightTrend {
  if (entries.length < 2) return 'stable'
  const last = entries[entries.length - 1].weightKg
  const first = entries[0].weightKg
  const diff = last - first
  if (Math.abs(diff) < 0.1) return 'stable'
  return diff < 0 ? 'losing' : 'gaining'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pl-PL')
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(2)} kg`
}
