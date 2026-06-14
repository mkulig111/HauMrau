import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petsApi } from '@/lib/api'
import type { Pet } from '@/types'

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: petsApi.list,
  })
}

export function usePet(id: string) {
  return useQuery({
    queryKey: ['pets', id],
    queryFn: () => petsApi.get(id),
    enabled: !!id,
  })
}

export function useCreatePet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Pet, 'id' | 'householdId' | 'createdAt'>) => petsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useUpdatePet(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<Pet, 'id' | 'householdId' | 'createdAt'>>) => petsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['pets', id] })
    },
  })
}

export function useDeletePet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => petsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useUploadPetPhoto(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => petsApi.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', id] })
    },
  })
}
