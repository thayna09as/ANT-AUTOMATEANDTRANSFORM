import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Search, Trash2, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import type { FinancialTransaction } from '@/lib/types';

const expenseCategories = ['Aluguel', 'Salários', 'Insumos', 'Marketing', 'Impostos', 'Utilities', 'Outros'];
const revenueCategories = ['Vendas', 'Serviços', 'Outros'];

export function FinanceiroPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<'revenue' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    supabase.from('financial_transactions').select('*').eq('company_id', company.id).order('transaction_date', { ascending: false })
      .then(({ data }) => {
        if (mounted) { setTransactions((data as FinancialTransaction[]) || []); setLoading(false); }
      });
    return () => { mounted = false; };
  }, [company]);

  const filtered = transactions.filter((t) =>
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const result = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (result / totalRevenue) * 100 : 0;

  // DRE structure
  const dreExpenses = expenseCategories.map((cat) => ({
    category: cat,
    total: transactions.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0),
  })).filter((x) => x.total > 0);

  const dreRevenue = revenueCategories.map((cat) => ({
    category: cat,
    total: transactions.filter((t) => t.type === 'revenue' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0),
  })).filter((x) => x.total > 0);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    setError(null);
    if (!category || !amount) { setError('Preencha categoria e valor.'); setSaving(false); return; }

    const res = await supabase.from('financial_transactions').insert({
      company_id: company.id,
      type,
      category,
      description: description || null,
      amount: parseFloat(amount) || 0,
      transaction_date: date,
    }).select().single();

    setSaving(false);
    if (res.error) { setError(res.error.message); return; }

    setTransactions((prev) => [res.data as FinancialTransaction, ...prev].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)));
    setModalOpen(false);
    setCategory(''); setDescription(''); setAmount('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return;
    await supabase.from('financial_transactions').delete().eq('id', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Receitas" value={formatCurrency(totalRevenue)} color="green" />
        <StatCard icon={TrendingDown} label="Despesas" value={formatCurrency(totalExpenses)} color="red" />
        <StatCard icon={Wallet} label="Resultado" value={formatCurrency(result)} sub={`Margem: ${margin.toFixed(1)}%`} color={result >= 0 ? 'teal' : 'red'} />
      </div>

      {/* Minha DRE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Receitas (DRE)</h3>
          {dreRevenue.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhuma receita registrada.</p>
          ) : (
            <div className="space-y-2.5">
              {dreRevenue.map((r) => (
                <div key={r.category} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{r.category}</span>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(r.total)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-900">Total Receitas</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Despesas (DRE)</h3>
          {dreExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhuma despesa registrada.</p>
          ) : (
            <div className="space-y-2.5">
              {dreExpenses.map((e) => (
                <div key={e.category} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{e.category}</span>
                  <span className="text-sm font-medium text-red-600">- {formatCurrency(e.total)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-900">Total Despesas</span>
                <span className="text-sm font-bold text-red-600">- {formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultado */}
      <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Resultado Líquido</p>
          <p className={`text-2xl font-bold mt-1 ${result >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(result)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Margem Líquida</p>
          <p className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Input placeholder="Buscar transação..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} className="sm:max-w-xs" />
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nova Transação</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Wallet} title="Nenhuma transação" description="Registre receitas e despesas para montar sua DRE." action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nova Transação</Button>} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Categoria</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Descrição</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Valor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${t.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {t.type === 'revenue' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {t.type === 'revenue' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{t.category}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{t.description || '—'}</td>
                    <td className={`px-5 py-3.5 text-right text-sm font-medium ${t.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'revenue' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(t.transaction_date)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Transação">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${type === 'expense' ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <TrendingDown className="h-4 w-4 inline mr-1.5" /> Despesa
            </button>
            <button onClick={() => setType('revenue')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${type === 'revenue' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <TrendingUp className="h-4 w-4 inline mr-1.5" /> Receita
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60">
              <option value="">Selecione...</option>
              {(type === 'revenue' ? revenueCategories : expenseCategories).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
