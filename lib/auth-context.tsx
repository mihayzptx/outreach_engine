'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Registration failed' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    const permissions: Record<string, string[]> = {
      'companies:view_own': ['user', 'manager', 'admin'],
      'companies:view_all': ['manager', 'admin'],
      'companies:create': ['user', 'manager', 'admin'],
      'companies:edit_own': ['user', 'manager', 'admin'],
      'companies:edit_all': ['admin'],
      'companies:delete_own': ['user', 'manager', 'admin'],
      'companies:delete_all': ['admin'],
      'messages:generate': ['user', 'manager', 'admin'],
      'messages:view_own': ['user', 'manager', 'admin'],
      'messages:view_all': ['manager', 'admin'],
      'users:view': ['admin'],
      'users:create': ['admin'],
      'users:edit': ['admin'],
      'users:delete': ['admin'],
      'settings:view': ['user', 'manager', 'admin'],
      'settings:edit': ['admin'],
      'admin:access': ['admin']
    }
    
    return permissions[permission]?.includes(user.role) || false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isManager, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
