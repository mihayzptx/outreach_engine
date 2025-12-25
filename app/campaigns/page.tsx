'use client'

import { useState, useEffect } from 'react'
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

interface Campaign {
  id: number
  name: string
  description: string
  default_tone: string
  default_length: string
  touches: Touch[]
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

// Campaign templates with best practices
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
    best_for: 'Executives, warm-up before outreach, holiday/milestone moments'
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
    best_for: 'New prospects, relationship building, senior decision makers'
  },
  {
    name: 'Cold Outreach',
    description: 'Direct email sequence with follow-ups',
    icon: '📧',
    default_tone: 'direct',
    default_length: 'medium',
    touches: [
      { step_number: 1, channel: 'Cold Email', day_number: 1, context_template: '', goal: 'Get reply or meeting', custom_instructions: 'Lead with their specific pain point. One clear CTA.' },
      { step_number: 2, channel: 'Follow-up Email', day_number: 4, context_template: '', goal: 'Bump + new angle', custom_instructions: 'New angle or additional value point. Reference first email briefly.' },
      { step_number: 3, channel: 'Follow-up Email', day_number: 9, context_template: '', goal: 'Final attempt', custom_instructions: 'Direct ask. Easy yes/no question. Leave door open.' }
    ],
    best_for: 'Time-sensitive outreach, clear ICP match, transactional buyers'
  },
  {
    name: 'Multi-Channel Blitz',
    description: '5-touch across LinkedIn + Email',
    icon: '⚡',
    default_tone: 'professional',
    default_length: 'medium',
    touches: [
      { step_number: 1, channel: 'LinkedIn Connection', day_number: 1, context_template: '', goal: 'Get connected', custom_instructions: 'Short personalized note.' },
      { step_number: 2, channel: 'Cold Email', day_number: 2, context_template: '', goal: 'Introduce value', custom_instructions: 'Reference LinkedIn request. Provide specific value prop.' },
      { step_number: 3, channel: 'LinkedIn Message', day_number: 5, context_template: '', goal: 'Engagement', custom_instructions: 'Share relevant content or insight.' },
      { step_number: 4, channel: 'Follow-up Email', day_number: 8, context_template: '', goal: 'Case study/proof', custom_instructions: 'Share relevant case study or result.' },
      { step_number: 5, channel: 'LinkedIn Message', day_number: 14, context_template: '', goal: 'Final touch', custom_instructions: 'Direct but friendly final ask.' }
    ],
    best_for: 'High-value targets, competitive deals, must-win accounts'
  },
  {
    name: 'Event Follow-up',
    description: 'Post-conference/meeting sequence',
    icon: '🤝',
    default_tone: 'warm',
    default_length: 'short',
    touches: [
      { step_number: 1, channel: 'LinkedIn Connection', day_number: 1, context_template: 'Met at [EVENT]', goal: 'Connect post-event', custom_instructions: 'Reference specific conversation or moment from event.' },
      { step_number: 2, channel: 'LinkedIn Message', day_number: 3, context_template: '', goal: 'Continue conversation', custom_instructions: 'Follow up on topic discussed. Provide promised resource if any.' }
    ],
    best_for: 'Conference leads, networking follow-ups, warm introductions'
  },
  {
    name: 'Trigger-Based',
    description: 'React to specific company signal',
    icon: '📡',
    default_tone: 'direct',
    default_length: 'medium',
    touches: [
      { step_number: 1, channel: 'Cold Email', day_number: 1, context_template: 'Trigger: [FUNDING/HIRING/NEWS]', goal: 'Timely outreach', custom_instructions: 'Lead with the trigger. Show you understand implications. Connect to how you help.' },
      { step_number: 2, channel: 'LinkedIn Connection', day_number: 2, context_template: '', goal: 'Multi-channel touch', custom_instructions: 'Reference email. Short connection note.' },
      { step_number: 3, channel: 'Follow-up Email', day_number: 5, context_template: '', goal: 'Add value', custom_instructions: 'Share relevant insight about their situation.' }
    ],
    best_for: 'Funding announcements, leadership changes, expansion news, hiring signals'
  }
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_tone: 'professional',
    default_length: 'medium',
    touches: [] as Touch[]
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_tone: 'professional',
      default_length: 'medium',
      touches: []
    })
    setEditingCampaign(null)
    setShowForm(false)
    setShowTemplates(false)
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
    setShowForm(true)
  }

  const addTouch = () => {
    const newStep = formData.touches.length + 1
    const lastDay = formData.touches.length > 0 ? formData.touches[formData.touches.length - 1].day_number : 0
    setFormData({
      ...formData,
      touches: [...formData.touches, {
        step_number: newStep,
        channel: 'LinkedIn Message',
        day_number: lastDay + 3,
        context_template: '',
        goal: '',
        custom_instructions: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || formData.touches.length === 0) return

    if (editingCampaign) {
      await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingCampaign.id })
      })
    } else {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
    }
    fetchCampaigns()
    resetForm()
  }

  const handleEdit = (campaign: Campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      default_tone: campaign.default_tone || 'professional',
      default_length: campaign.default_length || 'medium',
      touches: campaign.touches || []
    })
    setEditingCampaign(campaign)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  const handleUseTouch = (campaign: Campaign, touch: Touch) => {
    const params = new URLSearchParams({
      campaignId: campaign.id.toString(),
      campaignName: campaign.name,
      touchStep: touch.step_number.toString(),
      messageType: touch.channel,
      tone: campaign.default_tone,
      length: campaign.default_length,
      context: touch.context_template || '',
      targetGoal: touch.goal || '',
      customInstructions: touch.custom_instructions || ''
    })
    window.location.href = `/?${params.toString()}`
  }

  const getChannelIcon = (channel: string) => CHANNELS.find(c => c.value === channel)?.icon || '📝'

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
              <h1 className="text-lg font-semibold text-white">Campaigns</h1>
              <span className="text-xs text-zinc-500">{campaigns.length} campaigns</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-1.5 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700"
              >
                📋 Templates
              </button>
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="px-4 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
              >
                + New Campaign
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          
          {/* Template Selector */}
          {showTemplates && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Choose a Template</h3>
                <button onClick={() => setShowTemplates(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {CAMPAIGN_TEMPLATES.map((template, i) => (
                  <div
                    key={i}
                    onClick={() => useTemplate(template)}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-yellow-400/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{template.icon}</span>
                      <h4 className="text-white font-medium">{template.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{template.touches.length} touch{template.touches.length !== 1 ? 'es' : ''}</span>
                    </div>
                    <p className="text-zinc-500 text-sm mb-2">{template.description}</p>
                    <p className="text-[10px] text-zinc-600">Best for: {template.best_for}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                <button onClick={resetForm} className="text-zinc-500 hover:text-white text-xl">×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Q1 Funding Targets"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Default Tone</label>
                    <select
                      value={formData.default_tone}
                      onChange={e => setFormData({ ...formData, default_tone: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    >
                      {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Default Length</label>
                    <select
                      value={formData.default_length}
                      onChange={e => setFormData({ ...formData, default_length: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    >
                      {LENGTHS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Touches */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Sequence Touches *</label>
                    <button
                      type="button"
                      onClick={addTouch}
                      className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-400/30"
                    >
                      + Add Touch
                    </button>
                  </div>

                  {formData.touches.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-700 rounded-lg">
                      <p className="text-zinc-500 text-sm mb-2">No touches added yet</p>
                      <button
                        type="button"
                        onClick={addTouch}
                        className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
                      >
                        Add First Touch
                      </button>
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
                            <button
                              type="button"
                              onClick={() => removeTouch(i)}
                              className="text-zinc-500 hover:text-red-400 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Channel</label>
                              <select
                                value={touch.channel}
                                onChange={e => updateTouch(i, 'channel', e.target.value)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                              >
                                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Day</label>
                              <input
                                type="number"
                                min="1"
                                value={touch.day_number}
                                onChange={e => updateTouch(i, 'day_number', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label className="text-[10px] text-zinc-500 block mb-1">Goal</label>
                            <input
                              type="text"
                              value={touch.goal}
                              onChange={e => updateTouch(i, 'goal', e.target.value)}
                              placeholder="What should this touch achieve?"
                              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="text-[10px] text-zinc-500 block mb-1">Context Template</label>
                            <textarea
                              value={touch.context_template}
                              onChange={e => updateTouch(i, 'context_template', e.target.value)}
                              placeholder="Default context for this touch..."
                              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm h-16 resize-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">AI Instructions</label>
                            <textarea
                              value={touch.custom_instructions}
                              onChange={e => updateTouch(i, 'custom_instructions', e.target.value)}
                              placeholder="Special instructions for this touch..."
                              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white text-sm h-16 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={formData.touches.length === 0}
                    className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length === 0 && !showForm && !showTemplates ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🎯</span>
              <p className="text-zinc-500 mb-4">No campaigns yet</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700"
                >
                  Start from Template
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
                >
                  Create from Scratch
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{campaign.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">
                            {campaign.touches?.length || 0} touch{(campaign.touches?.length || 0) !== 1 ? 'es' : ''}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{campaign.default_tone}</span>
                        </div>
                        {campaign.description && <p className="text-zinc-500 text-sm">{campaign.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(campaign) }}
                          className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id) }}
                          className="px-3 py-1.5 bg-zinc-800 text-zinc-500 rounded-lg text-xs hover:bg-red-500/20 hover:text-red-400"
                        >
                          ×
                        </button>
                        <span className={`text-zinc-500 transition-transform ${expandedCampaign === campaign.id ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Touches */}
                  {expandedCampaign === campaign.id && campaign.touches && (
                    <div className="border-t border-zinc-800 p-4 bg-zinc-950/50">
                      <div className="space-y-2">
                        {campaign.touches.map((touch, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-6 h-6 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center text-xs font-medium">{touch.step_number}</span>
                              <span className="text-lg">{getChannelIcon(touch.channel)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm">{touch.channel}</span>
                                  <span className="text-[10px] text-zinc-500">Day {touch.day_number}</span>
                                </div>
                                {touch.goal && <p className="text-zinc-500 text-xs">{touch.goal}</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUseTouch(campaign, touch)}
                              className="px-3 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-xs font-medium hover:bg-yellow-300"
                            >
                              Generate
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Best Practices */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-6">
            <h4 className="text-white font-medium text-sm mb-3">📚 Campaign Best Practices</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-yellow-400 text-xs uppercase mb-2">Timing</h5>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>• Day 1-3: Initial touches</li>
                  <li>• Day 4-7: Follow-ups</li>
                  <li>• Day 8-14: Value adds</li>
                  <li>• Day 14+: Final attempts</li>
                </ul>
              </div>
              <div>
                <h5 className="text-yellow-400 text-xs uppercase mb-2">Multi-Channel</h5>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>• LinkedIn first, email second</li>
                  <li>• Never same channel back-to-back</li>
                  <li>• Reference previous touches</li>
                  <li>• Vary your angle each touch</li>
                </ul>
              </div>
              <div>
                <h5 className="text-yellow-400 text-xs uppercase mb-2">By Persona</h5>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>• C-Suite: ABM first, shorter sequence</li>
                  <li>• VP/Director: Multi-channel, 3-5 touches</li>
                  <li>• Manager: Direct outreach, longer sequence</li>
                </ul>
              </div>
              <div>
                <h5 className="text-yellow-400 text-xs uppercase mb-2">By Signal</h5>
                <ul className="text-zinc-400 space-y-1 text-xs">
                  <li>• Funding: Act fast, 3-touch max</li>
                  <li>• Hiring: Reference pain, offer help</li>
                  <li>• Expansion: Congratulate + relate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}