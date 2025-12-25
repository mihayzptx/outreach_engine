import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // First, get actual columns
    const result = await sql`
      SELECT * FROM messages 
      ORDER BY created_at DESC
      LIMIT 200
    `
    
    console.log('History returned:', result.rows.length, 'messages')
    return NextResponse.json({ messages: result.rows })
  } catch (error: any) {
    console.error('History error:', error)
    return NextResponse.json({ messages: [], error: error.message })
  }
}