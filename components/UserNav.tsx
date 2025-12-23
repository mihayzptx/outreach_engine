'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500',
  manager: 'bg-purple-500',
  user: 'bg-blue-500'
}

export default function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 w-full p-3 hover:bg-slate-800/50 rounded-xl transition-all"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white font-medium truncate">{user.name}</p>
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 text-[10px] ${ROLE_COLORS[user.role]} text-white rounded`}>
              {user.role.toUpperCase()}
            </span>
          </div>
        </div>
        <span className="text-slate-400">▾</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20">
            <div className="p-3 border-b border-slate-700">
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
            {user.role === 'admin' && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700/50 text-sm"
                onClick={() => setShowMenu(false)}
              >
                👤 User Management
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-slate-700/50 text-sm text-left"
            >
              🚪 Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
