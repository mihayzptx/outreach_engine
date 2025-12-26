'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/sidebar'

interface Prospect {
  prospect_name: string
  prospect_title: string
  company: string
  email: string
  linkedin?: string
  variables: Record<string, string>
  researched?: boolean
  hooks?: string[]
}

interface Touch {
  step_number: number
  channel: string
  day_number: number
  goal: string
  template: string
}

interface Campaign {
  id?: number
  name: string
  variables: string[]
  touches: Touch[]
  prospects: Prospect[]
  created_at?: string
}

const CHANNELS = [
  { value: 'LinkedIn Connection', label: 'LinkedIn Connection', icon: '🔗' },
  { value: 'LinkedIn Message', label: 'LinkedIn Message', icon: '💬' },
  { value: 'Cold Email', label: 'Cold Email', icon: '📧' },
  { value: 'Follow-up Email', label: 'Follow-up Email', icon: '📨' },
  { value: 'ABM', label: 'ABM (Recognition)', icon: '🎯' }
]

const DEFAULT_VARIABLES = ['name', 'company', 'title', 'achievement', 'pain_point', 'hook']

const TEMPLATE_SUGGESTIONS = [
  { channel: 'LinkedIn Connection', template: 'Hi {name}, noticed {company} {achievement}. Would love to connect and learn more about your approach.' },
  { channel: 'LinkedIn Message', template: 'Thanks for connecting, {name}! {hook} - curious how {company} is handling {pain_point}?' },
  { channel: 'Cold Email', template: 'Hi {name},\n\n{hook}\n\nAt Tech-stack.io, we help companies like {company} tackle {pain_point}.\n\nWorth a quick chat?\n\nBest' },
  { channel: 'Follow-up Email', template: 'Hi {name}, following up on my last note. {hook} - would love to share how we helped similar companies.\n\n15 mins this week?' },
  { channel: 'ABM', template: 'Congrats on {achievement}, {name}! Impressive work at {company}.' }
]

export default function CampaignsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignIdx, setSelectedCampaignIdx] = useState<number | null>(null)
  const [step, setStep] = useState<'list' | 'upload' | 'research' | 'builder' | 'export'>('list')
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null)
  
  // Campaign data
  const [campaign, setCampaign] = useState<Campaign>({
    name: '',
    variables: DEFAULT_VARIABLES,
    touches: [],
    prospects: []
  })
  
  // UI state
  const [researching, setResearching] = useState(false)
  const [researchProgress, setResearchProgress] = useState({ current: 0, total: 0 })
  const [selectedTouch, setSelectedTouch] = useState(0)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [newVariable, setNewVariable] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) }).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // Load campaigns
  useEffect(() => {
    const saved = localStorage.getItem('campaigns')
    if (saved) {
      try { setCampaigns(JSON.parse(saved)) } catch {}
    }
  }, [])

  const saveCampaigns = (updated: Campaign[]) => {
    setCampaigns(updated)
    localStorage.setItem('campaigns', JSON.stringify(updated))
  }

  // Create new campaign
  const startNewCampaign = () => {
    setCampaign({
      name: `Campaign ${campaigns.length + 1}`,
      variables: DEFAULT_VARIABLES,
      touches: [],
      prospects: [],
      created_at: new Date().toISOString()
    })
    setStep('upload')
  }

  // Open existing campaign
  const openCampaign = (idx: number) => {
    setSelectedCampaignIdx(idx)
    setCampaign(campaigns[idx])
    setStep('builder')
  }

  // Save current campaign
  const saveCampaign = () => {
    if (selectedCampaignIdx !== null) {
      const updated = [...campaigns]
      updated[selectedCampaignIdx] = campaign
      saveCampaigns(updated)
    } else {
      saveCampaigns([...campaigns, campaign])
      setSelectedCampaignIdx(campaigns.length)
    }
  }

  // Delete campaign
  const deleteCampaign = (idx: number) => {
    if (!confirm('Delete this campaign?')) return
    saveCampaigns(campaigns.filter((_, i) => i !== idx))
  }

  // Back to list
  const backToList = () => {
    saveCampaign()
    setSelectedCampaignIdx(null)
    setStep('list')
  }

  // STEP 1: Upload CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) return
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))
      const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('company'))
      const titleIdx = headers.findIndex(h => h.includes('title'))
      const companyIdx = headers.findIndex(h => h.includes('company'))
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const linkedinIdx = headers.findIndex(h => h.includes('linkedin'))
      
      const parsed: Prospect[] = []
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted CSV values
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of lines[i]) {
          if (char === '"') inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
          else current += char
        }
        values.push(current.trim())
        
        if (values[nameIdx] || values[companyIdx]) {
          parsed.push({
            prospect_name: values[nameIdx]?.replace(/^"|"$/g, '') || '',
            prospect_title: values[titleIdx]?.replace(/^"|"$/g, '') || '',
            company: values[companyIdx]?.replace(/^"|"$/g, '') || '',
            email: values[emailIdx]?.replace(/^"|"$/g, '') || '',
            linkedin: values[linkedinIdx]?.replace(/^"|"$/g, '') || '',
            variables: {
              name: values[nameIdx]?.replace(/^"|"$/g, '') || '',
              company: values[companyIdx]?.replace(/^"|"$/g, '') || '',
              title: values[titleIdx]?.replace(/^"|"$/g, '') || ''
            },
            researched: false,
            hooks: []
          })
        }
      }
      
      setCampaign({ ...campaign, prospects: parsed })
      setStep('research')
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // STEP 2: Research all prospects
  const researchAll = async () => {
    setResearching(true)
    setResearchProgress({ current: 0, total: campaign.prospects.length })
    
    const updated = [...campaign.prospects]
    
    for (let i = 0; i < updated.length; i++) {
      const p = updated[i]
      if (!p.company) continue
      
      try {
        // Get signal settings from localStorage
        let signalSettings = null
        try {
          const stored = localStorage.getItem('llm-settings')
          if (stored) {
            const settings = JSON.parse(stored)
            signalSettings = settings.signalSettings
          }
        } catch {}
        
        const res = await fetch('/api/companies/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: 0, company_name: p.company, industry: '', signalSettings })
        })
        const data = await res.json()
        
        if (data.success && data.signals?.detected) {
          const signals = data.signals.detected
          const hooks: string[] = []
          
          // Extract hooks and fill variables
          signals.forEach((s: any) => {
            hooks.push(`${s.label}: ${s.detail}`)
            
            if (s.category === 'funding') {
              updated[i].variables['achievement'] = s.detail
              updated[i].variables['hook'] = `Saw ${p.company} just ${s.detail.toLowerCase()}`
            } else if (s.category === 'hiring') {
              updated[i].variables['pain_point'] = 'scaling the engineering team'
              if (!updated[i].variables['hook']) {
                updated[i].variables['hook'] = `Noticed ${p.company} is growing the team`
              }
            } else if (s.category === 'leadership') {
              if (!updated[i].variables['achievement']) {
                updated[i].variables['achievement'] = s.detail
              }
              updated[i].variables['hook'] = `Congrats on ${s.detail.toLowerCase()}`
            } else if (s.category === 'product') {
              updated[i].variables['hook'] = `Saw the news about ${s.detail.toLowerCase()}`
            } else if (s.category === 'acquisition') {
              updated[i].variables['achievement'] = s.detail
              updated[i].variables['hook'] = `Big news about ${s.detail.toLowerCase()}`
            }
          })
          
          // Default hook if none found
          if (!updated[i].variables['hook'] && signals.length > 0) {
            updated[i].variables['hook'] = `Been following ${p.company}'s recent updates`
          }
          
          updated[i].hooks = hooks
          updated[i].researched = true
        }
      } catch (e) {
        console.error('Research failed for', p.company)
      }
      
      setResearchProgress({ current: i + 1, total: campaign.prospects.length })
      setCampaign({ ...campaign, prospects: [...updated] })
    }
    
    setCampaign({ ...campaign, prospects: updated })
    setResearching(false)
  }

  // STEP 3: Campaign Builder
  const addTouch = (channel?: string) => {
    const suggestion = channel ? TEMPLATE_SUGGESTIONS.find(t => t.channel === channel) : null
    const newTouch: Touch = {
      step_number: campaign.touches.length + 1,
      channel: channel || 'LinkedIn Connection',
      day_number: campaign.touches.length === 0 ? 1 : (campaign.touches[campaign.touches.length - 1].day_number + 3),
      goal: '',
      template: suggestion?.template || ''
    }
    setCampaign({ ...campaign, touches: [...campaign.touches, newTouch] })
    setSelectedTouch(campaign.touches.length)
  }

  const updateTouch = (field: keyof Touch, value: any) => {
    const updated = [...campaign.touches]
    updated[selectedTouch] = { ...updated[selectedTouch], [field]: value }
    
    // Auto-suggest template when channel changes
    if (field === 'channel' && !updated[selectedTouch].template) {
      const suggestion = TEMPLATE_SUGGESTIONS.find(t => t.channel === value)
      if (suggestion) updated[selectedTouch].template = suggestion.template
    }
    
    setCampaign({ ...campaign, touches: updated })
  }

  const removeTouch = (idx: number) => {
    const updated = campaign.touches.filter((_, i) => i !== idx).map((t, i) => ({ ...t, step_number: i + 1 }))
    setCampaign({ ...campaign, touches: updated })
    if (selectedTouch >= updated.length) setSelectedTouch(Math.max(0, updated.length - 1))
  }

  const generateTemplate = async () => {
    if (!campaign.touches[selectedTouch]) return
    setGenerating(true)
    
    try {
      const touch = campaign.touches[selectedTouch]
      const sampleProspect = campaign.prospects.find(p => p.researched) || campaign.prospects[0]
      
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: { default_tone: 'professional', default_length: 'short' },
          prospect: { 
            prospect_name: '{name}', 
            company: '{company}', 
            prospect_title: '{title}',
            context: sampleProspect?.hooks?.join('. ') || ''
          },
          touch: { channel: touch.channel, goal: touch.goal, custom_instructions: 'Use {variable} format for personalization' },
          availableVariables: campaign.variables
        })
      })
      const data = await res.json()
      if (data.message) {
        updateTouch('template', data.message)
      }
    } catch (e) {
      console.error('Generation failed:', e)
    }
    
    setGenerating(false)
  }

  // Variables
  const addVariable = () => {
    const v = newVariable.trim().toLowerCase().replace(/\s+/g, '_')
    if (!v || campaign.variables.includes(v)) return
    setCampaign({ ...campaign, variables: [...campaign.variables, v] })
    setNewVariable('')
  }

  const removeVariable = (v: string) => {
    if (['name', 'company', 'title'].includes(v)) return
    setCampaign({ ...campaign, variables: campaign.variables.filter(x => x !== v) })
  }

  const updateProspectVariable = (pIdx: number, varName: string, value: string) => {
    const updated = [...campaign.prospects]
    updated[pIdx].variables[varName] = value
    setCampaign({ ...campaign, prospects: updated })
  }

  // Render message
  const renderMessage = (template: string, prospect: Prospect): string => {
    let msg = template
    Object.entries(prospect.variables).forEach(([key, val]) => {
      msg = msg.replace(new RegExp(`\\{${key}\\}`, 'gi'), val || `{${key}}`)
    })
    return msg
  }

  const copyMessage = (pIdx: number, tIdx: number) => {
    const msg = renderMessage(campaign.touches[tIdx].template, campaign.prospects[pIdx])
    navigator.clipboard.writeText(msg)
    setCopiedIdx(pIdx * 100 + tIdx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // STEP 4: Export
  const exportContacts = () => {
    const varCols = campaign.variables.filter(v => !['name', 'company', 'title'].includes(v))
    const headers = ['name', 'title', 'company', 'email', 'linkedin', ...varCols.map(v => v)]
    const rows = [headers]
    
    campaign.prospects.forEach(p => {
      rows.push([
        p.prospect_name,
        p.prospect_title,
        p.company,
        p.email,
        p.linkedin || '',
        ...varCols.map(v => `"${(p.variables[v] || '').replace(/"/g, '""')}"`)
      ])
    })
    
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${campaign.name}-contacts.csv`
    a.click()
  }

  const getChannelIcon = (channel: string) => CHANNELS.find(c => c.value === channel)?.icon || '📝'

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              
              {step === 'list' && <h1 className="text-lg font-semibold text-white">Campaigns</h1>}
              
              {step !== 'list' && (
                <>
                  <button onClick={backToList} className="text-zinc-400 hover:text-white">←</button>
                  <input 
                    type="text" 
                    value={campaign.name} 
                    onChange={e => setCampaign({ ...campaign, name: e.target.value })}
                    className="bg-transparent text-white text-lg font-semibold border-b border-transparent hover:border-zinc-600 focus:border-yellow-400 outline-none"
                  />
                </>
              )}
            </div>
            
            {/* Progress steps */}
            {step !== 'list' && (
              <div className="flex items-center gap-1">
                {['upload', 'research', 'builder', 'export'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      step === s ? 'bg-yellow-400 text-zinc-900' : 
                      ['upload', 'research', 'builder', 'export'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {i + 1}
                    </div>
                    {i < 3 && <div className={`w-8 h-0.5 ${['upload', 'research', 'builder', 'export'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          
          {/* CAMPAIGNS LIST */}
          {step === 'list' && (
            <>
              <div className="flex justify-end mb-6">
                <button onClick={startNewCampaign} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300">+ New Campaign</button>
              </div>
              
              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-4xl block mb-3">🎯</span>
                  <p className="text-zinc-500 mb-4">No campaigns yet</p>
                  <button onClick={startNewCampaign} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Create First Campaign</button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((c, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700">
                      <div className="flex justify-between mb-2">
                        <h3 className="text-white font-medium">{c.name}</h3>
                        <button onClick={() => deleteCampaign(idx)} className="text-zinc-500 hover:text-red-400">🗑️</button>
                      </div>
                      <p className="text-zinc-500 text-sm mb-3">{c.prospects.length} contacts · {c.touches.length} touches</p>
                      <button onClick={() => openCampaign(idx)} className="w-full py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700">Open →</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="max-w-xl mx-auto text-center py-12">
              <span className="text-5xl block mb-4">📄</span>
              <h2 className="text-xl font-semibold text-white mb-2">Upload Contact List</h2>
              <p className="text-zinc-500 mb-6">CSV with columns: name, title, company, email, linkedin</p>
              
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-6 py-3 bg-yellow-400 text-zinc-900 rounded-lg font-medium hover:bg-yellow-300"
              >
                Choose CSV File
              </button>
              
              <p className="text-zinc-600 text-sm mt-4">or</p>
              <button 
                onClick={() => { setCampaign({ ...campaign, prospects: [] }); setStep('research') }}
                className="text-zinc-400 text-sm mt-2 hover:text-white"
              >
                Skip and add manually →
              </button>
            </div>
          )}

          {/* STEP 2: RESEARCH */}
          {step === 'research' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Research Contacts</h2>
                  <p className="text-zinc-500 text-sm">{campaign.prospects.filter(p => p.researched).length} of {campaign.prospects.length} researched</p>
                </div>
                <div className="flex gap-2">
                  {!researching && campaign.prospects.some(p => !p.researched) && (
                    <button onClick={researchAll} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-400">
                      🔍 Research All
                    </button>
                  )}
                  <button 
                    onClick={() => { saveCampaign(); setStep('builder') }} 
                    className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
                  >
                    Continue to Builder →
                  </button>
                </div>
              </div>

              {researching && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-400">Researching {researchProgress.current} of {researchProgress.total}...</span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${(researchProgress.current / researchProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800">
                      <th className="text-left text-xs text-zinc-500 px-4 py-3">Contact</th>
                      <th className="text-left text-xs text-zinc-500 px-4 py-3">Company</th>
                      <th className="text-left text-xs text-zinc-500 px-4 py-3">Hooks Found</th>
                      <th className="text-left text-xs text-zinc-500 px-4 py-3 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.prospects.map((p, idx) => (
                      <tr key={idx} className="border-b border-zinc-800/50">
                        <td className="px-4 py-3">
                          <p className="text-white text-sm">{p.prospect_name}</p>
                          <p className="text-zinc-500 text-xs">{p.prospect_title}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-sm">{p.company}</td>
                        <td className="px-4 py-3">
                          {p.hooks && p.hooks.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.hooks.slice(0, 2).map((h, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{h}</span>
                              ))}
                              {p.hooks.length > 2 && <span className="text-[10px] text-zinc-500">+{p.hooks.length - 2}</span>}
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-xs">No hooks yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.researched ? (
                            <span className="text-emerald-400 text-xs">✓ Done</span>
                          ) : (
                            <span className="text-zinc-500 text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: BUILDER */}
          {step === 'builder' && (
            <div className="space-y-6">
              {/* Variables */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-zinc-500">Variables:</span>
                  {campaign.variables.map(v => (
                    <span key={v} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs flex items-center gap-1">
                      {`{${v}}`}
                      {!['name', 'company', 'title'].includes(v) && (
                        <button onClick={() => removeVariable(v)} className="text-zinc-500 hover:text-red-400">×</button>
                      )}
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={newVariable} 
                    onChange={e => setNewVariable(e.target.value)} 
                    placeholder="add variable" 
                    className="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-white text-xs w-24"
                    onKeyDown={e => e.key === 'Enter' && addVariable()}
                  />
                </div>
              </div>

              {/* Touches */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Campaign Steps</h3>
                  <div className="relative">
                    <button onClick={() => setShowSuggestions(!showSuggestions)} className="px-3 py-1.5 bg-yellow-400/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-400/30">+ Add Step</button>
                    {showSuggestions && (
                      <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 w-48">
                        {CHANNELS.map(c => (
                          <button 
                            key={c.value}
                            onClick={() => { addTouch(c.value); setShowSuggestions(false) }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                          >
                            {c.icon} {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {campaign.touches.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-700 rounded-lg">
                    <p className="text-zinc-500 text-sm">No steps yet. Add your first step above.</p>
                  </div>
                ) : (
                  <>
                    {/* Touch tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {campaign.touches.map((t, i) => (
                        <button 
                          key={i}
                          onClick={() => setSelectedTouch(i)}
                          className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 ${
                            selectedTouch === i ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {getChannelIcon(t.channel)} Day {t.day_number}
                          {campaign.touches.length > 1 && (
                            <span onClick={(e) => { e.stopPropagation(); removeTouch(i) }} className="hover:text-red-500">×</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Touch editor */}
                    {campaign.touches[selectedTouch] && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-zinc-500 block mb-1">Channel</label>
                            <select 
                              value={campaign.touches[selectedTouch].channel}
                              onChange={e => updateTouch('channel', e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm"
                            >
                              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 block mb-1">Day</label>
                            <input 
                              type="number"
                              value={campaign.touches[selectedTouch].day_number}
                              onChange={e => updateTouch('day_number', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 block mb-1">Goal</label>
                            <input 
                              type="text"
                              value={campaign.touches[selectedTouch].goal}
                              onChange={e => updateTouch('goal', e.target.value)}
                              placeholder="Get reply"
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-zinc-500">Message Template</label>
                            <div className="flex gap-2">
                              <button 
                                onClick={generateTemplate}
                                disabled={generating}
                                className="px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-400/20 rounded disabled:opacity-50"
                              >
                                {generating ? '...' : '✨ AI Generate'}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {campaign.variables.map(v => (
                              <button 
                                key={v}
                                onClick={() => updateTouch('template', campaign.touches[selectedTouch].template + `{${v}}`)}
                                className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[10px] hover:text-yellow-400"
                              >
                                {`{${v}}`}
                              </button>
                            ))}
                          </div>
                          <textarea 
                            value={campaign.touches[selectedTouch].template}
                            onChange={e => updateTouch('template', e.target.value)}
                            placeholder="Hi {name}, I noticed {company} recently {achievement}..."
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm h-32 resize-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contacts with variables */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Contacts & Variables</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800">
                        <th className="text-left text-xs text-zinc-500 px-3 py-2">Name</th>
                        <th className="text-left text-xs text-zinc-500 px-3 py-2">Company</th>
                        {campaign.variables.filter(v => !['name', 'company', 'title'].includes(v)).map(v => (
                          <th key={v} className="text-left text-xs text-zinc-500 px-3 py-2">{v}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.prospects.slice(0, 10).map((p, idx) => (
                        <tr key={idx} className="border-b border-zinc-800/50">
                          <td className="px-3 py-2 text-white text-sm">{p.prospect_name}</td>
                          <td className="px-3 py-2 text-zinc-400 text-sm">{p.company}</td>
                          {campaign.variables.filter(v => !['name', 'company', 'title'].includes(v)).map(v => (
                            <td key={v} className="px-3 py-2">
                              <input 
                                type="text"
                                value={p.variables[v] || ''}
                                onChange={e => updateProspectVariable(idx, v, e.target.value)}
                                className="w-full bg-transparent text-zinc-400 text-sm focus:ring-1 focus:ring-yellow-400 rounded px-1"
                                placeholder={`{${v}}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {campaign.prospects.length > 10 && (
                    <div className="px-4 py-2 text-zinc-500 text-xs">+ {campaign.prospects.length - 10} more contacts</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => { saveCampaign(); setStep('export') }}
                  disabled={campaign.touches.length === 0}
                  className="px-6 py-2 bg-yellow-400 text-zinc-900 rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-50"
                >
                  Continue to Export →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: EXPORT */}
          {step === 'export' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Export contacts */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <span className="text-3xl block mb-3">📋</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Contacts CSV</h3>
                  <p className="text-zinc-500 text-sm mb-4">{campaign.prospects.length} contacts with {campaign.variables.length} variables</p>
                  <button onClick={exportContacts} className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-400">
                    📥 Download CSV
                  </button>
                </div>

                {/* Messages preview */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <span className="text-3xl block mb-3">💬</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Campaign Messages</h3>
                  <p className="text-zinc-500 text-sm mb-4">{campaign.touches.length} steps · Copy messages below</p>
                  <button onClick={() => setStep('builder')} className="w-full py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">
                    ← Edit Campaign
                  </button>
                </div>
              </div>

              {/* Messages to copy */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h3 className="text-sm font-medium text-white">Messages to Copy</h3>
                </div>
                
                {/* Touch selector */}
                <div className="px-4 py-3 border-b border-zinc-800 flex gap-2">
                  {campaign.touches.map((t, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedTouch(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${selectedTouch === i ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {getChannelIcon(t.channel)} Step {t.step_number}
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                  {campaign.prospects.map((p, pIdx) => {
                    const msg = renderMessage(campaign.touches[selectedTouch]?.template || '', p)
                    const isCopied = copiedIdx === pIdx * 100 + selectedTouch
                    
                    return (
                      <div key={pIdx} className="p-4 hover:bg-zinc-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-white text-sm font-medium">{p.prospect_name}</span>
                            <span className="text-zinc-500 text-xs ml-2">@ {p.company}</span>
                          </div>
                          <button 
                            onClick={() => copyMessage(pIdx, selectedTouch)}
                            className={`px-3 py-1 text-xs rounded ${isCopied ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          >
                            {isCopied ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                        <p className="text-zinc-300 text-sm whitespace-pre-wrap">{msg}</p>
                        {msg.includes('{') && (
                          <div className="mt-2 flex gap-1">
                            {msg.match(/\{[^}]+\}/g)?.map((v, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}