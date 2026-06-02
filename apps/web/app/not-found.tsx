import { LinkButton } from '@/_components/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-text-muted">404</h1>
      <p className="text-text-muted">Page not found</p>
      <LinkButton href="/" variant="secondary" size="sm">Go home</LinkButton>
    </main>
  );
}
