import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация — Marketing Chef AI",
  description: "Создайте аккаунт Marketing Chef AI",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт с email и паролем"
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#A78BFA] hover:text-[#8B5CF6]">
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
