'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import UserNav from '@/components/UserNav'

interface Lead {
  prospectName: string
  prospectTitle: string
  company: string
  industry: string
  context: string
  email?: string
}

interface GeneratedMessage {
  lead: Lead
  message: string
  status: 'pending' | 'generating' | 'done' | 'error'
}

export default function BulkPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [messages, setMessages] = useState<GeneratedMessage[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messageType, setMessageType] = useState('LinkedIn Connection')
  const [useWebResearch, setUseWebResearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('company'))
      const titleIdx = headers.findIndex(h => h.includes('title'))
      const companyIdx = headers.findIndex(h => h.includes('company'))
      const industryIdx = headers.findIndex(h => h.includes('industry'))
      const contextIdx = headers.findIndex(h => h.includes('context'))
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const parsedLeads: Lead[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        if (values[nameIdx]) {
          parsedLeads.push({
            prospectName: values[nameIdx] || '', prospectTitle: values[titleIdx] || '',
            company: values[companyIdx] || '', industry: values[industryIdx] || '',
            context: values[contextIdx] || '', email: values[emailIdx] || ''
          })
        }
      }
      setLeads(parsedLeads)
      setMessages([])
    }
    reader.readAsText(file)
  }

  const generateAll = async () => {
    if (leads.length === 0) return
    setProcessing(true)
    setProgress(0)
    const initial: GeneratedMessage[] = leads.map(lead => ({ lead, message: '', status: 'pending' }))
    setMessages(initial)
    for (let i = 0; i < leads.length; i++) {
      setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'generating' } : m))
      try {
        const res = await fetch('/api/outreach', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...leads[i], messageType, useWebResearch, messageLength: 'medium', toneOfVoice: 'professional' })
        })
        const data = await res.json()
        setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, message: data.message, status: 'done' } : m))
      } catch {
        setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'error' } : m))
      }
      setProgress(Math.round(((i + 1) / leads.length) * 100))
      await new Promise(r => setTimeout(r, 300))
    }
    setProcessing(false)
  }

  const exportCSV = () => {
    const rows = [['Name','Title','Company','Industry','Email','Message'],
      ...messages.map(m => [m.lead.prospectName, m.lead.prospectTitle, m.lead.company, m.lead.industry, m.lead.email || '', `"${m.message.replace(/"/g, '""')}"`])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `outreach-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const clearAll = () => { setLeads([]); setMessages([]); setProgress(0); if (fileInputRef.current) fileInputRef.current.value = '' }

  return (
    <div className="flex h-screen bg-zinc-950">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-56 bg-zinc-900 border-r border-zinc-800 z-30 h-full flex flex-col transition-transform`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center"><span className="text-zinc-900 font-black text-sm">TS</span></div>
            <div><h2 className="font-bold text-white text-sm">Tech-stack.io</h2><p className="text-[10px] text-zinc-500">Outreach Engine</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">✨ Generate</Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">📦 Bulk</button>
          <Link href="/saved" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">💾 Saved</Link>
          <Link href="/history" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">📊 History</Link>
          <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">⚙️ Settings</Link>
        </nav>
        <div className="p-4 border-t border-slate-700/50">
  <UserNav />
</div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">Bulk Generate</h1>
            </div>
            <div className="flex items-center gap-2">
              {messages.some(m => m.status === 'done') && <button onClick={exportCSV} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium">Export CSV</button>}
              {leads.length > 0 && <button onClick={clearAll} className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm">Clear</button>}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Upload CSV</h3>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-yellow-400/50 transition-colors">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="text-4xl block mb-3">📄</span>
                <p className="text-white font-medium">Drop CSV or click to upload</p>
                <p className="text-zinc-500 text-sm mt-1">Columns: name, company, context (required)</p>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Message Type</label>
                <select value={messageType} onChange={e => setMessageType(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                  <option>LinkedIn Connection</option><option>LinkedIn Message</option><option>Cold Email</option><option>Follow-up Email</option><option>ABM</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border w-full ${useWebResearch ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                  <input type="checkbox" checked={useWebResearch} onChange={e => setUseWebResearch(e.target.checked)} className="sr-only" />
                  <span className="text-sm">🔍 Web Research</span>
                </label>
              </div>
            </div>
          </div>

          {leads.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase">{leads.length} Leads</h3>
                <button onClick={generateAll} disabled={processing} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50">
                  {processing ? `${progress}%` : 'Generate All'}
                </button>
              </div>
              {processing && <div className="h-2 bg-zinc-800 rounded-full mb-4 overflow-hidden"><div className="h-full bg-yellow-400 transition-all" style={{width:`${progress}%`}}/></div>}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(messages.length > 0 ? messages : leads.map(l => ({lead:l,message:'',status:'pending' as const}))).map((item, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${item.status==='done'?'bg-emerald-950/20 border-emerald-900/50':item.status==='generating'?'bg-yellow-950/20 border-yellow-900/50':item.status==='error'?'bg-red-950/20 border-red-900/50':'bg-zinc-950 border-zinc-800'}`}>
                    <div className="flex items-center justify-between">
                      <div><span className="text-white text-sm font-medium">{item.lead.prospectName}</span><span className="text-zinc-500 text-sm"> · {item.lead.company}</span></div>
                      <span className={`text-xs px-2 py-0.5 rounded ${item.status==='done'?'bg-emerald-500/20 text-emerald-400':item.status==='generating'?'bg-yellow-500/20 text-yellow-400':item.status==='error'?'bg-red-500/20 text-red-400':'bg-zinc-800 text-zinc-500'}`}>
                        {item.status==='generating'?'⏳':item.status==='done'?'✓':item.status==='error'?'✗':'○'}
                      </span>
                    </div>
                    {item.message && <p className="text-zinc-300 text-sm mt-2 pt-2 border-t border-zinc-800 whitespace-pre-wrap">{item.message}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase mb-2">CSV Format</p>
            <code className="text-xs text-zinc-400 block bg-zinc-950 p-2 rounded">name,title,company,industry,context,email</code>
          </div>
        </div>
      </main>
    </div>
  )
}
