import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  const data = await request.json()
  
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  // Combine all text fields that need translation
  const textsToTranslate: { [key: string]: string } = {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      textsToTranslate[key] = value as string
    }
  }

  if (Object.keys(textsToTranslate).length === 0) {
    return NextResponse.json({ translated: data })
  }

  try {
    const prompt = `Translate the following JSON values to English. Keep the JSON structure exactly the same, only translate the values. If a value is already in English, keep it unchanged. Return ONLY valid JSON, no explanations.

Input:
${JSON.stringify(textsToTranslate, null, 2)}

Output (translated to English):`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'You are a translator. Translate text to English. Return only valid JSON with translated values.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    const result = await response.json()
    
    if (result.error) {
      console.error('Groq translation error:', result.error)
      return NextResponse.json({ translated: data })
    }

    const content = result.choices?.[0]?.message?.content?.trim() || ''
    
    // Try to parse the JSON response
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const translated = JSON.parse(cleanContent)
      return NextResponse.json({ translated })
    } catch (parseError) {
      console.error('Failed to parse translation response:', content)
      return NextResponse.json({ translated: data })
    }

  } catch (error: any) {
    console.error('Translation API error:', error)
    return NextResponse.json({ translated: data })
  }
}
