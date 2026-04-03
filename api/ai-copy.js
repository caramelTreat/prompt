const QIANFAN_API_URL = "https://qianfan.baidubce.com/v2/chat/completions"

function parseJsonFromModelText(raw) {
  const text = String(raw || "").trim()

  if (!text) {
    return {}
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : text

  return JSON.parse(candidate)
}

async function requestQianfan(prompt) {
  const apiKey = process.env.BAIDU_API_KEY
  const model = process.env.BAIDU_MODEL || "ernie-speed-8k"

  if (!apiKey) {
    const error = new Error("未配置 BAIDU_API_KEY")
    error.statusCode = 500
    throw error
  }

  const response = await fetch(QIANFAN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a professional Xiaohongshu copywriting assistant. Always answer in Simplified Chinese and return JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      payload?.error?.message ||
      payload?.error_msg ||
      payload?.message ||
      `千帆请求失败，状态码 ${response.status}`
    const error = new Error(detail)
    error.statusCode = response.status
    throw error
  }

  const text = payload?.choices?.[0]?.message?.content || "{}"
  const parsed = parseJsonFromModelText(text)

  return {
    titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 10) : [],
    content: typeof parsed.content === "string" ? parsed.content : "",
    comments: Array.isArray(parsed.comments) ? parsed.comments.slice(0, 3) : [],
  }
}

export async function generateCopy(payload) {
  const prompt = payload?.prompt

  if (!prompt) {
    const error = new Error("Missing prompt")
    error.statusCode = 400
    throw error
  }

  return requestQianfan(prompt)
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const data = await generateCopy(req.body)
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 500).json({
      error: "AI 生成失败",
      detail: error.message || "未知错误",
    })
  }
}
