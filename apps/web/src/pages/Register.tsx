import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { PawPrint } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

const schema = z.object({
  name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Hasła nie są zgodne',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function Register() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.register({ name: data.name, email: data.email, password: data.password })
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)
      navigate('/')
    } catch {
      toast({ title: 'Błąd rejestracji. Spróbuj ponownie.', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <PawPrint className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Zarejestruj się</CardTitle>
          <CardDescription>Utwórz nowe konto PetCare</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Imię</Label>
              <Input placeholder="Jan Kowalski" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Hasło</Label>
              <Input type="password" placeholder="••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Potwierdź hasło</Label>
              <Input type="password" placeholder="••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Masz już konto?{' '}
            <Link to="/login" className="text-primary hover:underline">Zaloguj się</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
