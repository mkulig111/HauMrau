import React from 'react'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/toaster'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>
        {title && (
          <h1 style={{
            fontSize: '26px',
            fontWeight: 900,
            color: '#1e1b4b',
            letterSpacing: '-0.02em',
            marginBottom: '24px',
          }}>{title}</h1>
        )}
        {children}
      </main>
      <Toaster />
    </div>
  )
}
