type ImageGenerationResponse = {
  data?: { b64_json?: string; url?: string }[];
  error?: { message?: string };
};

const IMAGE_MODEL = "gpt-image-1.5";

function parseBase64Image(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Некорректный формат изображения");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  size: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      quality: "high",
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ImageGenerationResponse | null;
    throw new Error(errorData?.error?.message ?? "Ошибка OpenAI Images API");
  }

  const data = (await response.json()) as ImageGenerationResponse;
  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI не вернул изображение");
  }

  return `data:image/png;base64,${b64}`;
}

export async function editImage(
  apiKey: string,
  sourceImageBase64: string,
  prompt: string,
  size: string,
): Promise<string> {
  const { buffer, mimeType } = parseBase64Image(sourceImageBase64);
  const ext = extensionForMime(mimeType);

  const formData = new FormData();
  formData.append(
    "image",
    new Blob([new Uint8Array(buffer)], { type: mimeType }),
    `source.${ext}`,
  );
  formData.append("prompt", prompt);
  formData.append("model", IMAGE_MODEL);
  formData.append("size", size);
  formData.append("quality", "high");
  formData.append("n", "1");
  formData.append("output_format", "png");
  formData.append("input_fidelity", "high");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ImageGenerationResponse | null;
    throw new Error(errorData?.error?.message ?? "Ошибка OpenAI Image Edit API");
  }

  const data = (await response.json()) as ImageGenerationResponse;
  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI не вернул отредактированное изображение");
  }

  return `data:image/png;base64,${b64}`;
}
