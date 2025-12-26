// App-wide constants

export const APP_CONFIG = {
  companyName: 'Tech-stack.io',
  appName: 'Outreach Engine',
  companyInitials: 'TS',
}

export const API_DEFAULTS = {
  ollamaEndpoint: 'http://localhost:11434',
  groqModel: 'llama-3.1-70b-versatile',
  localModel: 'techstack-outreach',
}

export const DEFAULT_SETTINGS = {
  systemPromptBase: `You write cold outreach for ${APP_CONFIG.companyName}. Your messages are short, specific, and never generic.`,
  companyDescription: `${APP_CONFIG.companyName} is a 200+ person DevOps services company headquartered in Houston, TX. We help companies scale their infrastructure, implement CI/CD, and augment their platform teams.`,
}

export const INDUSTRIES = [
  'SaaS / Software', 'FinTech', 'Healthcare Tech', 'E-commerce', 'Manufacturing',
  'Logistics / Supply Chain', 'Real Estate Tech', 'EdTech', 'Cybersecurity',
  'AI / Machine Learning', 'IoT / Hardware', 'Media / Entertainment', 'Retail',
  'Energy / CleanTech', 'Legal Tech', 'HR Tech', 'Construction', 'Other'
]

export const TARGET_RESULTS = [
  'Schedule discovery call', 'Get a reply / start conversation', 'Book a demo',
  'Request introduction', 'Reconnect after event', 'Share relevant content',
  'Explore partnership', 'Other'
]

export const ABM_TARGET_RESULTS = [
  'Recognition only (no ask)', 'Soft engagement', 'Content sharing',
  'Event invitation', 'Seasonal greeting', 'Congratulate achievement', 'Other'
]

export const MESSAGE_TYPES = [
  'LinkedIn Connection', 'LinkedIn InMail', 'Cold Email', 'Follow-up Email',
  'Conference/Event', 'Referral Intro', 'ABM Campaign'
]

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 
  'Australia', 'Netherlands', 'Ireland', 'Singapore', 'UAE', 'Israel'
]

export const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
]

export const FUNDING_STAGES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 
  'Private Equity', 'IPO/Public'
]

export const REVENUE_RANGES = [
  '<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '>$500M'
]

export const LABEL_COLORS: Record<string, string> = {
  'Hot Lead': 'bg-red-500',
  'Warm': 'bg-orange-500',
  'Nurture': 'bg-amber-500',
  'Strategic': 'bg-purple-500',
  'Partner': 'bg-blue-500',
  'Enterprise': 'bg-indigo-500',
  'SMB': 'bg-emerald-500',
  'Expansion': 'bg-pink-500',
  'At Risk': 'bg-rose-600',
  'New': 'bg-cyan-500'
}

export const PREDEFINED_LABELS = Object.keys(LABEL_COLORS)

export const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-emerald-500 text-white',
  'B': 'bg-blue-500 text-white',
  'C': 'bg-yellow-500 text-zinc-900',
  'D': 'bg-orange-500 text-white',
  'E': 'bg-red-500 text-white'
}
