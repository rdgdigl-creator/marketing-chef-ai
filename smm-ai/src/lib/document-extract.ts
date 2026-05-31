import JSZip from "jszip";
import type { SupportedFileType } from "@/lib/file-types";
import { isImageType } from "@/lib/file-types";

const MAX_EXTRACTED_CHARS = 50_000;

export type ExtractionResult = {
  text: string;
  isImage: boolean;
  imageDataUrl?: string;
  usedNativeExtraction: boolean;
};

function stripXml(xml: string): string {
  return xml
    .replace(/<w:tab[^/]*\/>/g, "\t")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[…текст обрезан для анализа]`;
}

async function extractFromZipXml(
  buffer: Buffer,
  fileMatchers: (path: string) => boolean,
): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const parts: string[] = [];

  const paths = Object.keys(zip.files).filter(
    (path) => !zip.files[path].dir && fileMatchers(path),
  );
  paths.sort();

  for (const path of paths) {
    const file = zip.files[path];
    const xml = await file.async("string");
    const text = stripXml(xml);
    if (text) parts.push(text);
  }

  return parts.join("\n\n");
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) return "";
  return truncate(stripXml(await docXml.async("string")));
}

async function extractXlsx(buffer: Buffer): Promise<string> {
  const shared = await extractFromZipXml(
    buffer,
    (p) => p === "xl/sharedStrings.xml",
  );
  const sheets = await extractFromZipXml(buffer, (p) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(p),
  );
  return truncate([shared, sheets].filter(Boolean).join("\n\n"));
}

async function extractPptx(buffer: Buffer): Promise<string> {
  return truncate(
    await extractFromZipXml(buffer, (p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)),
  );
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return truncate((result.text ?? "").trim());
  } catch {
    return "";
  }
}

function extractPlainText(buffer: Buffer): string {
  return truncate(buffer.toString("utf-8").replace(/\uFEFF/g, "").trim());
}

export function parseDataUrl(dataUrl: string): {
  mime: string;
  buffer: Buffer;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Некорректный формат файла (ожидается data URL)");
  }
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function extractDocumentContent(
  buffer: Buffer,
  fileType: SupportedFileType,
  dataUrl: string,
): Promise<ExtractionResult> {
  if (isImageType(fileType)) {
    return {
      text: "",
      isImage: true,
      imageDataUrl: dataUrl,
      usedNativeExtraction: false,
    };
  }

  let text = "";

  switch (fileType) {
    case "pdf":
      text = await extractPdf(buffer);
      break;
    case "docx":
      text = await extractDocx(buffer);
      break;
    case "xlsx":
      text = await extractXlsx(buffer);
      break;
    case "pptx":
      text = await extractPptx(buffer);
      break;
    case "csv":
    case "txt":
    case "md":
      text = extractPlainText(buffer);
      break;
    default:
      text = "";
  }

  return {
    text,
    isImage: false,
    usedNativeExtraction: text.length > 0,
  };
}
