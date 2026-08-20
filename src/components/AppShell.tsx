import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Tag,
  TrendingUp,
  HeartPulse,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';

export type ViewKey =
  | 'dashboard'
  | 'produtos'
  | 'estoque'
  | 'vendas'
  | 'precificacao'
  | 'financeiro'
  | 'organizacao'
  | 'perfil'
  | 'configuracoes';

type NavItem = {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  group: string;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Visão Geral' },
  { key: 'produtos', label: 'Produtos', icon: Package, group: 'Operação' },
  { key: 'estoque', label: 'Estoque', icon: Warehouse, group: 'Operação' },
  { key: 'vendas', label: 'Vendas', icon: ShoppingCart, group: 'Operação' },
  { key: 'precificacao', label: 'Precificação', icon: Tag, group: 'Operação' },
  { key: 'financeiro', label: 'Financeiro', icon: TrendingUp, group: 'Gestão' },
  { key: 'organizacao', label: 'Organização', icon: HeartPulse, group: 'Gestão' },
  { key: 'perfil', label: 'Perfil', icon: User, group: 'Conta' },
  { key: 'configuracoes', label: 'Configurações', icon: Settings, group: 'Conta' },
];

type Props = {
  current: ViewKey;
  onNavigate: (key: ViewKey) => void;
  children: React.ReactNode;
};

export function AppShell({ current, onNavigate, children }: Props) {
  const { profile, company, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = [...new Set(navItems.map((n) => n.group))];

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-display text-lg font-extrabold text-slate-950">
          A
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-slate-900">ANT</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{group}</p>
            <div className="space-y-0.5">
              {navItems
                .filter((n) => n.group === group)
                .map((item) => {
                  const active = current === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${active ? 'text-teal-400' : 'text-slate-400'}`} style={{ width: 18, height: 18 }} />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {initials(profile?.full_name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs text-slate-400 truncate">{company?.name || 'Sem empresa'}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const currentItem = navItems.find((n) => n.key === current);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200/80 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-white animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold text-slate-900">{currentItem?.label}</h1>
          </div>

          <div className="flex items-center gap-3">
            {company && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-700">{company.name}</span>
              </div>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
              {initials(profile?.full_name || 'U')}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
