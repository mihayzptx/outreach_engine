// Shared TypeScript types

export interface Company {
  id: number
  company_name: string
  industry: string
  country?: string
  labels?: string[]
  notes?: string
  website?: string
  employee_count?: string
  revenue_range?: string
  last_prospect_name: string
  last_prospect_title: string
  last_context: string
  last_message_type: string
  has_new_signals: boolean
  signal_data?: SignalData | any[]
  research_links_data?: any[]
  lead_grade?: string
  lead_score?: number
  grading_data?: any
  founded_year?: number
  funding_stage?: string
  funding_amount?: string
  is_hiring?: boolean
  buyer_intent?: boolean
  signal_count?: number
  is_archived?: boolean
  archived_at?: string
  icp_score?: number
  icp_fit?: 'high' | 'medium' | 'low'
  icp_breakdown?: any
  icp_scored_at?: string
  extracted_info?: ExtractedInfo
  created_at?: string
  updated_at?: string
}

export interface ExtractedInfo {
  description?: string
  industry?: string
  founded?: string
  headquarters?: string
  employeeCount?: string
  techStack?: string[]
  competitors?: string[]
  fundingTotal?: string
  lastRound?: string
  lastRoundAmount?: string
  lastRoundDate?: string
  investors?: string[]
  keyPeople?: KeyPerson[]
  painPoints?: string[]
  outreachAngles?: string[]
}

export interface KeyPerson {
  name: string
  title: string
  linkedin?: string
}

export interface SignalData {
  detected?: Signal[]
  count?: number
  high_priority?: number
  medium_priority?: number
  scanned_at?: string
}

export interface Signal {
  type: string
  title: string
  summary: string
  priority: 'high' | 'medium' | 'low'
  source?: string
  date?: string
}

export interface Contact {
  id: number
  company_id: number
  name: string
  title?: string
  email?: string
  phone?: string
  linkedin_url?: string
  is_primary: boolean
  seniority?: string
  department?: string
  notes?: string
  source?: string
  last_contacted_at?: string
  created_at?: string
  updated_at?: string
}

export interface Campaign {
  id: number
  name: string
  description?: string
  message_type: string
  tone: string
  length: string
  context_template: string
  target_goal: string
  custom_instructions?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Message {
  id: number
  prospect_name: string
  prospect_title: string
  company: string
  industry: string
  message_type: string
  context: string
  generated_message: string
  sources?: string
  quality_score?: number
  feedback?: 'positive' | 'negative'
  feedback_text?: string
  created_at: string
  user_id?: number
  user_name?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface ICPSettings {
  industries?: ICPItem[]
  companySizes?: ICPItem[]
  fundingStages?: ICPItem[]
  techStack?: ICPItem[]
  signals?: ICPItem[]
  geography?: ICPItem[]
}

export interface ICPItem {
  name: string
  weight: number
  enabled: boolean
}

export interface ContextPreview {
  icpScore: number
  icpFit: string
  seniority: string
  isDecisionMaker: boolean
  signalCount: number
  painPointCount: number
  relevantServices: string[]
  hookSuggestions: string[]
  recommendedTone: string
  recommendedLength: string
}

export interface APIUsageStats {
  groq: {
    requests: number
    tokens: number
    limit: number
    remaining: number
    percentUsed: number
    status: 'ok' | 'warning' | 'exceeded'
    resetsAt: string
    plan?: string
    lastKnown?: boolean
    note?: string
  }
  tavily: {
    requests: number
    limit: number
    remaining: number
    percentUsed: number
    status: 'ok' | 'warning' | 'exceeded'
    resetsAt: string
    plan?: string
    account?: {
      plan_usage: number
      plan_limit: number
    }
  }
  ollama: {
    requests: number
    available: boolean
  }
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CompaniesResponse {
  companies: Company[]
}

export interface CampaignsResponse {
  campaigns: Campaign[]
}

export interface MessagesResponse {
  messages: Message[]
}
