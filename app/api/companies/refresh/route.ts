import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

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
}

const SIGNAL_PATTERNS = {
  funding: {
    patterns: [
      /(?:raised|secures?|closes?|announces?)\s+\$?([\d.]+)\s*(million|m|billion|b)/i,
      /series\s+([a-d])/i,
      /seed\s+(?:round|funding)/i,
      /(?:funding|investment)\s+(?:round|of)\s+\$?([\d.]+)/i
    ],
    priority: 'high' as const,
    label: '💰 Funding',
    color: 'emerald',
    keywords: ['funding', 'raised', 'investment', 'series', 'seed', 'venture', 'capital']
  },
  hiring: {
    patterns: [
      /hiring\s+(?:for\s+)?(\d+)\s+(?:new\s+)?(?:positions?|roles?|engineers?)/i,
      /(?:devops|platform|sre|infrastructure|cloud)\s+engineer/i,
      /growing\s+(?:the\s+)?(?:engineering\s+)?team/i
    ],
    priority: 'high' as const,
    label: '👥 Hiring',
    color: 'blue',
    keywords: ['hiring', 'job', 'career', 'engineer', 'devops', 'platform', 'sre', 'infrastructure']
  },
  leadership: {
    patterns: [
      /(?:appoints?|names?|hires?|promotes?)\s+(?:new\s+)?(?:cto|ceo|vp|chief|head)/i,
      /(?:joins?\s+as|named)\s+(?:cto|ceo|vp|chief|head)/i,
      /new\s+(?:cto|ceo|vp|chief|head\s+of)/i
    ],
    priority: 'medium' as const,
    label: '👔 Leadership',
    color: 'purple',
    keywords: ['appoint', 'hire', 'promote', 'cto', 'ceo', 'vp', 'chief', 'head of', 'joins']
  },
  expansion: {
    patterns: [
      /(?:opens?|launches?|expands?\s+to)\s+(?:new\s+)?(?:office|headquarters|location)/i,
      /(?:enters?|expands?\s+(?:into|to))\s+(?:new\s+)?(?:market|region)/i,
      /(?:international|global)\s+expansion/i
    ],
    priority: 'medium' as const,
    label: '🌍 Expansion',
    color: 'orange',
    keywords: ['expand', 'office', 'location', 'market', 'international', 'global', 'launch']
  },
  acquisition: {
    patterns: [
      /(?:acquires?|acquisition|bought|purchases?|merges?\s+with)/i,
      /(?:acquired\s+by|merger\s+with)/i
    ],
    priority: 'high' as const,
    label: '🤝 M&A',
    color: 'pink',
    keywords: ['acquire', 'acquisition', 'merger', 'merge', 'bought', 'purchase']
  },
  awards: {
    patterns: [
      /(?:wins?|awarded|receives?|named)\s+(?:best|top|award)/i,
      /(?:recognized|ranked)\s+(?:as|among)/i,
      /(?:inc\.|forbes|deloitte|gartner)\s+(?:500|100|fastest)/i
    ],
    priority: 'low' as const,
    label: '🏆 Awards',
    color: 'amber',
    keywords: ['award', 'win', 'recognized', 'ranked', 'best', 'top', 'fastest']
  },
  product: {
    patterns: [
      /(?:launches?|announces?|unveils?|releases?)\s+(?:new\s+)?(?:product|feature|platform|service)/i,
      /(?:new|major)\s+(?:release|version|update)/i
    ],
    priority: 'medium' as const,
    label: '🚀 Product',
    color: 'cyan',
    keywords: ['launch', 'announce', 'release', 'product', 'feature', 'platform']
  },
  tech_stack: {
    patterns: [
      /(?:using|built\s+(?:on|with)|powered\s+by|migrat(?:ed?|ing)\s+to)\s+(aws|azure|gcp|kubernetes|terraform|docker)/i,
      /(?:aws|azure|gcp|kubernetes|k8s|terraform|docker|jenkins|github\s+actions)/i
    ],
    priority: 'medium' as const,
    label: '⚙️ Tech Stack',
    color: 'zinc',
    keywords: ['aws', 'azure', 'gcp', 'kubernetes', 'k8s', 'terraform', 'docker', 'devops', 'ci/cd']
  }
}

function detectSignals(text: string, title: string, url: string): Signal[] {
  const signals: Signal[] = []
  const combinedText = `${title} ${text}`.toLowerCase()

  for (const [category, config] of Object.entries(SIGNAL_PATTERNS)) {
    const hasKeyword = config.keywords.some(kw => combinedText.includes(kw.toLowerCase()))
    if (!hasKeyword) continue

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
            detail = `Series ${seriesMatch[1].toUpperCase()}${detail ? ' - ' + detail : ''}`
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
          detail = title.slice(0, 80)
        }

        signals.push({
          type: category,
          category,
          priority: config.priority,
          label: config.label,
          title: title.slice(0, 150),
          detail,
          content: text.slice(0, 300),
          url,
          source: url ? new URL(url).hostname.replace('www.', '') : '',
          color: config.color
        })
        break
      }
    }
  }

  return signals
}

export async function POST(request: Request) {
  const { company_id, company_name, industry } = await request.json()

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 })
  }

  try {
    const queries = [
      `${company_name} news funding 2024 2025`,
      `${company_name} hiring engineering jobs`,
      `${company_name} announcement product launch`
    ]

    const allSignals: Signal[] = []
    const allLinks: { url: string, source: string, type: string }[] = []

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
            // Collect links
            if (result.url) {
              allLinks.push({
                url: result.url,
                source: new URL(result.url).hostname.replace('www.', ''),
                type: 'Research'
              })
            }
            
            const signals = detectSignals(result.content || '', result.title || '', result.url || '')
            allSignals.push(...signals)
          }
        }
      } catch (e) {
        console.error('Search query failed:', query, e)
      }
    }

    // Deduplicate signals
    const uniqueSignals: Signal[] = []
    const seenKeys = new Set<string>()
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    allSignals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    
    for (const signal of allSignals) {
      const key = `${signal.category}-${signal.detail.slice(0, 30)}`
      if (!seenKeys.has(key)) {
        seenKeys.add(key)
        uniqueSignals.push(signal)
      }
    }

    // Deduplicate links
    const uniqueLinks = allLinks.filter((link, i, arr) => 
      arr.findIndex(l => l.url === link.url) === i
    ).slice(0, 10)

    const hasNewSignals = uniqueSignals.length > 0
    const highPriority = uniqueSignals.filter(s => s.priority === 'high').length
    const medPriority = uniqueSignals.filter(s => s.priority === 'medium').length

    // Prepare JSONB data
    const signalSummary = {
      detected: uniqueSignals,
      count: uniqueSignals.length,
      high_priority: highPriority,
      medium_priority: medPriority,
      scanned_at: new Date().toISOString()
    }

    // Update database with proper JSONB casting
    await sql.query(
      `UPDATE saved_companies
       SET
         signal_data = $1::jsonb,
         research_links_data = $2::jsonb,
         has_new_signals = $3,
         last_scanned_at = NOW(),
         signal_count = $4,
         updated_at = NOW()
       WHERE id = $5`,
      [
        JSON.stringify(signalSummary),
        JSON.stringify(uniqueLinks),
        hasNewSignals,
        uniqueSignals.length,
        company_id
      ]
    )

    const response = NextResponse.json({ 
      success: true, 
      signals: signalSummary,
      links: uniqueLinks,
      totalSignals: uniqueSignals.length,
      highPriority,
      hasNewSignals 
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store')
    return response
    
  } catch (error) {
    console.error('Error refreshing company:', error)
    return NextResponse.json({ success: false, error: 'Failed to refresh' }, { status: 500 })
  }
}