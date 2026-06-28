"use client";

import { useTranslation } from "@lsu/i18n";

import { Button } from "@/_components/button";

export default function ModulesError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
        {error.message || t("error")}
      </div>
      <Button variant="secondary" onClick={reset}>
        {t("try_again")}
      </Button>
    </div>
  );
}
