'use client';

import Link from 'next/link';

const cards = [
  {
    title: 'Create a Team',
    description: 'Build your roster, set team colors, and get ready to compete.',
    href: '/modules/teams/new',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    title: 'Organize a Tournament',
    description: 'Set up brackets, invite teams, and manage matches.',
    href: '/modules/tournaments/new',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
];

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Welcome to League Stream Utils
        </h2>
        <p className="mt-2 text-text-muted">
          Let&apos;s get you set up. What would you like to do first?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl w-full">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border-subtle bg-surface-raised p-6 transition-all duration-200 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className={`mb-3 h-1 w-10 rounded-full bg-gradient-to-r ${card.gradient}`} />
            <h3 className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">
              {card.title}
            </h3>
            <p className="mt-1 text-xs text-text-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
