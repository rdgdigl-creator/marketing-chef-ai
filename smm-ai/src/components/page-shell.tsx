import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthNav } from "@/components/auth-nav";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowRight } from "@/components/ui/icon";
import { DESKTOP_NAV } from "@/lib/navigation";

export function Logo({ size = 36, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Image src="/logo.svg" alt="Marketing Chef AI" width={size} height={size} priority />
        <div className="absolute inset-0 rounded-[10px] bg-[#8B5CF6]/20 blur-md" />
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white">
            Marketing Chef AI
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#A1A1AA]">
            AI-маркетолог для ресторанов
          </span>
        </div>
      )}
    </div>
  );
}

type PageShellProps = {
  children: ReactNode;
  activeFeature?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  showBottomNav?: boolean;
};

export default function PageShell({
  children,
  activeFeature,
  title,
  subtitle,
  badge,
  showBottomNav = true,
}: PageShellProps) {
  return (
    <div className="premium-bg relative min-h-screen overflow-hidden">
      <div className="premium-orb premium-orb-1" />
      <div className="premium-orb premium-orb-2" />
      <div className="premium-orb premium-orb-3" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <span className="md:hidden"><Logo size={32} compact /></span>
          <span className="hidden md:inline-block"><Logo /></span>
        </Link>

        <nav className="hidden items-center gap-0.5 text-sm lg:flex">
          {DESKTOP_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                activeFeature === link.href
                  ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                  : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-2 border-l border-white/[0.08] pl-4">
            <AuthNav />
          </div>
        </nav>
      </header>

      <main className={`relative z-10 mx-auto max-w-6xl px-5 lg:px-8 ${showBottomNav ? "pb-nav-safe md:pb-16" : "pb-16"}`}>
        {(badge || title) && (
          <div className="mb-10">
            {badge && (
              <p className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.06] px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-[#8B5CF6]">
                <span className="h-1 w-1 rounded-full bg-[#8B5CF6]" />
                {badge}
              </p>
            )}
            {title && (
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#A1A1AA]">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6]" />
        <div className="absolute inset-1 animate-pulse rounded-full bg-[#8B5CF6]/10" />
      </div>
      {label && <p className="text-sm text-[#A1A1AA]">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/[0.06] px-4 py-3 text-sm text-[#06B6D4] backdrop-blur-sm">
      {message}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-glass inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-[#A1A1AA] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  rows?: number;
}) {
  const className =
    "w-full rounded-xl border border-white/[0.08] bg-[#111111]/60 px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA]/60 outline-none backdrop-blur-sm transition-all duration-200 focus:border-[#8B5CF6]/40 focus:bg-[#111111] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#A1A1AA]">{label}</span>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

export function ResultCard({
  title,
  children,
  index,
}: {
  title: string;
  children: ReactNode;
  index?: number;
}) {
  return (
    <div className="glass-card card-shine group rounded-2xl p-5 transition-all duration-300 hover:border-[#8B5CF6]/20 hover:shadow-[0_8px_32px_rgba(139,92,246,0.08)]">
      <div className="flex items-start gap-3">
        {index !== undefined && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-xs font-bold text-[#8B5CF6]">
            {index}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <div className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function FeatureLinkCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="feature-card glass-card card-shine group flex h-full flex-col rounded-2xl p-6"
    >
      <div className="mb-4 inline-flex rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-3 text-[#8B5CF6] transition-all duration-300 group-hover:border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/10 group-hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#A1A1AA]">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#8B5CF6] opacity-0 transition-all duration-300 group-hover:opacity-100">
        Открыть
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
