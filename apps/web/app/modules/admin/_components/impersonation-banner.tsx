"use client";

import { useRouter } from "next/navigation";

import { useApiClient } from "@lsu/api-client/context";
import { useTranslation } from "@lsu/i18n";

import { useAuth } from "@/_components/auth-provider";

export function ImpersonationBanner() {
  const { user } = useAuth();
  const api = useApiClient();
  const router = useRouter();
  const { t } = useTranslation("admin");

  if (!user?.impersonatedBy) return null;

  const endImpersonation = async () => {
    await api.post("/api/v1/auth/logout");
    router.push("/modules/admin");
  };

  return (
    <div className="fixed top-0 left-56 right-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <span>
        {t("impersonation_banner")} <strong>{user.username}</strong>
      </span>
      <button
        onClick={endImpersonation}
        className="rounded bg-black/20 px-3 py-1 text-xs font-semibold hover:bg-black/30 transition-colors"
      >
        {t("impersonation_end")}
      </button>
    </div>
  );
}
