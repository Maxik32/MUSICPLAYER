import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/useAuthStore";

type Mode = "login" | "register";

type FormValues = {
  email: string;
  password: string;
};

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(null);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUp);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { email: "", password: "" } });

  if (!open) return null;

  const onSubmit = async (v: FormValues) => {
    setMessage(null);
    try {
      if (mode === "login") {
        await signInWithPassword(v.email.trim(), v.password);
        reset();
        onClose();
      } else {
        await signUp(v.email.trim(), v.password);
        setMessage(
          "Аккаунт создан. Проверьте почту (если включено подтверждение) и войдите."
        );
        setMode("login");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err.message ?? "Ошибка");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="ios-list w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="ios-list-header flex items-center justify-between">
          <span id="auth-title">
            {mode === "login" ? "Вход" : "Регистрация"}
          </span>
          <button
            type="button"
            className="rounded border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white"
            onClick={() => {
              onClose();
              setMessage(null);
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 bg-gradient-to-b from-white to-[#f4f4f4] p-4"
        >
          <div>
            <label className="mb-1 block text-[11px] font-bold text-neutral-700">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="inset-field"
              {...register("email", { required: "Укажите email" })}
            />
            {errors.email ? (
              <p className="mt-1 text-[10px] font-bold text-red-700">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-neutral-700">
              Пароль
            </label>
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="inset-field"
              {...register("password", {
                required: "Укажите пароль",
                minLength: { value: 6, message: "Минимум 6 символов" },
              })}
            />
            {errors.password ? (
              <p className="mt-1 text-[10px] font-bold text-red-700">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {message ? (
            <p className="rounded border border-amber-400/80 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-950">
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 pt-1">
            <button type="submit" className="glossy-btn glossy-btn--primary w-full">
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
            <button
              type="button"
              className="glossy-btn w-full text-[12px]"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage(null);
              }}
            >
              {mode === "login"
                ? "Нет аккаунта? Регистрация"
                : "Уже есть аккаунт? Вход"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
