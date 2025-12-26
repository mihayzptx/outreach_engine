'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ICPSettings {
  industries: { name: string; weight: number; enabled: boolean }[]
  companySizes: { min: number; max: number; label: string; weight: number; enabled: boolean }[]
  fundingStages: { name: string; weight: number; enabled: boolean }[]
  geographies: { name: string; weight: number; enabled: boolean }[]
  companyAge: { min: number; max: number; weight: number }
  buyingSignals: { name: string; points: number; enabled: boolean }[]
  negativeSignals: { name: string; points: number; enabled: boolean }[]
  targetTitles: { title: string; priority: 'primary' | 'secondary' }[]
  techStack: { name: string; weight: number; enabled: boolean }[]
}

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
  signalSettings: {
    timeframeDays: number
    enabledSignals: string[]
    signalPatterns: {
      category: string
      label: string
      icon: string
      priority: 'high' | 'medium' | 'low'
      keywords: string[]
      enabled: boolean
    }[]
  }
  icp: ICPSettings
}

const defaultICPSettings: ICPSettings = {
  industries: [
    { name: 'SaaS', weight: 10, enabled: true },
    { name: 'Fintech', weight: 8, enabled: true },
    { name: 'Healthcare Tech', weight: 7, enabled: true },
    { name: 'E-commerce', weight: 6, enabled: true },
    { name: 'AI/ML', weight: 9, enabled: true },
    { name: 'Cybersecurity', weight: 8, enabled: true },
    { name: 'Developer Tools', weight: 9, enabled: true },
    { name: 'Data/Analytics', weight: 7, enabled: true },
    { name: 'EdTech', weight: 5, enabled: false },
    { name: 'MarTech', weight: 5, enabled: false }
  ],
  companySizes: [
    { min: 1, max: 50, label: '1-50', weight: 3, enabled: true },
    { min: 51, max: 200, label: '51-200', weight: 10, enabled: true },
    { min: 201, max: 500, label: '201-500', weight: 8, enabled: true },
    { min: 501, max: 1000, label: '501-1000', weight: 5, enabled: true },
    { min: 1001, max: 100000, label: '1000+', weight: 2, enabled: false }
  ],
  fundingStages: [
    { name: 'Seed', weight: 5, enabled: true },
    { name: 'Series A', weight: 10, enabled: true },
    { name: 'Series B', weight: 10, enabled: true },
    { name: 'Series C', weight: 8, enabled: true },
    { name: 'Series D+', weight: 5, enabled: true },
    { name: 'Public', weight: 2, enabled: false },
    { name: 'Bootstrapped', weight: 4, enabled: true }
  ],
  geographies: [
    { name: 'United States', weight: 10, enabled: true },
    { name: 'Canada', weight: 8, enabled: true },
    { name: 'United Kingdom', weight: 7, enabled: true },
    { name: 'Germany', weight: 6, enabled: true },
    { name: 'Western Europe', weight: 6, enabled: true },
    { name: 'Australia', weight: 5, enabled: true },
    { name: 'Israel', weight: 7, enabled: true }
  ],
  companyAge: { min: 2, max: 15, weight: 5 },
  buyingSignals: [
    { name: 'Recently Funded', points: 20, enabled: true },
    { name: 'Hiring DevOps/Platform Engineers', points: 15, enabled: true },
    { name: 'New CTO/VP Engineering', points: 12, enabled: true },
    { name: 'Post-Acquisition Integration', points: 15, enabled: true },
    { name: 'Rapid Headcount Growth', points: 10, enabled: true },
    { name: 'Cloud Migration Announced', points: 12, enabled: true },
    { name: 'Infrastructure Problems Mentioned', points: 15, enabled: true },
    { name: 'Scaling Challenges', points: 12, enabled: true },
    { name: 'Security/Compliance Needs', points: 10, enabled: true }
  ],
  negativeSignals: [
    { name: 'Large Internal DevOps Team', points: -15, enabled: true },
    { name: 'Recent Layoffs', points: -10, enabled: true },
    { name: 'Competitor Customer', points: -20, enabled: true },
    { name: 'Government/Public Sector', points: -5, enabled: true },
    { name: 'Consulting/Agency', points: -10, enabled: true }
  ],
  targetTitles: [
    { title: 'CTO', priority: 'primary' },
    { title: 'VP of Engineering', priority: 'primary' },
    { title: 'VP of Infrastructure', priority: 'primary' },
    { title: 'Head of Platform', priority: 'primary' },
    { title: 'Director of Engineering', priority: 'secondary' },
    { title: 'Director of DevOps', priority: 'secondary' },
    { title: 'Engineering Manager', priority: 'secondary' }
  ],
  techStack: [
    { name: 'AWS', weight: 8, enabled: true },
    { name: 'GCP', weight: 8, enabled: true },
    { name: 'Azure', weight: 7, enabled: true },
    { name: 'Kubernetes', weight: 10, enabled: true },
    { name: 'Terraform', weight: 9, enabled: true },
    { name: 'Docker', weight: 7, enabled: true },
    { name: 'Jenkins', weight: 6, enabled: true },
    { name: 'GitHub Actions', weight: 7, enabled: true },
    { name: 'GitLab CI', weight: 7, enabled: true },
    { name: 'Datadog', weight: 6, enabled: true }
  ]
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
  },
  signalSettings: {
    timeframeDays: 90,
    enabledSignals: ['funding', 'hiring', 'leadership', 'expansion', 'acquisition', 'awards', 'product', 'tech_stack'],
    signalPatterns: [
      { category: 'funding', label: 'Funding', icon: '💰', priority: 'high', keywords: ['raised', 'funding', 'series', 'seed', 'investment', 'venture', 'capital', 'million', 'billion'], enabled: true },
      { category: 'hiring', label: 'Hiring', icon: '👥', priority: 'high', keywords: ['hiring', 'job', 'career', 'engineer', 'devops', 'platform', 'sre', 'infrastructure', 'growing team'], enabled: true },
      { category: 'leadership', label: 'Leadership', icon: '👔', priority: 'medium', keywords: ['appoint', 'hire', 'promote', 'cto', 'ceo', 'vp', 'chief', 'head of', 'joins', 'new role'], enabled: true },
      { category: 'expansion', label: 'Expansion', icon: '🌍', priority: 'medium', keywords: ['expand', 'office', 'location', 'market', 'international', 'global', 'launch', 'new region'], enabled: true },
      { category: 'acquisition', label: 'M&A', icon: '🤝', priority: 'high', keywords: ['acquire', 'acquisition', 'merger', 'merge', 'bought', 'purchase', 'deal'], enabled: true },
      { category: 'awards', label: 'Awards', icon: '🏆', priority: 'low', keywords: ['award', 'win', 'recognized', 'ranked', 'best', 'top', 'fastest', 'inc 500', 'forbes'], enabled: true },
      { category: 'product', label: 'Product', icon: '🚀', priority: 'medium', keywords: ['launch', 'announce', 'release', 'product', 'feature', 'platform', 'new version'], enabled: true },
      { category: 'tech_stack', label: 'Tech Stack', icon: '⚙️', priority: 'medium', keywords: ['aws', 'azure', 'gcp', 'kubernetes', 'k8s', 'terraform', 'docker', 'devops', 'ci/cd', 'jenkins'], enabled: true }
    ]
  },
  icp: defaultICPSettings
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'model' | 'prompts' | 'company' | 'examples' | 'grading' | 'signals' | 'icp' | 'integrations' | 'usage'>('model')
  const [apiUsage, setApiUsage] = useState<any>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [newPhrase, setNewPhrase] = useState('')
  const [newOpener, setNewOpener] = useState('')
  const [newService, setNewService] = useState('')
  const [newSignal, setNewSignal] = useState('')
  const [newAbm, setNewAbm] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newGeo, setNewGeo] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTech, setNewTech] = useState('')
  const [newBuyingSignal, setNewBuyingSignal] = useState('')
  const [newNegativeSignal, setNewNegativeSignal] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('llm-settings')
    if (stored) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }) } catch {}
    }
  }, [])

  const saveSettings = async () => {
    // Save to localStorage first
    localStorage.setItem('llm-settings', JSON.stringify(settings))
    
    // Save to database for cross-device sync
    try {
      // Save full settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'default',
          settings: {
            llm: {
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              topP: settings.topP,
              frequencyPenalty: settings.frequencyPenalty,
              presencePenalty: settings.presencePenalty,
              localModel: settings.localModel,
              localEndpoint: settings.localEndpoint,
              cloudModel: settings.cloudModel
            },
            prompts: {
              systemPromptBase: settings.systemPromptBase,
              bannedPhrases: settings.bannedPhrases,
              goodOpeners: settings.goodOpeners
            },
            company: {
              companyDescription: settings.companyDescription,
              services: settings.services,
              idealCustomerSignals: settings.idealCustomerSignals,
              abmExamples: settings.abmExamples
            },
            grading: settings.gradingCriteria,
            signals: settings.signalSettings,
            icp: settings.icp
          }
        })
      })
      
      // Also save ICP separately for extension sync
      await fetch('/api/settings/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'default',
          icp: settings.icp 
        })
      })
    } catch (e) {
      console.error('Failed to sync settings to database:', e)
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const loadSettingsFromDB = async () => {
    try {
      const res = await fetch('/api/settings?userId=default')
      const data = await res.json()
      if (data.success && data.settings) {
        // Merge DB settings with defaults
        const dbSettings = data.settings
        const merged = {
          ...defaultSettings,
          ...(dbSettings.llm || {}),
          ...(dbSettings.prompts || {}),
          ...(dbSettings.company || {}),
          gradingCriteria: dbSettings.grading || defaultSettings.gradingCriteria,
          signalSettings: dbSettings.signals || defaultSettings.signalSettings,
          icp: dbSettings.icp || defaultSettings.icp
        }
        return merged
      }
    } catch (e) {
      console.log('Could not load settings from DB:', e)
    }
    return null
  }

  const resetDefaults = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(defaultSettings)
      localStorage.setItem('llm-settings', JSON.stringify(defaultSettings))
    }
  }

  const loadApiUsage = async () => {
    setLoadingUsage(true)
    try {
      const res = await fetch('/api/usage')
      const data = await res.json()
      if (data.success) {
        setApiUsage(data.usage)
      }
    } catch (e) {
      console.error('Failed to load API usage:', e)
    }
    setLoadingUsage(false)
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

  // Calculate max ICP score
  const calculateICPMaxScore = () => {
    const icp = settings.icp
    const industryMax = Math.max(...icp.industries.filter(i => i.enabled).map(i => i.weight), 0)
    const sizeMax = Math.max(...icp.companySizes.filter(s => s.enabled).map(s => s.weight), 0)
    const fundingMax = Math.max(...icp.fundingStages.filter(f => f.enabled).map(f => f.weight), 0)
    const geoMax = Math.max(...icp.geographies.filter(g => g.enabled).map(g => g.weight), 0)
    const signalsTotal = icp.buyingSignals.filter(s => s.enabled).reduce((sum, s) => sum + s.points, 0)
    const techTotal = icp.techStack.filter(t => t.enabled).reduce((sum, t) => sum + t.weight, 0)
    
    return industryMax + sizeMax + fundingMax + geoMax + signalsTotal + techTotal
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
              { id: 'grading', label: '📊 Grading' },
              { id: 'signals', label: '🔔 Signals' },
              { id: 'icp', label: '🎯 ICP' },
              { id: 'integrations', label: '🔗 Integrations' },
              { id: 'usage', label: '📈 Usage' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  if (tab.id === 'usage' && !apiUsage) loadApiUsage()
                }}
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

          {/* Signals Tab */}
          {activeTab === 'signals' && (
            <>
              {/* Timeframe Setting */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Signal Timeframe</h3>
                <p className="text-zinc-500 text-sm mb-4">Only show signals from news and events within this timeframe.</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 block mb-1">Days to look back</label>
                    <input 
                      type="number" 
                      min="7" 
                      max="365"
                      value={settings.signalSettings?.timeframeDays || 90}
                      onChange={e => setSettings({
                        ...settings,
                        signalSettings: {
                          ...settings.signalSettings,
                          timeframeDays: parseInt(e.target.value) || 90
                        }
                      })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[30, 60, 90, 180].map(days => (
                      <button
                        key={days}
                        onClick={() => setSettings({
                          ...settings,
                          signalSettings: { ...settings.signalSettings, timeframeDays: days }
                        })}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          settings.signalSettings?.timeframeDays === days 
                            ? 'bg-yellow-400 text-zinc-900' 
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signal Types */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Signal Types</h3>
                <p className="text-zinc-500 text-sm mb-4">Enable or disable signal categories and adjust their priority.</p>
                
                <div className="space-y-3">
                  {(settings.signalSettings?.signalPatterns || []).map((signal, idx) => (
                    <div key={signal.category} className={`p-4 rounded-lg border ${signal.enabled ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-950/50 border-zinc-800 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{signal.icon}</span>
                          <div>
                            <h4 className="text-white font-medium">{signal.label}</h4>
                            <p className="text-zinc-500 text-xs">{signal.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={signal.priority}
                            onChange={e => {
                              const updated = [...settings.signalSettings.signalPatterns]
                              updated[idx] = { ...updated[idx], priority: e.target.value as 'high' | 'medium' | 'low' }
                              setSettings({ ...settings, signalSettings: { ...settings.signalSettings, signalPatterns: updated } })
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              signal.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              signal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            } border`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={signal.enabled}
                              onChange={e => {
                                const updated = [...settings.signalSettings.signalPatterns]
                                updated[idx] = { ...updated[idx], enabled: e.target.checked }
                                setSettings({ ...settings, signalSettings: { ...settings.signalSettings, signalPatterns: updated } })
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                          </label>
                        </div>
                      </div>
                      
                      {/* Keywords */}
                      <div>
                        <label className="text-xs text-zinc-500 block mb-2">Keywords (comma-separated)</label>
                        <input
                          type="text"
                          value={signal.keywords.join(', ')}
                          onChange={e => {
                            const updated = [...settings.signalSettings.signalPatterns]
                            updated[idx] = { ...updated[idx], keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) }
                            setSettings({ ...settings, signalSettings: { ...settings.signalSettings, signalPatterns: updated } })
                          }}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 text-sm"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Signal */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Add Custom Signal</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Category</label>
                    <input type="text" id="newSignalCategory" placeholder="custom_signal" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Label</label>
                    <input type="text" id="newSignalLabel" placeholder="Custom Signal" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Icon</label>
                    <input type="text" id="newSignalIcon" placeholder="🔔" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">&nbsp;</label>
                    <button
                      onClick={() => {
                        const category = (document.getElementById('newSignalCategory') as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '_')
                        const label = (document.getElementById('newSignalLabel') as HTMLInputElement).value.trim()
                        const icon = (document.getElementById('newSignalIcon') as HTMLInputElement).value.trim() || '🔔'
                        if (category && label) {
                          const newSignal = { category, label, icon, priority: 'medium' as const, keywords: [], enabled: true }
                          setSettings({
                            ...settings,
                            signalSettings: {
                              ...settings.signalSettings,
                              signalPatterns: [...settings.signalSettings.signalPatterns, newSignal]
                            }
                          })
                          ;(document.getElementById('newSignalCategory') as HTMLInputElement).value = ''
                          ;(document.getElementById('newSignalLabel') as HTMLInputElement).value = ''
                          ;(document.getElementById('newSignalIcon') as HTMLInputElement).value = ''
                        }
                      }}
                      className="w-full px-3 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium hover:bg-yellow-300"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Signal Priority Legend */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Priority Guide</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-400 font-medium text-sm">High Priority</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Immediate buying signals. Contact ASAP.</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="text-yellow-400 font-medium text-sm">Medium Priority</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Good engagement opportunity. Add to sequence.</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-blue-400 font-medium text-sm">Low Priority</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Nice to know. Use for personalization.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ICP Tab */}
          {activeTab === 'icp' && (
            <>
              {/* ICP Overview */}
              <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 border border-yellow-400/20 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🎯 Ideal Customer Profile</h3>
                    <p className="text-zinc-400 text-sm">Define your perfect customer. This profile is used to automatically score companies and prioritize your outreach.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-400">{calculateICPMaxScore()}</div>
                    <div className="text-xs text-zinc-500">Max Score</div>
                  </div>
                </div>
              </div>

              {/* Target Industries */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">🏷️ Target Industries</h3>
                <div className="space-y-2">
                  {settings.icp.industries.map((ind, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={ind.enabled}
                        onChange={() => {
                          const updated = [...settings.icp.industries]
                          updated[idx].enabled = !updated[idx].enabled
                          setSettings({ ...settings, icp: { ...settings.icp, industries: updated } })
                        }}
                        className="rounded border-zinc-600"
                      />
                      <span className={`flex-1 text-sm ${ind.enabled ? 'text-white' : 'text-zinc-500'}`}>{ind.name}</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ind.weight}
                        onChange={(e) => {
                          const updated = [...settings.icp.industries]
                          updated[idx].weight = parseInt(e.target.value)
                          setSettings({ ...settings, icp: { ...settings.icp, industries: updated } })
                        }}
                        disabled={!ind.enabled}
                        className="w-24 accent-yellow-400"
                      />
                      <span className={`w-8 text-sm text-right ${ind.enabled ? 'text-yellow-400' : 'text-zinc-600'}`}>{ind.weight}</span>
                      <button
                        onClick={() => {
                          const updated = settings.icp.industries.filter((_, i) => i !== idx)
                          setSettings({ ...settings, icp: { ...settings.icp, industries: updated } })
                        }}
                        className="text-zinc-600 hover:text-red-400 text-sm"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    placeholder="Add industry..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && newIndustry.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, industries: [...settings.icp.industries, { name: newIndustry.trim(), weight: 5, enabled: true }] } }),
                      setNewIndustry('')
                    )}
                  />
                  <button
                    onClick={() => newIndustry.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, industries: [...settings.icp.industries, { name: newIndustry.trim(), weight: 5, enabled: true }] } }),
                      setNewIndustry('')
                    )}
                    className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium"
                  >+ Add</button>
                </div>
              </div>

              {/* Company Size */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">👥 Company Size</h3>
                <div className="space-y-2">
                  {settings.icp.companySizes.map((size, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={size.enabled}
                        onChange={() => {
                          const updated = [...settings.icp.companySizes]
                          updated[idx].enabled = !updated[idx].enabled
                          setSettings({ ...settings, icp: { ...settings.icp, companySizes: updated } })
                        }}
                        className="rounded border-zinc-600"
                      />
                      <span className={`w-24 text-sm ${size.enabled ? 'text-white' : 'text-zinc-500'}`}>{size.label} employees</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${size.enabled ? 'bg-yellow-400' : 'bg-zinc-700'}`} style={{ width: `${size.weight * 10}%` }}></div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={size.weight}
                        onChange={(e) => {
                          const updated = [...settings.icp.companySizes]
                          updated[idx].weight = parseInt(e.target.value)
                          setSettings({ ...settings, icp: { ...settings.icp, companySizes: updated } })
                        }}
                        disabled={!size.enabled}
                        className="w-24 accent-yellow-400"
                      />
                      <span className={`w-8 text-sm text-right ${size.enabled ? 'text-yellow-400' : 'text-zinc-600'}`}>{size.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funding Stage */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">💰 Funding Stage</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {settings.icp.fundingStages.map((stage, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const updated = [...settings.icp.fundingStages]
                        updated[idx].enabled = !updated[idx].enabled
                        setSettings({ ...settings, icp: { ...settings.icp, fundingStages: updated } })
                      }}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${stage.enabled ? 'bg-yellow-400/10 border-yellow-400/50 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{stage.name}</span>
                        {stage.enabled && <span className="text-yellow-400 text-xs">+{stage.weight}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geography */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">🌍 Target Geography</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.icp.geographies.map((geo, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const updated = [...settings.icp.geographies]
                        updated[idx].enabled = !updated[idx].enabled
                        setSettings({ ...settings, icp: { ...settings.icp, geographies: updated } })
                      }}
                      className={`px-3 py-2 rounded-lg cursor-pointer border transition-all flex items-center gap-2 ${geo.enabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                    >
                      <span className="text-sm">{geo.name}</span>
                      {geo.enabled && (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={geo.weight}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const updated = [...settings.icp.geographies]
                            updated[idx].weight = parseInt(e.target.value) || 1
                            setSettings({ ...settings, icp: { ...settings.icp, geographies: updated } })
                          }}
                          className="w-10 px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-center"
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const updated = settings.icp.geographies.filter((_, i) => i !== idx)
                          setSettings({ ...settings, icp: { ...settings.icp, geographies: updated } })
                        }}
                        className="text-zinc-600 hover:text-red-400 text-xs"
                      >✕</button>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newGeo}
                      onChange={(e) => setNewGeo(e.target.value)}
                      placeholder="Add region..."
                      className="w-32 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && newGeo.trim() && (
                        setSettings({ ...settings, icp: { ...settings.icp, geographies: [...settings.icp.geographies, { name: newGeo.trim(), weight: 5, enabled: true }] } }),
                        setNewGeo('')
                      )}
                    />
                    <button
                      onClick={() => newGeo.trim() && (
                        setSettings({ ...settings, icp: { ...settings.icp, geographies: [...settings.icp.geographies, { name: newGeo.trim(), weight: 5, enabled: true }] } }),
                        setNewGeo('')
                      )}
                      className="px-2 py-1 bg-zinc-800 text-white rounded-lg text-sm"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Buying Signals */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">📈 Buying Signals (Positive)</h3>
                <div className="space-y-2">
                  {settings.icp.buyingSignals.map((signal, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={signal.enabled}
                        onChange={() => {
                          const updated = [...settings.icp.buyingSignals]
                          updated[idx].enabled = !updated[idx].enabled
                          setSettings({ ...settings, icp: { ...settings.icp, buyingSignals: updated } })
                        }}
                        className="rounded border-zinc-600"
                      />
                      <span className={`flex-1 text-sm ${signal.enabled ? 'text-white' : 'text-zinc-500'}`}>{signal.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-sm">+</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={signal.points}
                          onChange={(e) => {
                            const updated = [...settings.icp.buyingSignals]
                            updated[idx].points = parseInt(e.target.value) || 1
                            setSettings({ ...settings, icp: { ...settings.icp, buyingSignals: updated } })
                          }}
                          disabled={!signal.enabled}
                          className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-emerald-400 text-sm text-center"
                        />
                        <span className="text-zinc-500 text-xs">pts</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = settings.icp.buyingSignals.filter((_, i) => i !== idx)
                          setSettings({ ...settings, icp: { ...settings.icp, buyingSignals: updated } })
                        }}
                        className="text-zinc-600 hover:text-red-400 text-sm"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newBuyingSignal}
                    onChange={(e) => setNewBuyingSignal(e.target.value)}
                    placeholder="Add buying signal..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={() => newBuyingSignal.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, buyingSignals: [...settings.icp.buyingSignals, { name: newBuyingSignal.trim(), points: 10, enabled: true }] } }),
                      setNewBuyingSignal('')
                    )}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                  >+ Add</button>
                </div>
              </div>

              {/* Negative Signals */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">📉 Negative Signals (Penalties)</h3>
                <div className="space-y-2">
                  {settings.icp.negativeSignals.map((signal, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={signal.enabled}
                        onChange={() => {
                          const updated = [...settings.icp.negativeSignals]
                          updated[idx].enabled = !updated[idx].enabled
                          setSettings({ ...settings, icp: { ...settings.icp, negativeSignals: updated } })
                        }}
                        className="rounded border-zinc-600"
                      />
                      <span className={`flex-1 text-sm ${signal.enabled ? 'text-white' : 'text-zinc-500'}`}>{signal.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="-50"
                          max="-1"
                          value={signal.points}
                          onChange={(e) => {
                            const updated = [...settings.icp.negativeSignals]
                            updated[idx].points = parseInt(e.target.value) || -1
                            setSettings({ ...settings, icp: { ...settings.icp, negativeSignals: updated } })
                          }}
                          disabled={!signal.enabled}
                          className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-red-400 text-sm text-center"
                        />
                        <span className="text-zinc-500 text-xs">pts</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = settings.icp.negativeSignals.filter((_, i) => i !== idx)
                          setSettings({ ...settings, icp: { ...settings.icp, negativeSignals: updated } })
                        }}
                        className="text-zinc-600 hover:text-red-400 text-sm"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newNegativeSignal}
                    onChange={(e) => setNewNegativeSignal(e.target.value)}
                    placeholder="Add negative signal..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={() => newNegativeSignal.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, negativeSignals: [...settings.icp.negativeSignals, { name: newNegativeSignal.trim(), points: -10, enabled: true }] } }),
                      setNewNegativeSignal('')
                    )}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                  >+ Add</button>
                </div>
              </div>

              {/* Target Titles */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">👔 Target Titles</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-yellow-400 uppercase mb-2">Primary Contacts</h4>
                    <div className="space-y-1">
                      {settings.icp.targetTitles.filter(t => t.priority === 'primary').map((title, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                          <span className="text-white text-sm flex-1">{title.title}</span>
                          <button
                            onClick={() => {
                              const updated = settings.icp.targetTitles.filter(t => t.title !== title.title)
                              setSettings({ ...settings, icp: { ...settings.icp, targetTitles: updated } })
                            }}
                            className="text-zinc-500 hover:text-red-400 text-sm"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs text-zinc-400 uppercase mb-2">Secondary Contacts</h4>
                    <div className="space-y-1">
                      {settings.icp.targetTitles.filter(t => t.priority === 'secondary').map((title, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                          <span className="text-zinc-300 text-sm flex-1">{title.title}</span>
                          <button
                            onClick={() => {
                              const updated = settings.icp.targetTitles.filter(t => t.title !== title.title)
                              setSettings({ ...settings, icp: { ...settings.icp, targetTitles: updated } })
                            }}
                            className="text-zinc-600 hover:text-red-400 text-sm"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Add title..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={() => newTitle.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, targetTitles: [...settings.icp.targetTitles, { title: newTitle.trim(), priority: 'primary' }] } }),
                      setNewTitle('')
                    )}
                    className="px-3 py-2 bg-yellow-400 text-zinc-900 rounded-lg text-sm font-medium"
                  >+ Primary</button>
                  <button
                    onClick={() => newTitle.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, targetTitles: [...settings.icp.targetTitles, { title: newTitle.trim(), priority: 'secondary' }] } }),
                      setNewTitle('')
                    )}
                    className="px-3 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium"
                  >+ Secondary</button>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">⚙️ Tech Stack Indicators</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.icp.techStack.map((tech, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${tech.enabled ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                    >
                      <input
                        type="checkbox"
                        checked={tech.enabled}
                        onChange={() => {
                          const updated = [...settings.icp.techStack]
                          updated[idx].enabled = !updated[idx].enabled
                          setSettings({ ...settings, icp: { ...settings.icp, techStack: updated } })
                        }}
                        className="rounded border-zinc-600"
                      />
                      <span className="text-sm">{tech.name}</span>
                      {tech.enabled && (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={tech.weight}
                          onChange={(e) => {
                            const updated = [...settings.icp.techStack]
                            updated[idx].weight = parseInt(e.target.value) || 1
                            setSettings({ ...settings, icp: { ...settings.icp, techStack: updated } })
                          }}
                          className="w-10 px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-center"
                        />
                      )}
                      <button
                        onClick={() => {
                          const updated = settings.icp.techStack.filter((_, i) => i !== idx)
                          setSettings({ ...settings, icp: { ...settings.icp, techStack: updated } })
                        }}
                        className="text-zinc-600 hover:text-red-400 text-xs"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="Add technology..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && newTech.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, techStack: [...settings.icp.techStack, { name: newTech.trim(), weight: 5, enabled: true }] } }),
                      setNewTech('')
                    )}
                  />
                  <button
                    onClick={() => newTech.trim() && (
                      setSettings({ ...settings, icp: { ...settings.icp, techStack: [...settings.icp.techStack, { name: newTech.trim(), weight: 5, enabled: true }] } }),
                      setNewTech('')
                    )}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >+ Add</button>
                </div>
              </div>

              {/* Scoring Preview */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">📊 Score Calculation Preview</h3>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs">
                  <div className="text-zinc-500 mb-2">// Max possible score breakdown:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Industries (best match):</span>
                      <span className="text-yellow-400">+{Math.max(...settings.icp.industries.filter(i => i.enabled).map(i => i.weight), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Company Size (best match):</span>
                      <span className="text-yellow-400">+{Math.max(...settings.icp.companySizes.filter(s => s.enabled).map(s => s.weight), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Funding Stage (best match):</span>
                      <span className="text-yellow-400">+{Math.max(...settings.icp.fundingStages.filter(f => f.enabled).map(f => f.weight), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Geography (best match):</span>
                      <span className="text-yellow-400">+{Math.max(...settings.icp.geographies.filter(g => g.enabled).map(g => g.weight), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Buying Signals (all):</span>
                      <span className="text-emerald-400">+{settings.icp.buyingSignals.filter(s => s.enabled).reduce((sum, s) => sum + s.points, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Tech Stack (all matches):</span>
                      <span className="text-blue-400">+{settings.icp.techStack.filter(t => t.enabled).reduce((sum, t) => sum + t.weight, 0)}</span>
                    </div>
                    <div className="border-t border-zinc-800 my-2"></div>
                    <div className="flex justify-between text-white">
                      <span>Max Possible Score:</span>
                      <span className="text-yellow-400 font-bold">{calculateICPMaxScore()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs mt-3">ICP scores are normalized to 0-100 scale. Companies scoring 70+ are considered high-fit.</p>
              </div>
            </>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <IntegrationsTab />
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">API Usage & Limits</h2>
                <button 
                  onClick={loadApiUsage}
                  disabled={loadingUsage}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-sm"
                >
                  {loadingUsage ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {apiUsage ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Groq Usage */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h3 className="text-white font-semibold">Groq API</h3>
                        <p className="text-xs text-zinc-500">LLM for message generation</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {apiUsage.groq.lastKnown ? (
                        <>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-zinc-400">Requests (per minute)</span>
                              <span className={apiUsage.groq.status === 'ok' ? 'text-emerald-400' : apiUsage.groq.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}>
                                {apiUsage.groq.requests.toLocaleString()} / {apiUsage.groq.limit.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${apiUsage.groq.status === 'ok' ? 'bg-emerald-500' : apiUsage.groq.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, apiUsage.groq.percentUsed)}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Remaining: {apiUsage.groq.remaining.toLocaleString()}</span>
                            {apiUsage.groq.resetsAt && (
                              <span className="text-zinc-500">Resets: {apiUsage.groq.resetsAt}</span>
                            )}
                          </div>
                          
                          {apiUsage.groq.tokens > 0 && (
                            <div className="pt-3 border-t border-zinc-800">
                              <span className="text-xs text-zinc-500">Tokens used: {apiUsage.groq.tokens.toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-zinc-500 text-sm">Rate limits tracked per-request</p>
                          <p className="text-zinc-600 text-xs mt-1">Generate a message to see current limits</p>
                        </div>
                      )}
                      
                      {apiUsage.groq.note && (
                        <p className="text-[10px] text-zinc-600 pt-2 border-t border-zinc-800">{apiUsage.groq.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Tavily Usage */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <h3 className="text-white font-semibold">Tavily API</h3>
                        <p className="text-xs text-zinc-500">Web research & company search{apiUsage.tavily.plan && ` • ${apiUsage.tavily.plan}`}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-400">API Key Usage</span>
                          <span className={apiUsage.tavily.status === 'ok' ? 'text-emerald-400' : apiUsage.tavily.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}>
                            {apiUsage.tavily.requests.toLocaleString()} / {apiUsage.tavily.limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${apiUsage.tavily.status === 'ok' ? 'bg-emerald-500' : apiUsage.tavily.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, apiUsage.tavily.percentUsed)}%` }}
                          />
                        </div>
                      </div>
                      
                      {apiUsage.tavily.account && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-400">Account Usage</span>
                            <span className="text-zinc-300">
                              {apiUsage.tavily.account.plan_usage.toLocaleString()} / {apiUsage.tavily.account.plan_limit.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${Math.min(100, (apiUsage.tavily.account.plan_usage / apiUsage.tavily.account.plan_limit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Remaining: {apiUsage.tavily.remaining.toLocaleString()}</span>
                        <span className="text-zinc-500">Resets: {new Date(apiUsage.tavily.resetsAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ollama (Local) */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🖥️</span>
                      <div>
                        <h3 className="text-white font-semibold">Ollama (Local)</h3>
                        <p className="text-xs text-zinc-500">Free, unlimited local inference</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${apiUsage.ollama.available ? 'bg-emerald-500' : 'bg-zinc-600'}`}></span>
                        <span className="text-sm text-zinc-400">{apiUsage.ollama.available ? 'Available' : 'Not connected'}</span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Requests today: {apiUsage.ollama.requests.toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-400">No usage limits!</p>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-blue-400 font-semibold mb-3">💡 Tips to Save API Calls</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li>• Use Local Model (Ollama) for unlimited free generation</li>
                      <li>• Disable Web Research when not needed</li>
                      <li>• Use Rich Context instead of Web Research for saved companies</li>
                      <li>• Batch research multiple companies at once</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                  {loadingUsage ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-zinc-500">Loading usage data...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">📊</span>
                      <p className="text-zinc-500">Click refresh to load API usage</p>
                    </div>
                  )}
                </div>
              )}

              {/* Limits Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">📋 API Limits Reference</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-zinc-800">
                        <th className="pb-2">API</th>
                        <th className="pb-2">Free Tier</th>
                        <th className="pb-2">Reset Period</th>
                        <th className="pb-2">Used For</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400">
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">Groq</td>
                        <td>14,400 req/day</td>
                        <td>Daily (midnight UTC)</td>
                        <td>Message generation, quality checks</td>
                      </tr>
                      <tr className="border-b border-zinc-800/50">
                        <td className="py-2">Tavily</td>
                        <td>1,000 searches/mo</td>
                        <td>Monthly</td>
                        <td>Web research, company search</td>
                      </tr>
                      <tr>
                        <td className="py-2">Ollama</td>
                        <td>Unlimited</td>
                        <td>N/A</td>
                        <td>Local message generation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Integrations Tab Component
function IntegrationsTab() {
  const [gmailStatus, setGmailStatus] = useState<{connected: boolean, email?: string, loading: boolean}>({ connected: false, loading: true })
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    checkGmailStatus()
    // Check URL params for connection result
    const params = new URLSearchParams(window.location.search)
    const gmailResult = params.get('gmail')
    if (gmailResult === 'connected') {
      checkGmailStatus()
      // Clean URL
      window.history.replaceState({}, '', '/settings?tab=integrations')
    }
  }, [])

  const checkGmailStatus = async () => {
    try {
      const res = await fetch('/api/gmail/status')
      const data = await res.json()
      setGmailStatus({ connected: data.connected, email: data.email, loading: false })
    } catch {
      setGmailStatus({ connected: false, loading: false })
    }
  }

  const connectGmail = () => {
    window.location.href = '/api/gmail/auth'
  }

  const disconnectGmail = async () => {
    if (!confirm('Disconnect Gmail account?')) return
    setDisconnecting(true)
    try {
      await fetch('/api/gmail/status', { method: 'DELETE' })
      setGmailStatus({ connected: false, loading: false })
    } catch (e) {
      console.error('Disconnect error:', e)
    }
    setDisconnecting(false)
  }

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Gmail Integration</h3>
        <p className="text-zinc-500 text-sm mb-4">Connect your Gmail account to send emails, save drafts, and schedule messages directly from the app.</p>
        
        {gmailStatus.loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
            Checking connection...
          </div>
        ) : gmailStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Connected</p>
                <p className="text-zinc-400 text-xs">{gmailStatus.email}</p>
              </div>
              <button
                onClick={disconnectGmail}
                disabled={disconnecting}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
            <div className="text-xs text-zinc-600">
              You can now send emails, save drafts, and schedule messages from the Generate page.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={connectGmail}
              className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-100"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Gmail Account
            </button>
            <div className="text-xs text-zinc-600">
              We'll request permission to send emails on your behalf. Your credentials are stored securely.
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Email Features</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-3 bg-zinc-950 rounded-lg">
            <span className="text-xl block mb-2">🚀</span>
            <h4 className="text-white text-sm font-medium mb-1">Send Now</h4>
            <p className="text-zinc-500 text-xs">Send emails immediately through your Gmail</p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-lg">
            <span className="text-xl block mb-2">📝</span>
            <h4 className="text-white text-sm font-medium mb-1">Save as Draft</h4>
            <p className="text-zinc-500 text-xs">Save to Gmail drafts for review before sending</p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-lg">
            <span className="text-xl block mb-2">🕐</span>
            <h4 className="text-white text-sm font-medium mb-1">Schedule</h4>
            <p className="text-zinc-500 text-xs">Queue emails to send at optimal times</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
        <h4 className="text-yellow-400 font-medium text-sm mb-2">🔒 Privacy & Security</h4>
        <ul className="text-zinc-400 text-xs space-y-1">
          <li>• OAuth 2.0 authentication (we never see your password)</li>
          <li>• Tokens stored encrypted in database</li>
          <li>• You can disconnect anytime</li>
          <li>• We only request necessary permissions</li>
        </ul>
      </div>
    </>
  )
}