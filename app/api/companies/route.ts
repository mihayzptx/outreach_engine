import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let result
    
    // Admin/Manager can see all, User sees only own
    if (hasPermission(session.user, 'companies:view_all')) {
      result = await sql`
        SELECT sc.*, u.name as owner_name, u.email as owner_email
        FROM saved_companies sc
        LEFT JOIN users u ON sc.user_id = u.id
        ORDER BY sc.updated_at DESC
      `
    } else {
      result = await sql`
        SELECT * FROM saved_companies 
        WHERE user_id = ${session.user.id} OR user_id IS NULL
        ORDER BY updated_at DESC
      `
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
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    // Check ownership
    const company = await sql`SELECT user_id FROM saved_companies WHERE id = ${id}`
    
    if (company.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    const isOwner = company.rows[0].user_id === session.user.id || company.rows[0].user_id === null
    const canDeleteAll = hasPermission(session.user, 'companies:delete_all')
    
    if (!isOwner && !canDeleteAll) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    await sql`DELETE FROM saved_companies WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
