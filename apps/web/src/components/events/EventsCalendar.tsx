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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PetEvent, EventType } from '@/types'

const eventTypeMeta: Record<EventType, { color: string; label: string }> = {
  VET_VISIT: { color: '#6366f1', label: 'Wizyta u weterynarza' },
  DEWORMING: { color: '#f59e0b', label: 'Odrobaczanie' },
  GROOMING: { color: '#ec4899', label: 'Grooming' },
  WEIGHT_CHECK: { color: '#10b981', label: 'Kontrola wagi' },
  OTHER: { color: '#a855f7', label: 'Inne' },
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
    <div className="max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-base font-semibold capitalize">
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
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventsByDay(day)
          const colors = [...new Set(dayEvents.map((e) => eventTypeMeta[e.type]?.color ?? eventTypeMeta.OTHER.color))]
          const fillStep = colors.length ? 100 / colors.length : 0
          const fill = colors.length
            ? `linear-gradient(135deg, ${colors
                .map((c, i) => `${c} ${i * fillStep}%, ${c} ${(i + 1) * fillStep}%`)
                .join(', ')})`
            : undefined
          const allDone = dayEvents.length > 0 && dayEvents.every((e) => e.done)
          return (
            <div key={day.toISOString()} className="flex items-center justify-center py-0.5">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{
                  opacity: isSameMonth(day, month) ? 1 : 0.35,
                  background: fill,
                  border: !fill && isToday(day) ? '2px solid #a855f7' : undefined,
                }}
                title={dayEvents.map((e) => `${eventTypeMeta[e.type]?.label ?? e.type}: ${e.title}`).join('\n')}
              >
                <span
                  className="text-xs font-medium leading-none"
                  style={{
                    color: fill ? '#fff' : undefined,
                    opacity: allDone ? 0.5 : 1,
                  }}
                >
                  {format(day, 'd')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
        {(Object.keys(eventTypeMeta) as EventType[]).map((type) => {
          const meta = eventTypeMeta[type]
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: meta.color }}
              />
              {meta.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
