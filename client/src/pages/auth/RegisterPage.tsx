import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { RegisterForm } from "@features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Get started with SubDash today
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <RegisterForm />
        </div>
      </motion.div>
    </div>
  );
}
