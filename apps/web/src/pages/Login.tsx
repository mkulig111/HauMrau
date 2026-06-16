import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { PawPrint } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

const schema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch {
      toast({ title: 'Nieprawidłowe dane logowania', variant: 'destructive' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <Toaster />
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '28px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 16px 48px rgba(168,85,247,.12)',
        border: '1px solid rgba(255,255,255,0.8)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '26px',
            fontWeight: 900,
            background: 'linear-gradient(135deg,#a855f7,#6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>HauMrau</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Zaloguj się do swojego konta</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Email</Label>
            <Input type="email" placeholder="email@example.com" {...register('email')}
              style={{ borderRadius: '12px', border: '1.5px solid #e5e7eb', padding: '11px 16px', fontSize: '14px' }} />
            {errors.email && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{errors.email.message}</p>}
          </div>
          <div>
            <Label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Hasło</Label>
            <Input type="password" placeholder="••••••••" {...register('password')}
              style={{ borderRadius: '12px', border: '1.5px solid #e5e7eb', padding: '11px 16px', fontSize: '14px' }} />
            {errors.password && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-gradient"
            style={{ padding: '13px', borderRadius: '14px', fontSize: '15px', cursor: 'pointer', marginTop: '4px' }}>
            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '20px' }}>
          Nie masz konta?{' '}
          <Link to="/register" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}
