'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const LABEL_COLORS: Record<string, string> = {
  'Hot Lead': 'bg-red-500', 'Warm': 'bg-orange-500', 'Nurture': 'bg-amber-500',
  'Strategic': 'bg-purple-500', 'Partner': 'bg-blue-500', 'Enterprise': 'bg-indigo-500',
  'SMB': 'bg-emerald-500', 'Expansion': 'bg-pink-500', 'At Risk': 'bg-rose-600', 'New': 'bg-cyan-500'
}

const SIGNAL_COLORS: Record<string, string> = {
  hiring: 'bg-blue-500', funding: 'bg-emerald-500', acquisition: 'bg-purple-500', product: 'bg-orange-500',
  conference: 'bg-pink-500', media: 'bg-cyan-500', blog: 'bg-amber-500', award: 'bg-yellow-500'
}

const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-emerald-500 text-white', 'B': 'bg-blue-500 text-white', 'C': 'bg-yellow-500 text-zinc-900',
  'D': 'bg-orange-500 text-white', 'E': 'bg-red-500 text-white'
}

const PREDEFINED_LABELS = Object.keys(LABEL_COLORS)
const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Netherlands', 'Ireland', 'Singapore', 'UAE', 'Israel']
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Private Equity', 'IPO/Public']
const REVENUE_RANGES = ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '>$500M']

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
  signal_data?: {
    detected?: any[]
    count?: number
    high_priority?: number
    medium_priority?: number
    scanned_at?: string
  } | any[]
  research_links_data?: any[]
  lead_grade?: string
  lead_score?: number
  grading_data?: any
  founded_year?: number
  funding_stage?: string
  funding_amount?: string
  is_hiring?: boolean
  buyer_intent?: boolean
  signal_count?: number
  is_archived?: boolean
  archived_at?: string
  created_at: string
  updated_at: string
}

export default function SavedPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filtered, setFiltered] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Company | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'grading' | 'links'>('overview')
  const [refreshing, setRefreshing] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [sortBy, setSortBy] = useState('grade_desc')
  const [gradingForm, setGradingForm] = useState<any>({})
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [researchingAll, setResearchingAll] = useState(false)
  const [researchProgress, setResearchProgress] = useState({ current: 0, total: 0 })
  const [showArchived, setShowArchived] = useState(false)
  const router = useRouter()

  useEffect(() => { fetchCompanies() }, [])
  useEffect(() => { applyFilters() }, [companies, searchQuery, filterGrade, sortBy, showArchived])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies', { cache: 'no-store' })
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch { }
    finally { setLoading(false) }
  }

  const applyFilters = () => {
    let result = [...companies]
    
    // Filter archived
    if (!showArchived) {
      result = result.filter(c => !c.is_archived)
    } else {
      result = result.filter(c => c.is_archived)
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.company_name.toLowerCase().includes(q) || c.last_prospect_name?.toLowerCase().includes(q))
    }
    if (filterGrade) result = result.filter(c => c.lead_grade === filterGrade)
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'grade_desc':
          const gradeOrder: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 }
          return (gradeOrder[b.lead_grade || ''] || 0) - (gradeOrder[a.lead_grade || ''] || 0)
        case 'signals_desc': return (b.signal_count || 0) - (a.signal_count || 0)
        case 'name_asc': return a.company_name.localeCompare(b.company_name)
        case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return 0
      }
    })
    setFiltered(result)
  }

  const refreshCompany = async (id: number, name: string, industry: string) => {
    setRefreshing(id)
    try {
      const res = await fetch('/api/companies/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: id, company_name: name, industry }),
        cache: 'no-store'
      })
      const data = await res.json()
      console.log('Refresh response:', data)
      
      if (data.success) {
        // Fetch fresh data from database with cache bust
        const companiesRes = await fetch('/api/companies?t=' + Date.now(), { cache: 'no-store' })
        const companiesData = await companiesRes.json()
        const freshCompanies = companiesData.companies || []
        console.log('Fresh companies fetched:', freshCompanies.length)
        
        setCompanies(freshCompanies)
        
        // Update selected with fresh data
        const updatedCompany = freshCompanies.find((c: Company) => c.id === id)
        if (updatedCompany) {
          console.log('Updated company:', updatedCompany)
          setSelected(updatedCompany)
          // Also update grading form if on grading tab
          setGradingForm({
            buyerIntent: updatedCompany.buyer_intent || updatedCompany.grading_data?.buyerIntent,
            activelyHiring: updatedCompany.is_hiring || updatedCompany.grading_data?.activelyHiring,
            fundingStage: updatedCompany.funding_stage || updatedCompany.grading_data?.fundingStage,
            fundingAmount: updatedCompany.funding_amount || updatedCompany.grading_data?.fundingAmount,
            revenueRange: updatedCompany.revenue_range || updatedCompany.grading_data?.revenueRange,
            companySize: updatedCompany.employee_count || updatedCompany.grading_data?.companySize,
            geography: updatedCompany.country || updatedCompany.grading_data?.geography,
            yearFounded: updatedCompany.founded_year || updatedCompany.grading_data?.yearFounded
          })
        }
      } else {
        console.error('Refresh failed:', data.error)
      }
    } catch (e) {
      console.error('Refresh error:', e)
    }
    finally { setRefreshing(null) }
  }

  const deleteCompany = async (id: number) => {
    if (!confirm('Delete this company?')) return
    await fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
    setSelected(null)
    fetchCompanies()
  }

  const archiveCompany = async (id: number) => {
    await updateCompany(id, { is_archived: true, archived_at: new Date().toISOString() })
    setSelected(null)
  }

  const unarchiveCompany = async (id: number) => {
    await updateCompany(id, { is_archived: false, archived_at: null })
    setSelected(null)
  }

  const researchAllCompanies = async () => {
    const toResearch = companies.filter(c => !c.signal_data || c.signal_count === 0)
    if (toResearch.length === 0) {
      alert('All companies already have research data')
      return
    }
    
    setResearchingAll(true)
    setResearchProgress({ current: 0, total: toResearch.length })
    
    for (let i = 0; i < toResearch.length; i++) {
      const c = toResearch[i]
      try {
        await fetch('/api/companies/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: c.id, company_name: c.company_name, industry: c.industry })
        })
      } catch (e) {
        console.error('Research failed for', c.company_name)
      }
      setResearchProgress({ current: i + 1, total: toResearch.length })
    }
    
    await fetchCompanies()
    setResearchingAll(false)
  }

  const updateCompany = async (id: number, updates: any) => {
    await fetch('/api/companies/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    fetchCompanies()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
  }

  const calculateGrade = (data: any) => {
    let total = 0, max = 0
    if (data.buyerIntent) { total += 15 }; max += 15
    if (data.activelyHiring) { total += 15 }; max += 15
    if (data.fundingStage) { total += 12; max += 15 }
    if (data.fundingAmount) { total += 12; max += 15 }
    if (data.revenueRange) { total += 12; max += 15 }
    if (data.companySize) { total += 8; max += 10 }
    if (data.geography) { total += 8; max += 10 }
    if (data.yearFounded) { total += 4; max += 5 }
    const pct = max > 0 ? Math.round((total / max) * 100) : 0
    return { grade: pct >= 81 ? 'A' : pct >= 61 ? 'B' : pct >= 41 ? 'C' : pct >= 21 ? 'D' : 'E', score: total }
  }

  const saveGrading = async () => {
    if (!selected) return
    const { grade, score } = calculateGrade(gradingForm)
    await updateCompany(selected.id, {
      grading_data: gradingForm, lead_grade: grade, lead_score: score,
      is_hiring: gradingForm.activelyHiring, buyer_intent: gradingForm.buyerIntent,
      funding_stage: gradingForm.fundingStage, employee_count: gradingForm.companySize,
      revenue_range: gradingForm.revenueRange, country: gradingForm.geography, founded_year: gradingForm.yearFounded
    })
    setSelected(prev => prev ? { ...prev, lead_grade: grade, lead_score: score } : null)
  }

  const addLabel = async (label: string) => {
    if (!selected) return
    const labels = [...(selected.labels || []), label]
    await updateCompany(selected.id, { labels })
    setShowLabelPicker(false)
  }

  const removeLabel = async (label: string) => {
    if (!selected) return
    const labels = (selected.labels || []).filter(l => l !== label)
    await updateCompany(selected.id, { labels })
  }

  const openCompany = (c: Company) => {
    setSelected(c)
    setGradingForm({
      buyerIntent: c.buyer_intent || c.grading_data?.buyerIntent,
      activelyHiring: c.is_hiring || c.grading_data?.activelyHiring,
      fundingStage: c.funding_stage || c.grading_data?.fundingStage,
      fundingAmount: c.funding_amount || c.grading_data?.fundingAmount,
      revenueRange: c.revenue_range || c.grading_data?.revenueRange,
      companySize: c.employee_count || c.grading_data?.companySize,
      geography: c.country || c.grading_data?.geography,
      yearFounded: c.founded_year || c.grading_data?.yearFounded
    })
    setActiveTab('overview')
  }

  const goToGenerate = (c: Company) => {
    const params = new URLSearchParams({
      company: c.company_name, industry: c.industry || '', prospectName: c.last_prospect_name || '',
      prospectTitle: c.last_prospect_title || '', context: c.last_context || '', messageType: c.last_message_type || 'LinkedIn Connection'
    })
    router.push(`/?${params.toString()}`)
  }

  const getAllLinks = (c: Company) => {
    const links: any[] = []
    if (c.research_links_data) c.research_links_data.forEach((l: any) => links.push({ ...l, type: 'Research' }))
    if (c.last_context) {
      const urls = c.last_context.match(/https?:\/\/[^\s]+/g) || []
      urls.forEach(url => { if (!links.find(l => l.url === url)) links.push({ url, source: new URL(url).hostname, type: 'Context' }) })
    }
    return links
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'

  // Helper to get signals from either old array format or new object format
  const getSignals = (c: Company) => {
    if (!c.signal_data) return []
    if (Array.isArray(c.signal_data)) return c.signal_data
    if (c.signal_data.detected) return c.signal_data.detected
    return []
  }

  const getSignalStats = (c: Company) => {
    if (!c.signal_data || Array.isArray(c.signal_data)) {
      return { high: 0, medium: 0, low: 0, total: c.signal_count || 0 }
    }
    return {
      high: c.signal_data.high_priority || 0,
      medium: c.signal_data.medium_priority || 0,
      low: (c.signal_data.count || 0) - (c.signal_data.high_priority || 0) - (c.signal_data.medium_priority || 0),
      total: c.signal_data.count || 0
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {selected.lead_grade ? (
                    <div className={`w-12 h-12 rounded-xl ${GRADE_COLORS[selected.lead_grade]} flex items-center justify-center text-xl font-bold`}>
                      {selected.lead_grade}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">N/A</div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selected.company_name}</h2>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {selected.industry && <span>{selected.industry}</span>}
                      {selected.country && <><span>·</span><span>{selected.country}</span></>}
                      {selected.lead_score && <><span>·</span><span className="text-yellow-400">{selected.lead_score} pts</span></>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 text-zinc-500 hover:text-white">✕</button>
              </div>
              
              {/* Labels */}
              <div className="flex flex-wrap gap-1 mt-3">
                {(selected.labels || []).map(l => (
                  <span key={l} className={`px-2 py-0.5 ${LABEL_COLORS[l] || 'bg-zinc-700'} text-white text-xs rounded-full flex items-center gap-1`}>
                    {l} <button onClick={() => removeLabel(l)} className="hover:opacity-70">×</button>
                  </span>
                ))}
                <button onClick={() => setShowLabelPicker(!showLabelPicker)} className="px-2 py-0.5 border border-dashed border-zinc-700 text-zinc-500 text-xs rounded-full hover:border-zinc-500">+ Label</button>
              </div>
              {showLabelPicker && (
                <div className="mt-2 p-2 bg-zinc-950 rounded-lg flex flex-wrap gap-1">
                  {PREDEFINED_LABELS.filter(l => !(selected.labels || []).includes(l)).map(l => (
                    <button key={l} onClick={() => addLabel(l)} className={`px-2 py-1 ${LABEL_COLORS[l]} text-white text-xs rounded-full`}>{l}</button>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-zinc-950 p-1 rounded-lg">
                {(['overview', 'signals', 'grading', 'links'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'signals' && `Signals${selected.signal_count ? ` (${selected.signal_count})` : ''}`}
                    {tab === 'grading' && 'Grading'}
                    {tab === 'links' && `Links (${getAllLinks(selected).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'overview' && (
                <>
                  {/* Info Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Employees', value: selected.employee_count },
                      { label: 'Revenue', value: selected.revenue_range },
                      { label: 'Funding', value: selected.funding_stage },
                      { label: 'Amount', value: selected.funding_amount },
                      { label: 'Founded', value: selected.founded_year },
                      { label: 'Location', value: selected.country },
                      { label: 'Hiring', value: selected.is_hiring ? 'Yes' : 'No', highlight: selected.is_hiring },
                      { label: 'Intent', value: selected.buyer_intent ? 'Yes' : 'No', highlight: selected.buyer_intent }
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-950 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 uppercase">{item.label}</p>
                        <p className={`text-sm font-medium ${item.highlight ? 'text-emerald-400' : 'text-white'}`}>{item.value || 'Unknown'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="bg-zinc-950 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase mb-2">Contact</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-zinc-900 font-bold">
                        {selected.last_prospect_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selected.last_prospect_name || 'No contact'}</p>
                        <p className="text-zinc-500 text-sm">{selected.last_prospect_title || 'No title'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="bg-zinc-950 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase mb-2">Last Outreach Context</p>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{selected.last_context || 'No context'}</p>
                  </div>

                  {/* Notes */}
                  <div className="bg-zinc-950 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase mb-2">Notes</p>
                    <textarea
                      className="w-full px-2 py-1.5 bg-transparent border border-zinc-800 rounded text-white text-sm resize-none h-20 focus:border-yellow-400"
                      defaultValue={selected.notes || ''}
                      onBlur={(e) => updateCompany(selected.id, { notes: e.target.value })}
                      placeholder="Add notes..."
                    />
                  </div>
                </>
              )}

              {activeTab === 'signals' && (
                <>
                  {/* Signal summary */}
                  {getSignals(selected).length > 0 && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-950 rounded-lg">
                      <span className="text-sm text-zinc-400">Detected:</span>
                      {getSignalStats(selected).high > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">🔥 {getSignalStats(selected).high} High</span>
                      )}
                      {getSignalStats(selected).medium > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">⚡ {getSignalStats(selected).medium} Medium</span>
                      )}
                      {getSignalStats(selected).low > 0 && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">📌 {getSignalStats(selected).low} Low</span>
                      )}
                    </div>
                  )}
                  
                  {getSignals(selected).length > 0 ? (
                    <div className="space-y-2">
                      {getSignals(selected).map((s: any, i: number) => (
                        <div key={i} className={`rounded-lg p-3 border ${
                          s.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                          s.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                          'bg-zinc-950 border-zinc-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{s.label || s.type}</span>
                            {s.priority && (
                              <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                s.priority === 'high' ? 'bg-red-500/30 text-red-400' :
                                s.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                                'bg-blue-500/30 text-blue-400'
                              }`}>
                                {s.priority}
                              </span>
                            )}
                            {s.publishedDate && <span className="text-xs text-zinc-500 ml-auto">{formatDate(s.publishedDate)}</span>}
                          </div>
                          <p className="text-white text-sm font-medium">{s.detail || s.title}</p>
                          {s.content && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{s.content}</p>}
                          {s.url && <a href={s.url} target="_blank" className="text-yellow-400 text-xs mt-2 inline-block hover:underline">{s.source} →</a>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-600">
                      <span className="text-3xl block mb-2">🔔</span>
                      <p>No signals yet</p>
                      <p className="text-xs mt-1">Click "Scan Signals" to search</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'grading' && (
                <div className="space-y-4">
                  {/* High Priority */}
                  <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-400 mb-3">HIGH PRIORITY (3x)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 bg-zinc-950 p-2 rounded cursor-pointer">
                        <input type="checkbox" checked={gradingForm.buyerIntent || false} onChange={e => setGradingForm({...gradingForm, buyerIntent: e.target.checked})} className="rounded" />
                        <span className="text-sm text-white">Buyer Intent</span>
                      </label>
                      <label className="flex items-center gap-2 bg-zinc-950 p-2 rounded cursor-pointer">
                        <input type="checkbox" checked={gradingForm.activelyHiring || false} onChange={e => setGradingForm({...gradingForm, activelyHiring: e.target.checked})} className="rounded" />
                        <span className="text-sm text-white">Actively Hiring</span>
                      </label>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Funding Stage</label>
                        <select value={gradingForm.fundingStage || ''} onChange={e => setGradingForm({...gradingForm, fundingStage: e.target.value})} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-sm">
                          <option value="">Select...</option>
                          {FUNDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Revenue Range</label>
                        <select value={gradingForm.revenueRange || ''} onChange={e => setGradingForm({...gradingForm, revenueRange: e.target.value})} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-sm">
                          <option value="">Select...</option>
                          {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Medium Priority */}
                  <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-400 mb-3">MEDIUM PRIORITY (2x)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Company Size</label>
                        <select value={gradingForm.companySize || ''} onChange={e => setGradingForm({...gradingForm, companySize: e.target.value})} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-sm">
                          <option value="">Select...</option>
                          {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Geography</label>
                        <select value={gradingForm.geography || ''} onChange={e => setGradingForm({...gradingForm, geography: e.target.value})} className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-sm">
                          <option value="">Select...</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Low Priority */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-zinc-500 mb-3">LOW PRIORITY (1x)</p>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Year Founded</label>
                      <input type="number" value={gradingForm.yearFounded || ''} onChange={e => setGradingForm({...gradingForm, yearFounded: parseInt(e.target.value) || undefined})} placeholder="2015" className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-white text-sm" />
                    </div>
                  </div>

                  <button onClick={saveGrading} className="w-full py-2.5 bg-yellow-400 text-zinc-900 rounded-lg font-semibold hover:bg-yellow-300">
                    Calculate & Save Grade
                  </button>
                </div>
              )}

              {activeTab === 'links' && (
                getAllLinks(selected).length ? (
                  <div className="space-y-2">
                    {getAllLinks(selected).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg hover:bg-zinc-900 transition-colors">
                        <span className="text-yellow-400">🔗</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{link.source}</p>
                          <p className="text-zinc-600 text-xs truncate">{link.url}</p>
                        </div>
                        <span className="text-zinc-500 text-xs">{link.type}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600">
                    <span className="text-3xl block mb-2">🔗</span>
                    <p>No links stored</p>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 flex gap-2">
              <button onClick={() => refreshCompany(selected.id, selected.company_name, selected.industry)} disabled={refreshing === selected.id} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-50">
                {refreshing === selected.id ? '⏳ Scanning...' : '🔍 Scan Signals'}
              </button>
              <button onClick={() => { setSelected(null); goToGenerate(selected) }} className="flex-1 px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-yellow-300">
                ✉️ Generate Message
              </button>
              {selected.is_archived ? (
                <button onClick={() => unarchiveCompany(selected.id)} className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30">
                  📤 Unarchive
                </button>
              ) : (
                <button onClick={() => archiveCompany(selected.id)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm hover:bg-zinc-700">
                  📁 Archive
                </button>
              )}
              <button onClick={() => deleteCompany(selected.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-56 bg-zinc-900 border-r border-zinc-800 z-30 h-full flex flex-col transition-transform`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 font-black text-sm">TS</span>
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Tech-stack.io</h2>
              <p className="text-[10px] text-zinc-500">Outreach Engine</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>✨</span> Generate
          </Link>
          <Link href="/bulk" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>📦</span> Bulk
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">
            <span>💾</span> Saved
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-yellow-400/20 rounded">{companies.length}</span>
          </button>
          <Link href="/history" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>📊</span> History
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">Saved Companies</h1>
              <span className="text-xs text-zinc-500">{filtered.length} of {companies.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-lg text-sm ${showArchived ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                📁 {showArchived ? 'Archived' : 'Archive'}
              </button>
              {companies.length > 0 && !showArchived && (
                <button 
                  onClick={researchAllCompanies} 
                  disabled={researchingAll}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50"
                >
                  {researchingAll ? `🔄 ${researchProgress.current}/${researchProgress.total}` : '🔍 Research All'}
                </button>
              )}
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
                <option value="">All Grades</option>
                {['A','B','C','D','E'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
                <option value="grade_desc">Best Grade</option>
                <option value="signals_desc">Most Signals</option>
                <option value="name_asc">A-Z</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mt-3 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400"
          />
        </header>

        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">💾</span>
              <p className="text-white font-medium">No companies saved</p>
              <p className="text-zinc-500 text-sm mt-1">Save companies from the Generate page</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => openCompany(c)}
                  className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer hover:border-zinc-700 transition-all ${c.has_new_signals ? 'border-emerald-500/50' : 'border-zinc-800'}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {c.lead_grade ? (
                      <div className={`w-10 h-10 rounded-lg ${GRADE_COLORS[c.lead_grade]} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                        {c.lead_grade}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs flex-shrink-0">N/A</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{c.company_name}</h3>
                        {c.has_new_signals && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></span>}
                      </div>
                      <p className="text-zinc-500 text-sm truncate">{c.last_prospect_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.industry && <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">{c.industry}</span>}
                    {c.country && <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">{c.country}</span>}
                    {c.funding_stage && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">{c.funding_stage}</span>}
                    {getSignalStats(c).high > 0 && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">🔥 {getSignalStats(c).high}</span>}
                    {getSignalStats(c).total > 0 && getSignalStats(c).high === 0 && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">📊 {getSignalStats(c).total}</span>}
                  </div>

                  {c.labels && c.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.labels.slice(0, 2).map(l => <span key={l} className={`px-2 py-0.5 ${LABEL_COLORS[l] || 'bg-zinc-700'} text-white text-xs rounded-full`}>{l}</span>)}
                      {c.labels.length > 2 && <span className="px-2 py-0.5 bg-zinc-700 text-white text-xs rounded-full">+{c.labels.length - 2}</span>}
                    </div>
                  )}

                  <div className="text-xs text-zinc-600 pt-2 border-t border-zinc-800 flex justify-between">
                    <span>{formatDate(c.created_at)}</span>
                    <span>{c.lead_score ? `${c.lead_score} pts` : ''}</span>
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