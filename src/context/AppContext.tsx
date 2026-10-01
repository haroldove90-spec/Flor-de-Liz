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

  // Supabase Bridge Config
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  testSupabaseConnection: () => Promise<{ success: boolean; message: string }>;

  // Active view within current role
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const STORAGE_KEYS = {
  ACTIVE_ROLE: 'flor_active_role',
  ACTIVE_TAB: 'flor_active_tab',
  PRODUCTS: 'flor_products',
  CLIENTS: 'flor_clients',
  ORDERS: 'flor_orders',
  EMPLOYEES: 'flor_employees',
  NOTIFICATIONS: 'flor_notifications',
  SAMPLE_CLEARED: 'flor_sample_data_cleared',
  ADMIN_PROFILE: 'flor_admin_profile',
  VENDEDOR_PROFILE: 'flor_vendedor_profile',
  CLIENTE_PROFILE: 'flor_cliente_profile',
  SUPABASE_CONFIG: 'flor_supabase_config',
};

// INITIAL SAMPLE DATA
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    code: 'LIZ-001',
    name: 'Bouquet Imperial de Lirios Blancos',
    price: 480.0,
    stock: 35,
    discount: 10,
    description: 'Arreglo estelar con lirios orientales blancos premium, follaje eucalipto y cinta dorada.',
    category: 'Lirios',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    code: 'ROS-002',
    name: 'Caja Regalo 36 Rosas Selectas',
    price: 750.0,
    stock: 22,
    discount: 5,
    description: 'Caja redonda de terciopelo negro con 36 rosas rojas importadas de tallo largo.',
    category: 'Rosas',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    code: 'ARR-003',
    name: 'Centro de Mesa Catedral Floral',
    price: 920.0,
    stock: 14,
    discount: 15,
    description: 'Diseño para eventos de gala con orquídeas, hortensias y lirios en base de cristal ahumado.',
    category: 'Eventos',
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    code: 'TUL-004',
    name: 'Docena de Tulipanes Holandeses',
    price: 390.0,
    stock: 40,
    discount: 0,
    description: 'Tulipanes holandeses en tonos pasteles envoltura kraft ecológica de alta gama.',
    category: 'Tulipanes',
    imageUrl: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    code: 'ORQ-005',
    name: 'Orquídea Phalaenopsis Doble Vara',
    price: 650.0,
    stock: 18,
    discount: 8,
    description: 'Planta de orquídea viva en maceta artesanal dorada con sustrato nutritivo y fertilizante.',
    category: 'Orquídeas',
    imageUrl: 'https://images.unsplash.com/photo-1610996882200-9831969a8b13?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    code: 'GIR-006',
    name: 'Jarrón Rústico Girasoles de Sol',
    price: 360.0,
    stock: 25,
    discount: 0,
    description: '10 girasoles grandes con flores silvestres moradas y jarra de cerámica vidriada.',
    category: 'Girasoles',
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=700&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Mariana Garza Valdez',
    businessName: 'Boutique Eventos Gala',
    rfc: 'GAVM880415XYZ',
    address: 'Av. Paseo de las Palmas 450, Col. Lomas, CDMX',
    phone: '5512345678',
    whatsapp: '5512345678',
    email: 'contacto@eventosgala.com',
    active: true,
    notes: 'Cliente corporativo frecuente. Prefiere entregas matutinas antes de las 11:00 AM.',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    createdByVendedorId: 'emp_1',
  },
  {
    id: 'cli_2',
    name: 'Carlos Mendoza Ríos',
    businessName: 'Florería Santa Fe',
    rfc: 'MERC791022AAA',
    address: 'Calle Vasco de Quiroga 120, Cuajimalpa, CDMX',
    phone: '5523456789',
    whatsapp: '5523456789',
    email: 'carlos@floreriasantafe.mx',
    active: true,
    notes: 'Pedidos por volumen quincenales para reventa.',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    createdByVendedorId: 'emp_1',
  },
  {
    id: 'cli_3',
    name: 'Valeria Sotomayor',
    businessName: 'Hotel & Spa Bella Vista',
    rfc: 'SOVA920311BBB',
    address: 'Camino Real 88, Polanco, CDMX',
    phone: '5534567890',
    whatsapp: '5534567890',
    email: 'compras@hotelbellavista.mx',
    active: true,
    notes: 'Requiere factura siempre en el mismo día del pedido.',
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    createdByVendedorId: 'emp_2',
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_1',
    name: 'Rodrigo Morales Peña',
    position: 'Ejecutivo Comercial Senior',
    email: 'rodrigo.ventas@flordeliz.com',
    phone: '5545678901',
    whatsapp: '5545678901',
    accessCode: 'VEND-7890',
    role: 'vendedor',
    active: true,
    salesCount: 14,
    totalSold: 28450.0,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'emp_2',
    name: 'Sofía Navarro Cruz',
    position: 'Asesora de Ventas Mayoreo',
    email: 'sofia.navarro@flordeliz.com',
    phone: '5556789012',
    whatsapp: '5556789012',
    accessCode: 'VEND-4560',
    role: 'vendedor',
    active: true,
    salesCount: 9,
    totalSold: 18900.0,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'emp_3',
    name: 'Javier Castillo Silva',
    position: 'Coordinador de Logística y Ventas',
    email: 'javier.castillo@flordeliz.com',
    phone: '5567890123',
    whatsapp: '5567890123',
    accessCode: 'VEND-1234',
    role: 'vendedor',
    active: true,
    salesCount: 6,
    totalSold: 12350.0,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'FDL-1001',
    clientId: 'cli_1',
    clientName: 'Mariana Garza Valdez',
    clientBusiness: 'Boutique Eventos Gala',
    clientPhone: '5512345678',
    clientWhatsapp: '5512345678',
    clientAddress: 'Av. Paseo de las Palmas 450, Col. Lomas, CDMX',
    items: [
      {
        productId: 'prod_1',
        productName: 'Bouquet Imperial de Lirios Blancos',
        productCode: 'LIZ-001',
        price: 480.0,
        quantity: 4,
        discount: 10,
        subtotal: 1728.0,
      },
      {
        productId: 'prod_3',
        productName: 'Centro de Mesa Catedral Floral',
        productCode: 'ARR-003',
        price: 920.0,
        quantity: 2,
        discount: 15,
        subtotal: 1564.0,
      },
    ],
    subtotal: 3760.0,
    discountTotal: 468.0,
    total: 3292.0,
    status: 'Entregado',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    vendedorId: 'emp_1',
    vendedorName: 'Rodrigo Morales Peña',
    notes: 'Entregado a recepción del evento en tiempo y forma.',
    source: 'vendedor',
  },
  {
    id: 'ord_2',
    orderNumber: 'FDL-1002',
    clientId: 'cli_2',
    clientName: 'Carlos Mendoza Ríos',
    clientBusiness: 'Florería Santa Fe',
    clientPhone: '5523456789',
    clientWhatsapp: '5523456789',
    clientAddress: 'Calle Vasco de Quiroga 120, Cuajimalpa, CDMX',
    items: [
      {
        productId: 'prod_2',
        productName: 'Caja Regalo 36 Rosas Selectas',
        productCode: 'ROS-002',
        price: 750.0,
        quantity: 5,
        discount: 5,
        subtotal: 3562.5,
      },
    ],
    subtotal: 3750.0,
    discountTotal: 187.5,
    total: 3562.5,
    status: 'En ruta',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    vendedorId: 'emp_1',
    vendedorName: 'Rodrigo Morales Peña',
    notes: 'Chofer en ruta con camioneta climatizada.',
    source: 'vendedor',
  },
  {
    id: 'ord_3',
    orderNumber: 'FDL-1003',
    clientId: 'cli_3',
    clientName: 'Valeria Sotomayor',
    clientBusiness: 'Hotel & Spa Bella Vista',
    clientPhone: '5534567890',
    clientWhatsapp: '5534567890',
    clientAddress: 'Camino Real 88, Polanco, CDMX',
    items: [
      {
        productId: 'prod_5',
        productName: 'Orquídea Phalaenopsis Doble Vara',
        productCode: 'ORQ-005',
        price: 650.0,
        quantity: 3,
        discount: 8,
        subtotal: 1794.0,
      },
      {
        productId: 'prod_4',
        productName: 'Docena de Tulipanes Holandeses',
        productCode: 'TUL-004',
        price: 390.0,
        quantity: 2,
        discount: 0,
        subtotal: 780.0,
      },
    ],
    subtotal: 2730.0,
    discountTotal: 156.0,
    total: 2574.0,
    status: 'En preparación',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    vendedorId: 'emp_2',
    vendedorName: 'Sofía Navarro Cruz',
    notes: 'Flores frescas recién hidratadas.',
    source: 'vendedor',
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Nueva Venta Registrada',
    message: 'Rodrigo Morales registró el pedido #FDL-1002 para Florería Santa Fe por $3,562.50 MXN.',
    type: 'order_created',
    targetRole: 'admin',
    orderId: 'ord_2',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'notif_2',
    title: 'Pedido en Ruta',
    message: 'Tu pedido #FDL-1002 ya salió de bodega y va en ruta a tu dirección.',
    type: 'status_updated',
    targetRole: 'cliente',
    targetUserId: 'cli_2',
    orderId: 'ord_2',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'notif_3',
    title: 'Nuevo Pedido en Preparación',
    message: 'Pedido #FDL-1003 está en taller para montaje final.',
    type: 'order_created',
    targetRole: 'admin',
    orderId: 'ord_3',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user_admin_1',
  role: 'admin',
  name: 'Dirección Comercial Flor de Líz',
  businessName: 'Comercializadora Flor de Líz S.A. de C.V.',
  email: 'administracion@flordeliz.com',
  phone: '5512345678',
  whatsapp: '5512345678',
  address: 'Insurgentes Sur 1450, Ciudad de México',
  photoUrl: '',
};

const DEFAULT_VENDEDOR_PROFILE: UserProfile = {
  id: 'user_vendedor_1',
  role: 'vendedor',
  name: 'Rodrigo Morales Peña',
  businessName: 'Flor de Líz - División Ventas',
  email: 'rodrigo.ventas@flordeliz.com',
  phone: '5545678901',
  whatsapp: '5545678901',
  address: 'Sucursal Centro, Ciudad de México',
  photoUrl: '',
};

const DEFAULT_CLIENTE_PROFILE: UserProfile = {
  id: 'user_cliente_1',
  role: 'cliente',
  name: 'Mariana Garza Valdez',
  businessName: 'Boutique Eventos Gala',
  email: 'contacto@eventosgala.com',
  phone: '5512345678',
  whatsapp: '5512345678',
  address: 'Av. Paseo de las Palmas 450, Col. Lomas, CDMX',
  photoUrl: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if sample data was previously cleared
  const [isSampleDataCleared, setIsSampleDataCleared] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
  });

  // Active Role (null = Home Role Selector)
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
    return (saved as UserRole) || null;
  });

  // Active Tab
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'metricas';
  });

  const setActiveRole = (role: UserRole | null) => {
    setActiveRoleState(role);
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
      // Set appropriate initial tab
      if (role === 'admin') setActiveTabState('metricas');
      else if (role === 'vendedor') setActiveTabState('metricas');
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

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) return JSON.parse(saved);
    if (localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true') return [];
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
    if (localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true') return [];
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
    if (localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true') return [];
    return INITIAL_NOTIFICATIONS;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Supabase Config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    return saved ? JSON.parse(saved) : { url: '', anonKey: '', connected: false };
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
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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
    const orderNumber = `FDL-${countNext}`;

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

    // Deduct stock from products
    setProducts((prev) =>
      prev.map((p) => {
        const itemInOrder = orderData.items.find((i) => i.product.id === p.id);
        if (itemInOrder) {
          return { ...p, stock: Math.max(0, p.stock - itemInOrder.quantity) };
        }
        return p;
      })
    );

    // Update Employee sales if from a vendedor
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

    // Create Notification for Admin
    const creatorLabel = orderData.source === 'cliente_whatsapp' ? 'el cliente' : orderData.vendedorName || 'un vendedor';
    addNotification({
      title: '¡Nuevo Pedido Recibido!',
      message: `Nuevo pedido #${orderNumber} registrado por ${creatorLabel} para "${orderData.clientName}". Total: $${total.toFixed(2)} MXN. Requiere seguimiento.`,
      type: 'order_created',
      targetRole: 'admin',
      orderId: newOrder.id,
    });

    // Create Notification for Cliente
    addNotification({
      title: 'Tu pedido está En Proceso',
      message: `Hemos recibido tu pedido #${orderNumber} de Flor de Líz por $${total.toFixed(2)} MXN y se encuentra en proceso.`,
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
          // Notify client
          addNotification({
            title: `Estatus de Pedido #${o.orderNumber}: ${status}`,
            message: `Tu pedido #${o.orderNumber} ha cambiado a estatus: "${status}".`,
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
    // Empty all sample records
    setProducts([]);
    setClients([]);
    setOrders([]);
    setEmployees([]);
    setNotifications([]);
    setCart([]);

    // Set flag in localStorage so browser will NEVER reload sample data automatically
    localStorage.setItem(STORAGE_KEYS.SAMPLE_CLEARED, 'true');
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    setIsSampleDataCleared(true);
  };

  // Restore Sample Data
  const restoreSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setClients(INITIAL_CLIENTS);
    setOrders(INITIAL_ORDERS);
    setEmployees(INITIAL_EMPLOYEES);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SAMPLE_CLEARED);
    setIsSampleDataCleared(false);
  };

  // Supabase bridge helper
  const updateSupabaseConfig = (config: Partial<SupabaseConfig>) => {
    setSupabaseConfig((prev) => {
      const next = { ...prev, ...config };
      return next;
    });
  };

  const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      return { success: false, message: 'Ingresa la URL y el anon public key de tu proyecto de Supabase.' };
    }
    try {
      // Test REST ping to Supabase endpoint
      const cleanUrl = supabaseConfig.url.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
        },
      });
      if (response.ok || response.status === 200 || response.status === 404) {
        setSupabaseConfig((prev) => ({ ...prev, connected: true }));
        return { success: true, message: '¡Conexión establecida con Supabase exitosamente!' };
      }
      return { success: false, message: `Respuesta del servidor Supabase: Código ${response.status}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Error al conectar con Supabase: ${msg}` };
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
