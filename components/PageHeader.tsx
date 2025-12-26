'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
  onMenuClick?: () => void
}

export default function PageHeader({ title, subtitle, actions, children, onMenuClick }: PageHeaderProps) {
  return (
    <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button 
              onClick={onMenuClick} 
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            >
              ☰
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  )
}
