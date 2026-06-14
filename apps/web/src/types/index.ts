export type Species = 'CAT' | 'DOG' | 'RABBIT' | 'GUINEA_PIG' | 'OTHER'
export type Sex = 'MALE' | 'FEMALE'
export type MealType = 'DRY' | 'WET' | 'TREAT' | 'WATER' | 'OTHER'
export type EventType = 'VET_VISIT' | 'DEWORMING' | 'GROOMING' | 'WEIGHT_CHECK' | 'OTHER'
export type HealthRecordType = 'LAB_RESULT' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'NOTE'
export type EventUrgency = 'overdue' | 'urgent' | 'upcoming' | 'ok'
export type WeightTrend = 'losing' | 'gaining' | 'stable'
export type ActivityFactor = 'neutered_indoor' | 'intact_indoor' | 'active' | 'weight_loss' | 'weight_gain'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Pet {
  id: string
  userId: string
  name: string
  species: Species
  breed?: string
  birthDate?: string
  sex: Sex
  neutered: boolean
  weightGoalKg?: number
  photoUrl?: string
  createdAt: string
}

export interface WeightLog {
  id: string
  petId: string
  weightKg: number
  note?: string
  loggedAt: string
}

export interface DietPlan {
  id: string
  petId: string
  targetKcal: number
  dryFoodG?: number
  wetFoodG?: number
  waterMlTarget?: number
  notes?: string
  activeFrom: string
  activeTo?: string
}

export interface MealLog {
  id: string
  petId: string
  type: MealType
  amountG?: number
  amountMl?: number
  kcal?: number
  loggedAt: string
}

export interface PetEvent {
  id: string
  petId: string
  type: EventType
  title: string
  scheduledAt: string
  location?: string
  notes?: string
  done: boolean
  remindAt?: string
  createdAt: string
}

export interface Vaccination {
  id: string
  petId: string
  name: string
  administeredAt: string
  expiresAt?: string
  clinic?: string
  batchNumber?: string
  documentUrl?: string
}

export interface HealthRecord {
  id: string
  petId: string
  title: string
  date: string
  type: HealthRecordType
  description?: string
  fileUrl?: string
  createdAt: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface AuthTokens {
  accessToken: string
  user: User
}

export interface CaloriesSuggestion {
  rer: number
  dailyKcal: number
  activityFactor: ActivityFactor
  weightKg: number
}
