"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authInputClass, authLabelClass } from "@/components/auth-form-styles";
import { ErrorBanner, PrimaryButton } from "@/components/page-shell";
import { mapAuthError } from "@/lib/auth-errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(mapAuthError(signInError, "login"));
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div>
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={authInputClass}
          />
        </label>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Вход…" : "Войти"}
        </PrimaryButton>
      </form>
    </div>
  );
}
