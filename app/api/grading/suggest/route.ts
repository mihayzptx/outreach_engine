import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY

// Scoring tables from grading system
const FUNDING_DATE_SCORES: Record<string, number> = {
  '0-1m': 5, '2-6m': 4, '6m-1y': 3, '1y-3y': 2.5, '3y-5y': 1, 'bad': 0
}

const FUNDING_STAGE_SCORES: Record<string, number> = {
  'Seed': 3, 'Series A': 5, 'Series B': 5, 'Private Equity': 4, 'Series C': 4, 'Series D+': 3, 'IPO': 2, 'bad': 0
}

const FUNDING_AMOUNT_SCORES: Record<string, number> = {
  '<100k': 0, '100k-500k': 1, '500k-2m': 5, '2m-5m': 5, '5m-20m': 4, '>20m': 3
}

const REVENUE_SCORES: Record<string, number> = {
  '<1m': 0, '1m-10m': 5, '10m-50m': 5, '50m-100m': 3, '100m-500m': 2, '>500m': 1
}

const COMPANY_SIZE_SCORES: Record<string, number> = {
  '1-10': 3, '11-50': 5, '51-200': 5, '201-500': 5, '501-1000': 4, '1001-5000': 3, '5000+': 2
}

const GEOGRAPHY_SCORES: Record<string, number> = {
  'United States': 5, 'United Kingdom': 5, 'Canada': 5,
  'Australia': 4, 'Denmark': 4, 'Finland': 4, 'Ireland': 4, 'Israel': 4, 'Japan': 4,
  'Luxembourg': 4, 'Netherlands': 4, 'New Zealand': 4, 'Norway': 4, 'Singapore': 4,
  'Sweden': 4, 'Switzerland': 4, 'United Arab Emirates': 4,
  'Austria': 3, 'Belgium': 3, 'France': 3, 'Germany': 3,
  'Greece': 2, 'Hungary': 2, 'Iceland': 2, 'Italy': 2, 'Spain': 2, 'Portugal': 2,
  'bad': 0
}

const TITLE_SCORES: Record<string, number> = {
  'CxO Technology': 5, 'CxO Leadership': 5, 'CxO Operations': 4,
  'VP Technology': 5, 'VP Operations': 4,
  'Director Technology': 5, 'Director Operations': 4,
  'Head Technology': 5, 'Head Operations': 4
}

const YEARS_POSITION_SCORES: Record<string, number> = {
  '<1': 2, '1-2': 5, '2-4': 3, '4+': 1
}

const YEARS_COMPANY_SCORES: Record<string, number> = {
  '<1': 3, '1-3': 5, '3-6': 3, '6+': 1
}

const YEAR_FOUNDED_SCORES: Record<string, number> = {
  '<3': 1, '3-5': 3, '5-15': 5, '15-30': 3, '30+': 1
}

const CONNECTIONS_SCORES: Record<string, number> = {
  '<100': 0, '100-300': 2, '300-500': 4, '500+': 5
}

// Industry scores (simplified - top industries)
const TOP_INDUSTRIES = [
  'Banking', 'Capital Markets', 'Financial Services', 'Data Infrastructure', 'Business Intelligence',
  'E-Learning', 'Internet Marketplace', 'Internet Publishing', 'Mobile Computing', 'Social Networking',
  'Software Development', 'Technology', 'Venture Capital', 'SaaS', 'Fintech', 'AI/ML'
]

function calculateGrade(score: number): string {
  if (score >= 81) return 'A'
  if (score >= 61) return 'B'
  if (score >= 41) return 'C'
  if (score >= 21) return 'D'
  return 'E'
}

export async function POST(request: Request) {
  const { company, companyProfile } = await request.json()

  // Extract signals for auto-detection
  const signals = company.signal_data?.detected || []
  const signalSummary = signals.map((s: any) => `${s.label}: ${s.detail}`).join('\n') || 'No signals detected'

  // Auto-detect some values from signals
  const autoDetected = {
    hasRecentFunding: signals.some((s: any) => s.category === 'funding'),
    isHiring: signals.some((s: any) => s.category === 'hiring'),
    fundingDetail: signals.find((s: any) => s.category === 'funding')?.detail || '',
    hasHighPrioritySignal: signals.some((s: any) => s.priority === 'high')
  }

  if (!GROQ_API_KEY) {
    // Return basic auto-detection without LLM
    return NextResponse.json({
      success: true,
      suggestion: {
        suggestedGrade: 'C',
        gradeReasoning: 'Limited data available for analysis',
        autoDetected,
        scoringCriteria: {
          buyerIntent: { detected: autoDetected.hasRecentFunding, score: autoDetected.hasRecentFunding ? 5 : 0 },
          activelyHiring: { detected: autoDetected.isHiring, score: autoDetected.isHiring ? 5 : 0 }
        }
      }
    })
  }

  const prompt = `Analyze this company for B2B software development sales targeting and extract scoring data.

COMPANY:
Name: ${company.company_name}
Industry: ${company.industry || 'Unknown'}
Size: ${company.employee_count || 'Unknown'}
Location: ${company.country || 'Unknown'}
Notes: ${company.notes || 'None'}

RECENT SIGNALS:
${signalSummary}

OUR ICP:
${companyProfile || `Tech-stack.io - 200+ software engineers
Target: Companies needing DevOps/software engineering help
Best fit: Recently funded, scaling, hiring engineers`}

SCORING CRITERIA TO EXTRACT:
1. Outsource Buyer Intent (yes/no) - Do they show intent to outsource software development?
2. Actively Hiring (yes/no) - Are they hiring DevOps/Platform/software engineers?
3. Last Funding Date (0-1m, 2-6m, 6m-1y, 1y-3y, 3y-5y, >5y, unknown)
4. Funding Stage (Seed, Series A, Series B, Series C, Private Equity, IPO, unknown)
5. Funding Amount (<100k, 100k-500k, 500k-2m, 2m-5m, 5m-20m, >20m, unknown)
6. Revenue Range (<1m, 1m-10m, 10m-50m, 50m-100m, 100m-500m, >500m, unknown)
7. Title Category (CxO/VP/Director/Head + Technology/Operations/Leadership)
8. Company Size (1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+)
9. Geography Score (US/UK/Canada=5, Australia/Israel/etc=4, Germany/France=3, etc)
10. Industry Fit (1-5 based on tech/software=5, manufacturing=4, services=3, other=2)
11. Target Type (Conference Attendee, Inc5000, T500, etc)

Return JSON:
{
  "scoringData": {
    "buyerIntent": true/false,
    "activelyHiring": true/false,
    "lastFundingDate": "category string",
    "fundingStage": "stage string",
    "fundingAmount": "range string",
    "revenueRange": "range string",
    "titleCategory": "category string or unknown",
    "companySize": "range string",
    "geography": "country name",
    "industryFit": 1-5,
    "targetType": "type or none"
  },
  "painPoints": ["specific problems we can solve"],
  "outreachAngle": "best approach",
  "concerns": ["any red flags"],
  "reasoning": "why this company is/isn't a good fit"
}`

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
          { role: 'system', content: 'Extract scoring data for B2B lead grading. Be specific. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json({ error: 'No response from LLM' }, { status: 500 })
    }

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse:', content)
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    // Calculate score based on extracted data
    const sd = parsed.scoringData || {}
    let totalScore = 0
    let maxScore = 0
    let filledCriteria = 0

    // High priority (k=3)
    if (sd.buyerIntent !== undefined) {
      totalScore += (sd.buyerIntent ? 5 : 0) * 3
      maxScore += 5 * 3
      filledCriteria++
    }
    if (sd.activelyHiring !== undefined) {
      totalScore += (sd.activelyHiring ? 5 : 0) * 3
      maxScore += 5 * 3
      filledCriteria++
    }
    if (sd.fundingStage && sd.fundingStage !== 'unknown') {
      const score = FUNDING_STAGE_SCORES[sd.fundingStage] || 2.5
      totalScore += score * 3
      maxScore += 5 * 3
      filledCriteria++
    }
    if (sd.fundingAmount && sd.fundingAmount !== 'unknown') {
      const score = FUNDING_AMOUNT_SCORES[sd.fundingAmount] || 2
      totalScore += score * 3
      maxScore += 5 * 3
      filledCriteria++
    }
    if (sd.revenueRange && sd.revenueRange !== 'unknown') {
      const score = REVENUE_SCORES[sd.revenueRange] || 2
      totalScore += score * 3
      maxScore += 5 * 3
      filledCriteria++
    }

    // Medium priority (k=2)
    if (sd.companySize && sd.companySize !== 'unknown') {
      const score = COMPANY_SIZE_SCORES[sd.companySize] || 3
      totalScore += score * 2
      maxScore += 5 * 2
      filledCriteria++
    }
    if (sd.geography && sd.geography !== 'unknown') {
      const score = GEOGRAPHY_SCORES[sd.geography] || 2
      totalScore += score * 2
      maxScore += 5 * 2
      filledCriteria++
    }
    if (sd.industryFit) {
      totalScore += sd.industryFit * 2
      maxScore += 5 * 2
      filledCriteria++
    }

    // Calculate normalized score (0-100)
    const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 50
    const grade = calculateGrade(normalizedScore)

    return NextResponse.json({
      success: true,
      suggestion: {
        suggestedGrade: grade,
        score: normalizedScore,
        gradeReasoning: parsed.reasoning || `Score: ${normalizedScore}/100 based on ${filledCriteria} criteria`,
        scoringData: sd,
        painPoints: parsed.painPoints || [],
        outreachAngle: parsed.outreachAngle || '',
        concerns: parsed.concerns || [],
        autoDetected
      }
    })

  } catch (error) {
    console.error('Grading error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}