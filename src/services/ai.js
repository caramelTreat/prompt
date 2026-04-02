export async function generateContent(industry, description) {
  const prompt = `
你是专业的小红书爆款文案生成器。
行业：${industry}
产品/服务描述：${description}

请严格按照以下JSON格式返回，不要其他内容：
{
  "titles": ["标题1","标题2","标题3","标题4","标题5","标题6","标题7","标题8","标题9","标题10"],
  "content": "正文内容",
  "comments": ["评论1","评论2","评论3"]
}
  `.trim();

  const res = await fetch("/api/ai-copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "生成失败");
  }

  return await res.json();
}
