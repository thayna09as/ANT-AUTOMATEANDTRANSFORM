import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';

export function ConfiguracoesPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('BRL');
  const [defaultMarkup, setDefaultMarkup] = useState('100');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!company) return;
    let mounted = true;
    supabase.from('settings').select('*').eq('company_id', company.id).maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data) {
          setSettingsId(data.id);
          setCurrency(data.currency);
          setDefaultMarkup(String(data.default_markup));
          setLowStockThreshold(String(data.low_stock_threshold));
        }
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const payload = {
      company_id: company.id,
      currency,
      default_markup: parseFloat(defaultMarkup) || 100,
      low_stock_threshold: parseInt(lowStockThreshold) || 5,
      updated_at: new Date().toISOString(),
    };

    if (settingsId) {
      await supabase.from('settings').update(payload).eq('id', settingsId);
    } else {
      const { data } = await supabase.from('settings').insert(payload).select().single();
      if (data) setSettingsId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <SettingsIcon className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Preferências do Sistema</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Moeda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60">
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <DollarSign className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Input label="Markup padrão (%)" type="number" value={defaultMarkup} onChange={(e) => setDefaultMarkup(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Margem padrão aplicada a novos produtos.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <Package className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Input label="Limite de estoque baixo" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Alerta quando o estoque atingir este valor.</p>
            </div>
          </div>

          {saved && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Configurações salvas com sucesso!</div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Salvar Configurações</Button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h3 className="font-semibold text-red-700 mb-2">Zona de Risco</h3>
        <p className="text-sm text-slate-500 mb-4">Esta ação não pode ser desfeita. Todos os dados da empresa serão permanentemente excluídos.</p>
        <Button variant="danger" onClick={() => {
          if (company && confirm('Tem certeza? Esta ação excluirá TODOS os dados da empresa permanentemente.')) {
            supabase.from('companies').delete().eq('id', company.id);
            window.location.reload();
          }
        }}>Excluir Empresa e Dados</Button>
      </div>
    </div>
  );
}
