import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY

// Generic phrases to detect
const GENERIC_PHRASES = [
  'i hope this message finds you well',
  'i came across your profile',
  'i noticed your company',
  'i wanted to reach out',
  'i thought i would connect',
  'i would love to connect',
  'synergy', 'leverage', 'circle back',
  'touch base', 'pick your brain',
  'game changer', 'revolutionary',
  'industry leader', 'best in class',
  'unique opportunity', 'exciting opportunity',
  'not sure if you',
  'hope you are doing well',
  'hope all is well',
  'just wanted to',
  'just reaching out',
  'quick question',
  'thought you might be interested'
]

// Spam trigger words
const SPAM_TRIGGERS = [
  'guaranteed', 'free', 'act now', 'limited time',
  'click here', 'buy now', 'order now',
  'congratulations', 'winner', 'selected',
  'urgent', 'immediately', '100%'
]

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  const words = text.split(/\s+/).filter(w => w)
  if (sentences.length === 0 || words.length === 0) return 0
  const avgWordsPerSentence = words.length / sentences.length
  if (avgWordsPerSentence <= 15) return 100
  if (avgWordsPerSentence <= 20) return 80
  if (avgWordsPerSentence <= 25) return 60
  return 40
}

function checkGenericPhrases(text: string): { score: number, found: string[] } {
  const lower = text.toLowerCase()
  const found = GENERIC_PHRASES.filter(phrase => lower.includes(phrase))
  const score = Math.max(0, 100 - (found.length * 20))
  return { score, found }
}

function checkSpamTriggers(text: string): { score: number, found: string[] } {
  const lower = text.toLowerCase()
  const found = SPAM_TRIGGERS.filter(trigger => lower.includes(trigger))
  const score = Math.max(0, 100 - (found.length * 25))
  return { score, found }
}

function checkLength(text: string, messageType: string): { score: number, feedback: string, ideal: string } {
  const charCount = text.length
  const idealRanges: Record<string, [number, number]> = {
    'LinkedIn Connection': [200, 300],
    'LinkedIn Message': [300, 500],
    'Cold Email': [400, 800],
    'Follow-up Email': [200, 400],
    'ABM': [150, 250]
  }
  const range = idealRanges[messageType] || [200, 500]
  if (charCount >= range[0] && charCount <= range[1]) {
    return { score: 100, feedback: 'Perfect length', ideal: `${range[0]}-${range[1]}` }
  } else if (charCount < range[0]) {
    return { score: Math.max(50, 100 - (range[0] - charCount) / 2), feedback: `Too short`, ideal: `${range[0]}-${range[1]}` }
  } else {
    return { score: Math.max(50, 100 - (charCount - range[1]) / 3), feedback: `Too long`, ideal: `${range[0]}-${range[1]}` }
  }
}

function checkOpeningLine(text: string): { score: number, feedback: string } {
  const firstLine = text.split('\n')[0].toLowerCase()
  if (firstLine.startsWith('i hope') || firstLine.startsWith('i wanted') || firstLine.startsWith('i am')) {
    return { score: 30, feedback: 'Starts with "I"' }
  }
  if (firstLine.includes('hope this') || firstLine.includes('hope you')) {
    return { score: 40, feedback: 'Cliché opening' }
  }
  if (firstLine.includes('congrat') || firstLine.includes('saw your') || firstLine.includes('noticed')) {
    return { score: 90, feedback: 'Personalized opener' }
  }
  return { score: 70, feedback: 'OK' }
}

function checkCallToAction(text: string): { score: number, feedback: string } {
  const lastParagraph = text.split('\n').filter(p => p.trim()).pop()?.toLowerCase() || ''
  if (lastParagraph.includes('?') && (lastParagraph.includes('would') || lastParagraph.includes('could') || lastParagraph.includes('open to'))) {
    return { score: 100, feedback: 'Soft CTA' }
  }
  if (text.toLowerCase().includes('let me know') || text.toLowerCase().includes('feel free')) {
    return { score: 60, feedback: 'Weak CTA' }
  }
  if (!lastParagraph.includes('?')) {
    return { score: 40, feedback: 'No question' }
  }
  return { score: 70, feedback: 'Has CTA' }
}

export async function POST(request: Request) {
  const { message, messageType, prospectName, company } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'No message provided' }, { status: 400 })
  }

  const criteria: any[] = []
  const suggestions: string[] = []
  const warnings: string[] = []

  // 1. Personalization (20%)
  const hasName = prospectName && message.toLowerCase().includes(prospectName.toLowerCase().split(' ')[0])
  const hasCompany = company && message.toLowerCase().includes(company.toLowerCase())
  const personalizationScore = (hasName ? 50 : 0) + (hasCompany ? 50 : 0)
  criteria.push({ name: 'Personalization', score: personalizationScore, weight: 20, feedback: hasName && hasCompany ? '✓ Name + Company' : hasName ? '⚠ Missing company' : hasCompany ? '⚠ Missing name' : '✗ None' })
  if (!hasName) suggestions.push('Add prospect first name')
  if (!hasCompany) suggestions.push('Reference their company')

  // 2. Generic phrases (15%)
  const genericCheck = checkGenericPhrases(message)
  criteria.push({ name: 'Originality', score: genericCheck.score, weight: 15, feedback: genericCheck.found.length === 0 ? '✓ Original' : `✗ ${genericCheck.found.length} clichés`, issues: genericCheck.found })
  if (genericCheck.found.length > 0) warnings.push(`Generic: "${genericCheck.found[0]}"`)

  // 3. Readability (15%)
  const readabilityScore = calculateReadability(message)
  criteria.push({ name: 'Readability', score: readabilityScore, weight: 15, feedback: readabilityScore >= 80 ? '✓ Easy to read' : readabilityScore >= 60 ? '⚠ OK' : '✗ Complex' })
  if (readabilityScore < 60) suggestions.push('Use shorter sentences')

  // 4. Length (10%)
  const lengthCheck = checkLength(message, messageType)
  criteria.push({ name: 'Length', score: lengthCheck.score, weight: 10, feedback: `${message.length} chars (ideal: ${lengthCheck.ideal})` })
  if (lengthCheck.score < 80) suggestions.push(lengthCheck.feedback === 'Too short' ? 'Add more detail' : 'Make it shorter')

  // 5. Opening (10%)
  const openingCheck = checkOpeningLine(message)
  criteria.push({ name: 'Opening', score: openingCheck.score, weight: 10, feedback: openingCheck.feedback })
  if (openingCheck.score < 60) suggestions.push('Avoid starting with "I"')

  // 6. CTA (15%)
  const ctaCheck = checkCallToAction(message)
  criteria.push({ name: 'CTA', score: ctaCheck.score, weight: 15, feedback: ctaCheck.feedback })
  if (ctaCheck.score < 70) suggestions.push('End with a soft question')

  // 7. Spam (15%)
  const spamCheck = checkSpamTriggers(message)
  criteria.push({ name: 'Spam Risk', score: spamCheck.score, weight: 15, feedback: spamCheck.found.length === 0 ? '✓ Clean' : `✗ ${spamCheck.found.length} triggers`, issues: spamCheck.found })
  if (spamCheck.found.length > 0) warnings.push(`Spam words: ${spamCheck.found.join(', ')}`)

  // Calculate overall
  let totalWeighted = 0
  criteria.forEach(c => { totalWeighted += (c.score / 100) * c.weight })
  const overallScore = Math.round(totalWeighted)
  const grade = overallScore >= 85 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 65 ? 'C' : overallScore >= 50 ? 'D' : 'F'

  // LLM suggestions for low scores
  if (GROQ_API_KEY && overallScore < 80) {
    try {
      const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Give 2 specific improvements for this cold outreach. One line each. No numbering.' },
            { role: 'user', content: `${messageType} to ${prospectName} at ${company}:\n\n${message}` }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      })
      const llmData = await llmRes.json()
      const llmText = llmData.choices?.[0]?.message?.content
      if (llmText) {
        llmText.split('\n').filter((l: string) => l.trim()).slice(0, 2).forEach((l: string) => {
          suggestions.push(l.replace(/^[-•*]\s*/, '').trim())
        })
      }
    } catch {}
  }

  return NextResponse.json({
    success: true,
    quality: { overallScore, grade, criteria, suggestions: [...new Set(suggestions)].slice(0, 5), warnings }
  })
}