import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { useHouseholds, useGenerateInvite, useJoinHousehold, useLeaveHousehold } from '@/hooks/useHousehold'

export function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [joinCode, setJoinCode] = useState('')
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({})

  const { data: households = [], isLoading } = useHouseholds()
  const generateInvite = useGenerateInvite()
  const joinHousehold = useJoinHousehold()
  const leaveHousehold = useLeaveHousehold()

  const handleGenerateInvite = async (householdId: string) => {
    try {
      const result = await generateInvite.mutateAsync(householdId)
      setInviteCodes((prev) => ({ ...prev, [householdId]: result.code }))
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się wygenerować kodu', variant: 'destructive' })
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Skopiowano!', description: `Kod ${code} skopiowany do schowka` })
  }

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    try {
      await joinHousehold.mutateAsync(code)
      setJoinCode('')
      toast({ title: 'Dołączono!', description: 'Teraz masz dostęp do wspólnych zwierząt' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nieprawidłowy kod'
      toast({ title: 'Błąd', description: msg, variant: 'destructive' })
    }
  }

  const handleLeave = async (householdId: string, householdName: string) => {
    try {
      await leaveHousehold.mutateAsync(householdId)
      toast({ title: 'Opuszczono', description: `Opuściłeś ${householdName}` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nie udało się opuścić'
      toast({ title: 'Błąd', description: msg, variant: 'destructive' })
    }
  }

  return (
    <PageWrapper title="Ustawienia">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Imię</Label>
              <Input value={user?.name ?? ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gospodarstwo domowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Ładowanie...</p>
            ) : (
              households.map((h) => (
                <div key={h.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.role === 'OWNER' ? 'Właściciel' : 'Członek'} · {h.members.length}{' '}
                        {h.members.length === 1 ? 'osoba' : 'osoby/osób'}
                      </p>
                    </div>
                    {h.role === 'MEMBER' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeave(h.id, h.name)}
                        disabled={leaveHousehold.isPending}
                      >
                        Opuść
                      </Button>
                    )}
                  </div>

                  <div className="rounded-md border divide-y">
                    {h.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{m.user.name}</p>
                          <p className="text-xs text-muted-foreground">{m.user.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {m.role === 'OWNER' ? 'Właściciel' : 'Członek'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateInvite(h.id)}
                      disabled={generateInvite.isPending}
                    >
                      Generuj kod zaproszenia
                    </Button>
                    {inviteCodes[h.id] && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono tracking-widest">
                          {inviteCodes[h.id]}
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyCode(inviteCodes[h.id])}>
                          Kopiuj
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Kod jest ważny 24 godziny</p>
                  </div>
                </div>
              ))
            )}

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Dołącz do innego gospodarstwa</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Wpisz kod (np. AB12CD34)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono"
                />
                <Button onClick={handleJoin} disabled={joinHousehold.isPending || !joinCode.trim()}>
                  Dołącz
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
