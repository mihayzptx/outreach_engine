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
    messageType: 'LinkedIn Connection Request'
  })
  
  const [useLocal, setUseLocal] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const response = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...formData, useLocal})
    })
    
    const data = await response.json()
    setMessage(data.message)
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-white text-3xl">⚡</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Tech-stack.io</h1>
                <p className="text-blue-300 text-sm font-medium">AI Outreach Engine</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg px-5 py-3 rounded-xl border border-white/20">
              <span className="text-sm font-medium text-white/80">Model</span>
              <button
                onClick={() => setUseLocal(!useLocal)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${useLocal ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${useLocal ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-white">
                {useLocal ? '🏠 Local' : '☁️ Cloud'}
              </span>
            </div>
            <Link 
              href="/history" 
              className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/20 font-medium transition text-white"
            >
              📚 History
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">👤</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Prospect Details</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 transition"
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="VP Engineering"
                      className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 transition"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 transition"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Healthcare Tech"
                      className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 transition"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Business Context</label>
                  <textarea
                    placeholder="Recent funding, expansion plans, technical challenges..."
                    className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl h-36 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50 transition resize-none"
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Message Type</label>
                  <select
                    className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white cursor-pointer transition"
                    value={formData.messageType}
                    onChange={(e) => setFormData({...formData, messageType: e.target.value})}
                  >
                    <option className="bg-slate-900">LinkedIn Connection Request</option>
                    <option className="bg-slate-900">Email Cold Outreach</option>
                    <option className="bg-slate-900">Conference Follow-up</option>
                    <option className="bg-slate-900">Discovery Call Request</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 transition-all text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Generating Magic...
                    </span>
                  ) : (
                    '✨ Generate Message'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Generated Message</h2>
            </div>
            
            {!message && !loading ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative text-8xl">🎯</div>
                </div>
                <p className="text-white text-xl font-semibold mb-2">Ready to Generate</p>
                <p className="text-blue-300 text-sm">Fill in the details and let AI work its magic</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-blue-500/30 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                </div>
                <p className="text-white text-lg font-medium mt-6">Crafting your message...</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur border border-blue-400/30 rounded-xl p-6 shadow-lg">
                  <p className="text-white leading-relaxed whitespace-pre-wrap text-lg">{message}</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-500 hover:to-emerald-500 font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Message'}
                  </button>
                  <button
                    onClick={() => setMessage('')}
                    className="px-6 py-4 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl hover:bg-white/20 font-semibold transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}