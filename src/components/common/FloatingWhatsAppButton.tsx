import React, { useState } from 'react';
import { MessageCircle, X, Edit3, Check, PhoneCall, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingWhatsAppButton: React.FC = () => {
  const { whatsappSupportNumber, updateWhatsappSupportNumber, currentUser, activeRole } = useApp();
  const [showTooltip, setShowTooltip] = useState(true);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [newNumber, setNewNumber] = useState(whatsappSupportNumber || '+527771053528');
  const [editSuccess, setEditSuccess] = useState(false);

  // Clean the number for WhatsApp URL (digits only)
  const cleanNumber = (whatsappSupportNumber || '+527771053528').replace(/\D/g, '');

  const defaultMessage = encodeURIComponent(
    'Hola, me comunico desde la tienda en línea de Comercializadora Flor De Liz. Deseo atención médica y asesoría sobre sus suministros médicos y material de curación.'
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  const handleSaveNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    const res = await updateWhatsappSupportNumber(newNumber.trim());
    if (res.success) {
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setIsEditingAdmin(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Admin Quick Editor Modal/Popover */}
      {isEditingAdmin && currentUser?.isAdmin && (
        <div className="pointer-events-auto bg-white/98 backdrop-blur-md border-2 border-[#C9B368] shadow-2xl rounded-2xl p-4 max-w-sm w-80 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-[#1B1A18] flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#C9B368]" />
              Línea WhatsApp de Asesoría
            </span>
            <button
              onClick={() => setIsEditingAdmin(false)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSaveNumber} className="mt-3 space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                Número con lada internacional (+52...):
              </label>
              <input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="+527771053528"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C9B368]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingAdmin(false)}
                className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-[#1B1A18] hover:bg-stone-800 text-[#C9B368] rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {editSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <span>Actualizar</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Informative Tooltip Chip */}
      {showTooltip && !isEditingAdmin && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#25D366]/40 shadow-xl rounded-2xl p-3 max-w-xs flex items-start gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse mt-1 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-[#1B1A18] leading-tight flex items-center justify-between">
              <span>¿Dudas o necesitas cotización?</span>
              {currentUser?.isAdmin && (
                <button
                  onClick={() => setIsEditingAdmin(true)}
                  className="text-[10px] text-[#C9B368] hover:text-[#b59f54] underline font-bold flex items-center gap-0.5 ml-2 cursor-pointer"
                  title="Actualizar número de WhatsApp como Administrador"
                >
                  <Edit3 className="w-3 h-3" />
                  Editar
                </button>
              )}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              Chatea en vivo con un asesor de ventas al{' '}
              <span className="font-semibold text-emerald-800">
                {whatsappSupportNumber || '+52 777 105 3528'}
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-700 p-0.5 rounded-full transition cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Floating WhatsApp Button */}
      <div className="flex items-center gap-2">
        {currentUser?.isAdmin && (
          <button
            onClick={() => setIsEditingAdmin(!isEditingAdmin)}
            className="pointer-events-auto p-2 rounded-full bg-[#1B1A18] text-[#C9B368] border border-[#C9B368]/40 shadow-lg hover:scale-105 transition cursor-pointer"
            title="Actualizar número de WhatsApp de soporte"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto group relative flex items-center gap-2.5 py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl hover:shadow-[#25D366]/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white/80"
          title={`Chatear por WhatsApp con un ejecutivo (${whatsappSupportNumber || '+52 777 105 3528'})`}
        >
          {/* WhatsApp Icon */}
          <div className="relative">
            <MessageCircle className="w-6 h-6 fill-white text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-ping" />
          </div>

          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
            Chatear con un Asesor
          </span>
        </a>
      </div>
    </div>
  );
};
