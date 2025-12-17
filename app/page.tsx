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
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">TS</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tech-stack.io</h2>
                <p className="text-xs text-gray-500">Outreach Engine</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold">TS</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium">
            <span className="text-xl">✨</span>
            {sidebarOpen && <span>Generate</span>}
          </button>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
            <span className="text-xl">📊</span>
            {sidebarOpen && <span>History</span>}
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
            <span className="text-xl">⚙️</span>
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Message Generator</h1>
              <p className="text-sm text-gray-500 mt-1">Create personalized outreach messages with AI</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Model:</span>
                <button
                  onClick={() => setUseLocal(!useLocal)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${useLocal ? 'bg-green-500' : 'bg-blue-500'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${useLocal ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">{useLocal ? 'Local' : 'Cloud'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Generated</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">247</p>
                  <p className="text-sm text-green-600 mt-2">↑ 12% from last week</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Response Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">68%</p>
                  <p className="text-sm text-green-600 mt-2">↑ 5% from last week</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Prospects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">89</p>
                  <p className="text-sm text-blue-600 mt-2">23 new this week</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Time Saved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">15m</p>
                  <p className="text-sm text-gray-600 mt-2">per message</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Prospect Information</h3>
                <p className="text-sm text-gray-500 mt-1">Enter details about your target prospect</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-lg"
                >
                  {loading ? 'Generating...' : '✨ Generate Message'}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Generated Message</h3>
                <p className="text-sm text-gray-500 mt-1">AI-crafted personalized outreach</p>
              </div>
              
              <div className="p-6">
                {!message && !loading ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-5xl">🎯</span>
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mb-2">Ready to Generate</p>
                    <p className="text-gray-500 text-sm">Fill in the prospect details to create a message</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center h-96">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mt-6">Generating message...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                          copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy Message'}
                      </button>
                      <button
                        onClick={() => setMessage('')}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-3 font-semibold">Quick Actions</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                          📧 Send via Email
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                          💼 Post to LinkedIn
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                          💾 Save to CRM
                        </button>
                      </div>
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