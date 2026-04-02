import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue"; // 如果你用 Vue，其他框架同理

export default defineConfig({
  plugins: [vue()],
  // 核心：添加代理配置，解决跨域
  server: {
    proxy: {
      // 匹配以 /api/baidu 开头的请求，转发到百度千帆
      "/api/baidu": {
        target: "https://aip.baidubce.com/v2",
        changeOrigin: true, // 关键：模拟跨域请求的 Origin
        rewrite: (path) => path.replace(/^\/api\/baidu/, ""), // 去掉前缀
        secure: false, // 可选：解决HTTPS证书问题
        headers: {
          Referer: "http://localhost:5174", // 可选：添加Referer，避免接口拦截
          Origin: "http://localhost:5174",
        },
      },
    },
  },
});
