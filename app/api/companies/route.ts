import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM saved_companies 
      ORDER BY updated_at DESC
    `
    
    const response = NextResponse.json({ companies: result.rows })
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ companies: [] })
  }
}

// CREATE new company
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      company_name,
      industry,
      country,
      website,
      employee_count,
      revenue_range,
      funding_stage,
      funding_amount,
      founded_year,
      last_prospect_name,
      last_prospect_title,
      notes,
      labels,
      source
    } = body

    if (!company_name) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    // Check if company already exists
    const existing = await sql`
      SELECT id FROM saved_companies WHERE LOWER(company_name) = LOWER(${company_name})
    `
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Company already exists', 
        existing_id: existing.rows[0].id 
      }, { status: 409 })
    }

    const result = await sql`
      INSERT INTO saved_companies (
        company_name, industry, country, website, employee_count, revenue_range,
        funding_stage, funding_amount, founded_year, last_prospect_name, 
        last_prospect_title, notes, labels, source, created_at, updated_at
      ) VALUES (
        ${company_name}, ${industry || null}, ${country || null}, ${website || null},
        ${employee_count || null}, ${revenue_range || null}, ${funding_stage || null},
        ${funding_amount || null}, ${founded_year || null}, ${last_prospect_name || null},
        ${last_prospect_title || null}, ${notes || null}, ${labels ? JSON.stringify(labels) : null},
        ${source || 'manual'}, NOW(), NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, company: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    // Also delete related contacts
    await sql`DELETE FROM contacts WHERE company_id = ${id}`
    await sql`DELETE FROM saved_companies WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}