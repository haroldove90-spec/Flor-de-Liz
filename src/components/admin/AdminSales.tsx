import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  FileDown,
  Search,
  Filter,
  Eye,
  FileText,
  Trash2,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  X,
  User,
  MessageCircle,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { exportOrderPDF, exportSalesNotePDF, exportSalesReportPDF, createWhatsAppOrderLink } from '../../utils/pdfExport';

export const AdminSales: React.FC = () => {
  const {
    orders,
    employees,
    clients,
    products,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    deleteMultipleOrders,
    deleteAllOrders,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Deletion & Multi-selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    type: 'single' | 'selected' | 'all';
    order?: Order;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // New sale modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [saleClientId, setSaleClientId] = useState('');
  const [saleEmployeeId, setSaleEmployeeId] = useState('');
  const [saleItems, setSaleItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [saleNotes, setSaleNotes] = useState('');

  const statusOptions: OrderStatus[] = [
    'En proceso',
    'En preparación',
    'En ruta',
    'Entregado',
    'Cancelado',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (o.vendedorName && o.vendedorName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesEmp =
      employeeFilter === 'all'
        ? true
        : employeeFilter === 'directa'
        ? o.source === 'cliente_whatsapp'
        : o.vendedorId === employeeFilter;

    return matchesSearch && matchesStatus && matchesEmp;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'En proceso':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'En preparación':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En ruta':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelado':
        return 'bg-stone-200 text-stone-700 border-stone-300';
    }
  };

  const handleAddItemToSale = () => {
    if (products.length > 0) {
      setSaleItems([...saleItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItemFromSale = (idx: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleClientId) {
      alert('Selecciona un cliente para la venta.');
      return;
    }
    const client = clients.find((c) => c.id === saleClientId);
    if (!client) return;

    const emp = employees.find((e) => e.id === saleEmployeeId);

    const validItems = saleItems
      .map((si) => {
        const prod = products.find((p) => p.id === si.productId);
        return prod ? { product: prod, quantity: si.quantity } : null;
      })
      .filter((i): i is { product: (typeof products)[0]; quantity: number } => i !== null);

    if (validItems.length === 0) {
      alert('Agrega al menos un producto válido a la venta.');
      return;
    }

    createOrder({
      clientId: client.id,
      clientName: client.name,
      clientBusiness: client.businessName,
      clientPhone: client.phone,
      clientWhatsapp: client.whatsapp,
      clientAddress: client.address,
      items: validItems,
      notes: saleNotes,
      source: 'admin',
      vendedorId: emp?.id,
      vendedorName: emp?.name || 'Administración Central',
    });

    setShowNewModal(false);
    setSaleNotes('');
    setSaleItems([{ productId: products[0]?.id || '', quantity: 1 }]);
  };

  const handleSendWhatsApp = (order: Order) => {
    const rawPhone = order.clientWhatsapp || order.clientPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const itemsSummary = order.items.map((i) => `• ${i.quantity}x ${i.productName} ($${i.subtotal.toFixed(2)})`).join('\n');
    const message = `🌸 *ESTATUS DE VENTA - FLOR DE LIZ* 🌸\n\n` +
      `Estimado/a *${order.clientName}*,\n` +
      `Te compartimos el estatus de tu pedido con folio *#${order.orderNumber}*:\n\n` +
      `📋 *Estatus actual:* ${order.status}\n` +
      `💰 *Total:* $${order.total.toFixed(2)} MXN\n\n` +
      `*DETALLE:* \n${itemsSummary}\n\n` +
      `Cualquier duda o aclaración, estamos a tus órdenes en Comercializadora Flor De Liz.`;

    const fullPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const waUrl = cleanPhone 
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisibleOrders = () => {
    setSelectedOrderIds(filteredOrders.map((o) => o.id));
  };

  const handleClearOrderSelection = () => {
    setSelectedOrderIds([]);
  };

  const handleConfirmOrderDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.order) {
        deleteOrder(deleteModal.order.id);
        setActionStatus({
          text: `Orden #${deleteModal.order.orderNumber} eliminada de Supabase.`,
          isError: false,
        });
        if (selectedOrder?.id === deleteModal.order.id) setSelectedOrder(null);
      } else if (deleteModal.type === 'selected') {
        const toDeleteIds = [...selectedOrderIds];
        const res = await deleteMultipleOrders(toDeleteIds);
        setActionStatus({
          text: res.message,
          isError: !res.success,
        });
        setSelectedOrderIds([]);
        setIsSelectMode(false);
      } else if (deleteModal.type === 'all') {
        const res = await deleteAllOrders();
        setActionStatus({
          text: res.message,
          isError: !res.success,
        });
        setSelectedOrderIds([]);
        setIsSelectMode(false);
        setSelectedOrder(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setActionStatus({ text: `Error: ${msg}`, isError: true });
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
      setTimeout(() => setActionStatus(null), 4500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Gestión y Control de Ventas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Registra ventas de empleados, monitorea el proceso de entrega y exporta en PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => setDeleteModal({ type: 'all', count: orders.length })}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Borrar todas las ventas de Supabase y del historial"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Vaciar Historial</span>
            </button>
          )}

          {orders.length > 0 && (
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedOrderIds([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isSelectMode
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}
              title="Seleccionar ventas para borrar en lote"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#C9B368]" />
              <span>{isSelectMode ? 'Cancelar Selección' : 'Seleccionar'}</span>
            </button>
          )}

          <button
            onClick={() => exportSalesReportPDF(filteredOrders, statusFilter === 'all' ? 'General' : statusFilter)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#C9B368]" />
            Descargar Reporte PDF
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C9B368]" />
            Registrar Venta
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio (#FDL-...), cliente o vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] font-medium focus:outline-none focus:border-[#C9B368] flex-1 sm:flex-none"
          >
            <option value="all">Todos los Estados</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Employee filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] font-medium focus:outline-none focus:border-[#C9B368] flex-1 sm:flex-none"
          >
            <option value="all">Todos los Vendedores y Canales</option>
            <option value="directa">Solo Ventas Directas de Clientes</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                Vendedor: {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-selection Action Bar */}
      {isSelectMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
            </span>
            <span className="text-amber-700">de {filteredOrders.length} órdenes visibles</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAllVisibleOrders}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 transition cursor-pointer"
            >
              Seleccionar Todas ({filteredOrders.length})
            </button>
            {selectedOrderIds.length > 0 && (
              <>
                <button
                  onClick={handleClearOrderSelection}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition cursor-pointer"
                >
                  Deseleccionar
                </button>
                <button
                  onClick={() => setDeleteModal({ type: 'selected', count: selectedOrderIds.length })}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Seleccionadas ({selectedOrderIds.length}) de Supabase</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Status Banner */}
      {actionStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
            actionStatus.isError
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionStatus.isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{actionStatus.text}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                {isSelectMode && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={(e) => {
                        if (e.target.checked) handleSelectAllVisibleOrders();
                        else handleClearOrderSelection();
                      }}
                      className="w-4 h-4 rounded text-amber-600 accent-[#C9B368] cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">Folio / Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Canal / Vendedor</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Estado del Proceso</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 7 : 6} className="py-10 text-center text-stone-400">
                    No se encontraron registros de ventas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#FAF8F5]/60 transition ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {isSelectMode && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOrder(order.id)}
                            className="w-4 h-4 rounded text-amber-600 accent-[#C9B368] cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1B1A18]">#{order.orderNumber}</span>
                        <p className="text-[11px] text-stone-400">
                          {new Date(order.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-[#1B1A18]">{order.clientName}</p>
                        {order.clientBusiness && (
                          <p className="text-[11px] text-stone-500">{order.clientBusiness}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {order.source === 'cliente_whatsapp' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Directa Cliente
                          </span>
                        ) : order.source === 'admin' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Administración
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {order.vendedorName || 'Vendedor'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1B1A18] text-sm">
                          ${order.total.toFixed(2)} MXN
                        </span>
                        <p className="text-[10px] text-stone-400">{order.items.length} productos</p>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {statusOptions.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer"
                          title="Ver Nota de Venta / Orden de Compra"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendWhatsApp(order)}
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                          title="Enviar o compartir datos de venta por WhatsApp con el cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => exportSalesNotePDF(order)}
                          className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                          title="Descargar Nota de Venta (PDF)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                        </button>

                        <button
                          onClick={() => setDeleteModal({ type: 'single', order })}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-red-50 text-red-500 transition cursor-pointer"
                          title="Eliminar venta de Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h3 className="font-bold text-base text-[#1B1A18]">
                  Detalle de Pedido #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Registrado el {new Date(selectedOrder.createdAt).toLocaleString('es-MX')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Client & Vendedor info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/80">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Cliente:</span>
                  <p className="font-bold text-stone-900">{selectedOrder.clientName}</p>
                  {selectedOrder.clientBusiness && (
                    <p className="text-stone-500">{selectedOrder.clientBusiness}</p>
                  )}
                  <p className="text-stone-600 mt-1">{selectedOrder.clientAddress}</p>
                  <p className="text-stone-600">Tel: {selectedOrder.clientWhatsapp || selectedOrder.clientPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Atendido por:</span>
                  <p className="font-bold text-stone-900">{selectedOrder.vendedorName || 'Admin'}</p>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block mt-2">Estado:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold mt-0.5 ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-stone-700">Productos del Pedido:</span>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <p className="font-bold text-stone-900">{item.productName}</p>
                        <p className="text-[11px] text-stone-500">
                          {item.productCode} • Cantidad: {item.quantity} x ${item.price.toFixed(2)}
                          {item.discount > 0 && ` (-${item.discount}%)`}
                        </p>
                      </div>
                      <span className="font-bold text-stone-900">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-right">
                <p className="text-stone-600">Subtotal: ${selectedOrder.subtotal.toFixed(2)}</p>
                {selectedOrder.discountTotal > 0 && (
                  <p className="text-red-600 font-semibold">
                    Descuento: -${selectedOrder.discountTotal.toFixed(2)}
                  </p>
                )}
                <p className="text-sm font-bold text-[#1B1A18] pt-1 border-t border-stone-200">
                  Total: ${selectedOrder.total.toFixed(2)} MXN
                </p>
              </div>

              {/* Actions inside modal */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={() => handleSendWhatsApp(selectedOrder)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Compartir datos de compra por WhatsApp con el cliente"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Compartir por WhatsApp al Cliente</span>
                </button>

                <button
                  onClick={() => exportSalesNotePDF(selectedOrder)}
                  className="py-2.5 px-4 rounded-xl bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Generar y descargar Nota de Venta oficial en PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Descargar Nota de Venta (PDF)</span>
                </button>

                <button
                  onClick={() => exportOrderPDF(selectedOrder)}
                  className="py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Generar y descargar Orden de Compra en PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                  <span>Descargar Orden de Compra (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Sale */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1B1A18]">Registrar Nueva Venta</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSaleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={saleClientId}
                    onChange={(e) => setSaleClientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] bg-white font-medium"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.businessName ? `(${c.businessName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Vendedor Asignado</label>
                  <select
                    value={saleEmployeeId}
                    onChange={(e) => setSaleEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] bg-white font-medium"
                  >
                    <option value="">Venta Directa de Administración</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700">Productos y Cantidades</label>
                  <button
                    type="button"
                    onClick={handleAddItemToSale}
                    className="text-xs text-[#C9B368] font-bold hover:underline cursor-pointer"
                  >
                    + Agregar otro producto
                  </button>
                </div>

                {saleItems.map((si, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#FAF8F5] rounded-xl border border-stone-200">
                    <select
                      value={si.productId}
                      onChange={(e) => {
                        const newItems = [...saleItems];
                        newItems[idx].productId = e.target.value;
                        setSaleItems(newItems);
                      }}
                      className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toFixed(2)}) - Stock: {p.stock}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={si.quantity}
                      onChange={(e) => {
                        const newItems = [...saleItems];
                        newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setSaleItems(newItems);
                      }}
                      className="w-16 p-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-center"
                    />

                    {saleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromSale(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Detalles especiales de facturación o entrega..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1B1A18]">
                {deleteModal.type === 'single'
                  ? `¿Eliminar Orden #${deleteModal.order?.orderNumber}?`
                  : deleteModal.type === 'selected'
                  ? `¿Eliminar ${deleteModal.count} órdenes seleccionadas?`
                  : '¿Eliminar TODO el historial de ventas?'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {deleteModal.type === 'single'
                  ? `Se eliminará permanentemente la orden de venta #${deleteModal.order?.orderNumber} del cliente "${deleteModal.order?.clientName}" de Supabase y del historial local.`
                  : deleteModal.type === 'selected'
                  ? `Se borrarán permanentemente ${deleteModal.count} registros de venta seleccionados tanto de Supabase como de la vista.`
                  : `Se eliminarán permanentemente todas las ventas registradas (${deleteModal.count} órdenes) de Supabase (tabla flor_orders). Esta acción no se puede revertir.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmOrderDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar y Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
