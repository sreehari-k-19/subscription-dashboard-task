import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@lib/cn";
import { useRegister, getRegisterErrorMessage } from "../api/auth.api";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const register_ = useRegister();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit(({ name, email, password }) =>
        register_.mutate({ name, email, password }, {
          onError: (err) => setError("root", { message: getRegisterErrorMessage(err) }),
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
          Full name
        </label>
        <input
          {...register("name")}
          type="text"
          autoComplete="name"
          placeholder="John Smith"
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
            errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
          )}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
            errors.email ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
          )}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-zinc-400",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
              "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
              errors.password ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Confirm password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600",
            errors.confirmPassword ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
          )}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={register_.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {register_.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          to={planParam ? `/login?plan=${planParam}` : "/login"}
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
