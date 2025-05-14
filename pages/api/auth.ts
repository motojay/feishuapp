// pages/api/auth.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { ironSessionOptions, SessionData } from '../../lib/ironSessionConfig'
import { v4 as uuidv4 } from 'uuid'
import { getSessionFromRedis } from '../../lib/session'

// 环境验证（网页5安全要求）
const validateEnv = () => {
  if (!process.env.SESSION_PASSWORD) throw new Error('SESSION_PASSWORD 未配置')
  if (!process.env.FEISHU_CLIENT_ID) throw new Error('FEISHU_CLIENT_ID 未配置')
  if (!process.env.FEISHU_CLIENT_SECRET) throw new Error('FEISHU_CLIENT_SECRET 未配置')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    validateEnv() // 前置环境检查

    console.log(`[Auth] 请求方法: ${req.method}, 路径: ${req.url}`)
    
    // 初始化会话（关键修复点）
    const session = await getIronSession<SessionData>(req, res, ironSessionOptions)
    
    // 强制生成会话ID（解决网页6问题）
    if (!session.id) {
      session.id = uuidv4()
      await session.save()
      console.log('[Session] 生成新会话ID:', session.id)
    }

    // 生成state参数（网页7安全实践）
    const state = uuidv4()
    session.state = state
    await session.save()

    // Redis存储验证（网页8调试要求）
    const redisData = await getSessionFromRedis(session.id)
    console.log(`[Redis] 存储验证: ${redisData ? '成功' : '初始化'}`)

    // 构建认证URL（网页9飞书集成）
    const authUrl = new URL('https://accounts.feishu.cn/open-apis/authen/v1/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', process.env.FEISHU_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', 
      process.env.NODE_ENV === 'production' 
        ? process.env.FEISHU_REDIRECT_URI!
        : process.env.FEISHU_REDIRECT_URI!
    )
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('scope', 'contact:contact.base:readonly')

    res.redirect(authUrl.toString())
    return

  } catch (error: any) {
    console.error('[ERROR] 认证异常:', error)
    res.status(500).json({
      error: '服务端错误',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
    return
  }
}