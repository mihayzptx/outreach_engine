import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  try {
    // =============================================
    // 1. CONTACTS TABLE - Track multiple contacts per company
    // =============================================
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES saved_companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          title VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(100),
          linkedin_url VARCHAR(500),
          is_primary BOOLEAN DEFAULT FALSE,
          seniority VARCHAR(50),
          department VARCHAR(100),
          notes TEXT,
          source VARCHAR(100),
          last_contacted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      results.push('✓ contacts table created')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push('✓ contacts table exists')
      } else {
        errors.push(`contacts table: ${e.message}`)
      }
    }

    // Index for faster lookups
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id)`
      results.push('✓ contacts index created')
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors.push(`contacts index: ${e.message}`)
      }
    }

    // =============================================
    // 2. SETTINGS TABLE - Persistent settings across devices
    // =============================================
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) DEFAULT 'default',
          settings_key VARCHAR(100) NOT NULL,
          settings_value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, settings_key)
        )
      `
      results.push('✓ user_settings table created')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push('✓ user_settings table exists')
      } else {
        errors.push(`user_settings table: ${e.message}`)
      }
    }

    // =============================================
    // 3. ADD ICP SCORE COLUMN to saved_companies
    // =============================================
    const newColumns = [
      { name: 'icp_score', type: 'INTEGER' },
      { name: 'icp_fit', type: 'VARCHAR(20)' },
      { name: 'icp_breakdown', type: 'JSONB' },
      { name: 'icp_scored_at', type: 'TIMESTAMP' },
    ]

    for (const col of newColumns) {
      try {
        await sql.query(`ALTER TABLE saved_companies ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
        results.push(`✓ ${col.name} column added`)
      } catch (e: any) {
        if (!e.message.includes('already exists')) {
          errors.push(`${col.name}: ${e.message}`)
        } else {
          results.push(`✓ ${col.name} column exists`)
        }
      }
    }

    // =============================================
    // 4. MIGRATE EXISTING CONTACTS from extracted_info
    // =============================================
    try {
      // Get companies with keyPeople in extracted_info
      const companies = await sql`
        SELECT id, last_prospect_name, last_prospect_title, extracted_info
        FROM saved_companies
        WHERE last_prospect_name IS NOT NULL AND last_prospect_name != ''
      `

      let migratedCount = 0
      for (const company of companies.rows) {
        // Check if contact already exists
        const existing = await sql`
          SELECT id FROM contacts 
          WHERE company_id = ${company.id} AND name = ${company.last_prospect_name}
        `

        if (existing.rows.length === 0) {
          await sql`
            INSERT INTO contacts (company_id, name, title, is_primary, source)
            VALUES (${company.id}, ${company.last_prospect_name}, ${company.last_prospect_title}, true, 'migrated')
          `
          migratedCount++
        }

        // Also migrate keyPeople from extracted_info
        const keyPeople = company.extracted_info?.keyPeople || []
        for (const person of keyPeople) {
          if (!person.name) continue
          
          const existingPerson = await sql`
            SELECT id FROM contacts 
            WHERE company_id = ${company.id} AND name = ${person.name}
          `

          if (existingPerson.rows.length === 0) {
            await sql`
              INSERT INTO contacts (company_id, name, title, linkedin_url, source)
              VALUES (${company.id}, ${person.name}, ${person.title}, ${person.linkedin || null}, 'research')
            `
            migratedCount++
          }
        }
      }

      results.push(`✓ Migrated ${migratedCount} contacts from existing data`)
    } catch (e: any) {
      errors.push(`Contact migration: ${e.message}`)
    }

    // =============================================
    // 5. CREATE INDEX for ICP score sorting
    // =============================================
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON saved_companies(icp_score DESC NULLS LAST)`
      results.push('✓ ICP score index created')
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        errors.push(`ICP index: ${e.message}`)
      }
    }

    // =============================================
    // 6. API USAGE TRACKING TABLES
    // =============================================
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS api_usage (
          id SERIAL PRIMARY KEY,
          api VARCHAR(50) NOT NULL,
          period_key VARCHAR(20) NOT NULL,
          requests INTEGER DEFAULT 0,
          tokens INTEGER DEFAULT 0,
          errors INTEGER DEFAULT 0,
          total_cost DECIMAL(10,4) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(api, period_key)
        )
      `
      results.push('✓ api_usage table created')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push('✓ api_usage table exists')
      } else {
        errors.push(`api_usage table: ${e.message}`)
      }
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS api_usage_log (
          id SERIAL PRIMARY KEY,
          api VARCHAR(50) NOT NULL,
          endpoint VARCHAR(255),
          tokens INTEGER,
          cost DECIMAL(10,6),
          success BOOLEAN,
          error TEXT,
          duration_ms INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
      results.push('✓ api_usage_log table created')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push('✓ api_usage_log table exists')
      } else {
        errors.push(`api_usage_log table: ${e.message}`)
      }
    }

    // Verify all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    const companyCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'saved_companies'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      message: 'Migration v2 complete',
      results,
      errors: errors.length > 0 ? errors : undefined,
      tables: tables.rows.map(r => r.table_name),
      companyColumns: companyCols.rows.map(r => r.column_name)
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