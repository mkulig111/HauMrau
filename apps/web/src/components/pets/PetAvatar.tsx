import type { Species } from '@/types'

const speciesEmoji: Record<Species, string> = {
  CAT: '🐱',
  DOG: '🐶',
  RABBIT: '🐰',
  GUINEA_PIG: '🐹',
  OTHER: '🐾',
}

interface PetAvatarProps {
  photoUrl?: string
  species: Species
  name: string
  size?: 'sm' | 'md' | 'lg'
}

function resolvePhotoUrl(photoUrl: string): string {
  if (photoUrl.startsWith('http')) return photoUrl
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1')
    .replace('/api/v1', '')
  return `${base}${photoUrl}`
}

export function PetAvatar({ photoUrl, species, name, size = 'md' }: PetAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-12 w-12 text-2xl',
    lg: 'h-20 w-20 text-4xl',
  }

  if (photoUrl) {
    return (
      <img
        src={resolvePhotoUrl(photoUrl)}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-border`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center border-2 border-border`}
    >
      {speciesEmoji[species]}
    </div>
  )
}

