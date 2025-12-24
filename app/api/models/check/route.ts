import { NextResponse } from 'next/server'
import { Ollama } from 'ollama'

export async function POST(request: Request) {
  try {
    const { model, endpoint } = await request.json()
    const host = endpoint || 'http://localhost:11434'
    
    const ollama = new Ollama({ host })
    const list = await ollama.list()
    
    const available = list.models.some((m: any) => 
      m.name === model || m.name.startsWith(model + ':')
    )
    
    return NextResponse.json({ 
      available, 
      models: list.models.map((m: any) => m.name),
      endpoint: host
    })
  } catch (error: any) {
    return NextResponse.json({ 
      available: false, 
      error: error.message,
      hint: 'Make sure Ollama is running: ollama serve'
    })
  }
}