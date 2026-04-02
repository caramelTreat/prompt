import OpenAI from "openai";

/** 千帆 ModelBuilder V2：OpenAI 兼容接口，见官方文档 base_url */
const QIANFAN_OPENAI_BASE = "https://qianfan.baidubce.com/v2";

function parseJsonFromModelText(raw) {
  const text = (raw || "").trim();
  if (!text) return {};
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1].trim() : text;
  return JSON.parse(candidate);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.BAIDU_API_KEY;
    /** 控制台「在线服务」V2 里显示的模型名，如 ernie-speed-8k、ernie-4.0-8k */
    const model = process.env.BAIDU_MODEL || "ernie-speed-8k";

    if (!prompt) return res.status(400).json({ error: "缺少描述内容" });
    if (!apiKey) return res.status(500).json({ error: "API Key 未配置" });

    const client = new OpenAI({
      baseURL: QIANFAN_OPENAI_BASE,
      apiKey,
    });

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const data = parseJsonFromModelText(text);

    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    const detail =
      e?.error?.message ||
      e?.message ||
      (typeof e === "string" ? e : "");
    res.status(500).json({
      error: "AI 生成失败",
      ...(detail ? { detail: String(detail).slice(0, 500) } : {}),
    });
  }
}
