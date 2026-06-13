import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { householdApi } from '@/lib/api'

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: householdApi.list,
  })
}

export function useGenerateInvite() {
  return useMutation({
    mutationFn: (householdId: string) => householdApi.generateInvite(householdId),
  })
}

export function useJoinHousehold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => householdApi.join(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (householdId: string) => householdApi.leave(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}
