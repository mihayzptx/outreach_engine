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
  admin: 'bg-red-500', manager: 'bg-purple-500', user: 'bg-blue-500'
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'user' })
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => { checkAdmin(); fetchUsers() }, [])

  const checkAdmin = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    if (!data.user || data.user.role !== 'admin') { router.push('/'); return }
    setCurrentUser(data.user)
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch { }
    finally { setLoading(false) }
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
      } else setError(data.error)
    } catch { setError('Failed to create user') }
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase block mb-1">Name</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" required />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase block mb-1">Email</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" required />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase block mb-1">Password</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" required minLength={6} />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase block mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Back</Link>
            <h1 className="text-lg font-semibold text-white">User Management</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-yellow-300">
            + Add User
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: users.length, color: 'text-white' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-red-400' },
            { label: 'Managers', value: users.filter(u => u.role === 'manager').length, color: 'text-purple-400' },
            { label: 'Users', value: users.filter(u => u.role === 'user').length, color: 'text-blue-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">User</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">Role</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">Status</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">Created</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">Last Login</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-950/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-zinc-900 font-bold text-sm">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id}
                      className={`px-2 py-1 rounded text-xs text-white ${ROLE_COLORS[user.role]} disabled:opacity-50`}
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
                      className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} disabled:opacity-50`}
                    >
                      {user.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-sm">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-sm">{formatDate(user.last_login)}</td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser?.id && (
                      <button onClick={() => handleDeleteUser(user.id)} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permissions Info */}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Role Permissions</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 font-medium text-sm mb-2">Admin</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Full access</li>
                <li>• Manage users</li>
                <li>• Edit settings</li>
              </ul>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-purple-400 font-medium text-sm mb-2">Manager</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Own data access</li>
                <li>• View team data</li>
                <li>• Generate messages</li>
              </ul>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium text-sm mb-2">User</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• Own data only</li>
                <li>• Generate messages</li>
                <li>• Save companies</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
