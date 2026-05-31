export type SupportedFileType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "csv"
  | "txt"
  | "md"
  | "jpg"
  | "png";

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "csv",
  "txt",
  "md",
  "jpg",
  "png",
];

export const FILE_TYPE_LABELS: Record<SupportedFileType, string> = {
  pdf: "PDF",
  docx: "Word (DOCX)",
  xlsx: "Excel (XLSX)",
  pptx: "PowerPoint (PPTX)",
  csv: "CSV",
  txt: "Текст (TXT)",
  md: "Markdown (MD)",
  jpg: "Изображение (JPG)",
  png: "Изображение (PNG)",
};

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  pptx: "pptx",
  csv: "csv",
  txt: "txt",
  md: "md",
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
};

const MIME_MAP: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/csv": "csv",
  "application/csv": "csv",
  "text/plain": "txt",
  "text/markdown": "md",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export const ACCEPT_FILE_TYPES =
  ".pdf,.docx,.xlsx,.pptx,.csv,.txt,.md,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,text/plain,text/markdown,image/jpeg,image/png";

export function detectFileType(fileName: string, mimeType?: string): SupportedFileType | null {
  if (mimeType && MIME_MAP[mimeType]) {
    return MIME_MAP[mimeType];
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? null;
}

export function isImageType(type: SupportedFileType): boolean {
  return type === "jpg" || type === "png";
}

export function mimeForFileType(type: SupportedFileType): string {
  const map: Record<SupportedFileType, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    jpg: "image/jpeg",
    png: "image/png",
  };
  return map[type];
}
