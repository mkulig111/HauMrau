import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreatePet } from '@/hooks/usePets'
import { useToast } from '@/components/ui/use-toast'
import type { Species, Sex } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Imię jest wymagane'),
  species: z.enum(['CAT', 'DOG', 'RABBIT', 'GUINEA_PIG', 'OTHER']),
  sex: z.enum(['MALE', 'FEMALE']),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  neutered: z.boolean(),
  weightGoalKg: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

export function NewPet() {
  const navigate = useNavigate()
  const { mutateAsync: createPet, isPending } = useCreatePet()
  const { toast } = useToast()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: 'CAT', sex: 'MALE', neutered: false },
  })

  const species = watch('species')
  const sex = watch('sex')
  const neutered = watch('neutered')

  const onSubmit = async (data: FormData) => {
    try {
      const pet = await createPet({
        name: data.name,
        species: data.species,
        sex: data.sex,
        breed: data.breed || undefined,
        birthDate: data.birthDate || undefined,
        neutered: data.neutered,
        weightGoalKg: data.weightGoalKg || undefined,
        photoUrl: undefined,
      })
      toast({ title: `Dodano zwierzę: ${pet.name}` })
      navigate('/')
    } catch {
      toast({ title: 'Błąd dodawania zwierzęcia', variant: 'destructive' })
    }
  }

  return (
    <PageWrapper title="Dodaj zwierzę">
      <div className="max-w-xl">
        <Card>
          <CardHeader><CardTitle className="text-lg">Dane zwierzęcia</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Imię</Label>
                <Input {...register('name')} placeholder="np. Mruczek" autoFocus />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Gatunek</Label>
                  <Select value={species} onValueChange={(v) => setValue('species', v as Species)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAT">Kot</SelectItem>
                      <SelectItem value="DOG">Pies</SelectItem>
                      <SelectItem value="RABBIT">Królik</SelectItem>
                      <SelectItem value="GUINEA_PIG">Świnka morska</SelectItem>
                      <SelectItem value="OTHER">Inne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Płeć</Label>
                  <Select value={sex} onValueChange={(v) => setValue('sex', v as Sex)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Samiec</SelectItem>
                      <SelectItem value="FEMALE">Samica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Rasa (opcjonalnie)</Label>
                <Input {...register('breed')} placeholder="np. Maine Coon" />
              </div>

              <div className="space-y-1">
                <Label>Data urodzenia (opcjonalnie)</Label>
                <Input type="date" {...register('birthDate')} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="neutered"
                  checked={neutered}
                  onChange={(e) => setValue('neutered', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="neutered">Kastrowany / Sterylizowany</Label>
              </div>

              <div className="space-y-1">
                <Label>Docelowa waga (kg, opcjonalnie)</Label>
                <Input type="number" step="0.01" {...register('weightGoalKg')} placeholder="np. 4.5" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Dodawanie...' : 'Dodaj zwierzę'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
