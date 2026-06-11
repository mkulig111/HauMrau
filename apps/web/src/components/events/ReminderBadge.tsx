import { Badge } from '@/components/ui/badge'
import { getEventUrgency } from '@/lib/utils'
import type { EventUrgency } from '@/types'

const urgencyConfig: Record<EventUrgency, { label: string; variant: 'destructive' | 'warning' | 'secondary' | 'default' }> = {
  overdue: { label: 'Przeterminowane', variant: 'destructive' },
  urgent: { label: 'Pilne', variant: 'warning' },
  upcoming: { label: 'Zbliżające się', variant: 'secondary' },
  ok: { label: 'Planowe', variant: 'default' },
}

interface ReminderBadgeProps {
  scheduledAt: string
}

export function ReminderBadge({ scheduledAt }: ReminderBadgeProps) {
  const urgency = getEventUrgency(new Date(scheduledAt))
  const config = urgencyConfig[urgency]
  return <Badge variant={config.variant as Parameters<typeof Badge>[0]['variant']}>{config.label}</Badge>
}
