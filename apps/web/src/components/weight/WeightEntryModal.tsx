import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddWeight } from '@/hooks/useWeightLog'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  weightKg: z.coerce.number().min(0.1).max(200),
  note: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface WeightEntryModalProps {
  petId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeightEntryModal({ petId, open, onOpenChange }: WeightEntryModalProps) {
  const { toast } = useToast()
  const { mutateAsync, isPending } = useAddWeight(petId)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync(data)
      toast({ title: 'Zapisano wagę' })
      reset()
      onOpenChange(false)
    } catch {
      toast({ title: 'Błąd podczas zapisywania', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj wpis wagi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Waga (kg)</Label>
            <Input type="number" step="0.01" placeholder="np. 4.5" {...register('weightKg')} />
            {errors.weightKg && <p className="text-xs text-destructive">{errors.weightKg.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Data (opcjonalnie)</Label>
            <Input type="datetime-local" {...register('loggedAt')} />
          </div>
          <div className="space-y-1">
            <Label>Notatka (opcjonalnie)</Label>
            <Input placeholder="np. po wizycie u weterynarza" {...register('note')} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
