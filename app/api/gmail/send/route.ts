import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getValidAccessToken(userId: number): Promise<string | null> {
  const result = await sql`
    SELECT access_token, refresh_token, expires_at FROM gmail_accounts WHERE user_id = ${userId}
  `
  
  if (result.rows.length === 0) return null
  
  const account = result.rows[0]
  const isExpired = new Date(account.expires_at) < new Date()
  
  if (!isExpired) {
    return account.access_token
  }
  
  // Refresh token
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token'
      })
    })
    
    const tokens = await response.json()
    
    if (tokens.error) {
      console.error('Token refresh error:', tokens)
      return null
    }
    
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    await sql`
      UPDATE gmail_accounts 
      SET access_token = ${tokens.access_token}, expires_at = ${expiresAt.toISOString()}
      WHERE user_id = ${userId}
    `
    
    return tokens.access_token
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

function createEmail(to: string, subject: string, body: string): string {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ]
  
  const email = emailLines.join('\r\n')
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function POST(request: Request) {
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

    const { action, to, subject, body, scheduledAt } = await request.json()
    
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
    }

    const accessToken = await getValidAccessToken(userId)
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Gmail not connected or token expired' }, { status: 401 })
    }

    const raw = createEmail(to, subject, body)

    if (action === 'send') {
      // Send immediately
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      })

      const result = await response.json()
      
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
      }

      // Log to database
      await sql`
        INSERT INTO email_log (user_id, recipient, subject, body, status, sent_at)
        VALUES (${userId}, ${to}, ${subject}, ${body}, 'sent', NOW())
      `

      return NextResponse.json({ success: true, messageId: result.id, action: 'sent' })
    } 
    
    else if (action === 'draft') {
      // Save as draft
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: { raw } })
      })

      const result = await response.json()
      
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
      }

      // Log to database
      await sql`
        INSERT INTO email_log (user_id, recipient, subject, body, status, gmail_draft_id)
        VALUES (${userId}, ${to}, ${subject}, ${body}, 'draft', ${result.id})
      `

      return NextResponse.json({ success: true, draftId: result.id, action: 'draft' })
    }
    
    else if (action === 'schedule') {
      // Save to scheduled_emails table for later sending
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt is required for scheduling' }, { status: 400 })
      }

      await sql`
        INSERT INTO scheduled_emails (user_id, recipient, subject, body, scheduled_at, status)
        VALUES (${userId}, ${to}, ${subject}, ${body}, ${scheduledAt}, 'pending')
      `

      return NextResponse.json({ success: true, action: 'scheduled', scheduledAt })
    }

    return NextResponse.json({ error: 'Invalid action. Use: send, draft, or schedule' }, { status: 400 })
  } catch (error: any) {
    console.error('Gmail send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}