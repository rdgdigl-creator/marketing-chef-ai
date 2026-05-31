import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { PrimaryButton } from "@/components/page-shell";
import { Camera } from "@/components/ui/icon";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MarketingProjectListItem } from "@/types/marketing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Проекты — Marketing Chef AI",
  description: "Все маркетинговые проекты вашего ресторана",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getProjects(): Promise<{
  projects: MarketingProjectListItem[];
  error: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { projects: [], error: null };
    }

    const { data, error } = await supabase
      .from("marketing_projects")
      .select("id, restaurant_name, image_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { projects: [], error: error.message };
    }

    return { projects: (data ?? []) as MarketingProjectListItem[], error: null };
  } catch (err) {
    return {
      projects: [],
      error: err instanceof Error ? err.message : "Не удалось загрузить проекты",
    };
  }
}

export default async function ProjectsPage() {
  const { projects, error } = await getProjects();

  return (
    <PageShell
      activeFeature="/projects"
      badge="Проекты"
      title="Мои проекты"
      subtitle="Сохранённые рекламные материалы, анализы фото и маркетинговые решения для вашего ресторана."
    >
      {error && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="glass-card card-shine flex flex-col items-center rounded-2xl px-6 py-16 text-center">
          <span className="inline-flex rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-4 text-[#8B5CF6]">
            <Camera size={32} />
          </span>
          <h2 className="mt-6 text-xl font-semibold text-white">Пока нет проектов</h2>
          <p className="mt-2 max-w-md text-sm text-[#A1A1AA]">
            Загрузите фото и создайте первый рекламный проект для вашего ресторана.
          </p>
          <Link href="/upload" className="mt-8">
            <PrimaryButton>Создать первый проект</PrimaryButton>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="feature-card glass-card card-shine group overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.02]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image_url}
                  alt={`Проект — ${project.restaurant_name}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-[#8B5CF6]">
                  {project.restaurant_name}
                </h2>
                <p className="mt-2 text-sm text-[#A1A1AA]">{formatDate(project.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
