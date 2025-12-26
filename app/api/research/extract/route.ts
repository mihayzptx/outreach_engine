import { NextResponse } from 'next/server'

interface ExtractedInfo {
  employee_count?: string
  revenue_range?: string
  funding_stage?: string
  funding_amount?: string
  last_funding_date?: string
  founded_year?: number
  headquarters?: string
  website?: string
  is_hiring?: boolean
  buyer_intent?: boolean
  country?: string
}

function extractCompanyInfo(text: string, companyName: string): ExtractedInfo {
  const info: ExtractedInfo = {}
  const lowerText = text.toLowerCase()
  
  // Employee count - multiple patterns
  const empPatterns = [
    /(\d{1,3}(?:,\d{3})*)\s*(?:\+\s*)?(?:employees|workers|staff|people|team members)/i,
    /(?:employs?|has|with|of)\s*(?:about|approximately|around|over|more than|nearly)?\s*(\d{1,3}(?:,\d{3})*)\s*(?:employees|people|workers|staff)/i,
    /(?:team of|staff of|workforce of|headcount of)\s*(\d{1,3}(?:,\d{3})*)/i,
    /(\d+)\s*-\s*(\d+)\s*employees/i,
    /(?:company size|size)[\s:]+(\d{1,3}(?:,\d{3})*)/i
  ]
  for (const pattern of empPatterns) {
    const match = text.match(pattern)
    if (match) {
      const num = parseInt((match[2] || match[1]).replace(/,/g, ''))
      if (num > 0 && num < 1000000) {
        if (num <= 10) info.employee_count = '1-10'
        else if (num <= 50) info.employee_count = '11-50'
        else if (num <= 200) info.employee_count = '51-200'
        else if (num <= 500) info.employee_count = '201-500'
        else if (num <= 1000) info.employee_count = '501-1000'
        else if (num <= 5000) info.employee_count = '1001-5000'
        else info.employee_count = '5000+'
        break
      }
    }
  }
  
  // Revenue - multiple patterns
  const revPatterns = [
    /(?:revenue|sales|ARR|annual revenue|yearly revenue)\s*(?:of|:)?\s*\$?\s*(\d+(?:\.\d+)?)\s*(million|billion|m|b|M|B|mn|bn)/i,
    /\$(\d+(?:\.\d+)?)\s*(million|billion|m|b|M|B|mn|bn)\s*(?:in\s*)?(?:revenue|sales|ARR)/i,
    /(?:generates?|reported|earned)\s*\$?\s*(\d+(?:\.\d+)?)\s*(million|billion|m|b)\s*(?:in\s*)?(?:revenue|annually)/i,
    /(?:valued at|valuation of)\s*\$?\s*(\d+(?:\.\d+)?)\s*(million|billion|m|b)/i
  ]
  for (const pattern of revPatterns) {
    const match = text.match(pattern)
    if (match) {
      const num = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      let millions = (unit.includes('b') || unit === 'bn') ? num * 1000 : num
      if (millions < 1) info.revenue_range = '<$1M'
      else if (millions < 10) info.revenue_range = '$1M-$10M'
      else if (millions < 50) info.revenue_range = '$10M-$50M'
      else if (millions < 100) info.revenue_range = '$50M-$100M'
      else if (millions < 500) info.revenue_range = '$100M-$500M'
      else info.revenue_range = '>$500M'
      break
    }
  }
  
  // Funding amount
  const fundPatterns = [
    /(?:raised|secured|closed|announced|received)\s*(?:a\s*)?\$(\d+(?:\.\d+)?)\s*(million|billion|m|b|M|B|k|K|mn|bn)/i,
    /\$(\d+(?:\.\d+)?)\s*(million|billion|m|b|M|B|mn|bn)\s*(?:funding|round|investment|series|seed)/i,
    /(?:funding|investment|round)\s*(?:of|:)\s*\$(\d+(?:\.\d+)?)\s*(million|billion|m|b)/i
  ]
  for (const pattern of fundPatterns) {
    const match = text.match(pattern)
    if (match) {
      const num = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      if (unit === 'k') info.funding_amount = `$${num}K`
      else if (unit.includes('b') || unit === 'bn') info.funding_amount = `$${num}B`
      else info.funding_amount = `$${num}M`
      break
    }
  }
  
  // Funding stage - check in order of specificity
  if (lowerText.includes('series f') || lowerText.includes('series g')) info.funding_stage = 'Series D+'
  else if (lowerText.includes('series e')) info.funding_stage = 'Series D+'
  else if (lowerText.includes('series d')) info.funding_stage = 'Series D+'
  else if (lowerText.includes('series c')) info.funding_stage = 'Series C'
  else if (lowerText.includes('series b')) info.funding_stage = 'Series B'
  else if (lowerText.includes('series a')) info.funding_stage = 'Series A'
  else if (lowerText.includes('pre-seed') || lowerText.includes('preseed')) info.funding_stage = 'Pre-Seed'
  else if (lowerText.includes('seed round') || lowerText.includes('seed funding') || lowerText.includes('seed stage')) info.funding_stage = 'Seed'
  else if (lowerText.includes('private equity') || lowerText.includes(' pe ')) info.funding_stage = 'Private Equity'
  else if (lowerText.includes('ipo') || lowerText.includes('went public') || lowerText.includes('publicly traded') || lowerText.includes('nasdaq') || lowerText.includes('nyse')) info.funding_stage = 'IPO/Public'
  
  // Founded year
  const yearPatterns = [
    /(?:founded|established|started|launched|formed|created)\s*(?:in\s*)?(\d{4})/i,
    /(?:since|from|in operation since)\s*(\d{4})/i,
    /(\d{4})\s*(?:founded|established|startup)/i
  ]
  for (const pattern of yearPatterns) {
    const match = text.match(pattern)
    if (match) {
      const year = parseInt(match[1])
      if (year >= 1900 && year <= new Date().getFullYear()) {
        info.founded_year = year
        break
      }
    }
  }
  
  // Location/Country - expanded patterns
  const locPatterns = [
    /(?:headquartered|based|located|hq)\s*(?:in|at)\s*([A-Z][a-zA-Z\s,\.]+)/i,
    /(?:headquarters|head office|main office)\s*(?:in|:)\s*([A-Z][a-zA-Z\s,\.]+)/i
  ]
  for (const pattern of locPatterns) {
    const match = text.match(pattern)
    if (match) {
      let location = match[1].trim().substring(0, 100)
      // Clean up
      location = location.replace(/[,\.]$/, '').trim()
      info.headquarters = location
      
      const loc = location.toLowerCase()
      // US states
      if (loc.includes('united states') || loc.includes('usa') || loc.includes('u.s.') ||
          /\b(california|new york|texas|florida|washington|colorado|georgia|massachusetts|illinois|arizona|nevada|oregon|utah|virginia|north carolina|ohio|michigan|pennsylvania|new jersey|maryland|connecticut|boston|san francisco|los angeles|seattle|austin|denver|atlanta|chicago|miami|nyc|la|sf|bay area)\b/i.test(loc)) {
        info.country = 'United States'
      } else if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london') || loc.includes('england') || loc.includes('manchester') || loc.includes('birmingham')) {
        info.country = 'United Kingdom'
      } else if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver') || loc.includes('montreal')) {
        info.country = 'Canada'
      } else if (loc.includes('germany') || loc.includes('berlin') || loc.includes('munich') || loc.includes('frankfurt')) {
        info.country = 'Germany'
      } else if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne')) {
        info.country = 'Australia'
      } else if (loc.includes('france') || loc.includes('paris')) {
        info.country = 'France'
      } else if (loc.includes('israel') || loc.includes('tel aviv')) {
        info.country = 'Israel'
      } else if (loc.includes('singapore')) {
        info.country = 'Singapore'
      } else if (loc.includes('ireland') || loc.includes('dublin')) {
        info.country = 'Ireland'
      } else if (loc.includes('netherlands') || loc.includes('amsterdam')) {
        info.country = 'Netherlands'
      }
      break
    }
  }
  
  // Hiring signals
  info.is_hiring = lowerText.includes('hiring') || lowerText.includes('job opening') || 
                   lowerText.includes('open position') || lowerText.includes('join our team') ||
                   lowerText.includes('careers page') || lowerText.includes("we're growing") ||
                   lowerText.includes('looking for talent') || lowerText.includes('recruiting')
  
  // Buyer intent signals
  info.buyer_intent = lowerText.includes('looking for vendor') || lowerText.includes('seeking partner') ||
                      lowerText.includes('evaluating solution') || lowerText.includes('rfp') ||
                      lowerText.includes('request for proposal') || lowerText.includes('digital transformation') ||
                      lowerText.includes('modernization') || lowerText.includes('cloud migration')
  
  return info
}

function calculateGrade(info: ExtractedInfo, title?: string): { grade: string, score: number } {
  let total = 0, max = 0
  
  // P3 (3x)
  if (info.buyer_intent) { total += 5 * 3 }; max += 15
  if (info.is_hiring) { total += 5 * 3 }; max += 15
  if (info.funding_stage) {
    const s = info.funding_stage.toLowerCase()
    let pts = s.includes('series a') || s.includes('series b') ? 5 : 
              s.includes('series c') || s.includes('private') ? 4 : 
              s.includes('seed') ? 3 : 2
    total += pts * 3; max += 15
  }
  if (info.funding_amount) { total += 4 * 3; max += 15 }
  if (info.revenue_range) {
    const r = info.revenue_range
    let pts = r.includes('$1M-$10M') || r.includes('$10M-$50M') ? 5 : r.includes('$50M') ? 3 : 2
    total += pts * 3; max += 15
  }
  
  // P2 (2x)
  if (title) {
    const t = title.toLowerCase()
    let pts = t.includes('cto') || t.includes('cio') || (t.includes('vp') && (t.includes('tech') || t.includes('engineer'))) ? 5 :
              t.includes('ceo') || t.includes('director') || t.includes('head') || t.includes('chief') ? 4 : 
              t.includes('manager') || t.includes('founder') || t.includes('owner') ? 3 : 2
    total += pts * 2; max += 10
  }
  if (info.country) {
    const c = info.country.toLowerCase()
    let pts = c.includes('united states') || c.includes('uk') || c.includes('united kingdom') || c.includes('canada') ? 5 :
              c.includes('australia') || c.includes('israel') || c.includes('singapore') || c.includes('ireland') ? 4 : 3
    total += pts * 2; max += 10
  }
  if (info.employee_count) {
    const e = info.employee_count
    let pts = e.includes('11-50') || e.includes('51-200') || e.includes('201-500') ? 5 :
              e.includes('501-1000') ? 4 : 3
    total += pts * 2; max += 10
  }
  
  // P1 (1x)
  if (info.founded_year) {
    const age = new Date().getFullYear() - info.founded_year
    let pts = age >= 5 && age < 15 ? 5 : age >= 3 && age < 30 ? 3 : 1
    total += pts; max += 5
  }
  
  const pct = max > 0 ? Math.round((total / max) * 100) : 0
  const grade = pct >= 81 ? 'A' : pct >= 61 ? 'B' : pct >= 41 ? 'C' : pct >= 21 ? 'D' : 'E'
  return { grade, score: total }
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch (e) {
    console.error('Failed to parse request body:', e)
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { researchText, companyName, prospectTitle, sources } = body

  if (!researchText && !companyName) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const extracted = extractCompanyInfo(researchText || '', companyName || '')
    const { grade, score } = calculateGrade(extracted, prospectTitle)
    
    const researchLinks = (sources || []).map((url: string) => {
      try {
        return { url, source: new URL(url).hostname.replace('www.', ''), usedAt: new Date().toISOString() }
      } catch { return { url, source: url, usedAt: new Date().toISOString() } }
    })

    return NextResponse.json({ 
      success: true,
      extractedInfo: extracted,
      grading: { 
        grade, 
        score, 
        data: {
          buyerIntent: extracted.buyer_intent,
          activelyHiring: extracted.is_hiring,
          fundingStage: extracted.funding_stage,
          fundingAmount: extracted.funding_amount,
          revenueRange: extracted.revenue_range,
          companySize: extracted.employee_count,
          geography: extracted.country,
          yearFounded: extracted.founded_year
        }
      },
      researchLinks
    })
  } catch (error: any) {
    console.error('Extract error:', error.message || error)
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}