import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  FileText,
  ShoppingBag,
  CheckCircle2,
  User,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportOrderPDF } from '../../utils/pdfExport';
import { Order } from '../../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    activeRole,
    clients,
    addClient,
    createOrder,
    clienteProfile,
    vendedorProfile,
    adminProfile,
    whatsappSupportNumber,
  } = useApp();

  // Vendedor order form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isNewClientForm, setIsNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientBusiness, setNewClientBusiness] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Order success state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleCheckout = (openWhatsApp: boolean = true) => {
    if (cart.length === 0) return;

    let targetClientId = '';
    let clientName = '';
    let clientBusiness = '';
    let clientPhone = '';
    let clientWhatsapp = '';
    let clientAddress = '';

    if (activeRole === 'cliente') {
      targetClientId = clienteProfile.id || 'cli_direct';
      clientName = clienteProfile.name || 'Cliente Particular';
      clientBusiness = clienteProfile.businessName || '';
      clientPhone = clienteProfile.phone || '5512345678';
      clientWhatsapp = clienteProfile.whatsapp || clientPhone;
      clientAddress = clienteProfile.address || 'Dirección acordada por chat';
    } else if (activeRole === 'vendedor' || activeRole === 'admin') {
      if (isNewClientForm || !selectedClientId) {
        if (!newClientName) {
          alert('Por favor introduce el nombre del cliente');
          return;
        }
        // Save new client
        const createdClient = addClient({
          name: newClientName,
          businessName: newClientBusiness,
          phone: newClientPhone || '5500000000',
          whatsapp: newClientPhone || '5500000000',
          address: newClientAddress || 'Por confirmar',
          active: true,
          createdByVendedorId: activeRole === 'vendedor' ? vendedorProfile.id : undefined,
        });
        targetClientId = createdClient.id;
        clientName = createdClient.name;
        clientBusiness = createdClient.businessName;
        clientPhone = createdClient.phone;
        clientWhatsapp = createdClient.whatsapp;
        clientAddress = createdClient.address;
      } else {
        const found = clients.find((c) => c.id === selectedClientId);
        if (found) {
          targetClientId = found.id;
          clientName = found.name;
          clientBusiness = found.businessName;
          clientPhone = found.phone;
          clientWhatsapp = found.whatsapp;
          clientAddress = found.address;
        }
      }
    }

    const order = createOrder({
      clientId: targetClientId,
      clientName,
      clientBusiness,
      clientPhone,
      clientWhatsapp,
      clientAddress,
      items: cart,
      notes: orderNotes,
      source: activeRole === 'cliente' ? 'cliente_whatsapp' : 'vendedor',
      vendedorId: activeRole === 'vendedor' ? vendedorProfile.id : undefined,
      vendedorName: activeRole === 'vendedor' ? vendedorProfile.name : 'Administración',
    });

    setCompletedOrder(order);
    clearCart();

    if (openWhatsApp) {
      handleSendWhatsApp(order);
    }

    // Store order ID locally so client orders list always includes this purchase
    if (activeRole === 'cliente') {
      try {
        const prev = JSON.parse(localStorage.getItem('flor_my_client_order_ids') || '[]');
        if (!prev.includes(order.id)) {
          localStorage.setItem('flor_my_client_order_ids', JSON.stringify([order.id, ...prev]));
        }
      } catch {}
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    const targetPhone = activeRole === 'cliente'
      ? (whatsappSupportNumber || adminProfile.whatsapp || '5512345678')
      : (order.clientWhatsapp || order.clientPhone || whatsappSupportNumber || adminProfile.whatsapp || '5512345678');
    const cleanPhone = targetPhone.replace(/\D/g, '');

    const itemsSummary = order.items
      .map(
        (i) => `• ${i.quantity}x ${i.productName} ($${i.subtotal.toFixed(2)})`
      )
      .join('\n');

    const message = `🌸 *PEDIDO FLOR DE LIZ* 🌸\n` +
      `*Folio:* #${order.orderNumber}\n` +
      `*Cliente:* ${order.clientName}\n` +
      (order.clientBusiness ? `*Negocio:* ${order.clientBusiness}\n` : '') +
      `*Teléfono:* ${order.clientPhone}\n` +
      `*Dirección:* ${order.clientAddress}\n\n` +
      `*DETALLE DE PRODUCTOS:*\n${itemsSummary}\n\n` +
      `*Subtotal:* $${order.subtotal.toFixed(2)} MXN\n` +
      (order.discountTotal > 0 ? `*Descuento:* -$${order.discountTotal.toFixed(2)} MXN\n` : '') +
      `*TOTAL:* $${order.total.toFixed(2)} MXN\n` +
      `*Estatus inicial:* ${order.status}\n` +
      (order.notes ? `*Notas:* ${order.notes}\n\n` : '\n') +
      `_Enviado desde Comercializadora Flor De Liz_`;

    const fullPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden text-[#1B1A18]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1B1A18]">Carrito de Pedido</h2>
              <p className="text-xs text-stone-500">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'} seleccionados
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCompletedOrder(null);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-stone-200/60 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Order Success State */}
        {completedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1B1A18]">¡Pedido Registrado con Éxito!</h3>
              <p className="text-sm text-stone-600 mt-1">
                Folio oficial: <strong className="text-[#1B1A18]">#{completedOrder.orderNumber}</strong>
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Total del pedido: <strong>${completedOrder.total.toFixed(2)} MXN</strong>
              </p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 text-left max-w-md mx-auto text-xs space-y-1.5">
              <p><strong>Cliente:</strong> {completedOrder.clientName}</p>
              {completedOrder.clientBusiness && <p><strong>Negocio:</strong> {completedOrder.clientBusiness}</p>}
              <p><strong>WhatsApp:</strong> {completedOrder.clientWhatsapp}</p>
              <p><strong>Estatus inicial:</strong> <span className="text-amber-700 font-bold">{completedOrder.status}</span></p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => handleSendWhatsApp(completedOrder)}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                title="Enviar detalle del pedido por WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Pedido por WhatsApp</span>
              </button>

              <button
                onClick={() => exportOrderPDF(completedOrder)}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#C9B368]" />
                <span>Descargar PDF</span>
              </button>
            </div>

            <button
              onClick={() => {
                setCompletedOrder(null);
                onClose();
              }}
              className="text-xs text-stone-500 hover:underline pt-2 cursor-pointer"
            >
              Cerrar ventana y continuar
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">Tu carrito está vacío</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Explora el catálogo y agrega arreglos florales o productos para armar tu pedido.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-5 py-2.5 rounded-xl bg-[#C9B368] text-[#1B1A18] font-bold text-xs hover:bg-[#b59f54] transition cursor-pointer"
            >
              Ver Catálogo
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Items list */}
            <div className="space-y-3 divide-y divide-stone-100">
              {cart.map(({ product, quantity }) => {
                const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
                const itemTotal = discountedPrice * quantity;
                return (
                  <div key={product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1B1A18] truncate">{product.name}</p>
                        <p className="text-[11px] text-stone-500">
                          SKU: {product.code} • ${product.price.toFixed(2)}
                          {product.discount > 0 && (
                            <span className="ml-1 text-emerald-600 font-semibold">
                              (-{product.discount}%)
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-bold text-[#1B1A18] mt-0.5">
                          ${itemTotal.toFixed(2)} MXN
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                        <button
                          onClick={() => updateCartQuantity(product.id, quantity - 1)}
                          className="p-1 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#1B1A18]">{quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(product.id, quantity + 1)}
                          className="p-1 hover:bg-stone-200 text-stone-600 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Client selection for Vendedor / Admin */}
            {activeRole !== 'cliente' && (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B1A18] uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C9B368]" />
                    Asignar Cliente al Pedido
                  </span>
                  <button
                    onClick={() => setIsNewClientForm(!isNewClientForm)}
                    className="text-xs text-[#C9B368] font-bold hover:underline cursor-pointer"
                  >
                    {isNewClientForm ? 'Seleccionar existente' : '+ Nuevo Cliente'}
                  </button>
                </div>

                {isNewClientForm ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <input
                      type="text"
                      placeholder="Nombre del cliente *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#C9B368]"
                    />
                    <input
                      type="text"
                      placeholder="Negocio / Empresa (Opcional)"
                      value={newClientBusiness}
                      onChange={(e) => setNewClientBusiness(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#C9B368]"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono / WhatsApp *"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#C9B368]"
                    />
                    <input
                      type="text"
                      placeholder="Dirección de entrega"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      className="p-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#C9B368]"
                    />
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#C9B368] text-[#1B1A18] font-medium"
                    >
                      <option value="">-- Selecciona un cliente registrado --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Order Notes */}
            <div>
              <textarea
                placeholder="Observaciones de entrega, dedicatoria floral o instrucciones especiales..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full p-3 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#C9B368] bg-white resize-none"
              />
            </div>

            {/* Total and Actions */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-stone-600">Total a Pagar:</span>
                <span className="text-xl font-bold text-[#1B1A18]">
                  ${cartTotal.toFixed(2)} MXN
                </span>
              </div>

              <button
                onClick={() => handleCheckout(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar y Enviar Pedido por WhatsApp</span>
              </button>

              <button
                onClick={() => handleCheckout(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Registrar en el Sistema sin abrir WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
