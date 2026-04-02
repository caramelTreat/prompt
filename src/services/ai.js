// src/services/ai.js - 纯前端调用后端接口，无任何OpenAI依赖
export async function generateContent(prompt, onStreamUpdate) {
  try {
    // 只请求同域名的后端接口，绝对不直连百度
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
          const data = JSON.parse(line.replace("data: ", ""));
          fullText += data.content;
          // 实时更新UI
          if (onStreamUpdate) onStreamUpdate(fullText);
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error("前端调用失败:", error);
    const errMsg = error.message || "生成失败，请稍后重试";
    if (onStreamUpdate) onStreamUpdate(`❌ ${errMsg}`);
    return `❌ ${errMsg}`;
  }
}
