const buildPrompt = (industry, description) => `
You are a professional Xiaohongshu copywriting assistant.
Please generate all content in Simplified Chinese.

Industry: ${industry}
Product or service description: ${description || "Not provided"}

Return JSON only. Do not include any extra explanation.
{
  "titles": ["title1", "title2", "title3", "title4", "title5", "title6", "title7", "title8", "title9", "title10"],
  "content": "main content",
  "comments": ["comment1", "comment2", "comment3"]
}
`.trim()

export async function generateContent(industry, description) {
  const response = await fetch("/api/ai-copy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildPrompt(industry, description),
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || payload.detail || "Generation failed. Please try again later.")
  }

  return response.json()
}
