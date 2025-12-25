import Groq from 'groq-sdk'
import { Ollama } from 'ollama'
import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { tavily } from '@tavily/core'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

// Default settings
const defaultSettings = {
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  localModel: 'llama3.2',
  localEndpoint: 'http://localhost:11434',
  cloudModel: 'llama-3.3-70b-versatile',
  systemPromptBase: 'You write cold outreach for Tech-stack.io. Your messages are short, specific, and never generic.',
  bannedPhrases: [
    "I hope this finds you well",
    "I wanted to reach out",
    "I came across your profile",
    "I noticed that",
    "I'd love to connect",
    "Pick your brain",
    "Quick question",
    "Not sure if you're the right person",
    "I know you're busy",
    "We help companies like yours",
    "Synergy",
    "Leverage",
    "Circle back"
  ],
  goodOpeners: [
    "Saw [company] just [specific event]...",
    "[Relevant industry trend] is hitting [their sector]...",
    "Your [specific project/initiative] caught my attention...",
    "The [specific news] about [company] is interesting...",
    "Congrats on [specific achievement]..."
  ],
  companyDescription: "Tech-stack.io is a 200+ person DevOps services company headquartered in Houston, TX.",
  services: [
    "Cloud Infrastructure Optimization (AWS, GCP, Azure)",
    "CI/CD Implementation (Jenkins, GitLab CI, GitHub Actions)",
    "Kubernetes & Container Orchestration",
    "Team Augmentation (embedded senior DevOps engineers)",
    "Platform Engineering",
    "Infrastructure as Code (Terraform, Pulumi)",
    "Observability & Monitoring (Datadog, Prometheus, Grafana)",
    "Security & Compliance (SOC2, HIPAA, PCI-DSS)"
  ],
  idealCustomerSignals: [
    "Just raised funding (Series A, B, C)",
    "Post-acquisition integration",
    "Rapid growth / scaling challenges",
    "Cloud cost problems",
    "Security audit coming",
    "Platform team too small",
    "Legacy modernization needs",
    "DevOps hiring struggles"
  ],
  abmExamples: [
    `Brittany,
It's Michael, managing partner at Techstack. Congrats on the Chicago Titan 100. COO for six months and already being recognized alongside the region's top executives.
Eight functions. Gen-3 succession. Tariff exposure on Reynosa. That's a lot to navigate while building your leadership profile externally. Well deserved recognition.
I know the holidays are busy, especially with Revcor's Salvation Army work and Angel Tree coming up. Enjoy the season. Wishing you and REVCOR team Merry Christmas!`,
    `Alex,
Been following Hoffer for a while now. Caught John Strubulis's piece in Sustainable Packaging News on circularity and flexible packaging.
Love what you all are building over there. Most sustainability talk in plastics feels defensive. This was different. Real engineering thinking about how caps and spouts fit into a closed loop system. Small components, big impact.
Hope you get some real time off with family this Christmas.`,
    `Gary,
Five wins at the INCA Awards. That's a statement.
K Systems and Weber under one roof less than a year and already taking whole categories. Not easy to pull off.
The judges called the Nottingham project "a beautifully designed building and an expertly installed system." That's not participation trophy talk. That's real validation.
First full year after the acquisition and you're stacking the right proof points. Strong way to finish 2025.
Hope you and the team get a chance to switch off over Christmas. Well deserved.`
  ]
}

// Fetch settings from database
async function getSettings() {
  try {
    const result = await sql`
      SELECT settings_data FROM llm_settings WHERE id = 1
    `
    if (result.rows.length > 0 && result.rows[0].settings_data) {
      return { ...defaultSettings, ...result.rows[0].settings_data }
    }
  } catch (error) {
    console.log('Could not fetch settings, using defaults')
  }
  return defaultSettings
}

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
    useLocal,
    useWebResearch,
    adjustment,
    userId,
    customInstructions,
    campaignId
  } = await request.json()

  console.log(useLocal ? '🏠 LOCAL' : '☁️ CLOUD', useWebResearch ? '+ 🔍 RESEARCH' : '', campaignId ? `📋 Campaign: ${campaignId}` : '')

  // Get settings from database
  const settings = await getSettings()
  console.log(`📊 Using model: ${useLocal ? settings.localModel : settings.cloudModel}, temp: ${settings.temperature}`)

  const lengthInstructions: Record<string, string> = {
    short: '2-3 sentences MAXIMUM. Under 200 characters ideal.',
    medium: '3-4 sentences. 200-350 characters.',
    long: '5-6 sentences. 350-500 characters.'
  }

  const toneInstructions: Record<string, string> = {
    professional: 'Business tone. Respectful. No slang.',
    casual: 'Relaxed tone. Like texting a colleague.',
    friendly: 'Warm and personable. Show genuine interest.',
    warm: 'Personal and genuine. Like a thoughtful note to someone you respect.',
    direct: 'Get to the point fast. No fluff. Blunt.',
    enthusiastic: 'High energy. Excited about their work.'
  }

  // Web research
  let researchContext = ''
  let researchSources: string[] = []

  if (useWebResearch) {
    try {
      // Search for company info with multiple queries
      const queries = [
        `${company} company funding revenue employees`,
        `${company} ${industry} news 2024`,
        `${company} headquarters founded CEO`
      ]
      
      let allResults: any[] = []
      
      for (const query of queries) {
        try {
          const searchResponse = await tavilyClient.search(query, {
            maxResults: 3,
            searchDepth: 'advanced',
            includeAnswer: false,
            days: 60
          })
          if (searchResponse.results) {
            allResults = [...allResults, ...searchResponse.results]
          }
        } catch (e) {
          console.error('Search query failed:', query, e)
        }
      }
      
      // Deduplicate by URL
      const seenUrls = new Set<string>()
      const uniqueResults = allResults.filter(r => {
        if (seenUrls.has(r.url)) return false
        seenUrls.add(r.url)
        return true
      })

      if (uniqueResults.length > 0) {
        const researchFindings = uniqueResults
          .slice(0, 8)
          .map((result: any) => `- ${result.title}: ${result.content}`)
          .join('\n')
        
        researchContext = `\n\nRECENT INTEL:\n${researchFindings}\n`
        researchSources = uniqueResults.slice(0, 8).map((result: any) => result.url).filter((url: string) => url)
      }
    } catch (error) {
      console.error('Research error:', error)
    }
  }

  // Build banned phrases list for prompt
  const bannedPhrasesText = settings.bannedPhrases.map((p: string) => `- "${p}"`).join('\n')
  
  // Build good openers list
  const goodOpenersText = settings.goodOpeners.map((o: string) => `- ${o}`).join('\n')
  
  // Build services list
  const servicesText = settings.services.map((s: string) => `- ${s}`).join('\n')

  // Build system prompt using settings
  let systemPrompt = `${settings.systemPromptBase}

## ABOUT THE COMPANY
${settings.companyDescription}

## SERVICES (know these but don't list them in messages):
${servicesText}

## IDEAL CUSTOMER SIGNALS:
${settings.idealCustomerSignals.map((s: string) => `- ${s}`).join('\n')}

## CRITICAL RULES - FOLLOW EXACTLY:
1. ${lengthInstructions[messageLength] || lengthInstructions.medium}
2. ${toneInstructions[toneOfVoice] || toneInstructions.professional}
3. Lead with THEIR specific situation, not who you are
4. MUST include "${prospectName.split(' ')[0]}" (first name) in the greeting
5. MUST reference "${company}" by name at least once in the message
6. Reference at least ONE specific detail from their context
7. End with soft CTA or question, never hard sell
8. Position as peer/expert, not vendor begging for time
9. NEVER start the message body with "I"

## BANNED PHRASES - NEVER USE:
${bannedPhrasesText}

## GOOD OPENER PATTERNS:
${goodOpenersText}

## STRUCTURE:
1. Greeting: "${prospectName.split(' ')[0]}," (first name only)
2. Hook: Specific observation about ${company} or their role (1 sentence)
3. Bridge: Why it matters to them (1 sentence)  
4. CTA: Soft question or offer (1 sentence)

${targetResult ? `## TARGET OUTCOME: ${targetResult}` : ''}
${sources ? `## REFERENCE SOURCES: ${sources}` : ''}
${customInstructions ? `## CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

OUTPUT: Message body only. No subject line. No signature. No "Best," or "Thanks,". Start with "${prospectName.split(' ')[0]},"`

  let userPrompt = ''

  if (messageType === 'Response' && messageHistory) {
    systemPrompt = `${settings.systemPromptBase}

You write follow-up responses for outreach conversations.

## RULES:
1. ${lengthInstructions[messageLength] || lengthInstructions.medium}
2. ${toneInstructions[toneOfVoice] || toneInstructions.professional}
3. Address their specific points directly
4. Add value in your response
5. Move conversation forward with clear next step
6. Match their energy level

## BANNED PHRASES:
${bannedPhrasesText}

${targetResult ? `## TARGET OUTCOME: ${targetResult}` : ''}
${customInstructions ? `## CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

OUTPUT: Response only. No signature.`

    userPrompt = `Write a follow-up response for:

PROSPECT: ${prospectName} at ${company}
INDUSTRY: ${industry}
CONTEXT: ${context}${researchContext}

CONVERSATION HISTORY:
${messageHistory}

Write your response:`
  } else if (messageType === 'ABM') {
    // ABM: Soft touch, recognition-focused messages
    // Build examples from settings
    const abmExamplesText = settings.abmExamples && settings.abmExamples.length > 0
      ? settings.abmExamples.map((ex: string, i: number) => `Example ${i + 1}:\n"${ex}"`).join('\n\n')
      : ''
    
    systemPrompt = `${settings.systemPromptBase}

You write warm, personalized ABM (Account-Based Marketing) messages. These are soft-touch messages focused on RECOGNITION and RELATIONSHIP BUILDING. NO SALES PITCH.

## YOUR COMPANY:
${settings.companyDescription}

## CRITICAL ABM RULES:
1. ${lengthInstructions[messageLength] || lengthInstructions.medium}
2. Tone: Warm, genuine, personal. Like a thoughtful peer, not a salesperson.
3. MUST start with "${prospectName.split(' ')[0]}," (first name only, no "Hi" or "Hey")
4. MUST mention "${company}" by name at least once
5. Lead with SPECIFIC recognition of their achievement or work
6. Show you did real research. Reference exact details from their context.
7. NO sales pitch. NO CTA for meetings or demos.
8. End with a warm closing. Holiday wishes, congratulations, or genuine well-wishes.
9. NEVER start sentences with "I" (except greeting line)
10. Short paragraphs. Conversational. Like a personal note.

## BANNED PHRASES - NEVER USE:
${bannedPhrasesText}
- "I'd love to connect"
- "Would you be open to"
- "Let me know if"
- "I wanted to reach out"
- "Quick question"
- "Picking your brain"
- "Synergies"
- Any meeting request

## ABM MESSAGE STRUCTURE:
1. Opening: "${prospectName.split(' ')[0]}," (first name only)
2. Recognition: Specific achievement at ${company} you noticed (1-2 sentences)
3. Insight: Show you understand WHY it matters (1-2 sentences)
4. Personal Touch: Genuine observation or connection (1 sentence)
5. Warm Close: Well-wishes, seasonal greeting, or simple acknowledgment (1 sentence)

${abmExamplesText ? `## EXAMPLE TONE (study these carefully and match this style):\n\n${abmExamplesText}` : ''}

${targetResult ? `## SOFT TOUCH GOAL: ${targetResult}` : ''}
${sources ? `## REFERENCE SOURCES: ${sources}` : ''}

OUTPUT: Message body only. No subject line. No formal signature. Start with "${prospectName.split(' ')[0]},"`

    userPrompt = `Write a warm ABM message for:

PROSPECT: ${prospectName} (use first name "${prospectName.split(' ')[0]}" in greeting)
TITLE: ${prospectTitle}
COMPANY: ${company} (MUST mention by name)
INDUSTRY: ${industry}

ACHIEVEMENT/CONTEXT TO RECOGNIZE:
${context}
${researchContext}

Remember: Start with "${prospectName.split(' ')[0]}," and mention "${company}" in the message.`
  } else {
    userPrompt = `Write a ${messageType} message for:

PROSPECT: ${prospectName} (use first name "${prospectName.split(' ')[0]}" in greeting)
TITLE: ${prospectTitle}
COMPANY: ${company} (MUST mention by name)
INDUSTRY: ${industry}

CONTEXT/REASON FOR OUTREACH:
${context}
${researchContext}
${adjustment ? `\nADJUSTMENT REQUEST: ${adjustment}` : ''}

Remember: Start with "${prospectName.split(' ')[0]}," and mention "${company}" in the message.`
  }

  let generatedMessage = ''
  let generationFailed = false

  try {
    if (useLocal) {
      const ollamaHost = settings.localEndpoint || 'http://localhost:11434'
      console.log(`🏠 Connecting to Ollama at ${ollamaHost} with model ${settings.localModel}`)
      try {
        const ollama = new Ollama({ host: ollamaHost })
        const response = await ollama.chat({
          model: settings.localModel,
          options: {
            temperature: settings.temperature,
            top_p: settings.topP,
            num_predict: settings.maxTokens
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        })
        generatedMessage = response.message.content
        console.log('✅ Local model success')
      } catch (error: any) {
        console.log('❌ Local model failed:', error.message)
        console.log('Falling back to cloud...')
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: settings.cloudModel,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          top_p: settings.topP,
          frequency_penalty: settings.frequencyPenalty,
          presence_penalty: settings.presencePenalty,
        })
        generatedMessage = completion.choices[0].message.content || ''
      }
    } else {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: settings.cloudModel,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: settings.topP,
        frequency_penalty: settings.frequencyPenalty,
        presence_penalty: settings.presencePenalty,
      })
      generatedMessage = completion.choices[0].message.content || ''
    }
  } catch (error: any) {
    console.error('Generation error:', error.message || error)
    generatedMessage = 'Error generating message. Please try again.'
    generationFailed = true
  }

  // Clean up output (only if generation succeeded)
  if (!generationFailed) {
    generatedMessage = generatedMessage
      .replace(/^(Subject|Subject Line|RE|Re):.*\n?/gi, '')
      .replace(/^(Hi|Hello|Hey|Dear)\s+\[?Name\]?,?\s*/gi, '')
      .replace(/\n*(Best|Thanks|Regards|Cheers|Best regards|Kind regards),?\n*.*/gi, '')
      .replace(/\[Your Name\]|\[Name\]|\[Signature\]/gi, '')
      .trim()
  }

  // Check for personalization - auto-retry once if missing (only if generation succeeded)
  const prospectFirstName = prospectName.split(' ')[0].toLowerCase()
  const companyLower = company.toLowerCase()
  const hasProspectName = generatedMessage.toLowerCase().includes(prospectFirstName)
  const hasCompanyName = generatedMessage.toLowerCase().includes(companyLower)
  
  if (!generationFailed && (!hasProspectName || !hasCompanyName)) {
    console.log('⚠️ Missing personalization, retrying with stricter prompt...')
    
    const retryPrompt = `The previous message was rejected because it didn't include personalization.

MANDATORY REQUIREMENTS:
1. Start with "${prospectName.split(' ')[0]}," (the prospect's first name)
2. Mention "${company}" by name in the message body
3. Reference something specific from their context

Original request:
${userPrompt}

Write a new message that MUST include "${prospectName.split(' ')[0]}" and "${company}":`

    try {
      if (useLocal) {
        const ollamaHost = settings.localEndpoint || 'http://localhost:11434'
        const ollama = new Ollama({ host: ollamaHost })
        const response = await ollama.chat({
          model: settings.localModel,
          options: { temperature: 0.5, num_predict: settings.maxTokens },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: retryPrompt }
          ],
        })
        generatedMessage = response.message.content
      } else {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: retryPrompt }
          ],
          model: settings.cloudModel,
          temperature: 0.5,
          max_tokens: settings.maxTokens,
        })
        generatedMessage = completion.choices[0].message.content || ''
      }
      
      // Clean retry output
      generatedMessage = generatedMessage
        .replace(/^(Subject|Subject Line|RE|Re):.*\n?/gi, '')
        .replace(/^(Hi|Hello|Hey|Dear)\s+\[?Name\]?,?\s*/gi, '')
        .replace(/\n*(Best|Thanks|Regards|Cheers|Best regards|Kind regards),?\n*.*/gi, '')
        .replace(/\[Your Name\]|\[Name\]|\[Signature\]/gi, '')
        .trim()
        
      console.log('✅ Retry complete')
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    }
  }

  // Quality scoring
  const charCount = generatedMessage.length
  const wordCount = generatedMessage.split(/\s+/).length
  const startsWithI = generatedMessage.trim().startsWith('I ') || generatedMessage.trim().startsWith("I'")
  
  // Check for banned phrases dynamically
  const bannedRegex = new RegExp(
    settings.bannedPhrases.map((p: string) => p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'i'
  )
  const hasBannedPhrases = bannedRegex.test(generatedMessage)
  
  // Check personalization - both name AND company should be present
  const finalHasProspectName = generatedMessage.toLowerCase().includes(prospectName.split(' ')[0].toLowerCase())
  const finalHasCompanyName = generatedMessage.toLowerCase().includes(company.toLowerCase())
  const hasSpecificReference = finalHasProspectName && finalHasCompanyName
  const endsWithQuestion = generatedMessage.trim().endsWith('?')
  
  // ABM-specific checks
  const isABM = messageType === 'ABM'
  const hasWarmClosing = /\b(christmas|holiday|season|well deserved|congrats|congratulations|enjoy|wishing)\b/i.test(generatedMessage)
  
  let qualityScore = 100
  if (startsWithI) qualityScore -= 20
  if (hasBannedPhrases) qualityScore -= 25
  if (charCount > 500 && !isABM) qualityScore -= 10
  if (charCount > 800) qualityScore -= 10 // Even ABM shouldn't be too long
  if (charCount < 50) qualityScore -= 20
  if (wordCount < 10) qualityScore -= 15
  if (!finalHasProspectName) qualityScore -= 15
  if (!finalHasCompanyName) qualityScore -= 15
  
  // ABM doesn't need a question, other types benefit from it
  if (!endsWithQuestion && messageType === 'LinkedIn Connection') qualityScore -= 5
  
  // ABM bonus for warm closing
  if (isABM && hasWarmClosing) qualityScore = Math.min(100, qualityScore + 5)

  // Ensure score doesn't go below 0
  qualityScore = Math.max(0, qualityScore)

  const warnings: string[] = []
  if (startsWithI) warnings.push('Starts with "I" - consider rewording')
  if (hasBannedPhrases) warnings.push('Contains generic/banned phrases')
  if (charCount > 300 && messageType === 'LinkedIn Connection') warnings.push('Over LinkedIn 300 char limit')
  if (!finalHasProspectName) warnings.push(`Missing prospect name "${prospectName.split(' ')[0]}"`)
  if (!finalHasCompanyName) warnings.push(`Missing company name "${company}"`)
  if (!endsWithQuestion && !isABM) warnings.push('Consider ending with a question')
  if (isABM && !hasWarmClosing) warnings.push('ABM: Consider adding a warm closing')

  // Save to database
  try {
    if (userId) {
      await sql`
        INSERT INTO messages (prospect_name, prospect_title, company, industry, context, message_type, generated_message, user_id)
        VALUES (${prospectName}, ${prospectTitle}, ${company}, ${industry}, ${context}, ${messageType}, ${generatedMessage}, ${userId})
      `
    } else {
      await sql`
        INSERT INTO messages (prospect_name, prospect_title, company, industry, context, message_type, generated_message)
        VALUES (${prospectName}, ${prospectTitle}, ${company}, ${industry}, ${context}, ${messageType}, ${generatedMessage})
      `
    }
  } catch (error) {
    console.error('DB error:', error)
  }

  return NextResponse.json({ 
    message: generatedMessage,
    researchSources,
    researchContext,
    metrics: {
      charCount,
      wordCount,
      qualityScore,
      warnings
    },
    modelUsed: useLocal ? settings.localModel : settings.cloudModel,
    temperature: settings.temperature,
    error: generationFailed ? 'Generation failed - check API keys' : undefined
  })
}