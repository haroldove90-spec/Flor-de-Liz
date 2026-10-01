import React from 'react';
import { Bell, Truck, Package, Clock, CheckCircle2, Check, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const VendedorNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, vendedorProfile } = useApp();

  const vendedorNotifs = notifications.filter(
    (n) => n.targetRole === 'vendedor' || n.targetUserId === vendedorProfile.id || n.targetRole === 'admin'
  );
  const unreadCount = vendedorNotifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Notificaciones de Vendedor
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Avisos de pedidos, cotizaciones y cambios de estatus de clientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead('vendedor')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#C9B368]" />
              Marcar leídas
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {vendedorNotifs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-stone-200 p-6">
            <Bell className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">Sin notificaciones pendientes</p>
            <p className="text-xs text-stone-400 mt-1">
              Aquí verás los avisos cuando tus pedidos sean procesados o se actualice su entrega.
            </p>
          </div>
        ) : (
          vendedorNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                notif.read
                  ? 'bg-white border-stone-200/80 opacity-80'
                  : 'bg-amber-50/40 border-[#C9B368]/50 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    notif.type === 'order_created'
                      ? 'bg-[#1B1A18] text-[#C9B368]'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {notif.type === 'order_created' ? (
                    <Package className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18]">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {notif.module && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 rounded-md capitalize">
                        {notif.module}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>
                  <p className="text-[11px] text-stone-400">
                    {new Date(notif.createdAt).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notif.id);
                  }}
                  className="p-1 text-stone-400 hover:text-emerald-600 cursor-pointer"
                  title="Marcar como leída"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
