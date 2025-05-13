import { IronSession, IronSessionOptions } from 'iron-session';

// 会话配置
const sessionOptions: IronSessionOptions = {
  cookieName: "feishu_oauth",
  password: process.env.COOKIE_PASSWORD!, // 必须32位以上
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    httpOnly: true,
  },
};

// 类型扩展（声明自定义会话字段）
declare module 'iron-session' {
  interface IronSessionData {
    state: string;       // 用于CSRF防护
    codeVerifier?: string; // 用于PKCE（可选）
    userToken?: string;  // 存储飞书token（可选）
  }
}

// 创建中间件实例（注意IronSession首字母大写）
const session = new IronSession(sessionOptions);

export { sessionOptions, session };