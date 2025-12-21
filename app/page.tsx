'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function HomeContent() {
  const [formData, setFormData] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    industry: '',
    context: '',
    messageType: 'LinkedIn Connection',
    messageHistory: '',
    messageLength: 'medium',
    toneOfVoice: 'professional',
    targetResult: '',
    sources: ''
  })
  
  const [useLocal, setUseLocal] = useState(false)
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

  const searchParams = useSearchParams()

  useEffect(() => {
    const company = searchParams.get('company')
    if (company) {
      setFormData({
        prospectName: searchParams.get('prospectName') || '',
        prospectTitle: searchParams.get('prospectTitle') || '',
        company: company,
        industry: searchParams.get('industry') || '',
        context: searchParams.get('context') || '',
        messageType: searchParams.get('messageType') || 'LinkedIn Connection',
        messageHistory: '',
        messageLength: 'medium',
        toneOfVoice: 'professional',
        targetResult: '',
        sources: searchParams.get('sources') || ''
      })
      showToast('Form pre-filled from saved company', 'success')
    }
  }, [searchParams])

  const showToast = (message: string, type: 'success' | 'warning' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent, adjustment?: string) => {
    e.preventDefault()
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
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...formData, useLocal, useWebResearch, adjustment})
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
        await fetch('/api/companies/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formData.company,
            industry: formData.industry,
            prospect_name: formData.prospectName,
            prospect_title: formData.prospectTitle,
            context: formData.context,
            message_type: formData.messageType
          })
        })
        showToast('Company saved for tracking', 'success')
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

  const bgGradient = useLocal 
    ? 'from-slate-900 via-emerald-950 to-slate-900' 
    : 'from-slate-900 via-blue-950 to-slate-900'

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
          </Link>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📊</span>
            <span>History</span>
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
                  onClick={() => setUseLocal(!useLocal)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-500 ${useLocal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${useLocal ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-semibold ${useLocal ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {useLocal ? 'Local' : 'Cloud'}
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
                <h3 className="text-lg font-bold text-white">Prospect Information</h3>
              </div>

              <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} text-white placeholder-slate-500`}
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
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} text-white placeholder-slate-500`}
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} text-white placeholder-slate-500`}
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Healthcare Tech"
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} text-white placeholder-slate-500`}
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Business Context</label>
                  <textarea
                    placeholder="Recent funding, expansion plans, technical challenges..."
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-24 focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} resize-none text-white placeholder-slate-500`}
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Sources / Links</label>
                  <textarea
                    placeholder="https://example.com/article"
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-16 focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} resize-none text-white placeholder-slate-500`}
                    value={formData.sources}
                    onChange={(e) => setFormData({...formData, sources: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Target Result</label>
                  <input
                    type="text"
                    placeholder="Schedule discovery call..."
                    className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 ${useLocal ? 'focus:ring-emerald-500/50' : 'focus:ring-blue-500/50'} text-white placeholder-slate-500`}
                    value={formData.targetResult}
                    onChange={(e) => setFormData({...formData, targetResult: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Type</label>
                    <select
                      className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm`}
                      value={formData.messageType}
                      onChange={(e) => setFormData({...formData, messageType: e.target.value})}
                    >
                      <option>LinkedIn Connection</option>
                      <option>Email Outreach</option>
                      <option>Conference Follow-up</option>
                      <option>Discovery Call</option>
                      <option>Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Length</label>
                    <select
                      className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm`}
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
                      className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm`}
                      value={formData.toneOfVoice}
                      onChange={(e) => setFormData({...formData, toneOfVoice: e.target.value})}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="direct">Direct</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>
                </div>

                {formData.messageType === 'Response' && (
                  <div className="border-t border-slate-700/50 pt-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Message History</label>
                    <textarea
                      placeholder="Paste conversation..."
                      className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl h-28 resize-none text-white placeholder-slate-500`}
                      value={formData.messageHistory}
                      onChange={(e) => setFormData({...formData, messageHistory: e.target.value})}
                      required
                    />
                  </div>
                )}

                <div className={`flex items-center gap-3 p-3 rounded-xl ${saveCompany ? (useLocal ? 'bg-emerald-900/30 border border-emerald-700/50' : 'bg-blue-900/30 border border-blue-700/50') : 'bg-slate-800/30 border border-slate-700/50'}`}>
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
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                    useLocal 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                  }`}
                >
                  {loading ? loadingStep || 'Generating...' : '✨ Generate Message'}
                </button>
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
                    <p className="text-slate-400 text-sm">Fill in the prospect details</p>
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
                          <span className="text-yellow-400 text-xs">⚠️ {metrics.warnings.length}</span>
                        )}
                      </div>
                    )}

                    <div className={`bg-slate-800/50 border rounded-xl p-5 min-h-48 ${useLocal ? 'border-emerald-700/30' : 'border-blue-700/30'}`}>
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{message}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleRegenerate} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50">
                        🔄 Regenerate
                      </button>
                      <button onClick={() => handleAdjust('shorter and more direct')} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50">
                        📏 Shorter
                      </button>
                      <button onClick={() => handleAdjust('longer with more detail')} disabled={loading} className="flex-1 py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-50">
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
                        className={`flex-1 py-3 rounded-xl font-semibold ${
                          copied ? 'bg-green-500 text-white' : useLocal ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy Message'}
                      </button>
                      <button
                        onClick={() => { setMessage(''); setDisplayedSources([]); setMetrics(null); }}
                        className="px-5 py-3 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 font-semibold"
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