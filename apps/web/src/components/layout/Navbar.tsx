import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

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
        🐾 HauMrau
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link to="/" style={{
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid transparent',
          background: 'transparent',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          Dashboard
        </Link>

        <Link to="/pets/new" style={{
          padding: '7px 16px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg,#a855f7,#6366f1)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 3px 10px rgba(168,85,247,.3)',
        }}>
          <Plus size={14} /> Dodaj zwierzę
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
            <div style={{
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
            }}>
              {initials}
            </div>
            <button onClick={handleLogout} title="Wyloguj" style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
            }}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
