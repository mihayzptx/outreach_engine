'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Settings {
  cloudModel: string
  localModel: string
  localEndpoint: string
  temperature: number
  bannedPhrases: string[]
  goodOpeners: string[]
  abmExamples: string[]
}

const DEFAULT_SETTINGS: Settings = {
  cloudModel: 'llama-3.3-70b-versatile',
  localModel: 'llama3.2',
  localEndpoint: 'http://localhost:11434',
  temperature: 0.7,
  bannedPhrases: ['I hope this message finds you well', 'I wanted to reach out', 'I came across your profile', 'Synergy', 'Circle back', 'Touch base', 'Pick your brain'],
  goodOpeners: ['Saw your post about...', 'Congrats on the recent...', 'Your work on X caught my attention', 'Fellow [industry] person here'],
  abmExamples: ['Congrats on the Series B - exciting times ahead for {company}.', 'Saw {name} mention the expansion plans at {company}. Impressive growth.']
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'model' | 'prompts' | 'abm'>('model')
  const [newPhrase, setNewPhrase] = useState('')
  const [newOpener, setNewOpener] = useState('')
  const [newAbm, setNewAbm] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('outreach_settings')
    if (stored) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }) } catch {}
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('outreach_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addPhrase = () => { if (newPhrase.trim()) { setSettings({...settings, bannedPhrases: [...settings.bannedPhrases, newPhrase.trim()]}); setNewPhrase('') } }
  const removePhrase = (i: number) => setSettings({...settings, bannedPhrases: settings.bannedPhrases.filter((_, idx) => idx !== i)})
  const addOpener = () => { if (newOpener.trim()) { setSettings({...settings, goodOpeners: [...settings.goodOpeners, newOpener.trim()]}); setNewOpener('') } }
  const removeOpener = (i: number) => setSettings({...settings, goodOpeners: settings.goodOpeners.filter((_, idx) => idx !== i)})
  const addAbm = () => { if (newAbm.trim()) { setSettings({...settings, abmExamples: [...settings.abmExamples, newAbm.trim()]}); setNewAbm('') } }
  const removeAbm = (i: number) => setSettings({...settings, abmExamples: settings.abmExamples.filter((_, idx) => idx !== i)})
  const resetDefaults = () => { if (confirm('Reset all settings to defaults?')) setSettings(DEFAULT_SETTINGS) }

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
          <Link href="/saved" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">💾 Saved</Link>
          <Link href="/history" className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm">📊 History</Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-400/20">⚙️ Settings</button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetDefaults} className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm">Reset</button>
              <button onClick={saveSettings} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${saved ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-zinc-900 hover:bg-yellow-300'}`}>
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-6">
            {[{id:'model',label:'🤖 Model'},{id:'prompts',label:'📝 Prompts'},{id:'abm',label:'💛 ABM'}].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'model' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Cloud Model (Groq)</h3>
                <select value={settings.cloudModel} onChange={e => setSettings({...settings, cloudModel: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Fast)</option>
                  <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                  <option value="gemma2-9b-it">Gemma 2 9B</option>
                </select>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Local Model (Ollama)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Model Name</label>
                    <input type="text" value={settings.localModel} onChange={e => setSettings({...settings, localModel: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="llama3.2" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Endpoint URL</label>
                    <input type="text" value={settings.localEndpoint} onChange={e => setSettings({...settings, localEndpoint: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="http://localhost:11434" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Temperature: {settings.temperature}</h3>
                <input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})} className="w-full accent-yellow-400" />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>Focused (0)</span>
                  <span>Creative (1)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Banned Phrases</h3>
                <p className="text-zinc-500 text-sm mb-3">Words and phrases to avoid in generated messages</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newPhrase} onChange={e => setNewPhrase(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPhrase()} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add phrase..." />
                  <button onClick={addPhrase} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.bannedPhrases.map((phrase, i) => (
                    <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded flex items-center gap-1">
                      {phrase} <button onClick={() => removePhrase(i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Good Openers</h3>
                <p className="text-zinc-500 text-sm mb-3">Example openers to guide the model</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newOpener} onChange={e => setNewOpener(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOpener()} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add opener..." />
                  <button onClick={addOpener} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.goodOpeners.map((opener, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded flex items-center gap-1">
                      {opener} <button onClick={() => removeOpener(i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'abm' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">ABM Message Examples</h3>
                <p className="text-zinc-500 text-sm mb-3">Soft-touch recognition messages. Use {'{name}'}, {'{company}'} as placeholders.</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newAbm} onChange={e => setNewAbm(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAbm()} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add ABM example..." />
                  <button onClick={addAbm} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="space-y-2">
                  {settings.abmExamples.map((example, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-zinc-950 rounded-lg">
                      <span className="flex-1 text-zinc-300 text-sm">{example}</span>
                      <button onClick={() => removeAbm(i)} className="text-zinc-500 hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
                <h4 className="text-yellow-400 font-medium text-sm mb-2">💡 ABM Tips</h4>
                <ul className="text-zinc-400 text-sm space-y-1">
                  <li>• Recognition only, no sales pitch</li>
                  <li>• Reference specific achievements</li>
                  <li>• Keep it short (1-2 sentences)</li>
                  <li>• End with simple acknowledgment, not a question</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
