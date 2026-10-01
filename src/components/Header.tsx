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
  ChevronDown,
  ShieldCheck,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenSupabaseModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenSupabaseModal,
}) => {
  const {
    activeRole,
    setActiveRole,
    setActiveTab,
    cartItemCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllSampleData,
    isSampleDataCleared,
    restoreSampleData,
    currentUser,
    adminProfile,
    vendedorProfile,
    clienteProfile,
    logout,
    canSwitchRoles,
    triggerTestNotification,
  } = useApp();

  const displayName =
    currentUser?.name ||
    (activeRole === 'admin'
      ? adminProfile.name
      : activeRole === 'vendedor'
      ? vendedorProfile.name
      : clienteProfile.name) ||
    'Usuario';

  const userPhoto =
    currentUser?.photoUrl ||
    (activeRole === 'admin'
      ? adminProfile.photoUrl
      : activeRole === 'vendedor'
      ? vendedorProfile.photoUrl
      : clienteProfile.photoUrl);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Filter notifications relevant to current active role
  const roleNotifications = notifications.filter(
    (n) => n.targetRole === activeRole || (n.targetRole === 'admin' && activeRole === 'admin')
  );
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const handleSwitchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setShowRoleMenu(false);
    if (newRole === 'admin') setActiveTab('metricas');
    else if (newRole === 'vendedor') setActiveTab('metricas');
    else if (newRole === 'cliente') setActiveTab('catalogo');
  };

  const getRoleBadge = () => {
    switch (activeRole) {
      case 'admin':
        return { label: 'Administración', bg: 'bg-[#1B1A18] text-[#C9B368] border-[#C9B368]/50', icon: ShieldCheck };
      case 'vendedor':
        return { label: 'Vendedor', bg: 'bg-[#C9B368]/15 text-[#1B1A18] border-[#C9B368]/50', icon: Briefcase };
      case 'cliente':
        return { label: 'Cliente', bg: 'bg-emerald-50 text-emerald-900 border-emerald-300', icon: ShoppingBag };
      default:
        return { label: 'Usuario', bg: 'bg-stone-100 text-stone-700 border-stone-200', icon: ShieldCheck };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Full Size Institutional Logo & Title */}
        <div className="flex items-center min-w-0">
          <div
            onClick={() => setActiveTab('catalogo')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group py-1 min-w-0"
            title="Comercializadora Flor De Liz - Ir al Catálogo"
          >
            <img
              src="https://appdesignproyectos.com/florlogo.png"
              alt="Comercializadora Flor De Liz"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain transition-transform duration-200 group-hover:scale-105 shrink-0 filter drop-shadow-2xs"
            />
            <div className="flex flex-col min-w-0 justify-center">
              <span className="text-xs sm:text-base md:text-lg font-extrabold text-[#1B1A18] tracking-tight leading-tight truncate">
                Comercializadora Flor De Liz
              </span>
              <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden sm:inline truncate">
                Suministros Médicos & Curación
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Active Role Badge / Navigator, Cart, Notifications, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin Role Navigator Button (Permite que solo el admin pueda navegar en todos los roles) */}
          {canSwitchRoles ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border ${roleBadge.bg} inline-flex items-center gap-1.5 shadow-xs transition hover:shadow-md cursor-pointer active:scale-98`}
                title="Menú exclusivo de Administrador: Navegar entre todos los roles"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9B368] animate-pulse" />
                <RoleIcon className="w-3.5 h-3.5" />
                <span>
                  {activeRole === 'admin'
                    ? 'Administración'
                    : `[Admin] ${roleBadge.label}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Role Switcher Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-stone-200 shadow-2xl p-2.5 z-50 animate-in fade-in duration-150 ring-1 ring-black/5">
                  <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Navegación de Roles
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Privilegio Administrador ({currentUser?.name})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Role: Admin */}
                    <button
                      onClick={() => handleSwitchRole('admin')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                        activeRole === 'admin'
                          ? 'bg-[#1B1A18] text-[#C9B368] font-bold'
                          : 'hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <div>
                          <div className="text-xs font-bold">Administrador</div>
                          <div className={`text-[10px] ${activeRole === 'admin' ? 'text-stone-300' : 'text-stone-400'}`}>
                            Control total, catálogo y empleados
                          </div>
                        </div>
                      </div>
                      {activeRole === 'admin' && <span className="w-2 h-2 rounded-full bg-[#C9B368]" />}
                    </button>

                    {/* Role: Vendedor */}
                    <button
                      onClick={() => handleSwitchRole('vendedor')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                        activeRole === 'vendedor'
                          ? 'bg-[#1B1A18] text-[#C9B368] font-bold'
                          : 'hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <div>
                          <div className="text-xs font-bold">Módulo Vendedor</div>
                          <div className={`text-[10px] ${activeRole === 'vendedor' ? 'text-stone-300' : 'text-stone-400'}`}>
                            Pedidos, clientes y cotizaciones
                          </div>
                        </div>
                      </div>
                      {activeRole === 'vendedor' && <span className="w-2 h-2 rounded-full bg-[#C9B368]" />}
                    </button>

                    {/* Role: Cliente */}
                    <button
                      onClick={() => handleSwitchRole('cliente')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                        activeRole === 'cliente'
                          ? 'bg-[#1B1A18] text-[#C9B368] font-bold'
                          : 'hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        <div>
                          <div className="text-xs font-bold">Vista Cliente</div>
                          <div className={`text-[10px] ${activeRole === 'cliente' ? 'text-stone-300' : 'text-stone-400'}`}>
                            Catálogo y pedidos en línea
                          </div>
                        </div>
                      </div>
                      {activeRole === 'cliente' && <span className="w-2 h-2 rounded-full bg-[#C9B368]" />}
                    </button>
                  </div>

                  {activeRole !== 'admin' && (
                    <div className="pt-2 mt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleSwitchRole('admin')}
                        className="w-full py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Volver a Administración</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Non-Admin static role badge (No puede navegar a otros roles) */
            <div
              className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border ${roleBadge.bg} inline-flex items-center gap-1.5 shadow-2xs shrink-0`}
              title="Rol asignado"
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleBadge.label}</span>
            </div>
          )}

          {/* Quick Return to Admin button if Admin is currently viewing as Vendedor or Cliente */}
          {canSwitchRoles && activeRole !== 'admin' && (
            <button
              onClick={() => handleSwitchRole('admin')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1B1A18] text-[#C9B368] hover:bg-stone-800 transition cursor-pointer shadow-xs"
              title="Volver a la vista de Administrador"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ir a Admin</span>
            </button>
          )}

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
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead(activeRole || undefined)}
                        className="text-xs text-[#C9B368] hover:underline font-semibold cursor-pointer"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 divide-y divide-stone-100">
                  {roleNotifications.length === 0 ? (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-xs text-stone-400">
                        No hay notificaciones pendientes.
                      </p>
                      <button
                        onClick={() => triggerTestNotification(activeRole || 'admin', 'pedidos')}
                        className="text-xs text-[#C9B368] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generar aviso de prueba</span>
                      </button>
                    </div>
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
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-[#1B1A18]">{notif.title}</p>
                              {notif.module && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 capitalize">
                                  {notif.module}
                                </span>
                              )}
                            </div>
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

          {/* User Profile Capsule */}
          <div
            onClick={() => setActiveTab('perfil')}
            className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200 cursor-pointer hover:opacity-85 transition"
            title={`Conectado como ${displayName} - Clic para ver Perfil`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-xs border border-[#C9B368]/60 shadow-xs">
              {userPhoto ? (
                <img src={userPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-[#1B1A18] leading-tight truncate max-w-[130px]">
                {displayName}
              </p>
              <p className="text-[10px] text-stone-500 capitalize">
                {currentUser?.username ? `@${currentUser.username}` : activeRole}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-700 hover:text-red-600 hover:bg-red-50 border border-stone-200/80 transition text-xs sm:text-sm font-medium cursor-pointer"
            title="Cerrar sesión segura"
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
