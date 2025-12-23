'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Predefined label colors
const LABEL_COLORS: Record<string, string> = {
  'Hot Lead': 'bg-red-500',
  'Warm': 'bg-orange-500',
  'Nurture': 'bg-yellow-500',
  'Strategic': 'bg-purple-500',
  'Partner': 'bg-blue-500',
  'Enterprise': 'bg-indigo-500',
  'SMB': 'bg-green-500',
  'Expansion': 'bg-pink-500',
  'At Risk': 'bg-rose-600',
  'New': 'bg-cyan-500'
}

const PREDEFINED_LABELS = Object.keys(LABEL_COLORS)

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 
  'Australia', 'Netherlands', 'Ireland', 'Singapore', 'UAE', 'Other'
]

const SORT_OPTIONS = [
  { value: 'signals_desc', label: 'New Signals First' },
  { value: 'name_asc', label: 'Company A-Z' },
  { value: 'name_desc', label: 'Company Z-A' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'last_signal', label: 'Last Signal Date' }
]

interface Company {
  id: number
  company_name: string
  industry: string
  country?: string
  labels?: string[]
  notes?: string
  website?: string
  employee_count?: string
  revenue_range?: string
  last_prospect_name: string
  last_prospect_title: string
  last_context: string
  last_message_type: string
  has_new_signals: boolean
  new_signals?: string[]
  signal_links?: string[]
  last_scanned_at?: string
  last_signal_date?: string
  signal_count?: number
  created_at: string
  updated_at: string
}

export default function Saved() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const router = useRouter()

  // Filters
  const [filterCountry, setFilterCountry] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterLabel, setFilterLabel] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortBy, setSortBy] = useState('signals_desc')
  const [searchQuery, setSearchQuery] = useState('')

  // Label management
  const [showLabelPicker, setShowLabelPicker] = useState<number | null>(null)
  const [customLabel, setCustomLabel] = useState('')

  // Edit form
  const [editForm, setEditForm] = useState({
    country: '',
    notes: '',
    website: '',
    employee_count: '',
    revenue_range: ''
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [companies, filterCountry, filterIndustry, filterLabel, filterDateFrom, filterDateTo, sortBy, searchQuery])

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

  const applyFilters = () => {
    let result = [...companies]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.company_name.toLowerCase().includes(query) ||
        c.last_prospect_name?.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query)
      )
    }

    if (filterCountry) {
      result = result.filter(c => c.country === filterCountry)
    }

    if (filterIndustry) {
      result = result.filter(c => c.industry === filterIndustry)
    }

    if (filterLabel) {
      result = result.filter(c => c.labels?.includes(filterLabel))
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      result = result.filter(c => {
        const signalDate = c.last_signal_date ? new Date(c.last_signal_date) : null
        return signalDate && signalDate >= fromDate
      })
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59)
      result = result.filter(c => {
        const signalDate = c.last_signal_date ? new Date(c.last_signal_date) : null
        return signalDate && signalDate <= toDate
      })
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'signals_desc':
          if (a.has_new_signals && !b.has_new_signals) return -1
          if (!a.has_new_signals && b.has_new_signals) return 1
          return (b.signal_count || 0) - (a.signal_count || 0)
        case 'name_asc':
          return a.company_name.localeCompare(b.company_name)
        case 'name_desc':
          return b.company_name.localeCompare(a.company_name)
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'last_signal':
          const dateA = a.last_signal_date ? new Date(a.last_signal_date).getTime() : 0
          const dateB = b.last_signal_date ? new Date(b.last_signal_date).getTime() : 0
          return dateB - dateA
        default:
          return 0
      }
    })

    setFilteredCompanies(result)
  }

  const clearFilters = () => {
    setFilterCountry('')
    setFilterIndustry('')
    setFilterLabel('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchQuery('')
    setSortBy('signals_desc')
  }

  const activeFilterCount = [filterCountry, filterIndustry, filterLabel, filterDateFrom, filterDateTo].filter(Boolean).length

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
        // Update selected company if it's the one being refreshed
        if (selectedCompany?.id === companyId) {
          const updated = companies.find(c => c.id === companyId)
          if (updated) setSelectedCompany({...updated, new_signals: data.signals, signal_links: data.links, has_new_signals: data.hasNewSignals})
        }
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
      setSelectedCompany(null)
      await fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const updateCompany = async (id: number, updates: Partial<Company>) => {
    try {
      await fetch('/api/companies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      await fetchCompanies()
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const addLabel = async (companyId: number, label: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return
    
    const currentLabels = company.labels || []
    if (currentLabels.includes(label)) return
    
    await updateCompany(companyId, { labels: [...currentLabels, label] } as any)
    setShowLabelPicker(null)
    setCustomLabel('')
  }

  const removeLabel = async (companyId: number, label: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return
    
    const currentLabels = company.labels || []
    await updateCompany(companyId, { labels: currentLabels.filter(l => l !== label) } as any)
  }

  const saveNotes = async (id: number, notes: string) => {
    await updateCompany(id, { notes } as any)
  }

  const goToGenerate = (company: Company, includeSignals: boolean = false) => {
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

  const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))]
  const uniqueCountries = [...new Set(companies.map(c => c.country).filter(Boolean))]
  const allLabels = [...new Set(companies.flatMap(c => c.labels || []))]

  const getLabelColor = (label: string) => {
    return LABEL_COLORS[label] || 'bg-slate-500'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
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

      {/* Company Profile Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className={`p-6 border-b border-slate-700 ${selectedCompany.has_new_signals ? 'bg-green-900/20' : 'bg-slate-800'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedCompany.company_name}</h2>
                    {selectedCompany.has_new_signals && (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                        🔔 {selectedCompany.signal_count || selectedCompany.new_signals?.length || 0} Signals
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                    {selectedCompany.industry && <span>🏭 {selectedCompany.industry}</span>}
                    {selectedCompany.country && <span>🌍 {selectedCompany.country}</span>}
                    {selectedCompany.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        🔗 Website
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Labels */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {(selectedCompany.labels || []).map(label => (
                  <span 
                    key={label} 
                    className={`inline-flex items-center gap-1 px-2 py-0.5 ${getLabelColor(label)} text-white text-xs rounded-full`}
                  >
                    {label}
                    <button 
                      onClick={() => removeLabel(selectedCompany.id, label)}
                      className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setShowLabelPicker(showLabelPicker === selectedCompany.id ? null : selectedCompany.id)}
                  className="px-2 py-0.5 border border-dashed border-slate-600 text-slate-400 text-xs rounded-full hover:border-slate-500"
                >
                  + Label
                </button>
              </div>

              {showLabelPicker === selectedCompany.id && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-xl">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PREDEFINED_LABELS.filter(l => !(selectedCompany.labels || []).includes(l)).map(label => (
                      <button
                        key={label}
                        onClick={() => addLabel(selectedCompany.id, label)}
                        className={`px-2 py-1 ${getLabelColor(label)} text-white text-xs rounded-full hover:opacity-80`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Custom label..."
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && customLabel.trim()) {
                          addLabel(selectedCompany.id, customLabel.trim())
                        }
                      }}
                    />
                    <button
                      onClick={() => customLabel.trim() && addLabel(selectedCompany.id, customLabel.trim())}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Key Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">📅 Date Added</p>
                  <p className="text-white font-medium">{formatDate(selectedCompany.created_at)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">🔍 Last Signal Date</p>
                  <p className="text-white font-medium">{formatDate(selectedCompany.last_signal_date || selectedCompany.last_scanned_at || '')}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">👤 Primary Contact</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedCompany.last_prospect_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedCompany.last_prospect_name}</p>
                    <p className="text-sm text-slate-400">{selectedCompany.last_prospect_title}</p>
                  </div>
                </div>
              </div>

              {/* Research Context */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">📋 Research Context</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedCompany.last_context || 'No context saved'}
                </p>
              </div>

              {/* Signals with Links */}
              {selectedCompany.new_signals && selectedCompany.new_signals.length > 0 && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">🔔 Recent Signals</h4>
                  <div className="space-y-4">
                    {selectedCompany.new_signals.map((signal, idx) => (
                      <div key={idx} className="border-b border-green-700/30 last:border-0 pb-3 last:pb-0">
                        <p className="text-white text-sm mb-2">{signal}</p>
                        {selectedCompany.signal_links && selectedCompany.signal_links[idx] && (
                          <a 
                            href={selectedCompany.signal_links[idx]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs bg-blue-900/20 px-3 py-1.5 rounded-lg"
                          >
                            🔗 {new URL(selectedCompany.signal_links[idx]).hostname}
                            <span className="text-slate-500">↗</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Details */}
              {(selectedCompany.employee_count || selectedCompany.revenue_range) && (
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">🏢 Company Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCompany.employee_count && (
                      <div>
                        <p className="text-xs text-slate-400">Employees</p>
                        <p className="text-white">{selectedCompany.employee_count}</p>
                      </div>
                    )}
                    {selectedCompany.revenue_range && (
                      <div>
                        <p className="text-xs text-slate-400">Revenue</p>
                        <p className="text-white">{selectedCompany.revenue_range}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">📝 Notes</h4>
                <textarea
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm h-24 resize-none"
                  placeholder="Add notes about this company..."
                  defaultValue={selectedCompany.notes || ''}
                  onBlur={(e) => saveNotes(selectedCompany.id, e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-3">
              <button
                onClick={() => refreshCompany(selectedCompany.id, selectedCompany.company_name, selectedCompany.industry)}
                disabled={refreshing === selectedCompany.id}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 font-medium text-sm disabled:opacity-50 transition-all"
              >
                {refreshing === selectedCompany.id ? '⏳ Scanning...' : '🔄 Refresh Signals'}
              </button>
              <button
                onClick={() => {
                  setSelectedCompany(null)
                  goToGenerate(selectedCompany, selectedCompany.has_new_signals)
                }}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium text-sm shadow-lg transition-all ${
                  selectedCompany.has_new_signals 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                }`}
              >
                {selectedCompany.has_new_signals ? '✨ Generate with Signals' : '✉️ Generate Message'}
              </button>
              <button
                onClick={() => {
                  setSelectedCompany(null)
                  goToGenerate({...selectedCompany, last_message_type: 'ABM'}, selectedCompany.has_new_signals)
                }}
                className="px-4 py-2.5 bg-purple-600/80 text-white rounded-xl hover:bg-purple-500 font-medium text-sm transition-all"
              >
                💜 ABM
              </button>
              <button
                onClick={() => deleteCompany(selectedCompany.id)}
                className="px-4 py-2.5 bg-red-600/80 text-white rounded-xl hover:bg-red-500 font-medium text-sm transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/30">
            <span className="text-xs text-slate-300">🔔 {companies.filter(c => c.has_new_signals).length} with signals</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
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
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">
                  {filteredCompanies.length} of {companies.length} companies
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                🔍 Filters
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{activeFilterCount}</span>
                )}
              </button>
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-medium text-sm shadow-lg transition-all"
              >
                + Add
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search companies, contacts..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters Panel */}
          {filtersOpen && (
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <select
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                >
                  <option value="">All Countries</option>
                  {[...uniqueCountries, ...COUNTRIES.filter(c => !uniqueCountries.includes(c))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                >
                  <option value="">All Industries</option>
                  {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>

                <select
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  value={filterLabel}
                  onChange={(e) => setFilterLabel(e.target.value)}
                >
                  <option value="">All Labels</option>
                  {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <input
                  type="date"
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="From"
                />

                <input
                  type="date"
                  className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="To"
                />
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sort:</span>
                  <select
                    className="px-3 py-1.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={clearFilters} className="text-sm text-slate-400 hover:text-white">
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Cards Grid */}
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-white text-lg font-semibold mt-6">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                <span className="text-4xl">{searchQuery || activeFilterCount > 0 ? '🔍' : '💾'}</span>
              </div>
              <p className="text-white text-lg font-semibold mb-2">
                {searchQuery || activeFilterCount > 0 ? 'No matches' : 'No saved companies'}
              </p>
              <p className="text-slate-400 text-sm mb-6">
                {searchQuery || activeFilterCount > 0 ? 'Try different filters' : 'Save a company from the Generate page'}
              </p>
              {(searchQuery || activeFilterCount > 0) && (
                <button onClick={clearFilters} className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 font-medium">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <div 
                  key={company.id} 
                  onClick={() => setSelectedCompany(company)}
                  className={`bg-slate-800/50 backdrop-blur rounded-2xl border-2 p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
                    company.has_new_signals 
                      ? 'border-green-500/50 shadow-green-500/10' 
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white truncate">{company.company_name}</h3>
                        {company.has_new_signals && (
                          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {company.last_prospect_name} · {company.last_prospect_title}
                      </p>
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {company.industry && (
                      <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded">
                        {company.industry}
                      </span>
                    )}
                    {company.country && (
                      <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded">
                        {company.country}
                      </span>
                    )}
                  </div>

                  {/* Labels */}
                  {company.labels && company.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {company.labels.slice(0, 3).map(label => (
                        <span key={label} className={`px-2 py-0.5 ${getLabelColor(label)} text-white text-xs rounded-full`}>
                          {label}
                        </span>
                      ))}
                      {company.labels.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-600 text-white text-xs rounded-full">
                          +{company.labels.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Signals Preview */}
                  {company.has_new_signals && company.new_signals && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2 mb-3">
                      <p className="text-xs text-green-400 font-medium mb-1">
                        🔔 {company.new_signals.length} new signal{company.new_signals.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {company.new_signals[0]}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    <span>Added {formatDate(company.created_at)}</span>
                    {company.last_signal_date && (
                      <span>Signal {formatDate(company.last_signal_date)}</span>
                    )}
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