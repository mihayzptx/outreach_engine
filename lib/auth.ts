import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
  is_active: boolean
}

export interface Session {
  user: User
  expires: Date
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create JWT token
export function createToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

// Get current session from cookies
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) return null
    
    const decoded = verifyToken(token)
    if (!decoded) return null
    
    // Get fresh user data
    const result = await sql`
      SELECT id, email, name, role, is_active 
      FROM users 
      WHERE id = ${decoded.userId} AND is_active = true
    `
    
    if (result.rows.length === 0) return null
    
    const user = result.rows[0] as User
    return {
      user,
      expires: new Date(Date.now() + SESSION_DURATION)
    }
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await sql`
    SELECT id, email, name, role, is_active, password_hash 
    FROM users 
    WHERE email = ${email.toLowerCase()}
  `
  return result.rows[0] as (User & { password_hash: string }) || null
}

// Create user
export async function createUser(email: string, password: string, name: string, role: string = 'user'): Promise<User> {
  const passwordHash = await hashPassword(password)
  
  const result = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${role})
    RETURNING id, email, name, role, is_active
  `
  
  return result.rows[0] as User
}

// Update last login
export async function updateLastLogin(userId: number): Promise<void> {
  await sql`UPDATE users SET last_login = NOW() WHERE id = ${userId}`
}

// RBAC Permissions
export const PERMISSIONS = {
  // Company permissions
  'companies:view_own': ['user', 'manager', 'admin'],
  'companies:view_all': ['manager', 'admin'],
  'companies:create': ['user', 'manager', 'admin'],
  'companies:edit_own': ['user', 'manager', 'admin'],
  'companies:edit_all': ['admin'],
  'companies:delete_own': ['user', 'manager', 'admin'],
  'companies:delete_all': ['admin'],
  
  // Message permissions
  'messages:generate': ['user', 'manager', 'admin'],
  'messages:view_own': ['user', 'manager', 'admin'],
  'messages:view_all': ['manager', 'admin'],
  
  // User management
  'users:view': ['admin'],
  'users:create': ['admin'],
  'users:edit': ['admin'],
  'users:delete': ['admin'],
  
  // Settings
  'settings:view': ['user', 'manager', 'admin'],
  'settings:edit': ['admin'],
  
  // Admin
  'admin:access': ['admin']
}

export type Permission = keyof typeof PERMISSIONS

// Check if user has permission
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(user.role)
}

// Check if user can access resource
export function canAccessResource(user: User | null, resourceUserId: number | null, permission: Permission): boolean {
  if (!user) return false
  
  // Admin can access everything
  if (user.role === 'admin') return true
  
  // Check if user owns the resource
  const isOwner = resourceUserId === user.id
  
  // For "view_all" or "edit_all" permissions, check role
  if (permission.includes('_all')) {
    return hasPermission(user, permission)
  }
  
  // For "own" permissions, must be owner
  if (permission.includes('_own')) {
    return isOwner && hasPermission(user, permission)
  }
  
  return hasPermission(user, permission)
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, email, name, role, is_active, created_at, last_login
    FROM users
    ORDER BY created_at DESC
  `
  return result.rows as User[]
}

// Update user role (admin only)
export async function updateUserRole(userId: number, role: string): Promise<void> {
  await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`
}

// Toggle user active status (admin only)
export async function toggleUserActive(userId: number, isActive: boolean): Promise<void> {
  await sql`UPDATE users SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${userId}`
}
