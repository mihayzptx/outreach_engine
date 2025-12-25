import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  try {
    const { campaign, prospect, touch, availableVariables } = await request.json()

    const variablesList = availableVariables.map((v: string) => `{${v}}`).join(', ')
    
    const systemPrompt = `You write personalized outreach messages. 

RULES:
1. Use variables from this list where appropriate: ${variablesList}
2. Keep message ${campaign.default_length}: ${campaign.default_length === 'short' ? '2-3 sentences' : campaign.default_length === 'medium' ? '3-4 sentences' : '5-6 sentences'}
3. Tone: ${campaign.default_tone}
4. Channel: ${touch.channel}
5. Goal: ${touch.goal || 'Start conversation'}
${touch.custom_instructions ? `6. Special instructions: ${touch.custom_instructions}` : ''}

OUTPUT FORMAT:
- Write the message with variables in {variable_name} format
- Variables will be replaced with actual data later
- Use {name} for prospect name, {company} for company, etc.
- Only use variables that make sense in context
- Output ONLY the message, no explanations`

    const userPrompt = `Write ${touch.channel} message for:
Prospect: ${prospect.prospect_name || '{name}'}, ${prospect.prospect_title || '{title}'} at ${prospect.company || '{company}'}
Industry: ${prospect.industry || '{industry}'}
Context: ${prospect.context || 'No specific context provided'}

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
    
    // Extract variables used in the message
    const variablesUsed: Record<string, string> = {}
    const varMatches = message.match(/\{([^}]+)\}/g) || []
    varMatches.forEach(match => {
      const varName = match.replace(/[{}]/g, '')
      // Pre-fill with prospect data if available
      if (varName === 'name' && prospect.prospect_name) variablesUsed[varName] = prospect.prospect_name
      else if (varName === 'company' && prospect.company) variablesUsed[varName] = prospect.company
      else if (varName === 'title' && prospect.prospect_title) variablesUsed[varName] = prospect.prospect_title
      else if (varName === 'industry' && prospect.industry) variablesUsed[varName] = prospect.industry
      else variablesUsed[varName] = `{${varName}}`
    })

    // Replace known variables in message
    let finalMessage = message
    Object.entries(variablesUsed).forEach(([key, value]) => {
      if (!value.startsWith('{')) {
        finalMessage = finalMessage.replace(new RegExp(`\\{${key}\\}`, 'gi'), value)
      }
    })

    return NextResponse.json({ 
      message: finalMessage, 
      variables: variablesUsed 
    })
  } catch (error: any) {
    console.error('Campaign generate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}