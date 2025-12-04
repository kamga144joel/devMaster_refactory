export function safeJsonParse<T = any>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  // Remove Markdown code fences
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
  }
  // Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {}
  // Try to extract the first JSON object
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {}
  }
  // Try to fix common bad escapes
  try {
    const fixed = text.replace(/\n/g, "\\n").replace(/\t/g, "\\t");
    return JSON.parse(fixed) as T;
  } catch {}
  return null;
}
