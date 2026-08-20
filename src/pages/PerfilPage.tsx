import { useState } from 'react';
import { User as UserIcon, Mail, Phone, Building2, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { initials } from '@/lib/format';

export function PerfilPage() {
  const { user, profile, company, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [companyName, setCompanyName] = useState(company?.name || '');
  const [legalName, setLegalName] = useState(company?.legal_name || '');
  const [cnpj, setCnpj] = useState(company?.cnpj || '');
  const [segment, setSegment] = useState(company?.segment || '');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    await supabase.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSavingProfile(false);
    setProfileSaved(true);
    refreshProfile();
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setSavingCompany(true);
    await supabase.from('companies').update({
      name: companyName,
      legal_name: legalName || null,
      cnpj: cnpj || null,
      segment: segment || null,
      updated_at: new Date().toISOString(),
    }).eq('id', company.id);
    setSavingCompany(false);
    setCompanySaved(true);
    refreshProfile();
    setTimeout(() => setCompanySaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl font-bold text-slate-700">
            {initials(fullName || 'U')}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{fullName || 'Usuário'}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h3 className="font-semibold text-slate-900 mb-4">Dados Pessoais</h3>
        <div className="space-y-4">
          <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={<UserIcon className="h-4 w-4" />} />
          <Input label="E-mail" value={user?.email || ''} disabled icon={<Mail className="h-4 w-4" />} />
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" icon={<Phone className="h-4 w-4" />} />
          {profileSaved && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Perfil atualizado com sucesso!</div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} loading={savingProfile}><Save className="h-4 w-4" /> Salvar Dados</Button>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Dados da Empresa</h3>
        </div>
        <div className="space-y-4">
          <Input label="Nome da empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input label="Razão social" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            <Input label="Segmento" value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Ex: Varejo" />
          </div>
          {companySaved && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-700">Empresa atualizada com sucesso!</div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSaveCompany} loading={savingCompany}><Save className="h-4 w-4" /> Salvar Empresa</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
