import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { useUpdateProfile } from "../api/profile.api";
import { useAuthStore } from "@store/authStore";
import { cn } from "@lib/cn";

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm() {
  const updateProfile = useUpdateProfile();
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Personal details</h2>
      <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{user?.name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
            <input
              {...register("name")}
              className={cn(
                "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors dark:bg-zinc-800 dark:text-zinc-50",
                "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
            <input
              {...register("phone")}
              placeholder="+1 234 567 8900"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="submit"
            disabled={updateProfile.isPending || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
