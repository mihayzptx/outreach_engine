import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me-in-production-min-32-chars'

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(user: User): string {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    const decoded = verifyToken(token)
    if (!decoded) return null
    const result = await sql`SELECT id, email, name, role, is_active FROM users WHERE id = ${decoded.userId} AND is_active = true`
    if (result.rows.length === 0) return null
    return { user: result.rows[0] as User, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  } catch {
    return null
  }
}

export async function getUserByEmail(email: string) {
  const result = await sql`SELECT id, email, name, role, is_active, password_hash FROM users WHERE email = ${email.toLowerCase()}`
  return result.rows[0] || null
}

export async function createUser(email: string, password: string, name: string, role: string = 'user'): Promise<User> {
  const hash = await hashPassword(password)
  const result = await sql`INSERT INTO users (email, password_hash, name, role) VALUES (${email.toLowerCase()}, ${hash}, ${name}, ${role}) RETURNING id, email, name, role, is_active`
  return result.rows[0] as User
}

export async function updateLastLogin(userId: number): Promise<void> {
  await sql`UPDATE users SET last_login = NOW() WHERE id = ${userId}`
}

export const PERMISSIONS: Record<string, string[]> = {
  'companies:view_own': ['user', 'manager', 'admin'],
  'companies:view_all': ['manager', 'admin'],
  'companies:delete_all': ['admin'],
  'messages:view_all': ['manager', 'admin'],
  'users:view': ['admin'],
  'users:create': ['admin'],
  'users:edit': ['admin'],
  'users:delete': ['admin'],
  'admin:access': ['admin']
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  return PERMISSIONS[permission]?.includes(user.role) || false
}
