import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const SECRET = process.env.JWT_SECRET
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'aethel_session'
const MAX_AGE_H = Number(process.env.SESSION_MAX_AGE_HOURS || 8)
const BCRYPT_ROUNDS = 12

if (!SECRET || SECRET.length < 32) {
  // No crashea en runtime para permitir `next build`; lo chequeamos en sign/verify.
  console.warn('[AUTH] JWT_SECRET falta o es < 32 chars — arreglar antes de correr en prod')
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}

export function signSession(payload) {
  if (!SECRET || SECRET.length < 32) throw new Error('JWT_SECRET inválido')
  return jwt.sign(payload, SECRET, {
    expiresIn: `${MAX_AGE_H}h`,
    issuer: 'aethel',
    audience: 'aethel-dashboard',
  })
}

export function verifySession(token) {
  if (!token) return null
  try {
    return jwt.verify(token, SECRET, {
      issuer: 'aethel',
      audience: 'aethel-dashboard',
    })
  } catch {
    return null
  }
}

export async function setSessionCookie(payload) {
  const token = signSession(payload)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_H * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Lee y valida la cookie de sesión. Devuelve el payload o null.
 * Usar SIEMPRE esto para obtener negocio_id — nunca leerlo del body.
 */
export async function getSession() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return verifySession(token)
}

export const SESSION_COOKIE = COOKIE_NAME
