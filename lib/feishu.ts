import axios from 'axios';

// 飞书API封装类
class FeishuAPI {
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  constructor() {
    // 从环境变量获取客户端ID和密钥
    this.clientId = process.env.FEISHU_CLIENT_ID;
    this.clientSecret = process.env.FEISHU_CLIENT_SECRET;
  }

  // 使用授权码获取租户访问令牌
  async getTenantAccessToken() {
    if (!this.clientId ||!this.clientSecret) {
      throw new Error('缺少客户端ID或客户端密钥');
    }

    try {
      const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        app_id: this.clientId,
        app_secret: this.clientSecret,
      });

      return response.data.tenant_access_token;
    } catch (error) {
      console.error('获取租户访问令牌时出错:', error);
      throw error;
    }
  }
}

// 导出FeishuAPI实例
const feishuAPI = new FeishuAPI();
export default feishuAPI;