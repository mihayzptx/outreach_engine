'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Campaign {
  id: number
  name: string
  description: string
  message_type: string
  tone: string
  length: string
  context_template: string
  target_goal: string
  custom_instructions: string
  created_at: string
}

const MESSAGE_TYPES = ['LinkedIn Connection', 'LinkedIn Message', 'Cold Email', 'Follow-up Email', 'Response', 'ABM']
const TONES = ['professional', 'casual', 'direct', 'enthusiastic']
const LENGTHS = ['short', 'medium', 'long']

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message_type: 'LinkedIn Connection',
    tone: 'professional',
    length: 'medium',
    context_template: '',
    target_goal: '',
    custom_instructions: ''
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
      message_type: 'LinkedIn Connection',
      tone: 'professional',
      length: 'medium',
      context_template: '',
      target_goal: '',
      custom_instructions: ''
    })
    setEditingCampaign(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

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
      message_type: campaign.message_type,
      tone: campaign.tone,
      length: campaign.length,
      context_template: campaign.context_template || '',
      target_goal: campaign.target_goal || '',
      custom_instructions: campaign.custom_instructions || ''
    })
    setEditingCampaign(campaign)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  const handleUse = (campaign: Campaign) => {
    const params = new URLSearchParams({
      campaignId: campaign.id.toString(),
      campaignName: campaign.name,
      messageType: campaign.message_type,
      tone: campaign.tone,
      length: campaign.length,
      context: campaign.context_template || '',
      targetGoal: campaign.target_goal || '',
      customInstructions: campaign.custom_instructions || ''
    })
    window.location.href = `/?${params.toString()}`
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
              <h1 className="text-lg font-semibold text-white">Campaigns</h1>
              <span className="text-xs text-zinc-500">{campaigns.length} campaigns</span>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="px-4 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
            >
              + New Campaign
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          {/* Form */}
          {showForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                <button onClick={resetForm} className="text-zinc-500 hover:text-white">×</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Houston Founders Q1"
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
                      placeholder="Brief description of this campaign"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Message Type</label>
                    <select
                      value={formData.message_type}
                      onChange={e => setFormData({ ...formData, message_type: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    >
                      {MESSAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Target Goal</label>
                    <input
                      type="text"
                      value={formData.target_goal}
                      onChange={e => setFormData({ ...formData, target_goal: e.target.value })}
                      placeholder="e.g., Book discovery call"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Tone</label>
                    <select
                      value={formData.tone}
                      onChange={e => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    >
                      {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Length</label>
                    <select
                      value={formData.length}
                      onChange={e => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    >
                      {LENGTHS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Context Template</label>
                    <textarea
                      value={formData.context_template}
                      onChange={e => setFormData({ ...formData, context_template: e.target.value })}
                      placeholder="Default context for all prospects in this campaign..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-20 resize-none focus:border-yellow-400"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">This context will be pre-filled when using this campaign</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-500 block mb-1">Custom AI Instructions</label>
                    <textarea
                      value={formData.custom_instructions}
                      onChange={e => setFormData({ ...formData, custom_instructions: e.target.value })}
                      placeholder="Special instructions for the AI... e.g., 'Focus on their recent funding, mention Houston connection'"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-20 resize-none focus:border-yellow-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetForm} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300">
                    {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🎯</span>
              <p className="text-zinc-500 mb-4">No campaigns yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
              >
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{campaign.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{campaign.message_type}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{campaign.tone}</span>
                      </div>
                      {campaign.description && <p className="text-zinc-500 text-sm mb-2">{campaign.description}</p>}
                      {campaign.context_template && (
                        <p className="text-zinc-600 text-xs line-clamp-2 mb-2">Context: {campaign.context_template}</p>
                      )}
                      {campaign.target_goal && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Goal: {campaign.target_goal}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleUse(campaign)}
                        className="px-3 py-1.5 bg-yellow-400 text-zinc-900 rounded-lg text-xs font-medium hover:bg-yellow-300"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-500 rounded-lg text-xs hover:bg-red-500/20 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mt-6">
            <h4 className="text-yellow-400 font-medium text-sm mb-2">💡 Campaign Tips</h4>
            <ul className="text-zinc-400 text-sm space-y-1">
              <li>• Create campaigns for specific outreach themes (funding announcements, hiring signals)</li>
              <li>• Use context template for info that applies to all prospects</li>
              <li>• Custom instructions guide the AI on tone and focus</li>
              <li>• Click "Use" to start generating with campaign settings</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}