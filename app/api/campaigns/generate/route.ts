import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  try {
    const { campaign, prospect, touch, availableVariables } = await request.json()

    const variablesList = availableVariables.map((v: string) => `{${v}}`).join(', ')
    
    // Build signals context
    let signalsContext = ''
    if (prospect.signals && prospect.signals.length > 0) {
      const signalLines = prospect.signals.map((s: any) => {
        const priority = s.priority === 'high' ? '🔥 HIGH PRIORITY' : s.priority === 'medium' ? '⚡ MEDIUM' : '📌 LOW'
        return `- [${priority}] ${s.category.toUpperCase()}: ${s.detail}`
      })
      signalsContext = `

DETECTED SIGNALS FOR THIS COMPANY (use these for personalization):
${signalLines.join('\n')}

IMPORTANT: Reference at least one signal in your message to make it highly personalized.`
    }
    
    const systemPrompt = `You write highly personalized outreach messages for B2B sales.

RULES:
1. Use variables from this list where appropriate: ${variablesList}
2. Keep message ${campaign.default_length}: ${campaign.default_length === 'short' ? '2-3 sentences max' : campaign.default_length === 'medium' ? '3-4 sentences' : '5-6 sentences'}
3. Tone: ${campaign.default_tone}
4. Channel: ${touch.channel}
5. Goal: ${touch.goal || 'Start conversation'}
6. CRITICAL: Reference specific details about the company/prospect - never be generic
${touch.custom_instructions ? `7. Special instructions: ${touch.custom_instructions}` : ''}
${signalsContext}

QUALITY REQUIREMENTS:
- Open with a specific observation about THEM (not about you)
- Reference recent news, funding, hiring, or achievements when available
- Never start with "I hope this finds you well" or similar generic openers
- Never mention your company name unless absolutely necessary
- End with a soft question, not a hard pitch

OUTPUT: Message only, no explanations, no subject line, no signature.`

    const userPrompt = `Write ${touch.channel} message for:
Name: ${prospect.prospect_name || '{name}'}
Title: ${prospect.prospect_title || '{title}'}
Company: ${prospect.company || '{company}'}
Industry: ${prospect.industry || '{industry}'}
Context: ${prospect.context || 'No specific context'}

This is Touch ${touch.step_number} (Day ${touch.day_number}) of the sequence.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500
    })

    const message = completion.choices[0].message.content || ''
    
    // Extract variables used
    const variablesUsed: Record<string, string> = {}
    const varMatches = message.match(/\{([^}]+)\}/g) || []
    varMatches.forEach(match => {
      const varName = match.replace(/[{}]/g, '')
      if (varName === 'name' && prospect.prospect_name) variablesUsed[varName] = prospect.prospect_name
      else if (varName === 'company' && prospect.company) variablesUsed[varName] = prospect.company
      else if (varName === 'title' && prospect.prospect_title) variablesUsed[varName] = prospect.prospect_title
      else if (varName === 'industry' && prospect.industry) variablesUsed[varName] = prospect.industry
      else variablesUsed[varName] = `{${varName}}`
    })

    // Replace known variables
    let finalMessage = message
    Object.entries(variablesUsed).forEach(([key, value]) => {
      if (!value.startsWith('{')) {
        finalMessage = finalMessage.replace(new RegExp(`\\{${key}\\}`, 'gi'), value)
      }
    })

    return NextResponse.json({ message: finalMessage, variables: variablesUsed })
  } catch (error: any) {
    console.error('Campaign generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}