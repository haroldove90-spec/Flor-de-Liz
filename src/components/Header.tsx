import React, { useState } from 'react';
import {
  LogOut,
  Bell,
  ShoppingCart,
  Database,
  CheckCircle,
  Clock,
  Truck,
  Package,
  X,
  Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenSupabaseModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenSupabaseModal,
  onToggleSidebar,
}) => {
  const {
    activeRole,
    setActiveRole,
    cartItemCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllSampleData,
    isSampleDataCleared,
    restoreSampleData,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter notifications relevant to current active role
  const roleNotifications = notifications.filter(
    (n) => n.targetRole === activeRole || n.targetRole === 'admin' && activeRole === 'admin'
  );
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const getRoleBadge = () => {
    switch (activeRole) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-[#1B1A18] text-[#C9B368] border-[#C9B368]/30' };
      case 'vendedor':
        return { label: 'Vendedor', bg: 'bg-[#C9B368]/15 text-[#1B1A18] border-[#C9B368]/50' };
      case 'cliente':
        return { label: 'Cliente', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
      default:
        return { label: 'Usuario', bg: 'bg-stone-100 text-stone-700' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Menu toggle (desktop sidebar toggle or mobile menu) + Full Size Logo */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 text-stone-700 hover:text-[#1B1A18] hover:bg-stone-100 rounded-lg lg:hidden transition cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo del sistema y Título Institucional */}
          <div
            onClick={() => setActiveRole(null)}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group py-1 min-w-0"
            title="Comercializadora Flor De Liz - Ir al inicio"
          >
            <img
              src="https://appdesignproyectos.com/florlogo.png"
              alt="Comercializadora Flor De Liz"
              className="h-8 sm:h-11 md:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-102 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-base md:text-lg font-extrabold text-[#1B1A18] tracking-tight leading-tight truncate">
                Comercializadora Flor De Liz
              </span>
              <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden md:inline truncate">
                Suministros Médicos & Curación
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Active Role Badge, Quick PWA Install, Database Clear (admin), Notifications, Cart, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Active Role Identifier */}
          <div
            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md border ${roleBadge.bg} inline-flex items-center gap-1 sm:gap-1.5 shadow-2xs shrink-0`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9B368] animate-pulse" />
            <span>{roleBadge.label}</span>
          </div>

          {/* PWA Quick Install Button */}
          <PWAInstallButton variant="header" />

          {/* Admin Database Sample Data Cleaner */}
          {activeRole === 'admin' && (
            <div className="relative">
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Borrar datos de prueba del sistema"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-700" />
                <span>{isSampleDataCleared ? 'Datos limpios' : 'Borrar Muestra'}</span>
              </button>
            </div>
          )}

          {/* Cart Button (for Vendedor & Cliente) */}
          {activeRole !== 'admin' && onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-stone-700 hover:text-[#1B1A18] hover:bg-stone-100 transition cursor-pointer"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C9B368] text-[#1B1A18] text-xs font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-stone-700 hover:text-[#1B1A18] hover:bg-stone-100 transition cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-stone-200 shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1B1A18]">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 font-bold rounded-full">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead(activeRole || undefined)}
                      className="text-xs text-[#C9B368] hover:underline font-semibold cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 divide-y divide-stone-100">
                  {roleNotifications.length === 0 ? (
                    <p className="text-xs text-stone-400 py-6 text-center">
                      No hay notificaciones pendientes.
                    </p>
                  ) : (
                    roleNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`pt-2.5 first:pt-0 pb-1 px-2 rounded-lg cursor-pointer transition ${
                          notif.read ? 'opacity-70 bg-transparent' : 'bg-[#FAF8F5] font-medium'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 p-1 rounded-md bg-[#1B1A18] text-[#C9B368]">
                            {notif.type === 'order_created' ? (
                              <Package className="w-3.5 h-3.5" />
                            ) : notif.type === 'status_updated' ? (
                              <Truck className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#1B1A18]">{notif.title}</p>
                            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-stone-400 mt-1 inline-block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout / Switch Role Button */}
          <button
            onClick={() => setActiveRole(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-700 hover:text-red-600 hover:bg-red-50 border border-stone-200/80 transition text-xs sm:text-sm font-medium cursor-pointer"
            title="Cerrar sesión o cambiar de rol"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Clear Sample Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-[#1B1A18]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-[#1B1A18]">Gestión de Datos de Muestra</h3>
              </div>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
              Esta función elimina permanentemente todos los datos de muestra (productos demo, clientes demo, ventas de prueba y notificaciones).
            </p>

            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <strong>Nota de persistencia:</strong> Al pulsar borrar, se activará la directiva permanente para que el navegador <strong>nunca vuelva a cargar los datos de muestra</strong> automáticamente. Tus datos reales y catálogos nuevos se mantendrán limpios y listos para conectar con Supabase.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              {isSampleDataCleared && (
                <button
                  onClick={() => {
                    restoreSampleData();
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
                >
                  Restaurar Muestra
                </button>
              )}

              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  clearAllSampleData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition cursor-pointer"
              >
                Borrar Datos de Muestra
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
