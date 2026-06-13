import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { useHouseholds, useGenerateInvite, useJoinHousehold } from '@/hooks/useHousehold'
import { Users, Copy, LogIn } from 'lucide-react'

export function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [notifications, setNotifications] = useState({ email: true, push: false })
  const [joinCode, setJoinCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState<{ code: string; expiresAt: string } | null>(null)

  const { data: households = [] } = useHouseholds()
  const generateInvite = useGenerateInvite()
  const joinHousehold = useJoinHousehold()

  const handleSave = () => {
    toast({ title: 'Ustawienia zapisane (symulacja)' })
  }

  const handleGenerateCode = async (householdId: string) => {
    const result = await generateInvite.mutateAsync(householdId)
    setGeneratedCode(result)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    try {
      await joinHousehold.mutateAsync(joinCode.trim())
      setJoinCode('')
      toast({ title: 'Dołączono do gospodarstwa domowego!' })
    } catch {
      toast({ title: 'Nieprawidłowy kod zaproszenia', variant: 'destructive' })
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Skopiowano kod!' })
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Gospodarstwo domowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {households.map((h) => (
              <div key={h.id} className="space-y-3">
                <div>
                  <p className="font-semibold text-sm">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Twoja rola: {h.role === 'OWNER' ? 'Właściciel' : 'Członek'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Członkowie</p>
                  {h.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.role === 'OWNER' ? 'Właściciel' : 'Członek'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateCode(h.id)}
                    disabled={generateInvite.isPending}
                  >
                    Wygeneruj kod zaproszenia
                  </Button>
                  {generatedCode && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <code className="font-mono text-lg font-bold tracking-widest text-primary">
                        {generatedCode.code}
                      </code>
                      <button onClick={() => copyCode(generatedCode.code)} className="text-muted-foreground hover:text-foreground">
                        <Copy size={14} />
                      </button>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Ważny 24h
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-semibold">Dołącz do innego gospodarstwa</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Wpisz kod zaproszenia"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono tracking-widest"
                />
                <Button
                  size="sm"
                  onClick={handleJoin}
                  disabled={joinHousehold.isPending || !joinCode.trim()}
                >
                  <LogIn size={14} className="mr-1" />
                  Dołącz
                </Button>
              </div>
            </div>
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
