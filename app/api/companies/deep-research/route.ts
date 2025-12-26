import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

interface ResearchResult {
  companyInfo: {
    description: string
    founded: string
    headquarters: string
    employeeCount: string
    industry: string
    website: string
    linkedinUrl: string
    techStack: string[]
    competitors: string[]
  }
  fundingHistory: {
    totalRaised: string
    lastRound: string
    lastRoundDate: string
    lastRoundAmount: string
    investors: string[]
  }
  recentNews: {
    title: string
    summary: string
    date: string
    url: string
    source: string
    relevance: 'high' | 'medium' | 'low'
  }[]
  signals: {
    category: string
    detail: string
    confidence: string
    source: string
    url: string
    date: string
  }[]
  keyPeople: {
    name: string
    title: string
    linkedin: string
    background: string
  }[]
  painPoints: string[]
  outreachAngles: string[]
  icpFit: {
    score: number
    reasons: string[]
    concerns: string[]
  }
}

async function searchTavily(query: string, maxResults: number = 10, errors: string[]): Promise<any[]> {
  if (!TAVILY_API_KEY) {
    errors.push('TAVILY_API_KEY not set')
    return []
  }
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        max_results: maxResults,
        include_answer: false
      })
    })
    const data = await response.json()
    if (data.error) {
      errors.push(`Tavily: ${data.error}`)
      return []
    }
    return data.results || []
  } catch (e: any) {
    errors.push(`Tavily error: ${e.message}`)
    return []
  }
}

async function analyzeWithLLM(prompt: string, systemPrompt: string, errors: string[]): Promise<string> {
  if (!GROQ_API_KEY) {
    errors.push('GROQ_API_KEY not set')
    return ''
  }
  
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })
    })
    const data = await response.json()
    if (data.error) {
      errors.push(`Groq: ${data.error.message || data.error}`)
      return ''
    }
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (e: any) {
    errors.push(`LLM error: ${e.message}`)
    return ''
  }
}

export async function POST(request: Request) {
  const { company_id, company_name, industry, website, companyProfile } = await request.json()

  if (!company_name) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 })
  }

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 })
  }

  const progress: string[] = []
  const errors: string[] = []

  try {
    // PHASE 1: Gather raw data from multiple searches
    progress.push('Starting deep research...')
    
    const searchQueries = [
      // Company basics
      `"${company_name}" company overview about founded headquarters`,
      `"${company_name}" crunchbase OR linkedin company profile`,
      // Funding
      `"${company_name}" funding raised series investors 2024 2025`,
      `"${company_name}" valuation investment round`,
      // News & signals
      `"${company_name}" news announcement press release 2025`,
      `"${company_name}" launches product expansion hiring`,
      // Leadership
      `"${company_name}" CEO CTO founder executive leadership team`,
      // Tech & competitors
      `"${company_name}" technology stack platform infrastructure`,
      `"${company_name}" competitors alternatives comparison`
    ]

    progress.push(`Running ${searchQueries.length} searches...`)
    
    const allResults: any[] = []
    for (const query of searchQueries) {
      const results = await searchTavily(query, 5, errors)
      allResults.push(...results)
      await new Promise(r => setTimeout(r, 100)) // Rate limit
    }

    // Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) => 
      r.url && arr.findIndex(x => x.url === r.url) === i
    )

    progress.push(`Found ${uniqueResults.length} unique sources`)

    // PHASE 2: Compile all content for LLM analysis
    const contentForAnalysis = uniqueResults.slice(0, 20).map((r, i) => {
      const domain = r.url ? new URL(r.url).hostname.replace('www.', '') : 'unknown'
      return `
[Source ${i + 1}: ${domain}]
Title: ${r.title || 'N/A'}
Date: ${r.published_date || 'unknown'}
Content: ${r.content?.slice(0, 800) || 'N/A'}
URL: ${r.url}
`
    }).join('\n---\n')

    progress.push('Analyzing with AI...')

    // PHASE 3: Deep analysis with LLM
    const analysisPrompt = `Analyze all available information about "${company_name}" and extract comprehensive intelligence.

${companyProfile ? `OUR COMPANY (for ICP matching):
${companyProfile}

` : ''}SOURCES:
${contentForAnalysis}

Extract and return a JSON object with:

{
  "companyInfo": {
    "description": "2-3 sentence company description",
    "founded": "year or 'unknown'",
    "headquarters": "city, country or 'unknown'",
    "employeeCount": "range like '50-200' or 'unknown'",
    "industry": "primary industry",
    "website": "main website URL",
    "linkedinUrl": "linkedin company page if found",
    "techStack": ["technologies they use or build with"],
    "competitors": ["main competitors mentioned"]
  },
  "fundingHistory": {
    "totalRaised": "total amount or 'unknown'",
    "lastRound": "Series A, Seed, etc or 'unknown'",
    "lastRoundDate": "date or 'unknown'",
    "lastRoundAmount": "amount or 'unknown'",
    "investors": ["investor names"]
  },
  "recentNews": [
    {
      "title": "headline",
      "summary": "1-2 sentence summary",
      "date": "date",
      "url": "source url",
      "source": "domain",
      "relevance": "high/medium/low for sales outreach"
    }
  ],
  "signals": [
    {
      "category": "funding/hiring/leadership/expansion/acquisition/product/partnership",
      "detail": "specific fact with numbers",
      "confidence": "verified/likely/possible",
      "source": "domain",
      "url": "url",
      "date": "date"
    }
  ],
  "keyPeople": [
    {
      "name": "full name",
      "title": "job title",
      "linkedin": "linkedin url if found",
      "background": "brief background"
    }
  ],
  "painPoints": ["potential problems we could solve based on their situation"],
  "outreachAngles": ["specific hooks for reaching out based on recent events"],
  "icpFit": {
    "score": 0-100,
    "reasons": ["why they're a good fit"],
    "concerns": ["potential red flags or mismatches"]
  }
}

IMPORTANT RULES:
1. For keyPeople, ONLY include C-level executives (CEO, CTO, COO, CFO), Founders, VPs, and Directors. Do NOT include individual contributors like engineers, QA, analysts, etc.
2. Order keyPeople by seniority: CEO/Founder first, then CTO/COO, then VPs, then Directors.
3. For headquarters, provide city and country/state - NOT follower counts or employee numbers.
4. Be specific and factual. If information isn't found, use 'unknown' or empty arrays.
Return ONLY the JSON object.`

    const analysisResult = await analyzeWithLLM(
      analysisPrompt,
      'You are a B2B sales intelligence analyst. Extract comprehensive company intelligence from sources. Be specific, factual, and actionable. Return valid JSON only.',
      errors
    )

    let research: ResearchResult
    try {
      if (!analysisResult) {
        throw new Error('Empty LLM response')
      }
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/)
      research = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisResult)
    } catch (e: any) {
      errors.push(`Failed to parse LLM response: ${e.message}`)
      research = {
        companyInfo: { description: '', founded: '', headquarters: '', employeeCount: '', industry: industry || '', website: website || '', linkedinUrl: '', techStack: [], competitors: [] },
        fundingHistory: { totalRaised: '', lastRound: '', lastRoundDate: '', lastRoundAmount: '', investors: [] },
        recentNews: [],
        signals: [],
        keyPeople: [],
        painPoints: [],
        outreachAngles: [],
        icpFit: { score: 50, reasons: [], concerns: ['Insufficient data'] }
      }
    }

    progress.push('Research complete')

    // PHASE 4: Store in database
    // Find or create company first if company_id is 0
    let effectiveCompanyId = company_id
    
    if (!effectiveCompanyId || effectiveCompanyId === 0) {
      try {
        // Try to find existing company by name
        const existingResult = await sql`
          SELECT id FROM saved_companies 
          WHERE LOWER(company_name) = LOWER(${company_name})
          LIMIT 1
        `
        
        if (existingResult.rows.length > 0) {
          effectiveCompanyId = existingResult.rows[0].id
          progress.push(`Found existing company ID: ${effectiveCompanyId}`)
        } else {
          // Create new company
          const insertResult = await sql`
            INSERT INTO saved_companies (company_name, industry, source, created_at, updated_at)
            VALUES (${company_name}, ${industry || research.companyInfo.industry || ''}, 'chrome_extension', NOW(), NOW())
            RETURNING id
          `
          effectiveCompanyId = insertResult.rows[0].id
          progress.push(`Created new company ID: ${effectiveCompanyId}`)
        }
      } catch (findError: any) {
        console.error('Find/create company error:', findError)
        errors.push(`Company lookup error: ${findError.message}`)
      }
    }
    
    if (effectiveCompanyId && effectiveCompanyId > 0) {
      // Prepare signal data in expected format
      const signalData = {
        detected: research.signals.map(s => ({
          type: s.category,
          category: s.category,
          priority: ['funding', 'hiring', 'acquisition'].includes(s.category) ? 'high' : 
                   ['leadership', 'expansion', 'product'].includes(s.category) ? 'medium' : 'low',
          label: s.category === 'funding' ? '💰 Funding' :
                 s.category === 'hiring' ? '👥 Hiring' :
                 s.category === 'leadership' ? '👔 Leadership' :
                 s.category === 'expansion' ? '🌍 Expansion' :
                 s.category === 'acquisition' ? '🤝 M&A' :
                 s.category === 'product' ? '🚀 Product' :
                 s.category === 'partnership' ? '🤝 Partnership' : '📌 Other',
          detail: s.detail,
          title: s.detail,
          content: s.detail,
          url: s.url,
          source: s.source,
          publishedDate: s.date,
          confidence: s.confidence
        })),
        count: research.signals.length,
        high_priority: research.signals.filter(s => ['funding', 'hiring', 'acquisition'].includes(s.category)).length,
        medium_priority: research.signals.filter(s => ['leadership', 'expansion', 'product'].includes(s.category)).length,
        scanned_at: new Date().toISOString()
      }

      // Prepare links
      const linksData = uniqueResults.slice(0, 15).map(r => ({
        url: r.url,
        title: r.title,
        source: r.url ? new URL(r.url).hostname.replace('www.', '') : ''
      }))

      // Prepare extracted info
      const extractedInfo = {
        description: research.companyInfo.description,
        founded: research.companyInfo.founded,
        headquarters: research.companyInfo.headquarters,
        employeeCount: research.companyInfo.employeeCount,
        techStack: research.companyInfo.techStack,
        competitors: research.companyInfo.competitors,
        fundingTotal: research.fundingHistory.totalRaised,
        lastRound: research.fundingHistory.lastRound,
        lastRoundAmount: research.fundingHistory.lastRoundAmount,
        lastRoundDate: research.fundingHistory.lastRoundDate,
        investors: research.fundingHistory.investors,
        keyPeople: research.keyPeople,
        painPoints: research.painPoints,
        outreachAngles: research.outreachAngles,
        icpScore: research.icpFit.score,
        icpReasons: research.icpFit.reasons,
        icpConcerns: research.icpFit.concerns,
        researchedAt: new Date().toISOString()
      }

      // Safely extract founded year as integer
      let foundedYear: number | null = null
      if (research.companyInfo.founded && research.companyInfo.founded !== 'unknown') {
        const yearMatch = research.companyInfo.founded.match(/\d{4}/)
        if (yearMatch) {
          foundedYear = parseInt(yearMatch[0], 10)
        }
      }

      try {
        const updateResult = await sql.query(
          `UPDATE saved_companies 
           SET signal_data = $1::jsonb,
               research_links_data = $2::jsonb,
               extracted_info = $3::jsonb,
               has_new_signals = $4,
               last_scanned_at = NOW(),
               signal_count = $5,
               employee_count = COALESCE(NULLIF($6, ''), employee_count),
               founded_year = COALESCE($7, founded_year),
               country = COALESCE(NULLIF($8, ''), country),
               funding_stage = COALESCE(NULLIF($9, ''), funding_stage),
               funding_amount = COALESCE(NULLIF($10, ''), funding_amount),
               updated_at = NOW()
           WHERE id = $11
           RETURNING id, company_name`,
          [
            JSON.stringify(signalData),
            JSON.stringify(linksData),
            JSON.stringify(extractedInfo),
            research.signals.length > 0,
            research.signals.length,
            research.companyInfo.employeeCount !== 'unknown' ? research.companyInfo.employeeCount : null,
            foundedYear,
            research.companyInfo.headquarters !== 'unknown' ? research.companyInfo.headquarters : null,
            research.fundingHistory.lastRound !== 'unknown' ? research.fundingHistory.lastRound : null,
            research.fundingHistory.lastRoundAmount !== 'unknown' ? research.fundingHistory.lastRoundAmount : null,
            effectiveCompanyId
          ]
        )
        if (updateResult.rowCount && updateResult.rowCount > 0) {
          progress.push(`Updated company: ${updateResult.rows[0]?.company_name} (ID: ${effectiveCompanyId})`)
        } else {
          errors.push(`No rows updated for ID: ${effectiveCompanyId}`)
        }
      } catch (dbError: any) {
        console.error('Database update failed:', dbError)
        errors.push(`DB error: ${dbError.message}`)
        // Continue anyway - research data is still valid
      }
    }

    return NextResponse.json({
      success: true,
      research,
      company_id: effectiveCompanyId,
      stats: {
        sourcesSearched: searchQueries.length,
        sourcesFound: uniqueResults.length,
        signalsExtracted: research.signals.length,
        peopleFound: research.keyPeople.length,
        icpScore: research.icpFit.score
      },
      progress,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    errors.push(error.message)
    return NextResponse.json({ 
      error: 'Deep research failed',
      progress,
      errors
    }, { status: 500 })
  }
}