import React from 'react';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  User,
  ShoppingBag,
  Clock,
  Bell,
  UserCheck,
  LogOut,
  Database,
  CloudLightning,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenSupabaseModal,
}) => {
  const {
    activeRole,
    setActiveRole,
    activeTab,
    setActiveTab,
    adminProfile,
    vendedorProfile,
    clienteProfile,
    isSampleDataCleared,
    clearAllSampleData,
    restoreSampleData,
    supabaseConfig,
    currentUser,
    logout,
  } = useApp();

  if (!activeRole) return null;

  const getProfile = () => {
    switch (activeRole) {
      case 'admin':
        return adminProfile;
      case 'vendedor':
        return vendedorProfile;
      case 'cliente':
        return clienteProfile;
    }
  };

  const currentProfile = getProfile();
  const isRoleMatchingAuth = currentUser?.role === activeRole;

  const displayName =
    (isRoleMatchingAuth && currentUser?.name && !currentUser.name.includes(activeRole === 'admin' ? 'Harold' : 'Emilio')
      ? currentUser.name
      : currentProfile?.name) ||
    (activeRole === 'admin' ? 'Emilio Administrador' : activeRole === 'vendedor' ? 'Harold Anguiano' : 'Cliente');

  const userPhoto =
    activeRole === 'admin'
      ? (adminProfile.photoUrl || (isRoleMatchingAuth ? currentUser?.photoUrl : '') || '')
      : activeRole === 'vendedor'
      ? (vendedorProfile.photoUrl || (isRoleMatchingAuth ? currentUser?.photoUrl : '') || '')
      : (clienteProfile?.photoUrl || '');

  const userSubtitle =
    (isRoleMatchingAuth && currentUser?.username ? `@${currentUser.username}` : undefined) ||
    (currentProfile?.username ? `@${currentProfile.username}` : currentProfile?.businessName || currentProfile?.email);

  const getMenuItems = () => {
    switch (activeRole) {
      case 'admin':
        return [
          { id: 'metricas', label: 'Métricas Generales', icon: BarChart3, desc: 'Ventas, KPIs y balance' },
          { id: 'catalogo', label: 'Catálogo de Productos', icon: Package, desc: 'Inventario, precios y stock' },
          { id: 'ventas', label: 'Historial de Ventas', icon: ShoppingCart, desc: 'Pedidos y exportación PDF' },
          { id: 'empleados', label: 'Gestión de Empleados', icon: Users, desc: 'Vendedores y credenciales' },
          { id: 'notificaciones', label: 'Avisos y Alertas', icon: Bell, desc: 'Nuevos pedidos y estados' },
          { id: 'perfil', label: 'Perfil de Administrador', icon: User, desc: 'Datos de la empresa y contacto' },
        ];
      case 'vendedor':
        return [
          { id: 'metricas', label: 'Métricas de Ventas', icon: BarChart3, desc: 'Ventas del día y del mes' },
          { id: 'catalogo', label: 'Catálogo & Carrito', icon: Package, desc: 'Productos y levantar pedidos' },
          { id: 'clientes', label: 'Registro de Clientes', icon: UserCheck, desc: 'Crear, editar y gestionar' },
          { id: 'pedidos', label: 'Pedidos Realizados', icon: ShoppingCart, desc: 'Exportar PDF y Comprobantes' },
          { id: 'notificaciones', label: 'Notificaciones', icon: Bell, desc: 'Avisos y pedidos asignados' },
          { id: 'perfil', label: 'Perfil de Vendedor', icon: User, desc: 'Datos personales y contacto' },
        ];
      case 'cliente':
        return [
          { id: 'catalogo', label: 'Catálogo de Suministros', icon: ShoppingBag, desc: 'Material médico y pedidos' },
          { id: 'pedidos', label: 'Mis Pedidos', icon: Clock, desc: 'Estatus en ruta y anteriores' },
          { id: 'notificaciones', label: 'Notificaciones', icon: Bell, desc: 'Actualizaciones de tu pedido' },
          { id: 'perfil', label: 'Mis Datos Comerciales', icon: User, desc: 'Dirección de envío y contacto' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header inside sidebar */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://appdesignproyectos.com/floricono.png"
              alt="Comercializadora Flor De Liz"
              className="w-8 h-8 object-contain"
            />
            <div>
              <p className="font-bold text-sm text-[#1B1A18] tracking-tight">Flor De Liz</p>
              <p className="text-[11px] text-stone-500 capitalize">{activeRole} Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Módulos del Sistema
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#1B1A18] text-white shadow-sm font-semibold'
                    : 'text-stone-700 hover:bg-stone-100/80 hover:text-[#1B1A18]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-[#C9B368] text-[#1B1A18]' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.label}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Supabase Bridge Button */}
          {activeRole === 'admin' && onOpenSupabaseModal && (
            <div className="pt-4 mt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  onOpenSupabaseModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-950">Conectar Supabase</p>
                  <p className="text-[10px] text-emerald-700">
                    {supabaseConfig.connected ? '✓ Sincronizado en la nube' : 'Configurar base de datos'}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 space-y-3">
          {/* User profile capsule */}
          <div
            onClick={() => setActiveTab('perfil')}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-stone-200/50 transition cursor-pointer"
            title={`Perfil de ${displayName} - Clic para ver`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-xs uppercase shadow-xs border border-[#C9B368]/50 shrink-0">
              {userPhoto ? (
                <img src={userPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1B1A18] truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-stone-500 truncate">
                {userSubtitle}
              </p>
            </div>
          </div>

          {/* Sample Data Clear status */}
          {activeRole === 'admin' && (
            <div className="flex items-center justify-between px-2 text-[11px] text-stone-500">
              <span>Datos del sistema:</span>
              {isSampleDataCleared ? (
                <button
                  onClick={restoreSampleData}
                  className="text-xs font-semibold text-[#C9B368] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Restaurar
                </button>
              ) : (
                <button
                  onClick={clearAllSampleData}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  Limpiar Muestra
                </button>
              )}
            </div>
          )}

          {/* Switch Role Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión / Salir
          </button>
        </div>
      </aside>
    </>
  );
};
