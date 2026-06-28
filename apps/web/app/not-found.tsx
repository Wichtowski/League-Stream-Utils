"use client";

import { useTranslation } from "@lsu/i18n";

import { LinkButton } from "@/_components/button";

export default function NotFound() {
  const { t } = useTranslation("auth");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-text-muted">404</h1>
      <p className="text-text-muted">{t("not_found_message")}</p>
      <LinkButton href="/" variant="secondary" size="sm">
        {t("go_home")}
      </LinkButton>
    </main>
  );
}
