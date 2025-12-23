// Lead Grading System based on Tech-stack.io criteria

export interface LeadGradingData {
  // Priority 3 criteria
  buyerIntent: boolean
  activelyHiring: boolean
  lastFundingDate: string | null // months ago or date
  fundingStage: string | null
  fundingAmount: string | null
  revenueRange: string | null
  targetTier: string | null

  // Priority 2 criteria
  title: string | null
  geography: string | null
  companySize: string | null
  industry: string | null

  // Priority 1 criteria
  connections: number | null
  yearsInPosition: number | null
  yearsInCompany: number | null
  yearFounded: number | null
  companyLocation: string | null
}

export interface GradingResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  score: number
  maxScore: number
  percentage: number
  breakdown: {
    category: string
    criteria: string
    value: string | number | boolean | null
    points: number
    maxPoints: number
    priority: number
  }[]
}

// Geography scores
const GEOGRAPHY_SCORES: Record<string, number> = {
  'united states': 5, 'usa': 5, 'us': 5,
  'united kingdom': 5, 'uk': 5, 'gb': 5,
  'canada': 5,
  'australia': 4,
  'denmark': 4,
  'finland': 4,
  'ireland': 4,
  'israel': 4,
  'japan': 4,
  'luxembourg': 4,
  'netherlands': 4,
  'new zealand': 4,
  'norway': 4,
  'singapore': 4,
  'sweden': 4,
  'switzerland': 4,
  'united arab emirates': 4, 'uae': 4,
  'austria': 3,
  'belgium': 3,
  'france': 3,
  'germany': 3,
  'greece': 2,
  'hungary': 2,
  'iceland': 2,
  'italy': 2,
  'liechtenstein': 2,
  'spain': 2,
  'portugal': 2
}

// Industry scores (simplified)
const INDUSTRY_SCORES: Record<string, number> = {
  // Score 5 - Tech/Finance
  'saas': 5, 'software': 5, 'fintech': 5, 'banking': 5, 'financial services': 5,
  'data infrastructure': 5, 'business intelligence': 5, 'capital markets': 5,
  'e-learning': 5, 'internet': 5, 'mobile computing': 5, 'social networking': 5,
  'venture capital': 5, 'ai': 5, 'machine learning': 5, 'cybersecurity': 5,
  
  // Score 4 - Manufacturing/Industrial
  'manufacturing': 4, 'construction': 4, 'engineering': 4, 'logistics': 4,
  'transportation': 4, 'utilities': 4, 'renewable energy': 4, 'cleantech': 4,
  'food and beverage': 4, 'chemical': 4, 'electrical': 4, 'plastics': 4,
  'automotive': 4, 'aerospace': 4, 'medical equipment': 4,
  
  // Score 3
  'education': 3, 'healthcare': 3, 'retail': 3, 'restaurants': 3,
  'real estate': 3, 'media': 3, 'entertainment': 3, 'agriculture': 3,
  
  // Score 2
  'hospitality': 2, 'hotels': 2, 'fitness': 2, 'nonprofit': 2,
  'government': 2, 'human resources': 2,
  
  // Default
  'other': 1
}

// Company size scores
function getCompanySizeScore(size: string | null): number {
  if (!size) return 0
  const s = size.toLowerCase()
  if (s.includes('1-10') || s === '1-10') return 3
  if (s.includes('11-50') || s.includes('11 - 50')) return 5
  if (s.includes('51-200') || s.includes('51 - 200')) return 5
  if (s.includes('201-500') || s.includes('201 - 500')) return 5
  if (s.includes('501-1000') || s.includes('501 - 1000')) return 4
  if (s.includes('1001-5000') || s.includes('1000+')) return 3
  if (s.includes('5000+') || s.includes('10000')) return 2
  return 0
}

// Funding date score (months ago)
function getFundingDateScore(dateStr: string | null): number {
  if (!dateStr) return 0
  
  let monthsAgo: number
  
  // Check if it's a relative string like "3 months" or actual date
  if (dateStr.includes('month')) {
    monthsAgo = parseInt(dateStr) || 0
  } else {
    const date = new Date(dateStr)
    const now = new Date()
    monthsAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
  }
  
  if (monthsAgo <= 1) return 5
  if (monthsAgo <= 6) return 4
  if (monthsAgo <= 12) return 3
  if (monthsAgo <= 36) return 2.5
  if (monthsAgo <= 60) return 1
  return 0
}

// Funding stage score
function getFundingStageScore(stage: string | null): number {
  if (!stage) return 0
  const s = stage.toLowerCase()
  if (s.includes('series a')) return 5
  if (s.includes('series b')) return 5
  if (s.includes('series c') || s.includes('series d')) return 4
  if (s.includes('private equity') || s.includes('pe')) return 4
  if (s.includes('seed')) return 3
  if (s.includes('pre-seed') || s.includes('angel')) return 2
  if (s.includes('ipo') || s.includes('public')) return 2
  return 0
}

// Funding amount score
function getFundingAmountScore(amount: string | null): number {
  if (!amount) return 0
  
  // Extract number from string like "$5M" or "5 million"
  const numMatch = amount.match(/[\d.]+/)
  if (!numMatch) return 0
  
  let value = parseFloat(numMatch[0])
  const lower = amount.toLowerCase()
  
  // Convert to millions
  if (lower.includes('k') || lower.includes('thousand')) value /= 1000
  if (lower.includes('b') || lower.includes('billion')) value *= 1000
  
  if (value < 0.1) return 0 // < $100k
  if (value < 0.5) return 1 // $100k - $500k
  if (value < 2) return 5 // $500k - $2M
  if (value < 5) return 5 // $2M - $5M
  if (value < 20) return 4 // $5M - $20M
  return 3 // > $20M
}

// Revenue range score
function getRevenueScore(revenue: string | null): number {
  if (!revenue) return 0
  const r = revenue.toLowerCase()
  if (r.includes('<1m') || r.includes('less than 1') || r.includes('< $1')) return 0
  if (r.includes('1m') || r.includes('1-10') || r.includes('$1m to $10m')) return 5
  if (r.includes('10m') || r.includes('10-50') || r.includes('$10m to $50m')) return 5
  if (r.includes('50m') || r.includes('50-100') || r.includes('$50m to $100m')) return 3
  if (r.includes('100m') || r.includes('100-500')) return 2
  if (r.includes('500m') || r.includes('>500') || r.includes('1b')) return 1
  return 0
}

// Title score
function getTitleScore(title: string | null): number {
  if (!title) return 0
  const t = title.toLowerCase()
  
  // CxO level
  if (t.includes('cto') || t.includes('chief technology')) return 5
  if (t.includes('cio') || t.includes('chief information')) return 5
  if (t.includes('ceo') || t.includes('chief executive')) return 5
  if (t.includes('coo') || t.includes('chief operating')) return 4
  if (t.includes('cfo') || t.includes('chief financial')) return 3
  
  // VP level
  if ((t.includes('vp') || t.includes('vice president')) && 
      (t.includes('tech') || t.includes('engineer') || t.includes('it') || t.includes('product'))) return 5
  if (t.includes('vp') || t.includes('vice president')) return 4
  
  // Director level
  if (t.includes('director') && 
      (t.includes('tech') || t.includes('engineer') || t.includes('it') || t.includes('product'))) return 5
  if (t.includes('director')) return 4
  
  // Head level
  if (t.includes('head of') && 
      (t.includes('tech') || t.includes('engineer') || t.includes('it') || t.includes('product'))) return 5
  if (t.includes('head of')) return 4
  
  // Manager level
  if (t.includes('manager') || t.includes('lead')) return 3
  
  // Founder/Owner
  if (t.includes('founder') || t.includes('owner') || t.includes('partner')) return 4
  
  return 2
}

// Connections score
function getConnectionsScore(connections: number | null): number {
  if (!connections) return 0
  if (connections < 100) return 0
  if (connections < 300) return 2
  if (connections < 500) return 4
  return 5
}

// Years in position score
function getYearsPositionScore(years: number | null): number {
  if (!years) return 0
  if (years < 1) return 2
  if (years < 2) return 5
  if (years < 4) return 3
  return 1
}

// Years in company score
function getYearsCompanyScore(years: number | null): number {
  if (!years) return 0
  if (years < 1) return 3
  if (years < 3) return 5
  if (years < 6) return 3
  return 1
}

// Year founded score
function getYearFoundedScore(yearFounded: number | null): number {
  if (!yearFounded) return 0
  const age = new Date().getFullYear() - yearFounded
  if (age < 3) return 1
  if (age < 5) return 3
  if (age < 15) return 5
  if (age < 30) return 3
  return 1
}

// Geography/Location score helper
function getGeographyScore(location: string | null): number {
  if (!location) return 0
  const loc = location.toLowerCase()
  
  for (const [country, score] of Object.entries(GEOGRAPHY_SCORES)) {
    if (loc.includes(country)) return score
  }
  return 1
}

// Industry score helper
function getIndustryScore(industry: string | null): number {
  if (!industry) return 0
  const ind = industry.toLowerCase()
  
  for (const [key, score] of Object.entries(INDUSTRY_SCORES)) {
    if (ind.includes(key)) return score
  }
  return 1
}

// Main grading function
export function calculateLeadGrade(data: Partial<LeadGradingData>): GradingResult {
  const breakdown: GradingResult['breakdown'] = []
  
  // Priority 3 criteria (weight = 3)
  const p3Criteria = [
    { name: 'Buyer Intent', value: data.buyerIntent, points: data.buyerIntent ? 5 : 0, max: 5 },
    { name: 'Actively Hiring', value: data.activelyHiring, points: data.activelyHiring ? 5 : 0, max: 5 },
    { name: 'Funding Date', value: data.lastFundingDate, points: getFundingDateScore(data.lastFundingDate || null), max: 5 },
    { name: 'Funding Stage', value: data.fundingStage, points: getFundingStageScore(data.fundingStage || null), max: 5 },
    { name: 'Funding Amount', value: data.fundingAmount, points: getFundingAmountScore(data.fundingAmount || null), max: 5 },
    { name: 'Revenue Range', value: data.revenueRange, points: getRevenueScore(data.revenueRange || null), max: 5 },
  ]
  
  // Priority 2 criteria (weight = 2)
  const p2Criteria = [
    { name: 'Title', value: data.title, points: getTitleScore(data.title || null), max: 5 },
    { name: 'Geography', value: data.geography, points: getGeographyScore(data.geography || null), max: 5 },
    { name: 'Company Size', value: data.companySize, points: getCompanySizeScore(data.companySize || null), max: 5 },
    { name: 'Industry', value: data.industry, points: getIndustryScore(data.industry || null), max: 5 },
  ]
  
  // Priority 1 criteria (weight = 1)
  const p1Criteria = [
    { name: 'Connections', value: data.connections, points: getConnectionsScore(data.connections || null), max: 5 },
    { name: 'Years in Position', value: data.yearsInPosition, points: getYearsPositionScore(data.yearsInPosition || null), max: 5 },
    { name: 'Years in Company', value: data.yearsInCompany, points: getYearsCompanyScore(data.yearsInCompany || null), max: 5 },
    { name: 'Year Founded', value: data.yearFounded, points: getYearFoundedScore(data.yearFounded || null), max: 5 },
    { name: 'Company Location', value: data.companyLocation, points: getGeographyScore(data.companyLocation || null), max: 5 },
  ]
  
  let totalWeightedScore = 0
  let totalWeightedMax = 0
  let criteriaWithData = 0
  
  // Process P3 criteria
  for (const c of p3Criteria) {
    if (c.value !== null && c.value !== undefined && c.value !== '') {
      totalWeightedScore += c.points * 3
      totalWeightedMax += c.max * 3
      criteriaWithData++
    }
    breakdown.push({
      category: 'High Priority',
      criteria: c.name,
      value: c.value ?? null,
      points: c.points,
      maxPoints: c.max,
      priority: 3
    })
  }
  
  // Process P2 criteria
  for (const c of p2Criteria) {
    if (c.value !== null && c.value !== undefined && c.value !== '') {
      totalWeightedScore += c.points * 2
      totalWeightedMax += c.max * 2
      criteriaWithData++
    }
    breakdown.push({
      category: 'Medium Priority',
      criteria: c.name,
      value: c.value ?? null,
      points: c.points,
      maxPoints: c.max,
      priority: 2
    })
  }
  
  // Process P1 criteria
  for (const c of p1Criteria) {
    if (c.value !== null && c.value !== undefined && c.value !== '') {
      totalWeightedScore += c.points * 1
      totalWeightedMax += c.max * 1
      criteriaWithData++
    }
    breakdown.push({
      category: 'Low Priority',
      criteria: c.name,
      value: c.value ?? null,
      points: c.points,
      maxPoints: c.max,
      priority: 1
    })
  }
  
  // Calculate percentage (only using criteria with data)
  const percentage = totalWeightedMax > 0 
    ? Math.round((totalWeightedScore / totalWeightedMax) * 100) 
    : 0
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'E'
  if (percentage >= 81) grade = 'A'
  else if (percentage >= 61) grade = 'B'
  else if (percentage >= 41) grade = 'C'
  else if (percentage >= 21) grade = 'D'
  else grade = 'E'
  
  return {
    grade,
    score: totalWeightedScore,
    maxScore: totalWeightedMax,
    percentage,
    breakdown
  }
}

// Grade colors
export const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-green-500 text-white',
  'B': 'bg-blue-500 text-white',
  'C': 'bg-yellow-500 text-black',
  'D': 'bg-orange-500 text-white',
  'E': 'bg-red-500 text-white'
}

export const GRADE_BG_COLORS: Record<string, string> = {
  'A': 'bg-green-900/30 border-green-500/50',
  'B': 'bg-blue-900/30 border-blue-500/50',
  'C': 'bg-yellow-900/30 border-yellow-500/50',
  'D': 'bg-orange-900/30 border-orange-500/50',
  'E': 'bg-red-900/30 border-red-500/50'
}
