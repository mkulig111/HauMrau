import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'

export function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
  })

  const handleSave = () => {
    toast({ title: 'Ustawienia zapisane (symulacja)' })
  }

  return (
    <PageWrapper title="Ustawienia">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Imię</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleSave}>Zapisz zmiany</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Powiadomienia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Powiadomienia email</span>
              <button
                onClick={() => setNotifications((n) => ({ ...n, email: !n.email }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.email ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Powiadomienia push</span>
              <button
                onClick={() => setNotifications((n) => ({ ...n, push: !n.push }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.push ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
