import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  FileText,
  Eye,
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  X,
  User,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { exportOrderPDF, createWhatsAppOrderLink } from '../../utils/pdfExport';

export const VendedorOrders: React.FC = () => {
  const {
    orders,
    clients,
    products,
    createOrder,
    updateOrderStatus,
    vendedorProfile,
    currentUser,
    addClient,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [createdSuccessOrder, setCreatedSuccessOrder] = useState<Order | null>(null);

  // New order modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientBusiness, setNewClientBusiness] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [orderNotes, setOrderNotes] = useState('');

  // Vendor's isolated orders: only this vendor's sales
  const myOrders = orders.filter(
    (o) =>
      o.vendedorId === vendedorProfile.id ||
      (currentUser?.id && o.vendedorId === currentUser.id) ||
      o.vendedorName === vendedorProfile.name ||
      (currentUser?.name && o.vendedorName === currentUser.name)
  );

  const filteredOrders = myOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleAddItem = () => {
    if (products.length > 0) {
      setOrderItems([...orderItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetClientId = '';
    let clientName = '';
    let clientBusiness = '';
    let clientPhone = '';
    let clientWhatsapp = '';
    let clientAddress = '';

    if (isNewClient || !selectedClientId) {
      if (!newClientName) {
        alert('Ingresa el nombre del cliente');
        return;
      }
      const created = addClient({
        name: newClientName,
        businessName: newClientBusiness,
        phone: newClientPhone || '5500000000',
        whatsapp: newClientPhone || '5500000000',
        address: newClientAddress || 'Por confirmar',
        active: true,
        createdByVendedorId: vendedorProfile.id,
      });
      targetClientId = created.id;
      clientName = created.name;
      clientBusiness = created.businessName;
      clientPhone = created.phone;
      clientWhatsapp = created.whatsapp;
      clientAddress = created.address;
    } else {
      const c = clients.find((item) => item.id === selectedClientId);
      if (c) {
        targetClientId = c.id;
        clientName = c.name;
        clientBusiness = c.businessName;
        clientPhone = c.phone;
        clientWhatsapp = c.whatsapp;
        clientAddress = c.address;
      }
    }

    const validItems = orderItems
      .map((oi) => {
        const prod = products.find((p) => p.id === oi.productId);
        return prod ? { product: prod, quantity: oi.quantity } : null;
      })
      .filter((i): i is { product: (typeof products)[0]; quantity: number } => i !== null);

    if (validItems.length === 0) {
      alert('Selecciona productos válidos.');
      return;
    }

    const createdOrder = createOrder({
      clientId: targetClientId,
      clientName,
      clientBusiness,
      clientPhone,
      clientWhatsapp,
      clientAddress,
      items: validItems,
      notes: orderNotes,
      source: 'vendedor',
      vendedorId: vendedorProfile.id,
      vendedorName: vendedorProfile.name,
    });

    setShowNewOrderModal(false);
    setCreatedSuccessOrder(createdOrder);
    setOrderNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Pedidos de Mis Clientes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Levanta pedidos de clientes registrados o nuevos, genera comprobantes y exporta en PDF
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C9B368]" />
          Levantar Nuevo Pedido
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por folio (#FDL-...) o nombre del cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
        />
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Folio / Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Comprobante PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    No tienes pedidos registrados aún. Pulsa "Levantar Nuevo Pedido" para comenzar.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1B1A18]">#{order.orderNumber}</span>
                      <p className="text-[11px] text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1B1A18]">{order.clientName}</p>
                      {order.clientBusiness && (
                        <p className="text-[11px] text-stone-500">{order.clientBusiness}</p>
                      )}
                      <p className="text-[10px] text-stone-400">{order.clientWhatsapp}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1B1A18] text-sm">
                        ${(order.total ?? 0).toFixed(2)} MXN
                      </span>
                      <p className="text-[10px] text-stone-400">{order.items?.length || 0} productos</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* WhatsApp al cliente */}
                      <button
                        onClick={() => window.open(createWhatsAppOrderLink(order), '_blank')}
                        className="py-1 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        title="Enviar detalle del pedido por WhatsApp al cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Export PDF */}
                      <button
                        onClick={() => exportOrderPDF(order)}
                        className="py-1 px-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[#1B1A18] font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        title="Descargar comprobante en PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1B1A18]">Levantar Pedido para Cliente</h3>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Client Selection toggle */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 uppercase tracking-wide">
                    {isNewClient ? 'Nuevo Cliente al Vuelo' : 'Cliente Registrado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewClient(!isNewClient)}
                    className="text-xs text-[#C9B368] font-bold hover:underline cursor-pointer"
                  >
                    {isNewClient ? 'Seleccionar existente' : '+ Crear Cliente Nuevo'}
                  </button>
                </div>

                {isNewClient ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del cliente *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Negocio / Empresa (Opcional)"
                      value={newClientBusiness}
                      onChange={(e) => setNewClientBusiness(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp del cliente *"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Dirección de entrega"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white font-medium"
                      required
                    >
                      <option value="">-- Elige un cliente de tu lista --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Items row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700">Productos del Catálogo</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-[#C9B368] font-bold hover:underline cursor-pointer"
                  >
                    + Agregar otro producto
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#FAF8F5] rounded-xl border border-stone-200">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const copy = [...orderItems];
                        copy[idx].productId = e.target.value;
                        setOrderItems(copy);
                      }}
                      className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name} (${(p.price ?? 0).toFixed(2)}) - Stock: {p.stock ?? 0}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...orderItems];
                        copy[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setOrderItems(copy);
                      }}
                      className="w-16 p-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-center"
                    />

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dedicatoria / Observaciones</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Instrucciones para entrega o tarjeta de regalo..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmar y Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h3 className="font-bold text-base text-[#1B1A18]">
                  Pedido #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('es-MX')}
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
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 space-y-1">
                <p><strong>Cliente:</strong> {selectedOrder.clientName}</p>
                {selectedOrder.clientBusiness && <p><strong>Negocio:</strong> {selectedOrder.clientBusiness}</p>}
                <p><strong>Dirección:</strong> {selectedOrder.clientAddress}</p>
                <p><strong>WhatsApp:</strong> {selectedOrder.clientWhatsapp}</p>
                <p><strong>Estado:</strong> <span className="font-bold text-[#1B1A18]">{selectedOrder.status}</span></p>
              </div>

              {/* Items */}
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-[11px] text-stone-500">
                        SKU: {item.productCode || 'MED'} • Cantidad: {item.quantity} x ${(item.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">${(item.subtotal ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-right space-y-1">
                <p className="text-stone-600">Subtotal: ${(selectedOrder.subtotal ?? 0).toFixed(2)}</p>
                <p className="text-base font-bold text-[#1B1A18]">
                  Total: ${(selectedOrder.total ?? 0).toFixed(2)} MXN
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={() => window.open(createWhatsAppOrderLink(selectedOrder), '_blank')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Compartir por WhatsApp al Cliente
                </button>

                <button
                  onClick={() => exportOrderPDF(selectedOrder)}
                  className="py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C9B368]" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pedido Creado y Compartir Inmediato */}
      {createdSuccessOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1B1A18]">¡Pedido Guardado en Historial!</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Folio oficial: <strong className="text-[#1B1A18]">#{createdSuccessOrder.orderNumber}</strong> • Total: <strong>${(createdSuccessOrder.total ?? 0).toFixed(2)} MXN</strong>
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200 text-left text-xs space-y-1">
              <p><strong>Cliente:</strong> {createdSuccessOrder.clientName}</p>
              {createdSuccessOrder.clientBusiness && <p><strong>Negocio:</strong> {createdSuccessOrder.clientBusiness}</p>}
              <p><strong>WhatsApp:</strong> {createdSuccessOrder.clientWhatsapp}</p>
              <p><strong>Productos:</strong> {createdSuccessOrder.items.length} artículos</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  window.open(createWhatsAppOrderLink(createdSuccessOrder), '_blank');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Pedido por WhatsApp al Cliente</span>
              </button>

              <button
                onClick={() => exportOrderPDF(createdSuccessOrder)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-[#C9B368] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Descargar Comprobante PDF</span>
              </button>

              <button
                onClick={() => {
                  setSelectedOrder(createdSuccessOrder);
                  setCreatedSuccessOrder(null);
                }}
                className="text-xs text-stone-500 hover:underline pt-1 cursor-pointer block mx-auto"
              >
                Ver detalle completo en pantalla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
