import type { Metadata } from "next";
import Link from "next/link";
import MarketingResults from "@/app/upload/marketing-results";
import PageShell, { SecondaryButton } from "@/components/page-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MarketingProject } from "@/types/marketing";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getProject(id: string): Promise<MarketingProject | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;
    return data as MarketingProject;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return { title: "Проект не найден — Marketing Chef AI" };
  }

  return {
    title: `${project.restaurant_name} — Marketing Chef AI`,
    description: `Рекламный проект ресторана ${project.restaurant_name}`,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const createdAt = new Date(project.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageShell
      activeFeature="/projects"
      badge="Проект"
      title={project.restaurant_name}
      subtitle={`Создан ${createdAt}`}
    >
      <div className="mb-6">
        <Link href="/projects">
          <SecondaryButton>← Все проекты</SecondaryButton>
        </Link>
      </div>
      <MarketingResults
        restaurantName={project.restaurant_name}
        imageUrl={project.image_url}
        analysis={project.analysis}
        projectId={project.id}
      />
    </PageShell>
  );
}
