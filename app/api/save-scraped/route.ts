import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { company_name, industry, employee_count, country, description, founded } = await request.json()

    if (!company_name) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    // Parse founded year
    let foundedYear: number | null = null
    if (founded) {
      const yearMatch = founded.match(/\d{4}/)
      if (yearMatch) {
        foundedYear = parseInt(yearMatch[0], 10)
      }
    }

    // Prepare extracted_info JSON
    const extractedInfo = {
      description: description || '',
      employeeCount: employee_count || '',
      headquarters: country || '',
      founded: founded || '',
      industry: industry || '',
      scrapedAt: new Date().toISOString(),
      source: 'linkedin_scrape'
    }

    // Try to find existing company
    const existingResult = await sql`
      SELECT id FROM saved_companies 
      WHERE LOWER(company_name) = LOWER(${company_name})
      LIMIT 1
    `

    let companyId: number

    if (existingResult.rows.length > 0) {
      // Update existing company
      companyId = existingResult.rows[0].id
      
      await sql`
        UPDATE saved_companies 
        SET 
          industry = COALESCE(NULLIF(${industry}, ''), industry),
          employee_count = COALESCE(NULLIF(${employee_count}, ''), employee_count),
          country = COALESCE(NULLIF(${country}, ''), country),
          founded_year = COALESCE(${foundedYear}, founded_year),
          extracted_info = COALESCE(${JSON.stringify(extractedInfo)}::jsonb, extracted_info),
          updated_at = NOW()
        WHERE id = ${companyId}
      `
    } else {
      // Create new company
      const insertResult = await sql`
        INSERT INTO saved_companies (
          company_name, 
          industry, 
          employee_count, 
          country, 
          founded_year,
          extracted_info,
          source, 
          created_at, 
          updated_at
        )
        VALUES (
          ${company_name}, 
          ${industry || ''}, 
          ${employee_count || ''}, 
          ${country || ''}, 
          ${foundedYear},
          ${JSON.stringify(extractedInfo)}::jsonb,
          'chrome_extension', 
          NOW(), 
          NOW()
        )
        RETURNING id
      `
      companyId = insertResult.rows[0].id
    }

    return NextResponse.json({ 
      success: true, 
      company_id: companyId,
      message: existingResult.rows.length > 0 ? 'Company updated' : 'Company created'
    })

  } catch (error: any) {
    console.error('Save scraped company error:', error)
    return NextResponse.json({ 
      error: 'Failed to save company',
      details: error.message 
    }, { status: 500 })
  }
}