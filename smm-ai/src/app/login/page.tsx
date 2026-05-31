import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell from "@/components/auth-shell";
import { LoadingSpinner } from "@/components/page-shell";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Вход — Marketing Chef AI",
  description: "Войдите в Marketing Chef AI",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Вход в аккаунт"
      subtitle="Введите email и пароль для входа"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[#A78BFA] hover:text-[#8B5CF6]">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <Suspense fallback={<LoadingSpinner label="Загрузка…" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
