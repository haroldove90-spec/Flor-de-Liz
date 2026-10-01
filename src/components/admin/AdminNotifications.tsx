import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  Volume2,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playNotificationSound } from '../../utils/audioPlayer';

export const AdminNotifications: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    triggerTestNotification,
  } = useApp();

  const [selectedModule, setSelectedModule] = useState<string>('todos');

  const adminNotifs = notifications.filter((n) => n.targetRole === 'admin');
  const filteredNotifs = selectedModule === 'todos'
    ? adminNotifs
    : adminNotifs.filter((n) => (n.module || 'pedidos').toLowerCase().includes(selectedModule.toLowerCase()));

  const unreadCount = adminNotifs.filter((n) => !n.read).length;

  const modules = [
    { id: 'todos', label: 'Todos' },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'empleados', label: 'Empleados' },
    { id: 'sistema', label: 'Sistema' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Centro de Notificaciones y Alertas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Avisos en tiempo real sobre nuevas ventas, pedidos y actividades del personal
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Audio Test Button */}
          <button
            onClick={() => {
              playNotificationSound();
              triggerTestNotification('admin', 'pedidos');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            title="Probar sonido WhatsApp y disparar aviso emergente"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Probar Sonido</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead('admin')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#C9B368]" />
              Marcar leídas
            </button>
          )}
        </div>
      </div>

      {/* Module Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-stone-400 mr-1 shrink-0" />
        {modules.map((m) => {
          const isActive = selectedModule === m.id;
          const count = m.id === 'todos'
            ? adminNotifs.length
            : adminNotifs.filter((n) => (n.module || 'pedidos').toLowerCase().includes(m.id)).length;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1B1A18] text-[#C9B368] shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{m.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-[#C9B368] text-[#1B1A18]' : 'bg-stone-100 text-stone-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
            <Bell className="w-12 h-12 text-stone-300 mx-auto mb-1" />
            <p className="text-sm font-semibold text-stone-700">Sin notificaciones en este módulo</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Aquí aparecerán las alertas cuando tus vendedores o clientes registren actividad.
            </p>
            <button
              onClick={() => triggerTestNotification('admin', selectedModule === 'todos' ? 'pedidos' : selectedModule)}
              className="mt-2 text-xs font-bold text-[#1B1A18] bg-[#C9B368] hover:bg-[#b59f54] px-3.5 py-1.5 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar notificación de prueba</span>
            </button>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
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
                  ) : notif.type === 'status_updated' ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-[#1B1A18]">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {notif.module && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 rounded-md capitalize">
                        Módulo: {notif.module}
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
