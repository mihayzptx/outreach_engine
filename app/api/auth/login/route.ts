import { NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, createToken, updateLastLogin } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const user = await getUserByEmail(email)
    if (!user || !user.is_active) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role, is_active: user.is_active })
    await updateLastLogin(user.id)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
