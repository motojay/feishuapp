// lib/session.ts
import { getIronSession } from 'iron-session'
import { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from '../../lib/session';
import { sessionOptions } from '../../lib/ironSessionConfig'



// ================== 会话管理方法 ==================
// 提取公共的会话初始化逻辑
async function initializeSession(session: any) {
  if (!session.id) {
    session.id = uuidv4();
    session.lastAccessed = Date.now();
  }
  return session;
}

export async function getAuthSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  return initializeSession(session);
}

export async function initAuthSession(
  req: NextApiRequest,
  res: NextApiResponse,
  data: Pick<SessionData, 'state' | 'codeVerifier'> & Partial<SessionData>
) {
  const session = await getAuthSession(req, res);
  Object.assign(session, {
    ...data,
    lastAccessed: Date.now()
  });
  await session.save();
  return session;
}

export async function updateSession(
  req: NextApiRequest, 
  res: NextApiResponse, 
  data: Partial<SessionData>
) {
  const session = await getAuthSession(req, res)
  Object.assign(session, {
    ...data,
    lastAccessed: Date.now() // 每次更新刷新访问时间
  })
  try {
    await session.save()
    console.log('[Session] 会话更新保存成功:', session.id)
  } catch (error) {
    console.error('[Session] 会话更新保存失败:', error)
  }
}