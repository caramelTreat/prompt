// api/ai-copy.js - Vercel后端接口，彻底解决跨域
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.VITE_BAIDU_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key not configured" });
  }

  const client = new OpenAI({
    baseURL: "https://aip.baidubce.com/v2",
    apiKey: apiKey,
  });

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const stream = await client.chat.completions.create({
      model: "ernie-bot-turbo",
      messages: [
        {
          role: "system",
          content: "你是专业的AI文案写作助手，生成符合中文习惯的优质文案",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature: 0.7,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    console.error("后端调用失败:", error);
    res.status(500).json({ error: "生成失败，请稍后重试" });
  }
}
