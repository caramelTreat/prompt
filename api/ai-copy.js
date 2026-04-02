import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.BAIDU_API_KEY;

    if (!prompt) return res.status(400).json({ error: "缺少描述内容" });
    if (!apiKey) return res.status(500).json({ error: "API Key 未配置" });

    const client = new OpenAI({
      baseURL: "https://aip.baidubce.com/v2",
      apiKey: apiKey,
    });

    const completion = await client.chat.completions.create({
      model: "ernie-bot-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(text.trim());

    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI 生成失败" });
  }
}
