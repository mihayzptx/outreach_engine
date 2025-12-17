'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function History() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(msg => 
    msg.prospect_name.toLowerCase().includes(filter.toLowerCase()) ||
    msg.company.toLowerCase().includes(filter.toLowerCase()) ||
    msg.message_type.toLowerCase().includes(filter.toLowerCase())
  )

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 bg-slate-800 border-r border-slate-700 transition-transform duration-300 z-30 h-full flex flex-col`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">TS</span>
            </div>
            <div>
              <h2 className="font-bold text-white">Tech-stack.io</h2>
              <p className="text-xs text-slate-400">Outreach Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
          >
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </Link>
          <Link 
            href="/bulk" 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
          >
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            <span className="text-xl">📊</span>
            <span>History</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Top Bar */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Message History</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">View all generated messages</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + New Message
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Search Filter */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-4 mb-6">
              <input
                type="text"
                placeholder="Search by name, company, or message type..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Messages</p>
                    <p className="text-3xl font-bold text-white mt-2">{messages.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Companies Contacted</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {new Set(messages.map(m => m.company)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">This Week</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {messages.filter(m => {
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return new Date(m.created_at) > weekAgo
                      }).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-white text-lg font-semibold mt-6">Loading history...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-white text-lg font-semibold mb-2">
                  {filter ? 'No messages match your search' : 'No messages yet'}
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  {filter ? 'Try a different search term' : 'Generate your first message to see it here'}
                </p>
                {!filter && (
                  <Link 
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Generate Message
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{msg.prospect_name}</h3>
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                            {msg.message_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                          <span>📧 {msg.prospect_title}</span>
                          <span>🏢 {msg.company}</span>
                          <span>🏭 {msg.industry}</span>
                          <span>🕒 {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyMessage(msg.generated_message)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-medium text-sm flex items-center gap-2"
                      >
                        📋 Copy
                      </button>
                    </div>

                    {msg.context && (
                      <div className="mb-4 pb-4 border-b border-slate-700">
                        <p className="text-xs font-semibold text-slate-400 mb-2">Context:</p>
                        <p className="text-sm text-slate-300">{msg.context}</p>
                      </div>
                    )}

                    <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-400 mb-2">Generated Message:</p>
                      <p className="text-white leading-relaxed whitespace-pre-wrap text-base">
                        {msg.generated_message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}