'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Bulk() {
  const [prospects, setProspects] = useState<any[]>([])
  const [commonContext, setCommonContext] = useState('')
  const [useSpintax, setUseSpintax] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [useLocal, setUseLocal] = useState(false)

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
            messageType: 'LinkedIn Connection Request',
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

  const copyAll = () => {
    const text = results.map(r => 
      `${r.name} (${r.company})\n${r.message}\n\n`
    ).join('---\n\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-300 hover:text-white">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Bulk Message Generator</h1>
              <p className="text-xs lg:text-sm text-slate-400 mt-1">Generate messages for multiple prospects</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
            <span className="text-xs font-medium text-slate-300 hidden sm:inline">Model:</span>
            <button
              onClick={() => setUseLocal(!useLocal)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${useLocal ? 'bg-green-500' : 'bg-blue-500'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${useLocal ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs font-medium text-slate-300">{useLocal ? 'Local' : 'Cloud'}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Common Context Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Common Context</h3>
          <p className="text-sm text-slate-400 mb-4">This context will be applied to all prospects. You add prospect-specific details below.</p>
          
          <textarea
            placeholder="e.g., We help companies scale their DevOps infrastructure during hypergrowth phases..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-slate-500 text-sm mb-4"
            value={commonContext}
            onChange={(e) => setCommonContext(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="spintax"
              checked={useSpintax}
              onChange={(e) => setUseSpintax(e.target.checked)}
              className="w-5 h-5 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="spintax" className="text-sm font-medium text-slate-300">
              Use Spintax (Generate unique variations for each message)
            </label>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Upload Prospects</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <p className="font-semibold text-white mb-1">Upload CSV File</p>
                <p className="text-sm text-slate-400">Format: Name, Title, Company, Industry, Additional Context</p>
              </label>
            </div>

            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer" onClick={handleManualAdd}>
              <div className="text-4xl mb-2">➕</div>
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
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {prospects.map((prospect, index) => (
                  <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={prospect.name}
                        onChange={(e) => updateProspect(index, 'name', e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                      />
                      <input
                        type="text"
                        placeholder="Title"
                        value={prospect.title}
                        onChange={(e) => updateProspect(index, 'title', e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={prospect.company}
                        onChange={(e) => updateProspect(index, 'company', e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Industry"
                        value={prospect.industry}
                        onChange={(e) => updateProspect(index, 'industry', e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Additional Context (Optional)"
                          value={prospect.additionalContext}
                          onChange={(e) => updateProspect(index, 'additionalContext', e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                        />
                        <button
                          onClick={() => removeProspect(index)}
                          className="px-3 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 text-sm"
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 transition-all shadow-lg"
              >
                {loading ? `Generating ${results.length + 1}/${prospects.length}...` : `✨ Generate ${prospects.length} Messages`}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Generated Messages ({results.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  📋 Copy All
                </button>
                <button
                  onClick={downloadCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  💾 Download CSV
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">{result.name}</p>
                      <p className="text-sm text-slate-400">{result.title} at {result.company}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.message)}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="bg-slate-800 border border-slate-600 rounded p-4">
                    <p className="text-slate-100 text-sm whitespace-pre-wrap">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}