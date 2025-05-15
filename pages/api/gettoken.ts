// pages/api/gettoken.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import type { SessionData } from '../../lib/ironSessionConfig'
import { sessionOptions } from '../../lib/ironSessionConfig'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 跨域配置
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie')

  try {
    // 获取会话
    const session = await getIronSession<SessionData>(req, res, sessionOptions)

    // 检查 access_token 是否存在且未过期
    if (session.accessToken && session.tokenExpires && Date.now() < session.tokenExpires) {
      // 如果有效，返回 access_token
      res.json({
        access_token: session.accessToken,
        expires_in: Math.floor((session.tokenExpires - Date.now()) / 1000)
      })
    } else {
      // 如果无效，返回错误信息
      res.status(401).json({ error: 'Access token 无效或已过期，请重新认证' })
    }
  } catch (error: any) {
    console.error('获取 token 异常:', {
      message: error.message,
      stack: error.stack,
      url: req.url
    })
    res.status(500).json({ 
      error: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    })
  }
}