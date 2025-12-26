'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import type { Message } from '@/lib/types'

interface GroupedHistory {
  [company: string]: Message[]
}

export default function HistoryPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [grouped, setGrouped] = useState<GroupedHistory>({})
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null)

  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(d => {
      const msgs = d.messages || []
      setMessages(msgs)
      const groups: GroupedHistory = {}
      msgs.forEach((m: Message) => {
        const key = m.company || 'Unknown'
        if (!groups[key]) groups[key] = []
        groups[key].push(m)
      })
      setGrouped(groups)
    }).catch(() => {})
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) }).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const filteredCompanies = Object.keys(grouped).filter(company =>
    company.toLowerCase().includes(search.toLowerCase()) ||
    grouped[company].some(m => 
      m.prospect_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.generated_message?.toLowerCase().includes(search.toLowerCase())
    )
  ).sort((a, b) => {
    const aDate = new Date(grouped[a][0]?.created_at || 0)
    const bDate = new Date(grouped[b][0]?.created_at || 0)
    return bDate.getTime() - aDate.getTime()
  })

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">Message History</h1>
              <span className="text-xs text-zinc-500">{messages.length} messages</span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies, prospects, messages..."
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
            />
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <span className="text-4xl block mb-3">📭</span>
              <p>No message history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompanies.map(company => (
                <div key={company} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCompany(expandedCompany === company ? null : company)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div className="text-left">
                        <div className="text-white font-medium">{company}</div>
                        <div className="text-xs text-zinc-500">{grouped[company].length} message{grouped[company].length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">{formatDate(grouped[company][0]?.created_at)}</span>
                      <span className={`text-zinc-500 transition-transform ${expandedCompany === company ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </button>

                  {expandedCompany === company && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                      {grouped[company].map(msg => (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedMessage(msg)}
                          className="px-4 py-3 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">{msg.prospect_name}</span>
                              <span className="text-zinc-500 text-xs">{msg.prospect_title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isManagerOrAdmin && msg.user_name && (
                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{msg.user_name}</span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                (msg.quality_score || 0) >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                (msg.quality_score || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>{msg.quality_score || 0}</span>
                            </div>
                          </div>
                          <p className="text-zinc-400 text-sm line-clamp-2">{msg.generated_message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">{msg.message_type}</span>
                            <span className="text-[10px] text-zinc-600">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900">
              <div>
                <h3 className="text-white font-semibold">{selectedMessage.prospect_name}</h3>
                <p className="text-zinc-500 text-sm">{selectedMessage.prospect_title} at {selectedMessage.company}</p>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{selectedMessage.message_type}</span>
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{selectedMessage.industry}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  (selectedMessage.quality_score || 0) >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                  (selectedMessage.quality_score || 0) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>Score: {selectedMessage.quality_score || 0}</span>
                {isManagerOrAdmin && selectedMessage.user_name && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">By: {selectedMessage.user_name}</span>
                )}
              </div>
              <div className="bg-zinc-950 rounded-lg p-4 mb-4">
                <p className="text-white whitespace-pre-wrap">{selectedMessage.generated_message}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{formatDate(selectedMessage.created_at)}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(selectedMessage.generated_message)}
                  className="px-3 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
                >
                  Copy Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
