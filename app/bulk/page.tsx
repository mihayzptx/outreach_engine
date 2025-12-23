'use client'

import { useState } from 'react'
import Link from 'next/link'
import UserNav from '@/components/UserNav'


export default function Bulk() {
  const [prospects, setProspects] = useState<any[]>([])
  const [commonContext, setCommonContext] = useState('')
  const [useSpintax, setUseSpintax] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [useLocal, setUseLocal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim())
        return {
          name: values[0] || '',
          title: values[1] || '',
          company: values[2] || '',
          industry: values[3] || '',
          additionalContext: values[4] || ''
        }
      })
      
      setProspects(data)
    }
    reader.readAsText(file)
  }

  const handleManualAdd = () => {
    setProspects([...prospects, {
      name: '',
      title: '',
      company: '',
      industry: '',
      additionalContext: ''
    }])
  }

  const updateProspect = (index: number, field: string, value: string) => {
    const updated = [...prospects]
    updated[index][field] = value
    setProspects(updated)
  }

  const removeProspect = (index: number) => {
    setProspects(prospects.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    setLoading(true)
    setResults([])

    for (const prospect of prospects) {
      try {
        const fullContext = [commonContext, prospect.additionalContext].filter(Boolean).join('. ')
        
        const response = await fetch('/api/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prospectName: prospect.name,
            prospectTitle: prospect.title,
            company: prospect.company,
            industry: prospect.industry,
            context: fullContext,
            messageType: 'LinkedIn Connection',
            useLocal,
            useSpintax
          })
        })
        
        const data = await response.json()
        setResults(prev => [...prev, {
          ...prospect,
          message: data.message,
          status: 'success'
        }])
      } catch (error) {
        setResults(prev => [...prev, {
          ...prospect,
          message: 'Error generating message',
          status: 'error'
        }])
      }
    }
    
    setLoading(false)
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Title', 'Company', 'Industry', 'Additional Context', 'Generated Message']
    const rows = results.map(r => [
      r.name,
      r.title,
      r.company,
      r.industry,
      r.additionalContext,
      r.message
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'outreach-messages.csv'
    a.click()
  }

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = () => {
    const text = results.map(r => 
      `${r.name} (${r.company})\n${r.message}\n\n`
    ).join('---\n\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
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
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg">
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </button>
          <Link href="/saved" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">💾</span>
            <span>Saved Companies</span>
          </Link>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📊</span>
            <span>History</span>
          </Link>
          <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </Link>
          <div className="p-4 border-t border-slate-700/50">
  <UserNav />
</div>
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${useLocal ? 'bg-emerald-900/30' : 'bg-blue-900/30'} transition-all`}>
            <div className={`w-2 h-2 rounded-full ${useLocal ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`}></div>
            <span className="text-xs text-slate-300">{useLocal ? '🏠 Local Model' : '☁️ Cloud Model'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-800/50 rounded-xl text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">Bulk Message Generator</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1 hidden sm:block">Generate messages for multiple prospects</p>
              </div>
            </div>
            
            {/* Model Toggle */}
            <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
              <span className="text-xs font-medium text-slate-400 hidden sm:inline">Model:</span>
              <button
                onClick={() => setUseLocal(!useLocal)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${useLocal ? 'bg-emerald-500' : 'bg-blue-500'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-lg ${useLocal ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs font-medium text-slate-300">{useLocal ? 'Local' : 'Cloud'}</span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Common Context Section */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-2">Common Context</h3>
              <p className="text-sm text-slate-400 mb-4">This context will be applied to all prospects. Add prospect-specific details below.</p>
              
              <textarea
                placeholder="e.g., We help companies scale their DevOps infrastructure during hypergrowth phases..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl h-24 focus:ring-2 focus:ring-blue-500/50 resize-none text-white placeholder-slate-500 mb-4"
                value={commonContext}
                onChange={(e) => setCommonContext(e.target.value)}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSpintax}
                  onChange={(e) => setUseSpintax(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-300">
                  Use Spintax (Generate unique variations for each message)
                </span>
              </label>
            </div>

            {/* Upload Section */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Upload Prospects</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-dashed border-slate-600/50 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                    <p className="font-semibold text-white mb-1">Upload CSV File</p>
                    <p className="text-sm text-slate-400">Format: Name, Title, Company, Industry, Context</p>
                  </label>
                </div>

                <div 
                  className="border-2 border-dashed border-slate-600/50 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all cursor-pointer" 
                  onClick={handleManualAdd}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                    <span className="text-3xl">➕</span>
                  </div>
                  <p className="font-semibold text-white mb-1">Add Manually</p>
                  <p className="text-sm text-slate-400">Enter prospects one by one</p>
                </div>
              </div>

              {/* Prospects List */}
              {prospects.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{prospects.length} Prospects Added</p>
                    <button
                      onClick={() => setProspects([])}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {prospects.map((prospect, index) => (
                      <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Name"
                            value={prospect.name}
                            onChange={(e) => updateProspect(index, 'name', e.target.value)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500"
                          />
                          <input
                            type="text"
                            placeholder="Title"
                            value={prospect.title}
                            onChange={(e) => updateProspect(index, 'title', e.target.value)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={prospect.company}
                            onChange={(e) => updateProspect(index, 'company', e.target.value)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Industry"
                            value={prospect.industry}
                            onChange={(e) => updateProspect(index, 'industry', e.target.value)}
                            className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Additional Context (Optional)"
                              value={prospect.additionalContext}
                              onChange={(e) => updateProspect(index, 'additionalContext', e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500"
                            />
                            <button
                              onClick={() => removeProspect(index)}
                              className="px-3 py-2 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50 text-sm transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || prospects.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-600 transition-all shadow-lg"
                  >
                    {loading ? `Generating ${results.length + 1}/${prospects.length}...` : `✨ Generate ${prospects.length} Messages`}
                  </button>
                </div>
              )}
            </div>

            {/* Results Section */}
            {results.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-lg font-bold text-white">Generated Messages ({results.length})</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyAll}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-medium text-sm shadow-lg transition-all"
                    >
                      📋 Copy All
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 font-medium text-sm shadow-lg transition-all"
                    >
                      💾 Download CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-white">{result.name}</p>
                          <p className="text-sm text-slate-400">{result.title} at {result.company}</p>
                        </div>
                        <button
                          onClick={() => copyMessage(result.message, index)}
                          className={`px-3 py-1 rounded-lg text-sm transition-all ${
                            copiedIndex === index 
                              ? 'bg-green-600 text-white' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                          }`}
                        >
                          {copiedIndex === index ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <p className="text-white text-sm whitespace-pre-wrap">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
