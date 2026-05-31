type ResponseOutputItem = {
  type?: string;
  content?: { type?: string; text?: string }[];
};

export function extractOutputText(output: ResponseOutputItem[] | undefined): string {
  if (!output?.length) return "";

  const parts: string[] = [];

  for (const item of output) {
    if (item.type !== "message" || !item.content) continue;

    for (const part of item.content) {
      if (part.type === "output_text" && part.text?.trim()) {
        parts.push(part.text.trim());
      }
    }
  }

  return parts.join("\n\n").trim();
}
