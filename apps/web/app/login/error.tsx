"use client";

import { useTranslation } from "@lsu/i18n";

import { Button } from "@/_components/button";

export default function LoginError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation("auth");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border-subtle bg-surface-raised p-8 text-center">
        <p className="text-sm text-red-400">{error.message || t("auth_error")}</p>
        <Button variant="secondary" onClick={reset}>
          {t("try_again", { ns: "common" })}
        </Button>
      </div>
    </main>
  );
}
