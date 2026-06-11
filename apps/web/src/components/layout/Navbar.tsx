import { Link, useNavigate } from 'react-router-dom'
import { PawPrint, LayoutDashboard, Settings, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <PawPrint className="h-6 w-6" />
          PetCare
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Ustawienia
            </Link>
          </Button>
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                {user.name}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Wyloguj">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
