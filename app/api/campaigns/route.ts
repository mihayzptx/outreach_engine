import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM campaigns ORDER BY created_at DESC
    `
    return NextResponse.json({ campaigns: result.rows })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ campaigns: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, description, message_type, tone, length, context_template, target_goal, custom_instructions, user_id } = data

    const result = await sql`
      INSERT INTO campaigns (name, description, message_type, tone, length, context_template, target_goal, custom_instructions, user_id)
      VALUES (${name}, ${description}, ${message_type}, ${tone}, ${length}, ${context_template}, ${target_goal}, ${custom_instructions}, ${user_id || null})
      RETURNING *
    `
    return NextResponse.json({ campaign: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, name, description, message_type, tone, length, context_template, target_goal, custom_instructions } = data

    const result = await sql`
      UPDATE campaigns 
      SET name = ${name}, description = ${description}, message_type = ${message_type}, 
          tone = ${tone}, length = ${length}, context_template = ${context_template},
          target_goal = ${target_goal}, custom_instructions = ${custom_instructions}
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json({ campaign: result.rows[0] })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    await sql`DELETE FROM campaigns WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}