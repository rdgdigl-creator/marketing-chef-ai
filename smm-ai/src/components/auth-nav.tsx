"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn } from "@/components/ui/icon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (email) {
    return (
      <>
        <Link
          href="/projects"
          className="rounded-lg px-3 py-2 text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          Проекты
        </Link>
        <Link
          href="/profile"
          className="max-w-[140px] truncate rounded-lg px-3 py-2 text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
          title={email}
        >
          Профиль
        </Link>
      </>
    );
  }

  return (
    <Link
      href="/login"
      className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-[#A1A1AA] hover:text-white"
    >
      <LogIn size={16} />
      Войти
    </Link>
  );
}
