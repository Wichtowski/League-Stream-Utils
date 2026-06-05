"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/_components/auth-provider";
import { SideNav } from "@/_components/side-nav";

import { ImpersonationBanner } from "./admin/_components/impersonation-banner";

export default function ModulesLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideNav />
      <main className={`ml-14 flex-1 px-8 py-6 lg:ml-56 ${user.impersonatedBy ? "pt-16" : ""}`}>
        <ImpersonationBanner />
        {children}
      </main>
    </div>
  );
}
