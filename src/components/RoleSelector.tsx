import React from 'react';
import { ShieldCheck, Briefcase, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export const RoleSelector: React.FC = () => {
  const { setActiveRole, isSampleDataCleared, restoreSampleData } = useApp();

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-8">
      {/* Top utility bar: logo icon + PWA install */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src="https://appdesignproyectos.com/floricono.png"
            alt="Comercializadora Flor De Liz"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
          />
          <span className="text-xs uppercase tracking-widest text-[#1B1A18]/60 font-semibold hidden sm:inline">
            Sistema Comercial
          </span>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton variant="header" />
        </div>
      </div>

      {/* Main Center Area */}
      <div className="w-full max-w-4xl mx-auto my-auto flex flex-col items-center justify-center py-4 sm:py-6 text-center">
        {/* Full size unencapsulated logo as requested: 'no encapsules el logo, lo quiero ver de tamaño completo.' */}
        <div className="max-w-xs sm:max-w-md w-full flex justify-center px-4">
          <img
            src="https://appdesignproyectos.com/florlogo.png"
            alt="Comercializadora Flor De Liz"
            className="w-full max-h-24 sm:max-h-32 object-contain filter drop-shadow-xs transition-all duration-300"
          />
        </div>

        {/* System Name under the logo as requested: 'En el home debajo del logo pon el nombre del sistema: Comercializadora Flor De Liz' */}
        <div className="mt-3 sm:mt-4 mb-8 sm:mb-10 space-y-1">
          <h1 className="text-xl sm:text-3xl font-extrabold text-[#1B1A18] tracking-tight">
            Comercializadora Flor De Liz
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Suministros Médicos y Material de Curación
          </p>
        </div>

        {/* Role Selector Grid: Solo rol Admin, Vendedor y Cliente */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 max-w-3xl px-2">
          {/* Card 1: Admin */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="group relative flex flex-row sm:flex-col items-center sm:justify-center p-4 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center sm:mb-4 shrink-0 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm mr-4 sm:mr-0">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="text-left sm:text-center">
              <span className="text-base sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition block">
                Administrador
              </span>
              <span className="text-[11px] text-stone-400 sm:hidden">Control total, catálogo y finanzas</span>
            </div>
          </button>

          {/* Card 2: Vendedor */}
          <button
            onClick={() => handleSelectRole('vendedor')}
            className="group relative flex flex-row sm:flex-col items-center sm:justify-center p-4 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center sm:mb-4 shrink-0 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm mr-4 sm:mr-0">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="text-left sm:text-center">
              <span className="text-base sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition block">
                Vendedor
              </span>
              <span className="text-[11px] text-stone-400 sm:hidden">Pedidos, clientes y cotizaciones</span>
            </div>
          </button>

          {/* Card 3: Cliente */}
          <button
            onClick={() => handleSelectRole('cliente')}
            className="group relative flex flex-row sm:flex-col items-center sm:justify-center p-4 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-98"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center sm:mb-4 shrink-0 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm mr-4 sm:mr-0">
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="text-left sm:text-center">
              <span className="text-base sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition block">
                Cliente
              </span>
              <span className="text-[11px] text-stone-400 sm:hidden">Catálogo y compras WhatsApp</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer info & restore sample data if cleared */}
      <div className="w-full max-w-5xl mx-auto py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
        <p>© 2026 Comercializadora Flor De Liz. Todos los derechos reservados.</p>
        {isSampleDataCleared && (
          <button
            onClick={restoreSampleData}
            className="text-xs text-[#C9B368] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Restaurar datos de prueba
          </button>
        )}
      </div>
    </div>
  );
};
