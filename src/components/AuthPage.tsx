import { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 font-display text-xl font-extrabold text-slate-950">
              A
            </div>
            <span className="font-display text-xl font-bold tracking-tight">ANT</span>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
              Automate and Transform a gestão da sua empresa
            </h1>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Controle estoque, vendas, precificação e finanças em um só lugar.
              Decisões baseadas em dados reais, não em achismos.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Dashboard com indicadores em tempo real',
                'Gestão completa de produtos e estoque',
                'Minha DRE simplificada e automática',
                'Saúde do negócio em um clique',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-slate-300">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">© 2026 ANT — Automate and Transform</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 font-display text-xl font-extrabold text-slate-950">
              A
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">ANT</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Acesse o painel de gestão da sua empresa.'
              : 'Comece a gerenciar sua empresa em minutos.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                icon={<UserIcon className="h-4 w-4" />}
              />
            )}
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              icon={<Lock className="h-4 w-4" />}
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
