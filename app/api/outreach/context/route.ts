import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { buildOutreachContext, formatContextForPrompt } from '../../../../lib/outreach-context'

// Default settings (subset needed for context building)
const defaultSettings = {
  companyDescription: "Tech-stack.io is a 200+ person DevOps services company headquartered in Houston, TX.",
  services: [
    "Cloud Infrastructure Optimization (AWS, GCP, Azure)",
    "CI/CD Implementation (Jenkins, GitLab CI, GitHub Actions)",
    "Kubernetes & Container Orchestration",
    "Team Augmentation (embedded senior DevOps engineers)",
    "Platform Engineering",
    "Infrastructure as Code (Terraform, Pulumi)",
    "Observability & Monitoring (Datadog, Prometheus, Grafana)",
    "Security & Compliance (SOC2, HIPAA, PCI-DSS)"
  ],
  idealCustomerSignals: [
    "Just raised funding (Series A, B, C)",
    "Post-acquisition integration",
    "Rapid growth / scaling challenges",
    "Cloud cost problems",
    "Security audit coming",
    "Platform team too small",
    "Legacy modernization needs",
    "DevOps hiring struggles"
  ]
}

// Fetch settings
async function getSettings() {
  try {
    // Try to get from user_settings
    const result = await sql`
      SELECT settings_value FROM user_settings 
      WHERE user_id = 'default' AND settings_key = 'full'
    `
    if (result.rows.length > 0 && result.rows[0].settings_value) {
      return { ...defaultSettings, ...result.rows[0].settings_value }
    }
  } catch (error) {
    console.log('Could not fetch settings, using defaults')
  }
  return defaultSettings
}

// GET - Preview context for a company/prospect
export async function POST(request: Request) {
  try {
    const { companyId, prospectName, prospectTitle } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    }

    const settings = await getSettings()
    
    const context = await buildOutreachContext(
      companyId,
      prospectName || '',
      prospectTitle || '',
      settings
    )

    // Format for display
    const formattedPrompt = formatContextForPrompt(context)

    return NextResponse.json({
      success: true,
      context,
      formattedPrompt,
      summary: {
        company: context.company.name,
        icpScore: context.icpFit.score,
        icpFit: context.icpFit.fit,
        seniority: context.prospect.seniority,
        isDecisionMaker: context.prospect.isDecisionMaker,
        signalCount: context.research.recentSignals.length,
        painPointCount: context.research.painPoints.length,
        relevantServices: context.icpFit.relevantServices,
        recommendedTone: context.messageGuidance.recommendedTone,
        recommendedLength: context.messageGuidance.recommendedLength,
        hookSuggestions: context.messageGuidance.hookSuggestions
      }
    })
  } catch (error: any) {
    console.error('Context preview error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}