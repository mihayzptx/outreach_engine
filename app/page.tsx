'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Industry options
const INDUSTRIES = [
  'SaaS / Software',
  'FinTech',
  'Healthcare Tech',
  'E-commerce',
  'Manufacturing',
  'Logistics / Supply Chain',
  'Real Estate Tech',
  'EdTech',
  'Cybersecurity',
  'AI / Machine Learning',
  'IoT / Hardware',
  'Media / Entertainment',
  'Retail',
  'Energy / CleanTech',
  'Legal Tech',
  'HR Tech',
  'Other'
]

// Target result options
const TARGET_RESULTS = [
  'Schedule discovery call',
  'Get a reply / start conversation',
  'Book a demo',
  'Request introduction',
  'Reconnect after event',
  'Share relevant content',
  'Explore partnership',
  'Other'
]

// ABM-specific target results (soft touch)
const ABM_TARGET_RESULTS = [
  'Recognition only (no ask)',
  'Soft engagement',
  'Content sharing',
  'Event invitation',
  'Seasonal greeting',
  'Congratulate achievement',
  'Other'
]

interface SavedCompany {
  id: number
  company_name: string
  industry: string
  last_prospect_name: string
  last_prospect_title: string
  last_context: string
  last_message_type: string
}

function HomeContent() {
  const [formData, setFormData] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    industry: '',
    industryOther: '',
    context: '',
    messageType: 'LinkedIn Connection',
    messageHistory: '',
    messageLength: 'medium',
    toneOfVoice: 'professional',
    targetResult: '',
    targetResultOther: '',
    sources: ''
  })
  
  const [useLocal, setUseLocal] = useState(false)
  const [checkingModel, setCheckingModel] = useState(false)
  const [useWebResearch, setUseWebResearch] = useState(false)
  const [saveCompany, setSaveCompany] = useState(false)
  const [message, setMessage] = useState('')
  const [displayedSources, setDisplayedSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'warning' | 'error'} | null>(null)
  
  // Saved companies for suggestions
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SavedCompany[]>([])
  const suggestionRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()

  // Load saved companies on mount
  useEffect(() => {
    const fetchSavedCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        const data = await response.json()
        setSavedCompanies(data.companies || [])
      } catch (error) {
        console.error('Error fetching saved companies:', error)
      }
    }
    fetchSavedCompanies()
  }, [])

  // Handle URL params prefill
  useEffect(() => {
    const company = searchParams.get('company')
    if (company) {
      const industry = searchParams.get('industry') || ''
      const isKnownIndustry = INDUSTRIES.includes(industry)
      
      setFormData({
        prospectName: searchParams.get('prospectName') || '',
        prospectTitle: searchParams.get('prospectTitle') || '',
        company: company,
        industry: isKnownIndustry ? industry : (industry ? 'Other' : ''),
        industryOther: isKnownIndustry ? '' : industry,
        context: searchParams.get('context') || '',
        messageType: searchParams.get('messageType') || 'LinkedIn Connection',
        messageHistory: '',
        messageLength: 'medium',
        toneOfVoice: 'professional',
        targetResult: '',
        targetResultOther: '',
        sources: searchParams.get('sources') || ''
      })
      showToast('Form pre-filled from saved company', 'success')
    }
  }, [searchParams])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter suggestions based on company or prospect name input
  const handleCompanyChange = (value: string) => {
    setFormData({...formData, company: value})
    
    if (value.length >= 2) {
      const filtered = savedCompanies.filter(c => 
        c.company_name.toLowerCase().includes(value.toLowerCase()) ||
        c.last_prospect_name?.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (company: SavedCompany) => {
    const isKnownIndustry = INDUSTRIES.includes(company.industry || '')
    
    setFormData({
      ...formData,
      company: company.company_name,
      industry: isKnownIndustry ? company.industry : (company.industry ? 'Other' : ''),
      industryOther: isKnownIndustry ? '' : (company.industry || ''),
      prospectName: company.last_prospect_name || '',
      prospectTitle: company.last_prospect_title || '',
      context: company.last_context || '',
      messageType: company.last_message_type || 'LinkedIn Connection'
    })
    setShowSuggestions(false)
    showToast(`Loaded ${company.company_name} from saved`, 'success')
  }

  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleLocalModel = async () => {
    if (useLocal) {
      // Switching to cloud, no check needed
      setUseLocal(false)
      return
    }
    
    // Switching to local, check availability
    setCheckingModel(true)
    
    try {
      const response = await fetch('/api/models/check')
      const data = await response.json()
      
      if (data.available) {
        setUseLocal(true)
        if (data.hasCustomModel) {
          showToast('Connected to local model', 'success')
        } else if (data.hasBaseModel) {
          showToast('Using base Llama model (custom model not found)', 'warning')
        } else {
          showToast('Connected to Ollama', 'success')
        }
      } else {
        showToast(`Local model unavailable: ${data.error}`, 'error')
        setUseLocal(false)
      }
    } catch (error) {
      showToast('Cannot connect to local model', 'error')
      setUseLocal(false)
    } finally {
      setCheckingModel(false)
    }
  }

  const getEffectiveIndustry = () => {
    return formData.industry === 'Other' ? formData.industryOther : formData.industry
  }

  const getEffectiveTargetResult = () => {
    return formData.targetResult === 'Other' ? formData.targetResultOther : formData.targetResult
  }

  const isFormValid = () => {
    return formData.prospectName.trim() && formData.company.trim() && formData.context.trim()
  }

  const handleSubmit = async (e: React.FormEvent, adjustment?: string) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    
    setLoading(true)
    setMessage('')
    setDisplayedSources([])
    setMetrics(null)
    
    if (useWebResearch) {
      setLoadingStep('🔍 Researching company...')
      await new Promise(r => setTimeout(r, 500))
    }
    setLoadingStep('✨ Crafting message...')
    
    try {
      const payload = {
        ...formData,
        industry: getEffectiveIndustry(),
        targetResult: getEffectiveTargetResult(),
        useLocal,
        useWebResearch,
        adjustment
      }
      
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      setMessage(data.message)
      setMetrics(data.metrics)
      
      if (formData.sources.trim()) {
        const sourcesList = formData.sources
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0)
        setDisplayedSources(sourcesList)
      }
      
      if (data.researchSources && data.researchSources.length > 0) {
        setDisplayedSources(prev => [...prev, ...data.researchSources])
      }
      
      if (saveCompany) {
        // Extract company info from WEB RESEARCH only (not user input)
        let extractedInfo: any = {}
        let gradingData: any = {}
        let leadGrade = null
        let leadScore = null
        let researchLinksData: any[] = []
        
        // Use only web research results for extraction
        const webResearchText = data.researchContext || ''
        const webResearchLinks = data.researchSources || []
        
        // Only extract if we have web research data
        if (webResearchText && webResearchLinks.length > 0) {
          try {
            const extractResponse = await fetch('/api/research/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                researchText: webResearchText,
                companyName: formData.company,
                prospectTitle: formData.prospectTitle,
                sources: webResearchLinks
              })
            })
            const extractData = await extractResponse.json()
            if (extractData.success) {
              extractedInfo = extractData.extractedInfo || {}
              gradingData = extractData.grading?.data || {}
              leadGrade = extractData.grading?.grade
              leadScore = extractData.grading?.score
              researchLinksData = extractData.researchLinks || []
            }
          } catch (err) {
            console.error('Extract error:', err)
          }
        }
        
        await fetch('/api/companies/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formData.company,
            industry: getEffectiveIndustry(),
            prospect_name: formData.prospectName,
            prospect_title: formData.prospectTitle,
            // Save USER context only (not research)
            context: formData.context,
            message_type: formData.messageType,
            // Extracted company info from WEB RESEARCH
            employee_count: extractedInfo.employee_count || null,
            revenue_range: extractedInfo.revenue_range || null,
            funding_stage: extractedInfo.funding_stage || null,
            funding_amount: extractedInfo.funding_amount || null,
            founded_year: extractedInfo.founded_year || null,
            headquarters: extractedInfo.headquarters || null,
            country: extractedInfo.country || null,
            website: extractedInfo.website || null,
            is_hiring: extractedInfo.is_hiring || false,
            buyer_intent: extractedInfo.buyer_intent || false,
            // Grading
            grading_data: Object.keys(gradingData).length > 0 ? gradingData : null,
            lead_grade: leadGrade,
            lead_score: leadScore,
            // Research links from web search
            research_links_data: researchLinksData.length > 0 ? researchLinksData : null
          })
        })
        showToast(webResearchLinks.length > 0 ? 'Company saved with research data' : 'Company saved', 'success')
        
        // Refresh saved companies list
        const response = await fetch('/api/companies')
        const companiesData = await response.json()
        setSavedCompanies(companiesData.companies || [])
      }

      if (data.metrics?.warnings?.length > 0) {
        showToast(data.metrics.warnings[0], 'warning')
      }
    } catch (error) {
      showToast('Error generating message', 'error')
    }
    
    setLoading(false)
    setLoadingStep('')
  }

  const handleRegenerate = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleAdjust = (adjustment: string) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, adjustment)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    showToast('Copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const clearForm = () => {
    setFormData({
      prospectName: '',
      prospectTitle: '',
      company: '',
      industry: '',
      industryOther: '',
      context: '',
      messageType: 'LinkedIn Connection',
      messageHistory: '',
      messageLength: 'medium',
      toneOfVoice: 'professional',
      targetResult: '',
      targetResultOther: '',
      sources: ''
    })
    setMessage('')
    setDisplayedSources([])
    setMetrics(null)
    setSaveCompany(false)
  }

  const bgGradient = useLocal 
    ? 'from-slate-900 via-emerald-950 to-slate-900' 
    : 'from-slate-900 via-blue-950 to-slate-900'

  const accentColor = useLocal ? 'emerald' : 'blue'

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Work'
  }

  return (
    <div className={`flex h-screen bg-gradient-to-br ${bgGradient} transition-all duration-700`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-green-500/90 text-white' :
          toast.type === 'warning' ? 'bg-yellow-500/90 text-black' :
          'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

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
            <div className={`w-10 h-10 bg-gradient-to-br ${useLocal ? 'from-emerald-500 to-green-600' : 'from-blue-500 to-indigo-600'} rounded-xl flex items-center justify-center shadow-lg transition-all duration-500`}>
              <span className="text-white font-bold">TS</span>
            </div>
            <div>
              <h2 className="font-bold text-white">Tech-stack.io</h2>
              <p className="text-xs text-slate-400">Outreach Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 ${useLocal ? 'bg-emerald-600' : 'bg-blue-600'} text-white rounded-xl font-medium shadow-lg transition-all duration-300`}
          >
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </button>
          <Link href="/bulk" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </Link>
          <Link href="/saved" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">💾</span>
            <span>Saved Companies</span>
            {savedCompanies.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${useLocal ? 'bg-emerald-900/50 text-emerald-400' : 'bg-blue-900/50 text-blue-400'}`}>
                {savedCompanies.length}
              </span>
            )}
          </Link>
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
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${useLocal ? 'bg-emerald-900/30' : 'bg-blue-900/30'} transition-all duration-500`}>
            <div className={`w-2 h-2 rounded-full ${useLocal ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`}></div>
            <span className="text-xs text-slate-300">{useLocal ? '🏠 Local Model' : '☁️ Cloud Model'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800/50 rounded-xl text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Message Generator</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">Create personalized outreach</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Model Toggle */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500 ${useLocal ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-blue-900/40 border border-blue-700/50'}`}>
                <span className="text-xs text-slate-300 hidden sm:inline">Model:</span>
                <button
                  onClick={toggleLocalModel}
                  disabled={checkingModel}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-500 disabled:opacity-50 ${useLocal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                >
                  {checkingModel ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    </span>
                  ) : (
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${useLocal ? 'translate-x-7' : 'translate-x-1'}`} />
                  )}
                </button>
                <span className={`text-xs font-semibold ${useLocal ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {checkingModel ? '...' : (useLocal ? 'Local' : 'Cloud')}
                </span>
              </div>

              {/* Research Toggle */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${useWebResearch ? 'bg-purple-900/40 border border-purple-700/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                <span className="text-xs text-slate-300 hidden sm:inline">Research:</span>
                <button
                  onClick={() => setUseWebResearch(!useWebResearch)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all ${useWebResearch ? 'bg-purple-500' : 'bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${useWebResearch ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-semibold ${useWebResearch ? 'text-purple-400' : 'text-slate-400'}`}>
                  {useWebResearch ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-7xl mx-auto">
            {/* Form */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className={`border-b border-slate-700/50 px-4 lg:px-6 py-4 bg-gradient-to-r ${useLocal ? 'from-emerald-900/20 to-transparent' : 'from-blue-900/20 to-transparent'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Prospect Information</h3>
                  <button
                    onClick={clearForm}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Clear form
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
                {/* Company with suggestions */}
                <div className="relative" ref={suggestionRef}>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Company <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Start typing to search saved companies..."
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:ring-2 text-white placeholder-slate-500 transition-all ${
                      !formData.company.trim() ? 'border-slate-600/50' : `border-${accentColor}-500/50`
                    } focus:ring-${accentColor}-500/50`}
                    value={formData.company}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    required
                  />
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
                      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
                        Saved companies
                      </div>
                      {filteredSuggestions.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => selectSuggestion(company)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                        >
                          <div className="font-medium text-white">{company.company_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {company.last_prospect_name && `${company.last_prospect_name} • `}
                            {company.industry || 'No industry'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-${accentColor}-500/50 text-white placeholder-slate-500`}
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Job Title</label>
                    <input
                      type="text"
                      placeholder="VP Engineering"
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-${accentColor}-500/50 text-white placeholder-slate-500`}
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Industry dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">Industry</label>
                  <select
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-${accentColor}-500/50`}
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value, industryOther: ''})}
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  
                  {formData.industry === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter industry..."
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-${accentColor}-500/50 text-white placeholder-slate-500`}
                      value={formData.industryOther}
                      onChange={(e) => setFormData({...formData, industryOther: e.target.value})}
                      autoFocus
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Business Context <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Recent funding, expansion plans, technical challenges, job postings..."
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-28 focus:ring-2 focus:ring-${accentColor}-500/50 resize-none text-white placeholder-slate-500`}
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">The more specific context you provide, the better the message.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Sources / Links</label>
                  <textarea
                    placeholder="https://example.com/article (one per line)"
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-16 focus:ring-2 focus:ring-${accentColor}-500/50 resize-none text-white placeholder-slate-500`}
                    value={formData.sources}
                    onChange={(e) => setFormData({...formData, sources: e.target.value})}
                  />
                </div>

                {/* Target Result dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Target Result
                    {formData.messageType === 'ABM' && (
                      <span className="ml-2 text-xs text-purple-400 font-normal">(soft touch)</span>
                    )}
                  </label>
                  <select
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-${accentColor}-500/50`}
                    value={formData.targetResult}
                    onChange={(e) => setFormData({...formData, targetResult: e.target.value, targetResultOther: ''})}
                  >
                    <option value="">Select goal...</option>
                    {(formData.messageType === 'ABM' ? ABM_TARGET_RESULTS : TARGET_RESULTS).map((result) => (
                      <option key={result} value={result}>{result}</option>
                    ))}
                  </select>
                  
                  {formData.targetResult === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter target result..."
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-${accentColor}-500/50 text-white placeholder-slate-500`}
                      value={formData.targetResultOther}
                      onChange={(e) => setFormData({...formData, targetResultOther: e.target.value})}
                      autoFocus
                    />
                  )}
                </div>

                {/* ABM Info Banner */}
                {formData.messageType === 'ABM' && (
                  <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-xl">
                    <p className="text-xs text-purple-300">
                      <span className="font-semibold">ABM Mode:</span> Generates warm, personalized messages focused on recognition and relationship building. No sales pitch or hard CTA.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Type</label>
                    <select
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      value={formData.messageType}
                      onChange={(e) => {
                        const newType = e.target.value
                        setFormData({
                          ...formData, 
                          messageType: newType,
                          // Reset target result when switching to/from ABM
                          targetResult: '',
                          targetResultOther: '',
                          // ABM defaults to warm tone
                          toneOfVoice: newType === 'ABM' ? 'warm' : formData.toneOfVoice
                        })
                      }}
                    >
                      <option>LinkedIn Connection</option>
                      <option>Email Outreach</option>
                      <option>ABM</option>
                      <option>Conference Follow-up</option>
                      <option>Discovery Call</option>
                      <option>Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Length</label>
                    <select
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      value={formData.messageLength}
                      onChange={(e) => setFormData({...formData, messageLength: e.target.value})}
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Tone</label>
                    <select
                      className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      value={formData.toneOfVoice}
                      onChange={(e) => setFormData({...formData, toneOfVoice: e.target.value})}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="warm">Warm</option>
                      <option value="direct">Direct</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>
                </div>

                {formData.messageType === 'Response' && (
                  <div className="border-t border-slate-700/50 pt-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Message History</label>
                    <textarea
                      placeholder="Paste the conversation thread..."
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-28 resize-none text-white placeholder-slate-500"
                      value={formData.messageHistory}
                      onChange={(e) => setFormData({...formData, messageHistory: e.target.value})}
                      required
                    />
                  </div>
                )}

                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${saveCompany ? (useLocal ? 'bg-emerald-900/30 border border-emerald-700/50' : 'bg-blue-900/30 border border-blue-700/50') : 'bg-slate-800/30 border border-slate-700/50'}`}>
                  <input
                    type="checkbox"
                    id="saveCompany"
                    checked={saveCompany}
                    onChange={(e) => setSaveCompany(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="saveCompany" className="text-sm font-medium text-slate-300 cursor-pointer">
                    💾 Save company for tracking
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    useLocal 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                  }`}
                >
                  {loading ? loadingStep || 'Generating...' : '✨ Generate Message'}
                </button>
                
                {!isFormValid() && (
                  <p className="text-xs text-center text-slate-500">
                    Fill in Name, Company, and Context to generate
                  </p>
                )}
              </form>
            </div>

            {/* Output */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className={`border-b border-slate-700/50 px-4 lg:px-6 py-4 bg-gradient-to-r ${useLocal ? 'from-emerald-900/20 to-transparent' : 'from-blue-900/20 to-transparent'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Generated Message</h3>
                  {metrics && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(metrics.qualityScore)}`}>{metrics.qualityScore}</div>
                      <div className="text-xs text-slate-400">{getScoreLabel(metrics.qualityScore)}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 lg:p-6">
                {!message && !loading ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${useLocal ? 'bg-emerald-900/30' : 'bg-blue-900/30'}`}>
                      <span className="text-4xl">🎯</span>
                    </div>
                    <p className="text-white text-lg font-semibold mb-2">Ready to Generate</p>
                    <p className="text-slate-400 text-sm">Fill in the required fields</p>
                    <div className="flex gap-2 mt-4">
                      <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">Name</span>
                      <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">Company</span>
                      <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">Context</span>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-80">
                    <div className="relative w-16 h-16">
                      <div className={`absolute inset-0 rounded-full border-4 ${useLocal ? 'border-emerald-900' : 'border-blue-900'}`}></div>
                      <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${useLocal ? 'border-emerald-500' : 'border-blue-500'}`}></div>
                    </div>
                    <p className="text-white text-base font-semibold mt-6">{loadingStep}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics && (
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl text-sm">
                        <div className="flex items-center gap-4">
                          <span className={metrics.charCount > 300 && formData.messageType === 'LinkedIn Connection' ? 'text-red-400' : 'text-slate-400'}>
                            {metrics.charCount} chars
                            {formData.messageType === 'LinkedIn Connection' && <span className="text-slate-500"> /300</span>}
                          </span>
                          <span className="text-slate-400">{metrics.wordCount} words</span>
                        </div>
                        {metrics.warnings?.length > 0 && (
                          <span className="text-yellow-400 text-xs">⚠️ {metrics.warnings.length} warning{metrics.warnings.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    )}

                    <div className={`bg-slate-800/50 border rounded-xl p-5 min-h-48 ${useLocal ? 'border-emerald-700/30' : 'border-blue-700/30'}`}>
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{message}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleRegenerate} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50 transition-colors">
                        🔄 Regenerate
                      </button>
                      <button onClick={() => handleAdjust('shorter and more direct')} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50 transition-colors">
                        📏 Shorter
                      </button>
                      <button onClick={() => handleAdjust('longer with more detail')} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50 transition-colors">
                        📝 Longer
                      </button>
                    </div>

                    {displayedSources.length > 0 && (
                      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-white mb-2">🔗 Sources</h4>
                        <div className="space-y-1">
                          {displayedSources.map((source, index) => (
                            <div key={index}>
                              {isValidUrl(source) ? (
                                <a href={source} target="_blank" rel="noopener noreferrer" className={`text-xs underline break-all ${useLocal ? 'text-emerald-400' : 'text-blue-400'}`}>
                                  {source}
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">{source}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                          copied ? 'bg-green-500 text-white' : useLocal ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy Message'}
                      </button>
                      <button
                        onClick={() => { setMessage(''); setDisplayedSources([]); setMetrics(null); }}
                        className="px-5 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 font-semibold transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
