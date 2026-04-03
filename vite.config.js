import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { generateCopy } from "./api/ai-copy.js"

function qianfanDevApiPlugin() {
  return {
    name: "qianfan-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/ai-copy") {
          return next()
        }

        if (req.method !== "POST") {
          res.statusCode = 405
          res.setHeader("Content-Type", "application/json; charset=utf-8")
          res.end(JSON.stringify({ error: "Method not allowed" }))
          return
        }

        try {
          const chunks = []

          for await (const chunk of req) {
            chunks.push(chunk)
          }

          const rawBody = Buffer.concat(chunks).toString("utf8")
          const body = rawBody ? JSON.parse(rawBody) : {}
          const data = await generateCopy(body)

          res.statusCode = 200
          res.setHeader("Content-Type", "application/json; charset=utf-8")
          res.end(JSON.stringify(data))
        } catch (error) {
          res.statusCode = error.statusCode || 500
          res.setHeader("Content-Type", "application/json; charset=utf-8")
          res.end(
            JSON.stringify({
              error: "AI 生成失败",
              detail: error.message || "未知错误",
            }),
          )
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), qianfanDevApiPlugin()],
})
