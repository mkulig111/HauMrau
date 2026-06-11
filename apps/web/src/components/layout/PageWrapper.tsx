import React from 'react'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/toaster'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
        {children}
      </main>
      <Toaster />
    </div>
  )
}
