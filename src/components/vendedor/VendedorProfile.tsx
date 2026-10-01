import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Save,
  Loader2,
  Cloud,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImageFile } from '../../utils/imageOptimizer';

export const VendedorProfile: React.FC = () => {
  const { vendedorProfile, currentUser, updateProfile, saveProfileToSupabase, supabaseConfig } = useApp();

  const [name, setName] = useState(vendedorProfile.name || 'Harold Anguiano');
  const [username, setUsername] = useState(vendedorProfile.username || currentUser?.username || 'haroldo90');
  const [password, setPassword] = useState(vendedorProfile.password || currentUser?.password || 'Chevropar#1970');
  const [confirmPassword, setConfirmPassword] = useState(vendedorProfile.password || currentUser?.password || 'Chevropar#1970');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [businessName, setBusinessName] = useState(vendedorProfile.businessName || '');
  const [email, setEmail] = useState(vendedorProfile.email || 'haroldo90@flordeliz.com');
  const [phone, setPhone] = useState(vendedorProfile.phone || '5578901234');
  const [whatsapp, setWhatsapp] = useState(vendedorProfile.whatsapp || '5578901234');
  const [address, setAddress] = useState(vendedorProfile.address || 'Sucursal Central, Ciudad de México');
  const [photoUrl, setPhotoUrl] = useState(vendedorProfile.photoUrl || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vacía', color: 'bg-stone-200 text-stone-500', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Débil', color: 'bg-red-500 text-red-700', width: '25%' };
      case 2:
        return { score: 2, label: 'Regular', color: 'bg-amber-500 text-amber-700', width: '50%' };
      case 3:
        return { score: 3, label: 'Buena', color: 'bg-blue-500 text-blue-700', width: '75%' };
      case 4:
        return { score: 4, label: 'Segura y Fuerte', color: 'bg-emerald-500 text-emerald-700', width: '100%' };
      default:
        return { score: 1, label: 'Débil', color: 'bg-red-500 text-red-700', width: '20%' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleGenerateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let generated = 'Flor2026!';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setSyncStatus({
      type: 'info',
      text: '¡Contraseña segura generada automáticamente! Pulsa "Guardar Perfil de Vendedor" para confirmarla.',
    });
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingPhoto(true);
        setSyncStatus({ type: 'info', text: 'Comprimiendo foto para el perfil de Harold Anguiano...' });
        const compressed = await compressImageFile(file, 400, 400, 0.85);
        setPhotoUrl(compressed);

        setSyncStatus({ type: 'info', text: 'Guardando foto en Supabase...' });
        const res = await saveProfileToSupabase('vendedor', {
          name,
          username,
          password,
          businessName,
          email,
          phone,
          whatsapp,
          address,
          photoUrl: compressed,
        });

        setIsUploadingPhoto(false);
        if (res.success) {
          setSyncStatus({ type: 'success', text: '¡Foto de perfil actualizada exclusivamente para tu usuario en Supabase!' });
        } else {
          setSyncStatus({ type: 'info', text: 'Foto guardada en navegador local.' });
        }
        setTimeout(() => setSyncStatus(null), 4000);
      } catch (err: unknown) {
        setIsUploadingPhoto(false);
        const msg = err instanceof Error ? err.message : 'Error al procesar la foto';
        setSyncStatus({ type: 'error', text: `No se pudo procesar la foto: ${msg}` });
        setTimeout(() => setSyncStatus(null), 4000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setSyncStatus({ type: 'error', text: 'El nombre de usuario no puede estar vacío.' });
      return;
    }

    if (password !== confirmPassword) {
      setSyncStatus({ type: 'error', text: 'Las contraseñas no coinciden. Por favor verifícalas.' });
      return;
    }

    setIsSaving(true);
    setSyncStatus({ type: 'info', text: 'Guardando perfil de vendedor en Supabase...' });

    const res = await updateProfile('vendedor', {
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      businessName,
      email,
      phone,
      whatsapp,
      address,
      photoUrl,
    });

    setIsSaving(false);
    if (res.success) {
      setSyncStatus({ type: 'success', text: '¡Perfil, usuario y contraseña de vendedor guardados en Supabase con éxito!' });
    } else {
      setSyncStatus({ type: 'info', text: res.message || 'Perfil guardado en memoria local.' });
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-2 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Perfil de Vendedor ({name})
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Configura tu usuario, contraseña segura y fotografía personal con respaldo en Supabase
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase: {supabaseConfig.projectId || 'ylzgfsvcibqsztarglja'}</span>
        </div>
      </div>

      {syncStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : syncStatus.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : syncStatus.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
          )}
          <span className="font-medium">{syncStatus.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Photo */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-100">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-3xl border-3 border-[#C9B368] shadow-md">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto de Perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0) || 'H'}</span>
              )}
            </div>
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2.5 bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] rounded-full shadow-lg transition cursor-pointer disabled:opacity-50"
              title="Cambiar foto de perfil y sincronizar en Supabase"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1B1A18]" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
            <h3 className="font-bold text-lg text-[#1B1A18] truncate">{name}</h3>
            <p className="text-xs text-stone-500 font-medium">
              Usuario de Sistema: <span className="font-mono font-bold text-stone-700">@{username}</span> • Rol: Asesor Comercial
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-xs font-bold text-[#1B1A18] bg-[#C9B368]/20 hover:bg-[#C9B368]/35 border border-[#C9B368]/50 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                {isUploadingPhoto ? 'Subiendo...' : 'Seleccionar Foto'}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    setPhotoUrl('');
                    await saveProfileToSupabase('vendedor', { photoUrl: '' });
                    setSyncStatus({ type: 'success', text: 'Foto eliminada exclusivamente de tu perfil.' });
                    setTimeout(() => setSyncStatus(null), 3000);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Quitar foto
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              Esta fotografía es exclusiva de tu usuario de Asesor Comercial y no modifica los perfiles de otros usuarios ni del Administrador.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Card: Credenciales de Acceso */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#C9B368]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1B1A18]">
                  Credenciales de Acceso de Vendedor
                </h4>
              </div>
              <button
                type="button"
                onClick={handleGenerateSecurePassword}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                title="Generar contraseña segura recomendada"
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Generar Contraseña</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre de Usuario * <span className="text-[10px] text-stone-400 font-normal">(Login de acceso)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: haroldo90"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Contraseña Segura *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-500 font-medium">Seguridad:</span>
                    <span className={`font-bold ${strength.score >= 3 ? 'text-emerald-700' : strength.score === 2 ? 'text-amber-700' : 'text-red-700'}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score >= 3 ? 'bg-emerald-500' : strength.score === 2 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña para confirmar"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {password && confirmPassword && (
                  <p className={`text-[10px] mt-1 font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                    {password === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Harold Anguiano"
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Puesto / División</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Flor de Líz - División Suministros Médicos"
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Teléfono Personal / Ventas</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">WhatsApp de Atención Comercial</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Ubicación / Sucursal</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-medium bg-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C9B368]" />
              ) : (
                <Save className="w-4 h-4 text-[#C9B368]" />
              )}
              {isSaving ? 'Guardando en Supabase...' : 'Guardar Perfil de Vendedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
