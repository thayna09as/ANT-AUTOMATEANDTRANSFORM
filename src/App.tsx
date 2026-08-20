import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';
import { AppShell, type ViewKey } from '@/components/AppShell';
import { PageLoader } from '@/components/ui/Spinner';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProdutosPage } from '@/pages/ProdutosPage';
import { EstoquePage } from '@/pages/EstoquePage';
import { VendasPage } from '@/pages/VendasPage';
import { PrecificacaoPage } from '@/pages/PrecificacaoPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { OrganizacaoPage } from '@/pages/OrganizacaoPage';
import { PerfilPage } from '@/pages/PerfilPage';
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage';

function AppContent() {
  const { user, loading, company } = useAuth();
  const [view, setView] = useState<ViewKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  // First-time onboarding: if user has no company, show a simple prompt
  if (!company) {
    return <NoCompanyView />;
  }

  const pages: Record<ViewKey, React.ReactNode> = {
    dashboard: <DashboardPage />,
    produtos: <ProdutosPage />,
    estoque: <EstoquePage />,
    vendas: <VendasPage />,
    precificacao: <PrecificacaoPage />,
    financeiro: <FinanceiroPage />,
    organizacao: <OrganizacaoPage />,
    perfil: <PerfilPage />,
    configuracoes: <ConfiguracoesPage />,
  };

  return (
    <AppShell current={view} onNavigate={setView}>
      {pages[view]}
    </AppShell>
  );
}

function NoCompanyView() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    await supabase.from('companies').insert({
      owner_id: user.id,
      name: name.trim(),
      segment: segment || null,
    });
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 font-display text-xl font-extrabold text-slate-950">A</div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">ANT</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-1">Bem-vindo!</h2>
          <p className="text-sm text-slate-500 mb-5">Para começar, cadastre sua empresa.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da empresa *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Minha Loja"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Segmento</label>
              <input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Ex: Varejo"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60" />
            </div>
            <button onClick={handleCreate} disabled={saving || !name.trim()}
              className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {saving ? 'Criando...' : 'Criar empresa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
