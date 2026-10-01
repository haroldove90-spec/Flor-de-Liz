import React from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Award,
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const VendedorMetrics: React.FC = () => {
  const { orders, vendedorProfile, clients, currentUser } = useApp();

  const connectedName = currentUser?.name || vendedorProfile.name || 'Haroldo Asesor Comercial';
  const connectedUsername = currentUser?.username || 'haroldo90';

  // Orders attributed to this vendor (or all if not filtered)
  const myOrders = orders.filter(
    (o) => o.vendedorId === vendedorProfile.id || o.vendedorName === vendedorProfile.name
  );

  const todayStr = new Date().toDateString();
  const salesToday = myOrders
    .filter((o) => new Date(o.createdAt).toDateString() === todayStr && o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const salesMonth = myOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'Cancelado';
    })
    .reduce((sum, o) => sum + o.total, 0);

  const totalSalesAll = myOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  // Commission estimate (e.g. 5%)
  const estimatedCommission = salesMonth * 0.05;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1B1A18] text-[#C9B368] border border-[#C9B368]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Asesor Conectado: {connectedName}
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              @{connectedUsername}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Métricas de Ventas — {connectedName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Bienvenido, <span className="font-semibold text-stone-800">{connectedName}</span>. Seguimiento de tus metas y ventas en tiempo real.
          </p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-[#C9B368]/20 text-[#1B1A18] font-bold text-xs self-start sm:self-auto">
          Comisión estimada: 5%
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Ventas del día */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Ventas de Hoy</span>
            <div className="w-8 h-8 rounded-lg bg-[#C9B368]/20 text-[#1B1A18] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4 text-[#1B1A18]" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">
            ${salesToday.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-stone-500">Corte diario en vivo</p>
        </div>

        {/* KPI 2: Ventas del mes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Ventas del Mes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">
            ${salesMonth.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">Total acumulado del mes</p>
        </div>

        {/* KPI 3: Pedidos del vendedor */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Mis Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">{myOrders.length}</p>
          <p className="text-[11px] text-stone-500">
            {myOrders.filter((o) => o.status === 'Entregado').length} entregados
          </p>
        </div>

        {/* KPI 4: Comisiones estimadas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Comisión Est.</span>
            <div className="w-8 h-8 rounded-lg bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">
            ${estimatedCommission.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-stone-500">Bono por metas del mes</p>
        </div>
      </div>

      {/* Recent Orders of Vendor */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
          Últimos Pedidos Registrados
        </h2>

        {myOrders.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            Aún no has registrado pedidos. Dirígete a "Catálogo" o "Pedidos" para levantar una nueva venta.
          </p>
        ) : (
          <div className="space-y-2.5">
            {myOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="p-3 bg-[#FAF8F5] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#1B1A18]">
                    #{o.orderNumber} • {o.clientName}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString('es-MX')} • {o.items.length} productos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1B1A18]">${o.total.toFixed(2)} MXN</p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
