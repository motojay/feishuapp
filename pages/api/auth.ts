import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthSession } from './session'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Starting auth process...')
    const session = await getAuthSession(req, res)
    console.log('Session retrieved successfully')
    
    const state = uuidv4()
    session.state = state
    await session.save()
    console.log('Session saved successfully')

    const authUrl = new URL('https://accounts.feishu.cn/open-apis/authen/v1/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', process.env.FEISHU_CLIENT_ID!)
    authUrl.searchParams.append('redirect_uri', 'http://localhost:3000/api/callback') // 本地测试用
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('scope', 'contact:contact.base:readonly')
    console.log('Auth URL generated:', authUrl.toString())

    res.redirect(authUrl.toString())
  } catch (error: any) {
    console.error('An error occurred:', error)
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.m