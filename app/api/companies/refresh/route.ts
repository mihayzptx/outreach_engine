import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { tavily } from '@tavily/core'

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

export async function POST(request: Request) {
  const { company_id, company_name, industry } = await request.json()

  try {
    // Search for recent news
    const searchQuery = `${company_name} ${industry} news funding expansion hiring latest`
    const searchResponse = await tavilyClient.search(searchQuery, {
      maxResults: 5,
      searchDepth: 'basic',
      includeAnswer: false,
      days: 30 // Only news from last 30 days
    })

    let signals: string[] = []
    let links: string[] = []
    let hasNewSignals = false

    if (searchResponse.results && searchResponse.results.length > 0) {
      signals = searchResponse.results.map((result: any) => 
        `${result.title}: ${result.content}`
      )
      links = searchResponse.results.map((result: any) => result.url)
      hasNewSignals = signals.length > 0
    }

    // Update database
    await sql`
  UPDATE saved_companies
  SET
    new_signals = ${JSON.stringify(signals)},
    signal_links = ${JSON.stringify(links)},
    has_new_signals = ${hasNewSignals},
    last_scanned_at = NOW(),
    last_signal_date = ${hasNewSignals ? new Date().toISOString() : null},
    signal_count = ${signals.length}
  WHERE id = ${company_id}
    `

    return NextResponse.json({ 
      success: true, 
      signals,
      links,
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