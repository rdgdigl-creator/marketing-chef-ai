import { authDividerClass } from "@/components/auth-form-styles";

export function AuthDivider({ text = "или" }: { text?: string }) {
  return (
    <div className={authDividerClass}>
      <span className="h-px flex-1 bg-white/10" />
      <span>{text}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
