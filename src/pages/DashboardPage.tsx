import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';
import { StatCard } from '@/components/ui/StatCard';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Sale, Product } from '@/lib/types';

export function DashboardPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!company) return;
    let mounted = true;

    async function load() {
      const [salesRes, productsRes] = await Promise.all([
        supabase.from('sales').select('*, product:products(name,sku)').eq('company_id', company!.id).order('sale_date', { ascending: false }).limit(10),
        supabase.from('products').select('*').eq('company_id', company!.id),
      ]);

      if (!mounted) return;

      setSales((salesRes.data as Sale[]) || []);
      setProducts((productsRes.data as Product[]) || []);

      const revenue = (salesRes.data || []).reduce((sum: number, s: Sale) => sum + Number(s.total), 0);
      setTotalRevenue(revenue);

      const cost = (productsRes.data || []).reduce(
        (sum: number, p: Product) => sum + Number(p.cost_price) * Number(p.stock_qty),
        0
      );
      setTotalCost(cost);

      setLowStockCount((productsRes.data || []).filter((p: Product) => Number(p.stock_qty) <= Number(p.min_stock)).length);

      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [company]);

  if (loading) return <PageLoader />;

  const profit = totalRevenue - totalCost;
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(totalRevenue)} color="green" sub="Todas as vendas" />
        <StatCard icon={ShoppingCart} label="Vendas" value={formatNumber(sales.length)} color="blue" sub="Registros" />
        <StatCard icon={Package} label="Produtos" value={formatNumber(products.length)} color="slate" sub="Cadastrados" />
        <StatCard icon={TrendingUp} label="Lucro Estimado" value={formatCurrency(profit)} color="teal" sub="Receita - Custo" />
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockCount}</span> produto(s) com estoque baixo. Verifique a aba Estoque.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sales */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Vendas Recentes</h3>
            <span className="text-xs text-slate-400">{sales.length} total</span>
          </div>
          {recentSales.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Nenhuma venda ainda" description="As vendas registradas aparecerão aqui." />
          ) : (
            <div className="divide-y divide-slate-50">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <ArrowUpRight className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sale.product?.name || 'Produto removido'}</p>
                      <p className="text-xs text-slate-400">{formatDate(sale.sale_date)} · {sale.quantity} un.</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Resumo Financeiro</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Receita</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm text-slate-600">Custo de estoque</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(totalCost)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Saldo</span>
                <span className={`text-base font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Estoque</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total de itens</span>
                <span className="font-medium text-slate-900">{formatNumber(products.reduce((s, p) => s + p.stock_qty, 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estoque baixo</span>
                <span className="font-medium text-amber-600">{lowStockCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sem estoque</span>
                <span className="font-medium text-red-600">{products.filter((p) => p.stock_qty === 0).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
