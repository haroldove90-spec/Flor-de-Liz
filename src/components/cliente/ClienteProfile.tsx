import React, { useState } from 'react';
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ClienteProfile: React.FC = () => {
  const { clienteProfile, updateProfile } = useApp();

  const [name, setName] = useState(clienteProfile.name);
  const [businessName, setBusinessName] = useState(clienteProfile.businessName || '');
  const [address, setAddress] = useState(clienteProfile.address);
  const [phone, setPhone] = useState(clienteProfile.phone);
  const [whatsapp, setWhatsapp] = useState(clienteProfile.whatsapp);
  const [email, setEmail] = useState(clienteProfile.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile('cliente', {
      name,
      businessName,
      address,
      phone,
      whatsapp,
      email,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-2 border-b border-stone-200/80">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
          Mis Datos Comerciales y de Envío
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Verifica tu dirección y número de WhatsApp para entregas puntuales
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Datos personales actualizados correctamente!</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Nombre Completo del Cliente *</label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Nombre del Negocio / Empresa (Opcional)</label>
            <div className="relative">
              <Building className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Boutique de Eventos o Particular"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">WhatsApp de Contacto *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#C9B368] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Teléfono Alternativo</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Dirección Completa para Envíos *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia, referencias de entrega..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#C9B368]" />
              Guardar Mis Datos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
