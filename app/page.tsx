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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const response = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...formData, useLocal})
    })
    
    const data = await response.json()
    setMessage(data.message)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">📧</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Tech-stack.io Outreach</h1>
            </div>
            <p className="text-gray-600">AI-powered outreach message generator</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-300">
              <span className="text-sm font-medium text-gray-700">Model:</span>
              <button
                onClick={() => setUseLocal(!useLocal)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${useLocal ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${useLocal ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {useLocal ? 'Local (Ollama)' : 'Cloud (Groq)'}
              </span>
            </div>
            <Link 
              href="/history" 
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              View History
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">👤</span>
                <h2 className="text-xl font-bold text-gray-900">Prospect Information</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.prospectName}
                      onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="VP Engineering"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.prospectTitle}
                      onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Healthcare Technology"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Context</label>
                  <textarea
                    placeholder="Recent Series B funding, expanding engineering team, scaling infrastructure..."
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.context}
                    onChange={(e) => setFormData({...formData, context: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition text-lg"
                >
                  {loading ? 'Generating...' : '✨ Generate Message'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-gray-900">Generated Message</h2>
            </div>
            
            {!message ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500 text-lg">Ready to Generate</p>
                <p className="text-gray-400 text-sm mt-2">Fill in prospect details and click generate</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{message}</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(message)}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    📋 Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setMessage('')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
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