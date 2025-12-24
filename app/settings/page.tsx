'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Settings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  localModel: string
  localEndpoint: string
  cloudModel: string
  systemPromptBase: string
  bannedPhrases: string[]
  goodOpeners: string[]
  companyDescription: string
  services: string[]
  idealCustomerSignals: string[]
  abmExamples: string[]
  gradingCriteria: {
    priority: { name: string; weight: number }[]
    important: { name: string; weight: number }[]
    bonus: { name: string; weight: number }[]
  }
}

const defaultSettings: Settings = {
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  localModel: 'llama3.2',
  localEndpoint: 'http://localhost:11434',
  cloudModel: 'llama-3.3-70b-versatile',
  systemPromptBase: 'You write cold outreach for Tech-stack.io. Your messages are short, specific, and never generic.',
  bannedPhrases: [
    "I hope this finds you well",
    "I wanted to reach out",
    "I came across your profile",
    "I noticed that",
    "I'd love to connect",
    "Pick your brain",
    "Quick question",
    "Not sure if you're the right person",
    "I know you're busy",
    "We help companies like yours",
    "Synergy",
    "Leverage",
    "Circle back"
  ],
  goodOpeners: [
    "Saw [company] just [specific event]...",
    "[Relevant industry trend] is hitting [their sector]...",
    "Your [specific project/initiative] caught my attention...",
    "The [specific news] about [company] is interesting...",
    "Congrats on [specific achievement]..."
  ],
  companyDescription: "Tech-stack.io is a 200+ person DevOps services company headquartered in Houston, TX. We help companies scale their infrastructure, implement CI/CD, and augment their platform teams.",
  services: [
    "Cloud Infrastructure Optimization (AWS, GCP, Azure)",
    "CI/CD Implementation (Jenkins, GitLab CI, GitHub Actions)",
    "Kubernetes & Container Orchestration",
    "Team Augmentation (embedded senior DevOps engineers)",
    "Platform Engineering",
    "Infrastructure as Code (Terraform, Pulumi)",
    "Observability & Monitoring (Datadog, Prometheus, Grafana)",
    "Security & Compliance (SOC2, HIPAA, PCI-DSS)"
  ],
  idealCustomerSignals: [
    "Just raised funding (Series A, B, C)",
    "Post-acquisition integration",
    "Rapid growth / scaling challenges",
    "Cloud cost problems",
    "Security audit coming",
    "Platform team too small",
    "Legacy modernization needs",
    "DevOps hiring struggles"
  ],
  abmExamples: [
    "Congrats on the Series B - exciting times ahead for {company}.",
    "Saw {name} mention the expansion plans. Impressive growth.",
    "The award recognition is well deserved. Strong way to finish the year."
  ],
  gradingCriteria: {
    priority: [
      { name: 'Recent Funding', weight: 20 },
      { name: 'Hiring DevOps/Platform', weight: 15 },
      { name: 'Tech Stack Match', weight: 15 }
    ],
    important: [
      { name: 'Growth Stage', weight: 10 },
      { name: 'Industry Fit', weight: 10 },
      { name: 'Company Size (50-500)', weight: 10 }
    ],
    bonus: [
      { name: 'Recent News/PR', weight: 5 },
      { name: 'Conference Attendance', weight: 5 },
      { name: 'Engaged on LinkedIn', weight: 5 }
    ]
  }
  ,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'model' | 'prompts' | 'company' | 'examples' | 'grading'>('model')
  const [newPhrase, setNewPhrase] = useState('')
  const [newOpener, setNewOpener] = useState('')
  const [newService, setNewService] = useState('')
  const [newSignal, setNewSignal] = useState('')
  const [newAbm, setNewAbm] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('llm-settings')
    if (stored) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }) } catch {}
    }
  }, [])

  const saveSettings = async () => {
    localStorage.setItem('llm-settings', JSON.stringify(settings))
    // Also save to database
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetDefaults = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(defaultSettings)
      localStorage.setItem('llm-settings', JSON.stringify(defaultSettings))
    }
  }

  // List management helpers
  const addItem = (field: keyof Settings, value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setSettings({ ...settings, [field]: [...(settings[field] as string[]), value.trim()] })
      setter('')
    }
  }
  const removeItem = (field: keyof Settings, index: number) => {
    setSettings({ ...settings, [field]: (settings[field] as string[]).filter((_, i) => i !== index) })
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-zinc-400 hover:text-white">☰</button>
              <h1 className="text-lg font-semibold text-white">LLM Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetDefaults} className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm">Reset</button>
              <button onClick={saveSettings} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${saved ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-zinc-900 hover:bg-yellow-300'}`}>
                {saved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-zinc-800 px-4 lg:px-6 overflow-x-auto">
          <div className="flex gap-1">
            {[
              { id: 'model', label: '🤖 Model' },
              { id: 'prompts', label: '📝 Prompts' },
              { id: 'company', label: '🏢 Company' },
              { id: 'examples', label: '💡 Examples' },
              { id: 'grading', label: '📊 Grading' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-yellow-400 border-yellow-400' : 'text-zinc-500 border-transparent hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
          {/* Model Tab */}
          {activeTab === 'model' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Model Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Local Model (Ollama)</label>
                    <select value={settings.localModel} onChange={e => setSettings({...settings, localModel: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                      <option value="llama3.2">llama3.2</option>
                      <option value="llama3.1:8b">llama3.1:8b</option>
                      <option value="llama3.1:70b">llama3.1:70b</option>
                      <option value="mistral">mistral</option>
                      <option value="mixtral">mixtral</option>
                      <option value="techstack-outreach">techstack-outreach (Custom)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Ollama Endpoint</label>
                    <input 
                      type="text" 
                      value={settings.localEndpoint} 
                      onChange={e => setSettings({...settings, localEndpoint: e.target.value})} 
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Cloud Model (Groq)</label>
                    <select value={settings.cloudModel} onChange={e => setSettings({...settings, cloudModel: e.target.value})} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm">
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-3">Run `ollama list` to see available models. Make sure Ollama is running.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Generation Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">Temperature: {settings.temperature}</label>
                    <input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})} className="w-full accent-yellow-400" />
                    <div className="flex justify-between text-[10px] text-zinc-600"><span>Focused</span><span>Creative</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">Top P: {settings.topP}</label>
                    <input type="range" min="0" max="1" step="0.1" value={settings.topP} onChange={e => setSettings({...settings, topP: parseFloat(e.target.value)})} className="w-full accent-yellow-400" />
                    <div className="flex justify-between text-[10px] text-zinc-600"><span>Narrow</span><span>Diverse</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">Max Tokens: {settings.maxTokens}</label>
                    <input type="range" min="100" max="2000" step="100" value={settings.maxTokens} onChange={e => setSettings({...settings, maxTokens: parseInt(e.target.value)})} className="w-full accent-yellow-400" />
                    <div className="flex justify-between text-[10px] text-zinc-600"><span>Short</span><span>Long</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-2">Frequency Penalty: {settings.frequencyPenalty}</label>
                    <input type="range" min="0" max="1" step="0.1" value={settings.frequencyPenalty} onChange={e => setSettings({...settings, frequencyPenalty: parseFloat(e.target.value)})} className="w-full accent-yellow-400" />
                    <div className="flex justify-between text-[10px] text-zinc-600"><span>Allow Repetition</span><span>Avoid</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Quick Presets</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '🎯 Precise', temp: 0.3, topP: 0.8 },
                    { label: '⚖️ Balanced', temp: 0.7, topP: 0.9 },
                    { label: '🎨 Creative', temp: 0.9, topP: 0.95 },
                    { label: '✍️ Unique', temp: 0.5, topP: 0.85 }
                  ].map(preset => (
                    <button key={preset.label} onClick={() => setSettings({...settings, temperature: preset.temp, topP: preset.topP})} className="p-3 bg-zinc-950 hover:bg-zinc-800 rounded-lg text-center transition-colors">
                      <div className="text-lg mb-1">{preset.label.split(' ')[0]}</div>
                      <div className="text-white text-xs font-medium">{preset.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Base System Prompt</h3>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-24 resize-none font-mono"
                  value={settings.systemPromptBase}
                  onChange={e => setSettings({...settings, systemPromptBase: e.target.value})}
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Banned Phrases</h3>
                <p className="text-xs text-zinc-500 mb-3">AI will never use these phrases</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newPhrase} onChange={e => setNewPhrase(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('bannedPhrases', newPhrase, setNewPhrase)} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add phrase..." />
                  <button onClick={() => addItem('bannedPhrases', newPhrase, setNewPhrase)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.bannedPhrases.map((phrase, i) => (
                    <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-1">
                      {phrase} <button onClick={() => removeItem('bannedPhrases', i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Good Openers</h3>
                <p className="text-xs text-zinc-500 mb-3">Example patterns for AI to emulate</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newOpener} onChange={e => setNewOpener(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('goodOpeners', newOpener, setNewOpener)} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add opener..." />
                  <button onClick={() => addItem('goodOpeners', newOpener, setNewOpener)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="space-y-2">
                  {settings.goodOpeners.map((opener, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                      <span>{opener}</span>
                      <button onClick={() => removeItem('goodOpeners', i)} className="hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Company Description</h3>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-24 resize-none"
                  value={settings.companyDescription}
                  onChange={e => setSettings({...settings, companyDescription: e.target.value})}
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Services Offered</h3>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('services', newService, setNewService)} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add service..." />
                  <button onClick={() => addItem('services', newService, setNewService)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="space-y-2">
                  {settings.services.map((service, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm">
                      <span>{service}</span>
                      <button onClick={() => removeItem('services', i)} className="hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Ideal Customer Signals</h3>
                <p className="text-xs text-zinc-500 mb-3">Triggers that indicate a good prospect</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newSignal} onChange={e => setNewSignal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('idealCustomerSignals', newSignal, setNewSignal)} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add signal..." />
                  <button onClick={() => addItem('idealCustomerSignals', newSignal, setNewSignal)} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.idealCustomerSignals.map((signal, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded flex items-center gap-1">
                      {signal} <button onClick={() => removeItem('idealCustomerSignals', i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">ABM Message Examples</h3>
                <p className="text-xs text-zinc-500 mb-3">Soft-touch recognition messages. Use {'{name}'}, {'{company}'} as placeholders.</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={newAbm} onChange={e => setNewAbm(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('abmExamples', newAbm, setNewAbm)} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" placeholder="Add ABM example..." />
                  <button onClick={() => addItem('abmExamples', newAbm, setNewAbm)} className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium">Add</button>
                </div>
                <div className="space-y-2">
                  {settings.abmExamples.map((example, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                      <span className="flex-1 text-yellow-200 text-sm">{example}</span>
                      <button onClick={() => removeItem('abmExamples', i)} className="text-yellow-400 hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Good Message Examples</h3>
                <div className="space-y-3">
                  {[
                    { type: 'POST-FUNDING', msg: 'Saw the Series B news - congrats! Scaling infrastructure while shipping fast is brutal at this stage. How\'s your platform team handling the growth?', score: 95 },
                    { type: 'ACQUISITION', msg: 'The DataCorp acquisition is interesting - lots of potential synergies on the data pipeline side. Curious how you\'re approaching the platform consolidation timeline?', score: 92 },
                    { type: 'HIRING', msg: 'That Staff DevOps role has been open a while - brutal market right now. Some teams are bridging with contract engineers while they search. Is that something you\'ve considered?', score: 90 }
                  ].map((ex, i) => (
                    <div key={i} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="text-[10px] text-emerald-400 font-semibold mb-1">{ex.type}</div>
                      <p className="text-white text-sm mb-1">"{ex.msg}"</p>
                      <div className="text-[10px] text-zinc-500">Score: {ex.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Bad Message Examples</h3>
                <div className="space-y-3">
                  {[
                    { msg: 'Hi, I hope this email finds you well. I wanted to reach out because I came across your profile...', reason: 'Generic opener, No personalization, Starts with I' },
                    { msg: 'We at Tech-stack.io help companies like yours optimize their DevOps processes. Would you be open to a 15-minute call?', reason: 'Leads with company, Asks for call too early' },
                    { msg: 'I noticed you\'re hiring DevOps engineers. We have a great team that could help. Let me know if you\'d like to discuss.', reason: 'Weak observation, Generic CTA' }
                  ].map((ex, i) => (
                    <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-zinc-500 text-sm line-through mb-1">"{ex.msg}"</p>
                      <div className="text-[10px] text-red-400">❌ {ex.reason}</div>
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
                  <li>• End with warm closing, not a question</li>
                </ul>
              </div>
            </>
          )}

          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <>
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
                <h4 className="text-yellow-400 font-medium text-sm mb-2">📊 Lead Grading System</h4>
                <p className="text-zinc-400 text-sm">Configure criteria and weights for automatic lead scoring. Total weight should equal 100 for accurate grading (A: 80+, B: 60-79, C: 40-59, D: 20-39, E: 0-19).</p>
              </div>

              {/* Priority Criteria */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">🔴 Priority Criteria</h3>
                    <p className="text-xs text-zinc-500">High-impact signals (recommended 15-20 pts each)</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      gradingCriteria: {
                        ...settings.gradingCriteria,
                        priority: [...settings.gradingCriteria.priority, { name: 'New Criteria', weight: 15 }]
                      }
                    })}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.gradingCriteria.priority.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.priority]
                          updated[i] = { ...item, name: e.target.value }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, priority: updated } })
                        }}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.priority]
                          updated[i] = { ...item, weight: parseInt(e.target.value) || 0 }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, priority: updated } })
                        }}
                        className="w-16 px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm text-center"
                      />
                      <span className="text-zinc-500 text-xs w-6">pts</span>
                      <button
                        onClick={() => {
                          const updated = settings.gradingCriteria.priority.filter((_, idx) => idx !== i)
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, priority: updated } })
                        }}
                        className="text-zinc-500 hover:text-red-400"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Criteria */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">🟡 Important Criteria</h3>
                    <p className="text-xs text-zinc-500">Medium-impact signals (recommended 10 pts each)</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      gradingCriteria: {
                        ...settings.gradingCriteria,
                        important: [...settings.gradingCriteria.important, { name: 'New Criteria', weight: 10 }]
                      }
                    })}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.gradingCriteria.important.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.important]
                          updated[i] = { ...item, name: e.target.value }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, important: updated } })
                        }}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.important]
                          updated[i] = { ...item, weight: parseInt(e.target.value) || 0 }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, important: updated } })
                        }}
                        className="w-16 px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm text-center"
                      />
                      <span className="text-zinc-500 text-xs w-6">pts</span>
                      <button
                        onClick={() => {
                          const updated = settings.gradingCriteria.important.filter((_, idx) => idx !== i)
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, important: updated } })
                        }}
                        className="text-zinc-500 hover:text-red-400"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bonus Criteria */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">🟢 Bonus Criteria</h3>
                    <p className="text-xs text-zinc-500">Nice-to-have signals (recommended 5 pts each)</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      gradingCriteria: {
                        ...settings.gradingCriteria,
                        bonus: [...settings.gradingCriteria.bonus, { name: 'New Criteria', weight: 5 }]
                      }
                    })}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.gradingCriteria.bonus.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.bonus]
                          updated[i] = { ...item, name: e.target.value }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, bonus: updated } })
                        }}
                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => {
                          const updated = [...settings.gradingCriteria.bonus]
                          updated[i] = { ...item, weight: parseInt(e.target.value) || 0 }
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, bonus: updated } })
                        }}
                        className="w-16 px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm text-center"
                      />
                      <span className="text-zinc-500 text-xs w-6">pts</span>
                      <button
                        onClick={() => {
                          const updated = settings.gradingCriteria.bonus.filter((_, idx) => idx !== i)
                          setSettings({ ...settings, gradingCriteria: { ...settings.gradingCriteria, bonus: updated } })
                        }}
                        className="text-zinc-500 hover:text-red-400"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Weight */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Total Weight</span>
                  {(() => {
                    const total = 
                      settings.gradingCriteria.priority.reduce((a, b) => a + b.weight, 0) +
                      settings.gradingCriteria.important.reduce((a, b) => a + b.weight, 0) +
                      settings.gradingCriteria.bonus.reduce((a, b) => a + b.weight, 0)
                    return (
                      <span className={`text-lg font-bold ${total === 100 ? 'text-emerald-400' : total > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {total}/100
                      </span>
                    )
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}