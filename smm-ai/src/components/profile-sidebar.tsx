"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FolderKanban,
  LogOut,
  Plug,
  Settings,
  User,
} from "@/components/ui/icon";
import { PROFILE_MENU } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ICONS: Record<string, typeof User> = {
  "/profile": User,
  "/projects": FolderKanban,
  "/profile/settings": Settings,
  "/profile/integrations": Plug,
  "/profile/tariff": CreditCard,
};

export function ProfileSidebar({ projectCount }: { projectCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="glass-card card-shine space-y-1 rounded-2xl p-3">
      {PROFILE_MENU.map((item) => {
        const Icon = ICONS[item.href] ?? User;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon size={16} />
              {item.label}
            </span>
            {item.href === "/projects" && projectCount !== undefined && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs">
                {projectCount}
              </span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-all hover:bg-white/[0.04] hover:text-white"
      >
        <LogOut size={16} />
        Выйти
      </button>
    </nav>
  );
}
