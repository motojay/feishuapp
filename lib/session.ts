// lib/session.ts
import { IronSessionOptions } from 'iron-session'
import { createClient } from 'redis'

export interface SessionData {
  id: string
  state: string
  codeVerifier?: string
  userToken?: string
  lastAccessed?: number
}

// 修复协议错误的核心修改点
const getValidRedisUrl = (url?: string) => {
  if (!url) throw new Error('KV_REST_API_URL is required')
  if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
    return `redis://${url}`
  }
  return url
}

const redisClient = createClient({
  url: getValidRedisUrl(process.env.KV_REST_API_URL),
  password: process.env.KV_REST_API_TOKEN,
  socket: {
    tls: process.env.KV_REST_API_URL?.startsWith('rediss://') ? true : false,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    connectTimeout: 5000
  }
})

redisClient.on('error', (err) => console.error('[Redis] Client Error:', err))

// 添加连接状态检查
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect()
      console.log('[Redis] 连接成功')
    }
  } catch (error) {
    console.error('[Redis] 连接失败:', error)
    throw error
  }
}
connectRedis()

export const sessionOptions: IronSessionOptions = {
  cookieName: 'feishu_auth',
  password: process.env.COOKIE_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 86400 // 24 hours
  }
}

export async function getSessionFromRedis(sessionId: string): Promise<SessionData | null> {
  try {
    await connectRedis()
    const data = await redisClient.get(`session:${sessionId}`)
    if (!data) return null
    
    const parsed = JSON.parse(data)
    if (!parsed.id || !parsed.state) {
      throw new Error('无效的会话数据格式')
    }
    return parsed
  } catch (error) {
    console.error(`[Redis] 获取会话 ${sessionId} 失败:`, error)
    return null
  }
}

export async function saveSessionToRedis(
  sessionId: string,
  data: SessionData,
  maxAge: number = 86400
): Promise<void> {
  try {
    await redisClient.setEx(sessionId, maxAge, JSON.stringify({
      ...data,
      lastAccessed: Date.now()
    }))
  } catch (error) {
    console.error(`[Redis] Save session ${sessionId} failed:`, error)
  }
}

export async function renewSession(sessionId: string, maxAge: number = 86400) {
  try {
    await redisClient.expire(sessionId, maxAge)
  } catch (error) {
    console.error(`[Redis] Renew session ${sessionId} failed:`, error)
  }
}