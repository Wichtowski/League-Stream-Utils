"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { HiCloud, HiComputerDesktop } from "react-icons/hi2";

import { isElectron } from "@lsu/electron-bridge";
import { useAppMode } from "@lsu/electron-bridge/hooks";
import { useTranslation } from "@lsu/i18n";

import { useAuth } from "@/_components/auth-provider";
import { LinkButton } from "@/_components/button";

function ModeSelection() {
  const { setMode } = useAppMode();
  const router = useRouter();
  const { t } = useTranslation("auth");

  const chooseMode = async (mode: "online" | "offline") => {
    await setMode(mode);
    if (mode === "offline") {
      document.cookie = "app_mode=offline; path=/; max-age=31536000; SameSite=Lax";
      router.push("/modules");
    } else {
      document.cookie = "app_mode=; path=/; max-age=0";
      router.push("/login");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          {t("app_name")}
        </h1>
        <p className="mt-3 text-text-muted">{t("choose_mode")}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => chooseMode("online")}
          className="group flex w-56 flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6 transition-all duration-200 hover:border-indigo-500/50 hover:bg-surface-overlay"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 transition-transform duration-200 group-hover:scale-110">
            <HiCloud className="text-2xl text-indigo-400" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-gray-200">{t("online_mode")}</h2>
            <p className="mt-1 text-xs text-text-muted">{t("online_description")}</p>
          </div>
        </button>

        <button
          onClick={() => chooseMode("offline")}
          className="group flex w-56 flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6 transition-all duration-200 hover:border-emerald-500/50 hover:bg-surface-overlay"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 transition-transform duration-200 group-hover:scale-110">
            <HiComputerDesktop className="text-2xl text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-gray-200">{t("offline_mode")}</h2>
            <p className="mt-1 text-xs text-text-muted">{t("offline_description")}</p>
          </div>
        </button>
      </div>
    </main>
  );
}

export default function HomePage() {
  const { user, loading, appMode, debug } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation("auth");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && user) router.replace("/modules");
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        {mounted && process.env.NODE_ENV === "development" && (
          <p className="max-w-md text-center font-mono text-[11px] text-text-muted">{debug}</p>
        )}
      </main>
    );
  }

  if (user) return null;

  if (isElectron() && appMode === null) {
    return <ModeSelection />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
          {t("app_name")}
        </h1>
        <p className="mt-3 text-text-muted">{t("streaming_tools")}</p>
      </div>
      <LinkButton href="/login">{t("sign_in")}</LinkButton>
    </main>
  );
}
