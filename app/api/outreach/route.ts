import Groq from 'groq-sdk'
import { Ollama } from 'ollama'
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const ollama = new Ollama({ host: 'http://localhost:11434' })

export async function POST(request: Request) {
  const { prospectName, prospectTitle, company, industry, context, messageType, useLocal } = await request.json()

  const systemPrompt = `You write outreach for Tech-stack.io, a 200+ person DevOps services company.

STYLE RULES:
- Keep messages 2-3 sentences maximum
- Use casual, conversational tone
- Problem-focused, not solution-focused
- Reference specific business context
- No generic pitches about services
- Position as peer, not vendor

APPROACH:
- Lead with genuine interest in their work
- Reference specific timing (funding, expansion, acquisition)
- Ask about their technical challenges
- Never mention Tech-stack.io capabilities upfront

OUTPUT:
Write only the message body. No subject line. No sign-off.`

  const userPrompt = `Prospect: ${prospectName}, ${prospectTitle} at ${company}
Industry: ${industry}
Context: ${context}
Message Type: ${messageType}

Write the message:`

  let generatedMessage

  if (useLocal) {
    // Use local Ollama
    const response = await ollama.chat({
      model: 'llama3.1:8b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    })
    generatedMessage = response.message.content
  } else {
    // Use Groq cloud
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    })
    generatedMessage = completion.choices[0].message.content
  }

  // Save to database
  await sql`
    INSERT INTO messages (prospect_name, prospect_title, company, industry, context, message_type, generated_message)
    VALUES (${prospectName}, ${prospectTitle}, ${company}, ${industry}, ${context}, ${messageType}, ${generatedMessage})
  `

  return NextResponse.json({ message: generatedMessage })
}