import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ success: false, error: 'Company ID required' }, { status: 400 })
  }

  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const allowedFields = [
      'company_name', 'industry', 'country', 'labels', 'notes', 'website', 
      'employee_count', 'revenue_range', 'lead_grade', 'lead_score', 
      'grading_data', 'research_links_data', 'founded_year', 'headquarters', 
      'linkedin_url', 'funding_stage', 'funding_amount', 'last_funding_date', 
      'is_hiring', 'buyer_intent', 'contact_linkedin', 'contact_connections', 
      'contact_years_position', 'contact_years_company', 'is_archived', 'archived_at',
      'last_prospect_name', 'last_prospect_title', 'last_context', 'last_message_type',
      'extracted_info', 'signal_data', 'icp_score', 'icp_fit', 'icp_breakdown', 'icp_scored_at'
    ]

    // Fields that need JSON stringification
    const jsonFields = ['grading_data', 'research_links_data', 'labels', 'extracted_info', 'signal_data', 'icp_breakdown']

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`)
        if (jsonFields.includes(key) && typeof value !== 'string') {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: true, message: 'No updates' })
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const query = `UPDATE saved_companies SET ${fields.join(', ')} WHERE id = $${paramIndex}`
    await sql.query(query, values)
    
    // Return updated company
    const updated = await sql`SELECT * FROM saved_companies WHERE id = ${id}`
    
    return NextResponse.json({ success: true, company: updated.rows[0] })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}