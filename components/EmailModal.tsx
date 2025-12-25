'use client'

import { useState } from 'react'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  prospectName?: string
  company?: string
}

export default function EmailModal({ isOpen, onClose, defaultTo, defaultSubject, defaultBody, prospectName, company }: EmailModalProps) {
  const [to, setTo] = useState(defaultTo || '')
  const [subject, setSubject] = useState(defaultSubject || '')
  const [body, setBody] = useState(defaultBody || '')
  const [action, setAction] = useState<'send' | 'draft' | 'schedule'>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!to || !subject || !body) {
      setResult({ success: false, message: 'Please fill all fields' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      let scheduledAt = null
      if (action === 'schedule') {
        if (!scheduledDate) {
          setResult({ success: false, message: 'Please select a date for scheduling' })
          setLoading(false)
          return
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      }

      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, to, subject, body, scheduledAt })
      })

      const data = await response.json()

      if (data.success) {
        const messages: Record<string, string> = {
          sent: 'Email sent successfully!',
          draft: 'Draft saved to Gmail!',
          scheduled: `Email scheduled for ${new Date(scheduledAt!).toLocaleString()}`
        }
        setResult({ success: true, message: messages[data.action] || 'Success!' })
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 2000)
      } else {
        setResult({ success: false, message: data.error || 'Failed to process email' })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  // Generate subject line suggestion
  const suggestSubject = () => {
    if (prospectName && company) {
      const suggestions = [
        `Quick note for ${prospectName}`,
        `${company} + Tech-stack.io`,
        `Regarding ${company}`,
        `For ${prospectName} at ${company}`
      ]
      setSubject(suggestions[Math.floor(Math.random() * suggestions.length)])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📧</span>
            <h3 className="text-white font-semibold">Send Email</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">×</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* To */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">To *</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
            />
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-500">Subject *</label>
              {prospectName && (
                <button 
                  onClick={suggestSubject}
                  className="text-[10px] text-yellow-400 hover:text-yellow-300"
                >
                  Suggest
                </button>
              )}
            </div>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:border-yellow-400"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Message *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Email body..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm h-48 resize-none focus:border-yellow-400"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600">{body.length} characters</span>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="text-xs text-zinc-500 block mb-2">Action</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAction('send')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action === 'send' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                🚀 Send Now
              </button>
              <button
                onClick={() => setAction('draft')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action === 'draft' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                📝 Save Draft
              </button>
              <button
                onClick={() => setAction('schedule')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  action === 'schedule' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                🕐 Schedule
              </button>
            </div>
          </div>

          {/* Schedule Options */}
          {action === 'schedule' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-lg border border-purple-500/30">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Result Message */}
          {result && (
            <div className={`p-3 rounded-lg ${result.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {result.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !to || !subject || !body}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
              action === 'send' ? 'bg-emerald-500 text-white hover:bg-emerald-400' :
              action === 'draft' ? 'bg-blue-500 text-white hover:bg-blue-400' :
              'bg-purple-500 text-white hover:bg-purple-400'
            }`}
          >
            {loading ? 'Processing...' : 
              action === 'send' ? 'Send Email' :
              action === 'draft' ? 'Save Draft' :
              'Schedule Email'
            }
          </button>
        </div>
      </div>
    </div>
  )
}