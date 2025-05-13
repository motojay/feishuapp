import { getIronSession } from 'iron-session'
import { NextApiRequest, NextApiResponse } from 'next'

// 1. 定义会话数据类型（这才是关键！）
export interface SessionData {
  state: string
  codeVerifier?: string
  userToken?: string
}

// 2. 配置对象（不再使用不存在的IronSessionOptions）
export const sessionConfig = {
  cookieName: "feishu_oauth",
  password: process.env.COOKIE_PASSWORD || 'default_32_char_password_placeholder',
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    httpOnly: true,
  },
}

// 3. 封装类型安全的会话获取方法
export async function getAuthSession(req: NextApiRequest, res: NextApiResponse) {
  return await getIronSession<SessionData>(req, res, sessionConfig)
}