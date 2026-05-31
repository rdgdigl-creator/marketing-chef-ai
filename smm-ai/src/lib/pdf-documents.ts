import { getAuthUser } from "@/lib/auth";
import { splitIntoChunks } from "@/lib/document-rag";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsultantMode, DocumentAnalysis } from "@/types/pdf";

export async function savePdfDocument(params: {
  fileName: string;
  analysis: DocumentAnalysis;
  consultantMode: ConsultantMode;
}): Promise<{ documentId: string } | { error: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Не авторизован" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: doc, error: docError } = await supabase
    .from("pdf_documents")
    .insert({
      file_name: params.fileName,
      file_type: params.analysis.detectedFileType,
      document_text: params.analysis.documentText,
      analysis: params.analysis,
      consultant_mode: params.consultantMode,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (docError || !doc?.id) {
    return { error: docError?.message ?? "Не удалось сохранить документ" };
  }

  const chunks = splitIntoChunks(params.analysis.documentText);
  if (chunks.length > 0) {
    const { error: chunksError } = await supabase.from("document_chunks").insert(
      chunks.map((chunk) => ({
        document_id: doc.id,
        chunk_index: chunk.index,
        content: chunk.content,
      })),
    );

    if (chunksError) {
      return { error: chunksError.message };
    }
  }

  return { documentId: doc.id };
}
