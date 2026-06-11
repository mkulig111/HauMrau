import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DietTracker } from '@/components/diet/DietTracker'
import { useDietPlan, useSetDietPlan } from '@/hooks/useDiet'
import { usePet } from '@/hooks/usePets'
import { useToast } from '@/components/ui/use-toast'
import { calculateRER, activityFactors } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ActivityFactor } from '@/types'

export function DietPlan() {
  const { id } = useParams<{ id: string }>()
  const petId = id!
  const { data: pet } = usePet(petId)
  const { data: plan, isLoading } = useDietPlan(petId)
  const { mutateAsync: setPlan, isPending } = useSetDietPlan(petId)
  const { toast } = useToast()
  const [targetKcal, setTargetKcal] = useState('')
  const [dryFoodG, setDryFoodG] = useState('')
  const [wetFoodG, setWetFoodG] = useState('')
  const [notes, setNotes] = useState('')
  const [activityFactor, setActivityFactor] = useState<ActivityFactor>('neutered_indoor')

  const suggestKcal = () => {
    const w = pet?.weightGoalKg ?? (pet ? undefined : undefined)
    if (!w) return
    const factor = activityFactors[activityFactor]
    const kcal = Math.round(calculateRER(w) * factor)
    setTargetKcal(String(kcal))
  }

  const handleSavePlan = async () => {
    try {
      await setPlan({
        targetKcal: parseInt(targetKcal),
        dryFoodG: dryFoodG ? parseFloat(dryFoodG) : undefined,
        wetFoodG: wetFoodG ? parseFloat(wetFoodG) : undefined,
        notes: notes || undefined,
      })
      toast({ title: 'Plan diety zapisany' })
    } catch {
      toast({ title: 'Błąd zapisywania', variant: 'destructive' })
    }
  }

  if (isLoading) return <PageWrapper><div className="py-20 text-center text-muted-foreground">Ładowanie...</div></PageWrapper>

  return (
    <PageWrapper title={`Dieta${pet ? ` – ${pet.name}` : ''}`}>
      <div className="space-y-6 max-w-2xl">
        {plan ? (
          <>
            <Card>
              <CardHeader><CardTitle className="text-lg">Aktywny plan diety</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cel kalorii:</span>
                    <span className="ml-2 font-medium">{plan.targetKcal} kcal/dzień</span>
                  </div>
                  {plan.dryFoodG && (
                    <div>
                      <span className="text-muted-foreground">Sucha karma:</span>
                      <span className="ml-2 font-medium">{plan.dryFoodG}g</span>
                    </div>
                  )}
                  {plan.wetFoodG && (
                    <div>
                      <span className="text-muted-foreground">Mokra karma:</span>
                      <span className="ml-2 font-medium">{plan.wetFoodG}g</span>
                    </div>
                  )}
                  {plan.waterMlTarget && (
                    <div>
                      <span className="text-muted-foreground">Woda:</span>
                      <span className="ml-2 font-medium">{plan.waterMlTarget}ml</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Od: {format(new Date(plan.activeFrom), 'dd.MM.yyyy')}
                </p>
                {plan.notes && <p className="text-sm">{plan.notes}</p>}
              </CardContent>
            </Card>
            <DietTracker petId={petId} targetKcal={plan.targetKcal} />
          </>
        ) : (
          <p className="text-muted-foreground">Brak aktywnego planu diety. Ustaw poniżej.</p>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Ustaw / Zaktualizuj plan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pet?.weightGoalKg && (
              <div className="p-3 rounded-md bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Kalkulator kalorii (waga: {pet.weightGoalKg}kg)</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label>Poziom aktywności</Label>
                    <Select value={activityFactor} onValueChange={(v) => setActivityFactor(v as ActivityFactor)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutered_indoor">Kastrowany, domowy (×1.2)</SelectItem>
                        <SelectItem value="intact_indoor">Niekastrowany, domowy (×1.4)</SelectItem>
                        <SelectItem value="active">Aktywny (×1.6)</SelectItem>
                        <SelectItem value="weight_loss">Odchudzanie (×0.8)</SelectItem>
                        <SelectItem value="weight_gain">Przybranie wagi (×1.8)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={suggestKcal}>Oblicz</Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Cel kalorii (kcal/dzień)</Label>
              <Input type="number" value={targetKcal} onChange={(e) => setTargetKcal(e.target.value)} placeholder="np. 240" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Sucha karma (g)</Label>
                <Input type="number" value={dryFoodG} onChange={(e) => setDryFoodG(e.target.value)} placeholder="opcjonalnie" />
              </div>
              <div className="space-y-1">
                <Label>Mokra karma (g)</Label>
                <Input type="number" value={wetFoodG} onChange={(e) => setWetFoodG(e.target.value)} placeholder="opcjonalnie" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notatki</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="opcjonalnie" />
            </div>
            <Button onClick={handleSavePlan} disabled={isPending || !targetKcal}>
              {isPending ? 'Zapisywanie...' : 'Zapisz plan'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
