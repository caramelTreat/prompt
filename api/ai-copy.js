// src/services/ai.js - 前端调用 Vercel 后端接口
export async function generateContent(prompt, onStreamUpdate) {
  try {
    // 调用 Vercel 后端接口（路径和文件名对应：/api/ai-copy）
    const response = await fetch("/api/ai-copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解析流式数据
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.replace("data: ", ""));
          fullText += data.content;
          onStreamUpdate?.(fullText); // 实时更新前端文案
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error("前端调用失败:", error);
    const errMsg = error.message || "生成失败，请稍后重试";
    onStreamUpdate?.(`❌ ${errMsg}`);
    return `❌ ${errMsg}`;
  }
}
