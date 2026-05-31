import type { AuthError, User } from "@supabase/supabase-js";

type AuthErrorContext = "login" | "register";

export function mapAuthError(error: AuthError, context: AuthErrorContext): string {
  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (context === "register") {
    if (
      code === "user_already_exists" ||
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("user already registered")
    ) {
      return "Email уже существует";
    }
  }

  if (context === "login") {
    if (code === "user_not_found" || message.includes("user not found")) {
      return "Пользователь не найден";
    }

    if (
      code === "invalid_credentials" ||
      message.includes("invalid login credentials") ||
      message.includes("invalid email or password")
    ) {
      return "Неверный пароль";
    }

    if (message.includes("email not confirmed")) {
      return "Подтвердите email перед входом";
    }
  }

  if (message.includes("password") && message.includes("6")) {
    return "Пароль должен быть не менее 6 символов";
  }

  if (message.includes("invalid email") || message.includes("unable to validate email")) {
    return "Некорректный email";
  }

  return error.message;
}

export function isExistingUserSignUp(user: User | null): boolean {
  return Boolean(user?.identities && user.identities.length === 0);
}
