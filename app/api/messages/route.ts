import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM messages 
      ORDER BY created_at DESC 
      LIMIT 100
    `
    
    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ messages: [] })
  }
}