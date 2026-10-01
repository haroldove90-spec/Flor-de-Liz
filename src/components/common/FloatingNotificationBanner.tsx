import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  ShoppingBag,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingNotificationBanner: React.FC = () => {
  const {
    floatingNotification,
    dismissFloatingNotification,
    setActiveRole,
    setActiveTab,
    currentUser,
  } = useApp();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!floatingNotification) return;

    setProgress(100);
    const duration = 7500; // 7.5 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            dismissFloatingNotification();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [floatingNotification, isPaused, dismissFloatingNotification]);

  if (!floatingNotification) return null;

  const handleNavigateToModule = () => {
    // If admin, can navigate to any target role
    if (currentUser?.isAdmin) {
      if (floatingNotification.targetRole) {
        setActiveRole(floatingNotification.targetRole);
      }
    }

    // Set active tab based on module
    if (floatingNotification.module) {
      const mod = floatingNotification.module.toLowerCase();
      if (mod.includes('pedido')) setActiveTab('pedidos');
      else if (mod.includes('venta')) setActiveTab('ventas');
      else if (mod.includes('catalog')) setActiveTab('catalogo');
      else if (mod.includes('empleado')) setActiveTab('empleados');
      else if (mod.includes('cliente')) setActiveTab('clientes');
      else setActiveTab('notificaciones');
    } else {
      setActiveTab('notificaciones');
    }

    dismissFloatingNotification();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', icon: ShieldCheck, color: 'bg-[#1B1A18] text-[#C9B368] border-[#C9B368]/40' };
      case 'vendedor':
        return { label: 'Vendedor', icon: Briefcase, color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'cliente':
        return { label: 'Cliente', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: role, icon: Bell, color: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const roleInfo = getRoleBadge(floatingNotification.targetRole);
  const RoleIcon = roleInfo.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed top-4 sm:top-6 right-3 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] rounded-2xl bg-white/98 backdrop-blur-md border border-[#C9B368]/60 shadow-2xl p-4 transition-all duration-300 animate-in slide-in-from-top-4 sm:slide-in-from-right-4 ring-1 ring-black/5"
    >
      {/* Top Banner Bar: Role and Module Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role badge */}
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.color}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{roleInfo.label}</span>
          </span>

          {/* Module badge if specified */}
          {floatingNotification.module && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 capitalize">
              {floatingNotification.module}
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={dismissFloatingNotification}
          className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer shrink-0"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="mt-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center shrink-0 shadow-sm">
          {floatingNotification.type === 'order_created' ? (
            <Package className="w-5 h-5 text-[#C9B368]" />
          ) : floatingNotification.type === 'status_updated' ? (
            <Clock className="w-5 h-5 text-[#C9B368]" />
          ) : (
            <Bell className="w-5 h-5 text-[#C9B368]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-[#1B1A18] leading-snug">
            {floatingNotification.title}
          </h4>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed line-clamp-3">
            {floatingNotification.message}
          </p>

          {/* Bottom actions */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-400 font-medium">
              {new Date(floatingNotification.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>

            <button
              onClick={handleNavigateToModule}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-[#1B1A18] bg-[#C9B368] hover:bg-[#b59f54] transition shadow-xs cursor-pointer active:scale-95"
            >
              <span>Ver en módulo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Animated Time-remaining Progress Bar */}
      <div className="mt-3 w-full bg-stone-100 h-1 rounded-full overflow-hidden">
        <div
          className="bg-[#C9B368] h-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
