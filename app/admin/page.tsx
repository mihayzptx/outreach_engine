'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500',
  manager: 'bg-purple-500',
  user: 'bg-blue-500'
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'user' })
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
    fetchUsers()
  }, [])

  const checkAdmin = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    if (!data.user || data.user.role !== 'admin') {
      router.push('/')
      return
    }
    setCurrentUser(data.user)
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      
      if (data.success) {
        setShowAddModal(false)
        setNewUser({ email: '', password: '', name: '', role: 'user' })
        fetchUsers()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to create user')
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole })
    })
    fetchUsers()
  }

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, is_active: !isActive })
    })
    fetchUsers()
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return
    
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    fetchUsers()
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-700 text-white rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white">← Back</Link>
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-slate-400 text-sm">Manage users and roles</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500">
            + Add User
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Admins</p>
            <p className="text-2xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Managers</p>
            <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'manager').length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Users</p>
            <p className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">User</th>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Role</th>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Status</th>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Created</th>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Last Login</th>
                <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id}
                      className={`px-2 py-1 rounded-lg text-white text-sm ${ROLE_COLORS[user.role]} disabled:opacity-50`}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      disabled={user.id === currentUser?.id}
                      className={`px-3 py-1 rounded-lg text-sm ${user.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'} disabled:opacity-50`}
                    >
                      {user.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 bg-red-900/50 text-red-400 rounded-lg text-sm hover:bg-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RBAC Info */}
        <div className="mt-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Role Permissions</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
              <h4 className="text-red-400 font-medium mb-2">Admin</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Full access to all features</li>
                <li>• Manage all users</li>
                <li>• View all companies & messages</li>
                <li>• Edit system settings</li>
              </ul>
            </div>
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4">
              <h4 className="text-purple-400 font-medium mb-2">Manager</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Full access to own data</li>
                <li>• View team data</li>
                <li>• Generate messages</li>
                <li>• Cannot manage users</li>
              </ul>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
              <h4 className="text-blue-400 font-medium mb-2">User</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Access to own data only</li>
                <li>• Generate messages</li>
                <li>• Save companies</li>
                <li>• View own history</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
