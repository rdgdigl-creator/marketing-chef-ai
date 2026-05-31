"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Sparkles, UtensilsCrossed } from "@/components/ui/icon";

const easePremium = [0.22, 1, 0.36, 1] as const;

const miniBars = [40, 65, 45, 80, 55, 90, 70];

export function DashboardPreview() {
  return (
    <div className="dashboard-3d relative mx-auto w-full max-w-lg lg:max-w-none">
      <motion.div
        initial={{ opacity: 0, y: 40, rotateY: -20 }}
        animate={{ opacity: 1, y: 0, rotateY: -10 }}
        transition={{ duration: 1, ease: easePremium, delay: 0.2 }}
        className="dashboard-panel relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/80 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
            </div>
            <span className="ml-2 text-xs font-medium text-[#A1A1AA]">
              Creative Marketing Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06B6D4] opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#06B6D4]" />
            </span>
            <span className="text-xs text-[#06B6D4]">Live</span>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="rounded-xl border border-white/[0.06] bg-[#070707]/60 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.08] text-[#8B5CF6]">
                <UtensilsCrossed size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-[#A1A1AA]">Анализ блюда</p>
                <p className="text-sm font-semibold text-white">Стейк рибай</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Популярность</span>
                <span className="font-medium text-[#8B5CF6]">92%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                />
              </div>
              <p className="text-xs leading-relaxed text-[#A1A1AA]">
                Premium-позиция · высокая маржа
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="rounded-xl border border-white/[0.06] bg-[#070707]/60 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-[#A1A1AA]">Рост продаж</p>
              <span className="rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-2 py-0.5 text-xs font-semibold text-[#8B5CF6]">
                +27%
              </span>
            </div>
            <div className="flex h-16 items-end gap-1">
              {miniBars.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.9 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                  className="flex-1 rounded-sm bg-gradient-to-t from-[#8B5CF6]/50 to-[#8B5CF6]"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#A1A1AA]">За последние 30 дней</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="rounded-xl border border-white/[0.06] bg-[#070707]/60 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#06B6D4]/15 bg-[#06B6D4]/[0.08] text-[#06B6D4]">
                <Calendar size={16} />
              </div>
              <p className="text-xs font-medium text-[#A1A1AA]">Контент-план</p>
            </div>
            <div className="space-y-2">
              {[
                { day: "Пн", type: "Reels", opacity: "opacity-100" },
                { day: "Ср", type: "Stories", opacity: "opacity-60" },
                { day: "Пт", type: "Пост", opacity: "opacity-40" },
              ].map((item, i) => (
                <motion.div
                  key={item.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-6 text-xs font-medium text-[#A1A1AA]">{item.day}</span>
                  <div className={`h-1.5 flex-1 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] ${item.opacity}`} />
                  <span className="text-xs text-white">{item.type}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.04] p-4 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                <Sparkles size={16} />
              </div>
              <p className="text-xs font-medium text-[#8B5CF6]">AI рекомендации</p>
            </div>
            <p className="text-xs leading-relaxed text-[#A1A1AA]">
              Запустите акцию «Стейк + вино» в пятницу — прогноз{" "}
              <span className="font-semibold text-white">+18% к чеку</span>
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.08] px-2.5 py-1 text-xs text-[#8B5CF6]"
            >
              Применить
              <ArrowRight size={12} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 left-1/4 h-16 w-1/3 -translate-x-1/2 rounded-full bg-[#06B6D4]/10 blur-2xl" />
    </div>
  );
}
