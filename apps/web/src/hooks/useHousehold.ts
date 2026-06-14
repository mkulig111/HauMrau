import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { householdApi } from '../lib/api'

export function useHouseholds() {
  return useQuery({ queryKey: ['households'], queryFn: householdApi.list })
}

export function useGenerateInvite() {
  return useMutation({ mutationFn: (householdId: string) => householdApi.generateInvite(householdId) })
}

export function useJoinHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => householdApi.join(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })
}

export function useLeaveHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (householdId: string) => householdApi.leave(householdId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })
}
