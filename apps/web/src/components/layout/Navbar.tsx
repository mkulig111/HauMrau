import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="60" r="26" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="123 41" transform="rotate(45 40 60)"/>
      <polygon points="58,60 58,30 62,12 66,26 70,10 74,30 74,60" fill="currentColor"/>
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

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      height: '58px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between',
    }}>
      <Link to="/" style={{
        fontWeight: 900,
        fontSize: '20px',
        background: 'linear-gradient(135deg,#a855f7,#6366f1)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}>
        <Logo />
        HauMrau
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link to="/" title="Dashboard" style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg,#a855f7,#6366f1)',
          color: '#fff',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(168,85,247,.3)',
          flexShrink: 0,
        }}>
          <Home size={16} />
        </Link>

        <Link to="/pets/new" title="Dodaj zwierzę" style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg,#a855f7,#6366f1)',
          color: '#fff',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(168,85,247,.3)',
          flexShrink: 0,
        }}>
          <Plus size={18} />
        </Link>

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '12px',
            borderLeft: '1px solid #e0e7ff',
            marginLeft: '6px',
          }}>
            <Link to="/settings" title="Ustawienia" style={{
              width: '32px',
              height: '32px',
              borderRadius: '99px',
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              {initials}
            </Link>
            <button onClick={handleLogout} title="Wyloguj" style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
            }}>
              <LogOut size={16} style={{ pointerEvents: 'none' }} />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
