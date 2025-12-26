import { NextResponse } from 'next/server'
import { getFullUsage, getLastGroqRateLimit } from '../../../lib/api-usage'

// GET - Get current usage stats from external APIs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ollamaEndpoint = searchParams.get('ollamaEndpoint') || undefined

  try {
    // Fetch real usage from APIs
    const usage = await getFullUsage(ollamaEndpoint)
    
    // Get last known Groq rate limits
    const groqLimits = getLastGroqRateLimit()
    
    // Calculate percentages for UI
    const stats = {
      groq: {
        ...usage.groq,
        percentUsed: usage.groq.limit > 0 ? Math.round((usage.groq.requests / usage.groq.limit) * 100) : 0,
        status: usage.groq.remaining > usage.groq.limit * 0.2 ? 'ok' : 
                usage.groq.remaining > 0 ? 'warning' : 'exceeded',
        lastKnown: groqLimits ? true : false,
        note: groqLimits ? 'From last API response' : 'Groq usage tracked per-request via response headers'
      },
      tavily: {
        ...usage.tavily,
        percentUsed: usage.tavily.limit > 0 ? Math.round((usage.tavily.requests / usage.tavily.limit) * 100) : 0,
        status: usage.tavily.remaining > usage.tavily.limit * 0.2 ? 'ok' : 
                usage.tavily.remaining > 0 ? 'warning' : 'exceeded'
      },
      ollama: usage.ollama
    }

    return NextResponse.json({ success: true, usage: stats })
  } catch (error: any) {
    console.error('Usage API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      // Return defaults if API fails
      usage: {
        groq: { requests: 0, tokens: 0, limit: 14400, remaining: 14400, percentUsed: 0, status: 'ok', note: 'Could not fetch' },
        tavily: { requests: 0, limit: 1000, remaining: 1000, percentUsed: 0, status: 'ok' },
        ollama: { requests: 0, available: false }
      }
    })
  }
}