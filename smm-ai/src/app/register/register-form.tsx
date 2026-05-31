"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authInputClass, authLabelClass } from "@/components/auth-form-styles";
import { ErrorBanner, PrimaryButton } from "@/components/page-shell";
import { isExistingUserSignUp, mapAuthError } from "@/lib/auth-errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(mapAuthError(signUpError, "register"));
      return;
    }

    if (isExistingUserSignUp(data.user)) {
      setLoading(false);
      setError("Email уже существует");
      return;
    }

    if (data.session) {
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(mapAuthError(signInError, "login"));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <label className="block">
        <span className={authLabelClass}>Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@restaurant.ru"
          className={authInputClass}
        />
      </label>

      <label className="block">
        <span className={authLabelClass}>Пароль</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 6 символов"
          className={authInputClass}
        />
      </label>

      <label className="block">
        <span className={authLabelClass}>Подтверждение пароля</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Повторите пароль"
          className={authInputClass}
        />
      </label>

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "Регистрация…" : "Создать аккаунт"}
      </PrimaryButton>
    </form>
  );
}
