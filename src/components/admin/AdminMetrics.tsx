import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  FileDown,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportSalesReportPDF } from '../../utils/pdfExport';

export const AdminMetrics: React.FC = () => {
  const { orders, products, employees, clients, currentUser, adminProfile } = useApp();

  const connectedName = currentUser?.name || adminProfile.name || 'Emilio Administrador';
  const connectedUsername = currentUser?.username || 'emilio_admin';

  // Metrics calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelado' ? o.total : 0), 0);

  // Sales today
  const todayStr = new Date().toDateString();
  const salesToday = orders
    .filter((o) => new Date(o.createdAt).toDateString() === todayStr && o.status !== 'Cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  // Sales this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const salesMonth = orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'Cancelado';
    })
    .reduce((sum, o) => sum + o.total, 0);

  // Status counters
  const statusCounts = {
    'En proceso': orders.filter((o) => o.status === 'En proceso').length,
    'En preparación': orders.filter((o) => o.status === 'En preparación').length,
    'En ruta': orders.filter((o) => o.status === 'En ruta').length,
    'Entregado': orders.filter((o) => o.status === 'Entregado').length,
    'Cancelado': orders.filter((o) => o.status === 'Cancelado').length,
  };

  // Top products sold
  const productSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'Cancelado') {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, quantity: 0, total: 0 };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].total += item.subtotal;
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1B1A18] text-[#C9B368] border border-[#C9B368]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Usuario Conectado: {connectedName}
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              @{connectedUsername}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Panel de Métricas y Ventas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Bienvenido al panel central, <span className="font-semibold text-stone-800">{connectedName}</span>. Rendimiento en tiempo real de Suministros Médicos.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSalesReportPDF(orders, 'General')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#C9B368]" />
            Exportar Reporte PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Ventas del Día</span>
            <div className="w-8 h-8 rounded-lg bg-[#C9B368]/20 text-[#1B1A18] flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4 text-[#1B1A18]" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">
            ${salesToday.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-stone-500">Corte al momento</p>
        </div>

        {/* KPI 2 */}
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
          <p className="text-[11px] text-emerald-700 font-semibold">Facturación acumulada</p>
        </div>

        {/* KPI 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Total de Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">{orders.length}</p>
          <p className="text-[11px] text-stone-500">
            {statusCounts['Entregado']} entregados con éxito
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Plantilla Activa</span>
            <div className="w-8 h-8 rounded-lg bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1B1A18]">{employees.length}</p>
          <p className="text-[11px] text-stone-500">{clients.length} clientes registrados</p>
        </div>
      </div>

      {/* Proceso de Venta (Status Pipeline) */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
          Proceso de Venta y Estado de Pedidos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>En proceso</span>
            </div>
            <p className="text-xl font-bold">{statusCounts['En proceso']}</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>En preparación</span>
            </div>
            <p className="text-xl font-bold">{statusCounts['En preparación']}</p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <Truck className="w-3.5 h-3.5 text-purple-600" />
              <span>En ruta</span>
            </div>
            <p className="text-xl font-bold">{statusCounts['En ruta']}</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entregado</span>
            </div>
            <p className="text-xl font-bold">{statusCounts['Entregado']}</p>
          </div>

          <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <XCircle className="w-3.5 h-3.5 text-stone-500" />
              <span>Cancelado</span>
            </div>
            <p className="text-xl font-bold">{statusCounts['Cancelado']}</p>
          </div>
        </div>
      </div>

      {/* Two columns: Top Products & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
              Productos Más Vendidos
            </h3>
            <span className="text-xs text-stone-400">{products.length} en catálogo</span>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Aún no hay ventas registradas.
              </p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#1B1A18] text-[#C9B368] text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1B1A18]">{p.name}</p>
                      <p className="text-[11px] text-stone-500">{p.quantity} unidades despachadas</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1B1A18]">
                    ${p.total.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Empleados Performance */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
            Rendimiento del Equipo Comercial
          </h3>

          <div className="space-y-3">
            {employees.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                No hay empleados dados de alta.
              </p>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1B1A18] truncate">{emp.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{emp.position}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#1B1A18]">
                      ${(emp.totalSold || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-stone-500">{emp.salesCount || 0} pedidos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
