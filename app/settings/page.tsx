'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import UserNav from '@/components/UserNav'

interface LLMSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  localModel: string
  cloudModel: string
  systemPromptBase: string
  bannedPhrases: string[]
  goodOpeners: string[]
  companyDescription: string
  services: string[]
  idealCustomerSignals: string[]
  abmExamples: string[]
}

const defaultSettings: LLMSettings = {
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  localModel: 'techstack-outreach',
  cloudModel: 'llama-3.3-70b-versatile',
  systemPromptBase: `You write cold outreach for Tech-stack.io. Your messages are short, specific, and never generic.`,
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
    `Brittany,
It's Michael, managing partner at Techstack. Congrats on the Chicago Titan 100. COO for six months and already being recognized alongside the region's top executives.
Eight functions. Gen-3 succession. Tariff exposure on Reynosa. That's a lot to navigate while building your leadership profile externally. Well deserved recognition.
I know the holidays are busy, especially with Revcor's Salvation Army work and Angel Tree coming up. Enjoy the season. Wishing you and REVCOR team Merry Christmas!`,
    `Alex,
Been following Hoffer for a while now. Caught John Strubulis's piece in Sustainable Packaging News on circularity and flexible packaging.
Love what you all are building over there. Most sustainability talk in plastics feels defensive. This was different. Real engineering thinking about how caps and spouts fit into a closed loop system. Small components, big impact.
Hope you get some real time off with family this Christmas.`,
    `Gary,
Five wins at the INCA Awards. That's a statement.
K Systems and Weber under one roof less than a year and already taking whole categories. Not easy to pull off.
The judges called the Nottingham project "a beautifully designed building and an expertly installed system." That's not participation trophy talk. That's real validation.
First full year after the acquisition and you're stacking the right proof points. Strong way to finish 2025.
Hope you and the team get a chance to switch off over Christmas. Well deserved.`
  ]
}

export default function Settings() {
  const [settings, setSettings] = useState<LLMSettings>(defaultSettings)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'model' | 'prompts' | 'company' | 'examples' | 'abm'>('model')
  const [saved, setSaved] = useState(false)
  const [newBannedPhrase, setNewBannedPhrase] = useState('')
  const [newOpener, setNewOpener] = useState('')
  const [newService, setNewService] = useState('')
  const [newSignal, setNewSignal] = useState('')
  const [newAbmExample, setNewAbmExample] = useState('')
  const [editingAbmIndex, setEditingAbmIndex] = useState<number | null>(null)

  useEffect(() => {
    // Load settings from localStorage, merge with defaults for new properties
    const savedSettings = localStorage.getItem('llm-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings({ ...defaultSettings, ...parsed })
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('llm-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetToDefaults = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(defaultSettings)
      localStorage.setItem('llm-settings', JSON.stringify(defaultSettings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const addBannedPhrase = () => {
    if (newBannedPhrase.trim()) {
      setSettings({...settings, bannedPhrases: [...settings.bannedPhrases, newBannedPhrase.trim()]})
      setNewBannedPhrase('')
    }
  }

  const removeBannedPhrase = (index: number) => {
    setSettings({...settings, bannedPhrases: settings.bannedPhrases.filter((_, i) => i !== index)})
  }

  const addOpener = () => {
    if (newOpener.trim()) {
      setSettings({...settings, goodOpeners: [...settings.goodOpeners, newOpener.trim()]})
      setNewOpener('')
    }
  }

  const removeOpener = (index: number) => {
    setSettings({...settings, goodOpeners: settings.goodOpeners.filter((_, i) => i !== index)})
  }

  const addService = () => {
    if (newService.trim()) {
      setSettings({...settings, services: [...settings.services, newService.trim()]})
      setNewService('')
    }
  }

  const removeService = (index: number) => {
    setSettings({...settings, services: settings.services.filter((_, i) => i !== index)})
  }

  const addSignal = () => {
    if (newSignal.trim()) {
      setSettings({...settings, idealCustomerSignals: [...settings.idealCustomerSignals, newSignal.trim()]})
      setNewSignal('')
    }
  }

  const removeSignal = (index: number) => {
    setSettings({...settings, idealCustomerSignals: settings.idealCustomerSignals.filter((_, i) => i !== index)})
  }

  const addAbmExample = () => {
    if (newAbmExample.trim()) {
      setSettings({...settings, abmExamples: [...settings.abmExamples, newAbmExample.trim()]})
      setNewAbmExample('')
    }
  }

  const removeAbmExample = (index: number) => {
    setSettings({...settings, abmExamples: settings.abmExamples.filter((_, i) => i !== index)})
  }

  const updateAbmExample = (index: number, value: string) => {
    const updated = [...settings.abmExamples]
    updated[index] = value
    setSettings({...settings, abmExamples: updated})
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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">TS</span>
            </div>
        
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">✨</span>
            <span>Generate</span>
          </Link>
          <Link href="/bulk" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📦</span>
            <span>Bulk Generate</span>
          </Link>
          <Link href="/saved" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">💾</span>
            <span>Saved Companies</span>
          </Link>
          <Link href="/history" className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">
            <span className="text-xl">📊</span>
            <span>History</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-xl font-medium shadow-lg">
            <span className="text-xl">⚙️</span>
            <span>LLM Settings</span>
          </button>
        </nav>

            <div className="p-4 border-t border-slate-700/50">
  <UserNav />
</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800/50 rounded-xl text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">LLM Settings</h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1">Configure model behavior and prompts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 font-medium text-sm"
              >
                Reset Defaults
              </button>
              <button
                onClick={saveSettings}
                className={`px-6 py-2 rounded-xl font-medium text-sm transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-500'
                }`}
              >
                {saved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-slate-700/50 px-4 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'model', label: '🤖 Model', desc: 'LLM Parameters' },
              { id: 'prompts', label: '📝 Prompts', desc: 'System Prompts' },
              { id: 'company', label: '🏢 Company', desc: 'Tech-stack Info' },
              { id: 'abm', label: '💜 ABM', desc: 'Soft Touch Examples' },
              { id: 'examples', label: '💡 Examples', desc: 'Good/Bad Patterns' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-orange-400 border-orange-400' 
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Model Tab */}
            {activeTab === 'model' && (
              <>
                {/* Model Selection */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Model Selection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Local Model (Ollama)</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white"
                        value={settings.localModel}
                        onChange={(e) => setSettings({...settings, localModel: e.target.value})}
                      >
                        <option value="techstack-outreach">techstack-outreach (Custom)</option>
                        <option value="llama3.1:8b">llama3.1:8b</option>
                        <option value="llama3.1:70b">llama3.1:70b</option>
                        <option value="mistral">mistral</option>
                        <option value="mixtral">mixtral</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Run `ollama list` to see available models</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Cloud Model (Groq)</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white"
                        value={settings.cloudModel}
                        onChange={(e) => setSettings({...settings, cloudModel: e.target.value})}
                      >
                        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                        <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                        <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                        <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parameters */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Generation Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Temperature: {settings.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Focused (0)</span>
                        <span>Creative (1)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Top P: {settings.topP}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.topP}
                        onChange={(e) => setSettings({...settings, topP: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Narrow (0)</span>
                        <span>Diverse (1)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Max Tokens: {settings.maxTokens}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Short (100)</span>
                        <span>Long (2000)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Frequency Penalty: {settings.frequencyPenalty}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.frequencyPenalty}
                        onChange={(e) => setSettings({...settings, frequencyPenalty: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Allow Repetition</span>
                        <span>Avoid Repetition</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameter Presets */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Presets</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setSettings({...settings, temperature: 0.3, topP: 0.8})}
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-center transition-all"
                    >
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-white font-medium text-sm">Precise</div>
                      <div className="text-slate-400 text-xs">Low creativity</div>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, temperature: 0.7, topP: 0.9})}
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-center transition-all"
                    >
                      <div className="text-2xl mb-2">⚖️</div>
                      <div className="text-white font-medium text-sm">Balanced</div>
                      <div className="text-slate-400 text-xs">Default</div>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, temperature: 0.9, topP: 0.95})}
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-center transition-all"
                    >
                      <div className="text-2xl mb-2">🎨</div>
                      <div className="text-white font-medium text-sm">Creative</div>
                      <div className="text-slate-400 text-xs">More variety</div>
                    </button>
                    <button
                      onClick={() => setSettings({...settings, temperature: 0.5, topP: 0.85, frequencyPenalty: 0.5})}
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-center transition-all"
                    >
                      <div className="text-2xl mb-2">✍️</div>
                      <div className="text-white font-medium text-sm">Unique</div>
                      <div className="text-slate-400 text-xs">Less repetition</div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
              <>
                {/* Base System Prompt */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Base System Prompt</h3>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white h-32 resize-none font-mono text-sm"
                    value={settings.systemPromptBase}
                    onChange={(e) => setSettings({...settings, systemPromptBase: e.target.value})}
                    placeholder="Enter base system prompt..."
                  />
                  <p className="text-xs text-slate-500 mt-2">This is prepended to all generation requests</p>
                </div>

                {/* Banned Phrases */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Banned Phrases</h3>
                  <p className="text-sm text-slate-400 mb-4">The AI will never use these phrases in generated messages</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      placeholder="Add banned phrase..."
                      value={newBannedPhrase}
                      onChange={(e) => setNewBannedPhrase(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addBannedPhrase()}
                    />
                    <button
                      onClick={addBannedPhrase}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {settings.bannedPhrases.map((phrase, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg text-sm"
                      >
                        {phrase}
                        <button
                          onClick={() => removeBannedPhrase(index)}
                          className="hover:text-red-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Good Openers */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Good Openers</h3>
                  <p className="text-sm text-slate-400 mb-4">Example opening patterns for the AI to emulate</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      placeholder="Add opener pattern..."
                      value={newOpener}
                      onChange={(e) => setNewOpener(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addOpener()}
                    />
                    <button
                      onClick={addOpener}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {settings.goodOpeners.map((opener, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-green-900/20 border border-green-700/30 text-green-300 rounded-lg text-sm"
                      >
                        <span>{opener}</span>
                        <button
                          onClick={() => removeOpener(index)}
                          className="hover:text-green-100 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <>
                {/* Company Description */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Company Description</h3>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white h-32 resize-none"
                    value={settings.companyDescription}
                    onChange={(e) => setSettings({...settings, companyDescription: e.target.value})}
                    placeholder="Describe your company..."
                  />
                </div>

                {/* Services */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Services Offered</h3>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      placeholder="Add service..."
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addService()}
                    />
                    <button
                      onClick={addService}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {settings.services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-blue-900/20 border border-blue-700/30 text-blue-300 rounded-lg text-sm"
                      >
                        <span>{service}</span>
                        <button
                          onClick={() => removeService(index)}
                          className="hover:text-blue-100 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ideal Customer Signals */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Ideal Customer Signals</h3>
                  <p className="text-sm text-slate-400 mb-4">Triggers that indicate a good prospect</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm"
                      placeholder="Add signal..."
                      value={newSignal}
                      onChange={(e) => setNewSignal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSignal()}
                    />
                    <button
                      onClick={addSignal}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {settings.idealCustomerSignals.map((signal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 border border-purple-700/50 text-purple-300 rounded-lg text-sm"
                      >
                        {signal}
                        <button
                          onClick={() => removeSignal(index)}
                          className="hover:text-purple-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ABM Tab */}
            {activeTab === 'abm' && (
              <>
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">ABM Soft Touch Examples</h3>
                  <p className="text-sm text-slate-300">These examples teach the AI how to write warm, personalized ABM messages. Recognition-focused, no sales pitch, genuine tone.</p>
                </div>

                {/* Existing ABM Examples */}
                <div className="space-y-4">
                  {(settings.abmExamples || []).map((example, index) => (
                    <div key={index} className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-purple-400">EXAMPLE {index + 1}</span>
                        <div className="flex gap-2">
                          {editingAbmIndex === index ? (
                            <button
                              onClick={() => setEditingAbmIndex(null)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-500"
                            >
                              ✓ Done
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingAbmIndex(index)}
                              className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs hover:bg-slate-600"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          <button
                            onClick={() => removeAbmExample(index)}
                            className="px-3 py-1 bg-red-900/50 text-red-400 rounded-lg text-xs hover:bg-red-900"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      
                      {editingAbmIndex === index ? (
                        <textarea
                          className="w-full px-4 py-3 bg-slate-900/50 border border-purple-600/50 rounded-xl text-white h-48 resize-none text-sm"
                          value={example}
                          onChange={(e) => updateAbmExample(index, e.target.value)}
                        />
                      ) : (
                        <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-xl">
                          <p className="text-white text-sm whitespace-pre-wrap">{example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New ABM Example */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Add New ABM Example</h3>
                  <p className="text-sm text-slate-400 mb-4">Paste a real message that worked well. The AI learns from these.</p>
                  
                  <textarea
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white h-40 resize-none text-sm mb-4"
                    placeholder="Paste your best ABM message here...

Example format:
[First Name],
[Recognition/observation about their work]
[Why it matters / your insight]
[Warm closing / seasonal greeting]"
                    value={newAbmExample}
                    onChange={(e) => setNewAbmExample(e.target.value)}
                  />
                  
                  <button
                    onClick={addAbmExample}
                    disabled={!newAbmExample.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Example
                  </button>
                </div>

                {/* Tips */}
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">What Makes a Good ABM Example?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                      <div className="text-green-400 font-semibold mb-2">✓ Do</div>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Start with first name only</li>
                        <li>• Reference specific achievements</li>
                        <li>• Show genuine insight</li>
                        <li>• End with warm wishes</li>
                        <li>• Keep it personal</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                      <div className="text-red-400 font-semibold mb-2">✗ Don't</div>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Include sales pitch</li>
                        <li>• Ask for meetings</li>
                        <li>• Use "I'd love to connect"</li>
                        <li>• Be vague or generic</li>
                        <li>• Start with "I"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && (
              <>
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Good Message Examples</h3>
                  <p className="text-sm text-slate-400 mb-4">These examples teach the AI what good outreach looks like</p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                      <div className="text-xs text-green-400 font-semibold mb-2">POST-FUNDING</div>
                      <p className="text-white text-sm mb-2">"Saw the Series B news - congrats! Scaling infrastructure while shipping fast is brutal at this stage. How's your platform team handling the growth?"</p>
                      <div className="text-xs text-slate-400">Score: 95 • Specific trigger, industry-aware, soft question</div>
                    </div>

                    <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                      <div className="text-xs text-green-400 font-semibold mb-2">ACQUISITION</div>
                      <p className="text-white text-sm mb-2">"The DataCorp acquisition is interesting - lots of potential synergies on the data pipeline side. Curious how you're approaching the platform consolidation timeline?"</p>
                      <div className="text-xs text-slate-400">Score: 92 • References specific event, shows technical understanding</div>
                    </div>

                    <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                      <div className="text-xs text-green-400 font-semibold mb-2">HIRING STRUGGLES</div>
                      <p className="text-white text-sm mb-2">"That Staff DevOps role has been open a while - brutal market right now. Some teams are bridging with contract engineers while they search. Is that something you've considered?"</p>
                      <div className="text-xs text-slate-400">Score: 90 • Acknowledges their pain, offers solution without pitching</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Bad Message Examples</h3>
                  <p className="text-sm text-slate-400 mb-4">These show the AI what to avoid</p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                      <p className="text-white text-sm mb-2 line-through opacity-60">"Hi, I hope this email finds you well. I wanted to reach out because I came across your profile..."</p>
                      <div className="text-xs text-red-400">❌ Generic opener, No personalization, Starts with I, No value</div>
                    </div>

                    <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                      <p className="text-white text-sm mb-2 line-through opacity-60">"We at Tech-stack.io help companies like yours optimize their DevOps processes. Would you be open to a 15-minute call?"</p>
                      <div className="text-xs text-red-400">❌ Leads with company, Lists services, Asks for call too early</div>
                    </div>

                    <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
                      <p className="text-white text-sm mb-2 line-through opacity-60">"I noticed you're hiring DevOps engineers. We have a great team that could help. Let me know if you'd like to discuss."</p>
                      <div className="text-xs text-red-400">❌ Weak observation, No specific value, Generic CTA</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-700/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-orange-400 mb-2">💡 Add Your Own Examples</h3>
                  <p className="text-sm text-slate-300">Share your best performing messages and I can add them to the training data. Good examples dramatically improve output quality.</p>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}