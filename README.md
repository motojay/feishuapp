# Feishu 认证接口项目

此项目包含飞书认证接口相关代码，解决调用 `/api/auth` 接口时 `getSessionFromRedis` 不是函数的问题。主要修改点如下：
1. 确认 `auth.ts` 中 `getSessionFromRedis` 的导入路径。
2. 确保 `session.ts` 中 `getSessionFromRedis` 函数存在。