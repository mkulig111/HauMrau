import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { PetAvatar } from './PetAvatar'
import { cn } from '@/lib/utils'
import { useUploadPetPhoto } from '@/hooks/usePets'
import { useQueryClient } from '@tanstack/react-query'
import type { Pet } from '@/types'

interface PetSelectorProps {
  pets: Pet[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function PetAvatarUpload({ pet, isSelected }: { pet: Pet; isSelected: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: uploadPhoto, isPending } = useUploadPetPhoto(pet.id)
  const queryClient = useQueryClient()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadPhoto(file, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
    })
    e.target.value = ''
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <PetAvatar photoUrl={pet.photoUrl ?? undefined} species={pet.species} name={pet.name} size="md" />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        title="Zmień zdjęcie"
        style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 20,
          height: 20,
          borderRadius: '99px',
          background: 'linear-gradient(135deg,#a855f7,#6366f1)',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <Camera size={10} color="white" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

export function PetSelector({ pets, selectedId, onSelect }: PetSelectorProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {pets.map((pet) => (
        <button
          key={pet.id}
          onClick={() => onSelect(pet.id)}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors',
            selectedId === pet.id
              ? 'border-primary bg-primary/5'
              : 'border-transparent hover:border-border'
          )}
        >
          <PetAvatarUpload pet={pet} isSelected={selectedId === pet.id} />
          <span className="text-xs font-medium">{pet.name}</span>
        </button>
      ))}
    </div>
  )
}
