import { useEffect, useState } from 'react';
import { Plus, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Product } from '@/lib/types';

type FormState = {
  name: string;
  sku: string;
  category: string;
  cost_price: string;
  sale_price: string;
  stock_qty: string;
  min_stock: string;
  unit: string;
};

const emptyForm: FormState = {
  name: '', sku: '', category: '', cost_price: '0', sale_price: '0', stock_qty: '0', min_stock: '0', unit: 'un',
};

export function ProdutosPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    supabase.from('products').select('*').eq('company_id', company.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (mounted) { setProducts((data as Product[]) || []); setLoading(false); }
      });
    return () => { mounted = false; };
  }, [company]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm); setError(null); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, sku: p.sku || '', category: p.category || '',
      cost_price: String(p.cost_price), sale_price: String(p.sale_price),
      stock_qty: String(p.stock_qty), min_stock: String(p.min_stock), unit: p.unit,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    setError(null);

    const payload = {
      company_id: company.id,
      name: form.name,
      sku: form.sku || null,
      category: form.category || null,
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      stock_qty: parseInt(form.stock_qty) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      unit: form.unit || 'un',
    };

    if (!form.name.trim()) {
      setError('Nome do produto é obrigatório.');
      setSaving(false);
      return;
    }

    const res = editId
      ? await supabase.from('products').update(payload).eq('id', editId).select().single()
      : await supabase.from('products').insert(payload).select().single();

    setSaving(false);
    if (res.error) { setError(res.error.message); return; }

    if (editId) {
      setProducts((prev) => prev.map((p) => (p.id === editId ? res.data as Product : p)));
    } else {
      setProducts((prev) => [res.data as Product, ...prev]);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input placeholder="Buscar por nome, SKU ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="sm:max-w-xs" />
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Package} title="Nenhum produto encontrado" description="Cadastre seu primeiro produto para começar a gerenciar." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo Produto</Button>} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Produto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Categoria</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Custo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Venda</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Estoque</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.unit}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{p.sku || '—'}</td>
                    <td className="px-5 py-3.5">
                      {p.category ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">{p.category}</span>
                      ) : <span className="text-sm text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-600">{formatCurrency(p.cost_price)}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(p.sale_price)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-medium ${p.stock_qty <= p.min_stock ? 'text-amber-600' : 'text-slate-900'}`}>{p.stock_qty}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">
          <Input label="Nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU" />
            <Input label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoria" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Preço de custo (R$)" type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            <Input label="Preço de venda (R$)" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Estoque" type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
            <Input label="Estoque mín." type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            <Input label="Unidade" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="un" />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editId ? 'Salvar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
