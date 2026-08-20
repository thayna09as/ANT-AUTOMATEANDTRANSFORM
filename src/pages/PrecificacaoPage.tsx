import { useEffect, useState } from 'react';
import { Tag, Search, TrendingUp, Percent } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Product } from '@/lib/types';

export function PrecificacaoPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [globalMarkup, setGlobalMarkup] = useState('');

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    supabase.from('products').select('*').eq('company_id', company.id).order('name')
      .then(({ data }) => {
        if (mounted) { setProducts((data as Product[]) || []); setLoading(false); }
      });
    return () => { mounted = false; };
  }, [company]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const applyGlobalMarkup = async () => {
    if (!company || !globalMarkup) return;
    const markup = parseFloat(globalMarkup) / 100;
    const updated = products.map((p) => ({
      ...p,
      sale_price: Number((p.cost_price * (1 + markup)).toFixed(2)),
    }));
    setProducts(updated);
    for (const p of updated) {
      await supabase.from('products').update({ sale_price: p.sale_price }).eq('id', p.id);
    }
    setGlobalMarkup('');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Markup tool */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Markup Global</h3>
            <p className="text-xs text-slate-400">Aplique uma margem a todos os produtos</p>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <Input label="Margem (%)" type="number" value={globalMarkup} onChange={(e) => setGlobalMarkup(e.target.value)} placeholder="Ex: 100" className="max-w-[160px]" />
          <button onClick={applyGlobalMarkup} disabled={!globalMarkup}
            className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
            Aplicar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="sm:max-w-xs" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Tag} title="Nenhum produto para precificar" description="Cadastre produtos com custo para calcular a margem." />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Produto</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Custo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Venda</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Margem</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Markup</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Lucro/un.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => {
                  const cost = Number(p.cost_price);
                  const sale = Number(p.sale_price);
                  const profit = sale - cost;
                  const margin = cost > 0 ? (profit / sale) * 100 : 0;
                  const markup = cost > 0 ? (profit / cost) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-600">{formatCurrency(cost)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(sale)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-medium ${margin >= 30 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-600">{markup.toFixed(1)}%</td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
