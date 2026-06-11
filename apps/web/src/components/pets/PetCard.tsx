import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PetAvatar } from './PetAvatar'
import type { Pet } from '@/types'

interface PetCardProps {
  pet: Pet
}

export function PetCard({ pet }: PetCardProps) {
  const age = pet.birthDate
    ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  return (
    <Link to={`/pets/${pet.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <PetAvatar photoUrl={pet.photoUrl} species={pet.species} name={pet.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{pet.name}</h3>
              {pet.neutered && <Badge variant="secondary" className="text-xs">Kastrowany</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {pet.species === 'CAT' ? 'Kot' :
               pet.species === 'DOG' ? 'Pies' :
               pet.species === 'RABBIT' ? 'Królik' :
               pet.species === 'GUINEA_PIG' ? 'Świnka morska' : 'Inne'}
              {pet.breed ? ` • ${pet.breed}` : ''}
              {age !== null ? ` • ${age} lat` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
