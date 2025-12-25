'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import EmailModal from '@/components/EmailModal'

const INDUSTRIES = [
  'SaaS / Software', 'FinTech', 'Healthcare Tech', 'E-commerce', 'Manufacturing',
  'Logistics / Supply Chain', 'Real Estate Tech', 'EdTech', 'Cybersecurity',
  'AI / Machine Learning', 'IoT / Hardware', 'Media / Entertainment', 'Retail',
  'Energy / CleanTech', 'Legal Tech', 'HR Tech', 'Construction', 'Other'
]

const TARGET_RESULTS = [
  'Schedule discovery call', 'Get a reply / start conversation', 'Book a demo',
  'Request introduction', 'Reconnect after event', 'Share relevant content',
  'Explore partnership', 'Other'
]

const ABM_TARGET_RESULTS = [
  'Recognition only (no ask)', 'Soft engagement', 'Content sharing',
  'Event invitation', 'Seasonal greeting', 'Congratulate achievement', 'Other'
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
    prospectName: '', prospectTitle: '', company: '', industry: '', industryOther: '',
    context: '', messageType: 'LinkedIn Connection', messageHistory: '',
    messageLength: 'medium', toneOfVoice: 'professional', targetResult: '',
    targetResultOther: '', sources: '', customInstructions: ''
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
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SavedCompany[]>([])
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null)
  const [campaigns, setCampaigns] = useState<{id: number, name: string, message_type: string, tone: string, length: string, context_template: string, target_goal: string, custom_instructions: string}[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then(d => setSavedCompanies(d.companies || [])).catch(() => {})
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) }).catch(() => {})
    fetch('/api/campaigns').then(r => r.json()).then(d => setCampaigns(d.campaigns || [])).catch(() => {})
    fetch('/api/gmail/status').then(r => r.json()).then(d => setGmailConnected(d.connected)).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  useEffect(() => {
    // Handle campaign params from URL
    const campaignId = searchParams.get('campaignId')
    if (campaignId) {
      setSelectedCampaign(parseInt(campaignId))
      setFormData(prev => ({
        ...prev,
        messageType: searchParams.get('messageType') || prev.messageType,
        toneOfVoice: searchParams.get('tone') || prev.toneOfVoice,
        messageLength: searchParams.get('length') || prev.messageLength,
        context: searchParams.get('context') || prev.context,
        targetResult: searchParams.get('targetGoal') || prev.targetResult,
        customInstructions: searchParams.get('customInstructions') || ''
      }))
    }
    // Handle company params from saved companies
    const company = searchParams.get('company')
    if (company) {
      setFormData(prev => ({
        ...prev,
        company: searchParams.get('company') || '',
        industry: searchParams.get('industry') || '',
        prospectName: searchParams.get('prospectName') || '',
        prospectTitle: searchParams.get('prospectTitle') || '',
        context: searchParams.get('context') || prev.context,
        messageType: searchParams.get('messageType') || prev.messageType
      }))
    }
  }, [searchParams])

  const handleCampaignSelect = (campaignId: number | null) => {
    setSelectedCampaign(campaignId)
    if (campaignId) {
      const campaign = campaigns.find(c => c.id === campaignId)
      if (campaign) {
        setFormData(prev => ({
          ...prev,
          messageType: campaign.message_type,
          toneOfVoice: campaign.tone,
          messageLength: campaign.length,
          context: campaign.context_template || prev.context,
          targetResult: campaign.target_goal || prev.targetResult,
          customInstructions: campaign.custom_instructions || ''
        }))
      }
    }
  }

  useEffect(() => {
    if (formData.company.length > 1) {
      const matches = savedCompanies.filter(c => 
        c.company_name.toLowerCase().includes(formData.company.toLowerCase())
      ).slice(0, 5)
      setFilteredSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [formData.company, savedCompanies])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const selectSuggestion = (company: SavedCompany) => {
    setFormData(prev => ({
      ...prev,
      company: company.company_name,
      industry: company.industry || prev.industry,
      prospectName: company.last_prospect_name || '',
      prospectTitle: company.last_prospect_title || '',
      context: company.last_context || '',
      messageType: company.last_message_type || 'LinkedIn Connection'
    }))
    setShowSuggestions(false)
  }

  const checkLocalModel = async () => {
    setCheckingModel(true)
    try {
      const stored = localStorage.getItem('llm-settings')
      const settings = stored ? JSON.parse(stored) : {}
      const response = await fetch('/api/models/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: settings.localModel || 'llama3.2',
          endpoint: settings.localEndpoint || 'http://localhost:11434'
        })
      })
      const data = await response.json()
      if (data.available) {
        setUseLocal(true)
        showToast('Connected to local model', 'success')
      } else {
        showToast(data.error || 'Local model not available', 'warning')
        setUseLocal(false)
      }
    } catch {
      showToast('Cannot connect to Ollama', 'error')
      setUseLocal(false)
    } finally {
      setCheckingModel(false)
    }
  }

  const getEffectiveIndustry = () => formData.industry === 'Other' ? formData.industryOther : formData.industry
  const getEffectiveTargetResult = () => formData.targetResult === 'Other' ? formData.targetResultOther : formData.targetResult
  const isFormValid = () => formData.prospectName.trim() && formData.company.trim() && formData.context.trim()

  const handleSubmit = async (e: React.FormEvent, adjustment?: string) => {
    e.preventDefault()
    if (!isFormValid()) { showToast('Please fill required fields', 'error'); return }
    
    setLoading(true)
    setMessage('')
    setDisplayedSources([])
    setMetrics(null)
    
    if (useWebResearch) setLoadingStep('Researching company...')
    else setLoadingStep('Generating message...')
    
    try {
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          industry: getEffectiveIndustry(),
          targetResult: getEffectiveTargetResult(),
          useLocal, useWebResearch, adjustment,
          campaignId: selectedCampaign
        })
      })
      
      const data = await response.json()
      setMessage(data.message)
      setMetrics(data.metrics)
      
      if (formData.sources.trim()) {
        setDisplayedSources(formData.sources.split('\n').map(s => s.trim()).filter(s => s))
      }
      if (data.researchSources?.length > 0) {
        setDisplayedSources(prev => [...prev, ...data.researchSources])
      }
      
      if (saveCompany) {
        let extractedInfo: any = {}
        let gradingData: any = {}
        let leadGrade = null
        let leadScore = null
        let researchLinksData: any[] = []
        
        const webResearchText = data.researchContext || ''
        const webResearchLinks = data.researchSources || []
        
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
          } catch (err) { console.error('Extract error:', err) }
        }
        
        await fetch('/api/companies/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formData.company,
            industry: getEffectiveIndustry(),
            prospect_name: formData.prospectName,
            prospect_title: formData.prospectTitle,
            context: formData.context,
            message_type: formData.messageType,
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
            grading_data: Object.keys(gradingData).length > 0 ? gradingData : null,
            lead_grade: leadGrade,
            lead_score: leadScore,
            research_links_data: researchLinksData.length > 0 ? researchLinksData : null
          })
        })
        showToast(webResearchLinks.length > 0 ? 'Company saved with research' : 'Company saved', 'success')
        
        const companiesRes = await fetch('/api/companies')
        const companiesData = await companiesRes.json()
        setSavedCompanies(companiesData.companies || [])
      }

      if (data.metrics?.warnings?.length > 0) {
        showToast(data.metrics.warnings[0], 'warning')
      }
    } catch {
      showToast('Error generating message', 'error')
    }
    
    setLoading(false)
    setLoadingStep('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    showToast('Copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const clearForm = () => {
    setFormData({
      prospectName: '', prospectTitle: '', company: '', industry: '', industryOther: '',
      context: '', messageType: 'LinkedIn Connection', messageHistory: '',
      messageLength: 'medium', toneOfVoice: 'professional', targetResult: '',
      targetResultOther: '', sources: '', customInstructions: ''
    })
    setMessage('')
    setMetrics(null)
    setDisplayedSources([])
    setSelectedCampaign(null)
  }

  const currentTargetResults = formData.messageType === 'ABM' ? ABM_TARGET_RESULTS : TARGET_RESULTS

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'warning' ? 'bg-yellow-400 text-zinc-900' :
          'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

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
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">
            <span>✨</span> Generate
          </button>
          <Link href="/bulk" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>📦</span> Bulk
          </Link>
          <Link href="/campaigns" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>🎯</span> Campaigns
            {campaigns.length > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{campaigns.length}</span>}
          </Link>
          <Link href="/saved" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>💾</span> Saved
            {savedCompanies.length > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{savedCompanies.length}</span>}
          </Link>
          <Link href="/history" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>📊</span> History
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
            <span>⚙️</span> Settings
          </Link>
        </nav>
        
        {/* User section */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {user?.role === 'admin' && (
            <Link href="/admin" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
              <span>👥</span> Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-zinc-300 truncate max-w-[80px]">{user.name}</span>
              </div>
              <button onClick={logout} className="text-[10px] text-zinc-500 hover:text-white transition-colors">Logout</button>
            </div>
          ) : (
            <Link href="/login" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors">
              <span>🔑</span> Login
            </Link>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg font-semibold text-white">Generate Message</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearForm} className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm transition-colors">
                Clear
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              {/* Campaign Selector */}
              {campaigns.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Campaign</h3>
                    {selectedCampaign && (
                      <button 
                        onClick={() => handleCampaignSelect(null)}
                        className="text-[10px] text-zinc-500 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedCampaign || ''}
                    onChange={(e) => handleCampaignSelect(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                  >
                    <option value="">No campaign (manual settings)</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>🎯 {c.name}</option>
                    ))}
                  </select>
                  {selectedCampaign && (
                    <p className="text-[10px] text-zinc-600 mt-2">
                      Settings loaded from campaign. Prospect-specific context will be added below.
                    </p>
                  )}
                </div>
              )}

              {/* Prospect Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Prospect</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      placeholder="CTO"
                    />
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Company</h3>
                <div className="space-y-3">
                  <div className="relative" ref={suggestionRef}>
                    <label className="block text-xs text-zinc-400 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      placeholder="Acme Corp"
                    />
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
                        {filteredSuggestions.map(c => (
                          <button
                            key={c.id}
                            onClick={() => selectSuggestion(c)}
                            className="w-full px-3 py-2 text-left hover:bg-zinc-800 text-sm"
                          >
                            <p className="text-white font-medium">{c.company_name}</p>
                            <p className="text-zinc-500 text-xs">{c.last_prospect_name} · {c.industry}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Context */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Context *</h3>
                <textarea
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 resize-none h-28"
                  placeholder="What's the hook? Recent news, shared connection, specific pain point..."
                />
              </div>

              {/* Message Options */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Message Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Type</label>
                    <select
                      value={formData.messageType}
                      onChange={(e) => setFormData({...formData, messageType: e.target.value, targetResult: ''})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    >
                      <option>LinkedIn Connection</option>
                      <option>LinkedIn Message</option>
                      <option>Cold Email</option>
                      <option>Follow-up Email</option>
                      <option>Response</option>
                      <option>ABM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Goal</label>
                    <select
                      value={formData.targetResult}
                      onChange={(e) => setFormData({...formData, targetResult: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    >
                      <option value="">Select goal</option>
                      {currentTargetResults.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Length</label>
                    <select
                      value={formData.messageLength}
                      onChange={(e) => setFormData({...formData, messageLength: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Tone</label>
                    <select
                      value={formData.toneOfVoice}
                      onChange={(e) => setFormData({...formData, toneOfVoice: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="direct">Direct</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>
                </div>

                {/* Message History (for Response type) */}
                {formData.messageType === 'Response' && (
                  <div className="mt-3">
                    <label className="block text-xs text-zinc-400 mb-1">Conversation History</label>
                    <textarea
                      value={formData.messageHistory}
                      onChange={(e) => setFormData({...formData, messageHistory: e.target.value})}
                      placeholder="Paste the conversation thread here..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-24 resize-none focus:border-yellow-400"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">Include their message so AI can craft appropriate response</p>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-2">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${useWebResearch ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <input type="checkbox" checked={useWebResearch} onChange={(e) => setUseWebResearch(e.target.checked)} className="sr-only" />
                  <span className="text-sm">🔍 Web Research</span>
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${saveCompany ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <input type="checkbox" checked={saveCompany} onChange={(e) => setSaveCompany(e.target.checked)} className="sr-only" />
                  <span className="text-sm">💾 Save Company</span>
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${useLocal ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <input type="checkbox" checked={useLocal} onChange={(e) => { if (e.target.checked) checkLocalModel(); else setUseLocal(false) }} className="sr-only" />
                  <span className="text-sm">{checkingModel ? '⏳' : '🖥️'} Local Model</span>
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={(e) => handleSubmit(e)}
                disabled={loading || !isFormValid()}
                className="w-full py-3 bg-yellow-400 text-zinc-900 rounded-xl font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin"></span>
                    {loadingStep}
                  </span>
                ) : (
                  'Generate Message'
                )}
              </button>
            </div>

            {/* Output */}
            <div className="space-y-4">
              {/* Message Output */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Generated Message</h3>
                  {message && (
                    <div className="flex items-center gap-2">
                      {(formData.messageType.includes('Email') || formData.messageType === 'Cold Email' || formData.messageType === 'Follow-up Email') && (
                        gmailConnected ? (
                          <button 
                            onClick={() => setShowEmailModal(true)} 
                            className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            📧 Send
                          </button>
                        ) : (
                          <Link 
                            href="/settings?tab=integrations" 
                            className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            📧 Connect Gmail
                          </Link>
                        )
                      )}
                      <button onClick={handleCopy} className={`px-2 py-1 text-xs rounded transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
                
                {message ? (
                  <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{message}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                    <span className="text-3xl mb-2">✨</span>
                    <p className="text-sm">Your message will appear here</p>
                  </div>
                )}
              </div>

              {/* Metrics */}
              {metrics && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Metrics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{metrics.charCount}</p>
                      <p className="text-xs text-zinc-500">Characters</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{metrics.wordCount}</p>
                      <p className="text-xs text-zinc-500">Words</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${metrics.qualityScore >= 80 ? 'text-emerald-400' : metrics.qualityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{metrics.qualityScore}</p>
                      <p className="text-xs text-zinc-500">Quality</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Adjustments */}
              {message && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Regenerate</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Shorter', 'Longer', 'More casual', 'More direct', 'Add question'].map(adj => (
                      <button
                        key={adj}
                        onClick={(e) => handleSubmit(e, adj)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                      >
                        {adj}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Custom instruction... e.g. 'Focus on their recent funding'"
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          handleSubmit(e, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement
                        if (input?.value.trim()) {
                          handleSubmit(e, input.value)
                          input.value = ''
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-yellow-400 text-zinc-900 text-sm font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Sources */}
              {displayedSources.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Sources</h3>
                  <div className="space-y-1">
                    {displayedSources.slice(0, 5).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-yellow-400 hover:text-yellow-300 truncate">
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        defaultBody={message}
        prospectName={formData.prospectName}
        company={formData.company}
      />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-zinc-950 items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>}>
      <HomeContent />
    </Suspense>
  )
}