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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomBar: React.FC = () => {
  const { activeRole, activeTab, setActiveTab } = useApp();

  if (!activeRole) return null;

  const getNavItems = () => {
    switch (activeRole) {
      case 'admin':
        return [
          { id: 'metricas', label: 'Métricas', icon: BarChart3 },
          { id: 'catalogo', label: 'Catálogo', icon: Package },
          { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
          { id: 'empleados', label: 'Empleados', icon: Users },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'vendedor':
        return [
          { id: 'metricas', label: 'Métricas', icon: BarChart3 },
          { id: 'catalogo', label: 'Catálogo', icon: Package },
          { id: 'clientes', label: 'Clientes', icon: UserCheck },
          { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'cliente':
        return [
          { id: 'catalogo', label: 'Catálogo', icon: ShoppingBag },
          { id: 'pedidos', label: 'Mis Pedidos', icon: Clock },
          { id: 'notificaciones', label: 'Avisos', icon: Bell },
          { id: 'perfil', label: 'Mi Perfil', icon: User },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B1A18] border-t border-[#C9B368]/30 shadow-2xl px-2 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'text-[#C9B368] font-bold'
                  : 'text-[#C9B368]/70 hover:text-[#C9B368]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C9B368]/20 ring-1 ring-[#C9B368] text-[#C9B368] shadow-xs scale-105'
                    : 'bg-transparent text-[#C9B368]'
                }`}
              >
                <Icon className="w-5 h-5 text-[#C9B368]" />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#C9B368]' : 'font-medium text-[#C9B368]/80'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
