import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Default ICP settings
const defaultICPSettings = {
  industries: [
    { name: 'SaaS', weight: 10, enabled: true },
    { name: 'Fintech', weight: 8, enabled: true },
    { name: 'Healthcare Tech', weight: 7, enabled: true },
    { name: 'E-commerce', weight: 6, enabled: true },
    { name: 'AI/ML', weight: 9, enabled: true },
    { name: 'Cybersecurity', weight: 8, enabled: true },
    { name: 'Developer Tools', weight: 9, enabled: true },
    { name: 'Data/Analytics', weight: 7, enabled: true }
  ],
  companySizes: [
    { min: 1, max: 50, label: '1-50', weight: 3, enabled: true },
    { min: 51, max: 200, label: '51-200', weight: 10, enabled: true },
    { min: 201, max: 500, label: '201-500', weight: 8, enabled: true },
    { min: 501, max: 1000, label: '501-1000', weight: 5, enabled: true },
    { min: 1001, max: 100000, label: '1000+', weight: 2, enabled: false }
  ],
  fundingStages: [
    { name: 'Seed', weight: 5, enabled: true },
    { name: 'Series A', weight: 10, enabled: true },
    { name: 'Series B', weight: 10, enabled: true },
    { name: 'Series C', weight: 8, enabled: true },
    { name: 'Series D+', weight: 5, enabled: true },
    { name: 'Public', weight: 2, enabled: false },
    { name: 'Bootstrapped', weight: 4, enabled: true }
  ],
  geographies: [
    { name: 'United States', weight: 10, enabled: true },
    { name: 'Canada', weight: 8, enabled: true },
    { name: 'United Kingdom', weight: 7, enabled: true },
    { name: 'Germany', weight: 6, enabled: true },
    { name: 'Western Europe', weight: 6, enabled: true },
    { name: 'Australia', weight: 5, enabled: true },
    { name: 'Israel', weight: 7, enabled: true }
  ],
  buyingSignals: [
    { name: 'Recently Funded', points: 20, enabled: true },
    { name: 'Hiring DevOps/Platform Engineers', points: 15, enabled: true },
    { name: 'New CTO/VP Engineering', points: 12, enabled: true },
    { name: 'Post-Acquisition Integration', points: 15, enabled: true },
    { name: 'Rapid Headcount Growth', points: 10, enabled: true },
    { name: 'Cloud Migration Announced', points: 12, enabled: true },
    { name: 'Infrastructure Problems Mentioned', points: 15, enabled: true },
    { name: 'Scaling Challenges', points: 12, enabled: true },
    { name: 'Security/Compliance Needs', points: 10, enabled: true }
  ],
  negativeSignals: [
    { name: 'Large Internal DevOps Team', points: -15, enabled: true },
    { name: 'Recent Layoffs', points: -10, enabled: true },
    { name: 'Competitor Customer', points: -20, enabled: true },
    { name: 'Government/Public Sector', points: -5, enabled: true },
    { name: 'Consulting/Agency', points: -10, enabled: true }
  ],
  targetTitles: [
    { title: 'CTO', priority: 'primary' },
    { title: 'VP of Engineering', priority: 'primary' },
    { title: 'VP of Infrastructure', priority: 'primary' },
    { title: 'Head of Platform', priority: 'primary' },
    { title: 'Director of Engineering', priority: 'secondary' },
    { title: 'Director of DevOps', priority: 'secondary' },
    { title: 'Engineering Manager', priority: 'secondary' }
  ],
  techStack: [
    { name: 'AWS', weight: 8, enabled: true },
    { name: 'GCP', weight: 8, enabled: true },
    { name: 'Azure', weight: 7, enabled: true },
    { name: 'Kubernetes', weight: 10, enabled: true },
    { name: 'Terraform', weight: 9, enabled: true },
    { name: 'Docker', weight: 7, enabled: true },
    { name: 'Jenkins', weight: 6, enabled: true },
    { name: 'GitHub Actions', weight: 7, enabled: true },
    { name: 'GitLab CI', weight: 7, enabled: true },
    { name: 'Datadog', weight: 6, enabled: true }
  ]
}

// GET - Fetch ICP settings (for extension and other clients)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'default'

  try {
    const result = await sql`
      SELECT settings_value FROM user_settings 
      WHERE user_id = ${userId} AND settings_key = 'icp'
    `

    if (result.rows.length > 0) {
      return NextResponse.json({
        success: true,
        icp: result.rows[0].settings_value,
        source: 'database'
      })
    }

    // Return defaults if no saved settings
    return NextResponse.json({
      success: true,
      icp: defaultICPSettings,
      source: 'defaults'
    })
  } catch (error: any) {
    // Return defaults on error
    return NextResponse.json({
      success: true,
      icp: defaultICPSettings,
      source: 'defaults',
      error: error.message
    })
  }
}

// POST - Save ICP settings
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId = 'default', icp } = body

    if (!icp) {
      return NextResponse.json({ error: 'ICP settings required' }, { status: 400 })
    }

    await sql`
      INSERT INTO user_settings (user_id, settings_key, settings_value)
      VALUES (${userId}, 'icp', ${JSON.stringify(icp)})
      ON CONFLICT (user_id, settings_key)
      DO UPDATE SET 
        settings_value = ${JSON.stringify(icp)},
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}