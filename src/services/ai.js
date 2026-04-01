const API_KEY = 'YOUR_API_KEY_HERE'
const API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
})

const parseJsonFromText = (text, fallback) => {
  try {
    return JSON.parse(text)
  } catch {
    const matched = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (!matched) {
      return fallback
    }

    try {
      return JSON.parse(matched[0])
    } catch {
      return fallback
    }
  }
}

const askModel = async (prompt) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            '你是小红书爆款文案助手，请严格按用户要求返回 JSON，不要输出多余解释。',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API 请求失败: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const generateContent = async (industry, description) => {
  const context = `行业：${industry}\n产品描述：${description || '未提供'}`

  const titlePrompt = `${context}\n请生成10条小红书风格标题，返回 JSON 数组，格式：{"titles":["..."]}`
  const contentPrompt = `${context}\n请生成1段小红书正文文案，返回 JSON 对象，格式：{"content":"..."}`
  const commentPrompt = `${context}\n请生成3条评论区互动话术，返回 JSON 对象，格式：{"comments":["...","...","..."]}`

  const [titlesRaw, contentRaw, commentsRaw] = await Promise.all([
    askModel(titlePrompt),
    askModel(contentPrompt),
    askModel(commentPrompt),
  ])

  const titlesParsed = parseJsonFromText(titlesRaw, { titles: [] })
  const contentParsed = parseJsonFromText(contentRaw, { content: '' })
  const commentsParsed = parseJsonFromText(commentsRaw, { comments: [] })

  return {
    titles: Array.isArray(titlesParsed.titles) ? titlesParsed.titles.slice(0, 10) : [],
    content: typeof contentParsed.content === 'string' ? contentParsed.content : '',
    comments: Array.isArray(commentsParsed.comments) ? commentsParsed.comments.slice(0, 3) : [],
  }
}
