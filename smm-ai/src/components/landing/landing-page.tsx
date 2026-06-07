"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/page-shell";
import { ArrowRight } from "@/components/ui/icon";

const easePremium = [0.22, 1, 0.36, 1] as const;

export function LandingPage() {
  return (
    <div className="premium-bg relative flex min-h-screen flex-col overflow-hidden">
      <div className="premium-orb premium-orb-1" />
      <div className="premium-orb premium-orb-2" />
      <div className="premium-orb premium-orb-3" />

      <header className="relative z-[100] mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 lg:px-8">
        <Logo />
        <Link
          href="/login"
          className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-[#A1A1AA] hover:text-white"
        >
          Войти
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="flex max-w-2xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: easePremium }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/25 blur-3xl" />
            <Image
              src="/ai-director.png"
              alt="AI-директор по маркетингу"
              width={160}
              height={160}
              priority
              className="relative h-36 w-36 rounded-full object-cover ring-1 ring-[#8B5CF6]/40 md:h-40 md:w-40"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easePremium, delay: 0.1 }}
            className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl"
          >
            Ваш <span className="gradient-text-primary">AI-директор</span> по маркетингу
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easePremium, delay: 0.2 }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-[#A1A1AA]"
          >
            Анализирует бизнес, предлагает решения, создаёт контент и помогает
            увеличивать продажи.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easePremium, delay: 0.3 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/login"
              className="btn-glass inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-medium text-white"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="btn-primary group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-medium text-white"
            >
              Начать работу
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 px-5 pb-8 text-center text-xs text-[#A1A1AA]/70">
        © 2026 Marketing Chef AI
      </footer>
    </div>
  );
}
