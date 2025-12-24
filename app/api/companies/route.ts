import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    let result
    if (session && hasPermission(session.user, 'companies:view_all')) {
      result = await sql`SELECT sc.*, u.name as owner_name FROM saved_companies sc LEFT JOIN users u ON sc.user_id = u.id ORDER BY sc.updated_at DESC`
    } else if (session) {
      result = await sql`SELECT * FROM saved_companies WHERE user_id = ${session.user.id} OR user_id IS NULL ORDER BY updated_at DESC`
    } else {
      result = await sql`SELECT * FROM saved_companies ORDER BY updated_at DESC`
    }
    return NextResponse.json({ companies: result.rows })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ companies: [] })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    if (session && hasPermission(session.user, 'companies:delete_all')) {
      await sql`DELETE FROM saved_companies WHERE id = ${id}`
    } else if (session) {
      await sql`DELETE FROM saved_companies WHERE id = ${id} AND (user_id = ${session.user.id} OR user_id IS NULL)`
    } else {
      await sql`DELETE FROM saved_companies WHERE id = ${id}`
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
