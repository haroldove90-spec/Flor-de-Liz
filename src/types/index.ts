export type UserRole = 'admin' | 'vendedor' | 'cliente';

export type OrderStatus = 'En proceso' | 'En preparación' | 'En ruta' | 'Entregado' | 'Cancelado';

export interface Product {
  id: string;
  name: string;
  code: string; // SKU
  price: number;
  stock: number;
  discount: number; // percentage (0 - 100)
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  rfc?: string;
  address: string;
  phone: string;
  whatsapp: string;
  email?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  createdByVendedorId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientBusiness?: string;
  clientPhone: string;
  clientWhatsapp: string;
  clientAddress: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  vendedorId?: string;
  vendedorName?: string;
  notes?: string;
  source: 'admin' | 'vendedor' | 'cliente_whatsapp';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  whatsapp: string;
  accessCode: string;
  role: 'vendedor' | 'admin';
  active: boolean;
  createdAt: string;
  salesCount?: number;
  totalSold?: number;
}

export type NotificationModule =
  | 'pedidos'
  | 'catalogo'
  | 'ventas'
  | 'empleados'
  | 'clientes'
  | 'notificaciones'
  | 'sistema';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order_created' | 'status_updated' | 'stock_alert' | 'system';
  targetRole: 'admin' | 'vendedor' | 'cliente';
  module?: NotificationModule | string;
  targetUserId?: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'vendedor';
  isAdmin: boolean;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  businessName?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  photoUrl?: string;
  notes?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  projectId?: string;
  projectName?: string;
}

