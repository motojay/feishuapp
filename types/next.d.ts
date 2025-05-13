// 扩展 NextApiRequest 类型，添加 session 属性
import 'next';
import { IronSession } from 'iron-session';

declare module 'next' {
  interface NextApiRequest {
    // 假设一个会话数据类型，可根据实际情况修改
    // 修改前
    // session: IronSession<{ [key: string]: any }>;
    // 修改后
    session: IronSession<{ [key: string]: any; state: string }>;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
  state?: string; // 添加 state 属性到会话数据类型中
  id?: string; // 添加 id 属性到会话数据类型中
}
}