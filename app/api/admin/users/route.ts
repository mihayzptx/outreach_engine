import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, hasPermission, createUser } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !hasPermission(session.user, 'users:view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const result = await sql`SELECT id, email, name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC`
  return NextResponse.json({ users: result.rows })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !hasPermission(session.user, 'users:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { email, password, name, role } = await request.json()
  if (!email || !password || !name) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  try {
    const user = await createUser(email, password, name, role || 'user')
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    if (error.message?.includes('duplicate')) return NextResponse.json({ error: 'Email exists' }, { status: 400 })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !hasPermission(session.user, 'users:edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId, role, is_active } = await request.json()
  if (!userId || userId === session.user.id) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  if (role !== undefined) await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`
  if (is_active !== undefined) await sql`UPDATE users SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${userId}`
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session || !hasPermission(session.user, 'users:delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId } = await request.json()
  if (userId === session.user.id) return NextResponse.json({ error: 'Cannot delete self' }, { status: 400 })
  await sql`DELETE FROM users WHERE id = ${userId}`
  return NextResponse.json({ success: true })
}
