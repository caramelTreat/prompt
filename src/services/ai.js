// src/services/ai.js - 前端只调用 Vercel 后端接口（路径：/api/ai-copy）
export async function generateContent(prompt, onStreamUpdate) {
  try {
    // 👉 注意：这里不再请求 aip.baidubce.com，而是请求 /api/ai-copy
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

    // 处理后端流式返回的数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6)); // 去掉 "data: " 前缀
          fullText += data.content;
          onStreamUpdate?.(fullText);
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
