// pages/api/auth.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { v4 as uuidv4 } from 'uuid'
import type { SessionData } from '../../lib/session'
import { sessionOptions } from '../../lib/session'
import { getAuthSession } from './session'

// 环境变量预检查（启动时检查而非每次请求）
const requiredEnv = ['SESSION_PASSWORD', 'FEISHU_CLIENT_ID', 'FEISHU_CLIENT_SECRET', 'FEISHU_REDIRECT_URI']
if (requiredEnv.some(env => !process.env[env])) {
  throw new Error(`缺少必要环境变量: ${requiredEnv.filter(env => !process.env[env]).join(', ')}`)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 跨域支持（新增）
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  try {
    const session = await getAuthSession(req, res);
    const needsSave = !session.state;
    session.state ||= uuidv4();
    session.lastAccessed = Date.now();
    // 添加日志确认 state 是否正确生成
    console.log('[Auth] 生成的 state:', session.state);

    if (needsSave) {
      await session.save();
      console.log('[Session] 初始化会话:', { id: session.id, state: session.state });
    }
    // URL构建优化（性能提升）
    const authUrl = new URL('https://accounts.feishu.cn/open-apis/authen/v1/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', process.env.FEISHU_CLIENT_ID!)
    authUrl.searchParams.set('redirect_uri', process.env.FEISHU_REDIRECT_URI!)
    authUrl.searchParams.set('state', session.state!)
    authUrl.searchParams.set('scope', 'contact:contact.base:readonly')

    // 移除 return 关键字
    res.redirect(authUrl.toString());

  } catch (error: any) {
    console.error('[Auth] 认证异常:', error)
    // 错误响应标准化（改进）
    const errorResponse = {
      error: 'Authentication Service Error',
      ...(process.env.NODE_ENV !== 'production' && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    }
    // 移除 return 关键字
    res.status(500).json(errorResponse);
  }
}