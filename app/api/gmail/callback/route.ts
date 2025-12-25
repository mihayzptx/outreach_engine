import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect('/settings?gmail=error&reason=' + error)
  }

  if (!code) {
    return NextResponse.redirect('/settings?gmail=error&reason=no_code')
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('Token error:', tokens)
      return NextResponse.redirect('/settings?gmail=error&reason=token_error')
    }

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const userInfo = await userInfoResponse.json()

    // Get current user from auth token
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value
    let userId = null

    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET) as any
        userId = decoded.userId
      } catch (e) {
        console.log('Token decode failed')
      }
    }

    // Store tokens in database
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    await sql`
      INSERT INTO gmail_accounts (user_id, email, access_token, refresh_token, expires_at)
      VALUES (${userId}, ${userInfo.email}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt.toISOString()})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        email = ${userInfo.email},
        access_token = ${tokens.access_token},
        refresh_token = COALESCE(${tokens.refresh_token}, gmail_accounts.refresh_token),
        expires_at = ${expiresAt.toISOString()},
        updated_at = NOW()
    `

    return NextResponse.redirect('/settings?gmail=connected')
  } catch (error: any) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect('/settings?gmail=error&reason=' + encodeURIComponent(error.message))
  }
}