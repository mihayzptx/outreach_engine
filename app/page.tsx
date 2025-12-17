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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-30 h-full flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">TS</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Tech-stack.io</h2>
              <p className="text-xs text-gray-500">Outreach Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium"
          >
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </button>
          <Link 
            href="/history" 
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
          >
            <span className="text-xl">📊</span>
            <span>History</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Message Generator</h1>
                <p className="text-xs lg:text-sm text-gray-500 mt-1 hidden sm:block">Create personalized outreach messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <span className="text-xs font-medium text-gray-700 hidden sm:inline">Model:</span>
              <button
                onClick={() => setUseLocal(!useLocal)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${useLocal ? 'bg-green-500' : 'bg-blue-500'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${useLocal ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs font-medium text-gray-700">{useLocal ? 'Local' : 'Cloud'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-7xl mx-auto">
            {/* Input Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-4 lg:px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Prospect Information</h3>
                <p className="text-sm text-gray-500 mt-1">Enter details about your target</p>
              </div>

              <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      placeholder="VP Engineering"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Healthcare Tech"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Context</label>
                  <textarea
                    placeholder="Recent funding, expansion plans, technical challenges..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 lg:h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={formData.messageType}
                    onChange={(e) => setFormData({...formData, messageType: e.target.value})}
                  >
                    <option>LinkedIn Connection Request</option>
                    <option>Email Cold Outreach</option>
                    <option>Conference Follow-up</option>
                    <option>Discovery Call Request</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 lg:py-4 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-lg text-sm lg:text-base"
                >
                  {loading ? 'Generating...' : '✨ Generate Message'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-4 lg:px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Generated Message</h3>
                <p className="text-sm text-gray-500 mt-1">AI-crafted personalized outreach</p>
              </div>
              
              <div className="p-4 lg:p-6">
                {!message && !loading ? (
                  <div className="flex flex-col items-center justify-center h-64 lg:h-96 text-center">
                    <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                      <span className="text-3xl lg:text-5xl">🎯</span>
                    </div>
                    <p className="text-gray-900 text-base lg:text-lg font-semibold mb-2">Ready to Generate</p>
                    <p className="text-gray-500 text-xs lg:text-sm">Fill in the prospect details</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-64 lg:h-96">
                    <div className="relative w-12 h-12 lg:w-16 lg:h-16">
                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-900 text-base lg:text-lg font-semibold mt-4 lg:mt-6">Generating...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 lg:p-6">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm lg:text-base">{message}</p>
                    </div>
                    
                    <div className="flex gap-2 lg:gap-3">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all text-sm lg:text-base ${
                          copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => setMessage('')}
                        className="px-4 lg:px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition text-sm lg:text-base"
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