import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Get campaigns with their touches
    const campaigns = await sql`
      SELECT * FROM campaigns ORDER BY created_at DESC
    `
    
    const campaignsWithTouches = await Promise.all(
      campaigns.rows.map(async (campaign) => {
        const touches = await sql`
          SELECT * FROM campaign_touches 
          WHERE campaign_id = ${campaign.id} 
          ORDER BY step_number ASC
        `
        return { ...campaign, touches: touches.rows }
      })
    )
    
    return NextResponse.json({ campaigns: campaignsWithTouches })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ campaigns: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, description, default_tone, default_length, touches } = data

    // Create campaign
    const result = await sql`
      INSERT INTO campaigns (name, description, default_tone, default_length)
      VALUES (${name}, ${description}, ${default_tone || 'professional'}, ${default_length || 'medium'})
      RETURNING *
    `
    const campaign = result.rows[0]

    // Create touches
    if (touches && touches.length > 0) {
      for (const touch of touches) {
        await sql`
          INSERT INTO campaign_touches (campaign_id, step_number, channel, day_number, context_template, goal, custom_instructions)
          VALUES (${campaign.id}, ${touch.step_number}, ${touch.channel}, ${touch.day_number}, ${touch.context_template}, ${touch.goal}, ${touch.custom_instructions})
        `
      }
    }

    // Return campaign with touches
    const touchesResult = await sql`
      SELECT * FROM campaign_touches WHERE campaign_id = ${campaign.id} ORDER BY step_number
    `
    
    return NextResponse.json({ campaign: { ...campaign, touches: touchesResult.rows } })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, name, description, default_tone, default_length, touches } = data

    // Update campaign
    await sql`
      UPDATE campaigns 
      SET name = ${name}, description = ${description}, default_tone = ${default_tone}, default_length = ${default_length}
      WHERE id = ${id}
    `

    // Delete old touches and insert new ones
    await sql`DELETE FROM campaign_touches WHERE campaign_id = ${id}`
    
    if (touches && touches.length > 0) {
      for (const touch of touches) {
        await sql`
          INSERT INTO campaign_touches (campaign_id, step_number, channel, day_number, context_template, goal, custom_instructions)
          VALUES (${id}, ${touch.step_number}, ${touch.channel}, ${touch.day_number}, ${touch.context_template}, ${touch.goal}, ${touch.custom_instructions})
        `
      }
    }

    // Return updated campaign
    const campaign = await sql`SELECT * FROM campaigns WHERE id = ${id}`
    const touchesResult = await sql`SELECT * FROM campaign_touches WHERE campaign_id = ${id} ORDER BY step_number`
    
    return NextResponse.json({ campaign: { ...campaign.rows[0], touches: touchesResult.rows } })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await sql`DELETE FROM campaign_touches WHERE campaign_id = ${id}`
    await sql`DELETE FROM campaigns WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}