import type { Metadata } from "next";
import UploadForm from "./upload-form";
import PageShell from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Фото → Реклама — Marketing Chef AI",
  description: "Загрузите фото и получите готовую рекламу для вашего ресторана",
};

export default function UploadPage() {
  return (
    <PageShell
      activeFeature="/upload"
      badge="Фото → Реклама"
      title="Создайте рекламу из фото"
      subtitle="Загрузите фото блюда, ресторана или продукта — AI проанализирует изображение и подготовит рекламные концепции, тексты, баннеры и идеи для соцсетей."
    >
      <UploadForm />
    </PageShell>
  );
}
