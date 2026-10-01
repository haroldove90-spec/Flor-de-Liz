import React, { useState } from 'react';
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  FileText,
  Eye,
  X,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { exportOrderPDF } from '../../utils/pdfExport';

export const ClienteOrders: React.FC = () => {
  const { orders, clienteProfile, adminProfile, whatsappSupportNumber } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Retrieve locally placed order IDs for this client session
  const myStoredOrderIds: string[] = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('flor_my_client_order_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [orders]);

  // Robust matching for client orders so status synchronization always reflects accurately
  const clientOrders = React.useMemo(() => {
    const matched = orders.filter((o) => {
      if (myStoredOrderIds.includes(o.id)) return true;
      if (clienteProfile.id && o.clientId === clienteProfile.id) return true;
      if (o.clientId === 'user_cliente_1' || o.clientId === 'cli_direct') return true;
      if (
        clienteProfile.name &&
        o.clientName.toLowerCase().trim() === clienteProfile.name.toLowerCase().trim()
      ) {
        return true;
      }
      if (clienteProfile.whatsapp && o.clientWhatsapp === clienteProfile.whatsapp) return true;
      if (clienteProfile.phone && o.clientPhone === clienteProfile.phone) return true;
      if (o.source === 'cliente_whatsapp') return true;
      return false;
    });

    // If no specific match found, fallback to all orders with source cliente or non-vendor
    if (matched.length === 0 && orders.length > 0) {
      return orders.filter((o) => o.source === 'cliente_whatsapp' || !o.vendedorId);
    }
    return matched;
  }, [orders, clienteProfile, myStoredOrderIds]);

  const newOrders = clientOrders.filter((o) => o.status !== 'Entregado' && o.status !== 'Cancelado');
  const pastOrders = clientOrders.filter((o) => o.status === 'Entregado' || o.status === 'Cancelado');

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'En proceso':
        return 1;
      case 'En preparación':
        return 2;
      case 'En ruta':
        return 3;
      case 'Entregado':
        return 4;
      case 'Cancelado':
        return -1;
    }
  };

  const handleConsultWhatsApp = (order: Order) => {
    const rawPhone = whatsappSupportNumber || adminProfile.whatsapp || '5512345678';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const message = `🌸 *CONSULTA DE PEDIDO - FLOR DE LIZ* 🌸\n\n` +
      `Hola, soy *${order.clientName}*.\n` +
      `Quisiera consultar el estatus de mi pedido con folio *#${order.orderNumber}* ($${order.total.toFixed(2)} MXN).\n` +
      `Estatus en plataforma: ${order.status}.\n` +
      `¿Podrían confirmarme los detalles de entrega? ¡Muchas gracias!`;

    const fullPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-stone-200/80">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
          Mis Pedidos y Estatus de Entrega
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Consulta en tiempo real el proceso de preparación y ruta de tus flores
        </p>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#C9B368]" />
          <h2 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
            Pedidos Nuevos y en Curso ({newOrders.length})
          </h2>
        </div>

        {newOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
            <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-stone-700">
              No tienes pedidos activos en este momento
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Tus nuevos pedidos realizados se mostrarán aquí con seguimiento en vivo.
            </p>
          </div>
        ) : (
          newOrders.map((order) => {
            const stepIdx = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5"
              >
                {/* Top card info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <span className="font-bold text-sm sm:text-base text-[#1B1A18]">
                      Pedido #{order.orderNumber}
                    </span>
                    <p className="text-xs text-stone-500">
                      Fecha: {new Date(order.createdAt).toLocaleDateString('es-MX')} a las{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm sm:text-base font-bold text-[#1B1A18]">
                      ${order.total.toFixed(2)} MXN
                    </p>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Visual Step Progress Bar */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {/* Step 1: En proceso */}
                    <div className="text-center space-y-1.5">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition ${
                          stepIdx >= 1
                            ? 'bg-[#1B1A18] text-[#C9B368] shadow-sm'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] sm:text-xs ${stepIdx >= 1 ? 'font-bold text-[#1B1A18]' : 'text-stone-400'}`}>
                        En Proceso
                      </p>
                    </div>

                    {/* Step 2: En preparación */}
                    <div className="text-center space-y-1.5">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition ${
                          stepIdx >= 2
                            ? 'bg-[#1B1A18] text-[#C9B368] shadow-sm'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] sm:text-xs ${stepIdx >= 2 ? 'font-bold text-[#1B1A18]' : 'text-stone-400'}`}>
                        En Preparación
                      </p>
                    </div>

                    {/* Step 3: En ruta */}
                    <div className="text-center space-y-1.5">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition ${
                          stepIdx >= 3
                            ? 'bg-[#1B1A18] text-[#C9B368] shadow-sm'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] sm:text-xs ${stepIdx >= 3 ? 'font-bold text-[#1B1A18]' : 'text-stone-400'}`}>
                        En Ruta
                      </p>
                    </div>

                    {/* Step 4: Entregado */}
                    <div className="text-center space-y-1.5">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition ${
                          stepIdx >= 4
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] sm:text-xs ${stepIdx >= 4 ? 'font-bold text-emerald-800' : 'text-stone-400'}`}>
                        Entregado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items summary */}
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 text-xs space-y-1">
                  <p className="font-bold text-stone-700">Artículos ({order.items.length}):</p>
                  <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.productName} x{item.quantity} (${item.subtotal.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-stone-500 pt-1">
                    Dirección de entrega: {order.clientAddress}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleConsultWhatsApp(order)}
                    className="py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    title="Consultar entrega por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consultar por WhatsApp</span>
                  </button>

                  <button
                    onClick={() => exportOrderPDF(order)}
                    className="py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Orders Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-[#1B1A18] uppercase tracking-wide">
          Historial de Pedidos Anteriores ({pastOrders.length})
        </h2>

        {pastOrders.length === 0 ? (
          <p className="text-xs text-stone-400">No hay pedidos anteriores finalizados.</p>
        ) : (
          <div className="space-y-2.5">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white rounded-2xl border border-stone-200/90 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-[#1B1A18]">
                    #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    {order.items.length} productos • ${order.total.toFixed(2)} MXN
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      order.status === 'Entregado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {order.status}
                  </span>
                  <button
                    onClick={() => exportOrderPDF(order)}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
                    title="Descargar comprobante"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
