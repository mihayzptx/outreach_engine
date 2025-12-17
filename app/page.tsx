'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
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
  const [message, setMessage] = useState('')
  const [displayedSources, setDisplayedSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setDisplayedSources([])
    
    const response = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...formData, useLocal, useWebResearch})
    })
    
    const data = await response.json()
    setMessage(data.message)
    
    // Parse sources
    if (formData.sources.trim()) {
      const sourcesList = formData.sources
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      setDisplayedSources(sourcesList)
    }
    
    // Add web research sources if returned
    if (data.researchSources && data.researchSources.length > 0) {
      setDisplayedSources(prev => [...prev, ...data.researchSources])
    }
    
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
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
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </button>
          <Link 
            href="/bulk" 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
          >
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </Link>
          <Link 
            href="/history" 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg font-medium"
          >
            <span className="text-xl">📊</span>
            <span>History</span>
          </Link>
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
                <h1 className="text-xl lg:text-2xl font-bold text-white">Message Generator</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">Create personalized outreach messages</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                <span className="text-xs font-medium text-slate-300 hidden sm:inline">Model:</span>
                <button
                  onClick={() => setUseLocal(!useLocal)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${useLocal ? 'bg-green-500' : 'bg-blue-500'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${useLocal ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-medium text-white">{useLocal ? 'Local' : 'Cloud'}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                <span className="text-xs font-medium text-slate-300 hidden sm:inline">Web Research:</span>
                <button
                  onClick={() => setUseWebResearch(!useWebResearch)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${useWebResearch ? 'bg-purple-500' : 'bg-gray-500'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${useWebResearch ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-medium text-white">{useWebResearch ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-7xl mx-auto">
            {/* Input Form */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
              <div className="border-b border-slate-700 px-4 lg:px-6 py-4">
                <h3 className="text-lg font-bold text-white">Prospect Information</h3>
                <p className="text-sm text-slate-400 mt-1">Enter details about your target</p>
              </div>

              <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Job Title</label>
                    <input
                      type="text"
                      placeholder="VP Engineering"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Healthcare Tech"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Business Context</label>
                  <textarea
                    placeholder="Recent funding, expansion plans, technical challenges..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-white placeholder-slate-500 text-base"
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Sources / Links (Optional)</label>
                  <p className="text-xs text-slate-400 mb-2">Add URLs or references (one per line). These will be displayed after generation.</p>
                  <textarea
                    placeholder="https://techcrunch.com/article
Company blog post about expansion
LinkedIn profile insights"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-white placeholder-slate-500 text-base"
                    value={formData.sources}
                    onChange={(e) => setFormData({...formData, sources: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Target Result</label>
                  <input
                    type="text"
                    placeholder="Schedule discovery call, get response, book meeting..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 text-base"
                    value={formData.targetResult}
                    onChange={(e) => setFormData({...formData, targetResult: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Message Type</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-base"
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
                    <label className="block text-sm font-semibold text-white mb-2">Message Length</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-base"
                      value={formData.messageLength}
                      onChange={(e) => setFormData({...formData, messageLength: e.target.value})}
                    >
                      <option value="short">Short (2-3)</option>
                      <option value="medium">Medium (3-4)</option>
                      <option value="long">Long (5-6)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Tone</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-base"
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

                {/* Conditional Message History Field */}
                {formData.messageType === 'Response' && (
                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <label className="block text-sm font-semibold text-white mb-2">Message History</label>
                    <p className="text-xs text-slate-400 mb-2">Paste the conversation history you're responding to</p>
                    <textarea
                      placeholder="Their message:
Hi Michael, thanks for reaching out...

Your previous message:
Hey John, I saw that you're working on..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-white placeholder-slate-500 text-base"
                      value={formData.messageHistory}
                      onChange={(e) => setFormData({...formData, messageHistory: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 transition-all shadow-lg text-base"
                >
                  {loading ? 'Generating...' : '✨ Generate Message'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
              <div className="border-b border-slate-700 px-4 lg:px-6 py-4">
                <h3 className="text-lg font-bold text-white">Generated Message</h3>
                <p className="text-sm text-slate-400 mt-1">AI-crafted personalized outreach</p>
              </div>
              
              <div className="p-4 lg:p-6">
                {!message && !loading ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6">
                      <span className="text-5xl">🎯</span>
                    </div>
                    <p className="text-white text-lg font-semibold mb-2">Ready to Generate</p>
                    <p className="text-slate-400 text-sm">Fill in the prospect details</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-96">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-white text-lg font-semibold mt-6">
                      {useWebResearch ? 'Researching & Generating...' : 'Generating...'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 min-h-64">
                      <p className="text-white leading-relaxed whitespace-pre-wrap text-base">{message}</p>
                    </div>

                    {/* Display Sources */}
                    {displayedSources.length > 0 && (
                      <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <span>🔗</span>
                          <span>Sources Used</span>
                        </h4>
                        <div className="space-y-2">
                          {displayedSources.map((source, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-slate-500 text-sm mt-0.5">{index + 1}.</span>
                              {isValidUrl(source) ? (
                                <a 
                                  href={source} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm underline break-all"
                                >
                                  {source}
                                </a>
                              ) : (
                                <span className="text-slate-300 text-sm">{source}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all text-base ${
                          copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => {
                          setMessage('')
                          setDisplayedSources([])
                        }}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-semibold transition text-base"
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