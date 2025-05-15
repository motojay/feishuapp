// lib/sessionConfig.ts
import { type SessionOptions } from 'iron-session'

export interface SessionData {
  id: string
  state: string
  accessToken?: string      // 新增：存储飞书token
  tokenExpires?: number     // 新增：token过期时间戳
}

export const sessionOptions: SessionOptions = {
  cookieName: 'feishu_api_session',
  password: process.env.SESSION_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 86400 * 3, // 3天有效期
    path: '/api' // 仅对API路径生效
  }
}