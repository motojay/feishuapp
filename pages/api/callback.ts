// pages/api/auth/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import axios from 'axios'
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
    const session = await getIronSession<SessionData>(req, res, sessionOptions)
    
    // 增强state验证
    if (!req.query.state) {
      return res.status(400).json({ error: '缺失 state parameter' })
    }
    
    if (!session.state || session.state !== req.query.state) {
      console.error('State验证失败', {
        stored: session.state,
        received: req.query.state,
        sessionId: session.id
      })
      return res.status(403).json({ error: '为空 state parameter' })
    }

    // 获取飞书token
    const { data } = await axios.post<{
      tenant_access_token: string
      expire: number
    }>('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: process.env.FEISHU_CLIENT_ID,
      app_secret: process.env.FEISHU_CLIENT_SECRET,
    })

    // 更新会话
    session.accessToken = data.tenant_access_token
    session.tokenExpires = Date.now() + (data.expire * 1000)
    await session.save()

    res.json({
      access_token: data.tenant_access_token,
      expires_in: data.expire
    })

  } catch (error: any) {
    console.error('回调处理异常:', {
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