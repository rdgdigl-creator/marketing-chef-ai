"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BottomNav } from "@/components/bottom-nav";
import { FeatureLinkCard, Logo } from "@/components/page-shell";
import {
  ArrowRight,
  Camera,
  LogIn,
  Megaphone,
  PenLine,
  Play,
  Search,
  Sparkles,
} from "@/components/ui/icon";
import { MAIN_MODULES } from "@/lib/navigation";
import { DashboardPreview } from "./dashboard-preview";

const easePremium = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easePremium, delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const stats = [
  { value: "+27%", label: "продажи", description: "Средний рост выручки за 3 месяца" },
  { value: "+41%", label: "охват", description: "Увеличение аудитории в соцсетях" },
  { value: "+18%", label: "средний чек", description: "Рост через AI-акции и upsell" },
];

const processSteps = [
  { icon: Camera, label: "Загрузите материалы" },
  { icon: Search, label: "AI анализирует" },
  { icon: PenLine, label: "Готовый контент" },
  { icon: Megaphone, label: "Реклама и продажи" },
];

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="premium-bg relative min-h-screen overflow-hidden">
      <div className="premium-orb premium-orb-1" />
      <div className="premium-orb premium-orb-2" />
      <div className="premium-orb premium-orb-3" />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10"
      >
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[#A1A1AA] md:flex">
          <a href="#modules" className="transition-colors hover:text-white">Модули</a>
          <a href="#results" className="transition-colors hover:text-white">Результаты</a>
          <a href="#how-it-works" className="transition-colors hover:text-white">Как работает</a>
          <Link
            href="/login"
            className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white"
          >
            <LogIn size={16} />
            Войти
          </Link>
        </nav>
        <Link
          href="/login"
          className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white md:hidden"
        >
          <LogIn size={16} />
          Войти
        </Link>
      </motion.header>

      <main className="relative z-10 pb-nav-safe md:pb-0">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-6 lg:px-10 lg:pb-32 lg:pt-12">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.06] px-4 py-1.5 text-sm text-[#8B5CF6]"
              >
                <Sparkles size={14} />
                AI-маркетолог для HoReCa
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]"
              >
                Ваш AI-маркетолог{" "}
                <span className="gradient-text-primary">для ресторанов</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.2}
                className="mt-6 max-w-lg text-lg leading-relaxed text-[#A1A1AA]"
              >
                Загружайте фото, видео, документы или информацию о бизнесе и получайте
                готовые маркетинговые решения, рекламу, идеи контента и рекомендации по
                росту продаж.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.3}
                className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/register"
                  className="btn-primary group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-medium text-white"
                >
                  Начать бесплатно
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="btn-glass inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-medium text-white"
                >
                  <Play size={14} className="text-[#A1A1AA]" />
                  Смотреть демо
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative lg:pl-4"
            >
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        <section id="results" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
              Результаты клиентов
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Цифры, которые говорят сами за себя
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="stat-card glass-card card-shine rounded-2xl p-8 text-center"
              >
                <p className="text-4xl font-semibold tracking-tight gradient-text-primary md:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-lg font-medium text-white">{stat.label}</p>
                <p className="mt-2 text-sm text-[#A1A1AA]">{stat.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section id="modules" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
              Инструменты
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Всё для маркетинга вашего ресторана
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#A1A1AA]">
              Пять модулей — от фото до стратегии. Без технических терминов, только
              готовые маркетинговые решения.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {MAIN_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <motion.div key={module.href} variants={fadeUp} className="flex">
                  <FeatureLinkCard
                    href={module.href}
                    title={module.label}
                    description={module.description}
                    icon={<Icon size={24} />}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
              Как это работает
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              От материалов до продаж за 4 шага
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  variants={fadeUp}
                  whileHover={prefersReducedMotion ? {} : { y: -4 }}
                  className="glass-card card-shine rounded-2xl p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] text-[#8B5CF6]">
                    <Icon size={24} />
                  </div>
                  <p className="text-xs font-medium text-[#A1A1AA]">Шаг {i + 1}</p>
                  <p className="mt-1 text-sm font-medium text-white">{step.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-10 lg:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111111]/60 px-8 py-16 text-center backdrop-blur-xl md:px-16"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(139,92,246,0.12),transparent)]" />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Готовы увеличить продажи?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[#A1A1AA]">
                Начните бесплатно — без карты, без обязательств. Первые результаты уже через неделю.
              </p>
              <Link
                href="/register"
                className="btn-primary mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-medium text-white"
              >
                Начать бесплатно
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 hidden border-t border-white/[0.06] md:block">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#A1A1AA] md:flex-row lg:px-10">
          <Logo />
          <p>© 2026 Marketing Chef AI. AI-маркетолог для ресторанов.</p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
