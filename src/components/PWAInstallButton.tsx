import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Apple, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' | 'compact' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled && !justInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        App Instalada
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar Comercializadora Flor de Líz en tu dispositivo"
        className={`flex items-center gap-1.5 font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer ${
          variant === 'header'
            ? 'px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] font-bold border border-[#C9B368]'
            : variant === 'hero'
            ? 'px-5 py-2.5 rounded-xl bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] text-sm shadow-md'
            : 'p-2 rounded-lg bg-[#C9B368]/20 hover:bg-[#C9B368]/30 text-[#1B1A18]'
        }`}
      >
        <Download className="w-4 h-4 text-[#1B1A18]" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {/* Installation Guide Modal (especially useful for iOS & browsers without ambient prompt) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 relative text-[#1B1A18]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#1B1A18] flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src="https://appdesignproyectos.com/floricono.png"
                  alt="Flor de Líz"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B1A18]">Instalar Flor de Líz</h3>
                <p className="text-xs text-stone-500">Comercializadora Flor de Líz PWA</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs uppercase tracking-wide">
                  <Apple className="w-4 h-4" />
                  Instrucciones para iPhone / iPad:
                </div>
                <ol className="space-y-2.5 text-xs text-stone-600 list-decimal pl-4">
                  <li>
                    Pulsa el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> en la barra inferior de Safari.
                  </li>
                  <li>
                    Desliza hacia abajo y selecciona <strong>Agregar al inicio</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-stone-800" />.
                  </li>
                  <li>
                    Pulsa <strong>Agregar</strong> en la esquina superior derecha. ¡Listo!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-[#C9B368]" />
                  Instrucciones Android y Computadoras:
                </div>
                <p className="text-xs text-stone-600">
                  {isInstallable
                    ? 'Haz clic en el botón de abajo para instalar la aplicación directamente en tu dispositivo con acceso rápido sin conexión.'
                    : 'Abre el menú de opciones de tu navegador (⋮ en Chrome o Edge) y selecciona "Instalar Flor de Líz" o "Agregar a la pantalla principal".'}
                </p>
                {isInstallable && (
                  <button
                    onClick={async () => {
                      const success = await install();
                      if (success) {
                        setShowModal(false);
                      }
                    }}
                    className="w-full mt-2 py-2.5 px-4 bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] font-bold text-xs rounded-lg transition"
                  >
                    Instalar ahora
                  </button>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#1B1A18] text-white text-xs font-semibold hover:bg-stone-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
