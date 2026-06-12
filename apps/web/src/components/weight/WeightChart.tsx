import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import type { WeightLog } from '@/types'

interface WeightChartProps {
  entries: WeightLog[]
  goalWeight?: number
}

export function WeightChart({ entries, goalWeight }: WeightChartProps) {
  const data = [...entries]
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
    .map((e) => ({
      date: format(new Date(e.loggedAt), 'dd.MM.yy'),
      weight: e.weightKg,
    }))

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Brak danych o wadze
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v} kg`}
        />
        <Tooltip formatter={(value: number) => [`${value} kg`, 'Waga']} />
        {goalWeight && (
          <ReferenceLine y={goalWeight} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: 'Cel', position: 'right', fontSize: 11 }} />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
