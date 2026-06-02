type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-500/15 text-gray-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  error: 'bg-red-500/15 text-red-400',
  info: 'bg-indigo-500/15 text-indigo-400',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
