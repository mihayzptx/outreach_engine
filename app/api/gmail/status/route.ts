import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json({ connected: false })
    }

    let userId = null
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as any
      userId = decoded.userId
    } catch (e) {
      return NextResponse.json({ connected: false })
    }

    const result = await sql`
      SELECT email, expires_at FROM gmail_accounts WHERE user_id = ${userId}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ connected: false })
    }

    const account = result.rows[0]
    const isExpired = new Date(account.expires_at) < new Date()

    return NextResponse.json({ 
      connected: true, 
      email: account.email,
      needsRefresh: isExpired
    })
  } catch (error: any) {
    console.error('Gmail status error:', error)
    return NextResponse.json({ connected: false, error: error.message })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userId = null
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as any
      userId = decoded.userId
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await sql`DELETE FROM gmail_accounts WHERE user_id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}