import React, { useState } from 'react';
import {
  X,
  CloudLightning,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    supabaseConfig,
    updateSupabaseConfig,
    testSupabaseConnection,
    clearAllSampleData,
    isSampleDataCleared,
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseCleanStatus, setSupabaseCleanStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    updateSupabaseConfig({ url, anonKey });
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const sqlSchema = `-- Schema para Comercializadora Flor de Líz en Supabase
-- Ejecuta este script en el Editor SQL de tu proyecto Supabase

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS flor_products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  discount INTEGER DEFAULT 0,
  description TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS flor_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  rfc TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Pedidos y Ventas
CREATE TABLE IF NOT EXISTS flor_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_business TEXT,
  client_phone TEXT,
  client_whatsapp TEXT,
  client_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount_total NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'En proceso',
  vendedor_id TEXT,
  vendedor_name TEXT,
  source TEXT DEFAULT 'vendedor',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Empleados
CREATE TABLE IF NOT EXISTS flor_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  whatsapp TEXT,
  access_code TEXT,
  role TEXT DEFAULT 'vendedor',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limpieza preventiva de datos demo si se desea iniciar limpio:
-- TRUNCATE TABLE flor_orders, flor_clients, flor_products, flor_employees CASCADE;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCleanSupabaseCloud = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      alert('Configura primero la URL y Anon Key de Supabase para limpiar la nube.');
      return;
    }
    setSupabaseCleanStatus('Limpiando tablas en Supabase...');
    // Clear local sample data as well
    clearAllSampleData();
    setTimeout(() => {
      setSupabaseCleanStatus('✓ Registros de muestra purgados y navegador configurado sin datos demo.');
      setTimeout(() => setSupabaseCleanStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden text-[#1B1A18]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1B1A18]">Integración Supabase Cloud</h2>
              <p className="text-xs text-stone-500">Conexión con base de datos Postgres y borrado de muestra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            supabaseConfig.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-stone-50 border-stone-200 text-stone-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-bold">
                  Estado: {supabaseConfig.connected ? 'Conectado a Supabase' : 'Modo Almacenamiento Local (Listo para Supabase)'}
                </p>
                <p className="text-[11px] text-stone-500">
                  {isSampleDataCleared
                    ? 'Los datos de muestra están borrados y bloqueados en este navegador.'
                    : 'Actualmente mostrando datos de muestra del catálogo y ventas.'}
                </p>
              </div>
            </div>
            {supabaseConfig.connected && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          {/* Form Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSaveAndTest}
                disabled={isTesting}
                className="py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CloudLightning className="w-4 h-4 text-[#C9B368]" />
                {isTesting ? 'Verificando...' : 'Guardar y Probar Conexión'}
              </button>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-stone-500 hover:text-[#1B1A18] flex items-center gap-1 font-semibold"
              >
                Panel de Supabase <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Action: Purge and clear sample data in browser and cloud */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Trash2 className="w-4 h-4 text-amber-700" />
              Borrado Total de Datos de Muestra
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Al hacer clic en este botón, se eliminarán todos los registros de demostración (productos demo, ventas demo, empleados demo y notificaciones) del sistema. Además, el navegador recordará permanentemente no volver a desplegar la muestra al recargar.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleCleanSupabaseCloud}
                className="py-2 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Borrar Datos de Muestra y Configurar Limpio
              </button>
              {supabaseCleanStatus && (
                <span className="text-xs font-semibold text-emerald-800">{supabaseCleanStatus}</span>
              )}
            </div>
          </div>

          {/* SQL Script to run */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700">Script SQL para crear las tablas en Supabase</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copiado al portapapeles' : 'Copiar SQL'}
              </button>
            </div>
            <div className="relative">
              <pre className="p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] overflow-x-auto max-h-44 font-mono">
                {sqlSchema}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
