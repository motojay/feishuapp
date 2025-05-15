// @ts-check
// 配置 Next.js 的 headers
const nextConfig = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        { 
          key: 'Access-Control-Allow-Origin', 
          value: process.env.NODE_ENV === 'production' 
            ? 'https://yourdomain.com' 
            : 'http://localhost:3000' 
        },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        { 
          key: 'Access-Control-Allow-Credentials', 
          value: 'true' 
        }
      ]
    }]
  }
}

module.exports = nextConfig