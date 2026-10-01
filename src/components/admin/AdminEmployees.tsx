import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Send,
  Key,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { createWhatsAppEmployeeInviteLink } from '../../utils/pdfExport';

export const AdminEmployees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('Ejecutivo Comercial');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [role, setRole] = useState<'vendedor' | 'admin'>('vendedor');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateRandomCode = () => {
    const code = `FL-${Math.floor(1000 + Math.random() * 9000)}`;
    setAccessCode(code);
  };

  const handleOpenNew = () => {
    setEditingEmployee(null);
    setName('');
    setPosition('Ejecutivo Comercial');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    generateRandomCode();
    setRole('vendedor');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPosition(emp.position);
    setEmail(emp.email);
    setPhone(emp.phone);
    setWhatsapp(emp.whatsapp);
    setAccessCode(emp.accessCode);
    setRole(emp.role);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor ingresa nombre y correo del empleado.');
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name,
        position,
        email,
        phone: phone || whatsapp,
        whatsapp: whatsapp || phone,
        accessCode: accessCode || 'FL-2026',
        role,
      });
    } else {
      addEmployee({
        name,
        position,
        email,
        phone: phone || whatsapp || '5500000000',
        whatsapp: whatsapp || phone || '5500000000',
        accessCode: accessCode || `FL-${Math.floor(1000 + Math.random() * 9000)}`,
        role,
        active: true,
      });
    }

    setShowModal(false);
  };

  const handleShareWhatsApp = (emp: Employee) => {
    const waLink = createWhatsAppEmployeeInviteLink({
      name: emp.name,
      email: emp.email,
      accessCode: emp.accessCode,
      phone: emp.whatsapp || emp.phone,
      role: emp.role,
    });
    window.open(waLink, '_blank');
  };

  const handleCopyCredentials = (emp: Employee) => {
    const text = `Credenciales Flor de Líz:\nUsuario: ${emp.email}\nCódigo de Acceso: ${emp.accessCode}\nLink: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Gestión de Empleados y Vendedores
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Crea credenciales de acceso y compártelas directamente vía WhatsApp
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#C9B368]" />
          Registrar Nuevo Empleado
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No hay empleados registrados</p>
            <p className="text-xs text-stone-400 mt-1">
              Haz clic en "Registrar Nuevo Empleado" para crear el primer acceso al sistema.
            </p>
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center font-bold text-sm shadow-xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1B1A18]">{emp.name}</h3>
                      <p className="text-xs text-stone-500">{emp.position}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      emp.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {emp.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Credentials capsule */}
                <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl border border-stone-200/80 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{emp.whatsapp || emp.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1B1A18]">
                      <Key className="w-3.5 h-3.5 text-[#C9B368]" />
                      PIN: {emp.accessCode}
                    </div>
                    <button
                      onClick={() => handleCopyCredentials(emp)}
                      title="Copiar credenciales"
                      className="p-1 text-stone-500 hover:text-[#1B1A18] cursor-pointer"
                    >
                      {copiedId === emp.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sales performance if any */}
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>Ventas logradas:</span>
                  <span className="font-bold text-[#1B1A18]">
                    ${(emp.totalSold || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({emp.salesCount || 0})
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleShareWhatsApp(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Compartir link y credenciales por WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  Compartir WhatsApp
                </button>

                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
                  title="Editar empleado"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar a ${emp.name}?`)) {
                      deleteEmployee(emp.id);
                    }
                  }}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 text-red-500 cursor-pointer"
                  title="Eliminar empleado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New / Edit Employee */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18]">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-[#1B1A18]">
                  {editingEmployee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodrigo Morales Peña"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Cargo / Puesto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ejecutivo de Ventas"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Rol en el Sistema *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'vendedor' | 'admin')}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] bg-white font-medium"
                  >
                    <option value="vendedor">Vendedor (Catálogo, clientes y pedidos)</option>
                    <option value="admin">Administrador (Acceso total)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Correo Electrónico (Usuario) *</label>
                <input
                  type="email"
                  required
                  placeholder="vendedor@flordeliz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="55 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                  />
                </div>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">Código de Acceso / PIN *</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-xs text-[#C9B368] font-bold hover:underline cursor-pointer"
                  >
                    Generar aleatorio
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="FL-7890"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono"
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
                  {editingEmployee ? 'Guardar Cambios' : 'Crear Credenciales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
