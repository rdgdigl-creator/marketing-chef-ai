import type { Metadata } from "next";
import Link from "next/link";
import { checkSupabaseConnection } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Supabase Test — Marketing Chef AI",
  description: "Проверка подключения к Supabase",
};

export default async function TestSupabasePage() {
  const result = await checkSupabaseConnection();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-8">
      {result.ok ? (
        <p className="text-2xl font-semibold text-emerald-400">
          Supabase Connected
        </p>
      ) : (
        <div className="flex w-full max-w-3xl flex-col gap-4">
          <p className="text-2xl font-semibold text-red-400">
            Supabase Connection Failed
          </p>

          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-red-300">
              Error
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-red-200">
              {JSON.stringify(
                result.error,
                (_, value) => {
                  if (value instanceof Error) {
                    return {
                      name: value.name,
                      message: value.message,
                      stack: value.stack,
                      ...(value.cause !== undefined ? { cause: value.cause } : {}),
                    };
                  }
                  return value;
                },
                2,
              )}
            </pre>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="text-sm text-zinc-400 transition-colors hover:text-white"
      >
        На главную
      </Link>
    </main>
  );
}
