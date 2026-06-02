import { SideNav } from '@/_components/side-nav';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav />
      <main className="ml-56 flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
