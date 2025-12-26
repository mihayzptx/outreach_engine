'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_CONFIG } from '@/lib/constants'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  counts?: {
    campaigns?: number
    saved?: number
  }
  user?: {
    name: string
    email: string
    role: string
  } | null
  onLogout?: () => void
}

const NAV_ITEMS = [
  { href: '/', icon: '✨', label: 'Generate' },
  { href: '/bulk', icon: '📦', label: 'Bulk' },
  { href: '/campaigns', icon: '🎯', label: 'Campaigns', countKey: 'campaigns' },
  { href: '/prospect', icon: '🔍', label: 'Prospect' },
  { href: '/saved', icon: '💾', label: 'Saved', countKey: 'saved' },
  { href: '/history', icon: '📊', label: 'History' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose, counts = {}, user, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-56 bg-zinc-900 border-r border-zinc-800 z-30 h-full flex flex-col transition-transform`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 font-black text-sm">{APP_CONFIG.companyInitials}</span>
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">{APP_CONFIG.companyName}</h2>
              <p className="text-[10px] text-zinc-500">{APP_CONFIG.appName}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            const count = item.countKey ? counts[item.countKey as keyof typeof counts] : undefined
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active 
                    ? 'bg-yellow-400/10 text-yellow-400 font-medium border border-yellow-400/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
                {count !== undefined && count > 0 && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                    active ? 'bg-yellow-400/20' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* User section */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {user?.role === 'admin' && (
            <Link 
              href="/admin" 
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors"
            >
              <span>👥</span> Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-zinc-300 truncate max-w-[80px]">{user.name}</span>
              </div>
              {onLogout && (
                <button onClick={onLogout} className="text-[10px] text-zinc-500 hover:text-white transition-colors">
                  Logout
                </button>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors"
            >
              <span>🔑</span> Login
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}