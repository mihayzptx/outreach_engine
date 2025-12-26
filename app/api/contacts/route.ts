import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

// GET - Fetch contacts (all or by company_id)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const search = searchParams.get('search')

    let contacts

    if (companyId) {
      contacts = await sql`
        SELECT c.*, sc.company_name
        FROM contacts c
        LEFT JOIN saved_companies sc ON c.company_id = sc.id
        WHERE c.company_id = ${parseInt(companyId)}
        ORDER BY c.is_primary DESC, c.created_at DESC
      `
    } else if (search) {
      contacts = await sql`
        SELECT c.*, sc.company_name
        FROM contacts c
        LEFT JOIN saved_companies sc ON c.company_id = sc.id
        WHERE c.name ILIKE ${'%' + search + '%'}
           OR c.title ILIKE ${'%' + search + '%'}
           OR c.email ILIKE ${'%' + search + '%'}
           OR sc.company_name ILIKE ${'%' + search + '%'}
        ORDER BY c.created_at DESC
        LIMIT 50
      `
    } else {
      contacts = await sql`
        SELECT c.*, sc.company_name
        FROM contacts c
        LEFT JOIN saved_companies sc ON c.company_id = sc.id
        ORDER BY c.created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({
      success: true,
      contacts: contacts.rows
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new contact
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      company_id,
      name,
      title,
      email,
      phone,
      linkedin_url,
      is_primary,
      seniority,
      department,
      notes,
      source
    } = body

    if (!company_id || !name) {
      return NextResponse.json({ error: 'company_id and name are required' }, { status: 400 })
    }

    // If setting as primary, unset other primaries for this company
    if (is_primary) {
      await sql`UPDATE contacts SET is_primary = false WHERE company_id = ${company_id}`
    }

    const result = await sql`
      INSERT INTO contacts (
        company_id, name, title, email, phone, linkedin_url,
        is_primary, seniority, department, notes, source
      )
      VALUES (
        ${company_id}, ${name}, ${title || null}, ${email || null}, ${phone || null}, ${linkedin_url || null},
        ${is_primary || false}, ${seniority || null}, ${department || null}, ${notes || null}, ${source || 'manual'}
      )
      RETURNING *
    `

    // Also update the company's last_prospect fields if primary
    if (is_primary) {
      await sql`
        UPDATE saved_companies 
        SET last_prospect_name = ${name}, last_prospect_title = ${title || null}
        WHERE id = ${company_id}
      `
    }

    return NextResponse.json({
      success: true,
      contact: result.rows[0]
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update contact
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      company_id,
      name,
      title,
      email,
      phone,
      linkedin_url,
      is_primary,
      seniority,
      department,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // If setting as primary, unset other primaries for this company
    if (is_primary && company_id) {
      await sql`UPDATE contacts SET is_primary = false WHERE company_id = ${company_id} AND id != ${id}`
    }

    const result = await sql`
      UPDATE contacts SET
        name = COALESCE(${name}, name),
        title = COALESCE(${title}, title),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        linkedin_url = COALESCE(${linkedin_url}, linkedin_url),
        is_primary = COALESCE(${is_primary}, is_primary),
        seniority = COALESCE(${seniority}, seniority),
        department = COALESCE(${department}, department),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // Update company's last_prospect fields if primary
    if (is_primary && company_id) {
      await sql`
        UPDATE saved_companies 
        SET last_prospect_name = ${name}, last_prospect_title = ${title || null}
        WHERE id = ${company_id}
      `
    }

    return NextResponse.json({
      success: true,
      contact: result.rows[0]
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove contact
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await sql`DELETE FROM contacts WHERE id = ${parseInt(id)}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}