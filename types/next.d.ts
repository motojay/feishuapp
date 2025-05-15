// 扩展 NextApiRequest 类型，添加 session 属性
import 'next';
import { IronSession } from 'iron-session';

// 声明 next 模块中的 NextApiRequest 接口，添加 session 属性
declare module 'next' {
  interface NextApiRequest {
    // 假设一个会话数据类型，可根据实际情况修改
    // 修改前
    // session: IronSession<{ [key: string]: any }>;
    // 修改后
    // 会话对象，包含任意键值对和 state 属性
    session: IronSession<{ [key: string]: any; state: string }>;
  }
}

// 声明 iron-session 模块中的 IronSessionData 接口，添加 state 和 id 属性
declare module 'iron-session' {
  interface IronSessionData {
    // 会话状态，可选属性
    state?: string; 
    // 会话 ID，可选属性
    id?: string; 
  }
}