'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function GmailCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(`Google auth error: ${errorParam}`)
      return
    }

    if (!code) {
      setError('No authorization code received')
      return
    }

    // Exchange code for tokens via API
    const exchangeCode = async () => {
      try {
        setStatus('Exchanging authorization code...')
        
        const response = await fetch('/api/gmail/callback?' + searchParams.toString())
        const data = await response.json()

        if (data.success) {
          setStatus('Connected successfully! Redirecting...')
          // Store in localStorage for the app to detect
          localStorage.setItem('gmail_connected', 'true')
          localStorage.setItem('gmail_email', data.email || '')
          
          setTimeout(() => {
            router.push('/?gmail=connected')
          }, 1500)
        } else {
          setError(data.error || 'Failed to connect Gmail')
        }
      } catch (e: any) {
        setError(`Connection failed: ${e.message}`)
      }
    }

    exchangeCode()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-white mb-4">Gmail Connection</h1>
        
        {error ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
            >
              Back to App
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400">{status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GmailCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-xl font-bold text-white mb-4">Gmail Connection</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <GmailCallbackContent />
    </Suspense>
  )
}