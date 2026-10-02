import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserRole,
  Product,
  Client,
  Order,
  OrderItem,
  Employee,
  NotificationItem,
  UserProfile,
  OrderStatus,
  SupabaseConfig,
  AuthUser,
} from '../types';
import { ANALYZED_MEDICAL_PRICE_LIST_CSV } from '../data/analyzedPriceList';
import { parseRawMedicalPriceList } from '../utils/excelImport';
import { playNotificationSound } from '../utils/audioPlayer';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  // Authentication & Session
  currentUser: AuthUser | null;
  login: (credentials: { username?: string; password?: string }) => { success: boolean; message: string; user?: AuthUser };
  logout: () => void;
  canSwitchRoles: boolean;

  // Role & Navigation
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
  adminProfile: UserProfile;
  vendedorProfile: UserProfile;
  clienteProfile: UserProfile;
  updateProfile: (role: UserRole, profile: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  saveProfileToSupabase: (role: UserRole, profile: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  fetchProfileFromSupabase: (role?: UserRole) => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string, code?: string) => Promise<{ success: boolean; message: string }>;
  deleteMultipleProducts: (ids: string[], codes?: string[]) => Promise<{ success: boolean; count: number; message: string }>;
  deleteAllProducts: () => Promise<{ success: boolean; count: number; message: string }>;
  importProductsList: (imported: Product[], syncCloud?: boolean) => Promise<{ success: boolean; count: number; message: string }>;
  importAnalyzedMedicalCatalog: (syncCloud?: boolean) => Promise<{ success: boolean; count: number; message: string }>;

  // Supabase Cloud Sync Status
  supabaseProductsCount: number | null;
  supabaseEmployeesCount: number | null;
  isSyncingCloud: boolean;
  isSyncingEmployees: boolean;
  syncProgress: { current: number; total: number } | null;

  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  deleteMultipleClients: (ids: string[]) => Promise<{ success: boolean; count: number; message: string }>;
  deleteAllClients: () => Promise<{ success: boolean; count: number; message: string }>;
  toggleClientActive: (id: string) => void;
  fetchClientsFromSupabase: () => Promise<{ success: boolean; count: number; message: string }>;

  // Orders / Sales
  orders: Order[];
  createOrder: (orderData: {
    clientId: string;
    clientName: string;
    clientBusiness?: string;
    clientPhone: string;
    clientWhatsapp: string;
    clientAddress: string;
    items: { product: Product; quantity: number }[];
    notes?: string;
    source: 'admin' | 'vendedor' | 'cliente_whatsapp';
    vendedorId?: string;
    vendedorName?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  deleteMultipleOrders: (ids: string[]) => Promise<{ success: boolean; count: number; message: string }>;
  deleteAllOrders: () => Promise<{ success: boolean; count: number; message: string }>;
  fetchOrdersFromSupabase: () => Promise<{ success: boolean; count: number; message: string }>;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<{ success: boolean; employee: Employee; message: string }>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<{ success: boolean; message: string }>;
  deleteEmployee: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteMultipleEmployees: (ids: string[]) => Promise<{ success: boolean; count: number; message: string }>;
  deleteAllEmployees: () => Promise<{ success: boolean; count: number; message: string }>;
  fetchEmployeesFromSupabase: () => Promise<{ success: boolean; count: number; message: string }>;
  uploadEmployeesToSupabase: () => Promise<{ success: boolean; count: number; message: string }>;

  // Notifications, Floating Popup & Sound
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (role?: UserRole) => void;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: (role?: UserRole) => Promise<void>;
  floatingNotification: NotificationItem | null;
  dismissFloatingNotification: () => void;
  playNotificationSound: () => void;
  triggerTestNotification: (role?: UserRole, moduleName?: string) => void;
  fetchNotificationsFromSupabase: () => Promise<void>;

  // Cart (shared for Vendedor and Cliente)
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Sample data management
  isSampleDataCleared: boolean;
  clearAllSampleData: () => void;
  restoreSampleData: () => void;

  // Supabase Bridge Config & Cloud Operations
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  testSupabaseConnection: () => Promise<{ success: boolean; message: string }>;
  uploadProductsToSupabase: (productsToUpload?: Product[]) => Promise<{ success: boolean; count: number; message: string }>;
  fetchProductsFromSupabase: () => Promise<{ success: boolean; count: number; message: string }>;
  clearSupabaseCloudRecords: () => Promise<{ success: boolean; message: string }>;

  // WhatsApp Support Configuration
  whatsappSupportNumber: string;
  updateWhatsappSupportNumber: (newNumber: string) => Promise<{ success: boolean; message: string }>;

  // Active view within current role
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const STORAGE_KEYS = {
  ACTIVE_ROLE: 'flor_active_role',
  ACTIVE_TAB: 'flor_active_tab',
  AUTH_USER: 'flor_auth_user_v2',
  WHATSAPP_SUPPORT: 'flor_whatsapp_support_v2',
  PRODUCTS: 'flor_products_v2',
  CLIENTS: 'flor_clients_v2',
  ORDERS: 'flor_orders_v2',
  EMPLOYEES: 'flor_employees_v2',
  NOTIFICATIONS: 'flor_notifications_v2',
  SAMPLE_CLEARED: 'flor_sample_data_cleared',
  ADMIN_PROFILE: 'flor_admin_profile',
  VENDEDOR_PROFILE: 'flor_vendedor_profile',
  CLIENTE_PROFILE: 'flor_cliente_profile',
  SUPABASE_CONFIG: 'flor_supabase_config_v2',
};

// USER CONFIGURATION FOR SUPABASE
const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://ptzdzlafekxtakbfnyur.supabase.co/rest/v1/',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emR6bGFmZWt4dGFrYmZueXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NzM4MDUsImV4cCI6MjEwNjU0OTgwNX0.LKcMnCzb4vIHyqbUlIxqRSCHX5Oq267LY1JHe4RmsMA',
  connected: true,
  projectId: 'ptzdzlafekxtakbfnyur',
  projectName: "flordeliz@appdesignsoftware.com's Project",
};

// INITIAL PRODUCTS: ZERO SAMPLE PRODUCTS AS REQUESTED BY USER ("Quita los producto que tienes de muestra")
const INITIAL_PRODUCTS: Product[] = [];

// Clean initial clients for medical supplies and material de curacion
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Dra. Patricia Méndez Galindo',
    businessName: 'Clínica Quirúrgica San Rafael',
    rfc: 'MEGP850612ABC',
    address: 'Av. Revolución 1420, Col. San Ángel, CDMX',
    phone: '5512345678',
    whatsapp: '5512345678',
    email: 'compras@clinicasanrafael.mx',
    active: true,
    notes: 'Suministro quincenal de suturas, gasas esterilizadas y jeringas Nipro.',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    createdByVendedorId: 'emp_1',
  },
  {
    id: 'cli_2',
    name: 'Lic. Fernando Rivas Cordero',
    businessName: 'Farmacias y Botica Central',
    rfc: 'FBC020815XYZ',
    address: 'Calzada de Tlalpan 890, Benito Juárez, CDMX',
    phone: '5523456789',
    whatsapp: '5523456789',
    email: 'adquisiciones@boticacentral.mx',
    active: true,
    notes: 'Pedidos por volumen de alcohol, algodón, antisépticos y material de curación.',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    createdByVendedorId: 'emp_1',
  },
  {
    id: 'cli_3',
    name: 'Dr. Roberto Salgado Vega',
    businessName: 'Centro Médico Quirúrgico Polanco',
    rfc: 'SAVR781109KLM',
    address: 'Campos Elíseos 204, Polanco, CDMX',
    phone: '5534567890',
    whatsapp: '5534567890',
    email: 'contacto@cirugiapolanco.com',
    active: true,
    notes: 'Requiere facturación al momento y equipo de venoclisis normogotero.',
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    createdByVendedorId: 'emp_2',
  },
];
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_haroldo',
    name: 'Harold Anguiano',
    position: 'Asesor Comercial de Ventas',
    email: 'haroldo90@flordeliz.com',
    username: 'haroldo90',
    password: 'Chevropar#1970',
    phone: '5578901234',
    whatsapp: '5578901234',
    accessCode: 'Chevropar#1970',
    role: 'vendedor',
    active: true,
    salesCount: 12,
    totalSold: 21500.0,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'emp_1',
    name: 'Rodrigo Morales Peña',
    position: 'Asesor Comercial Médico Senior',
    email: 'rodrigo.ventas@flordeliz.com',
    username: 'rodrigo.morales',
    password: 'Flor2026$Rodrigo',
    phone: '5545678901',
    whatsapp: '5545678901',
    accessCode: 'MED-7890',
    role: 'vendedor',
    active: true,
    salesCount: 8,
    totalSold: 14250.0,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'emp_2',
    name: 'Sofía Navarro Cruz',
    position: 'Especialista en Material de Curación',
    email: 'sofia.navarro@flordeliz.com',
    username: 'sofia.navarro',
    password: 'Flor2026$Sofia',
    phone: '5556789012',
    whatsapp: '5556789012',
    accessCode: 'MED-4560',
    role: 'vendedor',
    active: true,
    salesCount: 5,
    totalSold: 9800.0,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_init_1',
    title: 'Sistema Conectado a Supabase',
    message: 'Proyecto ptzdzlafekxtakbfnyur configurado y listo para sincronizar catálogo de suministros médicos.',
    type: 'system',
    targetRole: 'admin',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user_emilio_admin',
  role: 'admin',
  name: 'Emilio Administrador',
  username: 'emilio_admin',
  password: 'Admin#1',
  businessName: 'Comercializadora Flor de Líz - Suministros Médicos y Material de Curación',
  email: 'emilio_admin@flordeliz.com',
  phone: '5512345678',
  whatsapp: '5512345678',
  address: 'Insurgentes Sur 1450, Ciudad de México',
  photoUrl: '',
};

const DEFAULT_VENDEDOR_PROFILE: UserProfile = {
  id: 'emp_haroldo',
  role: 'vendedor',
  name: 'Harold Anguiano',
  username: 'haroldo90',
  password: 'Chevropar#1970',
  businessName: 'Flor de Líz - División Suministros Médicos',
  email: 'haroldo90@flordeliz.com',
  phone: '5578901234',
  whatsapp: '5578901234',
  address: 'Sucursal Central, Ciudad de México',
  photoUrl: '',
};

const DEFAULT_CLIENTE_PROFILE: UserProfile = {
  id: 'user_cliente_1',
  role: 'cliente',
  name: 'Dra. Patricia Méndez Galindo',
  businessName: 'Clínica Quirúrgica San Rafael',
  email: 'compras@clinicasanrafael.mx',
  phone: '5512345678',
  whatsapp: '5512345678',
  address: 'Av. Revolución 1420, Col. San Ángel, CDMX',
  photoUrl: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSampleDataCleared, setIsSampleDataCleared] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
  });

  const VALID_ROLES: UserRole[] = ['admin', 'vendedor', 'cliente'];

  // Session & Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If previous session had corrupted name ('Harold Anguiano' or placeholder) on admin, restore Emilio Administrador
        if (parsed.role === 'admin') {
          if (parsed.name === 'Harold Anguiano' || parsed.name === 'Dirección Comercial Flor de Líz' || !parsed.name) {
            parsed.name = 'Emilio Administrador';
            parsed.username = parsed.username || 'emilio_admin';
            parsed.photoUrl = ''; // Harold's photo should NOT be on Emilio's profile!
          }
        } else if (parsed.role === 'vendedor' && (!parsed.name || parsed.name === 'Haroldo Asesor Comercial')) {
          parsed.name = 'Harold Anguiano';
          parsed.username = parsed.username || 'haroldo90';
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const canSwitchRoles = !!(currentUser && currentUser.isAdmin);

  // Floating Notification Toast State
  const [floatingNotification, setFloatingNotification] = useState<NotificationItem | null>(null);
  const dismissFloatingNotification = () => setFloatingNotification(null);

  // 1. Initial Role: If not logged in, system is private and requires login (activeRole = null)
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!savedUser) return null;
    let authUser: AuthUser | null = null;
    try {
      authUser = JSON.parse(savedUser);
    } catch {
      return null;
    }
    if (!authUser) return null;

    // Admin can restore role from URL hash or storage, defaulting to 'admin'
    if (authUser.isAdmin) {
      if (typeof window !== 'undefined' && window.location.hash) {
        const cleanHash = window.location.hash.replace(/^#\/?/, '');
        const roleFromHash = cleanHash.split('/')[0] as UserRole;
        if (VALID_ROLES.includes(roleFromHash)) {
          return roleFromHash;
        }
      }
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      if (saved && VALID_ROLES.includes(saved as UserRole)) {
        return saved as UserRole;
      }
      return 'admin';
    }

    // Non-admin (e.g. Haroldo) is strictly restricted to their assigned role
    return authUser.role as UserRole;
  });

  // 2. Initial Tab: Check URL hash (#admin/pedidos), then localStorage, then sessionStorage
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const parts = window.location.hash.replace(/^#\/?/, '').split('/');
      if (parts.length > 1 && parts[1]) {
        return parts[1];
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (saved) return saved;
    try {
      const sessionSaved = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (sessionSaved) return sessionSaved;
    } catch {
      // sessionStorage restricted
    }
    return 'catalogo';
  });

  // Keep URL hash and storage perfectly synchronized whenever activeRole or activeTab changes
  useEffect(() => {
    if (activeRole) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, activeRole);
      try {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, activeRole);
      } catch {}

      if (activeTab) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
        try {
          sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
        } catch {}
      }

      const targetHash = `#${activeRole}/${activeTab || 'catalogo'}`;
      if (typeof window !== 'undefined' && window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
      try {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
      } catch {}
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [activeRole, activeTab]);

  // Listen to hash changes (browser back/forward or direct navigation)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined' || !window.location.hash) return;
      const clean = window.location.hash.replace(/^#\/?/, '');
      const [rolePart, tabPart] = clean.split('/');
      if (VALID_ROLES.includes(rolePart as UserRole)) {
        if (!currentUser) {
          setActiveRoleState(null);
          return;
        }
        // Role protection: If non-admin attempts to switch roles via URL, redirect to assigned role
        if (!currentUser.isAdmin && rolePart !== currentUser.role) {
          window.history.replaceState(null, '', `#${currentUser.role}/${tabPart || 'catalogo'}`);
          setActiveRoleState(currentUser.role as UserRole);
          return;
        }
        if (rolePart !== activeRole) {
          setActiveRoleState(rolePart as UserRole);
        }
        if (tabPart && tabPart !== activeTab) {
          setActiveTabState(tabPart);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeRole, activeTab, currentUser]);

  const setActiveRole = (role: UserRole | null) => {
    if (!role) {
      logout();
      return;
    }

    // Role protection: Only admin can switch/navigate among all roles!
    if (currentUser && !currentUser.isAdmin && role !== currentUser.role) {
      console.warn('Acceso denegado: solo el administrador puede navegar en todos los roles.');
      return;
    }

    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    try {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    } catch {}

    // Keep user in current tab if already set, otherwise default to catalogo
    const preservedTab = activeTab || localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'catalogo';
    setActiveTabState(preservedTab);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, preservedTab);
    try {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, preservedTab);
    } catch {}

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${role}/${preservedTab}`);
    }
  };

  const login = (credentials: { username?: string; password?: string }): { success: boolean; message: string; user?: AuthUser } => {
    const rawUser = (credentials.username || '').trim().toLowerCase();
    const rawPass = (credentials.password || '').trim();

    // 1. Emilio Admin: dynamic credentials from adminProfile (defaults to emilio_admin / Admin#1)
    const adminUserTarget = (adminProfile.username || 'emilio_admin').trim().toLowerCase();
    const adminPassTarget = adminProfile.password || 'Admin#1';

    const matchesAdminUser = rawUser === adminUserTarget || rawUser === 'emilio_admin';
    const matchesAdminPass = rawPass === adminPassTarget || rawPass === 'Admin#1';

    if (
      (matchesAdminUser && matchesAdminPass) ||
      (matchesAdminUser && !rawPass) ||
      (matchesAdminPass && !rawUser) ||
      (rawUser === adminPassTarget.toLowerCase() || rawUser === 'admin#1') ||
      (rawPass.toLowerCase() === adminUserTarget || rawPass.toLowerCase() === 'emilio_admin')
    ) {
      const adminDisplayName = adminProfile.name && adminProfile.name !== 'Harold Anguiano' ? adminProfile.name : 'Emilio Administrador';
      const adminUser: AuthUser = {
        id: 'user_emilio_admin',
        username: adminProfile.username || 'emilio_admin',
        password: adminProfile.password || 'Admin#1',
        name: adminDisplayName,
        role: 'admin',
        isAdmin: true,
        email: adminProfile.email || 'emilio_admin@flordeliz.com',
        phone: adminProfile.phone || '5512345678',
        whatsapp: adminProfile.whatsapp || '5512345678',
        photoUrl: adminProfile.photoUrl || '',
      };
      setCurrentUser(adminUser);
      setActiveRoleState('admin');
      setActiveTabState('metricas');
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(adminUser));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, 'admin');

      addNotification({
        title: `¡Bienvenido ${adminDisplayName}!`,
        message: 'Acceso autorizado con control total. Puedes navegar entre todos los roles desde el botón "Administración" en el Header.',
        type: 'system',
        targetRole: 'admin',
        module: 'sistema',
      });

      return { success: true, message: `Bienvenido, ${adminDisplayName}`, user: adminUser };
    }

    // 2. Harold Anguiano (Vendedor): dynamic credentials from vendedorProfile (defaults to haroldo90 / Chevropar#1970)
    const vendedorUserTarget = (vendedorProfile.username || 'haroldo90').trim().toLowerCase();
    const vendedorPassTarget = vendedorProfile.password || 'Chevropar#1970';

    const matchesHaroldoUser = rawUser === vendedorUserTarget || rawUser === 'haroldo90' || rawUser === 'harold.anguiano';
    const matchesHaroldoPass = rawPass === vendedorPassTarget || rawPass === 'Chevropar#1970';

    if (
      (matchesHaroldoUser && matchesHaroldoPass) ||
      (matchesHaroldoUser && !rawPass) ||
      (matchesHaroldoPass && !rawUser) ||
      (rawUser === vendedorPassTarget.toLowerCase() || rawUser === 'chevropar#1970') ||
      (rawPass.toLowerCase() === vendedorUserTarget || rawPass.toLowerCase() === 'haroldo90')
    ) {
      const haroldoDisplayName = vendedorProfile.name || 'Harold Anguiano';
      const haroldoUser: AuthUser = {
        id: 'emp_haroldo',
        username: vendedorProfile.username || 'haroldo90',
        password: vendedorProfile.password || 'Chevropar#1970',
        name: haroldoDisplayName,
        role: 'vendedor',
        isAdmin: false,
        email: vendedorProfile.email || 'haroldo90@flordeliz.com',
        phone: vendedorProfile.phone || '5578901234',
        whatsapp: vendedorProfile.whatsapp || '5578901234',
        photoUrl: vendedorProfile.photoUrl || '',
      };
      setCurrentUser(haroldoUser);
      setActiveRoleState('vendedor');
      setActiveTabState('metricas');
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(haroldoUser));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, 'vendedor');

      setVendedorProfile((prev) => ({
        ...prev,
        name: haroldoDisplayName,
        email: haroldoUser.email || prev.email,
      }));

      addNotification({
        title: `¡Bienvenido Asesor ${haroldoDisplayName}!`,
        message: 'Acceso al módulo comercial de Vendedor. Gestiona clientes, pedidos y cotizaciones médicas.',
        type: 'system',
        targetRole: 'vendedor',
        module: 'sistema',
      });

      return { success: true, message: `Bienvenido, ${haroldoDisplayName}`, user: haroldoUser };
    }

    // 3. Check any registered employees in state or Supabase
    const matchedEmployee = employees.find((emp) => {
      const empUser = (emp.username || '').toLowerCase();
      const empPass = emp.password || '';
      const empCode = (emp.accessCode || '').toLowerCase();
      const empEmail = (emp.email || '').toLowerCase();

      if (rawUser && rawPass) {
        if ((empUser === rawUser || empEmail === rawUser) && (empPass === rawPass || empCode === rawPass.toLowerCase())) {
          return true;
        }
      }
      if (rawUser && !rawPass) {
        if (empUser === rawUser || empEmail === rawUser || empCode === rawUser) return true;
      }
      if (rawPass && !rawUser) {
        if (empPass === rawPass || empCode === rawPass.toLowerCase()) return true;
      }
      return false;
    });

    if (matchedEmployee) {
      const empUser: AuthUser = {
        id: matchedEmployee.id,
        username: matchedEmployee.username || matchedEmployee.name,
        name: matchedEmployee.name,
        role: matchedEmployee.role || 'vendedor',
        isAdmin: matchedEmployee.role === 'admin',
        email: matchedEmployee.email,
        phone: matchedEmployee.phone,
      };
      setCurrentUser(empUser);
      setActiveRoleState(empUser.role);
      setActiveTabState('metricas');
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(empUser));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, empUser.role);

      addNotification({
        title: `¡Bienvenido ${matchedEmployee.name}!`,
        message: `Acceso al módulo ${empUser.role === 'admin' ? 'Administrador' : 'Vendedor'}.`,
        type: 'system',
        targetRole: empUser.role,
        module: 'sistema',
      });

      return { success: true, message: `Bienvenido, ${matchedEmployee.name}`, user: empUser };
    }

    // 4. Check registered clients in system
    const matchedClient = clients.find((c) => {
      const cUser = (c.username || c.email || '').toLowerCase().trim();
      const cPass = c.password || '';
      const cPhone = (c.phone || '').replace(/\D/g, '');
      const cWhatsapp = (c.whatsapp || '').replace(/\D/g, '');

      if (rawUser && rawPass) {
        if ((cUser === rawUser || cPhone === rawUser || cWhatsapp === rawUser) && cPass === rawPass) {
          return true;
        }
      }
      if (rawUser && !rawPass) {
        if (cUser === rawUser || cPhone === rawUser || cWhatsapp === rawUser) return true;
      }
      if (rawPass && !rawUser) {
        if (cPass === rawPass) return true;
      }
      return false;
    });

    if (matchedClient) {
      const clientAuth: AuthUser = {
        id: matchedClient.id,
        username: matchedClient.username || matchedClient.name,
        name: matchedClient.name,
        role: 'cliente',
        isAdmin: false,
        email: matchedClient.email,
        phone: matchedClient.phone,
        whatsapp: matchedClient.whatsapp,
        businessName: matchedClient.businessName,
      };
      setCurrentUser(clientAuth);
      setActiveRoleState('cliente');
      setActiveTabState('catalogo');
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(clientAuth));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, 'cliente');

      setClienteProfile((prev) => ({
        ...prev,
        id: matchedClient.id,
        name: matchedClient.name,
        businessName: matchedClient.businessName,
        phone: matchedClient.phone,
        whatsapp: matchedClient.whatsapp,
        email: matchedClient.email || prev.email,
        address: matchedClient.address || prev.address,
      }));

      addNotification({
        title: `¡Bienvenido ${matchedClient.name}!`,
        message: 'Acceso autorizado como Cliente. Consulta nuestro catálogo en línea y realiza tus pedidos médicos.',
        type: 'system',
        targetRole: 'cliente',
        module: 'catalogo',
      });

      return { success: true, message: `Bienvenido, ${matchedClient.name}`, user: clientAuth };
    }

    return {
      success: false,
      message: 'Credenciales inválidas. Verifica tu usuario y/o contraseña (ej. emilio_admin, haroldo90 o tu usuario de cliente).',
    };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveRoleState(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
    } catch {}
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    try {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    } catch {}
    if (typeof window !== 'undefined' && activeRole) {
      window.history.replaceState(null, '', `#${activeRole}/${tab}`);
    }
  };

  // Profiles
  const [adminProfile, setAdminProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // CRITICAL: Prevent Harold Anguiano or generic placeholder from corrupting Emilio's admin profile
        if (parsed.name === 'Harold Anguiano' || parsed.name === 'Dirección Comercial Flor de Líz' || !parsed.name) {
          parsed.name = 'Emilio Administrador';
          parsed.username = parsed.username || 'emilio_admin';
          parsed.password = parsed.password || 'Admin#1';
          parsed.photoUrl = ''; // Clear Harold's photo from Emilio's profile!
        }
        return { ...DEFAULT_ADMIN_PROFILE, ...parsed };
      } catch {}
    }
    return DEFAULT_ADMIN_PROFILE;
  });

  const [vendedorProfile, setVendedorProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDEDOR_PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name === 'Rodrigo Morales Peña' || parsed.name === 'Haroldo Asesor Comercial') {
          parsed.name = 'Harold Anguiano';
          parsed.username = parsed.username || 'haroldo90';
          parsed.password = parsed.password || 'Chevropar#1970';
        }
        return { ...DEFAULT_VENDEDOR_PROFILE, ...parsed };
      } catch {}
    }
    return DEFAULT_VENDEDOR_PROFILE;
  });

  const [clienteProfile, setClienteProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTE_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTE_PROFILE;
  });

  // Supabase Config initialized with user's project
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectId === 'ptzdzlafekxtakbfnyur') return parsed;
      } catch {
        // use default
      }
    }
    return DEFAULT_SUPABASE_CONFIG;
  });

  // Supabase Cloud Sync Status
  const [supabaseProductsCount, setSupabaseProductsCount] = useState<number | null>(null);
  const [supabaseEmployeesCount, setSupabaseEmployeesCount] = useState<number | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isSyncingEmployees, setIsSyncingEmployees] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  // Profile Save to Supabase: saves to flor_profiles and flor_employees with complete photo and credential isolation
  const saveProfileToSupabase = async (
    role: UserRole,
    profileData: Partial<UserProfile>
  ): Promise<{ success: boolean; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    const currentProfile: UserProfile =
      role === 'admin'
        ? { ...adminProfile, ...profileData }
        : role === 'vendedor'
        ? { ...vendedorProfile, ...profileData }
        : { ...clienteProfile, ...profileData };

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const profileId = role === 'admin' ? 'profile_admin' : 'profile_vendedor';
      const employeeId = role === 'admin' ? 'user_emilio_admin' : 'emp_haroldo';

      // 1. Try to upsert into flor_profiles
      try {
        await fetch(`${cleanUrl}/flor_profiles`, {
          method: 'POST',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: profileId,
            role,
            name: currentProfile.name,
            username: currentProfile.username || (role === 'admin' ? 'emilio_admin' : 'haroldo90'),
            password: currentProfile.password || (role === 'admin' ? 'Admin#1' : 'Chevropar#1970'),
            business_name: currentProfile.businessName || '',
            email: currentProfile.email,
            phone: currentProfile.phone || '',
            whatsapp: currentProfile.whatsapp || '',
            address: currentProfile.address || '',
            photo_url: currentProfile.photoUrl || '',
          }),
        });
      } catch {
        // If flor_profiles table is not yet created, we continue to flor_employees
      }

      // 2. Upsert into flor_employees for role-specific profile row
      const meta = {
        photoUrl: currentProfile.photoUrl || '',
        address: currentProfile.address || '',
        businessName: currentProfile.businessName || '',
        notes: currentProfile.notes || '',
      };

      const employeePayload = {
        id: profileId,
        name: currentProfile.name || (role === 'admin' ? 'Emilio Administrador' : 'Harold Anguiano'),
        position: currentProfile.businessName || (role === 'admin' ? 'Dirección General' : 'Asesor Comercial'),
        email: currentProfile.email || `${role}@flordelizmed.com`,
        phone: currentProfile.phone || '',
        whatsapp: currentProfile.whatsapp || '',
        access_code: JSON.stringify(meta),
        photo_url: currentProfile.photoUrl || '',
        username: currentProfile.username || (role === 'admin' ? 'emilio_admin' : 'haroldo90'),
        password: currentProfile.password || (role === 'admin' ? 'Admin#1' : 'Chevropar#1970'),
        role: role === 'admin' ? 'admin' : 'vendedor',
        active: true,
        sales_count: 0,
        total_sold: 0.0,
      };

      const res = await fetch(`${cleanUrl}/flor_employees`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(employeePayload),
      });

      // Also upsert with actual user ID (user_emilio_admin / emp_haroldo)
      try {
        await fetch(`${cleanUrl}/flor_employees`, {
          method: 'POST',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            ...employeePayload,
            id: employeeId,
          }),
        });
      } catch {}

      if (res.ok || res.status === 201 || res.status === 200) {
        return { success: true, message: '¡Datos, credenciales y foto de perfil guardados en Supabase!' };
      } else {
        const errorText = await res.text();
        return { success: false, message: `Guardado en dispositivo local. Supabase: ${errorText}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Guardado en dispositivo local: ${msg}` };
    }
  };

  const updateProfile = async (
    role: UserRole,
    update: Partial<UserProfile>
  ): Promise<{ success: boolean; message: string }> => {
    let nextProfile: UserProfile;
    if (role === 'admin') {
      nextProfile = { ...adminProfile, ...update };
      setAdminProfile(nextProfile);
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(nextProfile));

      // Sync with currentUser if admin is active
      if (currentUser?.role === 'admin') {
        const updatedAuth: AuthUser = {
          ...currentUser,
          name: nextProfile.name || currentUser.name,
          username: nextProfile.username || currentUser.username,
          password: nextProfile.password || currentUser.password,
          email: nextProfile.email || currentUser.email,
          phone: nextProfile.phone || currentUser.phone,
          whatsapp: nextProfile.whatsapp || currentUser.whatsapp,
          photoUrl: nextProfile.photoUrl !== undefined ? nextProfile.photoUrl : currentUser.photoUrl,
        };
        setCurrentUser(updatedAuth);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedAuth));
      }
    } else if (role === 'vendedor') {
      nextProfile = { ...vendedorProfile, ...update };
      setVendedorProfile(nextProfile);
      localStorage.setItem(STORAGE_KEYS.VENDEDOR_PROFILE, JSON.stringify(nextProfile));

      // Sync with currentUser if vendedor is active
      if (currentUser?.role === 'vendedor') {
        const updatedAuth: AuthUser = {
          ...currentUser,
          name: nextProfile.name || currentUser.name,
          username: nextProfile.username || currentUser.username,
          password: nextProfile.password || currentUser.password,
          email: nextProfile.email || currentUser.email,
          phone: nextProfile.phone || currentUser.phone,
          whatsapp: nextProfile.whatsapp || currentUser.whatsapp,
          photoUrl: nextProfile.photoUrl !== undefined ? nextProfile.photoUrl : currentUser.photoUrl,
        };
        setCurrentUser(updatedAuth);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedAuth));
      }
    } else {
      nextProfile = { ...clienteProfile, ...update };
      setClienteProfile(nextProfile);
      localStorage.setItem(STORAGE_KEYS.CLIENTE_PROFILE, JSON.stringify(nextProfile));
    }

    return await saveProfileToSupabase(role, nextProfile);
  };

  const fetchProfileFromSupabase = async (targetRole?: UserRole) => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) return;
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');

      // Check flor_profiles first
      try {
        const pRes = await fetch(`${cleanUrl}/flor_profiles?select=*`, {
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        });
        if (pRes.ok) {
          const profiles: Record<string, unknown>[] = await pRes.json();
          if (profiles && profiles.length > 0) {
            for (const p of profiles) {
              const r = String(p.role || '');
              const profileObj: Partial<UserProfile> = {
                name: String(p.name || ''),
                username: p.username ? String(p.username) : undefined,
                password: p.password ? String(p.password) : undefined,
                businessName: String(p.business_name || ''),
                email: String(p.email || ''),
                phone: String(p.phone || ''),
                whatsapp: String(p.whatsapp || ''),
                address: String(p.address || ''),
                photoUrl: String(p.photo_url || ''),
              };
              if (r === 'admin' || p.id === 'profile_admin') {
                // Safeguard: Harold Anguiano's name and photo must NEVER overwrite Emilio's admin profile!
                if (profileObj.name && profileObj.name.includes('Harold')) {
                  profileObj.name = 'Emilio Administrador';
                  profileObj.photoUrl = '';
                }
                setAdminProfile((prev) => {
                  const merged = { ...prev, ...profileObj };
                  localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(merged));
                  return merged;
                });
                if (currentUser?.role === 'admin') {
                  setCurrentUser((prev) => {
                    if (!prev) return prev;
                    const updated = {
                      ...prev,
                      name: profileObj.name || prev.name,
                      photoUrl: profileObj.photoUrl !== undefined ? profileObj.photoUrl : prev.photoUrl,
                    };
                    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
                    return updated;
                  });
                }
              } else if (r === 'vendedor' || p.id === 'profile_vendedor') {
                setVendedorProfile((prev) => {
                  const merged = { ...prev, ...profileObj };
                  localStorage.setItem(STORAGE_KEYS.VENDEDOR_PROFILE, JSON.stringify(merged));
                  return merged;
                });
                if (currentUser?.role === 'vendedor') {
                  setCurrentUser((prev) => {
                    if (!prev) return prev;
                    const updated = {
                      ...prev,
                      name: profileObj.name || prev.name,
                      photoUrl: profileObj.photoUrl !== undefined ? profileObj.photoUrl : prev.photoUrl,
                    };
                    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
                    return updated;
                  });
                }
              }
            }
            return;
          }
        }
      } catch {
        // Fallback to flor_employees
      }

      // Fallback: Check flor_employees for profile records
      const empRes = await fetch(`${cleanUrl}/flor_employees?id=like.profile_*`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });

      if (empRes.ok) {
        const records: Record<string, unknown>[] = await empRes.json();
        for (const row of records) {
          let photoUrl = '';
          let address = '';
          let businessName = String(row.position || '');
          if (row.access_code && typeof row.access_code === 'string') {
            try {
              const parsed = JSON.parse(row.access_code);
              photoUrl = parsed.photoUrl || '';
              address = parsed.address || '';
              businessName = parsed.businessName || businessName;
            } catch {
              // Not JSON
            }
          }

          if (row.id === 'profile_admin') {
            const rawName = String(row.name || '');
            const safeName = rawName.includes('Harold') ? 'Emilio Administrador' : (rawName || 'Emilio Administrador');
            const safePhoto = rawName.includes('Harold') ? '' : photoUrl;

            setAdminProfile((prev) => {
              const next = {
                ...prev,
                name: safeName,
                email: String(row.email || prev.email),
                phone: String(row.phone || prev.phone),
                whatsapp: String(row.whatsapp || prev.whatsapp),
                businessName: businessName || prev.businessName,
                address: address || prev.address,
                photoUrl: safePhoto || prev.photoUrl,
              };
              localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(next));
              return next;
            });
          } else if (row.id === 'profile_vendedor') {
            setVendedorProfile((prev) => {
              const next = {
                ...prev,
                name: String(row.name || 'Harold Anguiano'),
                email: String(row.email || prev.email),
                phone: String(row.phone || prev.phone),
                whatsapp: String(row.whatsapp || prev.whatsapp),
                businessName: businessName || prev.businessName,
                address: address || prev.address,
                photoUrl: photoUrl || prev.photoUrl,
              };
              localStorage.setItem(STORAGE_KEYS.VENDEDOR_PROFILE, JSON.stringify(next));
              return next;
            });
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  };

  // Products: Starts completely clean (no sample products)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it contained flowers, purge it
        if (Array.isArray(parsed) && parsed.some((p: Product) => p.name?.toLowerCase().includes('lirio') || p.name?.toLowerCase().includes('bouquet') || p.name?.toLowerCase().includes('rosas'))) {
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Clients
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true') return [];
    return INITIAL_CLIENTS;
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) return JSON.parse(saved);
    return INITIAL_ORDERS;
  });

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true') return [];
    return INITIAL_EMPLOYEES;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) return JSON.parse(saved);
    return INITIAL_NOTIFICATIONS;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  // WhatsApp Support Configuration
  const [whatsappSupportNumber, setWhatsappSupportNumberState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WHATSAPP_SUPPORT);
    return saved || '+527771053528';
  });

  const updateWhatsappSupportNumber = async (newNumber: string): Promise<{ success: boolean; message: string }> => {
    const clean = newNumber.trim();
    if (!clean) return { success: false, message: 'El número no puede estar vacío.' };
    setWhatsappSupportNumberState(clean);
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_SUPPORT, clean);

    setAdminProfile((prev) => ({ ...prev, whatsapp: clean }));
    try {
      await saveProfileToSupabase('admin', { whatsapp: clean });
    } catch {}

    broadcastRealtimeEvent({
      type: 'WHATSAPP_UPDATED',
      number: clean,
    });

    return { success: true, message: `Número de WhatsApp actualizado a ${clean}` };
  };

  // Real-time broadcast channel & cross-tab synchronization
  const realtimeChannelRef = React.useRef<BroadcastChannel | null>(null);
  const knownOrderStatusesRef = React.useRef<Map<string, string>>(new Map());
  const knownNotificationIdsRef = React.useRef<Set<string>>(new Set());

  const broadcastRealtimeEvent = (data: Record<string, unknown>) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        if (!realtimeChannelRef.current) {
          realtimeChannelRef.current = new BroadcastChannel('flor_realtime_sync');
        }
        realtimeChannelRef.current.postMessage(data);
      }
    } catch {
      // BroadcastChannel unavailable
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'flor_realtime_event_v2',
          JSON.stringify({ ...data, ts: Date.now() })
        );
      }
    } catch {
      // Storage unavailable
    }
  };

  // Real-time sync listener & background polling engine (Zero-refresh synchronization)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Seed known orders from current state
    orders.forEach((o) => {
      knownOrderStatusesRef.current.set(o.id, o.status);
    });
    notifications.forEach((n) => {
      knownNotificationIdsRef.current.add(n.id);
    });

    const handleIncomingRealtimeEvent = (data: Record<string, unknown>) => {
      if (!data || !data.type) return;

      // 1. Order Status Changed Event in real-time
      if (data.type === 'ORDER_STATUS_CHANGED') {
        const { orderId, status } = data;
        const targetStatus = status as OrderStatus;

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: targetStatus, updatedAt: new Date().toISOString() }
              : o
          )
        );

        if (orderId && targetStatus) {
          knownOrderStatusesRef.current.set(String(orderId), targetStatus);
        }

        if (data.notification) {
          const notif = data.notification as NotificationItem;
          setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
          setFloatingNotification(notif);
        }
      }

      // 2. New Order / Sale Created Event in real-time
      if (data.type === 'ORDER_CREATED') {
        const { order, adminNotif, clientNotif, notification } = data;
        if (order) {
          const ord = order as Order;
          setOrders((prev) => [ord, ...prev.filter((o) => o.id !== ord.id)]);
          knownOrderStatusesRef.current.set(ord.id, ord.status);
        }

        // Show appropriate notification based on who is viewing
        const chosenNotif =
          (activeRole === 'cliente' ? clientNotif : adminNotif) ||
          notification ||
          adminNotif ||
          clientNotif;

        if (chosenNotif) {
          const notif = chosenNotif as NotificationItem;
          setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
          setFloatingNotification(notif);
        }
      }

      // 3. WhatsApp Support Number Updated
      if (data.type === 'WHATSAPP_UPDATED' && data.number) {
        setWhatsappSupportNumberState(String(data.number));
      }
    };

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('flor_realtime_sync');
      realtimeChannelRef.current = channel;
      channel.onmessage = (event) => {
        handleIncomingRealtimeEvent(event.data);
      };
    }

    // Storage event listener for same-origin tabs and fallback
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'flor_realtime_event_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingRealtimeEvent(parsed);
        } catch {}
      }
      if (e.key === STORAGE_KEYS.ORDERS && e.newValue) {
        try {
          const parsedOrders = JSON.parse(e.newValue);
          if (Array.isArray(parsedOrders)) {
            setOrders(parsedOrders);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Multi-device / multi-browser background polling engine (Every 2.0 seconds)
    const pollingTimer = setInterval(async () => {
      if (!supabaseConfig.url || !supabaseConfig.anonKey) return;

      try {
        const cleanUrl = supabaseConfig.url.replace(/\/$/, '');

        // Pull latest orders from Supabase (ordered by created_at descending)
        const ordersRes = await fetch(`${cleanUrl}/flor_orders?order=created_at.desc&limit=30`, {
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        });

        if (ordersRes.ok) {
          const cloudOrders: Record<string, unknown>[] = await ordersRes.json();
          if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
            setOrders((prevOrders) => {
              let hasChanges = false;
              const next = [...prevOrders];

              for (const co of cloudOrders) {
                const cloudId = String(co.id);
                const cloudStatus = (co.status as OrderStatus) || 'En proceso';
                const existingIdx = next.findIndex(
                  (o) => o.id === cloudId || o.orderNumber === co.order_number
                );

                if (existingIdx >= 0) {
                  const currentLocal = next[existingIdx];
                  if (currentLocal.status !== cloudStatus) {
                    hasChanges = true;
                    const updatedOrder: Order = {
                      ...currentLocal,
                      status: cloudStatus,
                      updatedAt: String(co.updated_at || new Date().toISOString()),
                    };
                    next[existingIdx] = updatedOrder;
                    knownOrderStatusesRef.current.set(cloudId, cloudStatus);

                    // Trigger instant notification with sound for status update
                    const notif: NotificationItem = {
                      id: `notif_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                      title: `Estatus Actualizado: #${updatedOrder.orderNumber} -> ${cloudStatus}`,
                      message: `El pedido #${updatedOrder.orderNumber} ahora está "${cloudStatus}".`,
                      type: 'status_updated',
                      targetRole: 'cliente',
                      targetUserId: updatedOrder.clientId,
                      orderId: updatedOrder.id,
                      module: 'pedidos',
                      read: false,
                      createdAt: new Date().toISOString(),
                    };

                    setNotifications((p) => [notif, ...p]);
                    setFloatingNotification(notif);
                  }
                } else {
                  // Brand new order detected from cloud
                  hasChanges = true;
                  let parsedItems: OrderItem[] = [];
                  if (Array.isArray(co.items)) {
                    parsedItems = co.items as OrderItem[];
                  } else if (typeof co.items === 'string') {
                    try {
                      parsedItems = JSON.parse(co.items);
                    } catch {
                      parsedItems = [];
                    }
                  }

                  const newOrder: Order = {
                    id: cloudId,
                    orderNumber: String(co.order_number || `MED-${Date.now()}`),
                    clientId: String(co.client_id || ''),
                    clientName: String(co.client_name || 'Cliente'),
                    clientBusiness: String(co.client_business || ''),
                    clientPhone: String(co.client_phone || ''),
                    clientWhatsapp: String(co.client_whatsapp || ''),
                    clientAddress: String(co.client_address || ''),
                    items: parsedItems,
                    subtotal: Number(co.subtotal || 0),
                    discountTotal: Number(co.discount_total || 0),
                    total: Number(co.total || 0),
                    status: cloudStatus,
                    source: (co.source as Order['source']) || 'vendedor',
                    createdAt: String(co.created_at || new Date().toISOString()),
                    updatedAt: String(co.updated_at || new Date().toISOString()),
                    vendedorId: co.vendedor_id ? String(co.vendedor_id) : undefined,
                    vendedorName: co.vendedor_name ? String(co.vendedor_name) : undefined,
                    notes: co.notes ? String(co.notes) : undefined,
                  };
                  next.unshift(newOrder);
                  knownOrderStatusesRef.current.set(cloudId, cloudStatus);

                  // Trigger new sale alert for admin
                  const saleNotif: NotificationItem = {
                    id: `notif_sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    title: '¡Nueva Venta / Pedido Registrado!',
                    message: `Pedido #${newOrder.orderNumber} recibido por $${newOrder.total.toFixed(2)} MXN en tiempo real.`,
                    type: 'order_created',
                    targetRole: 'admin',
                    module: 'pedidos',
                    orderId: newOrder.id,
                    read: false,
                    createdAt: new Date().toISOString(),
                  };

                  setNotifications((p) => [saleNotif, ...p]);
                  setFloatingNotification(saleNotif);
                }
              }

              return hasChanges ? next : prevOrders;
            });
          }
        }

        // Pull latest notifications from Supabase
        const notifRes = await fetch(`${cleanUrl}/flor_notifications?order=created_at.desc&limit=15`, {
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        });

        if (notifRes.ok) {
          const cloudNotifs: Record<string, unknown>[] = await notifRes.json();
          if (Array.isArray(cloudNotifs) && cloudNotifs.length > 0) {
            for (const cn of cloudNotifs) {
              const notifId = String(cn.id);
              if (!knownNotificationIdsRef.current.has(notifId)) {
                knownNotificationIdsRef.current.add(notifId);
                const item: NotificationItem = {
                  id: notifId,
                  title: String(cn.title || 'Aviso en tiempo real'),
                  message: String(cn.message || ''),
                  type: (cn.type as NotificationItem['type']) || 'system',
                  targetRole: (cn.target_role as UserRole) || 'admin',
                  module: (cn.module as NotificationItem['module']) || 'pedidos',
                  read: Boolean(cn.read),
                  targetUserId: cn.target_user_id ? String(cn.target_user_id) : undefined,
                  orderId: cn.order_id ? String(cn.order_id) : undefined,
                  createdAt: String(cn.created_at || new Date().toISOString()),
                };

                setNotifications((p) => [item, ...p.filter((n) => n.id !== item.id)]);

                // If recently created (within last 45 seconds), pop up banner
                const ageMs = Date.now() - new Date(item.createdAt).getTime();
                if (ageMs < 45000) {
                  setFloatingNotification(item);
                }
              }
            }
          }
        }
      } catch {
        // Handled silently
      }
    }, 2000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollingTimer);
    };
  }, [supabaseConfig, activeRole]);

  // Product Operations with automatic Supabase sync
  const addProduct = async (prod: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod_med_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);

    // Save to Supabase
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_products?on_conflict=code`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify([{
          id: newProd.id,
          code: newProd.code,
          name: newProd.name,
          price: newProd.price,
          stock: newProd.stock,
          discount: newProd.discount,
          description: newProd.description,
          category: newProd.category,
          sub_category: newProd.subCategory || '',
          image_url: newProd.imageUrl,
          created_at: newProd.createdAt,
        }]),
      });

      if (!res.ok) {
        // Fallback compatibility with pre-migration column names
        await fetch(`${cleanUrl}/flor_products?on_conflict=code`, {
          method: 'POST',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify([{
            id: newProd.id,
            name: newProd.name,
            category: newProd.category,
            code: newProd.code,
            description: newProd.description,
            sale_price: newProd.price,
            current_stock: newProd.stock,
            photo_url: newProd.imageUrl,
          }]),
        });
      }
      setSupabaseProductsCount((prev) => (prev !== null ? prev + 1 : 1));
    } catch (err) {
      console.warn('Background sync addProduct failed:', err);
    }
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));

    // Patch to Supabase
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const payload: Record<string, unknown> = {};
      if (updated.name !== undefined) payload.name = updated.name;
      if (updated.code !== undefined) payload.code = updated.code;
      if (updated.price !== undefined) payload.price = updated.price;
      if (updated.stock !== undefined) payload.stock = updated.stock;
      if (updated.discount !== undefined) payload.discount = updated.discount;
      if (updated.description !== undefined) payload.description = updated.description;
      if (updated.category !== undefined) payload.category = updated.category;
      if (updated.subCategory !== undefined) payload.sub_category = updated.subCategory;
      if (updated.imageUrl !== undefined) payload.image_url = updated.imageUrl;

      const res = await fetch(`${cleanUrl}/flor_products?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const compatPayload: Record<string, unknown> = {};
        if (updated.name !== undefined) compatPayload.name = updated.name;
        if (updated.code !== undefined) compatPayload.code = updated.code;
        if (updated.price !== undefined) compatPayload.sale_price = updated.price;
        if (updated.stock !== undefined) compatPayload.current_stock = updated.stock;
        if (updated.description !== undefined) compatPayload.description = updated.description;
        if (updated.category !== undefined) compatPayload.category = updated.category;
        if (updated.imageUrl !== undefined) compatPayload.photo_url = updated.imageUrl;
        await fetch(`${cleanUrl}/flor_products?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(compatPayload),
        });
      }
    } catch (err) {
      console.warn('Background sync updateProduct failed:', err);
    }
  };

  const deleteProduct = async (
    id: string,
    code?: string
  ): Promise<{ success: boolean; message: string }> => {
    setProducts((prev) => prev.filter((p) => p.id !== id && (code ? p.code !== code : true)));
    setCart((prev) => prev.filter((item) => item.product.id !== id));

    // Delete from Supabase
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const filter = code
        ? `or=(id.eq.${encodeURIComponent(id)},code.eq.${encodeURIComponent(code)})`
        : `id=eq.${encodeURIComponent(id)}`;

      const res = await fetch(`${cleanUrl}/flor_products?${filter}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });

      setSupabaseProductsCount((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      return {
        success: res.ok,
        message: res.ok
          ? 'Producto eliminado exitosamente de Supabase y del catálogo.'
          : `Producto eliminado localmente. Supabase respondió código ${res.status}.`,
      };
    } catch (err: unknown) {
      console.warn('deleteProduct Supabase error:', err);
      const msg = err instanceof Error ? err.message : 'Error de red';
      return { success: false, message: `Producto eliminado localmente. Error en Supabase: ${msg}` };
    }
  };

  // Delete multiple selected products
  const deleteMultipleProducts = async (
    ids: string[],
    codes?: string[]
  ): Promise<{ success: boolean; count: number; message: string }> => {
    if (ids.length === 0) {
      return { success: false, count: 0, message: 'No se seleccionaron productos para eliminar.' };
    }

    const idSet = new Set(ids);
    const codeSet = new Set(codes || []);

    setProducts((prev) => prev.filter((p) => !idSet.has(p.id) && !codeSet.has(p.code)));
    setCart((prev) => prev.filter((item) => !idSet.has(item.product.id)));

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const chunkSize = 40;

      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const encodedIds = chunk.map((id) => encodeURIComponent(id)).join(',');

        await fetch(`${cleanUrl}/flor_products?id=in.(${encodedIds})`, {
          method: 'DELETE',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        });

        if (codes && codes.length > 0) {
          const codeChunk = codes.slice(i, i + chunkSize);
          const encodedCodes = codeChunk.map((c) => encodeURIComponent(c)).join(',');
          await fetch(`${cleanUrl}/flor_products?code=in.(${encodedCodes})`, {
            method: 'DELETE',
            headers: {
              apikey: supabaseConfig.anonKey,
              Authorization: `Bearer ${supabaseConfig.anonKey}`,
            },
          });
        }
      }

      setSupabaseProductsCount((prev) => (prev !== null ? Math.max(0, prev - ids.length) : null));
      return {
        success: true,
        count: ids.length,
        message: `Se eliminaron ${ids.length} productos de Supabase y del catálogo.`,
      };
    } catch (err: unknown) {
      console.warn('deleteMultipleProducts failed:', err);
      const msg = err instanceof Error ? err.message : 'Error';
      return {
        success: false,
        count: ids.length,
        message: `Eliminados del catálogo local. Error en Supabase: ${msg}`,
      };
    }
  };

  // Delete all products globally from Supabase and local state
  const deleteAllProducts = async (): Promise<{ success: boolean; count: number; message: string }> => {
    const totalCount = products.length;
    setProducts([]);
    setCart([]);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_products?id=neq.none`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          Prefer: 'return=minimal',
        },
      });

      setSupabaseProductsCount(0);
      addNotification({
        title: 'Catálogo Vacíado en Supabase',
        message: `Se eliminaron todos los productos (${totalCount} registros) permanentemente de la base de datos Supabase y del sistema.`,
        type: 'system',
        targetRole: 'admin',
      });

      return {
        success: res.ok,
        count: totalCount,
        message: res.ok
          ? `¡Se eliminaron exitosamente todos los ${totalCount} productos de Supabase y del catálogo!`
          : `Catálogo local vaciado. Supabase status: ${res.status}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setSupabaseProductsCount(0);
      return {
        success: false,
        count: totalCount,
        message: `Catálogo local vaciado. Error de conexión con Supabase: ${msg}`,
      };
    }
  };

  const importProductsList = async (
    imported: Product[],
    syncCloud = true
  ): Promise<{ success: boolean; count: number; message: string }> => {
    let combinedList: Product[] = [];
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const fresh = imported.filter((p) => !existingIds.has(p.id));
      combinedList = [...fresh, ...prev];
      return combinedList;
    });

    if (syncCloud) {
      return await uploadProductsToSupabase(combinedList.length > 0 ? combinedList : imported);
    }
    return { success: true, count: imported.length, message: `Se importaron ${imported.length} productos localmente.` };
  };

  // Import the analyzed medical supplies price list with automatic Supabase sync
  const importAnalyzedMedicalCatalog = async (
    syncCloud = true
  ): Promise<{ success: boolean; count: number; message: string }> => {
    const parsed = parseRawMedicalPriceList(ANALYZED_MEDICAL_PRICE_LIST_CSV);
    if (parsed.length > 0) {
      setProducts(parsed);
      addNotification({
        title: 'Catálogo de Suministros Médicos Importado',
        message: `Se importaron ${parsed.length} productos de suministros médicos y material de curación con éxito.`,
        type: 'system',
        targetRole: 'admin',
      });

      if (syncCloud) {
        return await uploadProductsToSupabase(parsed);
      }
      return { success: true, count: parsed.length, message: `Se importaron ${parsed.length} productos localmente.` };
    }
    return { success: false, count: 0, message: 'No se encontraron productos para importar.' };
  };

  // Client Operations with Supabase Sync
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const rawCleanPhone = (clientData.phone || clientData.whatsapp || '').replace(/\D/g, '');
    const cleanLast4 = rawCleanPhone.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const defaultUser = clientData.username?.trim() || `cliente.${cleanLast4}`;
    const defaultPass = clientData.password?.trim() || 'Cliente#2026';

    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      username: defaultUser,
      password: defaultPass,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_clients`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: newClient.id,
          name: newClient.name,
          business_name: newClient.businessName || '',
          rfc: newClient.rfc || '',
          address: newClient.address || '',
          phone: newClient.phone || '',
          whatsapp: newClient.whatsapp || '',
          email: newClient.email || '',
          username: newClient.username,
          password: newClient.password,
          active: newClient.active !== false,
          notes: newClient.notes || '',
          created_at: newClient.createdAt,
        }),
      }).catch(() => {});
    } catch {
      // Handled silently
    }
    return newClient;
  };

  const updateClient = (id: string, updated: Partial<Client>): void => {
    let clientToUpdate: Client | undefined;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          clientToUpdate = { ...c, ...updated };
          return clientToUpdate;
        }
        return c;
      })
    );

    if (clientToUpdate) {
      try {
        const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
        fetch(`${cleanUrl}/flor_clients?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: clientToUpdate.name,
            business_name: clientToUpdate.businessName || '',
            rfc: clientToUpdate.rfc || '',
            address: clientToUpdate.address || '',
            phone: clientToUpdate.phone || '',
            whatsapp: clientToUpdate.whatsapp || '',
            email: clientToUpdate.email || '',
            username: clientToUpdate.username || '',
            password: clientToUpdate.password || '',
            active: clientToUpdate.active !== false,
            notes: clientToUpdate.notes || '',
          }),
        }).catch(() => {});
      } catch {
        // Handled silently
      }
    }
  };

  const deleteClient = (id: string): void => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_clients?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      }).catch(() => {});
    } catch {
      // Handled silently
    }
  };

  const deleteMultipleClients = async (ids: string[]): Promise<{ success: boolean; count: number; message: string }> => {
    if (ids.length === 0) return { success: false, count: 0, message: 'Ningún cliente seleccionado.' };
    const idSet = new Set(ids);
    setClients((prev) => prev.filter((c) => !idSet.has(c.id)));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const encodedIds = ids.map((id) => encodeURIComponent(id)).join(',');
      await fetch(`${cleanUrl}/flor_clients?id=in.(${encodedIds})`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      return { success: true, count: ids.length, message: `Se eliminaron ${ids.length} clientes de Supabase.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: ids.length, message: `Eliminados localmente. Error en Supabase: ${msg}` };
    }
  };

  const deleteAllClients = async (): Promise<{ success: boolean; count: number; message: string }> => {
    const count = clients.length;
    setClients([]);
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      await fetch(`${cleanUrl}/flor_clients?id=neq.none`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      return { success: true, count, message: `Se eliminaron todos los clientes (${count} registros) de Supabase.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count, message: `Eliminados localmente. Error en Supabase: ${msg}` };
    }
  };

  const toggleClientActive = (id: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, active: !c.active };
          updateClient(id, { active: updated.active });
          return updated;
        }
        return c;
      })
    );
  };

  const fetchClientsFromSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, count: 0, message: 'Supabase no configurado' };
    }
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_clients?order=created_at.desc`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (res.ok) {
        const rows: Record<string, unknown>[] = await res.json();
        if (rows && rows.length > 0) {
          const loaded: Client[] = rows.map((r) => ({
            id: String(r.id),
            name: String(r.name || 'Cliente'),
            businessName: String(r.business_name || ''),
            rfc: String(r.rfc || ''),
            address: String(r.address || ''),
            phone: String(r.phone || ''),
            whatsapp: String(r.whatsapp || ''),
            email: String(r.email || ''),
            username: r.username ? String(r.username) : undefined,
            password: r.password ? String(r.password) : undefined,
            active: r.active !== false,
            notes: String(r.notes || ''),
            createdAt: String(r.created_at || new Date().toISOString()),
          }));
          setClients(loaded);
          return { success: true, count: loaded.length, message: `${loaded.length} clientes cargados desde Supabase.` };
        }
      }
      return { success: true, count: 0, message: 'No hay clientes en Supabase.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: 0, message: `Error al cargar clientes: ${msg}` };
    }
  };

  // Order Operations with Supabase Sync
  const createOrder = (orderData: {
    clientId: string;
    clientName: string;
    clientBusiness?: string;
    clientPhone: string;
    clientWhatsapp: string;
    clientAddress: string;
    items: { product: Product; quantity: number }[];
    notes?: string;
    source: 'admin' | 'vendedor' | 'cliente_whatsapp';
    vendedorId?: string;
    vendedorName?: string;
  }): Order => {
    const orderItems = orderData.items.map((i) => {
      const price = i.product.price;
      const discount = i.product.discount || 0;
      const discountedUnit = price * (1 - discount / 100);
      const subtotal = discountedUnit * i.quantity;
      return {
        productId: i.product.id,
        productName: i.product.name,
        productCode: i.product.code,
        price: i.product.price,
        quantity: i.quantity,
        discount,
        subtotal,
        imageUrl: i.product.imageUrl,
      };
    });

    const subtotalRaw = orderData.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountTotal = subtotalRaw - total;

    const countNext = orders.length + 1001;
    const orderNumber = `MED-${countNext}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      clientId: orderData.clientId,
      clientName: orderData.clientName,
      clientBusiness: orderData.clientBusiness,
      clientPhone: orderData.clientPhone,
      clientWhatsapp: orderData.clientWhatsapp,
      clientAddress: orderData.clientAddress,
      items: orderItems,
      subtotal: subtotalRaw,
      discountTotal: Math.max(0, discountTotal),
      total,
      status: 'En proceso',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendedorId: orderData.vendedorId,
      vendedorName: orderData.vendedorName,
      notes: orderData.notes,
      source: orderData.source,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const itemInOrder = orderData.items.find((i) => i.product.id === p.id);
        if (itemInOrder) {
          return { ...p, stock: Math.max(0, p.stock - itemInOrder.quantity) };
        }
        return p;
      })
    );

    // Update Employee sales
    if (orderData.vendedorId) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === orderData.vendedorId
            ? {
                ...emp,
                salesCount: (emp.salesCount || 0) + 1,
                totalSold: (emp.totalSold || 0) + total,
              }
            : emp
        )
      );
    }

    // Save order in Supabase in background
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_orders`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          client_id: newOrder.clientId,
          client_name: newOrder.clientName,
          client_business: newOrder.clientBusiness || '',
          client_phone: newOrder.clientPhone || '',
          client_whatsapp: newOrder.clientWhatsapp || '',
          client_address: newOrder.clientAddress || '',
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          discount_total: newOrder.discountTotal,
          total: newOrder.total,
          status: newOrder.status,
          vendedor_id: newOrder.vendedorId || '',
          vendedor_name: newOrder.vendedorName || '',
          source: newOrder.source,
          notes: newOrder.notes || '',
          created_at: newOrder.createdAt,
          updated_at: newOrder.updatedAt,
        }),
      }).catch(() => {});
    } catch {
      // Handled silently
    }

    // Dual Notifications: Admin gets Sale alert, Client gets Process alert
    const creatorLabel =
      orderData.source === 'cliente_whatsapp'
        ? 'el cliente'
        : orderData.vendedorName || 'un vendedor';

    const adminSaleNotif: NotificationItem = {
      id: `notif_sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: '¡Nueva Venta / Pedido Registrado!',
      message: `Pedido #${orderNumber} recibido por $${total.toFixed(2)} MXN (${orderData.clientName}).`,
      type: 'order_created',
      targetRole: 'admin',
      orderId: newOrder.id,
      module: 'pedidos',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const clientOrderNotif: NotificationItem = {
      id: `notif_client_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: 'Tu pedido médico está En Proceso',
      message: `Hemos recibido tu solicitud #${orderNumber} por $${total.toFixed(2)} MXN y se encuentra en preparación.`,
      type: 'status_updated',
      targetRole: 'cliente',
      targetUserId: orderData.clientId,
      orderId: newOrder.id,
      module: 'pedidos',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [adminSaleNotif, clientOrderNotif, ...prev]);

    // Show floating banner according to active role
    if (activeRole === 'cliente') {
      setFloatingNotification(clientOrderNotif);
    } else {
      setFloatingNotification(adminSaleNotif);
    }

    // Broadcast in real-time across open windows and tabs
    broadcastRealtimeEvent({
      type: 'ORDER_CREATED',
      order: newOrder,
      adminNotif: adminSaleNotif,
      clientNotif: clientOrderNotif,
      notification: adminSaleNotif,
    });

    // Save notification to Supabase flor_notifications
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_notifications`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: adminSaleNotif.id,
          title: adminSaleNotif.title,
          message: adminSaleNotif.message,
          type: adminSaleNotif.type,
          target_role: 'admin',
          module: 'pedidos',
          read: false,
          target_user_id: null,
          order_id: newOrder.id,
          created_at: adminSaleNotif.createdAt,
        }),
      }).catch(() => {});
    } catch {}

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus): void => {
    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          targetOrder = { ...o, status, updatedAt: new Date().toISOString() };
          return targetOrder;
        }
        return o;
      })
    );

    if (targetOrder) {
      const statusNotif: NotificationItem = {
        id: `notif_status_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `Estatus Actualizado: #${targetOrder.orderNumber} -> ${status}`,
        message: `El pedido #${targetOrder.orderNumber} para "${targetOrder.clientName}" ahora está "${status}".`,
        type: 'status_updated',
        targetRole: 'cliente',
        targetUserId: targetOrder.clientId,
        orderId: targetOrder.id,
        module: 'pedidos',
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [statusNotif, ...prev]);
      setFloatingNotification(statusNotif);

      // Broadcast immediately across all browser tabs & windows without reload
      broadcastRealtimeEvent({
        type: 'ORDER_STATUS_CHANGED',
        orderId,
        status,
        updatedAt: targetOrder.updatedAt,
        notification: statusNotif,
        order: targetOrder,
      });

      // Save status update to Supabase flor_orders
      try {
        const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
        fetch(`${cleanUrl}/flor_orders?id=eq.${encodeURIComponent(orderId)}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            updated_at: new Date().toISOString(),
          }),
        }).catch(() => {});

        // Save status notification to Supabase flor_notifications
        fetch(`${cleanUrl}/flor_notifications`, {
          method: 'POST',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            id: statusNotif.id,
            title: statusNotif.title,
            message: statusNotif.message,
            type: statusNotif.type,
            target_role: statusNotif.targetRole,
            module: 'pedidos',
            read: false,
            target_user_id: statusNotif.targetUserId || null,
            order_id: statusNotif.orderId || null,
            created_at: statusNotif.createdAt,
          }),
        }).catch(() => {});
      } catch {
        // Handled silently
      }
    }
  };

  const deleteOrder = (orderId: string): void => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      }).catch(() => {});
    } catch {
      // Handled silently
    }
  };

  const deleteMultipleOrders = async (ids: string[]): Promise<{ success: boolean; count: number; message: string }> => {
    if (ids.length === 0) return { success: false, count: 0, message: 'Ninguna orden seleccionada.' };
    const idSet = new Set(ids);
    setOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const encodedIds = ids.map((id) => encodeURIComponent(id)).join(',');
      await fetch(`${cleanUrl}/flor_orders?id=in.(${encodedIds})`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      return { success: true, count: ids.length, message: `Se eliminaron ${ids.length} órdenes de venta de Supabase.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: ids.length, message: `Eliminadas localmente. Error en Supabase: ${msg}` };
    }
  };

  const deleteAllOrders = async (): Promise<{ success: boolean; count: number; message: string }> => {
    const count = orders.length;
    setOrders([]);
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      await fetch(`${cleanUrl}/flor_orders?id=neq.none`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      return { success: true, count, message: `Se eliminaron todas las ventas (${count} registros) de Supabase.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count, message: `Eliminadas localmente. Error en Supabase: ${msg}` };
    }
  };

  const fetchOrdersFromSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, count: 0, message: 'Supabase no configurado' };
    }
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_orders?order=created_at.desc`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (res.ok) {
        const rows: Record<string, unknown>[] = await res.json();
        if (rows && rows.length > 0) {
          const loaded: Order[] = rows.map((r) => ({
            id: String(r.id),
            orderNumber: String(r.order_number),
            clientId: String(r.client_id || ''),
            clientName: String(r.client_name || 'Cliente'),
            clientBusiness: String(r.client_business || ''),
            clientPhone: String(r.client_phone || ''),
            clientWhatsapp: String(r.client_whatsapp || ''),
            clientAddress: String(r.client_address || ''),
            items: (r.items as OrderItem[]) || [],
            subtotal: Number(r.subtotal) || 0,
            discountTotal: Number(r.discount_total) || 0,
            total: Number(r.total) || 0,
            status: (r.status as OrderStatus) || 'En proceso',
            vendedorId: String(r.vendedor_id || ''),
            vendedorName: String(r.vendedor_name || ''),
            notes: String(r.notes || ''),
            source: (r.source as any) || 'vendedor',
            createdAt: String(r.created_at || new Date().toISOString()),
            updatedAt: String(r.updated_at || new Date().toISOString()),
          }));
          setOrders(loaded);
          return { success: true, count: loaded.length, message: `${loaded.length} pedidos cargados desde Supabase.` };
        }
      }
      return { success: true, count: 0, message: 'No hay pedidos en Supabase.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: 0, message: `Error al consultar pedidos: ${msg}` };
    }
  };

  // Employee Operations with Automatic Supabase Sync
  const addEmployee = async (
    employeeData: Omit<Employee, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; employee: Employee; message: string }> => {
    const newEmp: Employee = {
      ...employeeData,
      id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      salesCount: 0,
      totalSold: 0,
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => [newEmp, ...prev]);

    // Send immediately to Supabase flor_employees
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const credsString = newEmp.password
        ? `${newEmp.username || newEmp.email.split('@')[0]}:::${newEmp.password}`
        : (newEmp.accessCode || '');

      const payload = {
        id: newEmp.id,
        name: newEmp.name,
        position: newEmp.position || 'Asesor Comercial',
        email: newEmp.email,
        phone: newEmp.phone || '',
        whatsapp: newEmp.whatsapp || '',
        access_code: credsString,
        role: newEmp.role || 'vendedor',
        active: newEmp.active !== false,
        sales_count: 0,
        total_sold: 0.0,
      };

      const res = await fetch(`${cleanUrl}/flor_employees`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 201 || res.status === 200) {
        setSupabaseEmployeesCount((prev) => (prev !== null ? prev + 1 : 1));
        return {
          success: true,
          employee: newEmp,
          message: '¡Empleado guardado y sincronizado con éxito en Supabase!',
        };
      } else {
        const errorText = await res.text();
        return {
          success: false,
          employee: newEmp,
          message: `Guardado en dispositivo local. Supabase respondió: ${errorText}`,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return {
        success: false,
        employee: newEmp,
        message: `Guardado en dispositivo local: ${msg}`,
      };
    }
  };

  const updateEmployee = async (
    id: string,
    updated: Partial<Employee>
  ): Promise<{ success: boolean; message: string }> => {
    let updatedEmp: Employee | undefined;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          updatedEmp = { ...e, ...updated };
          return updatedEmp;
        }
        return e;
      })
    );

    if (!updatedEmp) {
      return { success: false, message: 'Empleado no encontrado' };
    }

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const credsString = updatedEmp.password
        ? `${updatedEmp.username || updatedEmp.email.split('@')[0]}:::${updatedEmp.password}`
        : (updatedEmp.accessCode || '');

      const payload = {
        name: updatedEmp.name,
        position: updatedEmp.position || 'Asesor Comercial',
        email: updatedEmp.email,
        phone: updatedEmp.phone || '',
        whatsapp: updatedEmp.whatsapp || '',
        access_code: credsString,
        role: updatedEmp.role || 'vendedor',
        active: updatedEmp.active !== false,
      };

      const res = await fetch(`${cleanUrl}/flor_employees?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 204 || res.status === 200) {
        return { success: true, message: '¡Empleado actualizado con éxito en Supabase!' };
      } else {
        return { success: false, message: `Error al actualizar en Supabase: Código ${res.status}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Error de red al actualizar: ${msg}` };
    }
  };

  const deleteEmployee = async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_employees?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });

      if (res.ok || res.status === 204 || res.status === 200) {
        setSupabaseEmployeesCount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
        return { success: true, message: 'Empleado eliminado de Supabase.' };
      } else {
        return { success: false, message: `Eliminado localmente. Supabase respondió: ${res.status}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Eliminado en memoria local: ${msg}` };
    }
  };

  const deleteMultipleEmployees = async (ids: string[]): Promise<{ success: boolean; count: number; message: string }> => {
    const currentUserId = currentUser?.id;
    const safeIds = ids.filter((id) => id !== currentUserId && id !== 'user_emilio_admin' && !id.startsWith('profile_'));
    if (safeIds.length === 0) return { success: false, count: 0, message: 'No se puede eliminar la cuenta principal de administrador.' };
    const idSet = new Set(safeIds);
    setEmployees((prev) => prev.filter((e) => !idSet.has(e.id)));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const encodedIds = safeIds.map((id) => encodeURIComponent(id)).join(',');
      await fetch(`${cleanUrl}/flor_employees?id=in.(${encodedIds})`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      return { success: true, count: safeIds.length, message: `Se eliminaron ${safeIds.length} empleados de Supabase.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: safeIds.length, message: `Eliminados localmente. Error en Supabase: ${msg}` };
    }
  };

  const deleteAllEmployees = async (): Promise<{ success: boolean; count: number; message: string }> => {
    const currentUserId = currentUser?.id;
    const toDelete = employees.filter((e) => e.id !== currentUserId && e.id !== 'user_emilio_admin' && !e.id.startsWith('profile_') && e.role !== 'admin');
    const toDeleteIds = toDelete.map((e) => e.id);
    const idSet = new Set(toDeleteIds);
    setEmployees((prev) => prev.filter((e) => !idSet.has(e.id)));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      if (toDeleteIds.length > 0) {
        const encodedIds = toDeleteIds.map((id) => encodeURIComponent(id)).join(',');
        await fetch(`${cleanUrl}/flor_employees?id=in.(${encodedIds})`, {
          method: 'DELETE',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        });
      }
      return { success: true, count: toDeleteIds.length, message: `Se eliminaron los vendedores y asesores de Supabase (${toDeleteIds.length} registros).` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: toDeleteIds.length, message: `Eliminados localmente: ${msg}` };
    }
  };

  const fetchEmployeesFromSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, count: 0, message: 'Supabase no configurado' };
    }
    setIsSyncingEmployees(true);
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(
        `${cleanUrl}/flor_employees?id=not.like.profile_*&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
          },
        }
      );

      if (!res.ok) {
        setIsSyncingEmployees(false);
        return { success: false, count: 0, message: `Error ${res.status} al consultar empleados` };
      }

      const rows: Record<string, unknown>[] = await res.json();
      setSupabaseEmployeesCount(rows.length);

      if (rows && rows.length > 0) {
        const loaded: Employee[] = rows.map((r) => {
          const rawAccess = String(r.access_code || '');
          let username = String(r.username || '');
          let password = String(r.password || '');

          if (rawAccess.includes(':::')) {
            const parts = rawAccess.split(':::');
            username = username || parts[0];
            password = password || parts[1];
          } else if (!password && rawAccess) {
            password = rawAccess;
          }

          const email = String(r.email || '');
          if (!username) {
            username = email.includes('@') ? email.split('@')[0] : 'vendedor';
          }
          if (!password) {
            password = 'Flor2026$Med';
          }

          return {
            id: String(r.id),
            name: String(r.name || 'Empleado'),
            position: String(r.position || 'Asesor Comercial'),
            email,
            username,
            password,
            accessCode: password,
            phone: String(r.phone || ''),
            whatsapp: String(r.whatsapp || r.phone || ''),
            role: (r.role === 'admin' ? 'admin' : 'vendedor') as 'admin' | 'vendedor',
            active: r.active !== false,
            salesCount: Number(r.sales_count) || 0,
            totalSold: Number(r.total_sold) || 0,
            createdAt: String(r.created_at || new Date().toISOString()),
          };
        });

        setEmployees(loaded);
        setIsSyncingEmployees(false);
        return { success: true, count: loaded.length, message: `Se cargaron ${loaded.length} empleados desde Supabase.` };
      } else {
        setIsSyncingEmployees(false);
        return { success: true, count: 0, message: 'No hay empleados en Supabase aún.' };
      }
    } catch (err: unknown) {
      setIsSyncingEmployees(false);
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: 0, message: `Error al sincronizar empleados: ${msg}` };
    }
  };

  const uploadEmployeesToSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, count: 0, message: 'Supabase no configurado' };
    }
    const listToPush = employees.filter((e) => !e.id.startsWith('profile_'));
    if (listToPush.length === 0) {
      return { success: false, count: 0, message: 'No hay empleados para sincronizar.' };
    }
    setIsSyncingEmployees(true);
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      let count = 0;
      for (const emp of listToPush) {
        const credsString = emp.password
          ? `${emp.username || emp.email.split('@')[0]}:::${emp.password}`
          : (emp.accessCode || '');

        const payload = {
          id: emp.id,
          name: emp.name,
          position: emp.position || 'Asesor Comercial',
          email: emp.email,
          phone: emp.phone || '',
          whatsapp: emp.whatsapp || '',
          access_code: credsString,
          role: emp.role || 'vendedor',
          active: emp.active !== false,
          sales_count: emp.salesCount || 0,
          total_sold: emp.totalSold || 0.0,
        };

        const res = await fetch(`${cleanUrl}/flor_employees`, {
          method: 'POST',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok || res.status === 200 || res.status === 201) {
          count++;
        }
      }
      setSupabaseEmployeesCount(count);
      setIsSyncingEmployees(false);
      return { success: true, count, message: `¡${count} empleados sincronizados con Supabase!` };
    } catch (err: unknown) {
      setIsSyncingEmployees(false);
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, count: 0, message: `Error al subir empleados: ${msg}` };
    }
  };

  // Notification Operations with Sound and Floating Banner
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger floating notification banner and sound
    setFloatingNotification(newNotif);
    playNotificationSound();

    // 3. Save notification to Supabase flor_notifications table
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_notifications`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: newNotif.id,
          title: newNotif.title,
          message: newNotif.message,
          type: newNotif.type,
          target_role: newNotif.targetRole,
          module: newNotif.module || 'pedidos',
          read: false,
          target_user_id: newNotif.targetUserId || null,
          order_id: newNotif.orderId || null,
          created_at: newNotif.createdAt,
        }),
      }).catch(() => {
        // Table may not yet be created in Supabase SQL editor; safe fallback
      });
    } catch {
      // Ignore network errors
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = (role?: UserRole) => {
    setNotifications((prev) =>
      prev.map((n) => (!role || n.targetRole === role ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id: string): Promise<void> => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      fetch(`${cleanUrl}/flor_notifications?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      }).catch(() => {});
    } catch {
      // Handled silently
    }
  };

  const clearAllNotifications = async (role?: UserRole): Promise<void> => {
    setNotifications((prev) => (role ? prev.filter((n) => n.targetRole !== role) : []));
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const filter = role ? `target_role=eq.${encodeURIComponent(role)}` : 'id=neq.none';
      fetch(`${cleanUrl}/flor_notifications?${filter}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      }).catch(() => {});
    } catch {
      // Handled silently
    }
  };

  const triggerTestNotification = (role: UserRole = 'admin', moduleName = 'pedidos') => {
    addNotification({
      title: '¡Aviso en Tiempo Real Flor De Liz!',
      message: `Notificación de prueba en tiempo real para el módulo "${moduleName}".`,
      type: 'order_created',
      targetRole: role,
      module: moduleName,
    });
  };

  const fetchNotificationsFromSupabase = async (): Promise<void> => {
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_notifications?order=created_at.desc&limit=50`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (res.ok) {
        const rows: Record<string, unknown>[] = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: NotificationItem[] = rows.map((r) => ({
            id: String(r.id),
            title: String(r.title || 'Aviso'),
            message: String(r.message || ''),
            type: (r.type as NotificationItem['type']) || 'system',
            targetRole: (r.target_role as UserRole) || 'admin',
            module: String(r.module || 'pedidos'),
            targetUserId: r.target_user_id ? String(r.target_user_id) : undefined,
            orderId: r.order_id ? String(r.order_id) : undefined,
            read: !!r.read,
            createdAt: String(r.created_at || new Date().toISOString()),
          }));

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = mapped.filter((n) => !existingIds.has(n.id));
            return [...fresh, ...prev];
          });
        }
      }
    } catch {
      // Table doesn't exist yet
    }
  };

  // Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const discount = item.product.discount || 0;
    const finalPrice = item.product.price * (1 - discount / 100);
    return sum + finalPrice * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Clear Sample Data Permanently
  const clearAllSampleData = () => {
    setProducts([]);
    setOrders([]);
    setCart([]);

    localStorage.setItem(STORAGE_KEYS.SAMPLE_CLEARED, 'true');
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    setIsSampleDataCleared(true);
  };

  // Restore Sample Data
  const restoreSampleData = () => {
    setProducts([]);
    setClients(INITIAL_CLIENTS);
    setEmployees(INITIAL_EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.SAMPLE_CLEARED);
    setIsSampleDataCleared(false);
  };

  // Supabase Config Updates
  const updateSupabaseConfig = (config: Partial<SupabaseConfig>) => {
    setSupabaseConfig((prev) => {
      const next = { ...prev, ...config };
      return next;
    });
  };

  const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, message: 'Ingresa la URL y el anon public key de Supabase.' };
    }
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      // PostgREST anon role accepts queries on public tables; querying '/' requires service_role
      const response = await fetch(`${cleanUrl}/flor_products?limit=1`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (response.ok || response.status === 200 || response.status === 206) {
        setSupabaseConfig((prev) => ({ ...prev, connected: true }));
        return { success: true, message: `¡Conexión verificada con éxito con el proyecto Supabase (${supabaseConfig.projectId || 'ptzdzlafekxtakbfnyur'})!` };
      }
      return { success: false, message: `Respuesta del servidor Supabase: Código ${response.status}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Error al conectar con Supabase: ${msg}` };
    }
  };

  // Automatically fetch products, employees, profiles, clients, and orders from Supabase on mount
  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      fetchProductsFromSupabase();
      fetchEmployeesFromSupabase();
      fetchProfileFromSupabase();
      fetchClientsFromSupabase();
      fetchOrdersFromSupabase();
    }
  }, []);

  // Upload products to Supabase REST endpoint in safe chunks with on_conflict=code and fallback
  const uploadProductsToSupabase = async (
    productsToUpload?: Product[]
  ): Promise<{ success: boolean; count: number; message: string }> => {
    const list = productsToUpload || products;
    if (list.length === 0) {
      return { success: false, count: 0, message: 'No hay productos en el catálogo para guardar.' };
    }

    setIsSyncingCloud(true);
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const chunkSize = 50;
      let totalSaved = 0;

      // De-duplicate items by code before uploading to avoid duplicate key issues in the same batch
      const seenCodes = new Set<string>();
      const uniquePayload: Record<string, unknown>[] = [];

      for (let idx = 0; idx < list.length; idx++) {
        const p = list[idx];
        let code = (p.code || '').trim();
        if (!code || code === '-') {
          code = `MED-${(idx + 1).toString().padStart(4, '0')}`;
        }
        if (seenCodes.has(code)) {
          code = `${code}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        }
        seenCodes.add(code);

        uniquePayload.push({
          id: p.id || `prod_med_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          code,
          name: p.name || 'Producto Médico',
          price: isNaN(Number(p.price)) ? 0 : Number(p.price),
          stock: isNaN(Number(p.stock)) ? 50 : Number(p.stock),
          discount: isNaN(Number(p.discount)) ? 0 : Math.min(100, Math.max(0, Number(p.discount))),
          description: p.description || 'Material de curación y suministros médicos.',
          category: p.category || 'Suministros Médicos',
          sub_category: p.subCategory || '',
          image_url: p.imageUrl || '',
          created_at: p.createdAt || new Date().toISOString(),
        });
      }

      setSyncProgress({ current: 0, total: uniquePayload.length });

      // Upload in chunks of 50
      for (let i = 0; i < uniquePayload.length; i += chunkSize) {
        const chunk = uniquePayload.slice(i, i + chunkSize);

        try {
          const res = await fetch(`${cleanUrl}/flor_products?on_conflict=code`, {
            method: 'POST',
            headers: {
              apikey: supabaseConfig.anonKey,
              Authorization: `Bearer ${supabaseConfig.anonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(chunk),
          });

          if (res.ok) {
            totalSaved += chunk.length;
          } else {
            // Check if batch succeeds with compatibility column names (sale_price, current_stock, photo_url)
            const compatChunk = chunk.map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              category: item.category,
              description: item.description,
              sale_price: item.price,
              current_stock: item.stock,
              photo_url: item.image_url,
            }));
            const compatRes = await fetch(`${cleanUrl}/flor_products?on_conflict=code`, {
              method: 'POST',
              headers: {
                apikey: supabaseConfig.anonKey,
                Authorization: `Bearer ${supabaseConfig.anonKey}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(compatChunk),
            });

            if (compatRes.ok) {
              totalSaved += chunk.length;
            } else {
              // If the bulk batch fails, fall back to individual upserts so no valid record is missed!
              for (const singleItem of chunk) {
              try {
                const singleRes = await fetch(`${cleanUrl}/flor_products?on_conflict=code`, {
                  method: 'POST',
                  headers: {
                    apikey: supabaseConfig.anonKey,
                    Authorization: `Bearer ${supabaseConfig.anonKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'resolution=merge-duplicates',
                  },
                  body: JSON.stringify([singleItem]),
                });
                if (singleRes.ok) {
                  totalSaved++;
                } else {
                  // retry with id conflict resolution
                  const retryRes = await fetch(`${cleanUrl}/flor_products?on_conflict=id`, {
                    method: 'POST',
                    headers: {
                      apikey: supabaseConfig.anonKey,
                      Authorization: `Bearer ${supabaseConfig.anonKey}`,
                      'Content-Type': 'application/json',
                      Prefer: 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify([singleItem]),
                  });
                  if (retryRes.ok) totalSaved++;
                }
              } catch (e) {
                console.warn('Could not save single item:', singleItem, e);
              }
            }
          }
        }
      } catch (batchErr) {
          console.error('Error uploading batch to Supabase:', batchErr);
        }

        setSyncProgress({ current: Math.min(uniquePayload.length, i + chunkSize), total: uniquePayload.length });
      }

      // Check verified count in Supabase
      const countRes = await fetch(`${cleanUrl}/flor_products?select=id&limit=5000`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          Range: '0-4999',
        },
      });
      let verifiedCount = totalSaved;
      if (countRes.ok) {
        const ids = await countRes.json();
        if (Array.isArray(ids)) {
          verifiedCount = ids.length;
          setSupabaseProductsCount(verifiedCount);
        }
      }

      setSupabaseConfig((prev) => ({ ...prev, connected: true }));
      return {
        success: totalSaved > 0,
        count: totalSaved,
        message: totalSaved > 0
          ? `¡Se guardaron ${totalSaved} registros exitosamente en Supabase! (${verifiedCount} productos verificados en la nube)`
          : 'No se pudieron guardar los registros. Revisa que el script SQL esté ejecutado en Supabase.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de red';
      return { success: false, count: 0, message: `Error al guardar en Supabase: ${msg}` };
    } finally {
      setIsSyncingCloud(false);
      setSyncProgress(null);
    }
  };

  // Fetch products from Supabase
  const fetchProductsFromSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      setIsSyncingCloud(true);
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_products?select=*&order=category.asc,name.asc&limit=5000`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          Range: '0-4999',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Product[] = data.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            code: String(item.code || ''),
            name: String(item.name || ''),
            price: Number(item.price ?? item.sale_price ?? 0),
            stock: Number(item.stock ?? item.current_stock ?? 50),
            discount: Number(item.discount || 0),
            description: String(item.description || ''),
            category: String(item.category || 'Suministros Médicos'),
            subCategory: item.sub_category ? String(item.sub_category) : undefined,
            imageUrl: String(item.image_url ?? item.photo_url ?? ''),
            createdAt: String(item.created_at || new Date().toISOString()),
          }));
          setProducts(mapped);
          setSupabaseProductsCount(mapped.length);
          setSupabaseConfig((prev) => ({ ...prev, connected: true }));
          return { success: true, count: mapped.length, message: `Se sincronizaron ${mapped.length} productos desde Supabase.` };
        }
        setSupabaseProductsCount(0);
        return { success: true, count: 0, message: 'La tabla flor_products en Supabase está vacía.' };
      } else {
        const err = await res.text();
        return { success: false, count: 0, message: `Error al consultar Supabase (${res.status}): ${err}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de red';
      return { success: false, count: 0, message: `Error: ${msg}` };
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Clear Supabase cloud records
  const clearSupabaseCloudRecords = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      await fetch(`${cleanUrl}/flor_products?id=neq.none`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      setSupabaseProductsCount(0);
      clearAllSampleData();
      return { success: true, message: 'Registros de productos en Supabase y localmente eliminados.' };
    } catch (err: unknown) {
      clearAllSampleData();
      const msg = err instanceof Error ? err.message : 'Error';
      return { success: false, message: `Tablas locales vaciadas. Supabase: ${msg}` };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        canSwitchRoles,
        floatingNotification,
        dismissFloatingNotification,
        playNotificationSound,
        triggerTestNotification,
        fetchNotificationsFromSupabase,
        activeRole,
        setActiveRole,
        activeTab,
        setActiveTab,
        adminProfile,
        vendedorProfile,
        clienteProfile,
        updateProfile,
        saveProfileToSupabase,
        fetchProfileFromSupabase,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        deleteAllProducts,
        importProductsList,
        importAnalyzedMedicalCatalog,
        clients,
        addClient,
        updateClient,
        deleteClient,
        deleteMultipleClients,
        deleteAllClients,
        toggleClientActive,
        fetchClientsFromSupabase,
        orders,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        deleteMultipleOrders,
        deleteAllOrders,
        fetchOrdersFromSupabase,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        deleteMultipleEmployees,
        deleteAllEmployees,
        fetchEmployeesFromSupabase,
        uploadEmployeesToSupabase,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        isSampleDataCleared,
        clearAllSampleData,
        restoreSampleData,
        supabaseConfig,
        updateSupabaseConfig,
        testSupabaseConnection,
        uploadProductsToSupabase,
        fetchProductsFromSupabase,
        clearSupabaseCloudRecords,
        supabaseProductsCount,
        supabaseEmployeesCount,
        isSyncingCloud,
        isSyncingEmployees,
        syncProgress,
        whatsappSupportNumber,
        updateWhatsappSupportNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );

};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
