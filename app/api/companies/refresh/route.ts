import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { tavily } from '@tavily/core'

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

// Signal categories with their search queries
const SIGNAL_CATEGORIES = [
  {
    type: 'hiring',
    label: '👤 New Hires',
    queries: ['new hire', 'appointed', 'joins as', 'promoted to', 'new CEO', 'new CTO', 'leadership change'],
    color: 'blue'
  },
  {
    type: 'funding',
    label: '💰 Funding',
    queries: ['funding', 'raises', 'series A', 'series B', 'investment', 'venture capital', 'raised million'],
    color: 'green'
  },
  {
    type: 'acquisition',
    label: '🤝 M&A',
    queries: ['acquires', 'acquired by', 'merger', 'acquisition', 'buys', 'purchased'],
    color: 'purple'
  },
  {
    type: 'product',
    label: '🚀 Product/Announcement',
    queries: ['launches', 'announces', 'unveils', 'new product', 'release', 'expansion'],
    color: 'orange'
  },
  {
    type: 'conference',
    label: '🎤 Events/Speaking',
    queries: ['conference', 'speaking at', 'keynote', 'summit', 'event', 'webinar', 'panel'],
    color: 'pink'
  },
  {
    type: 'media',
    label: '📰 Press/Media',
    queries: ['featured in', 'interview', 'press release', 'news', 'article', 'coverage'],
    color: 'cyan'
  },
  {
    type: 'blog',
    label: '📝 Blog/Content',
    queries: ['blog', 'published', 'article by', 'whitepaper', 'report'],
    color: 'yellow'
  },
  {
    type: 'award',
    label: '🏆 Awards/Recognition',
    queries: ['award', 'winner', 'recognized', 'named to', 'top 100', 'best', 'honored'],
    color: 'amber'
  }
]

interface SignalResult {
  type: string
  label: string
  color: string
  title: string
  content: string
  url: string
  source: string
  publishedDate: string | null
  relevanceScore: number
}

async function searchSignals(companyName: string, industry: string): Promise<SignalResult[]> {
  const allSignals: SignalResult[] = []
  const seenUrls = new Set<string>()

  // Run searches for each category
  for (const category of SIGNAL_CATEGORIES) {
    try {
      // Build search query with company name and category keywords
      const searchQuery = `"${companyName}" ${category.queries.slice(0, 3).join(' OR ')}`
      
      const response = await tavilyClient.search(searchQuery, {
        maxResults: 3,
        searchDepth: 'basic',
        includeAnswer: false,
        days: 60 // Last 60 days for more coverage
      })

      if (response.results && response.results.length > 0) {
        for (const result of response.results) {
          // Skip duplicates
          if (seenUrls.has(result.url)) continue
          seenUrls.add(result.url)

          // Calculate relevance score based on keyword matches
          let relevanceScore = 0
          const textToCheck = `${result.title} ${result.content}`.toLowerCase()
          
          for (const keyword of category.queries) {
            if (textToCheck.includes(keyword.toLowerCase())) {
              relevanceScore += 10
            }
          }
          
          // Must have company name mentioned
          if (!textToCheck.includes(companyName.toLowerCase())) {
            relevanceScore -= 20
          }

          if (relevanceScore > 0) {
            allSignals.push({
              type: category.type,
              label: category.label,
              color: category.color,
              title: result.title,
              content: result.content,
              url: result.url,
              source: result.url ? new URL(result.url).hostname.replace('www.', '') : '',
              publishedDate: result.publishedDate || null,
              relevanceScore
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error searching ${category.type}:`, error)
    }
  }

  // Also run a general company news search
  try {
    const generalQuery = `"${companyName}" ${industry} latest news updates 2024`
    const generalResponse = await tavilyClient.search(generalQuery, {
      maxResults: 5,
      searchDepth: 'advanced',
      includeAnswer: false,
      days: 30
    })

    if (generalResponse.results) {
      for (const result of generalResponse.results) {
        if (seenUrls.has(result.url)) continue
        seenUrls.add(result.url)

        // Categorize based on content
        let matchedCategory = SIGNAL_CATEGORIES.find(cat => 
          cat.queries.some(q => 
            result.title?.toLowerCase().includes(q.toLowerCase()) ||
            result.content?.toLowerCase().includes(q.toLowerCase())
          )
        )

        if (!matchedCategory) {
          matchedCategory = { type: 'media', label: '📰 Press/Media', color: 'cyan', queries: [] }
        }

        allSignals.push({
          type: matchedCategory.type,
          label: matchedCategory.label,
          color: matchedCategory.color,
          title: result.title,
          content: result.content,
          url: result.url,
          source: result.url ? new URL(result.url).hostname.replace('www.', '') : '',
          publishedDate: result.publishedDate || null,
          relevanceScore: 5
        })
      }
    }
  } catch (error) {
    console.error('Error in general search:', error)
  }

  // Sort by relevance and date
  allSignals.sort((a, b) => {
    // First by relevance
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore
    }
    // Then by date
    if (a.publishedDate && b.publishedDate) {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    }
    return 0
  })

  // Return top 15 most relevant signals
  return allSignals.slice(0, 15)
}

export async function POST(request: Request) {
  const { company_id, company_name, industry } = await request.json()

  try {
    // Collect signals
    const signals = await searchSignals(company_name, industry || '')

    const hasNewSignals = signals.length > 0

    // Prepare legacy format for backward compatibility
    const legacySignals = signals.map(s => `${s.title}: ${s.content}`)
    const legacyLinks = signals.map(s => s.url)

    // Update database
    await sql`
      UPDATE saved_companies
      SET
        new_signals = ${JSON.stringify(legacySignals)},
        signal_links = ${JSON.stringify(legacyLinks)},
        signal_data = ${JSON.stringify(signals)},
        has_new_signals = ${hasNewSignals},
        last_scanned_at = NOW(),
        last_signal_date = ${hasNewSignals ? new Date().toISOString() : null},
        signal_count = ${signals.length}
      WHERE id = ${company_id}
    `

    // Group signals by type for summary
    const signalsByType: Record<string, number> = {}
    for (const signal of signals) {
      signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1
    }

    return NextResponse.json({ 
      success: true, 
      signals: legacySignals,
      links: legacyLinks,
      signalData: signals,
      signalsByType,
      totalSignals: signals.length,
      hasNewSignals 
    })
  } catch (error) {
    console.error('Error refreshing company:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to refresh company' 
    }, { status: 500 })
  }
}
