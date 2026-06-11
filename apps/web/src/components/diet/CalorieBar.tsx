import { Progress } from '@/components/ui/progress'

interface CalorieBarProps {
  consumed: number
  target: number
}

export function CalorieBar({ consumed, target }: CalorieBarProps) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  const over = consumed > target

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Spożyte kalorie</span>
        <span className={over ? 'text-destructive font-medium' : 'font-medium'}>
          {consumed} / {target} kcal ({pct}%)
        </span>
      </div>
      <Progress
        value={pct}
        className={over ? '[&>div]:bg-destructive' : ''}
      />
    </div>
  )
}
