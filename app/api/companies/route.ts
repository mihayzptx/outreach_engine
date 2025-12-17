import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM saved_companies 
      ORDER BY has_new_signals DESC, updated_at DESC
    `
    
    return NextResponse.json({ companies: result.rows })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ companies: [] })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    await sql`DELETE FROM saved_companies WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}