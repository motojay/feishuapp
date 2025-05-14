// lib/ironSessionConfig.ts
import { IronSessionOptions } from 'iron-session'

export const ironSessionOptions: IronSessionOptions = {
  cookieName: 'feishu_auth', // 关键修复点[3](@ref)
  password: process.env.SESSION_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1周有效期
  }
}