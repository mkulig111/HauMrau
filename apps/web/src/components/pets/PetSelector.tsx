import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { PetAvatar } from './PetAvatar'
import { cn } from '@/lib/utils'
import { useUploadPetPhoto } from '@/hooks/usePets'
import type { Pet } from '@/types'

interface PetSelectorProps {
  pets: Pet[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function PetAvatarUpload({ pet, isSelected }: { pet: Pet; isSelected: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: uploadPhoto, isPending } = useUploadPetPhoto(pet.id)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadPhoto(file)
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scrollBy(-200)}
        className="flex-shrink-0 h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted"
        aria-label="Przewiń w lewo"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 items-start overflow-x-auto scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {pets.map((pet) => (
          <div key={pet.id} className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
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
            {selectedId === pet.id && (
              <Link
                to={`/pets/${pet.id}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Pencil size={10} /> Edytuj dane
              </Link>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(200)}
        className="flex-shrink-0 h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted"
        aria-label="Przewiń w prawo"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
