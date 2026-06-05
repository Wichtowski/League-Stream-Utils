"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useRouter, usePathname } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@lsu/i18n";

import { useAuth } from "@/_components/auth-provider";

interface Command {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isInput) {
        e.preventDefault();
        if (pathname.startsWith("/modules/tournaments")) {
          router.push("/modules/tournaments/new");
        } else {
          router.push("/modules/teams/new");
        }
      }
      if (e.key === "/" && !isInput && !isOpen) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
        );
        searchInput?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pathname, router]);

  return (
    <CommandPaletteContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && <CommandPaletteModal onClose={close} />}
    </CommandPaletteContext.Provider>
  );
}

function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const _pathname = usePathname();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation("nav");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: "nav-draft",
      label: t("cmd_go_to_draft"),
      group: t("cmd_group_navigation"),
      shortcut: "",
      action: () => router.push("/modules/draft"),
    },
    {
      id: "nav-tournaments",
      label: t("cmd_go_to_tournaments"),
      group: t("cmd_group_navigation"),
      action: () => router.push("/modules/tournaments"),
    },
    {
      id: "nav-teams",
      label: t("cmd_go_to_teams"),
      group: t("cmd_group_navigation"),
      action: () => router.push("/modules/teams"),
    },
    {
      id: "nav-cameras",
      label: t("cmd_go_to_cameras"),
      group: t("cmd_group_navigation"),
      action: () => router.push("/modules/cameras"),
    },
    {
      id: "nav-commentators",
      label: t("cmd_go_to_commentators"),
      group: t("cmd_group_navigation"),
      action: () => router.push("/modules/commentators"),
    },
    {
      id: "nav-settings",
      label: t("cmd_go_to_settings"),
      group: t("cmd_group_navigation"),
      shortcut: "⌘,",
      action: () => router.push("/settings"),
    },
    ...(user?.isAdmin
      ? [
          {
            id: "nav-admin",
            label: t("cmd_go_to_admin"),
            group: t("cmd_group_navigation"),
            action: () => router.push("/modules/admin"),
          },
        ]
      : []),
    {
      id: "act-new-team",
      label: t("cmd_create_team"),
      group: t("cmd_group_actions"),
      shortcut: "⌘N",
      action: () => router.push("/modules/teams/new"),
    },
    {
      id: "act-new-tournament",
      label: t("cmd_create_tournament"),
      group: t("cmd_group_actions"),
      action: () => router.push("/modules/tournaments/new"),
    },
    {
      id: "nav-home",
      label: t("cmd_go_to_dashboard"),
      group: t("cmd_group_navigation"),
      action: () => router.push("/modules"),
    },
  ];

  // Build entity search results from cached query data
  const entityCommands: Command[] = [];
  if (query.length >= 2) {
    const q = query.toLowerCase();
    const teams = qc.getQueryData<Record<string, string>[]>(["teams"]) ?? [];
    for (const t of teams) {
      if (t.name?.toLowerCase().includes(q) || t.tag?.toLowerCase().includes(q)) {
        entityCommands.push({
          id: `team-${t.id}`,
          label: `${t.name} [${t.tag}]`,
          group: t("cmd_group_teams"),
          action: () => router.push(`/modules/teams`),
        });
      }
    }
    const tournaments = qc.getQueryData<Record<string, string>[]>(["tournaments"]) ?? [];
    for (const t of tournaments) {
      if (t.name?.toLowerCase().includes(q)) {
        entityCommands.push({
          id: `tournament-${t.id}`,
          label: t.name,
          group: t("cmd_group_tournaments"),
          action: () => router.push(`/modules/tournaments`),
        });
      }
    }
    const commentators = qc.getQueryData<Record<string, string>[]>(["commentators"]) ?? [];
    for (const c of commentators) {
      if (c.name?.toLowerCase().includes(q)) {
        entityCommands.push({
          id: `commentator-${c.id}`,
          label: c.name,
          group: t("cmd_group_commentators"),
          action: () => router.push("/modules/commentators"),
        });
      }
    }
  }

  const allCommands = [...commands, ...entityCommands];
  const filtered = query
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const groups = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);

    return acc;
  }, {});

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function runCommand(cmd: Command) {
    onClose();
    cmd.action();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      runCommand(filtered[selectedIndex]);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  let flatIndex = -1;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-text-muted"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("cmd_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-gray-100 outline-none placeholder:text-text-muted"
            />
            <kbd className="hidden rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[10px] text-text-muted sm:inline-block">
              {t("cmd_esc")}
            </kbd>
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">{t("cmd_no_results")}</p>
            ) : (
              Object.entries(groups).map(([group, cmds]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {group}
                  </p>
                  {cmds.map((cmd) => {
                    flatIndex++;
                    const idx = flatIndex;

                    return (
                      <button
                        key={cmd.id}
                        data-index={idx}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          idx === selectedIndex
                            ? "bg-indigo-500/15 text-gray-100"
                            : "text-gray-300 hover:bg-surface-overlay"
                        }`}
                      >
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
