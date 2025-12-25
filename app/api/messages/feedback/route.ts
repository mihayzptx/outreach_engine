import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messageId, rating, note } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: 'rating must be 1 or -1' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE messages
      SET
        quality_rating = ${rating},
        quality_note = ${note ?? null},
        quality_rated_at = NOW()
      WHERE id = ${messageId}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
