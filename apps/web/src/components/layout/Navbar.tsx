import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Settings, LogOut, User, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

function PawsLogo() {
  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cat paw - left */}
      <ellipse cx="7" cy="14" rx="4.5" ry="5.5" fill="currentColor" opacity="0.9"/>
      <ellipse cx="3" cy="9" rx="1.8" ry="2.2" fill="currentColor" opacity="0.9"/>
      <ellipse cx="7" cy="7.5" rx="1.8" ry="2.2" fill="currentColor" opacity="0.9"/>
      <ellipse cx="11" cy="9" rx="1.8" ry="2.2" fill="currentColor" opacity="0.9"/>
      {/* Dog paw - right */}
      <ellipse cx="27" cy="14" rx="5" ry="6" fill="currentColor" opacity="0.7"/>
      <ellipse cx="22" cy="9" rx="2" ry="2.5" fill="currentColor" opacity="0.7"/>
      <ellipse cx="27" cy="7" rx="2" ry="2.5" fill="currentColor" opacity="0.7"/>
      <ellipse cx="32" cy="9" rx="2" ry="2.5" fill="currentColor" opacity="0.7"/>
      <ellipse cx="35" cy="13" rx="1.6" ry="2" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}

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
          <PawsLogo />
          HauMrau
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/pets/new" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Dodaj zwierzę
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
