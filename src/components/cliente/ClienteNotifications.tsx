import React from 'react';
import { Bell, Truck, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ClienteNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead, clienteProfile } = useApp();

  const clientNotifs = notifications.filter(
    (n) => n.targetRole === 'cliente' || n.targetUserId === clienteProfile.id
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-2 border-b border-stone-200/80">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
          Avisos de Pedidos y Entrega
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Notificaciones automáticas sobre el avance de tus pedidos de suministros médicos y curación
        </p>
      </div>

      <div className="space-y-3">
        {clientNotifs.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
            <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">Sin avisos en este momento</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Te notificaremos en cuanto tu pedido sea recibido, preparado en almacén o salga en ruta hacia tu clínica o consultorio.
            </p>
          </div>
        ) : (
          clientNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition flex items-start gap-3.5 cursor-pointer ${
                notif.read ? 'bg-white border-stone-200 opacity-80' : 'bg-emerald-50/50 border-emerald-300 shadow-xs'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#1B1A18] text-[#C9B368] shrink-0">
                {notif.type === 'status_updated' ? (
                  <Truck className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18]">{notif.title}</h3>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>
                <p className="text-[11px] text-stone-400">
                  {new Date(notif.createdAt).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
