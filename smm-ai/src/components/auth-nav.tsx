"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  ChevronDown,
  CreditCard,
  FolderKanban,
  LogIn,
  LogOut,
  Plug,
  Settings,
  User as UserIcon,
} from "@/components/ui/icon";
import { PROFILE_MENU } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const MENU_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "/profile": UserIcon,
  "/projects": FolderKanban,
  "/profile/settings": Settings,
  "/profile/integrations": Plug,
  "/profile/tariff": CreditCard,
};

type AuthNavProps = {
  loginClassName?: string;
};

function getUserInitial(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name?.trim()) {
    return name.trim()[0]!.toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

function getUserAvatarUrl(user: User): string | null {
  const avatar = user.user_metadata?.avatar_url;
  return typeof avatar === "string" && avatar.length > 0 ? avatar : null;
}

function getUserDisplayName(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name?.trim()) {
    return name.trim();
  }
  return user.email ?? "";
}

export function AuthNav({ loginClassName = "" }: AuthNavProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-xl bg-white/[0.04]" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-[#A1A1AA] hover:text-white ${loginClassName}`}
      >
        <LogIn size={16} />
        Войти
      </Link>
    );
  }

  const avatarUrl = getUserAvatarUrl(user);
  const initial = getUserInitial(user);
  const displayName = getUserDisplayName(user);
  const email = user.email ?? "";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="btn-glass group inline-flex max-w-[min(100vw-2.5rem,280px)] items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:text-white"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-sm font-semibold text-[#8B5CF6] ring-1 ring-[#8B5CF6]/30">
            {initial}
          </span>
        )}
        <span className="min-w-0 truncate text-left text-[#A1A1AA] group-hover:text-white">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#A1A1AA] transition-transform ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[120] min-w-[220px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111]/95 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          {email && (
            <p className="truncate border-b border-white/[0.06] px-4 py-2.5 text-xs text-[#A1A1AA]" title={email}>
              {email}
            </p>
          )}
          {PROFILE_MENU.map((item) => {
            const Icon = MENU_ICONS[item.href] ?? UserIcon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 border-t border-white/[0.06] px-4 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
