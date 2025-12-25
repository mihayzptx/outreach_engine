import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

interface Signal {
  type: string
  category: string
  priority: 'high' | 'medium' | 'low'
  label: string
  title: string
  detail: string
  content: string
  url: string
  source: string
  color: string
  publishedDate?: string
  confidence: 'verified' | 'likely' | 'possible'
  quote?: string
}

interface SearchResult {
  title: string
  content: string
  url: string
  published_date?: string
  score?: number
  source?: string
}

interface DebugInfo {
  queries: string[]
  rawResults: number
  filteredResults: number
  llmInput: number
  llmOutput: number
  errors: string[]
}

// Signal categories
const SIGNAL_CATEGORIES = {
  funding: { label: '💰 Funding', priority: 'high' as const, color: 'red' },
  hiring: { label: '👥 Hiring', priority: 'high' as const, color: 'orange' },
  leadership: { label: '👔 Leadership', priority: 'medium' as const, color: 'yellow' },
  expansion: { label: '🌍 Expansion', priority: 'medium' as const, color: 'blue' },
  acquisition: { label: '🤝 M&A', priority: 'high' as const, color: 'purple' },
  awards: { label: '🏆 Awards', priority: 'low' as const, color: 'green' },
  product: { label: '🚀 Product', priority: 'medium' as const, color: 'cyan' },
  partnership: { label: '🤝 Partnership', priority: 'medium' as const, color: 'indigo' }
}

// Build targeted search queries for each signal type
function buildSearchQueries(companyName: string, industry: string | null): { query: string, type: string }[] {
  const name = companyName.trim()
  const queries: { query: string, type: string }[] = []
  
  // Funding signals - multiple variations
  queries.push({ query: `"${name}" series funding round 2024 2025`, type: 'funding' })
  queries.push({ query: `"${name}" raises million investment`, type: 'funding' })
  queries.push({ query: `"${name}" venture capital funding`, type: 'funding' })
  
  // Hiring signals
  queries.push({ query: `"${name}" hiring engineers jobs careers`, type: 'hiring' })
  queries.push({ query: `"${name}" growing team new hires`, type: 'hiring' })
  
  // Leadership signals
  queries.push({ query: `"${name}" appoints CEO CTO executive`, type: 'leadership' })
  queries.push({ query: `"${name}" new CEO announces leadership`, type: 'leadership' })
  
  // M&A signals
  queries.push({ query: `"${name}" acquisition acquires merger`, type: 'acquisition' })
  queries.push({ query: `"${name}" acquired by merger deal`, type: 'acquisition' })
  
  // Product/Launch signals
  queries.push({ query: `"${name}" launches announces new product`, type: 'product' })
  queries.push({ query: `"${name}" release platform feature`, type: 'product' })
  
  // Expansion signals
  queries.push({ query: `"${name}" expands new office market`, type: 'expansion' })
  
  // Partnership signals
  queries.push({ query: `"${name}" partnership partners with collaboration`, type: 'partnership' })
  
  // General news (fallback)
  queries.push({ query: `"${name}" news announcement 2025`, type: 'general' })
  
  return queries
}

// Search using Tavily
async function searchTavily(query: string, debug: DebugInfo): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) return []
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: false
        // NOT limiting domains - let it search everywhere
      })
    })

    const data = await response.json()
    
    if (data.error) {
      debug.errors.push(`Tavily: ${data.error}`)
      return []
    }
    
    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      content: r.content || '',
      url: r.url || '',
      published_date: r.published_date,
      score: r.score,
      source: r.url ? new URL(r.url).hostname.replace('www.', '') : ''
    }))
  } catch (e: any) {
    debug.errors.push(`Tavily error: ${e.message}`)
    return []
  }
}

// Filter results to only those about the company
function filterResults(results: SearchResult[], companyName: string): SearchResult[] {
  const nameLower = companyName.toLowerCase()
  const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2)
  const firstWord = nameWords[0] || nameLower
  
  return results.filter(r => {
    const titleLower = (r.title || '').toLowerCase()
    const contentLower = (r.content || '').toLowerCase()
    
    // Must have company name or first significant word in title or content
    const inTitle = titleLower.includes(nameLower) || titleLower.includes(firstWord)
    const inContent = contentLower.includes(nameLower)
    
    return inTitle || inContent
  })
}

// Validate signals with LLM
async function extractSignalsWithLLM(
  companyName: string,
  results: SearchResult[],
  timeframeDays: number,
  debug: DebugInfo
): Promise<Signal[]> {
  if (!GROQ_API_KEY || results.length === 0) {
    if (!GROQ_API_KEY) debug.errors.push('GROQ_API_KEY not set')
    return []
  }

  debug.llmInput = results.length

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeframeDays)

  // Prepare articles
  const articles = results.slice(0, 8).map((r, i) => `
[${i + 1}] ${r.source || 'unknown'}
Title: ${r.title}
Date: ${r.published_date || 'unknown'}
Content: ${r.content?.slice(0, 600) || 'N/A'}
URL: ${r.url}
`).join('\n---\n')

  const prompt = `Extract business signals about "${companyName}" from these articles.

IMPORTANT RULES:
1. Only extract signals SPECIFICALLY about "${companyName}"
2. Be CONCRETE - include numbers, names, dates
3. Only signals from the last ${timeframeDays} days
4. If not sure, skip it

SIGNAL TYPES TO LOOK FOR:
- funding: Investment rounds, capital raised (include amount if mentioned)
- hiring: Job openings, team growth, new hires
- leadership: New executives, C-level changes
- acquisition: M&A activity (acquiring or being acquired)
- product: New launches, major features
- expansion: New markets, offices, geographies
- partnership: Strategic alliances, integrations

ARTICLES:
${articles}

Return a JSON array. Each signal needs:
{
  "category": "funding|hiring|leadership|acquisition|product|expansion|partnership",
  "detail": "Specific fact with numbers/names",
  "source": "domain.com",
  "url": "full url",
  "date": "YYYY-MM-DD or recent",
  "confidence": "verified|likely|possible"
}

If no signals found, return: []
Return ONLY the JSON array.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Extract business signals from articles. Return valid JSON array only. Be specific and factual.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    const data = await response.json()
    
    if (data.error) {
      debug.errors.push(`Groq: ${data.error.message || data.error}`)
      return []
    }
    
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      debug.errors.push('Groq returned empty response')
      return []
    }

    // Parse JSON
    let parsed: any[]
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    } catch (e) {
      debug.errors.push(`JSON parse failed: ${content.slice(0, 100)}...`)
      return []
    }

    if (!Array.isArray(parsed)) {
      debug.errors.push('LLM response not an array')
      return []
    }

    debug.llmOutput = parsed.length

    // Convert to Signal format
    return parsed
      .filter((s: any) => s.category && s.detail && SIGNAL_CATEGORIES[s.category as keyof typeof SIGNAL_CATEGORIES])
      .map((s: any) => {
        const cat = SIGNAL_CATEGORIES[s.category as keyof typeof SIGNAL_CATEGORIES]
        return {
          type: s.category,
          category: s.category,
          priority: cat.priority,
          label: cat.label,
          title: s.detail,
          detail: s.detail,
          content: s.quote || s.detail,
          url: s.url || '',
          source: s.source || '',
          color: cat.color,
          publishedDate: s.date,
          confidence: s.confidence || 'possible',
          quote: s.quote
        }
      })
  } catch (e: any) {
    debug.errors.push(`LLM error: ${e.message}`)
    return []
  }
}

export async function POST(request: Request) {
  const { company_id, company_name, industry, signalSettings, debug: enableDebug } = await request.json()

  if (!company_name) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 })
  }

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 })
  }

  const debug: DebugInfo = {
    queries: [],
    rawResults: 0,
    filteredResults: 0,
    llmInput: 0,
    llmOutput: 0,
    errors: []
  }

  try {
    const timeframeDays = signalSettings?.timeframeDays || 90
    
    // Build search queries
    const queries = buildSearchQueries(company_name, industry)
    debug.queries = queries.map(q => q.query)

    // Execute searches (limit concurrent to avoid rate limits)
    const allResults: SearchResult[] = []
    
    // Run queries in batches of 3
    for (let i = 0; i < queries.length; i += 3) {
      const batch = queries.slice(i, i + 3)
      const batchResults = await Promise.all(
        batch.map(q => searchTavily(q.query, debug))
      )
      batchResults.forEach(results => allResults.push(...results))
      
      // Small delay between batches
      if (i + 3 < queries.length) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    debug.rawResults = allResults.length

    // Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) => 
      r.url && arr.findIndex(x => x.url === r.url) === i
    )

    // Filter to only results about this company
    const filteredResults = filterResults(uniqueResults, company_name)
    debug.filteredResults = filteredResults.length

    // Extract signals with LLM
    const signals = await extractSignalsWithLLM(company_name, filteredResults, timeframeDays, debug)

    // Deduplicate signals
    const uniqueSignals: Signal[] = []
    const seen = new Set<string>()
    for (const s of signals) {
      const key = `${s.category}:${s.detail.toLowerCase().slice(0, 50)}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueSignals.push(s)
      }
    }

    // Sort by priority
    uniqueSignals.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })

    // Collect all links
    const links = filteredResults.map(r => ({
      url: r.url,
      source: r.source || '',
      title: r.title
    }))

    // Count by priority
    const highCount = uniqueSignals.filter(s => s.priority === 'high').length
    const mediumCount = uniqueSignals.filter(s => s.priority === 'medium').length

    // Store in database
    if (company_id && company_id > 0) {
      const signalData = {
        detected: uniqueSignals,
        count: uniqueSignals.length,
        high_priority: highCount,
        medium_priority: mediumCount,
        scanned_at: new Date().toISOString(),
        debug: enableDebug ? debug : undefined
      }

      await sql.query(
        `UPDATE saved_companies 
         SET signal_data = $1::jsonb,
             research_links_data = $2::jsonb,
             has_new_signals = $3,
             last_scanned_at = NOW(),
             signal_count = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [JSON.stringify(signalData), JSON.stringify(links), uniqueSignals.length > 0, uniqueSignals.length, company_id]
      )
    }

    const response: any = {
      success: true,
      signals: {
        detected: uniqueSignals,
        count: uniqueSignals.length,
        high_priority: highCount,
        medium_priority: mediumCount
      },
      links,
      stats: {
        queriesRun: queries.length,
        rawResults: debug.rawResults,
        filteredResults: debug.filteredResults,
        signalsExtracted: uniqueSignals.length
      }
    }

    // Include debug info if requested
    if (enableDebug) {
      response.debug = debug
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })

  } catch (error: any) {
    debug.errors.push(`Main error: ${error.message}`)
    return NextResponse.json({ 
      error: 'Research failed', 
      debug: enableDebug ? debug : undefined 
    }, { status: 500 })
  }
}