'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Message {
  id: number
  company: string
  prospect_name: string
  prospect_title: string
  message_type: string
  message: string
  quality_score: number
  created_at: string
  user_name?: string
}

export default function HistoryPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [filtered, setFiltered] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<Message | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchHistory() }, [])
  useEffect(() => { applyFilters() }, [messages, search, typeFilter])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch { }
    finally { setLoading(false) }
  }

  const applyFilters = () => {
    let result = [...messages]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m => m.company?.toLowerCase().includes(q) || m.prospect_name?.toLowerCase().includes(q))
    }
    if (typeFilter) result = result.filter(m => m.message_type === typeFilter)
    setFiltered(result)
  }

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const messageTypes = [...new Set(messages.map(m => m.message_type).filter(Boolean))]

  return (
    <div className="flex h-screen bg-zinc-950">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{selected.company}</h3>
                <p className="text-zinc-500 text-sm">{selected.prospect_name} · {selected.message_type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <p className="text-white whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-500 text-sm">{formatDate(selected.created_at)}</span>
              <button onClick={() => copyMessage(selected.message)} className={`px-4 py-2 rounded-lg text-sm font-medium ${copied ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-zinc-900 hover:bg-yellow-300'}`}>
                {copied ? '✓ Copied' : 'Copy Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-56 bg-zinc-900 border-r border-zinc-800 z-30 h-full flex flex-col transition-transform`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center"><span className="text-zinc-900 font-black text-sm">TS</span></div>
            <div><h2 className="font-bold text-white text-sm">Tech-stack.io</h2><p className="text-[10px] text-zinc-500">Outreach Engine</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">✨ Generate</Link>
          <Link href="/bulk" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">📦 Bulk</Link>
          <Link href="/saved" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">💾 Saved</Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">📊 History</button>
          <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">⚙️ Settings</Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">Message History</h1>
              <span className="text-xs text-zinc-500">{filtered.length} messages</span>
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
              <option value="">All Types</option>
              {messageTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input type="text" placeholder="Search company or prospect..." value={search} onChange={e => setSearch(e.target.value)} className="mt-3 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400" />
        </header>

        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">📊</span>
              <p className="text-white font-medium">No messages yet</p>
              <p className="text-zinc-500 text-sm mt-1">Generate some messages to see history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(msg => (
                <div key={msg.id} onClick={() => setSelected(msg)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{msg.company}</span>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">{msg.message_type}</span>
                      </div>
                      <p className="text-zinc-500 text-sm">{msg.prospect_name} {msg.prospect_title && `· ${msg.prospect_title}`}</p>
                      <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{msg.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold ${msg.quality_score >= 80 ? 'text-emerald-400' : msg.quality_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {msg.quality_score || '--'}
                      </div>
                      <p className="text-zinc-600 text-xs">{formatDate(msg.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
