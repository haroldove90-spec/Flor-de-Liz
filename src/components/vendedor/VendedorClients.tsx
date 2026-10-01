import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Building,
  MapPin,
  Mail,
  FileText,
  X,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';

export const VendedorClients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, toggleClientActive, vendedorProfile } = useApp();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rfc, setRfc] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenNew = () => {
    setEditingClient(null);
    setName('');
    setBusinessName('');
    setRfc('');
    setAddress('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setBusinessName(c.businessName || '');
    setRfc(c.rfc || '');
    setAddress(c.address || '');
    setPhone(c.phone || '');
    setWhatsapp(c.whatsapp || '');
    setEmail(c.email || '');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Ingresa al menos el nombre del cliente.');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name,
        businessName,
        rfc,
        address,
        phone: phone || whatsapp,
        whatsapp: whatsapp || phone,
        email,
        notes,
      });
    } else {
      addClient({
        name,
        businessName,
        rfc,
        address: address || 'Por confirmar',
        phone: phone || whatsapp || '5500000000',
        whatsapp: whatsapp || phone || '5500000000',
        email,
        active: true,
        notes,
        createdByVendedorId: vendedorProfile.id,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Registra nuevos clientes, edita datos de contacto, gestiona pedidos y seguimiento comercial
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#C9B368]" />
          Registrar Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nombre, negocio, teléfono o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
            <UserCheck className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No se encontraron clientes</p>
            <p className="text-xs text-stone-400 mt-1">
              Haz clic en "Registrar Nuevo Cliente" para dar de alta al primero.
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between space-y-3.5 ${
                client.active ? 'border-stone-200/90' : 'border-stone-200 opacity-60 bg-stone-50/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1B1A18]">{client.name}</h3>
                      <p className="text-xs text-[#C9B368] font-semibold">{client.businessName || 'Cliente Particular'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleClientActive(client.id)}
                    className="cursor-pointer"
                    title={client.active ? 'Desactivar cliente' : 'Activar cliente'}
                  >
                    {client.active ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-200 text-stone-600">
                        Inactivo
                      </span>
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{client.whatsapp || client.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{client.address}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="mt-2 p-2 bg-[#FAF8F5] rounded-lg text-[11px] text-stone-500 italic border border-stone-100">
                      "{client.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Llamar, Edit, Delete */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${(client.phone || client.whatsapp || '').replace(/\D/g, '')}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-[#C9B368] font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Llamar al cliente"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Llamar
                </a>

                <button
                  onClick={() => handleOpenEdit(client)}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
                  title="Editar cliente"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar al cliente ${client.name}?`)) {
                      deleteClient(client.id);
                    }
                  }}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 text-red-500 cursor-pointer"
                  title="Borrar cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New / Edit Client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18]">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1B1A18]">
                  {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mariana Garza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre del Negocio / Empresa</label>
                  <input
                    type="text"
                    placeholder="Ej. Florería San Ángel"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">WhatsApp de Contacto *</label>
                  <input
                    type="tel"
                    required
                    placeholder="55 1234 5678"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Teléfono Alternativo</label>
                  <input
                    type="tel"
                    placeholder="55 8765 4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">RFC / ID Fiscal (Opcional)</label>
                  <input
                    type="text"
                    placeholder="XAXX010101000"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dirección Completa de Entrega *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle, Número, Colonia, Código Postal, Ciudad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Notas y Preferencias</label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de horario, tipo de flores favoritas, requerimientos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
