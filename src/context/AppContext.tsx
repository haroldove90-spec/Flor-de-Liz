import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserRole,
  Product,
  Client,
  Order,
  Employee,
  NotificationItem,
  UserProfile,
  OrderStatus,
  SupabaseConfig,
} from '../types';
import { ANALYZED_MEDICAL_PRICE_LIST_CSV } from '../data/analyzedPriceList';
import { parseRawMedicalPriceList } from '../utils/excelImport';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  // Role & User
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
  adminProfile: UserProfile;
  vendedorProfile: UserProfile;
  clienteProfile: UserProfile;
  updateProfile: (role: UserRole, profile: Partial<UserProfile>) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  importProductsList: (imported: Product[]) => void;
  importAnalyzedMedicalCatalog: () => number;

  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  toggleClientActive: (id: string) => void;

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

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Employee;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (role?: UserRole) => void;

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

  // Active view within current role
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const STORAGE_KEYS = {
  ACTIVE_ROLE: 'flor_active_role',
  ACTIVE_TAB: 'flor_active_tab',
  PRODUCTS: 'flor_products_v2', // v2 to ensure old flower products are cleared
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
  url: 'https://ylzgfsvcibqsztarglja.supabase.co/rest/v1/',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemdmc3ZjaWJxc3p0YXJnbGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDU2NDksImV4cCI6MjEwNjM4MTY0OX0.020w8ie-1aNgSgGrdjza_Ty-UxWJuXU4NWmaaGx1R_o',
  connected: true,
  projectId: 'ylzgfsvcibqsztarglja',
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
    id: 'emp_1',
    name: 'Rodrigo Morales Peña',
    position: 'Asesor Comercial Médico Senior',
    email: 'rodrigo.ventas@flordeliz.com',
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
    message: 'Proyecto ylzgfsvcibqsztarglja configurado y listo para sincronizar catálogo de suministros médicos.',
    type: 'system',
    targetRole: 'admin',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user_admin_1',
  role: 'admin',
  name: 'Dirección Comercial Flor de Líz',
  businessName: 'Comercializadora Flor de Líz - Suministros Médicos y Material de Curación',
  email: 'flordeliz@appdesignsoftware.com',
  phone: '5512345678',
  whatsapp: '5512345678',
  address: 'Insurgentes Sur 1450, Ciudad de México',
  photoUrl: '',
};

const DEFAULT_VENDEDOR_PROFILE: UserProfile = {
  id: 'user_vendedor_1',
  role: 'vendedor',
  name: 'Rodrigo Morales Peña',
  businessName: 'Flor de Líz - División Suministros Médicos',
  email: 'rodrigo.ventas@flordeliz.com',
  phone: '5545678901',
  whatsapp: '5545678901',
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

  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
    return (saved as UserRole) || null;
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'metricas';
  });

  const setActiveRole = (role: UserRole | null) => {
    setActiveRoleState(role);
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
      if (role === 'admin') setActiveTabState('catalogo');
      else if (role === 'vendedor') setActiveTabState('catalogo');
      else if (role === 'cliente') setActiveTabState('catalogo');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
  };

  // Profiles
  const [adminProfile, setAdminProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_PROFILE;
  });

  const [vendedorProfile, setVendedorProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDEDOR_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_VENDEDOR_PROFILE;
  });

  const [clienteProfile, setClienteProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTE_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTE_PROFILE;
  });

  const updateProfile = (role: UserRole, update: Partial<UserProfile>) => {
    if (role === 'admin') {
      setAdminProfile((prev) => {
        const next = { ...prev, ...update };
        localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(next));
        return next;
      });
    } else if (role === 'vendedor') {
      setVendedorProfile((prev) => {
        const next = { ...prev, ...update };
        localStorage.setItem(STORAGE_KEYS.VENDEDOR_PROFILE, JSON.stringify(next));
        return next;
      });
    } else if (role === 'cliente') {
      setClienteProfile((prev) => {
        const next = { ...prev, ...update };
        localStorage.setItem(STORAGE_KEYS.CLIENTE_PROFILE, JSON.stringify(next));
        return next;
      });
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

  // Supabase Config initialized with user's project
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectId === 'ylzgfsvcibqsztarglja') return parsed;
      } catch {
        // use default
      }
    }
    return DEFAULT_SUPABASE_CONFIG;
  });

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

  // Product Operations
  const addProduct = (prod: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod_med_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const importProductsList = (imported: Product[]) => {
    setProducts((prev) => [...imported, ...prev]);
  };

  // Import the analyzed 300+ medical supplies price list with one click
  const importAnalyzedMedicalCatalog = (): number => {
    const parsed = parseRawMedicalPriceList(ANALYZED_MEDICAL_PRICE_LIST_CSV);
    if (parsed.length > 0) {
      setProducts(parsed);
      addNotification({
        title: 'Catálogo de Suministros Médicos Importado',
        message: `Se importaron ${parsed.length} productos de suministros médicos y material de curación con éxito.`,
        type: 'system',
        targetRole: 'admin',
      });
      return parsed.length;
    }
    return 0;
  };

  // Client Operations
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleClientActive = (id: string) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  // Order Operations
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

    // Update Employee
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

    // Notify Admin
    const creatorLabel = orderData.source === 'cliente_whatsapp' ? 'el cliente' : orderData.vendedorName || 'un vendedor';
    addNotification({
      title: '¡Nuevo Pedido de Material Médico!',
      message: `Pedido #${orderNumber} registrado por ${creatorLabel} para "${orderData.clientName}". Total: $${total.toFixed(2)} MXN. Dar seguimiento a empaque y surtido.`,
      type: 'order_created',
      targetRole: 'admin',
      orderId: newOrder.id,
    });

    // Notify Client
    addNotification({
      title: 'Tu pedido médico está En Proceso',
      message: `Hemos recibido tu solicitud #${orderNumber} por $${total.toFixed(2)} MXN y se encuentra en almacén para preparación de lote.`,
      type: 'status_updated',
      targetRole: 'cliente',
      targetUserId: orderData.clientId,
      orderId: newOrder.id,
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status, updatedAt: new Date().toISOString() };
          addNotification({
            title: `Estatus de Envío #${o.orderNumber}: ${status}`,
            message: `Tu pedido #${o.orderNumber} ha pasado a estatus "${status}".`,
            type: 'status_updated',
            targetRole: 'cliente',
            targetUserId: o.clientId,
            orderId: o.id,
          });
          return updated;
        }
        return o;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Employee Operations
  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...employeeData,
      id: `emp_${Date.now()}`,
      salesCount: 0,
      totalSold: 0,
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => [newEmp, ...prev]);
    return newEmp;
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // Notification Operations
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = (role?: UserRole) => {
    setNotifications((prev) =>
      prev.map((n) => (!role || n.targetRole === role ? { ...n, read: true } : n))
    );
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
      const response = await fetch(`${cleanUrl}/`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (response.ok || response.status === 200 || response.status === 404) {
        setSupabaseConfig((prev) => ({ ...prev, connected: true }));
        return { success: true, message: `¡Conexión verificada con éxito con el proyecto Supabase (${supabaseConfig.projectId || 'ylzgfsvcibqsztarglja'})!` };
      }
      return { success: false, message: `Respuesta del servidor Supabase: Código ${response.status}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Error al conectar con Supabase: ${msg}` };
    }
  };

  // Upload products to Supabase REST endpoint
  const uploadProductsToSupabase = async (productsToUpload?: Product[]): Promise<{ success: boolean; count: number; message: string }> => {
    const list = productsToUpload || products;
    if (list.length === 0) {
      return { success: false, count: 0, message: 'No hay productos en el catálogo local para subir.' };
    }

    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const payload = list.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        price: p.price,
        stock: p.stock,
        discount: p.discount,
        description: p.description,
        category: p.category,
        image_url: p.imageUrl,
        created_at: p.createdAt,
      }));

      const res = await fetch(`${cleanUrl}/flor_products`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 201) {
        return { success: true, count: list.length, message: `¡${list.length} productos subidos exitosamente a Supabase!` };
      } else {
        const errorText = await res.text();
        return { success: false, count: 0, message: `Supabase error (${res.status}): ${errorText}. Asegúrate de haber ejecutado el script SQL en Supabase para crear la tabla flor_products.` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de red';
      return { success: false, count: 0, message: `Error al subir productos: ${msg}` };
    }
  };

  // Fetch products from Supabase
  const fetchProductsFromSupabase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/flor_products?select=*`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Product[] = data.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            code: String(item.code || ''),
            name: String(item.name || ''),
            price: Number(item.price || 0),
            stock: Number(item.stock || 0),
            discount: Number(item.discount || 0),
            description: String(item.description || ''),
            category: String(item.category || 'General'),
            imageUrl: String(item.image_url || ''),
            createdAt: String(item.created_at || new Date().toISOString()),
          }));
          setProducts(mapped);
          return { success: true, count: mapped.length, message: `Se cargaron ${mapped.length} productos desde Supabase.` };
        }
        return { success: true, count: 0, message: 'La tabla flor_products en Supabase está vacía.' };
      } else {
        const err = await res.text();
        return { success: false, count: 0, message: `Error al consultar Supabase (${res.status}): ${err}` };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de red';
      return { success: false, count: 0, message: `Error: ${msg}` };
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
        activeRole,
        setActiveRole,
        activeTab,
        setActiveTab,
        adminProfile,
        vendedorProfile,
        clienteProfile,
        updateProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        importProductsList,
        importAnalyzedMedicalCatalog,
        clients,
        addClient,
        updateClient,
        deleteClient,
        toggleClientActive,
        orders,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
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
