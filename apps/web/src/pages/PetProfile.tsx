import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useRef } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PetAvatar } from '@/components/pets/PetAvatar'
import { usePet, useUpdatePet, useUploadPetPhoto } from '@/hooks/usePets'
import { useToast } from '@/components/ui/use-toast'
import type { Species, Sex } from '@/types'
import { Camera } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1),
  species: z.enum(['CAT', 'DOG', 'RABBIT', 'GUINEA_PIG', 'OTHER']),
  sex: z.enum(['MALE', 'FEMALE']),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  neutered: z.boolean(),
  weightGoalKg: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

export function PetProfile() {
  const { id } = useParams<{ id: string }>()
  const { data: pet, isLoading } = usePet(id!)
  const { mutateAsync: updatePet, isPending } = useUpdatePet(id!)
  const { mutateAsync: uploadPhoto } = useUploadPetPhoto(id!)
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (pet) {
      reset({
        name: pet.name,
        species: pet.species,
        sex: pet.sex,
        breed: pet.breed ?? '',
        birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : '',
        neutered: pet.neutered,
        weightGoalKg: pet.weightGoalKg,
      })
    }
  }, [pet, reset])

  const species = watch('species')
  const sex = watch('sex')
  const neutered = watch('neutered')

  const onSubmit = async (data: FormData) => {
    try {
      await updatePet(data)
      toast({ title: 'Profil zaktualizowany' })
    } catch {
      toast({ title: 'Błąd aktualizacji', variant: 'destructive' })
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadPhoto(file)
      toast({ title: 'Zdjęcie zaktualizowane' })
    } catch {
      toast({ title: 'Błąd przesyłania zdjęcia', variant: 'destructive' })
    }
  }

  if (isLoading) return <PageWrapper><div className="py-20 text-center text-muted-foreground">Ładowanie...</div></PageWrapper>
  if (!pet) return <PageWrapper><div className="py-20 text-center">Nie znaleziono zwierzęcia</div></PageWrapper>

  return (
    <PageWrapper title={`Profil: ${pet.name}`}>
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zdjęcie profilowe</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <PetAvatar photoUrl={pet.photoUrl} species={pet.species} name={pet.name} size="lg" />
            <div>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                Zmień zdjęcie
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dane zwierzęcia</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Imię</Label>
                <Input {...register('name')} />
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
                <Label>Data urodzenia</Label>
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
                <Label htmlFor="neutered">Kastrowany/Sterylizowany</Label>
              </div>

              <div className="space-y-1">
                <Label>Docelowa waga (kg)</Label>
                <Input type="number" step="0.01" {...register('weightGoalKg')} placeholder="np. 4.5" />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
