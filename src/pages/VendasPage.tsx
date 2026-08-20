import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, Search, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import type { Sale, Product } from '@/lib/types';

export function VendasPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selProduct, setSelProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [channel, setChannel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    Promise.all([
      supabase.from('sales').select('*, product:products(name,sku)').eq('company_id', company.id).order('sale_date', { ascending: false }),
      supabase.from('products').select('*').eq('company_id', company.id).order('name'),
    ]).then(([salesRes, prodRes]) => {
      if (mounted) {
        setSales((salesRes.data as Sale[]) || []);
        setProducts((prodRes.data as Product[]) || []);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [company]);

  const filtered = sales.filter((s) =>
    (s.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.channel || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
  const totalUnits = sales.reduce((s, x) => s + x.quantity, 0);
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

  const handleSave = async () => {
    if (!company || !selProduct) return;
    setSaving(true);
    setError(null);
    const product = products.find((p) => p.id === selProduct);
    if (!product) { setError('Produto não encontrado.'); setSaving(false); return; }

    const qty = parseInt(quantity) || 1;
    const unitPrice = Number(product.sale_price);
    const total = unitPrice * qty;

    const res = await supabase.from('sales').insert({
      company_id: company.id,
      product_id: selProduct,
      quantity: qty,
      unit_price: unitPrice,
      total,
      channel: channel || null,
      status: 'completed',
    }).select('*, product:products(name,sku)').single();

    setSaving(false);
    if (res.error) { setError(res.error.message); return; }

    setSales((prev) => [res.data as Sale, ...prev]);
    setModalOpen(false);
    setSelProduct('');
    setQuantity('1');
    setChannel('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta venda?')) return;
    await supabase.from('sales').delete().eq('id', id);
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Receita Total" value={formatCurrency(totalRevenue)} color="green" />
        <StatCard icon={ShoppingCart} label="Itens Vendidos" value={String(totalUnits)} color="blue" />
        <StatCard icon={TrendingUp} label="Ticket Médio" value={formatCurrency(avgTicket)} color="teal" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input placeholder="Buscar venda..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="sm:max-w-xs" />
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nova Venda</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={ShoppingCart} title="Nenhuma venda registrada" description="Registre vendas para acompanhar a receita e o desempenho." action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nova Venda</Button>} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Produto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Canal</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Qtd</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Preço unit.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{s.product?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      {s.channel ? <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">{s.channel}</span> : <span className="text-sm text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-600">{s.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-600">{formatCurrency(s.unit_price)}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900">{formatCurrency(s.total)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(s.sale_date)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Venda">
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm text-slate-500">Cadastre produtos primeiro na aba Produtos.</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Produto</label>
                <select value={selProduct} onChange={(e) => setSelProduct(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60">
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sale_price)} ({p.stock_qty} em estoque)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantidade" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <Input label="Canal (opcional)" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Ex: Loja, Online" />
              </div>
              {selProduct && (
                <div className="rounded-lg bg-slate-50 px-4 py-3 flex justify-between">
                  <span className="text-sm text-slate-500">Total da venda</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency((products.find((p) => p.id === selProduct)?.sale_price || 0) * (parseInt(quantity) || 0))}
                  </span>
                </div>
              )}
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving} disabled={!selProduct}>Registrar Venda</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
