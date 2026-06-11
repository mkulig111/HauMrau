import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weightApi } from '@/lib/api'

export function useWeightLog(petId: string, params?: { from?: string; to?: string; limit?: number }) {
  return useQuery({
    queryKey: ['weight', petId, params],
    queryFn: () => weightApi.list(petId, params),
    enabled: !!petId,
  })
}

export function useAddWeight(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { weightKg: number; note?: string; loggedAt?: string }) =>
      weightApi.add(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight', petId] })
    },
  })
}

export function useDeleteWeight(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => weightApi.delete(petId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight', petId] })
    },
  })
}
