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
  CloudUpload,
  CloudDownload,
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
    uploadProductsToSupabase,
    fetchProductsFromSupabase,
    clearSupabaseCloudRecords,
    products,
    isSampleDataCleared,
  } = useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    updateSupabaseConfig({ url, anonKey });
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const sqlSchema = `-- ==============================================================
-- SCHEMA COMPLETO PARA SUPABASE - COMERCIALIZADORA FLOR DE LÍZ
-- Negocio: Suministros Médicos y Material de Curación
-- Proyecto: ylzgfsvcibqsztarglja
-- ==============================================================

-- 1. TABLA DE PRODUCTOS (Suministros Médicos y Material de Curación)
CREATE TABLE IF NOT EXISTS flor_products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 50,
  discount INTEGER DEFAULT 0,
  description TEXT,
  category TEXT DEFAULT 'Suministros Médicos',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES (Clínicas, Hospitales, Farmacias, Doctores)
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

-- 3. TABLA DE PEDIDOS Y VENTAS
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE EMPLEADOS Y ASESORES COMERCIALES
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
  sales_count INTEGER DEFAULT 0,
  total_sold NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES PARA BÚSQUEDA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_products_code ON flor_products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON flor_products(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON flor_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON flor_orders(order_number);

-- ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE flor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_employees ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PÚBLICAS PARA ACCESO DESDE LA APP
DROP POLICY IF EXISTS "Public access flor_products" ON flor_products;
CREATE POLICY "Public access flor_products" ON flor_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_clients" ON flor_clients;
CREATE POLICY "Public access flor_clients" ON flor_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_orders" ON flor_orders;
CREATE POLICY "Public access flor_orders" ON flor_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_employees" ON flor_employees;
CREATE POLICY "Public access flor_employees" ON flor_employees FOR ALL USING (true) WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCleanSupabaseCloud = async () => {
    if (!confirm('¿Deseas purgar los registros de productos en Supabase y limpiar la base de datos?')) return;
    setSyncStatus('Eliminando registros de productos en Supabase...');
    const res = await clearSupabaseCloudRecords();
    setSyncStatus(res.message);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handlePushToCloud = async () => {
    setSyncStatus('Subiendo catálogo a Supabase...');
    const res = await uploadProductsToSupabase();
    setSyncStatus(res.message);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handlePullFromCloud = async () => {
    setSyncStatus('Consultando productos en Supabase...');
    const res = await fetchProductsFromSupabase();
    setSyncStatus(res.message);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden text-[#1B1A18]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1B1A18]">Configuración Supabase Cloud</h2>
              <p className="text-xs text-stone-500">
                Proyecto: <span className="font-semibold text-emerald-800">{supabaseConfig.projectName || 'Flor de Líz'}</span> ({supabaseConfig.projectId})
              </p>
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
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  Supabase Configurado: <span className="font-mono text-xs">{supabaseConfig.projectId}</span>
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Conectado al proyecto oficial de suministros médicos y material de curación.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-800">En Línea</span>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Supabase URL (REST Endpoint)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs bg-white"
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
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C9B368] font-mono text-xs bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={handleSaveAndTest}
                disabled={isTesting}
                className="py-2.5 px-4 rounded-xl bg-[#1B1A18] hover:bg-stone-800 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CloudLightning className="w-4 h-4 text-[#C9B368]" />
                {isTesting ? 'Verificando...' : 'Verificar Conexión'}
              </button>

              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <button
                    onClick={handlePushToCloud}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Subir catálogo local a Supabase"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    Subir Catálogo ({products.length})
                  </button>
                )}

                <button
                  onClick={handlePullFromCloud}
                  className="py-2 px-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Cargar productos guardados en Supabase"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  Descargar de Supabase
                </button>
              </div>
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

            {syncStatus && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                {syncStatus}
              </div>
            )}
          </div>

          {/* Action: Purge and clear sample data in browser and cloud */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-amber-700" />
                Borrado de Registros en Supabase y Local
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Permite purgar la tabla flor_products en la nube y reiniciar el catálogo en blanco.
              </p>
            </div>
            <button
              onClick={handleCleanSupabaseCloud}
              className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar Registros Supabase
            </button>
          </div>

          {/* SQL Script to run in Supabase SQL editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800">
                Script SQL para ejecutar en el Editor SQL de Supabase ({supabaseConfig.projectId})
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9B368] hover:bg-[#b59f54] text-[#1B1A18] font-bold cursor-pointer transition shadow-2xs"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                {copiedSql ? '¡Copiado con éxito!' : 'Copiar Script SQL'}
              </button>
            </div>

            <pre className="p-4 bg-stone-900 text-stone-200 rounded-2xl text-[11px] overflow-x-auto max-h-56 font-mono border border-stone-800">
              {sqlSchema}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
