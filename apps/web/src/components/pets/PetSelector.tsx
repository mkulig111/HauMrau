import { PetAvatar } from './PetAvatar'
import { cn } from '@/lib/utils'
import type { Pet } from '@/types'

interface PetSelectorProps {
  pets: Pet[]
  selectedId: string | null
  onSelect: (id: string) => void
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
          <PetAvatar photoUrl={pet.photoUrl} species={pet.species} name={pet.name} size="md" />
          <span className="text-xs font-medium">{pet.name}</span>
        </button>
      ))}
    </div>
  )
}
