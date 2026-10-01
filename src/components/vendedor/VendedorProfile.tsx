import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const VendedorProfile: React.FC = () => {
  const { vendedorProfile, updateProfile } = useApp();

  const [name, setName] = useState(vendedorProfile.name);
  const [businessName, setBusinessName] = useState(vendedorProfile.businessName || '');
  const [email, setEmail] = useState(vendedorProfile.email);
  const [phone, setPhone] = useState(vendedorProfile.phone);
  const [whatsapp, setWhatsapp] = useState(vendedorProfile.whatsapp);
  const [address, setAddress] = useState(vendedorProfile.address);
  const [photoUrl, setPhotoUrl] = useState(vendedorProfile.photoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile('vendedor', {
      name,
      businessName,
      email,
      phone,
      whatsapp,
      address,
      photoUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-2 border-b border-stone-200/80">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
          Perfil de Vendedor
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Tus datos personales y número de contacto comercial para atención de clientes
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Perfil de vendedor actualizado con éxito!</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Photo */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-stone-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-2xl border-2 border-[#C9B368] shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto de Perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] rounded-full shadow-md transition cursor-pointer"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-bold text-base text-[#1B1A18]">{name}</h3>
            <p className="text-xs text-stone-500">División: Asesoría de Ventas Comerciales</p>
          </div>
        </div>

        {/* Inputs */}
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
              <label className="block font-bold text-stone-700 mb-1">Sucursal / Área</label>
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
              <label className="block font-bold text-stone-700 mb-1">Teléfono</label>
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
              <label className="block font-bold text-stone-700 mb-1">WhatsApp de Atención *</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Dirección / Base de Operación</label>
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
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#C9B368]" />
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
