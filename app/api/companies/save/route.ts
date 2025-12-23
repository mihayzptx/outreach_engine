import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  console.log('Save request body:', JSON.stringify(body, null, 2))
  
  const { 
    company_name, 
    industry, 
    prospect_name, 
    prospect_title, 
    context,
    message_type,
    country,
    labels,
    notes,
    website,
    employee_count,
    revenue_range,
    funding_stage,
    funding_amount,
    founded_year,
    headquarters,
    is_hiring,
    buyer_intent,
    grading_data,
    lead_grade,
    lead_score,
    research_links_data
  } = body

  try {
    // First try with all columns
    try {
      await sql`
        INSERT INTO saved_companies (
          company_name, 
          industry, 
          last_prospect_name, 
          last_prospect_title, 
          last_context,
          last_message_type,
          country,
          labels,
          notes,
          website,
          employee_count,
          revenue_range,
          funding_stage,
          funding_amount,
          founded_year,
          headquarters,
          is_hiring,
          buyer_intent,
          grading_data,
          lead_grade,
          lead_score,
          research_links_data
        )
        VALUES (
          ${company_name}, 
          ${industry}, 
          ${prospect_name}, 
          ${prospect_title}, 
          ${context},
          ${message_type},
          ${country || null},
          ${labels || []},
          ${notes || null},
          ${website || null},
          ${employee_count || null},
          ${revenue_range || null},
          ${funding_stage || null},
          ${funding_amount || null},
          ${founded_year || null},
          ${headquarters || null},
          ${is_hiring || false},
          ${buyer_intent || false},
          ${grading_data ? JSON.stringify(grading_data) : '{}'},
          ${lead_grade || null},
          ${lead_score || null},
          ${research_links_data ? JSON.stringify(research_links_data) : '[]'}
        )
        ON CONFLICT (company_name) 
        DO UPDATE SET 
          industry = COALESCE(EXCLUDED.industry, saved_companies.industry),
          last_prospect_name = EXCLUDED.last_prospect_name,
          last_prospect_title = EXCLUDED.last_prospect_title,
          last_context = EXCLUDED.last_context,
          last_message_type = EXCLUDED.last_message_type,
          country = COALESCE(EXCLUDED.country, saved_companies.country),
          website = COALESCE(EXCLUDED.website, saved_companies.website),
          employee_count = COALESCE(EXCLUDED.employee_count, saved_companies.employee_count),
          revenue_range = COALESCE(EXCLUDED.revenue_range, saved_companies.revenue_range),
          funding_stage = COALESCE(EXCLUDED.funding_stage, saved_companies.funding_stage),
          funding_amount = COALESCE(EXCLUDED.funding_amount, saved_companies.funding_amount),
          founded_year = COALESCE(EXCLUDED.founded_year, saved_companies.founded_year),
          headquarters = COALESCE(EXCLUDED.headquarters, saved_companies.headquarters),
          is_hiring = COALESCE(EXCLUDED.is_hiring, saved_companies.is_hiring),
          buyer_intent = COALESCE(EXCLUDED.buyer_intent, saved_companies.buyer_intent),
          grading_data = COALESCE(EXCLUDED.grading_data, saved_companies.grading_data),
          lead_grade = COALESCE(EXCLUDED.lead_grade, saved_companies.lead_grade),
          lead_score = COALESCE(EXCLUDED.lead_score, saved_companies.lead_score),
          research_links_data = COALESCE(EXCLUDED.research_links_data, saved_companies.research_links_data),
          updated_at = NOW()
      `
    } catch (fullError) {
      console.error('Full insert failed, trying basic:', fullError)
      
      // Fallback to basic columns only
      await sql`
        INSERT INTO saved_companies (
          company_name, 
          industry, 
          last_prospect_name, 
          last_prospect_title, 
          last_context,
          last_message_type,
          country,
          labels,
          notes,
          website
        )
        VALUES (
          ${company_name}, 
          ${industry}, 
          ${prospect_name}, 
          ${prospect_title}, 
          ${context},
          ${message_type},
          ${country || null},
          ${labels || []},
          ${notes || null},
          ${website || null}
        )
        ON CONFLICT (company_name) 
        DO UPDATE SET 
          industry = COALESCE(EXCLUDED.industry, saved_companies.industry),
          last_prospect_name = EXCLUDED.last_prospect_name,
          last_prospect_title = EXCLUDED.last_prospect_title,
          last_context = EXCLUDED.last_context,
          last_message_type = EXCLUDED.last_message_type,
          country = COALESCE(EXCLUDED.country, saved_companies.country),
          updated_at = NOW()
      `
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving company:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}