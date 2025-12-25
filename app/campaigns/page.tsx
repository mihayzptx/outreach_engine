'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Touch {
  id?: number
  step_number: number
  channel: string
  day_number: number
  context_template: string
  goal: string
  custom_instructions: string
}

interface Prospect {
  id?: number
  prospect_name: string
  prospect_title: string
  company: string
  email: string
  industry: string
  context: string
  variables: Record<string, string>
}

interface GeneratedMessage {
  id?: number
  prospect_id: number
  touch_id: number
  step_number: number
  generated_message: string
  variables_used: Record<string, string>
  status: string
}

interface Campaign {
  id: number
  name: string
  description: string
  default_tone: string
  default_length: string
  touches: Touch[]
  prospects?: Prospect[]
  messages?: GeneratedMessage[]
  created_at: string
}

const CHANNELS = [
  { value: 'LinkedIn Connection', label: 'LinkedIn Connection', icon: '🔗' },
  { value: 'LinkedIn Message', label: 'LinkedIn Message', icon: '💬' },
  { value: 'Cold Email', label: 'Cold Email', icon: '📧' },
  { value: 'Follow-up Email', label: 'Follow-up Email', icon: '📨' },
  { value: 'ABM', label: 'ABM (Recognition)', icon: '🎯' }
]

const TONES = ['professional', 'casual', 'direct', 'warm', 'enthusiastic']
const LENGTHS = ['short', 'medium', 'long']

const CAMPAIGN_TEMPLATES = [
  {
    name: 'ABM Recognition',
    description: 'Single soft touch to recognize achievement',
    icon: '🎯',
    default_tone: 'warm',
    default_length: 'short',
    touches: [
      { step_number: 1, channel: 'ABM', day_number: 1, context_template: '', goal: 'Recognition only, build goodwill', custom_instructions: 'No ask, no pitch. Pure recognition of their achievement. End with warm wishes.' }
    ],
    best_for: 'Executives, warm-up before outreach'
  },
  {
    name: 'LinkedIn Nurture',
    description: '3-touch LinkedIn sequence',
    icon: '🔗',
    default_tone: 'professional',
    default_length: 'short',
    touches: [
      { step_number: 1, channel: 'LinkedIn Connection', day_number: 1, context_template: '', goal: 'Get connected', custom_instructions: 'Personalized connection note. Reference specific detail. No pitch.' },
      { step_number: 2, channel: 'LinkedIn Message', day_number: 3, context_template: '', goal: 'Thank + soft value', custom_instructions: 'Thank for connecting. Share one relevant insight. No ask yet.' },
      { step_number: 3, channel: 'LinkedIn Message', day_number: 7, context_template: '', goal: 'Open conversation', custom_instructions: 'Reference their challenge or goal. Soft question to start dialogue.' }
    ],
    best_for: 'New prospects, relationship building'
  },
  {
    name: 'Cold Email Sequence',
    description: '3-touch email outreach',
    icon: '📧',
    default_tone: 'direct',
    default_length: 'medium',
    touches: [
      { step_number: 1, channel: 'Cold Email', day_number: 1, context_template: '', goal: 'Get reply or meeting', custom_instructions: 'Lead with their specific pain point. One clear CTA.' },
      { step_number: 2, channel: 'Follow-up Email', day_number: 4, context_template: '', goal: 'Bump + new angle', custom_instructions: 'New angle or additional value point. Reference first email briefly.' },
      { step_number: 3, channel: 'Follow-up Email', day_number: 9, context_template: '', goal: 'Final attempt', custom_instructions: 'Direct ask. Easy yes/no question. Leave door open.' }
    ],
    best_for: 'Time-sensitive outreach, clear ICP match'
  }
]

const DEFAULT_VARIABLES = ['name', 'company', 'title', 'industry', 'recent_news', 'pain_point', 'achievement']

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  
  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_tone: 'professional',
    default_length: 'medium',
    touches: [] as Touch[]
  })
  
  // Prospects state
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [newProspect, setNewProspect] = useState<Prospect>({
    prospect_name: '', prospect_title: '', company: '', email: '', industry: '', context: '', variables: {}
  })
  
  // Messages state
  const [messages, setMessages] = useState<GeneratedMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 })
  
  // Variable editor
  const [editingMessage, setEditingMessage] = useState<GeneratedMessage | null>(null)
  const [availableVariables, setAvailableVariables] = useState<string[]>(DEFAULT_VARIABLES)
  const [newVariable, setNewVariable] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', default_tone: 'professional', default_length: 'medium', touches: [] })
    setProspects([])
    setMessages([])
    setView('list')
    setSelectedCampaign(null)
  }

  const useTemplate = (template: typeof CAMPAIGN_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      description: template.description,
      default_tone: template.default_tone,
      default_length: template.default_length,
      touches: template.touches.map(t => ({ ...t }))
    })
    setShowTemplates(false)
  }

  const addTouch = () => {
    const newStep = formData.touches.length + 1
    const lastDay = formData.touches.length > 0 ? formData.touches[formData.touches.length - 1].day_number : 0
    setFormData({
      ...formData,
      touches: [...formData.touches, {
        step_number: newStep, channel: 'LinkedIn Message', day_number: lastDay + 3,
        context_template: '', goal: '', custom_instructions: ''
      }]
    })
  }

  const removeTouch = (index: number) => {
    const updated = formData.touches.filter((_, i) => i !== index).map((t, i) => ({ ...t, step_number: i + 1 }))
    setFormData({ ...formData, touches: updated })
  }

  const updateTouch = (index: number, field: keyof Touch, value: any) => {
    const updated = [...formData.touches]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, touches: updated })
  }

  // CSV Upload
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
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const industryIdx = headers.findIndex(h => h.includes('industry'))
      const contextIdx = headers.findIndex(h => h.includes('context'))
      
      const parsed: Prospect[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        if (values[nameIdx] || values[companyIdx]) {
          parsed.push({
            prospect_name: values[nameIdx] || '',
            prospect_title: values[titleIdx] || '',
            company: values[companyIdx] || '',
            email: values[emailIdx] || '',
            industry: values[industryIdx] || '',
            context: values[contextIdx] || '',
            variables: {}
          })
        }
      }
      setProspects([...prospects, ...parsed])
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addProspect = () => {
    if (!newProspect.prospect_name && !newProspect.company) return
    setProspects([...prospects, { ...newProspect }])
    setNewProspect({ prospect_name: '', prospect_title: '', company: '', email: '', industry: '', context: '', variables: {} })
  }

  const removeProspect = (index: number) => {
    setProspects(prospects.filter((_, i) => i !== index))
  }

  // Save Campaign
  const saveCampaign = async () => {
    if (!formData.name.trim() || formData.touches.length === 0) return

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, prospects })
    })
    const data = await res.json()
    
    if (data.campaign) {
      setSelectedCampaign({ ...data.campaign, prospects, messages: [] })
      setView('detail')
      fetchCampaigns()
    }
  }

  // Generate Messages
  const generateMessages = async () => {
    if (!selectedCampaign || prospects.length === 0) return
    
    setGenerating(true)
    const total = prospects.length * (selectedCampaign.touches?.length || 0)
    setGeneratingProgress({ current: 0, total })
    
    const newMessages: GeneratedMessage[] = []
    
    for (let pIdx = 0; pIdx < prospects.length; pIdx++) {
      const prospect = prospects[pIdx]
      
      for (let tIdx = 0; tIdx < (selectedCampaign.touches?.length || 0); tIdx++) {
        const touch = selectedCampaign.touches[tIdx]
        
        try {
          const res = await fetch('/api/campaigns/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign: selectedCampaign,
              prospect,
              touch,
              availableVariables
            })
          })
          const data = await res.json()
          
          newMessages.push({
            prospect_id: pIdx,
            touch_id: tIdx,
            step_number: touch.step_number,
            generated_message: data.message || '',
            variables_used: data.variables || {},
            status: 'draft'
          })
        } catch (e) {
          newMessages.push({
            prospect_id: pIdx,
            touch_id: tIdx,
            step_number: touch.step_number,
            generated_message: 'Error generating message',
            variables_used: {},
            status: 'error'
          })
        }
        
        setGeneratingProgress({ current: pIdx * (selectedCampaign.touches?.length || 0) + tIdx + 1, total })
      }
    }
    
    setMessages(newMessages)
    setGenerating(false)
  }

  // Variable Management
  const addVariable = () => {
    if (!newVariable.trim() || availableVariables.includes(newVariable.toLowerCase())) return
    setAvailableVariables([...availableVariables, newVariable.toLowerCase().replace(/\s+/g, '_')])
    setNewVariable('')
  }

  const removeVariable = (v: string) => {
    if (DEFAULT_VARIABLES.includes(v)) return
    setAvailableVariables(availableVariables.filter(x => x !== v))
  }

  const updateMessageVariable = (msgIndex: number, varName: string, value: string) => {
    const updated = [...messages]
    updated[msgIndex].variables_used[varName] = value
    // Re-render message with new variable value
    let msg = updated[msgIndex].generated_message
    Object.entries(updated[msgIndex].variables_used).forEach(([k, v]) => {
      msg = msg.replace(new RegExp(`{${k}}`, 'gi'), v)
    })
    setMessages(updated)
  }

  const updateMessageText = (msgIndex: number, text: string) => {
    const updated = [...messages]
    updated[msgIndex].generated_message = text
    setMessages(updated)
  }

  // Export
  const exportMessages = () => {
    const rows = [['Prospect', 'Company', 'Email', 'Touch', 'Channel', 'Day', 'Message']]
    messages.forEach(msg => {
      const prospect = prospects[msg.prospect_id]
      const touch = selectedCampaign?.touches[msg.touch_id]
      rows.push([
        prospect?.prospect_name || '',
        prospect?.company || '',
        prospect?.email || '',
        `Touch ${msg.step_number}`,
        touch?.channel || '',
        `Day ${touch?.day_number || 0}`,
        `"${msg.generated_message.replace(/"/g, '""')}"`
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${selectedCampaign?.name || 'campaign'}-messages.csv`
    a.click()
  }

  const getChannelIcon = (channel: string) => CHANNELS.find(c => c.value === channel)?.icon || '📝'

  const openCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setProspects(campaign.prospects || [])
    setMessages(campaign.messages || [])
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      default_tone: campaign.default_tone,
      default_length: campaign.default_length,
      touches: campaign.touches || []
    })
    setView('detail')
  }

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
          <Link href="/bulk" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">📦 Bulk</Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">🎯 Campaigns</button>
          <Link href="/saved" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">💾 Saved</Link>
          <Link href="/history" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">📊 History</Link>
          <Link href="/settings" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">⚙️ Settings</Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              {view === 'list' && <h1 className="text-lg font-semibold text-white">Campaigns</h1>}
              {view === 'create' && <h1 className="text-lg font-semibold text-white">New Campaign</h1>}
              {view === 'detail' && (
                <>
                  <button onClick={resetForm} className="text-zinc-400 hover:text-white">←</button>
                  <h1 className="text-lg font-semibold text-white">{selectedCampaign?.name}</h1>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {view === 'list' && (
                <>
                  <button onClick={() => setShowTemplates(true)} className="px-4 py-1.5 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700">📋 Templates</button>
                  <button onClick={() => setView('create')} className="px-4 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300">+ New</button>
                </>
              )}
              {view === 'create' && (
                <>
                  <button onClick={resetForm} className="px-4 py-1.5 text-zinc-400 hover:text-white text-sm">Cancel</button>
                  <button onClick={saveCampaign} disabled={!formData.name || formData.touches.length === 0} className="px-4 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300 disabled:opacity-50">Save & Continue</button>
                </>
              )}
              {view === 'detail' && messages.length > 0 && (
                <button onClick={exportMessages} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-400">Export CSV</button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          
          {/* Template Selector Modal */}
          {showTemplates && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Choose Template</h3>
                  <button onClick={() => setShowTemplates(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {CAMPAIGN_TEMPLATES.map((t, i) => (
                    <div key={i} onClick={() => { useTemplate(t); setView('create') }} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-yellow-400/50 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{t.icon}</span>
                        <h4 className="text-white font-medium">{t.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{t.touches.length} touches</span>
                      </div>
                      <p className="text-zinc-500 text-sm mb-1">{t.description}</p>
                      <p className="text-[10px] text-zinc-600">Best for: {t.best_for}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🎯</span>
                  <p className="text-zinc-500 mb-4">No campaigns yet</p>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setShowTemplates(true)} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm">Start from Template</button>
                    <button onClick={() => setView('create')} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Create New</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => (
                    <div key={c.id} onClick={() => openCampaignDetail(c)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{c.name}</h3>
                          <p className="text-zinc-500 text-sm">{c.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">{c.touches?.length || 0} touches</span>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{c.default_tone}</span>
                          </div>
                        </div>
                        <span className="text-zinc-600">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* CREATE VIEW */}
          {view === 'create' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Campaign Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Q1 Outreach" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Description</label>
                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Target recently funded startups" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Tone</label>
                    <select value={formData.default_tone} onChange={e => setFormData({...formData, default_tone: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Length</label>
                    <select value={formData.default_length} onChange={e => setFormData({...formData, default_length: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                      {LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Touches */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Sequence Touches *</h3>
                  <button onClick={addTouch} className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-lg text-xs">+ Add Touch</button>
                </div>
                {formData.touches.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-700 rounded-lg">
                    <p className="text-zinc-500 text-sm mb-2">No touches yet</p>
                    <button onClick={addTouch} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Add First Touch</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.touches.map((touch, i) => (
                      <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-yellow-400 text-zinc-900 rounded-full flex items-center justify-center text-xs font-bold">{touch.step_number}</span>
                            <span className="text-white text-sm font-medium">Touch {touch.step_number}</span>
                          </div>
                          <button onClick={() => removeTouch(i)} className="text-zinc-500 hover:text-red-400 text-sm">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Channel</label>
                            <select value={touch.channel} onChange={e => updateTouch(i, 'channel', e.target.value)} className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm">
                              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Day</label>
                            <input type="number" min="1" value={touch.day_number} onChange={e => updateTouch(i, 'day_number', parseInt(e.target.value) || 1)} className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="text-[10px] text-zinc-500 block mb-1">Goal</label>
                          <input type="text" value={touch.goal} onChange={e => updateTouch(i, 'goal', e.target.value)} placeholder="What should this touch achieve?" className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">AI Instructions</label>
                          <textarea value={touch.custom_instructions} onChange={e => updateTouch(i, 'custom_instructions', e.target.value)} placeholder="Special instructions..." className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm h-16 resize-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-sm">{selectedCampaign.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedCampaign.touches?.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded flex items-center gap-1">
                          {getChannelIcon(t.channel)} Day {t.day_number}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{prospects.length}</p>
                    <p className="text-xs text-zinc-500">prospects</p>
                  </div>
                </div>
              </div>

              {/* Prospects Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Prospects</h3>
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700">📄 Upload CSV</button>
                  </div>
                </div>

                {/* Add Prospect Form */}
                <div className="grid grid-cols-6 gap-2 mb-4 p-3 bg-zinc-950 rounded-lg">
                  <input type="text" value={newProspect.prospect_name} onChange={e => setNewProspect({...newProspect, prospect_name: e.target.value})} placeholder="Name" className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                  <input type="text" value={newProspect.prospect_title} onChange={e => setNewProspect({...newProspect, prospect_title: e.target.value})} placeholder="Title" className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                  <input type="text" value={newProspect.company} onChange={e => setNewProspect({...newProspect, company: e.target.value})} placeholder="Company" className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                  <input type="email" value={newProspect.email} onChange={e => setNewProspect({...newProspect, email: e.target.value})} placeholder="Email" className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                  <input type="text" value={newProspect.context} onChange={e => setNewProspect({...newProspect, context: e.target.value})} placeholder="Context" className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm" />
                  <button onClick={addProspect} className="px-3 py-1.5 bg-yellow-400 text-zinc-900 rounded text-sm font-medium">Add</button>
                </div>

                {/* Prospects List */}
                {prospects.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {prospects.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">{p.prospect_name}</span>
                          <span className="text-zinc-500 text-xs">{p.prospect_title}</span>
                          <span className="text-zinc-600 text-xs">@ {p.company}</span>
                        </div>
                        <button onClick={() => removeProspect(i)} className="text-zinc-600 hover:text-red-400 text-sm">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variables Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Variables</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableVariables.map(v => (
                    <span key={v} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs flex items-center gap-1">
                      {`{${v}}`}
                      {!DEFAULT_VARIABLES.includes(v) && (
                        <button onClick={() => removeVariable(v)} className="text-zinc-500 hover:text-red-400">×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newVariable} onChange={e => setNewVariable(e.target.value)} placeholder="Add custom variable" className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" onKeyDown={e => e.key === 'Enter' && addVariable()} />
                  <button onClick={addVariable} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs">Add</button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Variables will be replaced with prospect data or left as placeholders for manual editing</p>
              </div>

              {/* Generate Button */}
              {prospects.length > 0 && messages.length === 0 && (
                <button onClick={generateMessages} disabled={generating} className="w-full py-3 bg-yellow-400 text-zinc-900 rounded-xl font-semibold hover:bg-yellow-300 disabled:opacity-50">
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin"></span>
                      Generating {generatingProgress.current}/{generatingProgress.total}...
                    </span>
                  ) : (
                    `Generate ${prospects.length * (selectedCampaign.touches?.length || 0)} Messages`
                  )}
                </button>
              )}

              {/* Generated Messages Grid */}
              {messages.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Generated Messages</h3>
                    <button onClick={() => setMessages([])} className="text-xs text-zinc-500 hover:text-white">Regenerate All</button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left text-xs text-zinc-500 pb-2 pr-4">Prospect</th>
                          {selectedCampaign.touches?.map((t, i) => (
                            <th key={i} className="text-left text-xs text-zinc-500 pb-2 px-2">
                              {getChannelIcon(t.channel)} Touch {t.step_number}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {prospects.map((prospect, pIdx) => (
                          <tr key={pIdx} className="border-b border-zinc-800/50">
                            <td className="py-3 pr-4">
                              <div className="text-white text-sm">{prospect.prospect_name}</div>
                              <div className="text-zinc-500 text-xs">{prospect.company}</div>
                            </td>
                            {selectedCampaign.touches?.map((_, tIdx) => {
                              const msg = messages.find(m => m.prospect_id === pIdx && m.touch_id === tIdx)
                              const msgIdx = messages.findIndex(m => m.prospect_id === pIdx && m.touch_id === tIdx)
                              return (
                                <td key={tIdx} className="py-3 px-2">
                                  {msg && (
                                    <div className="relative group">
                                      <div className="p-2 bg-zinc-950 rounded-lg text-xs text-zinc-300 max-w-xs">
                                        <p className="line-clamp-3">{msg.generated_message}</p>
                                      </div>
                                      <button onClick={() => setEditingMessage({...msg, prospect_id: pIdx, touch_id: tIdx})} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-yellow-400 text-zinc-900 rounded text-[10px]">Edit</button>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Message Modal */}
          {editingMessage && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setEditingMessage(null)}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <h3 className="text-white font-semibold">Edit Message</h3>
                  <button onClick={() => setEditingMessage(null)} className="text-zinc-500 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 block mb-1">Message</label>
                    <textarea
                      value={messages.find(m => m.prospect_id === editingMessage.prospect_id && m.touch_id === editingMessage.touch_id)?.generated_message || ''}
                      onChange={e => {
                        const idx = messages.findIndex(m => m.prospect_id === editingMessage.prospect_id && m.touch_id === editingMessage.touch_id)
                        if (idx >= 0) updateMessageText(idx, e.target.value)
                      }}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-40 resize-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-zinc-500 block mb-2">Variables Used</label>
                    <div className="space-y-2">
                      {Object.entries(editingMessage.variables_used || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-yellow-400 w-24">{`{${key}}`}</span>
                          <input
                            type="text"
                            value={value}
                            onChange={e => {
                              const idx = messages.findIndex(m => m.prospect_id === editingMessage.prospect_id && m.touch_id === editingMessage.touch_id)
                              if (idx >= 0) updateMessageVariable(idx, key, e.target.value)
                            }}
                            className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setEditingMessage(null)} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Done</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}