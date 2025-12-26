import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface ICPSettings {
  industries: { name: string; weight: number; enabled: boolean }[]
  companySizes: { min: number; max: number; label: string; weight: number; enabled: boolean }[]
  fundingStages: { name: string; weight: number; enabled: boolean }[]
  geographies: { name: string; weight: number; enabled: boolean }[]
  companyAge: { min: number; max: number; weight: number }
  buyingSignals: { name: string; points: number; enabled: boolean }[]
  negativeSignals: { name: string; points: number; enabled: boolean }[]
  targetTitles: { title: string; priority: 'primary' | 'secondary' }[]
  techStack: { name: string; weight: number; enabled: boolean }[]
}

interface CompanyData {
  id?: number
  industry?: string
  employee_count?: string
  funding_stage?: string
  country?: string
  founded_year?: number
  signals?: string[]
  tech_stack?: string[]
  extracted_info?: {
    industry?: string
    employeeCount?: string
    headquarters?: string
    founded?: string
    techStack?: string[]
  }
}

interface ScoreResult {
  score: number
  maxScore: number
  normalizedScore: number
  breakdown: {
    category: string
    matched: string | null
    points: number
    maxPoints: number
  }[]
  fit: 'high' | 'medium' | 'low'
  matchedSignals: string[]
  matchedTech: string[]
}

function parseEmployeeCount(str: string | undefined): number | null {
  if (!str) return null
  const match = str.match(/(\d+)/g)
  if (!match) return null
  if (match.length >= 2) {
    return Math.round((parseInt(match[0]) + parseInt(match[1])) / 2)
  }
  return parseInt(match[0])
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

export function calculateICPScore(company: CompanyData, icpSettings: ICPSettings): ScoreResult {
  const breakdown: ScoreResult['breakdown'] = []
  let totalScore = 0
  let maxScore = 0
  const matchedSignals: string[] = []
  const matchedTech: string[] = []

  // 1. Industry Match
  const industryMax = Math.max(...icpSettings.industries.filter(i => i.enabled).map(i => i.weight), 0)
  maxScore += industryMax
  
  const companyIndustry = normalizeString(company.industry || company.extracted_info?.industry || '')
  let industryPoints = 0
  let industryMatch: string | null = null
  
  for (const ind of icpSettings.industries.filter(i => i.enabled)) {
    if (companyIndustry.includes(normalizeString(ind.name)) || normalizeString(ind.name).includes(companyIndustry)) {
      if (ind.weight > industryPoints) {
        industryPoints = ind.weight
        industryMatch = ind.name
      }
    }
  }
  totalScore += industryPoints
  breakdown.push({ category: 'Industry', matched: industryMatch, points: industryPoints, maxPoints: industryMax })

  // 2. Company Size Match
  const sizeMax = Math.max(...icpSettings.companySizes.filter(s => s.enabled).map(s => s.weight), 0)
  maxScore += sizeMax
  
  const employeeCount = parseEmployeeCount(company.employee_count || company.extracted_info?.employeeCount)
  let sizePoints = 0
  let sizeMatch: string | null = null
  
  if (employeeCount) {
    for (const size of icpSettings.companySizes.filter(s => s.enabled)) {
      if (employeeCount >= size.min && employeeCount <= size.max) {
        sizePoints = size.weight
        sizeMatch = size.label
        break
      }
    }
  }
  totalScore += sizePoints
  breakdown.push({ category: 'Company Size', matched: sizeMatch, points: sizePoints, maxPoints: sizeMax })

  // 3. Funding Stage Match
  const fundingMax = Math.max(...icpSettings.fundingStages.filter(f => f.enabled).map(f => f.weight), 0)
  maxScore += fundingMax
  
  const companyFunding = normalizeString(company.funding_stage || '')
  let fundingPoints = 0
  let fundingMatch: string | null = null
  
  for (const stage of icpSettings.fundingStages.filter(f => f.enabled)) {
    if (companyFunding.includes(normalizeString(stage.name))) {
      fundingPoints = stage.weight
      fundingMatch = stage.name
      break
    }
  }
  totalScore += fundingPoints
  breakdown.push({ category: 'Funding Stage', matched: fundingMatch, points: fundingPoints, maxPoints: fundingMax })

  // 4. Geography Match
  const geoMax = Math.max(...icpSettings.geographies.filter(g => g.enabled).map(g => g.weight), 0)
  maxScore += geoMax
  
  const companyLocation = normalizeString(company.country || company.extracted_info?.headquarters || '')
  let geoPoints = 0
  let geoMatch: string | null = null
  
  for (const geo of icpSettings.geographies.filter(g => g.enabled)) {
    const geoNorm = normalizeString(geo.name)
    if (companyLocation.includes(geoNorm) || geoNorm.includes(companyLocation.split(',')[0])) {
      if (geo.weight > geoPoints) {
        geoPoints = geo.weight
        geoMatch = geo.name
      }
    }
  }
  totalScore += geoPoints
  breakdown.push({ category: 'Geography', matched: geoMatch, points: geoPoints, maxPoints: geoMax })

  // 5. Buying Signals
  const signalsMax = icpSettings.buyingSignals.filter(s => s.enabled).reduce((sum, s) => sum + s.points, 0)
  maxScore += signalsMax
  
  let signalsPoints = 0
  const companySignals = (company.signals || []).map(s => normalizeString(s)).join(' ')
  
  for (const signal of icpSettings.buyingSignals.filter(s => s.enabled)) {
    const signalWords = normalizeString(signal.name).split(' ')
    const hasSignal = signalWords.some(word => companySignals.includes(word))
    if (hasSignal) {
      signalsPoints += signal.points
      matchedSignals.push(signal.name)
    }
  }
  totalScore += signalsPoints
  breakdown.push({ category: 'Buying Signals', matched: matchedSignals.length > 0 ? matchedSignals.join(', ') : null, points: signalsPoints, maxPoints: signalsMax })

  // 6. Tech Stack Match
  const techMax = icpSettings.techStack.filter(t => t.enabled).reduce((sum, t) => sum + t.weight, 0)
  maxScore += techMax
  
  let techPoints = 0
  const companyTech = (company.tech_stack || company.extracted_info?.techStack || []).map(t => normalizeString(t)).join(' ')
  
  for (const tech of icpSettings.techStack.filter(t => t.enabled)) {
    if (companyTech.includes(normalizeString(tech.name))) {
      techPoints += tech.weight
      matchedTech.push(tech.name)
    }
  }
  totalScore += techPoints
  breakdown.push({ category: 'Tech Stack', matched: matchedTech.length > 0 ? matchedTech.join(', ') : null, points: techPoints, maxPoints: techMax })

  // 7. Negative Signals (subtract from total)
  for (const signal of icpSettings.negativeSignals.filter(s => s.enabled)) {
    const signalWords = normalizeString(signal.name).split(' ')
    const hasSignal = signalWords.some(word => companySignals.includes(word))
    if (hasSignal) {
      totalScore += signal.points // negative value
      breakdown.push({ category: 'Penalty: ' + signal.name, matched: signal.name, points: signal.points, maxPoints: 0 })
    }
  }

  // Ensure score doesn't go below 0
  totalScore = Math.max(0, totalScore)

  // Normalize to 0-100 scale
  const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Determine fit level
  let fit: 'high' | 'medium' | 'low' = 'low'
  if (normalizedScore >= 70) fit = 'high'
  else if (normalizedScore >= 40) fit = 'medium'

  return {
    score: totalScore,
    maxScore,
    normalizedScore,
    breakdown,
    fit,
    matchedSignals,
    matchedTech
  }
}

// API endpoint to score a company and optionally save to DB
export async function POST(request: Request) {
  try {
    const { company, icpSettings, saveToDb = false } = await request.json()

    if (!company || !icpSettings) {
      return NextResponse.json({ error: 'Company and ICP settings required' }, { status: 400 })
    }

    const result = calculateICPScore(company, icpSettings)

    // Save to database if requested and company has an ID
    if (saveToDb && company.id) {
      try {
        await sql`
          UPDATE saved_companies SET
            icp_score = ${result.normalizedScore},
            icp_fit = ${result.fit},
            icp_breakdown = ${JSON.stringify(result.breakdown)},
            icp_scored_at = NOW()
          WHERE id = ${company.id}
        `
      } catch (dbError: any) {
        console.error('Failed to save ICP score to DB:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('ICP scoring error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Batch score multiple companies and save to DB
export async function PUT(request: Request) {
  try {
    const { companies, icpSettings, saveToDb = true } = await request.json()

    if (!companies || !Array.isArray(companies) || !icpSettings) {
      return NextResponse.json({ error: 'Companies array and ICP settings required' }, { status: 400 })
    }

    const results = []
    
    for (const company of companies) {
      const scoreResult = calculateICPScore(company, icpSettings)
      
      // Save to database
      if (saveToDb && company.id) {
        try {
          await sql`
            UPDATE saved_companies SET
              icp_score = ${scoreResult.normalizedScore},
              icp_fit = ${scoreResult.fit},
              icp_breakdown = ${JSON.stringify(scoreResult.breakdown)},
              icp_scored_at = NOW()
            WHERE id = ${company.id}
          `
        } catch (dbError: any) {
          console.error(`Failed to save ICP score for company ${company.id}:`, dbError)
        }
      }
      
      results.push({
        id: company.id,
        company_name: company.company_name,
        ...scoreResult
      })
    }

    return NextResponse.json({
      success: true,
      results,
      scored: results.length
    })
  } catch (error: any) {
    console.error('Batch ICP scoring error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}