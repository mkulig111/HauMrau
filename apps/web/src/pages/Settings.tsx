import { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { useHouseholds, useGenerateInvite, useJoinHousehold, useLeaveHousehold } from '@/hooks/useHousehold'
import { authApi } from '@/lib/api'

export function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [inviteCodes, setInviteCodes] = useState<Record<string, { code: string; expiresAt: string }>>({})

  const { data: households, isLoading: householdsLoading } = useHouseholds()
  const generateInvite = useGenerateInvite()
  const joinHousehold = useJoinHousehold()
  const leaveHousehold = useLeaveHousehold()

  const handleSaveAccount = async () => {
    if (newPassword && !currentPassword) {
      toast({ title: 'Podaj aktualne hasło, aby ustawić nowe', variant: 'destructive' })
      return
    }
    setSavingAccount(true)
    try {
      const updated = await authApi.updateMe({
        name: name.trim() || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setCurrentPassword('')
      setNewPassword('')
      toast({ title: 'Zmiany zapisane' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nie udało się zapisać zmian'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleGenerateInvite = async (householdId: string) => {
    try {
      const result = await generateInvite.mutateAsync(householdId)
      setInviteCodes((prev) => ({ ...prev, [householdId]: result }))
    } catch {
      toast({ title: 'Nie udało się wygenerować kodu zaproszenia', variant: 'destructive' })
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    try {
      await joinHousehold.mutateAsync(joinCode.trim().toUpperCase())
      setJoinCode('')
      toast({ title: 'Dołączono do gospodarstwa domowego' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nie udało się dołączyć'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const handleLeave = async (householdId: string) => {
    try {
      await leaveHousehold.mutateAsync(householdId)
      toast({ title: 'Opuszczono gospodarstwo domowe' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nie udało się opuścić'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Skopiowano do schowka' })
    })
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
              <Input type="email" value={email} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Aktualne hasło</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Wymagane tylko przy zmianie hasła"
              />
            </div>
            <div className="space-y-1">
              <Label>Nowe hasło</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Pozostaw puste, aby nie zmieniać"
              />
            </div>
            <Button onClick={handleSaveAccount} disabled={savingAccount}>
              Zapisz zmiany
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gospodarstwo domowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {householdsLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
            {households && households.length === 0 && (
              <p className="text-sm text-muted-foreground">Nie należysz do żadnego gospodarstwa domowego.</p>
            )}
            {households && households.map((household) => (
              <div key={household.id} className="space-y-3 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{household.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${household.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {household.role === 'OWNER' ? 'Właściciel' : 'Członek'}
                    </span>
                  </div>
                  {household.role === 'MEMBER' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeave(household.id)}
                      disabled={leaveHousehold.isPending}
                    >
                      Opuść
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Członkowie</p>
                  {household.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{member.user.name}</span>
                        <span className="text-muted-foreground ml-2">{member.user.email}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {member.role === 'OWNER' ? 'Właściciel' : 'Członek'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateInvite(household.id)}
                    disabled={generateInvite.isPending}
                  >
                    Generuj kod zaproszenia
                  </Button>
                  {inviteCodes[household.id] && (
                    <div className="bg-muted rounded p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-bold tracking-widest">
                          {inviteCodes[household.id].code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(inviteCodes[household.id].code)}
                        >
                          Kopiuj
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Wygasa: {new Date(inviteCodes[household.id].expiresAt).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Dołącz do gospodarstwa domowego</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Wpisz kod zaproszenia"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="font-mono uppercase"
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
