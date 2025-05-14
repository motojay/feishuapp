import { getIronSession } from 'iron-session'
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from 'redis'
import { v4 as uuidv4 } from 'uuid'


// ================== 类型定义 ==================
export interface SessionData {
  id: string
  state: string
  codeVerifier?: string
  userToken?: string
}

// ================== Redis 配置 ==================
const redisClient = createClient({
  url: process.env.KV_REST_API_URL,
  password: process.env.KV_REST_API_TOKEN,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 5000), // 指数退避重连策略
    connectTimeout: 5000 // 5秒连接超时
  }
});

// 错误监听（保留您原有的错误处理）
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// 连接Redis（保留您原有的连接逻辑）
redisClient.connect().catch(console.error);

export default redisClient;

// ================== 会话存储核心方法 ==================
export async function getSessionFromRedis(sessionId: string): Promise<SessionData | null> {
  try {
    const data = await redisClient.get(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis会话读取失败:', error)
    return null
  }
}

export async function saveSessionToRedis(sessionId: string, data: SessionData): Promise<void> {
  try {
    await redisClient.setEx(`session:${sessionId}`, 3600, JSON.stringify(data))
  } catch (error) {
    console.error('Redis会话存储失败:', error)
  }
}

// ================== Iron Session 配置 ==================
export const sessionConfig = {
  cookieName: "feishu_oauth",
  password: process.env.COOKIE_PASSWORD || '32位默认密码请修改', 
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: true,
    maxAge: 86400 // 24小时
  }
}

// ================== 会话管理方法 ==================
export async function getAuthSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionConfig)
  
  // 自动生成会话 ID
  if (!session.id) {
    session.id = uuidv4()
    await session.save()
    console.log('Generated new session ID:', session.id)
  }

  return session
}

export async function updateSession(req: NextApiRequest, res: NextApiResponse, data: Partial<SessionData>) {
  const session = await getAuthSession(req, res)
  Object.assign(session, data)
  await session.save()
  await saveSessionToRedis(session.id, session)
}