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
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  ExternalLink,
  ShieldCheck,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { createWhatsAppEmployeeInviteLink } from '../../utils/pdfExport';

const SYSTEM_APP_URL = 'https://flor-de-liz-phi.vercel.app/';

export const AdminEmployees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('Ejecutivo Comercial');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInForm, setShowPasswordInForm] = useState(true);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<'vendedor' | 'admin'>('vendedor');

  // Shared credentials modal after creation or on-demand
  const [sharedCredentialsModal, setSharedCredentialsModal] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate a strong, secure and memorable password for the employee
  const generateSecurePassword = () => {
    const specials = '!@#$%&*';
    const numbers = '23456789';
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghjkmnpqrstuvwxyz';

    let randomPart = '';
    randomPart += uppers[Math.floor(Math.random() * uppers.length)];
    randomPart += lowers[Math.floor(Math.random() * lowers.length)];
    randomPart += numbers[Math.floor(Math.random() * numbers.length)];
    randomPart += specials[Math.floor(Math.random() * specials.length)];
    randomPart += uppers[Math.floor(Math.random() * uppers.length)];
    randomPart += lowers[Math.floor(Math.random() * lowers.length)];
    randomPart += numbers[Math.floor(Math.random() * numbers.length)];

    const finalPass = `Flor2026$${randomPart}`;
    setPassword(finalPass);
    setShowPasswordInForm(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingEmployee && (!username || username === '')) {
      const clean = val
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.');
      if (clean) {
        setUsername(clean);
      }
    }
  };

  const handleOpenNew = () => {
    setEditingEmployee(null);
    setName('');
    setPosition('Ejecutivo Comercial');
    setEmail('');
    setUsername('');
    setPhone('');
    setWhatsapp('');
    setRole('vendedor');
    generateSecurePassword();
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPosition(emp.position);
    setEmail(emp.email);
    setUsername(emp.username || emp.email.split('@')[0]);
    setPassword(emp.password || emp.accessCode || '');
    setPhone(emp.phone);
    setWhatsapp(emp.whatsapp);
    setRole(emp.role);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor completa el nombre y correo del empleado.');
      return;
    }

    const finalUsername =
      username.trim() ||
      (name ? name.toLowerCase().replace(/\s+/g, '.') : email.split('@')[0]);
    const finalPassword = password.trim() || 'Flor2026$Med';

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name,
        position,
        email,
        username: finalUsername,
        password: finalPassword,
        phone: phone || whatsapp,
        whatsapp: whatsapp || phone,
        accessCode: finalPassword,
        role,
      });
      setShowModal(false);
    } else {
      const newEmp = addEmployee({
        name,
        position,
        email,
        username: finalUsername,
        password: finalPassword,
        phone: phone || whatsapp || '5500000000',
        whatsapp: whatsapp || phone || '5500000000',
        accessCode: finalPassword,
        role,
        active: true,
      });
      setShowModal(false);
      // Automatically open the share modal so admin can copy/share credentials
      setSharedCredentialsModal(newEmp);
    }
  };

  const handleShareWhatsApp = (emp: Employee) => {
    const waLink = createWhatsAppEmployeeInviteLink({
      name: emp.name,
      email: emp.email,
      username: emp.username,
      password: emp.password,
      accessCode: emp.accessCode,
      phone: emp.whatsapp || emp.phone,
      role: emp.role,
    });
    window.open(waLink, '_blank');
  };

  const handleCopyCredentials = (emp: Employee) => {
    const user = emp.username || emp.email;
    const pass = emp.password || emp.accessCode || '';
    const text = `🌸 COMERCIALIZADORA FLOR DE LIZ 🌸\nCredenciales de Acceso Oficial al Sistema:\n\n🌐 Link del Sistema: ${SYSTEM_APP_URL}\n👤 Usuario: ${user}\n🔐 Contraseña: ${pass}\n💼 Rol: ${emp.role === 'admin' ? 'Administrador' : 'Vendedor'}\n\nIngresa al enlace para acceder a tu catálogo comercial, cotizaciones y pedidos.`;
    navigator.clipboard.writeText(text);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* System Link Banner for Admin */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1B1A18]">Enlace Oficial de la Plataforma para Empleados</p>
            <a
              href={SYSTEM_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#C9B368] hover:underline font-mono font-semibold flex items-center gap-1 mt-0.5"
            >
              <span>{SYSTEM_APP_URL}</span>
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(SYSTEM_APP_URL);
            setCopiedId('sys_url');
            setTimeout(() => setCopiedId(null), 2000);
          }}
          className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          {copiedId === 'sys_url' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Enlace Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Copiar Enlace</span>
            </>
          )}
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1B1A18] tracking-tight">
            Gestión de Empleados y Vendedores
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Crea credenciales con usuario, contraseña segura y compártelas junto al enlace oficial del sistema
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
              Haz clic en "Registrar Nuevo Empleado" para generar el primer usuario y contraseña.
            </p>
          </div>
        ) : (
          employees.map((emp) => {
            const user = emp.username || emp.email.split('@')[0];
            const pass = emp.password || emp.accessCode || 'Flor2026$Med';
            const isPassVisible = visiblePasswords[emp.id];

            return (
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
                  <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl border border-stone-200/80 space-y-2 text-xs text-stone-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{emp.whatsapp || emp.phone}</span>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-sans text-[10px] uppercase font-bold">Usuario:</span>
                        <span className="font-bold text-[#1B1A18] bg-stone-200/60 px-1.5 py-0.5 rounded">{user}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-sans text-[10px] uppercase font-bold">Contraseña:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1B1A18] bg-stone-200/60 px-1.5 py-0.5 rounded">
                            {isPassVisible ? pass : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(emp.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                            title={isPassVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-1.5 text-[10px] text-stone-400 font-sans flex items-center justify-between border-t border-stone-200/40">
                        <span className="truncate text-stone-500 font-mono text-[9.5px]">flor-de-liz-phi.vercel.app</span>
                        <button
                          onClick={() => handleCopyCredentials(emp)}
                          title="Copiar credenciales completas con el link"
                          className="flex items-center gap-1 text-[#C9B368] hover:text-[#b59f54] font-bold font-sans cursor-pointer"
                        >
                          {copiedId === emp.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 text-[10px]">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
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
                    title="Compartir link oficial y credenciales por WhatsApp"
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
                    onClick={() => setEmployeeToDelete(emp)}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 text-red-500 cursor-pointer"
                    title="Eliminar empleado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New / Edit Employee */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1B1A18] text-[#C9B368] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1B1A18]">
                    {editingEmployee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                  </h3>
                  <p className="text-xs text-stone-500">Genera credenciales de acceso para el equipo comercial</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodrigo Morales Peña"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
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
                <label className="block font-bold text-stone-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="vendedor@flordeliz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368]"
                />
              </div>

              {/* Usuario Field (remplazo de PIN) */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Usuario de Acceso *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej. rodrigo.morales"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Este es el nombre de usuario que el empleado utilizará para identificarse en el sistema.
                </p>
              </div>

              {/* Contraseña Field con generador seguro */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">Contraseña del Empleado *</label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-xs text-[#C9B368] hover:text-[#b59f54] font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar Contraseña Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInForm ? 'text' : 'password'}
                    required
                    placeholder="Contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                      className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title={showPasswordInForm ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPasswordInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(password);
                          setCopiedId('form_pass');
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Copiar contraseña"
                      >
                        {copiedId === 'form_pass' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
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

              {/* Informative Link Capsule */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#C9B368] shrink-0" />
                  <span>Se compartirá el enlace oficial:</span>
                </div>
                <span className="font-mono text-[#1B1A18] font-bold">flor-de-liz-phi.vercel.app</span>
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

      {/* Modal: Compartir Credenciales Generadas */}
      {sharedCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] animate-in zoom-in-95">
            <div className="p-5 sm:p-6 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-emerald-950">¡Credenciales Generadas!</h3>
                  <p className="text-xs text-emerald-700">Listo para compartir con el empleado</p>
                </div>
              </div>
              <button
                onClick={() => setSharedCredentialsModal(null)}
                className="p-1 rounded-full hover:bg-emerald-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200 space-y-3 font-mono">
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400 font-sans">Empleado:</p>
                  <p className="font-bold text-[#1B1A18] font-sans text-sm">{sharedCredentialsModal.name}</p>
                  <p className="text-stone-500 font-sans text-xs">{sharedCredentialsModal.position} • {sharedCredentialsModal.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                </div>

                <div className="pt-2 border-t border-stone-200/80 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 font-sans block">Link de acceso:</span>
                    <a
                      href={SYSTEM_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C9B368] hover:underline font-bold text-xs flex items-center gap-1"
                    >
                      <span>{SYSTEM_APP_URL}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 font-sans block">Usuario:</span>
                      <span className="font-bold text-[#1B1A18] text-xs">{sharedCredentialsModal.username || sharedCredentialsModal.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sharedCredentialsModal.username || sharedCredentialsModal.email);
                        setCopiedId('modal_usr');
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                      title="Copiar usuario"
                    >
                      {copiedId === 'modal_usr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 font-sans block">Contraseña:</span>
                      <span className="font-bold text-[#1B1A18] text-xs">{sharedCredentialsModal.password || sharedCredentialsModal.accessCode}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sharedCredentialsModal.password || sharedCredentialsModal.accessCode);
                        setCopiedId('modal_pwd');
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                      title="Copiar contraseña"
                    >
                      {copiedId === 'modal_pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleShareWhatsApp(sharedCredentialsModal)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Directo por WhatsApp a {sharedCredentialsModal.whatsapp || sharedCredentialsModal.phone}</span>
                </button>

                <button
                  onClick={() => handleCopyCredentials(sharedCredentialsModal)}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiedId === sharedCredentialsModal.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Mensaje y Credenciales Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Mensaje Completo para el Empleado</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Eliminar Empleado */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-[#1B1A18] animate-in zoom-in-95">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-950">¿Eliminar Empleado?</h3>
                <p className="text-xs text-rose-700">Se revocarán sus credenciales</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-stone-600">
                ¿Estás seguro de que deseas eliminar a <span className="font-bold text-[#1B1A18]">{employeeToDelete.name}</span>? Esta acción retirará su acceso al sistema comercial.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEmployeeToDelete(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteEmployee(employeeToDelete.id);
                    setEmployeeToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
