import { format } from 'date-fns'
import { MapPin, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ReminderBadge } from './ReminderBadge'
import { Button } from '@/components/ui/button'
import { useUpdateEvent } from '@/hooks/useEvents'
import type { PetEvent } from '@/types'

const eventTypeLabels: Record<string, string> = {
  VET_VISIT: 'Wizyta u weterynarza',
  DEWORMING: 'Odrobaczanie',
  GROOMING: 'Grooming',
  WEIGHT_CHECK: 'Kontrola wagi',
  OTHER: 'Inne',
}

interface EventCardProps {
  petId: string
  event: PetEvent
}

export function EventCard({ petId, event }: EventCardProps) {
  const { mutateAsync } = useUpdateEvent(petId)

  const handleMarkDone = async () => {
    await mutateAsync({ eventId: event.id, data: { done: true } })
  }

  return (
    <Card className={event.done ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{event.title}</span>
              <span className="text-xs text-muted-foreground">{eventTypeLabels[event.type] || event.type}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(event.scheduledAt), 'dd.MM.yyyy HH:mm')}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </p>
            )}
            {event.notes && <p className="text-sm mt-1">{event.notes}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!event.done && <ReminderBadge scheduledAt={event.scheduledAt} />}
            {event.done && (
              <span className="text-green-600 flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Zrobione
              </span>
            )}
            {!event.done && (
              <Button variant="outline" size="sm" onClick={handleMarkDone}>
                Oznacz jako zrobione
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
