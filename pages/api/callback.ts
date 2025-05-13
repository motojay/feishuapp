import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthSession } from './session'
import axios from 'axios'
import { kv } from '@vercel/kv'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getAuthSession(req, res)
    
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
    res.status(500).json({ error: error.message })
  }
}