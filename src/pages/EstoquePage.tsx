import { useEffect, useState } from 'react';
import { Warehouse, AlertTriangle, PackageX, Search, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import type { Product } from '@/lib/types';

export function EstoquePage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    supabase.from('products').select('*').eq('company_id', company.id).order('name')
      .then(({ data }) => {
        if (mounted) { setProducts((data as Product[]) || []); setLoading(false); }
      });
    return () => { mounted = false; };
  }, [company]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchesSearch && p.stock_qty <= p.min_stock && p.stock_qty > 0;
    if (filter === 'out') return matchesSearch && p.stock_qty === 0;
    return matchesSearch;
  });

  const totalItems = products.reduce((s, p) => s + p.stock_qty, 0);
  const lowStock = products.filter((p) => p.stock_qty <= p.min_stock && p.stock_qty > 0).length;
  const outStock = products.filter((p) => p.stock_qty === 0).length;
  const stockValueTotal = products.reduce((s, p) => s + p.cost_price * p.stock_qty, 0);

  const openEdit = (p: Product) => { setEditProduct(p); setStockValue(String(p.stock_qty)); };
  const handleSave = async () => {
    if (!editProduct) return;
    setSaving(true);
    await supabase.from('products').update({ stock_qty: parseInt(stockValue) || 0 }).eq('id', editProduct.id);
    setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, stock_qty: parseInt(stockValue) || 0 } : p)));
    setSaving(false);
    setEditProduct(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Warehouse} label="Total em estoque" value={String(totalItems)} color="slate" sub="unidades" />
        <StatCard icon={AlertTriangle} label="Estoque baixo" value={String(lowStock)} color="amber" sub="atenção" />
        <StatCard icon={PackageX} label="Sem estoque" value={String(outStock)} color="red" sub="esgotados" />
        <StatCard icon={Warehouse} label="Valor em estoque" value={formatCurrency(stockValueTotal)} color="teal" sub="custo total" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="sm:max-w-xs" />
        <div className="flex gap-1.5">
          {(['all', 'low', 'out'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {f === 'all' ? 'Todos' : f === 'low' ? 'Baixo' : 'Esgotados'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Warehouse} title="Nenhum item encontrado" description="Ajuste os filtros ou cadastre produtos na aba Produtos." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isOut = p.stock_qty === 0;
            const isLow = p.stock_qty <= p.min_stock && p.stock_qty > 0;
            return (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card hover:shadow-soft transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku || 'Sem SKU'}</p>
                  </div>
                  {isOut ? (
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-red-50 text-xs font-medium text-red-600">Esgotado</span>
                  ) : isLow ? (
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-50 text-xs font-medium text-amber-600">Baixo</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-xs font-medium text-emerald-600">OK</span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{p.stock_qty}<span className="text-sm font-normal text-slate-400 ml-1">{p.unit}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">Mín: {p.min_stock}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-600">{formatCurrency(p.cost_price * p.stock_qty)}</p>
                </div>
                <button onClick={() => openEdit(p)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50 border border-slate-100 transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Ajustar
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Ajustar Estoque" size="sm">
        {editProduct && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{editProduct.name}</p>
              <p className="text-xs text-slate-400">Estoque atual: {editProduct.stock_qty} {editProduct.unit}</p>
            </div>
            <Input label="Novo estoque" type="number" value={stockValue} onChange={(e) => setStockValue(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditProduct(null)}>Cancelar</Button>
              <Button onClick={handleSave} loading={saving}>Salvar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
