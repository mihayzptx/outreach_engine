import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { 
    company_name, 
    industry, 
    prospect_name, 
    prospect_title, 
    context,
    message_type 
  } = await request.json()

  try {
    await sql`
      INSERT INTO saved_companies (
        company_name, 
        industry, 
        last_prospect_name, 
        last_prospect_title, 
        last_context,
        last_message_type
      )
      VALUES (
        ${company_name}, 
        ${industry}, 
        ${prospect_name}, 
        ${prospect_title}, 
        ${context},
        ${message_type}
      )
      ON CONFLICT (company_name) 
      DO UPDATE SET 
        industry = ${industry},
        last_prospect_name = ${prospect_name},
        last_prospect_title = ${prospect_title},
        last_context = ${context},
        last_message_type = ${message_type},
        updated_at = NOW()
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving company:', error)
    return NextResponse.json({ success: false, error: 'Failed to save company' }, { status: 500 })
  }
}