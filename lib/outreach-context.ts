// Outreach Context Builder
// Assembles all relevant data for personalized message generation

import { sql } from '@vercel/postgres'

export interface OutreachContext {
  // Prospect Info
  prospect: {
    name: string
    firstName: string
    title: string
    seniority: 'C-level' | 'VP' | 'Director' | 'Manager' | 'Individual'
    department: string
    isDecisionMaker: boolean
    linkedinUrl?: string
    email?: string
  }

  // Company Info
  company: {
    id?: number
    name: string
    industry: string
    size: string
    sizeCategory: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
    funding: string
    fundingAmount?: string
    location: string
    founded?: string
    techStack: string[]
    website?: string
  }

  // Research Data
  research: {
    painPoints: string[]
    outreachAngles: string[]
    recentSignals: {
      type: string
      detail: string
      date?: string
      priority: 'high' | 'medium' | 'low'
    }[]
    keyPeople: {
      name: string
      title: string
      linkedin?: string
    }[]
    competitors?: string[]
  }

  // ICP Fit Analysis
  icpFit: {
    score: number
    fit: 'high' | 'medium' | 'low'
    matchedCriteria: string[]
    relevantServices: string[]
    concerns: string[]
  }

  // Your Company Context
  yourCompany: {
    description: string
    relevantServices: string[]
    allServices: string[]
    valueProps: string[]
  }

  // Message Customization
  messageGuidance: {
    recommendedTone: string
    recommendedLength: string
    hookSuggestions: string[]
    avoidTopics: string[]
    seniorityAdjustments: string
  }
}

// Determine seniority from title
export function determineSeniority(title: string): OutreachContext['prospect']['seniority'] {
  const titleLower = title.toLowerCase()
  
  if (/\b(ceo|cto|cfo|coo|cio|ciso|chief|founder|co-founder|president)\b/.test(titleLower)) {
    return 'C-level'
  }
  if (/\b(vp|vice president|svp|evp|senior vice)\b/.test(titleLower)) {
    return 'VP'
  }
  if (/\b(director|head of|principal)\b/.test(titleLower)) {
    return 'Director'
  }
  if (/\b(manager|lead|team lead|supervisor)\b/.test(titleLower)) {
    return 'Manager'
  }
  return 'Individual'
}

// Determine department from title
export function determineDepartment(title: string): string {
  const titleLower = title.toLowerCase()
  
  if (/\b(engineering|developer|software|platform|infrastructure|devops|sre|backend|frontend|fullstack)\b/.test(titleLower)) {
    return 'Engineering'
  }
  if (/\b(product|pm)\b/.test(titleLower)) {
    return 'Product'
  }
  if (/\b(marketing|growth|brand|content)\b/.test(titleLower)) {
    return 'Marketing'
  }
  if (/\b(sales|revenue|account|business development)\b/.test(titleLower)) {
    return 'Sales'
  }
  if (/\b(operations|ops|coo)\b/.test(titleLower)) {
    return 'Operations'
  }
  if (/\b(finance|cfo|accounting)\b/.test(titleLower)) {
    return 'Finance'
  }
  if (/\b(hr|people|talent|recruiting)\b/.test(titleLower)) {
    return 'HR'
  }
  if (/\b(security|ciso|infosec)\b/.test(titleLower)) {
    return 'Security'
  }
  return 'General'
}

// Determine company size category
export function determineSizeCategory(sizeStr: string): OutreachContext['company']['sizeCategory'] {
  const match = sizeStr.match(/(\d+)/g)
  if (!match) return 'small'
  
  const count = parseInt(match[0])
  if (count <= 50) return 'startup'
  if (count <= 200) return 'small'
  if (count <= 500) return 'medium'
  if (count <= 2000) return 'large'
  return 'enterprise'
}

// Match services to company needs
export function matchServicesToNeeds(
  allServices: string[],
  techStack: string[],
  painPoints: string[],
  signals: string[]
): string[] {
  const relevantServices: string[] = []
  const context = [...techStack, ...painPoints, ...signals].map(s => s.toLowerCase()).join(' ')

  const serviceMatchers: Record<string, string[]> = {
    'Cloud Infrastructure Optimization': ['aws', 'gcp', 'azure', 'cloud', 'cost', 'infrastructure', 'scaling'],
    'CI/CD Implementation': ['ci/cd', 'jenkins', 'gitlab', 'github actions', 'deployment', 'pipeline', 'release'],
    'Kubernetes & Container Orchestration': ['kubernetes', 'k8s', 'docker', 'container', 'orchestration', 'microservices'],
    'Team Augmentation': ['hiring', 'team', 'staff', 'engineers', 'devops', 'scaling team', 'bandwidth'],
    'Platform Engineering': ['platform', 'developer experience', 'internal tools', 'self-service'],
    'Infrastructure as Code': ['terraform', 'pulumi', 'iac', 'infrastructure as code', 'automation'],
    'Observability & Monitoring': ['datadog', 'prometheus', 'grafana', 'monitoring', 'observability', 'logging', 'metrics'],
    'Security & Compliance': ['security', 'compliance', 'soc2', 'hipaa', 'pci', 'audit', 'gdpr']
  }

  for (const service of allServices) {
    const serviceName = service.split('(')[0].trim()
    const keywords = serviceMatchers[serviceName] || []
    
    if (keywords.some(kw => context.includes(kw))) {
      relevantServices.push(serviceName)
    }
  }

  // Return at least top 2 services even if no match
  if (relevantServices.length === 0) {
    return allServices.slice(0, 2).map(s => s.split('(')[0].trim())
  }

  return relevantServices.slice(0, 3)
}

// Generate hook suggestions based on signals and context
export function generateHookSuggestions(
  signals: { type: string; detail: string }[],
  painPoints: string[],
  funding: string,
  companyName: string
): string[] {
  const hooks: string[] = []

  // Signal-based hooks
  for (const signal of signals.slice(0, 3)) {
    if (signal.type === 'funding') {
      hooks.push(`Congrats on the ${funding || 'recent funding'}...`)
    } else if (signal.type === 'hiring') {
      hooks.push(`Saw ${companyName} is scaling the engineering team...`)
    } else if (signal.type === 'leadership') {
      hooks.push(`The new leadership move at ${companyName} caught my attention...`)
    } else if (signal.type === 'acquisition') {
      hooks.push(`The acquisition news is exciting for ${companyName}...`)
    } else if (signal.type === 'product') {
      hooks.push(`The recent product launch at ${companyName}...`)
    }
  }

  // Pain point hooks
  for (const pain of painPoints.slice(0, 2)) {
    hooks.push(`${pain} seems like a key focus for ${companyName}...`)
  }

  return hooks.slice(0, 4)
}

// Get seniority-based messaging adjustments
export function getSeniorityGuidance(seniority: string): string {
  const guidance: Record<string, string> = {
    'C-level': 'Keep it strategic and brief. Focus on business outcomes, ROI, and competitive advantage. Respect their time. No technical deep-dives unless they ask.',
    'VP': 'Balance strategic and tactical. Mention results and metrics. Show you understand their goals and pressures from above.',
    'Director': 'Mix of business impact and technical credibility. Reference specific technologies. Show you can help them hit their targets.',
    'Manager': 'More tactical focus. How will this help their team? Reference team challenges, bandwidth, skill gaps.',
    'Individual': 'Technical peer conversation. Shared challenges. Community angle. Less formal.'
  }
  return guidance[seniority] || guidance['Director']
}

// Build complete outreach context from company data
export async function buildOutreachContext(
  companyId: number,
  prospectName: string,
  prospectTitle: string,
  settings: any
): Promise<OutreachContext> {
  // Fetch company data from database
  let companyData: any = null
  let contacts: any[] = []

  try {
    const companyResult = await sql`
      SELECT * FROM saved_companies WHERE id = ${companyId}
    `
    if (companyResult.rows.length > 0) {
      companyData = companyResult.rows[0]
    }

    const contactsResult = await sql`
      SELECT * FROM contacts WHERE company_id = ${companyId} ORDER BY is_primary DESC
    `
    contacts = contactsResult.rows
  } catch (e) {
    console.error('Failed to fetch company data:', e)
  }

  // Extract data from company record
  const extractedInfo = companyData?.extracted_info || {}
  const signalData = companyData?.signal_data?.detected || companyData?.signal_data || []
  const icpBreakdown = companyData?.icp_breakdown || []

  // Build prospect info
  const seniority = determineSeniority(prospectTitle)
  const department = determineDepartment(prospectTitle)
  const isDecisionMaker = ['C-level', 'VP', 'Director'].includes(seniority)

  // Build company info
  const techStack = extractedInfo.techStack || []
  const size = companyData?.employee_count || extractedInfo.employeeCount || ''
  const sizeCategory = determineSizeCategory(size)

  // Build research data
  const painPoints = extractedInfo.painPoints || []
  const outreachAngles = extractedInfo.outreachAngles || []
  const keyPeople = extractedInfo.keyPeople || []
  
  const recentSignals = Array.isArray(signalData) 
    ? signalData.map((s: any) => ({
        type: s.category || s.type || 'general',
        detail: s.detail || s.content || s.label || '',
        date: s.publishedDate,
        priority: s.priority || 'medium'
      }))
    : []

  // Build ICP fit
  const icpScore = companyData?.icp_score || 0
  const icpFit = companyData?.icp_fit || (icpScore >= 70 ? 'high' : icpScore >= 40 ? 'medium' : 'low')
  const matchedCriteria = icpBreakdown
    .filter((b: any) => b.matched && b.points > 0)
    .map((b: any) => `${b.category}: ${b.matched}`)

  // Match relevant services
  const allServices = settings.services || []
  const signalTexts = recentSignals.map((s: any) => s.detail)
  const relevantServices = matchServicesToNeeds(allServices, techStack, painPoints, signalTexts)

  // Generate hook suggestions
  const hookSuggestions = generateHookSuggestions(
    recentSignals,
    painPoints,
    companyData?.funding_stage || extractedInfo.lastRound,
    companyData?.company_name || ''
  )

  // Build the complete context
  const context: OutreachContext = {
    prospect: {
      name: prospectName,
      firstName: prospectName.split(' ')[0],
      title: prospectTitle,
      seniority,
      department,
      isDecisionMaker,
      linkedinUrl: contacts.find(c => c.name === prospectName)?.linkedin_url,
      email: contacts.find(c => c.name === prospectName)?.email
    },

    company: {
      id: companyId,
      name: companyData?.company_name || '',
      industry: companyData?.industry || '',
      size,
      sizeCategory,
      funding: companyData?.funding_stage || extractedInfo.lastRound || '',
      fundingAmount: companyData?.funding_amount || extractedInfo.lastRoundAmount,
      location: companyData?.country || extractedInfo.headquarters || '',
      founded: companyData?.founded_year?.toString() || extractedInfo.founded,
      techStack,
      website: companyData?.website
    },

    research: {
      painPoints,
      outreachAngles,
      recentSignals,
      keyPeople,
      competitors: extractedInfo.competitors
    },

    icpFit: {
      score: icpScore,
      fit: icpFit as 'high' | 'medium' | 'low',
      matchedCriteria,
      relevantServices,
      concerns: icpBreakdown
        .filter((b: any) => b.points < 0)
        .map((b: any) => b.category)
    },

    yourCompany: {
      description: settings.companyDescription || '',
      relevantServices,
      allServices,
      valueProps: settings.idealCustomerSignals || []
    },

    messageGuidance: {
      recommendedTone: isDecisionMaker ? 'warm' : 'friendly',
      recommendedLength: seniority === 'C-level' ? 'short' : 'medium',
      hookSuggestions,
      avoidTopics: seniority === 'C-level' ? ['technical details', 'pricing', 'features list'] : [],
      seniorityAdjustments: getSeniorityGuidance(seniority)
    }
  }

  return context
}

// Format context for LLM prompt
export function formatContextForPrompt(ctx: OutreachContext): string {
  let prompt = `## PROSPECT PROFILE
Name: ${ctx.prospect.name}
Title: ${ctx.prospect.title}
Seniority: ${ctx.prospect.seniority}
Department: ${ctx.prospect.department}
Decision Maker: ${ctx.prospect.isDecisionMaker ? 'Yes' : 'No (Influencer)'}

## COMPANY PROFILE
Company: ${ctx.company.name}
Industry: ${ctx.company.industry}
Size: ${ctx.company.size} (${ctx.company.sizeCategory})
Funding: ${ctx.company.funding}${ctx.company.fundingAmount ? ` - ${ctx.company.fundingAmount}` : ''}
Location: ${ctx.company.location}
${ctx.company.founded ? `Founded: ${ctx.company.founded}` : ''}
${ctx.company.techStack.length > 0 ? `Tech Stack: ${ctx.company.techStack.join(', ')}` : ''}

## ICP FIT: ${ctx.icpFit.score}% (${ctx.icpFit.fit.toUpperCase()})
${ctx.icpFit.matchedCriteria.length > 0 ? `Matched: ${ctx.icpFit.matchedCriteria.join(', ')}` : ''}
${ctx.icpFit.relevantServices.length > 0 ? `Relevant Services: ${ctx.icpFit.relevantServices.join(', ')}` : ''}
`

  if (ctx.research.recentSignals.length > 0) {
    prompt += `\n## RECENT SIGNALS (USE THESE FOR PERSONALIZATION)\n`
    ctx.research.recentSignals.slice(0, 5).forEach(signal => {
      prompt += `- [${signal.priority.toUpperCase()}] ${signal.type}: ${signal.detail}\n`
    })
  }

  if (ctx.research.painPoints.length > 0) {
    prompt += `\n## LIKELY PAIN POINTS\n`
    ctx.research.painPoints.slice(0, 4).forEach(pain => {
      prompt += `- ${pain}\n`
    })
  }

  if (ctx.research.outreachAngles.length > 0) {
    prompt += `\n## SUGGESTED OUTREACH ANGLES\n`
    ctx.research.outreachAngles.slice(0, 3).forEach(angle => {
      prompt += `- ${angle}\n`
    })
  }

  if (ctx.messageGuidance.hookSuggestions.length > 0) {
    prompt += `\n## HOOK IDEAS\n`
    ctx.messageGuidance.hookSuggestions.forEach(hook => {
      prompt += `- "${hook}"\n`
    })
  }

  prompt += `\n## MESSAGING GUIDANCE FOR ${ctx.prospect.seniority.toUpperCase()}
${ctx.messageGuidance.seniorityAdjustments}
Recommended Tone: ${ctx.messageGuidance.recommendedTone}
Recommended Length: ${ctx.messageGuidance.recommendedLength}
${ctx.messageGuidance.avoidTopics.length > 0 ? `Avoid: ${ctx.messageGuidance.avoidTopics.join(', ')}` : ''}
`

  return prompt
}