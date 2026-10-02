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
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Share2,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  User,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { createWhatsAppClientInviteLink } from '../../utils/pdfExport';

export const VendedorClients: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    deleteMultipleClients,
    deleteAllClients,
    toggleClientActive,
    vendedorProfile,
    currentUser,
    activeRole,
    employees,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Deletion & Multi-selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    type: 'single' | 'selected' | 'all';
    client?: Client;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rfc, setRfc] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState('');

  // Post-Creation Shared Credentials Modal
  const [sharedCredentialsModal, setSharedCredentialsModal] = useState<Client | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const SYSTEM_PORTAL_URL = 'https://flor-de-liz-phi.vercel.app/';

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Flor#';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const suggestUsername = () => {
    if (!name) return;
    const clean = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const phonePart = (whatsapp || phone || '').replace(/\D/g, '').slice(-4);
    setUsername(phonePart ? `${clean.slice(0, 8)}.${phonePart}` : `${clean.slice(0, 10)}${Math.floor(10 + Math.random() * 90)}`);
  };

  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.businessName && c.businessName.toLowerCase().includes(term)) ||
      (c.username && c.username.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.whatsapp && c.whatsapp.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? c.active !== false
        : c.active === false;

    return matchesSearch && matchesStatus;
  });

  const handleOpenNew = () => {
    setEditingClient(null);
    setName('');
    setBusinessName('');
    setRfc('');
    setAddress('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setUsername('');
    setPassword('Cliente#2026');
    setShowPassword(false);
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
    setUsername(c.username || '');
    setPassword(c.password || 'Cliente#2026');
    setShowPassword(false);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el nombre del cliente.');
      return;
    }
    const finalPhone = phone.trim() || whatsapp.trim() || '5500000000';
    const finalWhatsapp = whatsapp.trim() || phone.trim() || '5500000000';
    const finalAddress = address.trim() || 'Dirección por confirmar';

    // Auto-generate username and password if empty
    const cleanLast4 = finalWhatsapp.replace(/\D/g, '').slice(-4) || '2026';
    const finalUser = username.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}.${cleanLast4}`;
    const finalPass = password.trim() || 'Cliente#2026';

    if (editingClient) {
      updateClient(editingClient.id, {
        name: name.trim(),
        businessName: businessName.trim(),
        rfc: rfc.trim(),
        address: finalAddress,
        phone: finalPhone,
        whatsapp: finalWhatsapp,
        email: email.trim(),
        username: finalUser,
        password: finalPass,
        notes: notes.trim(),
      });
      setShowModal(false);
    } else {
      const created = addClient({
        name: name.trim(),
        businessName: businessName.trim(),
        rfc: rfc.trim(),
        address: finalAddress,
        phone: finalPhone,
        whatsapp: finalWhatsapp,
        email: email.trim(),
        username: finalUser,
        password: finalPass,
        active: true,
        notes: notes.trim(),
        createdByVendedorId: activeRole === 'vendedor' ? vendedorProfile.id : currentUser?.id,
      });

      setShowModal(false);
      // Immediately display credentials modal so user can share via WhatsApp
      setSharedCredentialsModal(created);
    }
  };

  const handleShareWhatsApp = (client: Client) => {
    const waUrl = createWhatsAppClientInviteLink({
      name: client.name,
      businessName: client.businessName,
      phone: client.phone,
      whatsapp: client.whatsapp,
      username: client.username || client.phone,
      password: client.password || 'Cliente#2026',
    });
    window.open(waUrl, '_blank');
  };

  const handleCopyCredentials = (client: Client) => {
    const text =
      `🌸 Comercializadora Flor De Liz - Acceso de Cliente 🌸\n` +
      `Portal: ${SYSTEM_PORTAL_URL}\n` +
      `Usuario: ${client.username || client.phone}\n` +
      `Contraseña: ${client.password || 'Cliente#2026'}\n` +
      `Cliente: ${client.name}\n` +
      `WhatsApp: ${client.whatsapp || client.phone}`;

    navigator.clipboard.writeText(text);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCreatorLabel = (createdByVendedorId?: string) => {
    if (!createdByVendedorId) return 'Administración';
    const emp = employees.find((e) => e.id === createdByVendedorId);
    return emp ? `Vendedor: ${emp.name}` : 'Vendedor Asignado';
  };

  const handleToggleSelectClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisibleClients = () => {
    setSelectedClientIds(filteredClients.map((c) => c.id));
  };

  const handleClearClientSelection = () => {
    setSelectedClientIds([]);
  };

  const handleConfirmClientDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.client) {
        deleteClient(deleteModal.client.id);
        setActionStatus({
          text: `Cliente "${deleteModal.client.name}" eliminado de Supabase.`,
          isError: false,
        });
      } else if (deleteModal.type === 'selected') {
        const toDeleteIds = [...selectedClientIds];
        const res = await deleteMultipleClients(toDeleteIds);
        setActionStatus({
          text: res.message,
          isError: !res.success,
        });
        setSelectedClientIds([]);
        setIsSelectMode(false);
      } else if (deleteModal.type === 'all') {
        const res = await deleteAllClients();
        setActionStatus({
          text: res.message,
          isError: !res.success,
        });
        setSelectedClientIds([]);
        setIsSelectMode(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setActionStatus({ text: `Error: ${msg}`, isError: true });
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
      setTimeout(() => setActionStatus(null), 4500);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
              Registro y Directorio de Clientes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C9B368]/20 text-[#1B1A18]">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Registra nuevos clientes con credenciales seguras y comparte el enlace de acceso al sistema por WhatsApp al instante
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {clients.length > 0 && (currentUser?.role === 'admin' || activeRole === 'admin') && (
            <button
              onClick={() => setDeleteModal({ type: 'all', count: clients.length })}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Borrar todos los clientes permanentemente de Supabase"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Vaciar Clientes</span>
            </button>
          )}

          {clients.length > 0 && (
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedClientIds([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isSelectMode
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}
              title="Seleccionar clientes para borrar en lote"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#C9B368]" />
              <span>{isSelectMode ? 'Cancelar Selección' : 'Seleccionar'}</span>
            </button>
          )}

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C9B368]" />
            Registrar Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Access Portal Banner */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#C9B368]/40 text-[#C9B368] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#C9B368]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1B1A18]">Enlace Oficial de Acceso para Clientes:</p>
            <p className="text-xs text-stone-500 font-mono truncate">{SYSTEM_PORTAL_URL}</p>
          </div>
        </div>

        <a
          href={SYSTEM_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
        >
          <span>Abrir Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, usuario @..., teléfono, WhatsApp o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-[#1B1A18] focus:outline-none focus:border-[#C9B368]"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1B1A18] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-stone-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Multi-selection Action Bar */}
      {isSelectMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950">
              {selectedClientIds.length} {selectedClientIds.length === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
            </span>
            <span className="text-amber-700">de {filteredClients.length} clientes visibles</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectAllVisibleClients}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 transition cursor-pointer"
            >
              Seleccionar Todos ({filteredClients.length})
            </button>
            {selectedClientIds.length > 0 && (
              <>
                <button
                  onClick={handleClearClientSelection}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition cursor-pointer"
                >
                  Deseleccionar
                </button>
                <button
                  onClick={() => setDeleteModal({ type: 'selected', count: selectedClientIds.length })}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Seleccionados ({selectedClientIds.length}) de Supabase</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Status Banner */}
      {actionStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
            actionStatus.isError
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionStatus.isError ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{actionStatus.text}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
            <UserCheck className="w-12 h-12 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">No se encontraron clientes</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Haz clic en "Registrar Nuevo Cliente" para dar de alta al primer cliente y generar sus credenciales de acceso.
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-4 py-2 rounded-xl bg-[#C9B368] text-[#1B1A18] font-bold text-xs hover:bg-[#b59f54] transition cursor-pointer"
            >
              Registrar Cliente Ahora
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const hasCredentials = Boolean(client.username && client.password);
            const isSelected = selectedClientIds.includes(client.id);
            return (
              <div
                key={client.id}
                onClick={() => {
                  if (isSelectMode) handleToggleSelectClient(client.id);
                }}
                className={`relative bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelectMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-[#C9B368] ring-2 ring-[#C9B368]/40 bg-amber-50/20'
                    : client.active !== false
                    ? 'border-stone-200/90'
                    : 'border-stone-200 opacity-60 bg-stone-50/60'
                }`}
              >
                {isSelectMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectClient(client.id);
                    }}
                    className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-md flex items-center justify-center transition shadow-xs cursor-pointer ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500 hover:text-stone-800'
                    }`}
                    title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                )}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-sm uppercase shadow-xs shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1B1A18] truncate">{client.name}</h3>
                        <p className="text-xs text-[#C9B368] font-semibold truncate">
                          {client.businessName || 'Cliente Particular'}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">
                          {getCreatorLabel(client.createdByVendedorId)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleClientActive(client.id)}
                      className="cursor-pointer shrink-0"
                      title={client.active !== false ? 'Desactivar cliente' : 'Activar cliente'}
                    >
                      {client.active !== false ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-200 text-stone-600">
                          Inactivo
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Credentials Box */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[#C9B368]" />
                        Credenciales de Acceso:
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        Rol Cliente
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Usuario:</span>
                        <span className="font-mono font-bold text-[#1B1A18] truncate block">
                          {client.username || client.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Contraseña:</span>
                        <span className="font-mono font-bold text-stone-700 truncate block">
                          {client.password || 'Cliente#2026'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-stone-800">
                        WhatsApp: {client.whatsapp || client.phone}
                      </span>
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

                    {client.rfc && (
                      <div className="text-[11px] text-stone-500">
                        RFC: <span className="font-mono font-semibold">{client.rfc}</span>
                      </div>
                    )}

                    {client.notes && (
                      <div className="mt-2 p-2 bg-stone-50 rounded-lg text-[11px] text-stone-500 italic border border-stone-100">
                        "{client.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  {/* Primary WhatsApp Share Button */}
                  <button
                    onClick={() => handleShareWhatsApp(client)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    title="Enviar enlace del sistema y credenciales por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Compartir Acceso por WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyCredentials(client)}
                      className="flex-1 py-2 px-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Copiar credenciales al portapapeles"
                    >
                      {copiedId === client.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                          <span>Copiar Datos</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`tel:${(client.phone || client.whatsapp || '').replace(/\D/g, '')}`}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition cursor-pointer"
                      title="Llamar al cliente"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteModal({ type: 'single', client })}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 text-red-500 transition cursor-pointer"
                      title="Borrar cliente de Supabase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New / Edit Client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1B1A18]">
                    {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Crea el perfil del cliente y sus credenciales de compra en línea
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Personal and Business Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dr. Mario Ruiz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Empresa / Negocio / Clínica</label>
                  <input
                    type="text"
                    placeholder="Ej. Clínica Santa María"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
              </div>

              {/* Phone and WhatsApp */}
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

              {/* Email and RFC */}
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

              {/* Address */}
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

              {/* System Credentials Section */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#C9B368]" />
                    Credenciales de Acceso para el Cliente
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {SYSTEM_PORTAL_URL}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">Usuario de Acceso *</label>
                      <button
                        type="button"
                        onClick={suggestUsername}
                        className="text-[11px] text-[#C9B368] font-bold hover:underline cursor-pointer"
                      >
                        Sugerir
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. mario.ruiz"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-[#C9B368]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">Contraseña *</label>
                      <button
                        type="button"
                        onClick={generateSecurePassword}
                        className="text-[11px] text-[#C9B368] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generar Segura
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña segura"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 pr-9 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-[#C9B368]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Notas y Preferencias</label>
                <textarea
                  rows={2}
                  placeholder="Horarios de entrega preferidos, tipo de insumos frecuentes, condiciones especiales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              {/* Buttons */}
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

      {/* Modal: Cliente Registrado - Compartir Acceso Inmediato */}
      {sharedCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1B1A18]">¡Cliente Registrado con Éxito!</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Se han creado las credenciales para <strong>{sharedCredentialsModal.name}</strong>
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200 text-left text-xs space-y-2">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Enlace del Sistema:</span>
                <span className="font-mono font-bold text-[#1B1A18] break-all">{SYSTEM_PORTAL_URL}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Usuario:</span>
                  <span className="font-mono font-bold text-[#1B1A18]">
                    {sharedCredentialsModal.username || sharedCredentialsModal.phone}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Contraseña:</span>
                  <span className="font-mono font-bold text-stone-800">
                    {sharedCredentialsModal.password || 'Cliente#2026'}
                  </span>
                </div>
              </div>
              <div className="pt-1 border-t border-stone-200 text-[11px] text-stone-500">
                <span>WhatsApp: {sharedCredentialsModal.whatsapp || sharedCredentialsModal.phone}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleShareWhatsApp(sharedCredentialsModal)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Acceso por WhatsApp al Cliente</span>
              </button>

              <button
                onClick={() => handleCopyCredentials(sharedCredentialsModal)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                {copiedId === sharedCredentialsModal.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Credenciales Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#C9B368]" />
                    <span>Copiar Credenciales y Enlace</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSharedCredentialsModal(null)}
                className="text-xs text-stone-500 hover:underline pt-1 cursor-pointer block mx-auto"
              >
                Cerrar y volver al directorio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1B1A18]">
                {deleteModal.type === 'single'
                  ? `¿Eliminar al cliente "${deleteModal.client?.name}"?`
                  : deleteModal.type === 'selected'
                  ? `¿Eliminar ${deleteModal.count} clientes seleccionados?`
                  : '¿Eliminar TODOS los clientes del directorio?'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {deleteModal.type === 'single'
                  ? `Se eliminarán los datos y credenciales del cliente "${deleteModal.client?.name}" permanentemente de Supabase y del directorio.`
                  : deleteModal.type === 'selected'
                  ? `Se borrarán permanentemente ${deleteModal.count} clientes seleccionados de la base de datos Supabase.`
                  : `Se eliminarán permanentemente todos los clientes registrados (${deleteModal.count} registros) de Supabase (tabla flor_clients). Esta acción no se puede deshacer.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClientDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar y Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
