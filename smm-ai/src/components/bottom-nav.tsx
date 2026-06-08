"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, Layers, Palette, User } from "@/components/ui/icon";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof Bot;
  match: (p: string) => boolean;
  isCenter?: boolean;
}[] = [
  { href: "/", label: "Директор", icon: Bot, match: (p) => p === "/" },
  {
    href: "/ai-hq",
    label: "Штаб",
    icon: Layers,
    match: (p) => p.startsWith("/ai-hq") || p.startsWith("/media-buyer"),
  },
  {
    href: "/studio",
    label: "Студия",
    icon: Palette,
    match: (p) =>
      p.startsWith("/studio") ||
      p.startsWith("/create") ||
      p.startsWith("/upload") ||
      p.startsWith("/reels-generator") ||
      p.startsWith("/analyze-video"),
    isCenter: true,
  },
  {
    href: "/analyze-pdf",
    label: "Документы",
    icon: FileText,
    match: (p) => p.startsWith("/analyze-pdf"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    match: (p) => p.startsWith("/profile") || p.startsWith("/login"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/80 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom,8px)] pt-2">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group -mt-5 flex flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                      active
                        ? "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-[0_0_32px_rgba(139,92,246,0.5)]"
                        : "bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] shadow-[0_0_24px_rgba(139,92,246,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
                    }`}
                  >
                    <Icon size={22} className="text-white" strokeWidth={2} />
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-[#8B5CF6]" : "text-[#A1A1AA]"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors"
              >
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${active ? "text-[#8B5CF6]" : "text-[#A1A1AA]"}`}
                />
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-white" : "text-[#A1A1AA]"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
