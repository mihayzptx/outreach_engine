import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

interface Signal {
  type: string
  category: 'funding' | 'hiring' | 'leadership' | 'expansion' | 'tech_stack' | 'awards' | 'acquisition' | 'news'
  priority: 'high' | 'medium' | 'low'
  title: string
  detail: string
  date?: string
  source?: string
}

// Signal detection patterns
const SIGNAL_PATTERNS = {
  funding: {
    patterns: [
      /(?:raised|secures?|closes?|announces?)\s+\$?([\d.]+)\s*(million|m|billion|b)/i,
      /series\s+([a-d])/i,
      /seed\s+(?:round|funding)/i,
      /(?:funding|investment)\s+(?:round|of)\s+\$?([\d.]+)/i
    ],
    priority: 'high' as const,
    keywords: ['funding', 'raised', 'investment', 'series', 'seed', 'venture', 'capital']
  },
  hiring: {
    patterns: [
      /hiring\s+(?:for\s+)?(\d+)\s+(?:new\s+)?(?:positions?|roles?|engineers?)/i,
      /(?:devops|platform|sre|infrastructure|cloud)\s+engineer/i,
      /growing\s+(?:the\s+)?(?:engineering\s+)?team/i
    ],
    priority: 'high' as const,
    keywords: ['hiring', 'job', 'career', 'engineer', 'devops', 'platform', 'sre', 'infrastructure']
  },
  leadership: {
    patterns: [
      /(?:appoints?|names?|hires?|promotes?)\s+(?:new\s+)?(?:cto|ceo|vp|chief|head)/i,
      /(?:joins?\s+as|named)\s+(?:cto|ceo|vp|chief|head)/i,
      /new\s+(?:cto|ceo|vp|chief|head\s+of)/i
    ],
    priority: 'medium' as const,
    keywords: ['appoint', 'hire', 'promote', 'cto', 'ceo', 'vp', 'chief', 'head of', 'joins']
  },
  expansion: {
    patterns: [
      /(?:opens?|launches?|expands?\s+to)\s+(?:new\s+)?(?:office|headquarters|location)/i,
      /(?:enters?|expands?\s+(?:into|to))\s+(?:new\s+)?(?:market|region)/i,
      /(?:international|global)\s+expansion/i
    ],
    priority: 'medium' as const,
    keywords: ['expand', 'office', 'location', 'market', 'international', 'global', 'launch']
  },
  acquisition: {
    patterns: [
      /(?:acquires?|acquisition|bought|purchases?|merges?\s+with)/i,
      /(?:acquired\s+by|merger\s+with)/i
    ],
    priority: 'high' as const,
    keywords: ['acquire', 'acquisition', 'merger', 'merge', 'bought', 'purchase']
  },
  awards: {
    patterns: [
      /(?:wins?|awarded|receives?|named)\s+(?:best|top|award)/i,
      /(?:recognized|ranked)\s+(?:as|among)/i,
      /(?:inc\.|forbes|deloitte|gartner)\s+(?:500|100|fastest)/i
    ],
    priority: 'low' as const,
    keywords: ['award', 'win', 'recognized', 'ranked', 'best', 'top', 'fastest']
  },
  tech_stack: {
    patterns: [
      /(?:using|built\s+(?:on|with)|powered\s+by|migrat(?:ed?|ing)\s+to)\s+(aws|azure|gcp|kubernetes|terraform|docker)/i,
      /(?:aws|azure|gcp|kubernetes|k8s|terraform|docker|jenkins|github\s+actions)/i
    ],
    priority: 'medium' as const,
    keywords: ['aws', 'azure', 'gcp', 'kubernetes', 'k8s', 'terraform', 'docker', 'devops', 'ci/cd', 'jenkins']
  }
}

function detectSignals(text: string, title: string, url: string): Signal[] {
  const signals: Signal[] = []
  const combinedText = `${title} ${text}`.toLowerCase()

  for (const [category, config] of Object.entries(SIGNAL_PATTERNS)) {
    // Check if any keywords present
    const hasKeyword = config.keywords.some(kw => combinedText.includes(kw.toLowerCase()))
    if (!hasKeyword) continue

    // Check patterns
    for (const pattern of config.patterns) {
      const match = combinedText.match(pattern)
      if (match) {
        let detail = ''
        
        if (category === 'funding') {
          const amountMatch = combinedText.match(/\$?([\d.]+)\s*(million|m|billion|b)/i)
          const seriesMatch = combinedText.match(/series\s+([a-d])/i)
          if (amountMatch) {
            const amount = amountMatch[1]
            const unit = amountMatch[2].toLowerCase().startsWith('b') ? 'B' : 'M'
            detail = `$${amount}${unit}`
          }
          if (seriesMatch) {
            detail = `Series ${seriesMatch[1].toUpperCase()}${detail ? ` - ${detail}` : ''}`
          }
          if (!detail) detail = 'Funding announced'
        } else if (category === 'hiring') {
          const roleMatch = combinedText.match(/(?:devops|platform|sre|infrastructure|cloud|backend|frontend)\s+engineer/i)
          detail = roleMatch ? roleMatch[0] : 'Engineering positions open'
        } else if (category === 'leadership') {
          const roleMatch = combinedText.match(/(?:cto|ceo|vp\s+of\s+\w+|chief\s+\w+\s+officer|head\s+of\s+\w+)/i)
          detail = roleMatch ? `New ${roleMatch[0]}` : 'Leadership change'
        } else if (category === 'acquisition') {
          detail = combinedText.includes('acquired by') ? 'Was acquired' : 'Made acquisition'
        } else if (category === 'tech_stack') {
          const techMatch = combinedText.match(/(aws|azure|gcp|kubernetes|k8s|terraform|docker)/i)
          detail = techMatch ? techMatch[0].toUpperCase() : 'Cloud/DevOps tech'
        } else {
          detail = title.slice(0, 100)
        }

        signals.push({
          type: category,
          category: category as Signal['category'],
          priority: config.priority,
          title: title.slice(0, 150),
          detail,
          source: url
        })
        break // One signal per category per result
      }
    }
  }

  return signals
}

export async function POST(request: Request) {
  try {
    const { company, prospectName, forceRefresh } = await request.json()

    if (!company) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await sql`
        SELECT * FROM prospect_research 
        WHERE LOWER(company) = LOWER(${company})
        AND researched_at > NOW() - INTERVAL '7 days'
        ORDER BY researched_at DESC LIMIT 1
      `
      if (cached.rows.length > 0) {
        return NextResponse.json({
          cached: true,
          research: cached.rows[0].research_data,
          signals: cached.rows[0].signals,
          researched_at: cached.rows[0].researched_at
        })
      }
    }

    if (!TAVILY_API_KEY) {
      return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 })
    }

    // Search queries for comprehensive coverage
    const queries = [
      `${company} news funding 2024 2025`,
      `${company} hiring engineering jobs`,
      `${company} leadership executive announcement`
    ]

    const allResults: any[] = []
    const allSignals: Signal[] = []

    for (const query of queries) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            search_depth: 'basic',
            max_results: 5,
            include_answer: false
          })
        })

        const data = await response.json()
        
        if (data.results) {
          for (const result of data.results) {
            allResults.push({
              title: result.title,
              content: result.content,
              url: result.url,
              score: result.score
            })
            
            const signals = detectSignals(result.content || '', result.title || '', result.url || '')
            allSignals.push(...signals)
          }
        }
      } catch (e) {
        console.error('Search query failed:', query, e)
      }
    }

    // Deduplicate signals by category
    const uniqueSignals: Signal[] = []
    const seenCategories = new Set<string>()
    
    // Sort by priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    allSignals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    
    for (const signal of allSignals) {
      if (!seenCategories.has(signal.category)) {
        seenCategories.add(signal.category)
        uniqueSignals.push(signal)
      }
    }

    // Deduplicate results by URL
    const uniqueResults = allResults.filter((r, i, arr) => 
      arr.findIndex(x => x.url === r.url) === i
    ).slice(0, 10)

    // Store in database
    const researchData = {
      company,
      results: uniqueResults,
      query_count: queries.length,
      result_count: uniqueResults.length
    }

    const signalsData = {
      detected: uniqueSignals,
      count: uniqueSignals.length,
      high_priority: uniqueSignals.filter(s => s.priority === 'high').length
    }

    await sql`
      INSERT INTO prospect_research (company, research_data, signals)
      VALUES (${company}, ${JSON.stringify(researchData)}, ${JSON.stringify(signalsData)})
    `

    return NextResponse.json({
      cached: false,
      research: researchData,
      signals: signalsData,
      researched_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Research error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to retrieve cached research
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')

    if (!company) {
      return NextResponse.json({ error: 'Company required' }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM prospect_research 
      WHERE LOWER(company) = LOWER(${company})
      ORDER BY researched_at DESC LIMIT 1
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      research: result.rows[0].research_data,
      signals: result.rows[0].signals,
      researched_at: result.rows[0].researched_at
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}