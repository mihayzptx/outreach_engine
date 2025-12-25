import { NextResponse } from 'next/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  const { searchType, query, filters, companyProfile } = await request.json()

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 })
  }

  try {
    // Build search query based on type
    let searchQuery = query

    if (filters) {
      if (filters.industry) searchQuery += ` ${filters.industry}`
      if (filters.funding) searchQuery += ` ${filters.funding} funding`
      if (filters.location) searchQuery += ` ${filters.location}`
      if (filters.size) searchQuery += ` ${filters.size} employees`
      if (filters.hiring) searchQuery += ' hiring engineers devops'
    }

    // Search for companies
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 10,
        include_answer: false
      })
    })

    const tavilyData = await tavilyResponse.json()
    const results = tavilyData.results || []

    if (results.length === 0) {
      return NextResponse.json({ success: true, companies: [], contacts: [] })
    }

    // Use LLM to extract structured company/contact data
    if (!GROQ_API_KEY) {
      // Fallback without LLM
      const companies = results.map((r: any) => ({
        name: r.title?.split(/[-|–]/).shift()?.trim() || 'Unknown',
        description: r.content?.slice(0, 200),
        source: new URL(r.url).hostname.replace('www.', ''),
        sourceUrl: r.url,
        confidence: 'low'
      }))
      return NextResponse.json({ success: true, companies, contacts: [] })
    }

    // LLM extraction
    const articlesText = results.slice(0, 8).map((r: any, i: number) => `
RESULT ${i + 1}:
Title: ${r.title}
URL: ${r.url}
Content: ${r.content?.slice(0, 600) || 'No content'}
`).join('\n---\n')

    const extractionPrompt = `Extract company and contact information from these search results.

SEARCH QUERY: "${searchQuery}"
SEARCH TYPE: ${searchType || 'companies'}

OUR ICP (Ideal Customer Profile):
${companyProfile || `- B2B SaaS/Tech companies
- Recently funded (Series A-C)
- 50-500 employees
- Hiring DevOps/Platform engineers
- Using cloud infrastructure (AWS, GCP, Azure)`}

SEARCH RESULTS:
${articlesText}

TASK:
1. Extract companies that match our ICP
2. Extract any contacts mentioned (executives, hiring managers)
3. Note any buying signals (funding, hiring, expansion)
4. Rate confidence based on data quality

Return JSON:
{
  "companies": [
    {
      "name": "Company Name",
      "website": "domain.com",
      "industry": "SaaS/Fintech/etc",
      "description": "What they do",
      "size": "employee count if mentioned",
      "location": "HQ location",
      "signals": ["Recent funding", "Hiring DevOps"],
      "source": "source domain",
      "sourceUrl": "full URL",
      "icpFit": "high/medium/low",
      "confidence": "high/medium/low"
    }
  ],
  "contacts": [
    {
      "name": "Person Name",
      "title": "CTO/VP Engineering/etc",
      "company": "Company Name",
      "linkedin": "linkedin URL if found",
      "source": "where found"
    }
  ]
}

Only include companies/contacts you're confident about. Return valid JSON only.`

    const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a B2B prospecting analyst. Extract company and contact data from search results. Be accurate. Return valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    const llmData = await llmResponse.json()
    const content = llmData.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json({ success: true, companies: [], contacts: [], raw: results })
    }

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        parsed = JSON.parse(content)
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', content)
      return NextResponse.json({ success: true, companies: [], contacts: [], raw: results })
    }

    return NextResponse.json({
      success: true,
      companies: parsed.companies || [],
      contacts: parsed.contacts || [],
      searchQuery
    })

  } catch (error) {
    console.error('Prospect search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}