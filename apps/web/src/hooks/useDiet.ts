import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dietApi } from '@/lib/api'
import type { DietPlan, MealLog, ActivityFactor } from '@/types'

export function useDietPlan(petId: string) {
  return useQuery({
    queryKey: ['diet', petId, 'plan'],
    queryFn: () => dietApi.getPlan(petId),
    enabled: !!petId,
  })
}

export function useSetDietPlan(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<DietPlan, 'id' | 'petId' | 'activeFrom'>) => dietApi.setPlan(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet', petId, 'plan'] })
    },
  })
}

export function useMealLog(petId: string, date?: string) {
  return useQuery({
    queryKey: ['diet', petId, 'log', date],
    queryFn: () => dietApi.getMealLog(petId, date),
    enabled: !!petId,
  })
}

export function useAddMeal(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<MealLog, 'id' | 'petId' | 'loggedAt'>) => dietApi.addMeal(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet', petId, 'log'] })
    },
  })
}

export function useDeleteMeal(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => dietApi.deleteMeal(petId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet', petId, 'log'] })
    },
  })
}

export function useCalorieSuggest(petId: string, activityFactor: ActivityFactor) {
  return useQuery({
    queryKey: ['diet', petId, 'suggest', activityFactor],
    queryFn: () => dietApi.suggest(petId, activityFactor),
    enabled: !!petId,
  })
}
