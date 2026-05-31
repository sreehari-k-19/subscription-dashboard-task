import { User } from "lucide-react";
import { ProfileForm } from "@features/profile/components/ProfileForm";
import { NotificationsSection } from "@features/profile/components/NotificationsSection";

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
          <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Profile</h1>
      </div>

      <ProfileForm />
      <NotificationsSection />
    </div>
  );
}
