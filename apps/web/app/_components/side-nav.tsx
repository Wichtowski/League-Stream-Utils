'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { RiSwordFill, RiTeamFill } from 'react-icons/ri';
import { BsCameraVideoFill, BsFillShieldLockFill } from 'react-icons/bs';
import { HiTrophy } from 'react-icons/hi2';
import { IoChatbox } from 'react-icons/io5';
import { HiCog6Tooth } from 'react-icons/hi2';
import { HiArrowRightOnRectangle } from 'react-icons/hi2';
import { useAuth } from '@/_components/auth-provider';
import { useCommandPalette } from '@/_components/command-palette';
import { isElectron } from '@lsu/electron-bridge';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  glowColor: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/modules/draft',
    label: 'Draft',
    icon: RiSwordFill,
    gradient: 'linear-gradient(135deg, #d946ef, #ef4444)',
    glowColor: 'rgba(217, 70, 239, 0.4)',
  },
  {
    href: '/modules/tournaments',
    label: 'Tournaments',
    icon: HiTrophy,
    gradient: 'linear-gradient(135deg, #eab308, #f97316)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    href: '/modules/teams',
    label: 'Teams',
    icon: RiTeamFill,
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    glowColor: 'rgba(14, 165, 233, 0.4)',
  },
  {
    href: '/modules/cameras',
    label: 'Cameras',
    icon: BsCameraVideoFill,
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  {
    href: '/modules/commentators',
    label: 'Commentators',
    icon: IoChatbox,
    gradient: 'linear-gradient(135deg, #ec4899, #eab308)',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    href: '/modules/admin',
    label: 'Admin',
    icon: BsFillShieldLockFill,
    gradient: 'linear-gradient(135deg, #ef4444, #ec4899)',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    adminOnly: true,
  },
];

export function SideNav() {
  const pathname = usePathname();
  const { user, logout, isOffline, switchToOnline } = useAuth();
  const { open: openPalette } = useCommandPalette();
  const [offlinePopover, setOfflinePopover] = useState(false);
  const [electron, setElectron] = useState(false);

  useEffect(() => {
    setElectron(isElectron());
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.isAdmin);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border-subtle bg-surface-raised lg:w-56 md:w-14">
      <Link
        href="/"
        className="group flex items-center gap-2 border-b border-border-subtle px-5 py-4 md:justify-center md:px-2 lg:justify-start lg:px-5"
      >
        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-lg font-bold text-transparent transition-transform duration-200 group-hover:scale-110">
          LSU
        </span>
        <span className="text-xs text-text-muted md:hidden lg:inline">v2</span>
        {electron && (
          <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 md:hidden lg:inline">
            Desktop
          </span>
        )}
      </Link>

      {isOffline && (
        <div className="relative mx-2 mt-2">
          <button
            onClick={() => setOfflinePopover((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 transition-colors hover:bg-amber-500/20"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-300 md:hidden lg:inline">Offline Mode</span>
          </button>
          {offlinePopover && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-lg border border-border-subtle bg-surface-raised p-3 shadow-xl md:left-auto md:w-56 md:right-auto">
              <p className="text-xs text-gray-300 mb-2">You're in offline mode. Data is stored locally.</p>
              <button
                onClick={() => {
                  setOfflinePopover(false);
                  switchToOnline();
                }}
                className="block w-full rounded-md bg-indigo-500/20 px-3 py-1.5 text-center text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
              >
                Switch to online
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={openPalette}
        className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-muted transition-colors hover:bg-surface-overlay hover:text-gray-200 md:justify-center md:px-2 lg:justify-start lg:px-3"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" />
        </svg>
        <span className="flex-1 text-left md:hidden lg:inline">Search...</span>
        <kbd className="rounded border border-border-subtle bg-surface-raised px-1 py-0.5 text-[10px] md:hidden lg:inline-block">⌘K</kbd>
      </button>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              title={item.label}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 md:justify-center md:px-2 lg:justify-start lg:px-3 ${
                active
                  ? 'bg-surface-overlay text-white'
                  : 'text-text-muted hover:bg-surface-overlay/60 hover:text-gray-200'
              }`}
            >
              <span
                className={`relative flex items-center justify-center rounded-md p-1.5 text-xl transition-all duration-200 ${
                  active
                    ? 'shadow-lg'
                    : 'bg-surface-overlay group-hover:scale-110 group-hover:rotate-[-6deg]'
                }`}
                style={active ? { background: item.gradient, boxShadow: `0 0 12px ${item.glowColor}` } : undefined}
              >
                <Icon
                  className={`transition-transform duration-200 ${
                    active
                      ? 'text-white drop-shadow-md'
                      : 'text-text-muted group-hover:text-gray-200 group-hover:scale-110'
                  }`}
                />
              </span>
              <span className={`md:hidden lg:inline ${active ? 'translate-x-0.5' : 'transition-transform duration-200 group-hover:translate-x-0.5'}`}>
                {item.label}
              </span>
              {active && (
                <span
                  className="ml-auto h-2 w-2 rounded-full animate-pulse md:hidden lg:inline-block"
                  style={{ background: item.gradient }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle px-2 py-3">
        {user && (
          <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 md:justify-center md:px-1 lg:justify-start lg:px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-400">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 md:hidden lg:block">
              <p className="truncate text-xs font-medium text-gray-200">{user.username}</p>
              {user.isAdmin && <p className="text-[10px] text-indigo-400">Admin</p>}
            </div>
          </div>
        )}
        <Link
          href="/settings"
          title="Settings"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-muted transition-all duration-200 hover:bg-surface-overlay/60 hover:text-gray-200 md:justify-center md:px-2 lg:justify-start lg:px-3"
        >
          <span className="flex items-center justify-center rounded-md bg-surface-overlay p-1.5 transition-all duration-200 group-hover:rotate-90">
            <HiCog6Tooth className="text-text-muted group-hover:text-gray-200" style={{ fontSize: 18 }} />
          </span>
          <span className="md:hidden lg:inline">Settings</span>
        </Link>
        {user && (
          <button
            onClick={() => logout()}
            title="Logout"
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-muted transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 md:justify-center md:px-2 lg:justify-start lg:px-3"
          >
            <span className="flex items-center justify-center rounded-md bg-surface-overlay p-1.5 transition-all duration-200 group-hover:scale-110">
              <HiArrowRightOnRectangle className="text-text-muted group-hover:text-red-400" style={{ fontSize: 18 }} />
            </span>
            <span className="md:hidden lg:inline">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
