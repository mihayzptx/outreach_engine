import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try to reach Ollama API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return NextResponse.json({ 
        available: false, 
        error: 'Ollama not responding' 
      })
    }
    
    const data = await response.json()
    const models = data.models || []
    
    // Check for specific models
    const hasCustomModel = models.some((m: any) => m.name?.includes('techstack-outreach'))
    const hasBaseModel = models.some((m: any) => m.name?.includes('llama3'))
    
    return NextResponse.json({ 
      available: true,
      models: models.map((m: any) => m.name),
      hasCustomModel,
      hasBaseModel,
      recommendedModel: hasCustomModel ? 'techstack-outreach' : (hasBaseModel ? 'llama3.1:8b' : null)
    })
    
  } catch (error: any) {
    // Connection refused, timeout, or other error
    return NextResponse.json({ 
      available: false, 
      error: error.name === 'AbortError' ? 'Connection timeout' : 'Cannot reach Ollama'
    })
  }
}