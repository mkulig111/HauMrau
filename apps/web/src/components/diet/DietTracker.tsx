import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalorieBar } from './CalorieBar'
import { MealLogList } from './MealLogList'
import { useMealLog, useAddMeal } from '@/hooks/useDiet'
import { useToast } from '@/components/ui/use-toast'
import type { MealType } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DietTrackerProps {
  petId: string
  targetKcal: number
}

interface AddMealForm {
  type: MealType
  amountG: string
  kcal: string
}

export function DietTracker({ petId, targetKcal }: DietTrackerProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: meals = [], isLoading } = useMealLog(petId, today)
  const { mutateAsync, isPending } = useAddMeal(petId)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddMealForm>({ type: 'DRY', amountG: '', kcal: '' })

  const consumed = meals.reduce((sum, m) => sum + (m.kcal ?? 0), 0)

  const handleAdd = async () => {
    try {
      await mutateAsync({
        type: form.type,
        amountG: form.amountG ? parseFloat(form.amountG) : undefined,
        kcal: form.kcal ? parseFloat(form.kcal) : undefined,
      })
      toast({ title: 'Dodano posiłek' })
      setForm({ type: 'DRY', amountG: '', kcal: '' })
      setOpen(false)
    } catch {
      toast({ title: 'Błąd', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Dzisiejsze żywienie</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Dodaj posiłek
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <CalorieBar consumed={consumed} target={targetKcal} />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        ) : (
          <MealLogList petId={petId} meals={meals} />
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj posiłek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MealType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRY">Sucha karma</SelectItem>
                  <SelectItem value="WET">Mokra karma</SelectItem>
                  <SelectItem value="TREAT">Przysmak</SelectItem>
                  <SelectItem value="WATER">Woda</SelectItem>
                  <SelectItem value="OTHER">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ilość (g)</Label>
              <Input
                type="number"
                value={form.amountG}
                onChange={(e) => setForm((f) => ({ ...f, amountG: e.target.value }))}
                placeholder="opcjonalnie"
              />
            </div>
            <div className="space-y-1">
              <Label>Kalorie (kcal)</Label>
              <Input
                type="number"
                value={form.kcal}
                onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))}
                placeholder="opcjonalnie"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
              <Button onClick={handleAdd} disabled={isPending}>
                {isPending ? 'Dodawanie...' : 'Dodaj'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
