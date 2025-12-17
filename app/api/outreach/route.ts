import Groq from 'groq-sdk'
import { Ollama } from 'ollama'
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: Request) {
  const { 
    prospectName, 
    prospectTitle, 
    company, 
    industry, 
    context, 
    messageType, 
    messageHistory,
    messageLength,
    toneOfVoice,
    targetResult,
    sources,
    useLocal 
  } = await request.json()

  const lengthInstructions = {
    short: 'Keep messages 2-3 sentences maximum.',
    medium: 'Keep messages 3-4 sentences.',
    long: 'Keep messages 5-6 sentences with more detail.'
  }

  const toneInstructions = {
    professional: 'Use professional, business-appropriate language.',
    casual: 'Use casual, conversational language.',
    friendly: 'Use warm, friendly language.',
    direct: 'Use direct, no-nonsense language.',
    enthusiastic: 'Use enthusiastic, energetic language.'
  }

  let systemPrompt = `You write outreach for Tech-stack.io, a 200+ person DevOps services company.

STYLE RULES:
- ${lengthInstructions[messageLength as keyof typeof lengthInstructions] || lengthInstructions.medium}
- ${toneInstructions[toneOfVoice as keyof typeof toneInstructions] || toneInstructions.professional}
- Problem-focused, not solution-focused
- Reference specific business context
- No generic pitches about services
- Position as peer, not vendor

APPROACH:
- Lead with genuine interest in their work
- Reference specific timing (funding, expansion, acquisition)
- Ask about their technical challenges
- Never mention Tech-stack.io capabilities upfront
${targetResult ? `- Aim to achieve this result: ${targetResult}` : ''}
${sources ? `- Reference information from these sources when relevant: ${sources}` : ''}

OUTPUT:
Write only the message body. No subject line. No sign-off.`

  let userPrompt = ''

  if (messageType === 'Response' && messageHistory) {
    systemPrompt = `You write responses for Tech-stack.io outreach conversations.

STYLE RULES:
- ${lengthInstructions[messageLength as keyof typeof lengthInstructions] || lengthInstructions.medium}
- ${toneInstructions[toneOfVoice as keyof typeof toneInstructions] || toneInstructions.professional}
- Address points raised in their message
- Continue the conversation naturally
- Be helpful and specific
${targetResult ? `- Aim to achieve this result: ${targetResult}` : ''}

OUTPUT:
Write only the response message body. No subject line. No sign-off.`

    userPrompt = `Prospect: ${prospectName}, ${prospectTitle} at ${company}
Industry: ${industry}
Context: ${context}

CONVERSATION HISTORY:
${messageHistory}

Write a response to continue this conversation:`
  } else {
    userPrompt = `Prospect: ${prospectName}, ${prospectTitle} at ${company}
Industry: ${industry}
Context: ${context}
Message Type: ${messageType}

Write the message:`
  }

  let generatedMessage

  if (useLocal) {
    try {
      const ollama = new Ollama({ host: 'http://localhost:11434' })
      const response = await ollama.chat({
        model: 'llama3.1:8b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      })
      generatedMessage = response.message.content
    } catch (error) {
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
  } else {
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

  await sql`
    INSERT INTO messages (prospect_name, prospect_title, company, industry, context, message_type, generated_message)
    VALUES (${prospectName}, ${prospectTitle}, ${company}, ${industry}, ${context}, ${messageType}, ${generatedMessage})
  `

  return NextResponse.json({ message: generatedMessage })
}