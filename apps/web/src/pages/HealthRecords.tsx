import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { Plus, FileText, Upload } from 'lucide-react'
import { ImportModal } from '@/components/import/ImportModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EventCard } from '@/components/events/EventCard'
import { usePet } from '@/hooks/usePets'
import { useEvents, useCreateEvent } from '@/hooks/useEvents'
import { useToast } from '@/components/ui/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { healthApi } from '@/lib/api'
import type { HealthRecordType, EventType } from '@/types'

export function HealthRecords() {
  const { id } = useParams<{ id: string }>()
  const petId = id!
  const { data: pet } = usePet(petId)
  const { data: events = [] } = useEvents(petId)
  const { mutateAsync: createEvent, isPending: creatingEvent } = useCreateEvent(petId)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: records = [] } = useQuery({
    queryKey: ['health', petId, 'records'],
    queryFn: () => healthApi.listRecords(petId),
    enabled: !!petId,
  })

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: () => healthApi.listVaccinations(petId),
    enabled: !!petId,
  })

  const { mutateAsync: addVaccination, isPending: addingVac } = useMutation({
    mutationFn: (data: Parameters<typeof healthApi.addVaccination>[1]) =>
      healthApi.addVaccination(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', petId] })
    },
  })

  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [addVacOpen, setAddVacOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [importEventsOpen, setImportEventsOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [recordForm, setRecordForm] = useState({ title: '', type: 'NOTE' as HealthRecordType, description: '' })
  const [vacForm, setVacForm] = useState({ name: '', administeredAt: '', expiresAt: '', clinic: '' })
  const [eventForm, setEventForm] = useState({ title: '', type: 'VET_VISIT' as EventType, scheduledAt: '', location: '', notes: '' })

  const handleAddRecord = async () => {
    const fd = new FormData()
    fd.append('title', recordForm.title)
    fd.append('type', recordForm.type)
    if (recordForm.description) fd.append('description', recordForm.description)
    const file = fileRef.current?.files?.[0]
    if (file) fd.append('file', file)
    try {
      await healthApi.addRecord(petId, fd)
      queryClient.invalidateQueries({ queryKey: ['health', petId, 'records'] })
      toast({ title: 'Dodano rekord' })
      setAddRecordOpen(false)
      setRecordForm({ title: '', type: 'NOTE', description: '' })
    } catch {
      toast({ title: 'Błąd dodawania', variant: 'destructive' })
    }
  }

  const handleAddVac = async () => {
    try {
      await addVaccination({
        name: vacForm.name,
        administeredAt: vacForm.administeredAt,
        expiresAt: vacForm.expiresAt || undefined,
        clinic: vacForm.clinic || undefined,
      })
      toast({ title: 'Dodano szczepienie' })
      setAddVacOpen(false)
      setVacForm({ name: '', administeredAt: '', expiresAt: '', clinic: '' })
    } catch {
      toast({ title: 'Błąd', variant: 'destructive' })
    }
  }

  const handleAddEvent = async () => {
    try {
      await createEvent({
        title: eventForm.title,
        type: eventForm.type,
        scheduledAt: new Date(eventForm.scheduledAt).toISOString(),
        location: eventForm.location || undefined,
        notes: eventForm.notes || undefined,
      })
      toast({ title: 'Dodano zdarzenie' })
      setAddEventOpen(false)
      setEventForm({ title: '', type: 'VET_VISIT', scheduledAt: '', location: '', notes: '' })
    } catch {
      toast({ title: 'Błąd', variant: 'destructive' })
    }
  }

  const getVacBadge = (expiresAt?: string) => {
    if (!expiresAt) return <Badge variant="secondary">Bezterminowe</Badge>
    const days = differenceInDays(new Date(expiresAt), new Date())
    if (days < 0) return <Badge variant="destructive">Wygasło</Badge>
    if (days <= 30) return <Badge variant="warning">Wygasa za {days}d</Badge>
    return <Badge variant="success">Ważne</Badge>
  }

  return (
    <PageWrapper title={`Zdrowie${pet ? ` – ${pet.name}` : ''}`}>
      <Tabs defaultValue="records">
        <TabsList className="mb-4">
          <TabsTrigger value="records">Dokumentacja</TabsTrigger>
          <TabsTrigger value="vaccinations">Szczepienia</TabsTrigger>
          <TabsTrigger value="events">Zdarzenia</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Rekordy zdrowotne ({records.length})</h2>
            <Button size="sm" onClick={() => setAddRecordOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Dodaj rekord
            </Button>
          </div>
          <div className="space-y-3">
            {records.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <Badge variant="outline">{r.type}</Badge>
                    </div>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.date), 'dd.MM.yyyy')}</p>
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Pobierz plik
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {records.length === 0 && <p className="text-muted-foreground text-sm">Brak rekordów</p>}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Szczepienia ({vaccinations.length})</h2>
            <Button size="sm" onClick={() => setAddVacOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Dodaj
            </Button>
          </div>
          <div className="space-y-3">
            {vaccinations.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div>
                    <span className="font-medium">{v.name}</span>
                    <p className="text-sm text-muted-foreground">
                      Podane: {format(new Date(v.administeredAt), 'dd.MM.yyyy')}
                    </p>
                    {v.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Wygasa: {format(new Date(v.expiresAt), 'dd.MM.yyyy')}
                      </p>
                    )}
                    {v.clinic && <p className="text-xs text-muted-foreground">{v.clinic}</p>}
                  </div>
                  {getVacBadge(v.expiresAt)}
                </CardContent>
              </Card>
            ))}
            {vaccinations.length === 0 && <p className="text-muted-foreground text-sm">Brak szczepień</p>}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Zdarzenia ({events.length})</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportEventsOpen(true)}>
                <Upload className="h-4 w-4 mr-1" />Importuj CSV
              </Button>
              <Button size="sm" onClick={() => setAddEventOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Dodaj zdarzenie
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {events.map((e) => (
              <EventCard key={e.id} petId={petId} event={e} />
            ))}
            {events.length === 0 && <p className="text-muted-foreground text-sm">Brak zdarzeń</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Record Dialog */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dodaj rekord</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tytuł</Label>
              <Input value={recordForm.title} onChange={(e) => setRecordForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select value={recordForm.type} onValueChange={(v) => setRecordForm((f) => ({ ...f, type: v as HealthRecordType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Notatka</SelectItem>
                  <SelectItem value="DIAGNOSIS">Diagnoza</SelectItem>
                  <SelectItem value="PRESCRIPTION">Recepta</SelectItem>
                  <SelectItem value="LAB_RESULT">Wynik badania</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Opis</Label>
              <Input value={recordForm.description} onChange={(e) => setRecordForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Plik (opcjonalnie)</Label>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />Wybierz plik
              </Button>
              <input ref={fileRef} type="file" className="hidden" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddRecordOpen(false)}>Anuluj</Button>
              <Button onClick={handleAddRecord}>Dodaj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vaccination Dialog */}
      <Dialog open={addVacOpen} onOpenChange={setAddVacOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dodaj szczepienie</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nazwa szczepionki</Label>
              <Input value={vacForm.name} onChange={(e) => setVacForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data podania</Label>
              <Input type="date" value={vacForm.administeredAt} onChange={(e) => setVacForm((f) => ({ ...f, administeredAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data ważności (opcjonalnie)</Label>
              <Input type="date" value={vacForm.expiresAt} onChange={(e) => setVacForm((f) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Klinika (opcjonalnie)</Label>
              <Input value={vacForm.clinic} onChange={(e) => setVacForm((f) => ({ ...f, clinic: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddVacOpen(false)}>Anuluj</Button>
              <Button onClick={handleAddVac} disabled={addingVac || !vacForm.name || !vacForm.administeredAt}>Dodaj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Events Modal */}
      <ImportModal
        petId={petId}
        type="events"
        open={importEventsOpen}
        onClose={() => setImportEventsOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['events', petId] })}
      />

      {/* Add Event Dialog */}
      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dodaj zdarzenie</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tytuł</Label>
              <Input value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select value={eventForm.type} onValueChange={(v) => setEventForm((f) => ({ ...f, type: v as EventType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VET_VISIT">Wizyta u weterynarza</SelectItem>
                  <SelectItem value="DEWORMING">Odrobaczanie</SelectItem>
                  <SelectItem value="GROOMING">Grooming</SelectItem>
                  <SelectItem value="WEIGHT_CHECK">Kontrola wagi</SelectItem>
                  <SelectItem value="OTHER">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data i czas</Label>
              <Input type="datetime-local" value={eventForm.scheduledAt} onChange={(e) => setEventForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Miejsce (opcjonalnie)</Label>
              <Input value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Notatki (opcjonalnie)</Label>
              <Input value={eventForm.notes} onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddEventOpen(false)}>Anuluj</Button>
              <Button onClick={handleAddEvent} disabled={creatingEvent || !eventForm.title || !eventForm.scheduledAt}>Dodaj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
