import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// GET - Fetch all settings or specific key
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'default'
  const key = searchParams.get('key')
  
  try {
    if (key) {
      // Get specific setting
      const result = await sql`
        SELECT settings_value FROM user_settings 
        WHERE user_id = ${userId} AND settings_key = ${key}
      `
      
      if (result.rows.length > 0) {
        return NextResponse.json({ 
          success: true,
          key,
          value: result.rows[0].settings_value 
        })
      }
      return NextResponse.json({ success: true, key, value: null })
    }
    
    // Get all settings for user
    const result = await sql`
      SELECT settings_key, settings_value, updated_at 
      FROM user_settings 
      WHERE user_id = ${userId}
    `
    
    // Convert to object
    const settings: Record<string, any> = {}
    for (const row of result.rows) {
      settings[row.settings_key] = row.settings_value
    }
    
    return NextResponse.json({ 
      success: true,
      settings,
      lastUpdated: result.rows[0]?.updated_at
    })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Save settings (full replace or specific key)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId = 'default', key, value, settings } = body
    
    if (key && value !== undefined) {
      // Save specific key
      await sql`
        INSERT INTO user_settings (user_id, settings_key, settings_value)
        VALUES (${userId}, ${key}, ${JSON.stringify(value)})
        ON CONFLICT (user_id, settings_key)
        DO UPDATE SET 
          settings_value = ${JSON.stringify(value)},
          updated_at = NOW()
      `
      return NextResponse.json({ success: true, key })
    }
    
    if (settings) {
      // Save all settings as individual keys
      const keys = ['llm', 'icp', 'grading', 'signals', 'company', 'prompts', 'integrations']
      
      for (const k of keys) {
        if (settings[k] !== undefined) {
          await sql`
            INSERT INTO user_settings (user_id, settings_key, settings_value)
            VALUES (${userId}, ${k}, ${JSON.stringify(settings[k])})
            ON CONFLICT (user_id, settings_key)
            DO UPDATE SET 
              settings_value = ${JSON.stringify(settings[k])},
              updated_at = NOW()
          `
        }
      }
      
      // Also save the full settings blob for backward compatibility
      await sql`
        INSERT INTO user_settings (user_id, settings_key, settings_value)
        VALUES (${userId}, 'full', ${JSON.stringify(settings)})
        ON CONFLICT (user_id, settings_key)
        DO UPDATE SET 
          settings_value = ${JSON.stringify(settings)},
          updated_at = NOW()
      `
      
      return NextResponse.json({ success: true, message: 'All settings saved' })
    }
    
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Merge/update specific settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId = 'default', key, value } = body
    
    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }
    
    // Get existing value
    const existing = await sql`
      SELECT settings_value FROM user_settings 
      WHERE user_id = ${userId} AND settings_key = ${key}
    `
    
    let merged = value
    if (existing.rows.length > 0 && typeof value === 'object') {
      // Merge with existing
      merged = { ...existing.rows[0].settings_value, ...value }
    }
    
    await sql`
      INSERT INTO user_settings (user_id, settings_key, settings_value)
      VALUES (${userId}, ${key}, ${JSON.stringify(merged)})
      ON CONFLICT (user_id, settings_key)
      DO UPDATE SET 
        settings_value = ${JSON.stringify(merged)},
        updated_at = NOW()
    `
    
    return NextResponse.json({ success: true, key, value: merged })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}