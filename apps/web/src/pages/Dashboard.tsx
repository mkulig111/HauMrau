import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { Scale, Calendar, Syringe, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PetSelector } from '@/components/pets/PetSelector'
import { WeightChart } from '@/components/weight/WeightChart'
import { EventCard } from '@/components/events/EventCard'
import { CalorieBar } from '@/components/diet/CalorieBar'
import { usePets } from '@/hooks/usePets'
import { useWeightLog } from '@/hooks/useWeightLog'
import { useEvents } from '@/hooks/useEvents'
import { useMealLog, useDietPlan } from '@/hooks/useDiet'
import { weightTrend, formatWeight, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { healthApi } from '@/lib/api'
import { format as dateFnsFormat } from 'date-fns'

export function Dashboard() {
  const { data: pets = [], isLoading: petsLoading } = usePets()
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const petId = selectedPetId ?? pets[0]?.id ?? ''

  const { data: weightEntries = [] } = useWeightLog(petId, { limit: 6 })
  const { data: events = [] } = useEvents(petId, { upcoming: true, limit: 3 })
  const { data: dietPlan } = useDietPlan(petId)
  const today = dateFnsFormat(new Date(), 'yyyy-MM-dd')
  const { data: meals = [] } = useMealLog(petId, today)
  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: () => healthApi.listVaccinations(petId),
    enabled: !!petId,
  })

  const selectedPet = pets.find((p) => p.id === petId)
  const trend = weightTrend(weightEntries)
  const lastWeight = weightEntries[weightEntries.length - 1]
  const nextEvent = events.find((e) => !e.done)
  const consumedKcal = meals.reduce((s, m) => s + (m.kcal ?? 0), 0)

  const expiringVaccinations = vaccinations.filter((v) => {
    if (!v.expiresAt) return false
    return differenceInDays(new Date(v.expiresAt), new Date()) <= 30
  })

  if (petsLoading) {
    return <PageWrapper><div className="text-center py-20 text-muted-foreground">Ładowanie...</div></PageWrapper>
  }

  if (pets.length === 0) {
    return (
      <PageWrapper title="Dashboard">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Nie masz jeszcze żadnych zwierząt.</p>
          <Button asChild>
            <Link to="/pets/new">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj zwierzę
            </Link>
          </Button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        <PetSelector
          pets={pets}
          selectedId={petId}
          onSelect={setSelectedPetId}
        />

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Waga</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {lastWeight ? formatWeight(lastWeight.weightKg) : '–'}
                </span>
                {trend === 'losing' && <TrendingDown className="h-5 w-5 text-blue-500" />}
                {trend === 'gaining' && <TrendingUp className="h-5 w-5 text-orange-500" />}
                {trend === 'stable' && <Minus className="h-5 w-5 text-green-500" />}
              </div>
              {lastWeight && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ostatni pomiar: {formatDate(lastWeight.loggedAt)}
                </p>
              )}
              {selectedPet?.weightGoalKg && (
                <p className="text-xs text-muted-foreground">
                  Cel: {formatWeight(selectedPet.weightGoalKg)}
                </p>
              )}
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link to={`/pets/${petId}/weight`}>Historia wagi</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Następne zdarzenie</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {nextEvent ? (
                <>
                  <p className="font-semibold truncate">{nextEvent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(nextEvent.scheduledAt), 'dd.MM.yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Za {differenceInDays(new Date(nextEvent.scheduledAt), new Date())} dni
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Brak zaplanowanych zdarzeń</p>
              )}
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link to={`/pets/${petId}/health`}>Zarządzaj</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Szczepienia</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{vaccinations.length}</p>
              {expiringVaccinations.length > 0 ? (
                <p className="text-xs text-orange-600 font-medium">
                  {expiringVaccinations.length} wygasa wkrótce
                </p>
              ) : (
                <p className="text-xs text-green-600">Wszystkie aktualne</p>
              )}
              <Button variant="link" size="sm" className="px-0 mt-1" asChild>
                <Link to={`/pets/${petId}/health`}>Szczepienia</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Weight chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historia wagi</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/pets/${petId}/weight`}>Szczegóły</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <WeightChart entries={weightEntries} goalWeight={selectedPet?.weightGoalKg} />
          </CardContent>
        </Card>

        {/* Diet */}
        {dietPlan && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dieta dzisiaj</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/pets/${petId}/diet`}>Szczegóły</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <CalorieBar consumed={consumedKcal} target={dietPlan.targetKcal} />
            </CardContent>
          </Card>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Nadchodzące zdarzenia</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/pets/${petId}/health`}>Wszystkie</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} petId={petId} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
