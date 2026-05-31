import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@lib/cn";
import { useLogin, getLoginErrorMessage } from "../api/auth.api";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((d) =>
        login.mutate(d, {
          onError: (err) => setError("root", { message: getLoginErrorMessage(err) }),
        })
      )}
      className="space-y-4"
    >
      {errors.root && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          {...register("email", { onChange: () => clearErrors("root") })}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
            errors.email
              ? "border-red-400 dark:border-red-600"
              : "border-zinc-300 dark:border-zinc-700"
          )}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password", { onChange: () => clearErrors("root") })}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-zinc-400",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
              "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
              errors.password
                ? "border-red-400 dark:border-red-600"
                : "border-zinc-300 dark:border-zinc-700"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={login.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link
          to={planParam ? `/register?plan=${planParam}` : "/register"}
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
