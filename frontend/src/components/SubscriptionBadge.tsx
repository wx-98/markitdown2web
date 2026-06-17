import { Crown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function SubscriptionBadge() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.subscription_plan === "free") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Crown size={12} />
      PRO
    </span>
  );
}
