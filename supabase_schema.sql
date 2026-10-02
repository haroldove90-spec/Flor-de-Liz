-- ==============================================================================
-- SCHEMA COMPLETO Y DATOS DE MUESTRA PARA SUPABASE (POSTGRESQL)
-- Proyecto: flordeliz@appdesignsoftware.com's Project
-- Project ID: ptzdzlafekxtakbfnyur
-- URL: https://ptzdzlafekxtakbfnyur.supabase.co/rest/v1/
-- Comercializadora Flor De Liz: Suministros Médicos y Material de Curación
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: flor_products (Catálogo de Suministros Médicos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Suministros Médicos',
  sub_category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(10, 2) DEFAULT 0.00,
  purchase_price NUMERIC(10, 2) DEFAULT 0.00,
  wholesale_price NUMERIC(10, 2) DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 50,
  current_stock INTEGER DEFAULT 50,
  min_stock INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'Pza',
  discount INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Suministros Médicos';
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT '';
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 50;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 50;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';
ALTER TABLE IF EXISTS flor_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Sincronizar compatibilidad de nombres de columnas
UPDATE flor_products SET price = COALESCE(price, sale_price, 0) WHERE price IS NULL OR price = 0;
UPDATE flor_products SET sale_price = COALESCE(sale_price, price, 0) WHERE sale_price IS NULL OR sale_price = 0;
UPDATE flor_products SET stock = COALESCE(stock, current_stock, 50) WHERE stock IS NULL;
UPDATE flor_products SET current_stock = COALESCE(current_stock, stock, 50) WHERE current_stock IS NULL;
UPDATE flor_products SET image_url = COALESCE(image_url, photo_url, '') WHERE image_url IS NULL;

-- ------------------------------------------------------------------------------
-- 2. TABLA: flor_clients (Directorio de Clientes, Hospitales y Farmacias)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  rfc TEXT,
  address TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  username TEXT,
  password TEXT,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by_vendedor_id TEXT,
  total_purchases INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0.00,
  category TEXT DEFAULT 'Regular',
  credit_limit NUMERIC(10, 2) DEFAULT 0.00,
  current_balance NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS flor_clients ADD COLUMN IF NOT EXISTS created_by_vendedor_id TEXT;

-- ------------------------------------------------------------------------------
-- 3. TABLA: flor_orders (Ventas y Pedidos en Tiempo Real)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_business TEXT,
  client_phone TEXT,
  client_whatsapp TEXT,
  client_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(10, 2) DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT DEFAULT 'efectivo',
  payment_status TEXT DEFAULT 'pendiente',
  status TEXT DEFAULT 'En proceso',
  source TEXT DEFAULT 'vendedor',
  vendedor_id TEXT,
  vendedor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS client_business TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS client_whatsapp TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'vendedor';
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS vendedor_id TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS vendedor_name TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS flor_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- 4. TABLA: flor_employees (Empleados, Asesores y Credenciales de Acceso)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  access_code TEXT,
  username TEXT,
  password TEXT,
  role TEXT DEFAULT 'vendedor',
  active BOOLEAN DEFAULT TRUE,
  sales_count INTEGER DEFAULT 0,
  total_sold NUMERIC(12, 2) DEFAULT 0.00,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor';
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS total_sold NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS flor_employees ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ------------------------------------------------------------------------------
-- 5. TABLA: flor_notifications (Avisos en Tiempo Real con Sonido)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  target_role TEXT NOT NULL DEFAULT 'admin',
  module TEXT NOT NULL DEFAULT 'pedidos',
  read BOOLEAN DEFAULT FALSE,
  target_user_id TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: flor_profiles (Perfiles Corporativos con Foto y Ajustes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flor_profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  password TEXT,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  photo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS flor_profiles DROP CONSTRAINT IF EXISTS flor_profiles_role_key;
ALTER TABLE IF EXISTS flor_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE IF EXISTS flor_profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS flor_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE IF EXISTS flor_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- ÍNDICES DE ALTO RENDIMIENTO
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_code ON flor_products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON flor_products(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON flor_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON flor_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_notifs_target ON flor_notifications(target_role, module);
CREATE INDEX IF NOT EXISTS idx_employees_user ON flor_employees(username);
CREATE INDEX IF NOT EXISTS idx_clients_user ON flor_clients(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON flor_profiles(username);

-- ------------------------------------------------------------------------------
-- SEGURIDAD: ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE ACCESO
-- ------------------------------------------------------------------------------
ALTER TABLE flor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE flor_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura, inserción, actualización y borrado sin restricción para la app
DROP POLICY IF EXISTS "Public access flor_products" ON flor_products;
CREATE POLICY "Public access flor_products" ON flor_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_clients" ON flor_clients;
CREATE POLICY "Public access flor_clients" ON flor_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_orders" ON flor_orders;
CREATE POLICY "Public access flor_orders" ON flor_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_employees" ON flor_employees;
CREATE POLICY "Public access flor_employees" ON flor_employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_notifications" ON flor_notifications;
CREATE POLICY "Public access flor_notifications" ON flor_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access flor_profiles" ON flor_profiles;
CREATE POLICY "Public access flor_profiles" ON flor_profiles FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- PUBLICACIÓN EN TIEMPO REAL NATIVO DE SUPABASE
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE flor_orders, flor_notifications, flor_products, flor_clients, flor_employees, flor_profiles;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- DATOS DE MUESTRA Y CREDENCIALES OFICIALES
-- ==============================================================================

-- 1. CREDENCIALES DE EMPLEADOS Y ASESORES
-- Admin: emilio_admin / Admin#1
-- Vendedor: haroldo90 / Chevropar#1970
-- Vendedor 2: rodrigo.morales / Flor2026$Rodrigo
-- Vendedor 3: sofia.navarro / Flor2026$Sofia

INSERT INTO flor_employees (
  id, name, position, email, phone, whatsapp, username, password, access_code, photo_url, role, active, sales_count, total_sold
) VALUES 
  ('user_emilio_admin', 'Emilio Administrador', 'Director General & Administrador', 'emilio_admin@flordeliz.com', '5512345678', '5512345678', 'emilio_admin', 'Admin#1', 'Admin#1', '', 'admin', true, 2, 8450.00),
  ('emp_haroldo', 'Harold Anguiano', 'Asesor Comercial de Ventas', 'haroldo90@flordeliz.com', '5578901234', '5578901234', 'haroldo90', 'Chevropar#1970', 'Chevropar#1970', '', 'vendedor', true, 12, 21500.00),
  ('emp_rodrigo', 'Rodrigo Morales Peña', 'Asesor Comercial Médico Senior', 'rodrigo.ventas@flordeliz.com', '5545678901', '5545678901', 'rodrigo.morales', 'Flor2026$Rodrigo', 'Flor2026$Rodrigo', '', 'vendedor', true, 8, 14250.00),
  ('emp_sofia', 'Sofía Navarro Cruz', 'Especialista en Material de Curación', 'sofia.navarro@flordeliz.com', '5556789012', '5556789012', 'sofia.navarro', 'Flor2026$Sofia', 'Flor2026$Sofia', '', 'vendedor', true, 6, 9800.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  email = EXCLUDED.email,
  access_code = EXCLUDED.access_code;

-- 2. PERFILES CORPORATIVOS
INSERT INTO flor_profiles (
  id, role, name, username, password, email, phone, whatsapp, business_name, address, photo_url
) VALUES
  ('profile_admin', 'admin', 'Emilio Administrador', 'emilio_admin', 'Admin#1', 'emilio_admin@flordeliz.com', '5512345678', '5512345678', 'Comercializadora Flor de Líz - Suministros Médicos', 'Insurgentes Sur 1450, Col. Actipan, CDMX', ''),
  ('profile_vendedor', 'vendedor', 'Harold Anguiano', 'haroldo90', 'Chevropar#1970', 'haroldo90@flordeliz.com', '5578901234', '5578901234', 'Flor de Líz - División Suministros Médicos', 'Sucursal Central, CDMX', '')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  email = EXCLUDED.email;

-- 3. CLIENTES REGISTRADOS CON CREDENCIALES DE ACCESO AL PORTAL
INSERT INTO flor_clients (
  id, name, business_name, rfc, address, phone, whatsapp, email, username, password, active, notes, created_by_vendedor_id, total_purchases, total_spent
) VALUES
  ('cli_1', 'Dra. Patricia Méndez Galindo', 'Clínica Quirúrgica San Rafael', 'MEGP850612ABC', 'Av. Revolución 1420, Col. San Ángel, CDMX', '5512345678', '5512345678', 'compras@clinicasanrafael.mx', 'patricia.mendez', 'Flor2026$Patricia', true, 'Suministro quincenal de suturas, gasas esterilizadas y jeringas Nipro.', 'emp_haroldo', 4, 12500.00),
  ('cli_2', 'Lic. Fernando Rivas Cordero', 'Farmacias y Botica Central', 'FBC020815XYZ', 'Calzada de Tlalpan 890, Benito Juárez, CDMX', '5523456789', '5523456789', 'adquisiciones@boticacentral.mx', 'fernando.rivas', 'Flor2026$Fernando', true, 'Pedidos por volumen de alcohol, algodón, antisépticos y material de curación.', 'emp_haroldo', 3, 8900.00),
  ('cli_3', 'Dr. Roberto Salgado Vega', 'Centro Médico Quirúrgico Polanco', 'SAVR781109KLM', 'Campos Elíseos 204, Polanco, CDMX', '5534567890', '5534567890', 'contacto@cirugiapolanco.com', 'roberto.salgado', 'Flor2026$Roberto', true, 'Requiere facturación al momento y equipo de venoclisis normogotero.', 'emp_rodrigo', 2, 5400.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  phone = EXCLUDED.phone;

-- 4. PRODUCTOS DE MUESTRA (SUMINISTROS MÉDICOS Y MATERIAL DE CURACIÓN)
INSERT INTO flor_products (
  id, code, name, category, sub_category, description, price, sale_price, stock, current_stock, discount, image_url, photo_url
) VALUES
  ('prod_1', 'SUT-001', 'Sutura Seda Negra 3-0 con Aguja Curva 24mm (Caja 36pz)', 'Suturas', 'Seda', 'Sutura quirúrgica no absorbible de seda trenzada estéril de alta resistencia.', 420.00, 420.00, 45, 45, 5, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'),
  ('prod_2', 'SUT-002', 'Sutura Vicryl Ácido Poliglicólico 2-0 (Caja 36pz)', 'Suturas', 'Sintética Absorbible', 'Sutura sintética absorbible trenzada con excelente deslizamiento tisular.', 580.00, 580.00, 30, 30, 0, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600'),
  ('prod_3', 'JER-001', 'Jeringa Desechable 5ml con Aguja 21G x 32mm (Caja 100pz)', 'Agujas y Jeringas', 'Jeringas 5ml', 'Jeringa de plástico grado médico estéril, émbolo suave de silicón y aguja ultra afilada.', 210.00, 210.00, 120, 120, 10, 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600'),
  ('prod_4', 'JER-002', 'Jeringa Desechable 10ml con Aguja 20G (Caja 100pz)', 'Agujas y Jeringas', 'Jeringas 10ml', 'Cilindro transparente con graduación milimétrica indeleble y libre de látex.', 275.00, 275.00, 80, 80, 0, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600'),
  ('prod_5', 'CUR-001', 'Gasa Cortada Estéril 10x10 cm (Paquete 200 sobres con 2pz)', 'Material de Curación', 'Gasas', '100% algodón tejido de 12 capas, esterilizada con óxido de etileno.', 310.00, 310.00, 95, 95, 5, 'https://images.unsplash.com/photo-1583947582886-f40c7a526d70?w=600', 'https://images.unsplash.com/photo-1583947582886-f40c7a526d70?w=600'),
  ('prod_6', 'CUR-002', 'Venda Elástica de Tejido Plano 10cm x 5m (Caja 12pz)', 'Material de Curación', 'Vendas', 'Compresión media y uniforme, lavable y con clips metálicos de sujeción incluidos.', 145.00, 145.00, 60, 60, 0, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600', 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600'),
  ('prod_7', 'CUR-003', 'Algodón Plisado Absorbente Quirúrgico 500g', 'Material de Curación', 'Algodón', 'Fibras naturales de máxima pureza, libre de impurezas y alta capacidad de absorción.', 98.00, 98.00, 75, 75, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'),
  ('prod_8', 'ANT-001', 'Alcohol Etílico Desnaturalizado al 70% Galón 3.785 Litros', 'Soluciones y Antisépticos', 'Alcoholes', 'Antiséptico y desinfectante de amplio espectro para asepsia y curaciones.', 235.00, 235.00, 40, 40, 5, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600', 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600'),
  ('prod_9', 'ANT-002', 'Solución Antiséptica Clorhexidina al 2% Frasco 500ml', 'Soluciones y Antisépticos', 'Antisépticos', 'Excelente acción residual microbicida para preparación de campo quirúrgico.', 180.00, 180.00, 50, 50, 0, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600'),
  ('prod_10', 'CAT-001', 'Equipo para Venoclisis Normogotero con Filtro Estéril (Caja 50pz)', 'Catéteres y Venoclisis', 'Normogoteros', 'Tubo flexible grado médico libre de pliegues, cámara de goteo transparente y regulador de flujo preciso.', 410.00, 410.00, 65, 65, 8, 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600'),
  ('prod_11', 'PRO-001', 'Guantes de Nitrilo Grado Médico Libres de Polvo Azul (Caja 100pz)', 'Equipo de Protección', 'Guantes', 'Alta resistencia a la punción y desgarro, hipoalergénicos y con textura táctil en los dedos.', 195.00, 195.00, 150, 150, 12, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600'),
  ('prod_12', 'PRO-002', 'Cubrebocas Tricapa Quirúrgico Plisado Termosellado (Caja 50pz)', 'Equipo de Protección', 'Cubrebocas', 'Filtro Meltblown con 99% de filtración bacteriana (BFE), ajuste nasal moldeable y termosellado.', 85.00, 85.00, 200, 200, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  sub_category = EXCLUDED.sub_category,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  stock = EXCLUDED.stock,
  current_stock = EXCLUDED.current_stock,
  image_url = EXCLUDED.image_url;

-- 5. ORDEN DE MUESTRA PARA HISTORIAL DE VENTAS
INSERT INTO flor_orders (
  id, order_number, client_id, client_name, client_business, client_phone, client_whatsapp, client_address,
  items, subtotal, discount_total, total, status, source, vendedor_id, vendedor_name, notes
) VALUES (
  'ord_demo_1001',
  'ORD-2026-1001',
  'cli_1',
  'Dra. Patricia Méndez Galindo',
  'Clínica Quirúrgica San Rafael',
  '5512345678',
  '5512345678',
  'Av. Revolución 1420, Col. San Ángel, CDMX',
  '[{"productId":"prod_1","productName":"Sutura Seda Negra 3-0 (Caja 36pz)","quantity":2,"unitPrice":420.00,"discount":5,"subtotal":798.00},{"productId":"prod_3","productName":"Jeringa Desechable 5ml (Caja 100pz)","quantity":3,"unitPrice":210.00,"discount":10,"subtotal":567.00}]'::jsonb,
  1470.00,
  105.00,
  1365.00,
  'Entregado',
  'vendedor',
  'emp_haroldo',
  'Harold Anguiano',
  'Entrega directa en quirófano 2. Pago cubierto mediante transferencia.'
)
ON CONFLICT (id) DO NOTHING;

-- 6. NOTIFICACIÓN DE BIENVENIDA
INSERT INTO flor_notifications (
  id, title, message, type, target_role, module, read
) VALUES (
  'notif_welcome_1',
  '¡Bienvenido a Flor De Liz!',
  'Base de datos Supabase conectada con éxito. Catálogo médico, pedidos y credenciales listos.',
  'system',
  'admin',
  'sistema',
  false
)
ON CONFLICT (id) DO NOTHING;
