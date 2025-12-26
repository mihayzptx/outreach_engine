// API Usage Tracking
// Fetches real usage from external APIs (Groq, Tavily)

export interface APIUsage {
  groq: {
    requests: number
    tokens: number
    limit: number
    remaining: number
    resetsAt: string
    plan?: string
  }
  tavily: {
    requests: number
    limit: number
    remaining: number
    resetsAt: string
    plan?: string
    account?: {
      plan_usage: number
      plan_limit: number
    }
  }
  ollama: {
    requests: number
    available: boolean
  }
}

// Fetch Tavily usage from their API
export async function getTavilyUsage(): Promise<{
  key: { usage: number; limit: number }
  account: { current_plan: string; plan_usage: number; plan_limit: number }
} | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.tavily.com/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      console.error('Tavily usage API error:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch Tavily usage:', error)
    return null
  }
}

// Groq doesn't have a public usage API, but we can track from response headers
// Rate limit info comes in response headers: x-ratelimit-limit-requests, x-ratelimit-remaining-requests, etc.
export interface GroqRateLimitInfo {
  limitRequests: number
  limitTokens: number
  remainingRequests: number
  remainingTokens: number
  resetRequests: string
  resetTokens: string
}

// Parse Groq rate limit headers from a response
export function parseGroqRateLimitHeaders(headers: Headers): GroqRateLimitInfo | null {
  try {
    return {
      limitRequests: parseInt(headers.get('x-ratelimit-limit-requests') || '0'),
      limitTokens: parseInt(headers.get('x-ratelimit-limit-tokens') || '0'),
      remainingRequests: parseInt(headers.get('x-ratelimit-remaining-requests') || '0'),
      remainingTokens: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0'),
      resetRequests: headers.get('x-ratelimit-reset-requests') || '',
      resetTokens: headers.get('x-ratelimit-reset-tokens') || ''
    }
  } catch {
    return null
  }
}

// Check Ollama availability
export async function checkOllamaAvailable(endpoint: string = 'http://localhost:11434'): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    return response.ok
  } catch {
    return false
  }
}

// Get combined usage from all APIs
export async function getUsage(ollamaEndpoint?: string): Promise<APIUsage> {
  // Fetch Tavily usage
  const tavilyData = await getTavilyUsage()
  
  // Check Ollama
  const ollamaAvailable = await checkOllamaAvailable(ollamaEndpoint)
  
  // Calculate reset times
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)
  
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Build response
  const usage: APIUsage = {
    groq: {
      // Groq usage is tracked per-request via headers
      // We'll show defaults here, real values come from lastGroqRateLimit
      requests: 0,
      tokens: 0,
      limit: 14400, // Default free tier
      remaining: 14400,
      resetsAt: endOfDay.toISOString(),
      plan: 'free'
    },
    tavily: {
      requests: tavilyData?.key?.usage || 0,
      limit: tavilyData?.key?.limit || 1000,
      remaining: (tavilyData?.key?.limit || 1000) - (tavilyData?.key?.usage || 0),
      resetsAt: endOfMonth.toISOString(),
      plan: tavilyData?.account?.current_plan || 'free',
      account: tavilyData?.account ? {
        plan_usage: tavilyData.account.plan_usage,
        plan_limit: tavilyData.account.plan_limit
      } : undefined
    },
    ollama: {
      requests: 0,
      available: ollamaAvailable
    }
  }

  return usage
}

// Store last known Groq rate limits (updated after each API call)
let lastGroqRateLimit: GroqRateLimitInfo | null = null

export function updateGroqRateLimit(info: GroqRateLimitInfo) {
  lastGroqRateLimit = info
}

export function getLastGroqRateLimit(): GroqRateLimitInfo | null {
  return lastGroqRateLimit
}

// Get usage with last known Groq limits
export async function getFullUsage(ollamaEndpoint?: string): Promise<APIUsage> {
  const usage = await getUsage(ollamaEndpoint)
  
  // Update Groq info with last known rate limits
  if (lastGroqRateLimit) {
    usage.groq = {
      requests: lastGroqRateLimit.limitRequests - lastGroqRateLimit.remainingRequests,
      tokens: lastGroqRateLimit.limitTokens - lastGroqRateLimit.remainingTokens,
      limit: lastGroqRateLimit.limitRequests,
      remaining: lastGroqRateLimit.remainingRequests,
      resetsAt: lastGroqRateLimit.resetRequests || usage.groq.resetsAt,
      plan: 'free'
    }
  }
  
  return usage
}