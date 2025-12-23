'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  hiring: 'bg-blue-500',
  funding: 'bg-green-500',
  acquisition: 'bg-purple-500',
  product: 'bg-orange-500',
  conference: 'bg-pink-500',
  media: 'bg-cyan-500',
  blog: 'bg-yellow-500',
  award: 'bg-amber-500'
}

const SIGNAL_TYPE_BG: Record<string, string> = {
  hiring: 'bg-blue-900/30 border-blue-700/50',
  funding: 'bg-green-900/30 border-green-700/50',
  acquisition: 'bg-purple-900/30 border-purple-700/50',
  product: 'bg-orange-900/30 border-orange-700/50',
  conference: 'bg-pink-900/30 border-pink-700/50',
  media: 'bg-cyan-900/30 border-cyan-700/50',
  blog: 'bg-yellow-900/30 border-yellow-700/50',
  award: 'bg-amber-900/30 border-amber-700/50'
}

const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-green-500 text-white',
  'B': 'bg-blue-500 text-white',
  'C': 'bg-yellow-500 text-black',
  'D': 'bg-orange-500 text-white',
  'E': 'bg-red-500 text-white'
}

const GRADE_BG: Record<string, string> = {
  'A': 'from-green-600 to-green-500',
  'B': 'from-blue-600 to-blue-500',
  'C': 'from-yellow-600 to-yellow-500',
  'D': 'from-orange-600 to-orange-500',
  'E': 'from-red-600 to-red-500'
}

const PREDEFINED_LABELS = Object.keys(LABEL_COLORS)
const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Netherlands', 'Ireland', 'Singapore', 'UAE', 'Israel', 'Other']
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Private Equity', 'IPO/Public']
const REVENUE_RANGES = ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '>$500M']

const SORT_OPTIONS = [
  { value: 'grade_desc', label: 'Grade (Best First)' },
  { value: 'signals_desc', label: 'New Signals First' },
  { value: 'name_asc', label: 'Company A-Z' },
  { value: 'recent', label: 'Recently Added' },
]

interface SignalData {
  type: string
  label: string
  title: string
  content: string
  url: string
  source: string
  publishedDate: string | null
}

interface ResearchLink {
  url: string
  source: string
  usedAt: string
}

interface GradingData {
  buyerIntent?: boolean
  activelyHiring?: boolean
  fundingStage?: string
  fundingAmount?: string
  revenueRange?: string
  companySize?: string
  geography?: string
  connections?: number
  yearsInPosition?: number
  yearsInCompany?: number
  yearFounded?: number
}

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
  signal_data?: SignalData[]
  research_links_data?: ResearchLink[]
  lead_grade?: string
  lead_score?: number
  grading_data?: GradingData
  founded_year?: number
  headquarters?: string
  linkedin_url?: string
  funding_stage?: string
  funding_amount?: string
  last_funding_date?: string
  is_hiring?: boolean
  buyer_intent?: boolean
  contact_linkedin?: string
  contact_connections?: number
  contact_years_position?: number
  contact_years_company?: number
  last_scanned_at?: string
  last_signal_date?: string
  signal_count?: number
  created_at: string
  updated_at: string
}

function calculateGrade(data: Partial<GradingData>, title?: string, industry?: string, country?: string, employeeCount?: string): { grade: string, score: number, percentage: number } {
  let totalWeighted = 0
  let maxWeighted = 0
  
  if (data.buyerIntent !== undefined) { totalWeighted += (data.buyerIntent ? 5 : 0) * 3; maxWeighted += 15 }
  if (data.activelyHiring !== undefined) { totalWeighted += (data.activelyHiring ? 5 : 0) * 3; maxWeighted += 15 }
  if (data.fundingStage) { 
    let score = 0
    const s = data.fundingStage.toLowerCase()
    if (s.includes('series a') || s.includes('series b')) score = 5
    else if (s.includes('series c') || s.includes('private')) score = 4
    else if (s.includes('seed')) score = 3
    totalWeighted += score * 3; maxWeighted += 15
  }
  if (data.fundingAmount) {
    let score = 0
    const amt = data.fundingAmount.toLowerCase()
    if (amt.includes('500k') || amt.includes('2m') || amt.includes('5m')) score = 5
    else if (amt.includes('20m') || amt.includes('10m')) score = 4
    else if (amt.includes('100m')) score = 3
    totalWeighted += score * 3; maxWeighted += 15
  }
  if (data.revenueRange || employeeCount) {
    let score = 0
    const r = (data.revenueRange || '').toLowerCase()
    if (r.includes('1m-10m') || r.includes('10m-50m') || r.includes('$1m') || r.includes('$10m')) score = 5
    else if (r.includes('50m-100m')) score = 3
    else if (r.includes('100m')) score = 2
    totalWeighted += score * 3; maxWeighted += 15
  }
  
  if (title) {
    let score = 2
    const t = title.toLowerCase()
    if (t.includes('cto') || t.includes('cio') || (t.includes('vp') && t.includes('tech'))) score = 5
    else if (t.includes('ceo') || t.includes('director') || t.includes('head')) score = 4
    else if (t.includes('manager') || t.includes('founder')) score = 3
    totalWeighted += score * 2; maxWeighted += 10
  }
  if (country || data.geography) {
    let score = 1
    const g = (country || data.geography || '').toLowerCase()
    if (g.includes('united states') || g.includes('uk') || g.includes('canada')) score = 5
    else if (g.includes('australia') || g.includes('israel') || g.includes('singapore')) score = 4
    else if (g.includes('germany') || g.includes('france')) score = 3
    totalWeighted += score * 2; maxWeighted += 10
  }
  if (employeeCount || data.companySize) {
    let score = 0
    const s = (employeeCount || data.companySize || '').toLowerCase()
    if (s.includes('11-50') || s.includes('51-200') || s.includes('201-500')) score = 5
    else if (s.includes('501-1000')) score = 4
    else if (s.includes('1-10') || s.includes('1001')) score = 3
    totalWeighted += score * 2; maxWeighted += 10
  }
  if (industry) {
    let score = 1
    const i = industry.toLowerCase()
    if (i.includes('saas') || i.includes('fintech') || i.includes('software') || i.includes('ai')) score = 5
    else if (i.includes('manufacturing') || i.includes('logistics') || i.includes('healthcare')) score = 4
    else if (i.includes('retail') || i.includes('education')) score = 3
    totalWeighted += score * 2; maxWeighted += 10
  }
  
  if (data.connections) {
    let score = data.connections >= 500 ? 5 : data.connections >= 300 ? 4 : data.connections >= 100 ? 2 : 0
    totalWeighted += score; maxWeighted += 5
  }
  if (data.yearsInPosition) {
    let score = data.yearsInPosition >= 1 && data.yearsInPosition < 2 ? 5 : data.yearsInPosition < 4 ? 3 : 1
    totalWeighted += score; maxWeighted += 5
  }
  if (data.yearFounded) {
    const age = new Date().getFullYear() - data.yearFounded
    let score = age >= 5 && age < 15 ? 5 : age >= 3 && age < 30 ? 3 : 1
    totalWeighted += score; maxWeighted += 5
  }
  
  const percentage = maxWeighted > 0 ? Math.round((totalWeighted / maxWeighted) * 100) : 0
  let grade = 'E'
  if (percentage >= 81) grade = 'A'
  else if (percentage >= 61) grade = 'B'
  else if (percentage >= 41) grade = 'C'
  else if (percentage >= 21) grade = 'D'
  
  return { grade, score: totalWeighted, percentage }
}

export default function Saved() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'grading' | 'links'>('overview')
  const [signalFilter, setSignalFilter] = useState('all')
  const router = useRouter()

  const [filterCountry, setFilterCountry] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterLabel, setFilterLabel] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [sortBy, setSortBy] = useState('grade_desc')
  const [searchQuery, setSearchQuery] = useState('')

  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [gradingForm, setGradingForm] = useState<Partial<GradingData>>({})

  useEffect(() => { fetchCompanies() }, [])
  useEffect(() => { applyFilters() }, [companies, filterCountry, filterIndustry, filterLabel, filterGrade, sortBy, searchQuery])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...companies]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.company_name.toLowerCase().includes(q) || c.last_prospect_name?.toLowerCase().includes(q))
    }
    if (filterCountry) result = result.filter(c => c.country === filterCountry)
    if (filterIndustry) result = result.filter(c => c.industry === filterIndustry)
    if (filterLabel) result = result.filter(c => c.labels?.includes(filterLabel))
    if (filterGrade) result = result.filter(c => c.lead_grade === filterGrade)

    result.sort((a, b) => {
      switch (sortBy) {
        case 'grade_desc':
          const gradeOrder = { A: 5, B: 4, C: 3, D: 2, E: 1 }
          return (gradeOrder[b.lead_grade as keyof typeof gradeOrder] || 0) - (gradeOrder[a.lead_grade as keyof typeof gradeOrder] || 0)
        case 'signals_desc':
          if (a.has_new_signals && !b.has_new_signals) return -1
          if (!a.has_new_signals && b.has_new_signals) return 1
          return (b.signal_count || 0) - (a.signal_count || 0)
        case 'name_asc': return a.company_name.localeCompare(b.company_name)
        case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return 0
      }
    })
    setFilteredCompanies(result)
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
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(prev => prev ? { ...prev, signal_data: data.signalData, has_new_signals: data.hasNewSignals, signal_count: data.totalSignals } : null)
        }
      }
    } catch (error) { console.error('Error:', error) }
    finally { setRefreshing(null) }
  }

  const deleteCompany = async (id: number) => {
    if (!confirm('Remove this company?')) return
    await fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
    setSelectedCompany(null)
    await fetchCompanies()
  }

  const updateCompany = async (id: number, updates: any) => {
    await fetch('/api/companies/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    await fetchCompanies()
    // Update selected company locally
    if (selectedCompany?.id === id) {
      setSelectedCompany(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const saveGrading = async () => {
    if (!selectedCompany) return
    const gradeResult = calculateGrade(gradingForm, selectedCompany.last_prospect_title, selectedCompany.industry, selectedCompany.country, selectedCompany.employee_count)
    await updateCompany(selectedCompany.id, {
      grading_data: gradingForm,
      lead_grade: gradeResult.grade,
      lead_score: gradeResult.score,
      is_hiring: gradingForm.activelyHiring,
      buyer_intent: gradingForm.buyerIntent,
      funding_stage: gradingForm.fundingStage,
      funding_amount: gradingForm.fundingAmount,
      founded_year: gradingForm.yearFounded,
      employee_count: gradingForm.companySize,
      revenue_range: gradingForm.revenueRange,
      country: gradingForm.geography,
      contact_connections: gradingForm.connections,
      contact_years_position: gradingForm.yearsInPosition,
      contact_years_company: gradingForm.yearsInCompany
    })
    setSelectedCompany(prev => prev ? { ...prev, lead_grade: gradeResult.grade, lead_score: gradeResult.score, grading_data: gradingForm as GradingData } : null)
  }

  const addLabel = async (label: string) => {
    if (!selectedCompany) return
    const labels = [...(selectedCompany.labels || []), label]
    await updateCompany(selectedCompany.id, { labels })
    setShowLabelPicker(false)
  }

  const removeLabel = async (label: string) => {
    if (!selectedCompany) return
    const labels = (selectedCompany.labels || []).filter(l => l !== label)
    await updateCompany(selectedCompany.id, { labels })
  }

  const goToGenerate = (company: Company, withSignals = false) => {
    const params = new URLSearchParams({
      company: company.company_name,
      industry: company.industry || '',
      prospectName: company.last_prospect_name || '',
      prospectTitle: company.last_prospect_title || '',
      context: withSignals && company.new_signals ? `${company.last_context || ''}\n\nRecent:\n${company.new_signals.join('\n')}` : company.last_context || '',
      messageType: company.last_message_type || 'LinkedIn Connection'
    })
    router.push(`/?${params.toString()}`)
  }

  const openCompany = (company: Company) => {
    setSelectedCompany(company)
    // Initialize grading form with existing data
    setGradingForm({
      buyerIntent: company.buyer_intent || company.grading_data?.buyerIntent,
      activelyHiring: company.is_hiring || company.grading_data?.activelyHiring,
      fundingStage: company.funding_stage || company.grading_data?.fundingStage,
      fundingAmount: company.funding_amount || company.grading_data?.fundingAmount,
      revenueRange: company.revenue_range || company.grading_data?.revenueRange,
      companySize: company.employee_count || company.grading_data?.companySize,
      geography: company.country || company.grading_data?.geography,
      yearFounded: company.founded_year || company.grading_data?.yearFounded,
      connections: company.contact_connections || company.grading_data?.connections,
      yearsInPosition: company.contact_years_position || company.grading_data?.yearsInPosition,
      yearsInCompany: company.contact_years_company || company.grading_data?.yearsInCompany
    })
    setActiveTab('overview')
    setSignalFilter('all')
  }

  const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))]
  const uniqueCountries = [...new Set(companies.map(c => c.country).filter(Boolean))]
  const allLabels = [...new Set(companies.flatMap(c => c.labels || []))]
  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
  
  const getSignalsByType = (signals: SignalData[] | undefined) => {
    if (!signals) return {}
    const counts: Record<string, number> = {}
    signals.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1 })
    return counts
  }

  // Get all links from company
  const getAllLinks = (company: Company) => {
    const links: { url: string, source: string, type: string }[] = []
    
    // From research_links_data
    if (company.research_links_data && Array.isArray(company.research_links_data)) {
      company.research_links_data.forEach(l => {
        links.push({ url: l.url, source: l.source || new URL(l.url).hostname, type: 'Research' })
      })
    }
    
    // From signal_links
    if (company.signal_links && Array.isArray(company.signal_links)) {
      company.signal_links.forEach(url => {
        try {
          links.push({ url, source: new URL(url).hostname.replace('www.', ''), type: 'Signal' })
        } catch {}
      })
    }
    
    // From context URLs
    if (company.last_context) {
      const urlMatches = company.last_context.match(/https?:\/\/[^\s]+/g) || []
      urlMatches.forEach(url => {
        try {
          if (!links.find(l => l.url === url)) {
            links.push({ url, source: new URL(url).hostname.replace('www.', ''), type: 'Context' })
          }
        } catch {}
      })
    }
    
    return links
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Company Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedCompany.lead_grade ? (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${GRADE_BG[selectedCompany.lead_grade] || GRADE_BG.E} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl font-bold text-white">{selectedCompany.lead_grade}</span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center">
                      <span className="text-slate-400 text-sm">N/A</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCompany.company_name}</h2>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-400 mt-1">
                      {selectedCompany.industry && <span className="bg-slate-700/50 px-2 py-0.5 rounded">🏭 {selectedCompany.industry}</span>}
                      {selectedCompany.country && <span className="bg-slate-700/50 px-2 py-0.5 rounded">🌍 {selectedCompany.country}</span>}
                      {selectedCompany.employee_count && <span className="bg-slate-700/50 px-2 py-0.5 rounded">👥 {selectedCompany.employee_count}</span>}
                      {selectedCompany.lead_score && <span className="bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">{selectedCompany.lead_score} pts</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">✕</button>
              </div>
              
              {/* Labels */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(selectedCompany.labels || []).map(l => (
                  <span key={l} className={`px-2 py-0.5 ${LABEL_COLORS[l] || 'bg-slate-600'} text-white text-xs rounded-full flex items-center gap-1`}>
                    {l} <button onClick={() => removeLabel(l)} className="hover:bg-white/20 rounded-full">×</button>
                  </span>
                ))}
                <button onClick={() => setShowLabelPicker(!showLabelPicker)} className="px-2 py-0.5 border border-dashed border-slate-600 text-slate-400 text-xs rounded-full hover:border-slate-500">+ Label</button>
              </div>
              {showLabelPicker && (
                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg flex flex-wrap gap-1">
                  {PREDEFINED_LABELS.filter(l => !(selectedCompany.labels || []).includes(l)).map(l => (
                    <button key={l} onClick={() => addLabel(l)} className={`px-2 py-1 ${LABEL_COLORS[l]} text-white text-xs rounded-full hover:opacity-80`}>{l}</button>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-slate-900/50 p-1 rounded-xl">
                {(['overview', 'signals', 'grading', 'links'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                  >
                    {tab === 'overview' && '📋 Overview'}
                    {tab === 'signals' && `🔔 Signals ${selectedCompany.signal_count ? `(${selectedCompany.signal_count})` : ''}`}
                    {tab === 'grading' && '📊 Grading'}
                    {tab === 'links' && `🔗 Links (${getAllLinks(selectedCompany).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Company Info Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">👥 Employees</p>
                      <p className="text-white font-medium">{selectedCompany.employee_count || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">💵 Revenue</p>
                      <p className="text-white font-medium">{selectedCompany.revenue_range || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">🚀 Funding</p>
                      <p className="text-white font-medium">{selectedCompany.funding_stage || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">💰 Amount</p>
                      <p className="text-white font-medium">{selectedCompany.funding_amount || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">📅 Founded</p>
                      <p className="text-white font-medium">{selectedCompany.founded_year || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">📍 Location</p>
                      <p className="text-white font-medium">{selectedCompany.headquarters || selectedCompany.country || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">🔥 Hiring</p>
                      <p className={`font-medium ${selectedCompany.is_hiring ? 'text-green-400' : 'text-slate-400'}`}>
                        {selectedCompany.is_hiring ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">🎯 Buyer Intent</p>
                      <p className={`font-medium ${selectedCompany.buyer_intent ? 'text-green-400' : 'text-slate-400'}`}>
                        {selectedCompany.buyer_intent ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">👤 Contact</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedCompany.last_prospect_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedCompany.last_prospect_name || 'No contact'}</p>
                        <p className="text-sm text-slate-400">{selectedCompany.last_prospect_title || 'No title'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Outreach Context - what we used last time */}
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">📝 Last Outreach Context</h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedCompany.last_context || 'No context saved'}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2 text-xs text-slate-500">
                      <span>Type: {selectedCompany.last_message_type || 'N/A'}</span>
                      <span>·</span>
                      <span>Updated: {formatDate(selectedCompany.updated_at)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">📝 Notes</h4>
                    <textarea
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm h-24 resize-none"
                      defaultValue={selectedCompany.notes || ''}
                      onBlur={(e) => updateCompany(selectedCompany.id, { notes: e.target.value })}
                      placeholder="Add notes..."
                    />
                  </div>
                </>
              )}

              {/* Signals Tab */}
              {activeTab === 'signals' && (
                <>
                  {selectedCompany.signal_data && selectedCompany.signal_data.length > 0 ? (
                    <>
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => setSignalFilter('all')} className={`px-3 py-1.5 text-xs rounded-lg transition-all ${signalFilter === 'all' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                          All ({selectedCompany.signal_data.length})
                        </button>
                        {Object.entries(getSignalsByType(selectedCompany.signal_data)).map(([type, count]) => (
                          <button key={type} onClick={() => setSignalFilter(type)} className={`px-3 py-1.5 text-xs rounded-lg transition-all ${signalFilter === type ? SIGNAL_TYPE_COLORS[type] + ' text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                            {selectedCompany.signal_data?.find(s => s.type === type)?.label.split(' ')[0]} {count}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {selectedCompany.signal_data.filter(s => signalFilter === 'all' || s.type === signalFilter).map((signal, i) => (
                          <div key={i} className={`rounded-xl p-4 border ${SIGNAL_TYPE_BG[signal.type] || 'bg-slate-800/50 border-slate-700'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full text-white ${SIGNAL_TYPE_COLORS[signal.type]}`}>{signal.label}</span>
                              {signal.publishedDate && <span className="text-xs text-slate-400">{formatDate(signal.publishedDate)}</span>}
                            </div>
                            <h5 className="text-white font-medium text-sm mb-2">{signal.title}</h5>
                            <p className="text-slate-300 text-sm mb-3">{signal.content}</p>
                            <a href={signal.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg">
                              🔗 {signal.source} ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🔔</span>
                      </div>
                      <p className="text-slate-400 mb-2">No signals yet</p>
                      <p className="text-slate-500 text-sm">Click "Scan for Signals" to search for company updates</p>
                    </div>
                  )}
                </>
              )}

              {/* Grading Tab */}
              {activeTab === 'grading' && (
                <div className="space-y-4">
                  {/* Current Grade Display */}
                  {selectedCompany.lead_grade && (
                    <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${selectedCompany.lead_grade === 'A' ? 'bg-green-900/20 border-green-500' : selectedCompany.lead_grade === 'B' ? 'bg-blue-900/20 border-blue-500' : selectedCompany.lead_grade === 'C' ? 'bg-yellow-900/20 border-yellow-500' : 'bg-slate-800/50 border-slate-600'}`}>
                      <div>
                        <span className="text-slate-400 text-sm">Current Grade</span>
                        <p className="text-white font-medium">{selectedCompany.lead_score || 0} points</p>
                      </div>
                      <span className={`text-4xl font-bold ${selectedCompany.lead_grade === 'A' ? 'text-green-400' : selectedCompany.lead_grade === 'B' ? 'text-blue-400' : selectedCompany.lead_grade === 'C' ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {selectedCompany.lead_grade}
                      </span>
                    </div>
                  )}

                  <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-3">🔥 High Priority (3x weight)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-800">
                        <input type="checkbox" checked={gradingForm.buyerIntent || false} onChange={e => setGradingForm({...gradingForm, buyerIntent: e.target.checked})} className="w-5 h-5 rounded" />
                        <span className="text-white text-sm">Buyer Intent Signal</span>
                      </label>
                      <label className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg cursor-pointer hover:bg-slate-800">
                        <input type="checkbox" checked={gradingForm.activelyHiring || false} onChange={e => setGradingForm({...gradingForm, activelyHiring: e.target.checked})} className="w-5 h-5 rounded" />
                        <span className="text-white text-sm">Actively Hiring</span>
                      </label>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Funding Stage</label>
                        <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.fundingStage || ''} onChange={e => setGradingForm({...gradingForm, fundingStage: e.target.value})}>
                          <option value="">Select...</option>
                          {FUNDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Funding Amount</label>
                        <input type="text" className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.fundingAmount || ''} onChange={e => setGradingForm({...gradingForm, fundingAmount: e.target.value})} placeholder="e.g. $5M" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Revenue Range</label>
                        <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.revenueRange || ''} onChange={e => setGradingForm({...gradingForm, revenueRange: e.target.value})}>
                          <option value="">Select...</option>
                          {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3">📊 Medium Priority (2x weight)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Company Size</label>
                        <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.companySize || ''} onChange={e => setGradingForm({...gradingForm, companySize: e.target.value})}>
                          <option value="">Select...</option>
                          {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Geography</label>
                        <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.geography || ''} onChange={e => setGradingForm({...gradingForm, geography: e.target.value})}>
                          <option value="">Select...</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">📋 Low Priority (1x weight)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">LinkedIn Connections</label>
                        <input type="number" className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.connections || ''} onChange={e => setGradingForm({...gradingForm, connections: parseInt(e.target.value) || 0})} placeholder="500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Years in Position</label>
                        <input type="number" step="0.5" className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.yearsInPosition || ''} onChange={e => setGradingForm({...gradingForm, yearsInPosition: parseFloat(e.target.value) || 0})} placeholder="2" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Year Founded</label>
                        <input type="number" className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm" value={gradingForm.yearFounded || ''} onChange={e => setGradingForm({...gradingForm, yearFounded: parseInt(e.target.value) || 0})} placeholder="2015" />
                      </div>
                    </div>
                  </div>

                  <button onClick={saveGrading} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-500 hover:to-indigo-500 shadow-lg transition-all">
                    💾 Calculate & Save Grade
                  </button>
                </div>
              )}

              {/* Links Tab */}
              {activeTab === 'links' && (
                <div className="space-y-4">
                  {getAllLinks(selectedCompany).length > 0 ? (
                    <>
                      {/* Group by type */}
                      {['Research', 'Signal', 'Context'].map(type => {
                        const typeLinks = getAllLinks(selectedCompany).filter(l => l.type === type)
                        if (typeLinks.length === 0) return null
                        return (
                          <div key={type} className="bg-slate-900/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">
                              {type === 'Research' && '🔍 Research Links'}
                              {type === 'Signal' && '🔔 Signal Sources'}
                              {type === 'Context' && '📝 Context Links'}
                            </h4>
                            <div className="space-y-2">
                              {typeLinks.map((link, i) => (
                                <a 
                                  key={i}
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-all group"
                                >
                                  <span className="text-blue-400">🔗</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{link.source}</p>
                                    <p className="text-slate-500 text-xs truncate">{link.url}</p>
                                  </div>
                                  <span className="text-slate-500 group-hover:text-blue-400">↗</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🔗</span>
                      </div>
                      <p className="text-slate-400 mb-2">No links stored</p>
                      <p className="text-slate-500 text-sm">Links are saved when generating messages with web research</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2 flex-shrink-0">
              <button onClick={() => refreshCompany(selectedCompany.id, selectedCompany.company_name, selectedCompany.industry)} disabled={refreshing === selectedCompany.id} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-purple-500 transition-all">
                {refreshing === selectedCompany.id ? '⏳ Scanning...' : '🔍 Scan Signals'}
              </button>
              <button onClick={() => { setSelectedCompany(null); goToGenerate(selectedCompany, selectedCompany.has_new_signals) }} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${selectedCompany.has_new_signals ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}>
                {selectedCompany.has_new_signals ? '✨ Generate with Signals' : '✉️ Generate Message'}
              </button>
              <button onClick={() => { setSelectedCompany(null); goToGenerate({...selectedCompany, last_message_type: 'ABM'}, selectedCompany.has_new_signals) }} className="px-4 py-2.5 bg-purple-600/80 text-white rounded-xl text-sm font-medium hover:bg-purple-500 transition-all">
                💜 ABM
              </button>
              <button onClick={() => deleteCompany(selectedCompany.id)} className="px-4 py-2.5 bg-red-600/80 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all">🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 z-30 h-full flex flex-col transition-transform`}>
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
            <span className="text-xl">✨</span> Generate
          </Link>
          <Link href="/bulk" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📦</span> Bulk
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg">
            <span className="text-xl">💾</span> Saved
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500">{companies.length}</span>
          </button>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📊</span> History
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">⚙️</span> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/30 text-xs text-slate-300">
            🔔 {companies.filter(c => c.has_new_signals).length} with signals
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-white hover:bg-slate-800 rounded-lg">☰</button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Saved Companies</h1>
                <p className="text-xs text-slate-400">{filteredCompanies.length} of {companies.length} companies</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFiltersOpen(!filtersOpen)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filtersOpen ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}>
                🔍 Filters
              </button>
              <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-all">+ Add</Link>
            </div>
          </div>
          
          <div className="mt-4 relative">
            <input type="text" placeholder="Search companies, contacts..." className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>

          {filtersOpen && (
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <select className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                  <option value="">All Grades</option>
                  {['A','B','C','D','E'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                  <option value="">All Countries</option>
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm" value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm" value={filterLabel} onChange={e => setFilterLabel(e.target.value)}>
                  <option value="">All Labels</option>
                  {allLabels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </header>

        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">💾</span>
              </div>
              <p className="text-white text-lg font-medium">No companies found</p>
              <p className="text-slate-400 text-sm mt-2">Save a company from the Generate page</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCompanies.map(company => (
                <div key={company.id} onClick={() => openCompany(company)} className={`bg-slate-800/50 backdrop-blur rounded-2xl border-2 p-4 cursor-pointer hover:scale-[1.02] transition-all ${company.has_new_signals ? 'border-green-500/50 shadow-green-900/20 shadow-lg' : 'border-slate-700/50 hover:border-slate-600'}`}>
                  {/* Card Header with Grade */}
                  <div className="flex items-start gap-3 mb-3">
                    {company.lead_grade ? (
                      <div className={`w-11 h-11 rounded-xl ${GRADE_COLORS[company.lead_grade]} flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg`}>
                        {company.lead_grade}
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">N/A</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold truncate">{company.company_name}</h3>
                        {company.has_new_signals && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>}
                      </div>
                      <p className="text-sm text-slate-400 truncate">{company.last_prospect_name} · {company.last_prospect_title}</p>
                    </div>
                  </div>

                  {/* Company Info Row */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {company.industry && <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded">🏭 {company.industry}</span>}
                    {company.country && <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded">🌍 {company.country}</span>}
                    {company.employee_count && <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded">👥 {company.employee_count}</span>}
                    {company.funding_stage && <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded">🚀 {company.funding_stage}</span>}
                  </div>

                  {/* Labels */}
                  {company.labels && company.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {company.labels.slice(0, 2).map(l => <span key={l} className={`px-2 py-0.5 ${LABEL_COLORS[l] || 'bg-slate-600'} text-white text-xs rounded-full`}>{l}</span>)}
                      {company.labels.length > 2 && <span className="px-2 py-0.5 bg-slate-600 text-white text-xs rounded-full">+{company.labels.length - 2}</span>}
                    </div>
                  )}

                  {/* Signals */}
                  {company.signal_data && company.signal_data.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(getSignalsByType(company.signal_data)).slice(0, 3).map(([type, count]) => (
                        <span key={type} className={`px-2 py-0.5 text-white text-xs rounded-full ${SIGNAL_TYPE_COLORS[type]}`}>
                          {company.signal_data?.find(s => s.type === type)?.label.split(' ')[0]} {count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50 flex justify-between">
                    <span>Added {formatDate(company.created_at)}</span>
                    <div className="flex gap-2">
                      {company.lead_score && <span className="text-blue-400">{company.lead_score} pts</span>}
                      {getAllLinks(company).length > 0 && <span>🔗 {getAllLinks(company).length}</span>}
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
