import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Briefcase,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

export const LoginForm: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() && !password.trim()) {
      setError('Por favor ingresa tu nombre de usuario y/o contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = login({ username: username.trim(), password: password.trim() });
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  const handleQuickLogin = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
    login({ username: userVal, password: passVal });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-8 selection:bg-[#C9B368]/30">
      {/* Top Utility Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src="https://appdesignproyectos.com/floricono.png"
            alt="Comercializadora Flor De Liz"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
          />
          <span className="text-xs uppercase tracking-widest text-[#1B1A18]/60 font-semibold hidden sm:inline">
            Sistema Comercial Privado
          </span>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton variant="header" />
        </div>
      </div>

      {/* Main Center Login Container */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center py-4">
        {/* Full Size Logo */}
        <div className="max-w-xs sm:max-w-sm w-full flex justify-center px-4 mb-2">
          <img
            src="https://appdesignproyectos.com/florlogo.png"
            alt="Comercializadora Flor De Liz"
            className="w-full max-h-24 sm:max-h-28 object-contain filter drop-shadow-xs"
          />
        </div>

        {/* System Title */}
        <div className="mt-2 mb-6 text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1B1A18] tracking-tight">
            Comercializadora Flor De Liz
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Suministros Médicos y Material de Curación
          </p>
        </div>

        {/* Private Access Card */}
        <div className="w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#1B1A18] text-[#C9B368]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1B1A18]">Acceso al Sistema</h2>
                <p className="text-[11px] text-stone-400">Portal exclusivo para personal autorizado</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Privado
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Usuario */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                <span>Nombre de Usuario</span>
                <span className="text-[10px] text-stone-400 font-normal">o identificador</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej: emilio_admin o haroldo90"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B368]/50 focus:border-[#C9B368] transition bg-stone-50/50 hover:bg-white"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                <span>Contraseña</span>
                <span className="text-[10px] text-stone-400 font-normal">clave de acceso</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B368]/50 focus:border-[#C9B368] transition bg-stone-50/50 hover:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 italic bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-200/80">
              💡 Puedes acceder ingresando tu <strong>nombre de usuario</strong> y/o tu <strong>contraseña</strong> asignada.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-[#C9B368] hover:text-[#d8c37d] font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Verificando...' : 'Ingresar al Sistema'}</span>
            </button>
          </form>

          {/* Quick Access Credentials Required by User */}
          <div className="pt-3 border-t border-stone-100 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block text-center">
              Credenciales autorizadas en el sistema
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('emilio_admin', 'Admin#1')}
                className="group p-2.5 rounded-xl border border-stone-200 hover:border-[#C9B368] bg-stone-50/60 hover:bg-white transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-[#1B1A18] text-[#C9B368] group-hover:scale-105 transition">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#1B1A18]">Administrador</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  <div>User: <span className="font-semibold text-stone-700">emilio_admin</span></div>
                  <div>Pass: <span className="font-semibold text-stone-700">Admin#1</span></div>
                </div>
              </button>

              {/* Haroldo Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('haroldo90', 'Chevropar#1970')}
                className="group p-2.5 rounded-xl border border-stone-200 hover:border-[#C9B368] bg-stone-50/60 hover:bg-white transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-[#1B1A18] text-[#C9B368] group-hover:scale-105 transition">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#1B1A18]">Vendedor</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  <div>User: <span className="font-semibold text-stone-700">haroldo90</span></div>
                  <div>Pass: <span className="font-semibold text-stone-700">Chevropar#1970</span></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-stone-400">
        <p>© 2026 Comercializadora Flor De Liz • Todos los derechos reservados.</p>
      </div>
    </div>
  );
};
