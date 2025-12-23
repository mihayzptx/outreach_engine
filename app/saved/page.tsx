'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Saved() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshCompany = async (companyId: number, companyName: string, industry: string) => {
    setRefreshing(companyId)
    try {
      const response = await fetch('/api/companies/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, company_name: companyName, industry })
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchCompanies()
      }
    } catch (error) {
      console.error('Error refreshing company:', error)
    } finally {
      setRefreshing(null)
    }
  }

  const deleteCompany = async (id: number) => {
    if (!confirm('Remove this company from saved list?')) return
    
    try {
      await fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
      await fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const goToGenerate = (company: any, includeSignals: boolean = false) => {
    const params = new URLSearchParams({
      company: company.company_name,
      industry: company.industry || '',
      prospectName: company.last_prospect_name || '',
      prospectTitle: company.last_prospect_title || '',
      context: includeSignals && company.new_signals 
        ? `${company.last_context || ''}\n\nRecent Updates:\n${company.new_signals.join('\n')}`
        : company.last_context || '',
      messageType: company.last_message_type || 'LinkedIn Connection',
      sources: includeSignals && company.signal_links 
        ? company.signal_links.join('\n')
        : ''
    })
    
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 z-30 h-full flex flex-col`}>
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">TS</span>
            </div>
            <div>
              <h2 className="font-bold text-white">Tech-stack.io</h2>
              <p className="text-xs text-slate-400">Outreach Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </Link>
          <Link href="/bulk" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg">
            <span className="text-xl">💾</span>
            <span>Saved Companies</span>
            {companies.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500">
                {companies.length}
              </span>
            )}
          </button>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📊</span>
            <span>History</span>
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/30">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-xs text-slate-300">💾 {companies.filter(c => c.has_new_signals).length} with signals</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-800/50 rounded-xl text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Saved Companies</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">Track companies and monitor for signals</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-medium text-sm shadow-lg transition-all"
            >
              + Add Company
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Saved Companies</p>
                    <p className="text-3xl font-bold text-white mt-2">{companies.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">💾</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">With New Signals</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {companies.filter(c => c.has_new_signals).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🔔</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Last Scanned</p>
                    <p className="text-lg font-bold text-white mt-2">
                      {companies.length > 0 && companies[0].last_scanned_at 
                        ? new Date(companies[0].last_scanned_at).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🔍</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Companies List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-white text-lg font-semibold mt-6">Loading companies...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                  <span className="text-4xl">💾</span>
                </div>
                <p className="text-white text-lg font-semibold mb-2">No saved companies yet</p>
                <p className="text-slate-400 text-sm mb-6">Generate a message and check "Save this company" to start tracking</p>
                <Link 
                  href="/"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-medium shadow-lg transition-all"
                >
                  Generate Message
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div 
                    key={company.id} 
                    className={`bg-slate-800/50 backdrop-blur rounded-2xl border-2 p-6 transition-all hover:border-slate-600/50 ${
                      company.has_new_signals 
                        ? 'border-green-500/50 ring-2 ring-green-500/20' 
                        : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-white">{company.company_name}</h3>
                          {company.has_new_signals && (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full animate-pulse">
                              🔔 New Signals
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                          <span>🏭 {company.industry}</span>
                          <span>👤 {company.last_prospect_name} - {company.last_prospect_title}</span>
                          {company.last_scanned_at && (
                            <span>🔍 Scanned {new Date(company.last_scanned_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => refreshCompany(company.id, company.company_name, company.industry)}
                          disabled={refreshing === company.id}
                          className="px-3 py-2 bg-purple-600/80 text-white rounded-xl hover:bg-purple-500 font-medium text-sm disabled:bg-slate-600 transition-all"
                        >
                          {refreshing === company.id ? '⏳' : '🔄'}
                        </button>
                        <button
                          onClick={() => deleteCompany(company.id)}
                          className="px-3 py-2 bg-red-600/80 text-white rounded-xl hover:bg-red-500 font-medium text-sm transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Signals Section */}
                    {company.has_new_signals && company.new_signals && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                          className="flex items-center gap-2 text-sm font-semibold text-green-400 mb-2 hover:text-green-300 transition-colors"
                        >
                          {expandedId === company.id ? '▼' : '▶'} View {company.new_signals.length} New Signals
                        </button>
                        
                        {expandedId === company.id && (
                          <div className="bg-slate-900/50 border border-green-600/50 rounded-xl p-4 space-y-3">
                            {company.new_signals.map((signal: string, idx: number) => (
                              <div key={idx} className="pb-3 border-b border-slate-700/50 last:border-0 last:pb-0">
                                <p className="text-white text-sm mb-2">{signal}</p>
                                {company.signal_links && company.signal_links[idx] && (
                                  <a 
                                    href={company.signal_links[idx]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-xs underline break-all"
                                  >
                                    {company.signal_links[idx]}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {company.has_new_signals ? (
                        <button
                          onClick={() => goToGenerate(company, true)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-400 font-semibold shadow-lg transition-all"
                        >
                          ✨ Generate with New Signals
                        </button>
                      ) : (
                        <button
                          onClick={() => goToGenerate(company, false)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 font-semibold shadow-lg transition-all"
                        >
                          ✉️ Message This Company
                        </button>
                      )}
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
