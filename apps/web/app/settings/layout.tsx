import type { ReactNode } from "react";

import { SideNav } from "@/_components/side-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <main className="ml-56 flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
