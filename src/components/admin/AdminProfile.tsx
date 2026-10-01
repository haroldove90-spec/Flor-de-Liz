import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  Save,
  Loader2,
  Cloud,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImageFile } from '../../utils/imageOptimizer';

export const AdminProfile: React.FC = () => {
  const { adminProfile, updateProfile, saveProfileToSupabase, supabaseConfig } = useApp();

  const [name, setName] = useState(adminProfile.name);
  const [businessName, setBusinessName] = useState(adminProfile.businessName || '');
  const [email, setEmail] = useState(adminProfile.email);
  const [phone, setPhone] = useState(adminProfile.phone);
  const [whatsapp, setWhatsapp] = useState(adminProfile.whatsapp);
  const [address, setAddress] = useState(adminProfile.address);
  const [photoUrl, setPhotoUrl] = useState(adminProfile.photoUrl || '');

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingPhoto(true);
        setSyncStatus({ type: 'info', text: 'Comprimiendo y optimizando foto para Supabase...' });

        // Compress image to max 400x400 JPEG for ultra fast loading and storage
        const compressedBase64 = await compressImageFile(file, 400, 400, 0.85);
        setPhotoUrl(compressedBase64);

        setSyncStatus({ type: 'info', text: 'Guardando foto de perfil en Supabase...' });
        const res = await saveProfileToSupabase('admin', {
          name,
          businessName,
          email,
          phone,
          whatsapp,
          address,
          photoUrl: compressedBase64,
        });

        setIsUploadingPhoto(false);
        if (res.success) {
          setSyncStatus({
            type: 'success',
            text: '¡Foto de perfil subida y sincronizada exitosamente en Supabase!',
          });
        } else {
          setSyncStatus({
            type: 'info',
            text: 'Foto guardada localmente (pendiente de conexión con Supabase).',
          });
        }
        setTimeout(() => setSyncStatus(null), 4500);
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
    setIsSaving(true);
    setSyncStatus({ type: 'info', text: 'Guardando datos y foto en Supabase...' });

    const res = await updateProfile('admin', {
      name,
      businessName,
      email,
      phone,
      whatsapp,
      address,
      photoUrl,
    });

    setIsSaving(false);
    if (res.success) {
      setSyncStatus({
        type: 'success',
        text: '¡Perfil y foto corporativa guardados y sincronizados en Supabase con éxito!',
      });
    } else {
      setSyncStatus({
        type: 'info',
        text: res.message || 'Datos guardados en memoria local.',
      });
    }
    setTimeout(() => setSyncStatus(null), 4500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-2 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Perfil del Administrador
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Configura tus datos de contacto corporativo y foto de perfil con respaldo en Supabase
          </p>
        </div>

        {/* Cloud sync indicator */}
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

      {/* Form Container */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Photo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-100">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-3xl border-3 border-[#C9B368] shadow-md">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto de Perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0) || 'A'}</span>
              )}
            </div>

            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2.5 bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] rounded-full shadow-lg transition cursor-pointer disabled:opacity-50"
              title="Subir y guardar foto de perfil en Supabase"
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

          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="font-bold text-lg text-[#1B1A18]">{name}</h3>
            <p className="text-xs text-stone-500 font-medium">
              Rol: Administrador General del Sistema
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
                    await saveProfileToSupabase('admin', { photoUrl: '' });
                    setSyncStatus({ type: 'success', text: 'Foto eliminada de Supabase.' });
                    setTimeout(() => setSyncStatus(null), 3000);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Quitar foto
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              Formatos compatibles: JPG, PNG, WEBP. Se optimiza y sincroniza en Supabase automáticamente.
            </p>
          </div>
        </div>

        {/* Inputs form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Razón Social / Negocio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
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
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Teléfono Corporativo</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">WhatsApp Oficial</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Dirección Corporativa</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
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
              {isSaving ? 'Guardando en Supabase...' : 'Guardar Cambios de Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
