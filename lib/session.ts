// lib/session.ts
import { type SessionOptions } from 'iron-session'

export interface SessionData {
  id: string
  state: string
  codeVerifier?: string
  accessToken?: string
  refreshToken?: string
  lastAccessed: number
}

export const sessionOptions: SessionOptions = {
  cookieName: 'feishu_api_auth',
  password: process.env.SESSION_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 修改为 lax 以支持跨站请求
    httpOnly: true,
    maxAge: 86400 * 3, // 3天有效期
    path: '/api' // 仅API路径生效
  }
}