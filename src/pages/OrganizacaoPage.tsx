import { useEffect, useState } from 'react';
import { HeartPulse, TrendingUp, Package, ShoppingCart, Wallet, Activity, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { PageLoader } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import type { Product, Sale, FinancialTransaction } from '@/lib/types';

type HealthCheck = {
  label: string;
  status: 'healthy' | 'warning' | 'critical';
  detail: string;
};

export function OrganizacaoPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    Promise.all([
      supabase.from('products').select('*').eq('company_id', company.id),
      supabase.from('sales').select('*').eq('company_id', company.id),
      supabase.from('financial_transactions').select('*').eq('company_id', company.id),
    ]).then(([pRes, sRes, fRes]) => {
      if (mounted) {
        setProducts((pRes.data as Product[]) || []);
        setSales((sRes.data as Sale[]) || []);
        setTransactions((fRes.data as FinancialTransaction[]) || []);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [company]);

  if (loading) return <PageLoader />;

  // Calculate health metrics
  const totalRevenue = transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const result = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (result / totalRevenue) * 100 : 0;

  const salesRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
  const stockValue = products.reduce((s, p) => s + p.cost_price * p.stock_qty, 0);
  const lowStock = products.filter((p) => p.stock_qty <= p.min_stock).length;
  const outStock = products.filter((p) => p.stock_qty === 0).length;
  const totalStock = products.reduce((s, p) => s + p.stock_qty, 0);

  const healthChecks: HealthCheck[] = [
    {
      label: 'Rentabilidade',
      status: margin >= 20 ? 'healthy' : margin >= 0 ? 'warning' : 'critical',
      detail: `Margem de ${margin.toFixed(1)}% — ${margin >= 20 ? 'saudável' : margin >= 0 ? 'abaixo do ideal' : 'operando com prejuízo'}`,
    },
    {
      label: 'Nível de Estoque',
      status: outStock === 0 && lowStock <= 2 ? 'healthy' : outStock > 2 ? 'critical' : 'warning',
      detail: `${lowStock} produto(s) com estoque baixo, ${outStock} esgotado(s)`,
    },
    {
      label: 'Diversidade de Produtos',
      status: products.length >= 10 ? 'healthy' : products.length >= 3 ? 'warning' : 'critical',
      detail: `${products.length} produto(s) cadastrado(s)`,
    },
    {
      label: 'Volume de Vendas',
      status: sales.length >= 20 ? 'healthy' : sales.length >= 5 ? 'warning' : 'critical',
      detail: `${sales.length} venda(s) registrada(s)`,
    },
    {
      label: 'Fluxo de Caixa',
      status: result > 0 ? 'healthy' : result === 0 ? 'warning' : 'critical',
      detail: `Resultado ${result >= 0 ? 'positivo' : 'negativo'} de ${formatCurrency(Math.abs(result))}`,
    },
    {
      label: 'Cobertura de Estoque',
      status: stockValue > 0 && salesRevenue > 0 ? 'healthy' : stockValue > 0 ? 'warning' : 'critical',
      detail: stockValue > 0 ? `${formatCurrency(stockValue)} em estoque` : 'Sem estoque',
    },
  ];

  const healthyCount = healthChecks.filter((h) => h.status === 'healthy').length;
  const overallScore = Math.round((healthyCount / healthChecks.length) * 100);

  const statusConfig = {
    healthy: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Saudável' },
    warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Atenção' },
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Crítico' },
  };

  const scoreColor = overallScore >= 70 ? 'text-emerald-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = overallScore >= 70 ? 'from-emerald-500 to-teal-500' : overallScore >= 40 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">Saúde do Negócio</h3>
            <p className="text-sm text-slate-400">Avaliação automática baseada nos seus dados</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42 * (overallScore / 100)} ${2 * Math.PI * 42}`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`stop-current ${scoreColor}`} />
                  <stop offset="100%" className={`stop-current ${scoreColor}`} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <p className={`text-3xl font-bold ${scoreColor}`}>{overallScore}</p>
              <p className="text-xs text-slate-400">de 100</p>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-3">
              {overallScore >= 70 ? 'Seu negócio está saudável! Continue monitorando os indicadores.' :
               overallScore >= 40 ? 'Atenção a alguns indicadores. Revise os pontos abaixo.' :
               'Vários indicadores precisam de atenção. Aja com prioridade.'}
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">{healthyCount} Saudável</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-500">{healthChecks.filter((h) => h.status === 'warning').length} Atenção</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-slate-500">{healthChecks.filter((h) => h.status === 'critical').length} Crítico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Margem" value={`${margin.toFixed(1)}%`} color={margin >= 20 ? 'green' : margin >= 0 ? 'amber' : 'red'} />
        <StatCard icon={Package} label="Produtos" value={String(products.length)} color="blue" />
        <StatCard icon={ShoppingCart} label="Vendas" value={String(sales.length)} color="teal" />
        <StatCard icon={Wallet} label="Resultado" value={formatCurrency(result)} color={result >= 0 ? 'green' : 'red'} />
      </div>

      {/* Health checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthChecks.map((check) => {
          const cfg = statusConfig[check.status];
          const Icon = cfg.icon;
          return (
            <div key={check.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{check.label}</p>
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{check.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Checklist de Organização</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Cadastrar todos os produtos', done: products.length > 0 },
            { label: 'Definir estoque mínimo nos produtos', done: products.some((p) => p.min_stock > 0) },
            { label: 'Registrar pelo menos uma venda', done: sales.length > 0 },
            { label: 'Registrar despesas mensais', done: transactions.some((t) => t.type === 'expense') },
            { label: 'Registrar fontes de receita', done: transactions.some((t) => t.type === 'revenue') },
            { label: 'Revisar precificação (markup)', done: products.some((p) => p.sale_price > p.cost_price) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
