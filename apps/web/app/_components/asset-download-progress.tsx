"use client";

import { useEffect } from "react";

import { isElectron } from "@lsu/electron-bridge";
import { useDownloadProgress } from "@lsu/electron-bridge/hooks";
import { useTranslation } from "@lsu/i18n";

const CATEGORY_KEYS: Record<string, string> = {
  champions: "download_champions",
  items: "download_items",
  runes: "download_runes",
  spells: "download_spells",
};

const CATEGORY_COLORS: Record<string, string> = {
  champions: "#d946ef",
  items: "#3b82f6",
  runes: "#f97316",
  spells: "#22c55e",
};

export function AssetDownloadProgress() {
  const { categories, active, subscribe } = useDownloadProgress();
  const { t } = useTranslation("modules");

  useEffect(() => {
    if (!isElectron()) return;
    const unsub = subscribe();

    return unsub;
  }, [subscribe]);

  if (!isElectron() || !active || Object.keys(categories).length === 0) return null;

  const entries = Object.entries(categories);
  const totalDone = entries.reduce((sum, [, p]) => sum + p.current, 0);
  const totalAll = entries.reduce((sum, [, p]) => sum + p.total, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-200">{t("download_title")}</span>
        <span className="text-xs text-text-muted">{overallPct}%</span>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${overallPct}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }}
        />
      </div>

      <div className="space-y-2">
        {entries.map(([key, p]) => {
          const color = CATEGORY_COLORS[key] ?? "#71717a";
          const label = CATEGORY_KEYS[key] ? t(CATEGORY_KEYS[key]) : key;
          const done = p.stage === "complete";

          return (
            <div key={key} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="min-w-0 flex-1 truncate text-xs text-gray-300">
                {label}
                {!done && p.itemName ? ` — ${p.itemName}` : ""}
              </span>
              <span className="text-xs text-text-muted">
                {done ? "✓" : `${p.current}/${p.total}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
