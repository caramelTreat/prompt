// 百度千帆v2 原生OpenAI兼容接口（仅需API Key，无需Secret Key）
import OpenAI from "openai";

// 👇 只需要填你刚创建的API Key！
const API_KEY = import.meta.env.VITE_BAIDU_API_KEY;

// 初始化客户端，直接兼容OpenAI格式
const client = new OpenAI({
  // 百度千帆v2 OpenAI兼容地址
  baseURL: "https://aip.baidubce.com/v2/",
  // 直接填你的API Key
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // ✅ 新增这一行，解决报错
  // 超时配置，避免卡顿
  timeout: 30000,
});

// 核心文案生成函数（支持流式打字机效果，和原OpenAI逻辑完全一致）
export async function generateContent(prompt, onStreamUpdate) {
  try {
    // 调用免费模型ERNIE-Bot-turbo，个人实名用户每日免费500次
    const stream = await client.chat.completions.create({
      model: "ernie-bot-turbo",
      messages: [
        {
          role: "system",
          content:
            "你是专业的AI文案写作助手，擅长生成高质量、符合需求的中文营销/社交/品牌文案，风格灵活适配。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      stream: true, // 开启流式输出，实现打字机效果
    });

    let fullText = "";
    // 流式处理，实时更新UI
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;
      // 实时回调，更新页面显示
      if (onStreamUpdate) onStreamUpdate(fullText);
    }

    return fullText;
  } catch (error) {
    console.error("百度千帆API调用失败:", error);
    const errorMsg =
      error.response?.data?.error?.message || "服务异常，请稍后重试";
    if (onStreamUpdate) onStreamUpdate(`❌ 生成失败：${errorMsg}`);
    return `❌ 生成失败：${errorMsg}`;
  }
}
