import React from 'react';
import { ShieldCheck, Briefcase, ShoppingBag, UserPlus, Sparkles } from 'lucide-react';
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
      {/* Top utility bar: discreet logo + PWA install */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center gap-3">
          <img
            src="https://appdesignproyectos.com/floricono.png"
            alt="Flor de Líz"
            className="w-9 h-9 object-contain"
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
      <div className="w-full max-w-5xl mx-auto my-auto flex flex-col items-center justify-center py-6 text-center">
        {/* Full size unencapsulated logo as requested: 'no encapsules el logo, lo quiero ver de tamaño completo.' */}
        <div className="mb-10 max-w-md sm:max-w-lg w-full flex justify-center px-4">
          <img
            src="https://appdesignproyectos.com/florlogo.png"
            alt="Comercializadora Flor de Líz"
            className="w-full max-h-24 sm:max-h-32 object-contain filter drop-shadow-xs transition-all duration-300"
          />
        </div>

        {/* Role Selector Grid: Cuadrícula 2 Columnas Móvil / 4 Columnas Escritorio. 
            Sin header, sin descripciones, solo nombre del rol. */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 max-w-4xl px-2">
          {/* Card 1: Admin */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-9 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition">
              Administrador
            </span>
          </button>

          {/* Card 2: Vendedor */}
          <button
            onClick={() => handleSelectRole('vendedor')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-9 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition">
              Vendedor
            </span>
          </button>

          {/* Card 3: Cliente */}
          <button
            onClick={() => handleSelectRole('cliente')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-9 rounded-2xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#C9B368] group-hover:text-[#1B1A18] transition-all duration-300 shadow-sm">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#1B1A18] tracking-wide group-hover:text-[#b59f54] transition">
              Cliente
            </span>
          </button>

          {/* Card 4: Nuevo Cliente / Registro */}
          <button
            onClick={() => handleSelectRole('cliente')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-9 rounded-2xl bg-[#1B1A18] border border-[#1B1A18] shadow-sm hover:shadow-xl hover:border-[#C9B368] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95 text-white"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#C9B368] text-[#1B1A18] flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <UserPlus className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-sm sm:text-base font-bold text-white tracking-wide group-hover:text-[#C9B368] transition">
              Nuevo Cliente
            </span>
          </button>
        </div>
      </div>

      {/* Footer info & restore sample data if cleared */}
      <div className="w-full max-w-5xl mx-auto py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
        <p>© 2026 Comercializadora Flor de Líz. Todos los derechos reservados.</p>
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
