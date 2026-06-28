"use client";

import { useState, useEffect } from "react";

import { isElectron } from "@lsu/electron-bridge";
import type { AssetTreeNode } from "@lsu/electron-bridge";
import {
  useElectronStore,
  useOBSElectron,
  useBackupStore,
  useSyncStore,
} from "@lsu/electron-bridge/hooks";
import { useTranslation } from "@lsu/i18n";

import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { Input } from "@/_components/input";
import { PageWrapper } from "@/_components/page-wrapper";

type Tab = "general" | "assets" | "obs" | "backups" | "sync";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function SettingsPage() {
  const electron = isElectron();
  const [tab, setTab] = useState<Tab>("general");
  const { t } = useTranslation("settings");

  const tabs: { id: Tab; labelKey: string; electronOnly?: boolean }[] = [
    { id: "general", labelKey: "tab_general" },
    { id: "assets", labelKey: "tab_assets", electronOnly: true },
    { id: "obs", labelKey: "tab_obs", electronOnly: true },
    { id: "backups", labelKey: "tab_backups", electronOnly: true },
    { id: "sync", labelKey: "tab_sync", electronOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.electronOnly || electron);

  return (
    <PageWrapper title={t("title")} subtitle={t("subtitle")}>
      <div className="flex gap-2 border-b border-border-subtle pb-3 mb-6">
        {visibleTabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === tabItem.id
                ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-400"
                : "text-text-muted hover:text-gray-300"
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab />}
      {tab === "assets" && electron && <AssetsTab />}
      {tab === "obs" && electron && <OBSTab />}
      {tab === "backups" && electron && <BackupsTab />}
      {tab === "sync" && electron && <SyncTab />}
    </PageWrapper>
  );
}

function GeneralTab() {
  const { t, i18n } = useTranslation("settings");

  const LANGUAGE_LABELS: Record<string, string> = {
    pl: "Polski",
    en: "English",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-1">{t("language_title")}</h3>
        <p className="text-xs text-text-muted mb-3">{t("language_description")}</p>
        <div className="flex gap-2">
          {(["pl", "en"] as const).map((lng) => (
            <button
              key={lng}
              onClick={() => i18n.changeLanguage(lng)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                i18n.language === lng
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-400"
                  : "text-text-muted hover:text-gray-300 border border-border-subtle"
              }`}
            >
              {LANGUAGE_LABELS[lng]}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-1">{t("env_title")}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isElectron() ? "success" : "info"}>
            {isElectron() ? t("env_desktop") : t("env_web")}
          </Badge>
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-1">{t("theme_title")}</h3>
        <p className="text-xs text-text-muted">{t("theme_description")}</p>
      </div>
    </div>
  );
}

function AssetsTab() {
  const {
    cacheStats,
    assetTree,
    integrityResults,
    loading,
    refreshCacheStats,
    refreshAssetTree,
    runIntegrityCheck,
    clearCache,
  } = useElectronStore();
  const { t } = useTranslation("settings");

  useEffect(() => {
    refreshCacheStats();
    refreshAssetTree();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">{t("assets_cache_title")}</h3>
        {cacheStats ? (
          <div className="flex gap-6 text-sm mb-3">
            <div>
              <span className="text-text-muted">{t("assets_files")}</span>{" "}
              <span className="font-medium">{cacheStats.totalFiles}</span>
            </div>
            <div>
              <span className="text-text-muted">{t("assets_size")}</span>{" "}
              <span className="font-medium">{formatBytes(cacheStats.totalSize)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">{t("loading", { ns: "common" })}</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              refreshCacheStats();
              refreshAssetTree();
            }}
            disabled={loading}
          >
            {t("refresh", { ns: "common" })}
          </Button>
          <Button variant="secondary" size="sm" onClick={clearCache} disabled={loading}>
            {t("assets_clear_cache")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">{t("assets_folder_title")}</h3>
        {assetTree && assetTree.length > 0 ? (
          <div className="max-h-80 overflow-y-auto rounded-md border border-border-subtle bg-surface p-2 font-mono text-xs">
            {assetTree.map((node) => (
              <TreeNodeView key={node.name} node={node} depth={0} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">{t("assets_empty")}</p>
        )}
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">{t("assets_integrity_title")}</h3>
        {integrityResults ? (
          <div className="flex gap-6 text-sm mb-3">
            <div>
              <Badge variant="success">
                {t("assets_valid", { count: integrityResults.valid })}
              </Badge>
            </div>
            <div>
              <Badge variant="error">
                {t("assets_corrupted", { count: integrityResults.corrupted })}
              </Badge>
            </div>
            <div>
              <Badge variant="warning">
                {t("assets_missing", { count: integrityResults.missing })}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">{t("assets_run_hint")}</p>
        )}
        <Button variant="secondary" size="sm" onClick={runIntegrityCheck} disabled={loading}>
          {loading ? t("assets_checking") : t("assets_run_check")}
        </Button>
      </div>
    </div>
  );
}

function TreeNodeView({ node, depth }: { node: AssetTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const childCount = isDir ? (node.children?.length ?? 0) : 0;

  return (
    <div>
      <button
        onClick={() => isDir && setExpanded((v) => !v)}
        className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-surface-overlay ${isDir ? "cursor-pointer" : "cursor-default"}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {isDir ? (
          <span className={`text-text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        ) : (
          <span className="text-text-muted opacity-0">▸</span>
        )}
        <span className={isDir ? "text-indigo-400" : "text-gray-300"}>{node.name}</span>
        {isDir && <span className="text-text-muted ml-1">({childCount})</span>}
        {!isDir && node.size != null && (
          <span className="ml-auto text-text-muted">{formatBytes(node.size)}</span>
        )}
      </button>
      {isDir &&
        expanded &&
        node.children?.map((child) => (
          <TreeNodeView key={child.name} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function OBSTab() {
  const { connected, scenes, currentScene, connecting, error, connect, disconnect, switchScene } =
    useOBSElectron();
  const [url, setUrl] = useState("ws://localhost:4455");
  const [password, setPassword] = useState("");
  const { t } = useTranslation("settings");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">{t("obs_connection_title")}</h3>
          <Badge variant={connected ? "success" : "default"}>
            {connected
              ? t("obs_connected")
              : connecting
                ? t("obs_connecting")
                : t("obs_disconnected")}
          </Badge>
        </div>
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        {!connected ? (
          <div className="space-y-3">
            <Input
              label={t("obs_ws_url")}
              id="obs-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              label={t("obs_password")}
              id="obs-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => connect(url, password || undefined)}
              disabled={connecting}
            >
              {connecting ? t("obs_connecting") : t("obs_connect")}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={disconnect}>
            {t("obs_disconnect")}
          </Button>
        )}
      </div>

      {connected && (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
          <h3 className="text-sm font-medium mb-3">{t("obs_scenes_title")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {(scenes as Array<{ sceneName?: string }>).map((s) => {
              const name = s.sceneName ?? String(s);
              const active = name === currentScene;

              return (
                <button
                  key={name}
                  onClick={() => switchScene(name)}
                  className={`rounded-md px-3 py-2 text-sm transition-colors border ${
                    active
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                      : "border-border-subtle bg-surface hover:bg-surface-overlay text-text-muted"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BackupsTab() {
  const { backups, loading, refreshBackups, createBackup, restoreBackup, deleteBackup } =
    useBackupStore();
  const { t } = useTranslation("settings");

  useEffect(() => {
    refreshBackups();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{t("backups_title")}</h3>
        <Button size="sm" onClick={createBackup} disabled={loading}>
          {t("backups_create")}
        </Button>
      </div>

      {backups.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-8 text-center text-sm text-text-muted">
          {t("backups_empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-3"
            >
              <span className="text-sm font-mono text-text-muted">{b.id}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => restoreBackup(b.id)}
                  disabled={loading}
                >
                  {t("backups_restore")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(t("backups_confirm_delete"))) deleteBackup(b.id);
                  }}
                  disabled={loading}
                >
                  {t("delete", { ns: "common" })}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncTab() {
  const { status, syncing, lastResult, refreshStatus, fullSync, push, pull, resetSync } =
    useSyncStore();
  const { t } = useTranslation("settings");

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">{t("sync_title")}</h3>
          <Badge variant={syncing ? "warning" : status?.lastSyncedAt ? "success" : "default"}>
            {syncing
              ? t("sync_syncing")
              : status?.lastSyncedAt
                ? t("sync_active")
                : t("sync_never_synced")}
          </Badge>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-text-muted">{t("sync_last")}</span>
            <span>
              {status?.lastSyncedAt
                ? new Date(status.lastSyncedAt).toLocaleString()
                : t("sync_never_synced")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{t("sync_pending")}</span>
            <span className={status?.pendingChanges ? "text-amber-300" : ""}>
              {status?.pendingChanges ?? 0}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => fullSync()} disabled={syncing}>
            {syncing ? t("sync_syncing") : t("sync_now")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => push()} disabled={syncing}>
            {t("sync_push_only")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => pull()} disabled={syncing}>
            {t("sync_pull_only")}
          </Button>
        </div>
      </div>

      {lastResult && (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
          <h3 className="text-sm font-medium mb-3">{t("sync_result_title")}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-emerald-400">{lastResult.pushed}</p>
              <p className="text-xs text-text-muted">{t("sync_pushed")}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-indigo-400">{lastResult.pulled}</p>
              <p className="text-xs text-text-muted">{t("sync_pulled")}</p>
            </div>
            <div>
              <p
                className={`text-lg font-semibold ${lastResult.conflicts > 0 ? "text-amber-400" : "text-text-muted"}`}
              >
                {lastResult.conflicts}
              </p>
              <p className="text-xs text-text-muted">{t("sync_conflicts")}</p>
            </div>
          </div>
          {lastResult.errors.length > 0 && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2">
              {lastResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-2">{t("sync_danger_title")}</h3>
        <p className="text-xs text-text-muted mb-3">{t("sync_danger_description")}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm(t("sync_confirm_reset"))) resetSync();
          }}
        >
          {t("sync_reset")}
        </Button>
      </div>
    </div>
  );
}
