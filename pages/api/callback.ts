import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import ironSessionOptions from '../../lib/ironSessionConfig'
import { SessionData } from '../../lib/ironSessionConfig'
import axios from 'axios'
import { kv } from '@vercel/kv'
import { redisClient } from '../../lib/session'

// 添加明确的cookieName和password
const ironSessionOptions = {
  password: process.env.SESSION_PASSWORD, // 32字符以上密钥
  cookieName: 'feishu_auth_session', // 自定义cookie名称
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7 // 1周有效期
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 设置跨域响应头
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  try {
    const session = await getIronSession<SessionData>(req, res, ironSessionOptions);
    console.log('After getting session in callback, session state:', session.state); // 记录 callback 中获取会话后的状态
    // 防御性验证
    if (!session?.state) {
      console.error('Session state missing:', {
        sessionKeys: Object.keys(session || {}),
        queryState: req.query.state
      });
      return res.status(403).json({ error: 'Session expired' });
    }

    console.log('Received state from query:', req.query.state); // 记录从查询参数中获取的 state 值
    if (req.query.state !== session.state) {
      console.error('State mismatch:', {
        stored: session.state,
        received: req.query.state
      });
      return res.status(403).json({ error: 'Invalid state parameter' });
    }
  
if (!req.query.state || req.query.state !== session.state) {
      throw new Error('Invalid state parameter')
    }

    const { data } = await axios.post<{
      tenant_access_token: string
      expire: number
    }>(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: process.env.FEISHU_CLIENT_ID,
        app_secret: process.env.FEISHU_CLIENT_SECRET,
      }
    )

    await kv.setex(
      `feishu:${session.id}:access_token`,
      data.expire - 60,
      data.tenant_access_token
    )

    res.json({
      access_token: data.tenant_access_token,
      expires_in: data.expire
    })

  } catch (error: any) {
    console.error('An error occurred in callback process:', error);
    res.status(500).json({ error: error.message })
  }
}