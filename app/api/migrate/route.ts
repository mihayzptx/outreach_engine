import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  try {
    // Add extracted_info column if missing
    try {
      await sql`ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS extracted_info JSONB DEFAULT NULL`
      results.push('✓ extracted_info column ready')
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors.push(`extracted_info: ${e.message}`)
      } else {
        results.push('✓ extracted_info column exists')
      }
    }

    // Add research_links_data column if missing
    try {
      await sql`ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS research_links_data JSONB DEFAULT NULL`
      results.push('✓ research_links_data column ready')
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors.push(`research_links_data: ${e.message}`)
      } else {
        results.push('✓ research_links_data column exists')
      }
    }

    // Add signal_data column if missing
    try {
      await sql`ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS signal_data JSONB DEFAULT NULL`
      results.push('✓ signal_data column ready')
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors.push(`signal_data: ${e.message}`)
      } else {
        results.push('✓ signal_data column exists')
      }
    }

    // Add other potentially missing columns
    const columnsToAdd = [
      { name: 'employee_count', type: 'VARCHAR(100)' },
      { name: 'founded_year', type: 'INTEGER' },
      { name: 'country', type: 'VARCHAR(255)' },
      { name: 'funding_stage', type: 'VARCHAR(100)' },
      { name: 'funding_amount', type: 'VARCHAR(100)' },
      { name: 'has_new_signals', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'signal_count', type: 'INTEGER DEFAULT 0' },
      { name: 'last_scanned_at', type: 'TIMESTAMP' },
      { name: 'source', type: 'VARCHAR(100)' },
    ]

    for (const col of columnsToAdd) {
      try {
        await sql.query(`ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
        results.push(`✓ ${col.name} column ready`)
      } catch (e: any) {
        if (!e.message.includes('already exists')) {
          errors.push(`${col.name}: ${e.message}`)
        }
      }
    }

    // Verify columns exist
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'saved_companies'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      results,
      errors: errors.length > 0 ? errors : undefined,
      columns: columns.rows.map(r => r.column_name)
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
      errors
    }, { status: 500 })
  }
}