import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

type Color = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'teal';

const colors: Record<Color, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
};

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: Color;
  children?: ReactNode;
};

export function StatCard({ icon: Icon, label, value, sub, color = 'slate' }: Props) {
  const c = colors[color];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
