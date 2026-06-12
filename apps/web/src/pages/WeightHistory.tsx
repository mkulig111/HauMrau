import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, subMonths, subYears } from 'date-fns'
import { Trash2, Plus, Upload } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WeightChart } from '@/components/weight/WeightChart'
import { WeightEntryModal } from '@/components/weight/WeightEntryModal'
import { ImportModal } from '@/components/import/ImportModal'
import { usePet } from '@/hooks/usePets'
import { useWeightLog, useDeleteWeight } from '@/hooks/useWeightLog'
import { useToast } from '@/components/ui/use-toast'
import { formatWeight, formatDate, weightTrend } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'

type Range = '1M' | '3M' | '6M' | '1R' | 'ALL'

export function WeightHistory() {
  const { id } = useParams<{ id: string }>()
  const petId = id!
  const { data: pet } = usePet(petId)
  const [range, setRange] = useState<Range>('3M')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const { toast } = useToast()
  const { mutateAsync: deleteEntry } = useDeleteWeight(petId)
  const queryClient = useQueryClient()

  const fromDate = (() => {
    const now = new Date()
    if (range === '1M') return format(subMonths(now, 1), 'yyyy-MM-dd')
    if (range === '3M') return format(subMonths(now, 3), 'yyyy-MM-dd')
    if (range === '6M') return format(subMonths(now, 6), 'yyyy-MM-dd')
    if (range === '1R') return format(subYears(now, 1), 'yyyy-MM-dd')
    return undefined
  })()

  const { data: entries = [], isLoading } = useWeightLog(petId, { from: fromDate })
  const trend = weightTrend(entries)
  const last = entries[entries.length - 1]

  const handleDelete = async (entryId: string) => {
    try {
      await deleteEntry(entryId)
      toast({ title: 'Usunięto wpis' })
    } catch {
      toast({ title: 'Błąd usuwania', variant: 'destructive' })
    }
  }

  const trendVariant = trend === 'losing' ? 'default' : trend === 'gaining' ? 'warning' : 'secondary'
  const trendLabel = trend === 'losing' ? 'Traci wagę' : trend === 'gaining' ? 'Przybiera' : 'Stabilna'

  return (
    <PageWrapper title={`Historia wagi${pet ? ` – ${pet.name}` : ''}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {last && <span className="text-2xl font-bold">{formatWeight(last.weightKg)}</span>}
            <Badge variant={trendVariant as Parameters<typeof Badge>[0]['variant']}>{trendLabel}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" />
              Importuj CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Dodaj pomiar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Wykres</CardTitle>
            <div className="flex gap-1">
              {(['1M', '3M', '6M', '1R', 'ALL'] as Range[]).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={range === r ? 'default' : 'outline'}
                  onClick={() => setRange(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Ładowanie...</div>
            ) : (
              <WeightChart entries={entries} goalWeight={pet?.weightGoalKg} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Wszystkie pomiary</CardTitle></CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm">Brak pomiarów w tym zakresie</p>
            ) : (
              <div className="space-y-2">
                {[...entries].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <span className="font-medium">{formatWeight(entry.weightKg)}</span>
                      {entry.note && <span className="text-sm text-muted-foreground ml-2">{entry.note}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{formatDate(entry.loggedAt)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <WeightEntryModal petId={petId} open={addOpen} onOpenChange={setAddOpen} />
        <ImportModal
          petId={petId}
          type="weight"
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['weight', petId] })}
        />
      </div>
    </PageWrapper>
  )
}
