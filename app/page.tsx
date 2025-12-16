'use client'

import { useState } from 'react'

export default function Home() {
  const [formData, setFormData] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    industry: '',
    context: '',
    messageType: 'LinkedIn Connection Request'
  })
  
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const response = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    const data = await response.json()
    setMessage(data.message)
    setLoading(false)
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Tech-stack.io Outreach Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Prospect Name"
          className="w-full p-3 border rounded"
          value={formData.prospectName}
          onChange={(e) => setFormData({...formData, prospectName: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Prospect Title"
          className="w-full p-3 border rounded"
          value={formData.prospectTitle}
          onChange={(e) => setFormData({...formData, prospectTitle: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Company"
          className="w-full p-3 border rounded"
          value={formData.company}
          onChange={(e) => setFormData({...formData, company: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Industry"
          className="w-full p-3 border rounded"
          value={formData.industry}
          onChange={(e) => setFormData({...formData, industry: e.target.value})}
          required
        />
        
        <textarea
          placeholder="Context (recent news, pain points, business intelligence)"
          className="w-full p-3 border rounded h-24"
          value={formData.context}
          onChange={(e) => setFormData({...formData, context: e.target.value})}
          required
        />
        
        <select
          className="w-full p-3 border rounded"
          value={formData.messageType}
          onChange={(e) => setFormData({...formData, messageType: e.target.value})}
        >
          <option>LinkedIn Connection Request</option>
          <option>Email Cold Outreach</option>
          <option>Conference Follow-up</option>
          <option>Discovery Call Request</option>
        </select>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Message'}
        </button>
      </form>
      
      {message && (
        <div className="bg-gray-50 p-6 rounded border">
          <h2 className="font-bold mb-4">Generated Message:</h2>
          <p className="whitespace-pre-wrap">{message}</p>
          <button
            onClick={() => navigator.clipboard.writeText(message)}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </main>
  )
}