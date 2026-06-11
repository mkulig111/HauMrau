import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDeleteMeal } from '@/hooks/useDiet'
import { useToast } from '@/components/ui/use-toast'
import type { MealLog } from '@/types'

const mealTypeLabels: Record<string, string> = {
  DRY: 'Sucha karma',
  WET: 'Mokra karma',
  TREAT: 'Przysmak',
  WATER: 'Woda',
  OTHER: 'Inne',
}

interface MealLogListProps {
  petId: string
  meals: MealLog[]
}

export function MealLogList({ petId, meals }: MealLogListProps) {
  const { toast } = useToast()
  const { mutateAsync } = useDeleteMeal(petId)

  const handleDelete = async (id: string) => {
    try {
      await mutateAsync(id)
      toast({ title: 'Usunięto posiłek' })
    } catch {
      toast({ title: 'Błąd podczas usuwania', variant: 'destructive' })
    }
  }

  if (meals.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak posiłków w tym dniu</p>
  }

  return (
    <div className="space-y-2">
      {meals.map((meal) => (
        <div key={meal.id} className="flex items-center justify-between p-2 rounded-md border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{mealTypeLabels[meal.type] || meal.type}</Badge>
            <span className="text-sm">
              {meal.amountG ? `${meal.amountG}g` : ''}
              {meal.amountMl ? `${meal.amountMl}ml` : ''}
              {meal.kcal ? ` • ${meal.kcal} kcal` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(meal.loggedAt), 'HH:mm')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDelete(meal.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
