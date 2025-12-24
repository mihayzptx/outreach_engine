import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    let result
    if (session && hasPermission(session.user, 'messages:view_all')) {
      result = await sql`SELECT mh.*, u.name as user_name FROM message_history mh LEFT JOIN users u ON mh.user_id = u.id ORDER BY mh.created_at DESC LIMIT 100`
    } else if (session) {
      result = await sql`SELECT * FROM message_history WHERE user_id = ${session.user.id} OR user_id IS NULL ORDER BY created_at DESC LIMIT 100`
    } else {
      result = await sql`SELECT * FROM message_history ORDER BY created_at DESC LIMIT 100`
    }
    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ messages: [] })
  }
}
