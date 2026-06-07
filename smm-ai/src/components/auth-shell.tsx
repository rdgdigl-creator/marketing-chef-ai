import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/page-shell";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
};

export default function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <div className="premium-bg relative min-h-screen overflow-hidden">
      <div className="premium-orb premium-orb-1" />
      <div className="premium-orb premium-orb-2" />

      <header className="relative z-10 mx-auto flex max-w-lg items-center justify-between px-6 py-6">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo size={32} />
        </Link>
        <Link
          href="/"
          className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
        >
          На главную
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-6 pb-16">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-5 w-fit">
            <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/25 blur-2xl" />
            <Image
              src="/ai-director.png"
              alt="AI-директор по маркетингу"
              width={72}
              height={72}
              priority
              className="relative h-[72px] w-[72px] rounded-full object-cover ring-1 ring-[#8B5CF6]/40"
            />
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.06] px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-[#8B5CF6]">
            AI-директор по маркетингу
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{subtitle}</p>
          )}
        </div>

        <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-[#A1A1AA]">{footer}</div>}
      </main>
    </div>
  );
}
