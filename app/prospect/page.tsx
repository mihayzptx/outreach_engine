'use client'

import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/sidebar'

interface ProspectCompany {
  name: string
  website?: string
  industry?: string
  description?: string
  size?: string
  location?: string
  signals?: string[]
  source: string
  sourceUrl: string
  icpFit?: 'high' | 'medium' | 'low'
  confidence: 'high' | 'medium' | 'low'
  selected?: boolean
}

interface ProspectContact {
  name: string
  title: string
  company: string
  linkedin?: string
  email?: string
  source: string
  selected?: boolean
}

const INDUSTRIES = ['SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'AI/ML', 'Cybersecurity', 'Developer Tools', 'Data/Analytics', 'EdTech', 'MarTech']
const FUNDING_STAGES = ['Seed', 'Series A', 'Series B', 'Series C+', 'Any']
const COMPANY_SIZES = ['1-50', '51-200', '201-500', '501-1000', 'Any']
const LOCATIONS = ['United States', 'San Francisco', 'New York', 'Austin', 'Europe', 'UK', 'Any']

const SEARCH_TEMPLATES = [
  { label: 'Recently Funded', query: 'startups raised funding 2025 series', filters: { funding: 'Series A B' } },
  { label: 'Hiring DevOps', query: 'companies hiring devops engineers platform sre', filters: { hiring: true } },
  { label: 'Fast Growing', query: 'fastest growing startups tech companies 2025', filters: {} },
  { label: 'Cloud Migration', query: 'companies cloud migration aws azure digital transformation', filters: {} },
  { label: 'Post-Acquisition', query: 'tech company acquisition merger integration 2025', filters: {} }
]

export default function ProspectPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'search' | 'import'>('search')
  const [tab, setTab] = useState<'companies' | 'contacts'>('companies')
  
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ industry: '', funding: '', size: '', location: '', hiring: false })
  const [searching, setSearching] = useState(false)
  
  const [companies, setCompanies] = useState<ProspectCompany[]>([])
  const [contacts, setContacts] = useState<ProspectContact[]>([])
  const [searchedQuery, setSearchedQuery] = useState('')
  
  const [importData, setImportData] = useState('')
  const [importing, setImporting] = useState(false)
  
  const [adding, setAdding] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [icpSettings, setIcpSettings] = useState<any>(null)
  const [sortByICP, setSortByICP] = useState(false)
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) }).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load ICP settings
    try {
      const stored = localStorage.getItem('llm-settings')
      if (stored) {
        const settings = JSON.parse(stored)
        if (settings.icp) setIcpSettings(settings.icp)
      }
    } catch {}
  }, [])

  const calculateICPScore = (company: ProspectCompany): number => {
    if (!icpSettings) return 0
    
    let score = 0
    let maxScore = 0
    
    // Industry match
    const industryMax = Math.max(...(icpSettings.industries?.filter((i: any) => i.enabled).map((i: any) => i.weight) || [0]), 0)
    maxScore += industryMax
    const companyIndustry = (company.industry || '').toLowerCase()
    for (const ind of (icpSettings.industries || []).filter((i: any) => i.enabled)) {
      if (companyIndustry.includes(ind.name.toLowerCase())) {
        score += ind.weight
        break
      }
    }
    
    // Size match
    const sizeMax = Math.max(...(icpSettings.companySizes?.filter((s: any) => s.enabled).map((s: any) => s.weight) || [0]), 0)
    maxScore += sizeMax
    const sizeStr = company.size || ''
    const sizeMatch = sizeStr.match(/(\d+)/g)
    if (sizeMatch) {
      const empCount = parseInt(sizeMatch[0])
      for (const size of (icpSettings.companySizes || []).filter((s: any) => s.enabled)) {
        if (empCount >= size.min && empCount <= size.max) {
          score += size.weight
          break
        }
      }
    }
    
    // Geography match
    const geoMax = Math.max(...(icpSettings.geographies?.filter((g: any) => g.enabled).map((g: any) => g.weight) || [0]), 0)
    maxScore += geoMax
    const location = (company.location || '').toLowerCase()
    for (const geo of (icpSettings.geographies || []).filter((g: any) => g.enabled)) {
      if (location.includes(geo.name.toLowerCase())) {
        score += geo.weight
        break
      }
    }
    
    // Signals match
    const signalsMax = (icpSettings.buyingSignals || []).filter((s: any) => s.enabled).reduce((sum: number, s: any) => sum + s.points, 0)
    maxScore += signalsMax
    const signalText = (company.signals || []).map(s => s.toLowerCase()).join(' ')
    for (const signal of (icpSettings.buyingSignals || []).filter((s: any) => s.enabled)) {
      const words = signal.name.toLowerCase().split(' ')
      if (words.some((w: string) => signalText.includes(w))) {
        score += signal.points
      }
    }
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }

  const getICPFit = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setCompanies([])
    setContacts([])

    try {
      let companyProfile = ''
      try {
        const stored = localStorage.getItem('llm-settings')
        if (stored) companyProfile = JSON.parse(stored).companyDescription || ''
      } catch {}

      const res = await fetch('/api/prospect/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters, companyProfile })
      })
      const data = await res.json()

      if (data.success) {
        let companiesData = (data.companies || []).map((c: ProspectCompany) => ({ ...c, selected: false }))
        
        // Sort by ICP score if enabled
        if (sortByICP && icpSettings) {
          companiesData.sort((a: ProspectCompany, b: ProspectCompany) => calculateICPScore(b) - calculateICPScore(a))
        }
        
        setCompanies(companiesData)
        setContacts((data.contacts || []).map((c: ProspectContact) => ({ ...c, selected: false })))
        setSearchedQuery(data.searchQuery || query)
      }
    } catch (e) {
      console.error('Search failed:', e)
    }
    setSearching(false)
  }

  const applyTemplate = (t: typeof SEARCH_TEMPLATES[0]) => {
    setQuery(t.query)
    setFilters({ ...filters, ...t.filters })
  }

  const toggleCompany = (idx: number) => {
    const updated = [...companies]
    updated[idx].selected = !updated[idx].selected
    setCompanies(updated)
  }

  const toggleContact = (idx: number) => {
    const updated = [...contacts]
    updated[idx].selected = !updated[idx].selected
    setContacts(updated)
  }

  const selectAll = (type: 'companies' | 'contacts', value: boolean) => {
    if (type === 'companies') setCompanies(companies.map(c => ({ ...c, selected: value })))
    else setContacts(contacts.map(c => ({ ...c, selected: value })))
  }

  const addToSaved = async () => {
    const selCompanies = companies.filter(c => c.selected)
    const selContacts = contacts.filter(c => c.selected)
    if (selCompanies.length === 0 && selContacts.length === 0) return alert('Select at least one')

    setAdding(true)
    let added = 0

    for (const company of selCompanies) {
      try {
        await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: company.name,
            industry: company.industry || '',
            country: company.location || '',
            website: company.website || company.sourceUrl,
            notes: `Source: ${company.source}\nSignals: ${company.signals?.join(', ') || 'None'}\nICP Fit: ${company.icpFit || 'Unknown'}`,
            last_context: company.description || ''
          })
        })
        added++
      } catch {}
    }

    for (const contact of selContacts) {
      try {
        await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: contact.company,
            last_prospect_name: contact.name,
            last_prospect_title: contact.title,
            notes: `Contact: ${contact.name} (${contact.title})\nLinkedIn: ${contact.linkedin || 'Unknown'}`
          })
        })
        added++
      } catch {}
    }

    setAddedCount(added)
    setAdding(false)
    setCompanies(companies.map(c => ({ ...c, selected: false })))
    setContacts(contacts.map(c => ({ ...c, selected: false })))
    setTimeout(() => setAddedCount(0), 3000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setImportData(event.target?.result as string)
    reader.readAsText(file)
  }

  const parseImport = () => {
    if (!importData.trim()) return
    setImporting(true)

    const lines = importData.split('\n').filter(l => l.trim())
    if (lines.length < 2) { setImporting(false); return }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const nameIdx = headers.findIndex(h => h.includes('company') || h === 'name')
    const industryIdx = headers.findIndex(h => h.includes('industry'))
    const sizeIdx = headers.findIndex(h => h.includes('size') || h.includes('employee'))
    const locationIdx = headers.findIndex(h => h.includes('location') || h.includes('country'))
    const websiteIdx = headers.findIndex(h => h.includes('website') || h.includes('url'))
    const contactIdx = headers.findIndex(h => h.includes('contact') || h.includes('person'))
    const titleIdx = headers.findIndex(h => h.includes('title'))

    const parsedCompanies: ProspectCompany[] = []
    const parsedContacts: ProspectContact[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const companyName = values[nameIdx]
      if (!companyName) continue

      parsedCompanies.push({
        name: companyName, industry: values[industryIdx] || '', size: values[sizeIdx] || '',
        location: values[locationIdx] || '', website: values[websiteIdx] || '',
        source: 'CSV Import', sourceUrl: '', confidence: 'medium', selected: false
      })

      if (values[contactIdx]) {
        parsedContacts.push({
          name: values[contactIdx], title: values[titleIdx] || '',
          company: companyName, source: 'CSV Import', selected: false
        })
      }
    }

    setCompanies(parsedCompanies)
    setContacts(parsedContacts)
    setImporting(false)
    setView('search')
  }

  const selectedCount = companies.filter(c => c.selected).length + contacts.filter(c => c.selected).length

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
              <h1 className="text-lg font-semibold text-white">Prospecting</h1>
              <div className="flex bg-zinc-800 rounded-lg p-1 ml-4">
                <button onClick={() => setView('search')} className={`px-3 py-1 rounded text-sm ${view === 'search' ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400'}`}>🔍 Search</button>
                <button onClick={() => setView('import')} className={`px-3 py-1 rounded text-sm ${view === 'import' ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400'}`}>📄 Import</button>
              </div>
            </div>
            {selectedCount > 0 && (
              <button onClick={addToSaved} disabled={adding} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-400 disabled:opacity-50">
                {adding ? 'Adding...' : addedCount > 0 ? `✓ Added ${addedCount}` : `Add ${selectedCount} to Saved`}
              </button>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          {view === 'search' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                <div className="flex gap-3 mb-4">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Search for companies... e.g., 'B2B SaaS startups raised Series A 2025'"
                    className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white" />
                  <button onClick={search} disabled={searching || !query.trim()} className="px-6 py-2.5 bg-yellow-400 text-zinc-900 rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-50">
                    {searching ? '🔄...' : '🔍 Search'}
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="text-xs text-zinc-500 py-1">Quick:</span>
                  {SEARCH_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => applyTemplate(t)} className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-xs hover:text-white">{t.label}</button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Industry</label>
                    <select value={filters.industry} onChange={e => setFilters({ ...filters, industry: e.target.value })} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white text-sm">
                      <option value="">Any</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Funding</label>
                    <select value={filters.funding} onChange={e => setFilters({ ...filters, funding: e.target.value })} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white text-sm">
                      <option value="">Any</option>
                      {FUNDING_STAGES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Size</label>
                    <select value={filters.size} onChange={e => setFilters({ ...filters, size: e.target.value })} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white text-sm">
                      <option value="">Any</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Location</label>
                    <select value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white text-sm">
                      <option value="">Any</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">&nbsp;</label>
                    <label className="flex items-center gap-2 px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded cursor-pointer">
                      <input type="checkbox" checked={filters.hiring} onChange={e => setFilters({ ...filters, hiring: e.target.checked })} className="rounded" />
                      <span className="text-white text-sm">Hiring</span>
                    </label>
                  </div>
                </div>
              </div>

              {(companies.length > 0 || contacts.length > 0) && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                      <button onClick={() => setTab('companies')} className={`px-4 py-1.5 rounded text-sm ${tab === 'companies' ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400'}`}>🏢 Companies ({companies.length})</button>
                      <button onClick={() => setTab('contacts')} className={`px-4 py-1.5 rounded text-sm ${tab === 'contacts' ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400'}`}>👤 Contacts ({contacts.length})</button>
                    </div>
                    {searchedQuery && <span className="text-xs text-zinc-500">&quot;{searchedQuery}&quot;</span>}
                    {icpSettings && (
                      <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={sortByICP} 
                          onChange={e => {
                            setSortByICP(e.target.checked)
                            if (e.target.checked) {
                              setCompanies([...companies].sort((a, b) => calculateICPScore(b) - calculateICPScore(a)))
                            }
                          }} 
                          className="rounded" 
                        />
                        <span className="text-sm text-zinc-400">Sort by ICP</span>
                      </label>
                    )}
                  </div>

                  {tab === 'companies' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={companies.every(c => c.selected)} onChange={e => selectAll('companies', e.target.checked)} className="rounded" />
                          <span className="text-sm text-zinc-400">Select All</span>
                        </label>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {companies.map((c, idx) => {
                          const icpScore = icpSettings ? calculateICPScore(c) : 0
                          const icpFit = getICPFit(icpScore)
                          return (
                          <div key={idx} className={`p-4 hover:bg-zinc-800/30 ${c.selected ? 'bg-yellow-400/5' : ''}`}>
                            <div className="flex items-start gap-3">
                              <input type="checkbox" checked={c.selected || false} onChange={() => toggleCompany(idx)} className="mt-1 rounded" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-white font-medium">{c.name}</h3>
                                  {icpSettings && (
                                    <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${icpFit === 'high' ? 'bg-emerald-500/20 text-emerald-400' : icpFit === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                      ICP: {icpScore}%
                                    </span>
                                  )}
                                  {!icpSettings && c.icpFit && <span className={`px-2 py-0.5 text-[10px] rounded ${c.icpFit === 'high' ? 'bg-emerald-500/20 text-emerald-400' : c.icpFit === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-700 text-zinc-400'}`}>{c.icpFit} fit</span>}
                                </div>
                                {c.description && <p className="text-zinc-400 text-sm mb-2">{c.description}</p>}
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                  {c.industry && <span>🏷️ {c.industry}</span>}
                                  {c.size && <span>👥 {c.size}</span>}
                                  {c.location && <span>📍 {c.location}</span>}
                                </div>
                                {c.signals && c.signals.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {c.signals.map((s, i) => <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded">{s}</span>)}
                                  </div>
                                )}
                              </div>
                              <a href={c.sourceUrl} target="_blank" className="text-xs text-zinc-500 hover:text-white">{c.source} →</a>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  {tab === 'contacts' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={contacts.every(c => c.selected)} onChange={e => selectAll('contacts', e.target.checked)} className="rounded" />
                          <span className="text-sm text-zinc-400">Select All</span>
                        </label>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {contacts.map((c, idx) => (
                          <div key={idx} className={`p-4 hover:bg-zinc-800/30 ${c.selected ? 'bg-yellow-400/5' : ''}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={c.selected || false} onChange={() => toggleContact(idx)} className="rounded" />
                              <div className="flex-1">
                                <h3 className="text-white font-medium">{c.name}</h3>
                                <p className="text-zinc-400 text-sm">{c.title} at {c.company}</p>
                              </div>
                              {c.linkedin && <a href={c.linkedin} target="_blank" className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">LinkedIn</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {companies.length === 0 && contacts.length === 0 && !searching && (
                <div className="text-center py-16">
                  <span className="text-5xl block mb-4">🔍</span>
                  <h2 className="text-xl font-semibold text-white mb-2">Find New Prospects</h2>
                  <p className="text-zinc-500">Search for companies or use quick templates</p>
                </div>
              )}
            </>
          )}

          {view === 'import' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Import from CSV</h3>
              <p className="text-zinc-500 text-sm mb-4">Columns: company, industry, size, location, website, contact, title</p>
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-500 mb-4">📄 Upload CSV</button>
              <textarea value={importData} onChange={e => setImportData(e.target.value)} placeholder="Or paste CSV data here..." className="w-full h-32 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm font-mono mb-4" />
              <button onClick={parseImport} disabled={!importData.trim()} className="w-full py-2.5 bg-yellow-400 text-zinc-900 rounded-lg font-medium disabled:opacity-50">Parse & Preview</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}