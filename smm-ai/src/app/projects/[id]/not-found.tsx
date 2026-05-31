import Image from "next/image";
import Link from "next/link";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/logo.svg" alt="Marketing Chef AI" width={36} height={36} priority />
      <span className="text-base font-semibold tracking-tight text-white">
        Marketing Chef{" "}
        <span className="text-[#8B5CF6]">AI</span>
      </span>
    </div>
  );
}

export default function ProjectNotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0 glow-orange" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center lg:px-8">
        <h1 className="text-3xl font-semibold text-white">Проект не найден</h1>
        <p className="mt-4 max-w-md text-zinc-400">
          Возможно, проект был удалён или ссылка указана неверно.
        </p>
        <Link
          href="/projects"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-8 text-sm font-medium text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:bg-[#7C3AED]"
        >
          К списку проектов
        </Link>
      </main>
    </div>
  );
}
