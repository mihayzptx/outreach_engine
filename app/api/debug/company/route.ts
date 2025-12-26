import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const companyName = url.searchParams.get('name') || 'Prepared'

  try {
    // Check table structure
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'saved_companies'
      ORDER BY ordinal_position
    `

    // Get company data
    const company = await sql`
      SELECT id, company_name, industry, employee_count, country, founded_year, 
             funding_stage, funding_amount, extracted_info, signal_data,
             created_at, updated_at
      FROM saved_companies 
      WHERE LOWER(company_name) LIKE LOWER(${`%${companyName}%`})
      LIMIT 1
    `

    return NextResponse.json({
      columns: columns.rows.map(c => c.column_name),
      hasExtractedInfo: columns.rows.some(c => c.column_name === 'extracted_info'),
      company: company.rows[0] || null,
      companyCount: company.rowCount
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      hint: 'Run: ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS extracted_info JSONB DEFAULT NULL;'
    }, { status: 500 })
  }
}