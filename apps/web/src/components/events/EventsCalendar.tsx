import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Stethoscope, Bug, Scissors, Scale, CircleDot } from 'lucide-react'
import type { PetEvent, EventType } from '@/types'

const eventTypeMeta: Record<EventType, { color: string; icon: typeof Stethoscope; label: string }> = {
  VET_VISIT: { color: '#6366f1', icon: Stethoscope, label: 'Wizyta u weterynarza' },
  DEWORMING: { color: '#f59e0b', icon: Bug, label: 'Odrobaczanie' },
  GROOMING: { color: '#ec4899', icon: Scissors, label: 'Grooming' },
  WEIGHT_CHECK: { color: '#10b981', icon: Scale, label: 'Kontrola wagi' },
  OTHER: { color: '#a855f7', icon: CircleDot, label: 'Inne' },
}

interface EventsCalendarProps {
  events: PetEvent[]
}

export function EventsCalendar({ events }: EventsCalendarProps) {
  const [month, setMonth] = useState(() => new Date())

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsByDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.scheduledAt), day))

  const weekDayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold capitalize">
          {format(month, 'LLLL yyyy', { locale: pl })}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted"
          aria-label="Następny miesiąc"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventsByDay(day)
          return (
            <div
              key={day.toISOString()}
              className="aspect-square rounded-lg border border-border/60 p-1 flex flex-col items-center justify-start gap-0.5"
              style={{
                opacity: isSameMonth(day, month) ? 1 : 0.35,
                background: isToday(day) ? 'rgba(168,85,247,0.08)' : undefined,
                borderColor: isToday(day) ? '#a855f7' : undefined,
              }}
              title={dayEvents.map((e) => `${eventTypeMeta[e.type]?.label ?? e.type}: ${e.title}`).join('\n')}
            >
              <span className="text-[10px] font-medium">{format(day, 'd')}</span>
              <div className="flex flex-wrap items-center justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const meta = eventTypeMeta[e.type] ?? eventTypeMeta.OTHER
                  const Icon = meta.icon
                  return (
                    <span
                      key={e.id}
                      style={{
                        color: meta.color,
                        opacity: e.done ? 0.4 : 1,
                      }}
                    >
                      <Icon size={10} strokeWidth={2.5} />
                    </span>
                  )
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {(Object.keys(eventTypeMeta) as EventType[]).map((type) => {
          const meta = eventTypeMeta[type]
          const Icon = meta.icon
          return (
            <div key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Icon size={10} color={meta.color} strokeWidth={2.5} />
              {meta.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
