import React, { useState } from 'react';
import {
  User,
  Building,
  MapPin,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClienteRegisterProps {
  onCompleted: () => void;
}

export const ClienteRegister: React.FC<ClienteRegisterProps> = ({ onCompleted }) => {
  const { clienteProfile, updateProfile, addClient } = useApp();

  const [name, setName] = useState(clienteProfile.name || '');
  const [businessName, setBusinessName] = useState(clienteProfile.businessName || '');
  const [address, setAddress] = useState(clienteProfile.address || '');
  const [phone, setPhone] = useState(clienteProfile.phone || '');
  const [whatsapp, setWhatsapp] = useState(clienteProfile.whatsapp || '');
  const [email, setEmail] = useState(clienteProfile.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp || !address) {
      alert('Por favor completa nombre, WhatsApp y dirección de entrega.');
      return;
    }

    // Update profile
    updateProfile('cliente', {
      name,
      businessName,
      address,
      phone: phone || whatsapp,
      whatsapp,
      email,
    });

    // Also register in clients list if not already there
    addClient({
      name,
      businessName,
      address,
      phone: phone || whatsapp,
      whatsapp,
      email,
      active: true,
      notes: 'Cliente registrado desde la app',
    });

    onCompleted();
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden text-[#1B1A18]">
        {/* Banner with full logo */}
        <div className="bg-[#1B1A18] p-6 text-center text-white relative">
          <div className="max-w-xs mx-auto mb-3">
            <img
              src="https://appdesignproyectos.com/florlogo.png"
              alt="Flor de Líz"
              className="h-12 w-auto mx-auto object-contain"
            />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">Registro de Cliente</h2>
          <p className="text-xs text-[#C9B368] mt-1">
            Completa tus datos para ver el catálogo y realizar tus pedidos en línea
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ej. Mariana Garza"
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
                placeholder="Ej. Eventos Bella Vista o Particular"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">WhatsApp para Pedidos *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#C9B368] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="55 1234 5678"
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
                  placeholder="55 8765 4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Dirección Completa de Entrega *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <textarea
                required
                rows={2}
                placeholder="Calle, Número exterior/interior, Colonia, Municipio o Ciudad..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] resize-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C9B368]" />
              Ingresar al Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
