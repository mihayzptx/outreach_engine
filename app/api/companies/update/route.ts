import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { 
    id,
    country,
    labels,
    notes,
    website,
    employee_count,
    revenue_range
  } = await request.json()

  if (!id) {
    return NextResponse.json({ success: false, error: 'Company ID required' }, { status: 400 })
  }

  try {
    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`)
      values.push(country)
    }
    if (labels !== undefined) {
      updates.push(`labels = $${paramIndex++}`)
      values.push(labels)
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(notes)
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex++}`)
      values.push(website)
    }
    if (employee_count !== undefined) {
      updates.push(`employee_count = $${paramIndex++}`)
      values.push(employee_count)
    }
    if (revenue_range !== undefined) {
      updates.push(`revenue_range = $${paramIndex++}`)
      values.push(revenue_range)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'No updates provided' })
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)
    
    // Add id as last parameter
    values.push(id)

    const query = `UPDATE saved_companies SET ${updates.join(', ')} WHERE id = $${paramIndex}`
    
    await sql.query(query, values)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ success: false, error: 'Failed to update company' }, { status: 500 })
  }
}
