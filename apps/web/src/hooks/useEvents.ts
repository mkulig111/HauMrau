import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'
import type { PetEvent } from '@/types'

export function useEvents(petId: string, params?: { upcoming?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['events', petId, params],
    queryFn: () => eventsApi.list(petId, params),
    enabled: !!petId,
  })
}

export function useCreateEvent(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<PetEvent, 'id' | 'petId' | 'createdAt' | 'done'>) =>
      eventsApi.create(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', petId] })
    },
  })
}

export function useUpdateEvent(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<PetEvent> }) =>
      eventsApi.update(petId, eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', petId] })
    },
  })
}

export function useDeleteEvent(petId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.delete(petId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', petId] })
    },
  })
}
