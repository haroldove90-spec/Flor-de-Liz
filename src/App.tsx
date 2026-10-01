import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { BottomBar } from './components/BottomBar';
import { Sidebar } from './components/Sidebar';
import { CartModal } from './components/common/CartModal';
import { SupabaseSettingsModal } from './components/admin/SupabaseSettingsModal';
import { FloatingNotificationBanner } from './components/common/FloatingNotificationBanner';

// Admin Views
import { AdminMetrics } from './components/admin/AdminMetrics';
import { AdminCatalog } from './components/admin/AdminCatalog';
import { AdminSales } from './components/admin/AdminSales';
import { AdminEmployees } from './components/admin/AdminEmployees';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AdminProfile } from './components/admin/AdminProfile';

// Vendedor Views
import { VendedorMetrics } from './components/vendedor/VendedorMetrics';
import { VendedorCatalog } from './components/vendedor/VendedorCatalog';
import { VendedorClients } from './components/vendedor/VendedorClients';
import { VendedorOrders } from './components/vendedor/VendedorOrders';
import { VendedorNotifications } from './components/vendedor/VendedorNotifications';
import { VendedorProfile } from './components/vendedor/VendedorProfile';

// Cliente Views
import { ClienteCatalog } from './components/cliente/ClienteCatalog';
import { ClienteOrders } from './components/cliente/ClienteOrders';
import { ClienteNotifications } from './components/cliente/ClienteNotifications';
import { ClienteProfile } from './components/cliente/ClienteProfile';
import { ClienteRegister } from './components/cliente/ClienteRegister';

// Offline indicator hook
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeRole, activeTab, currentUser } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [showClienteRegisterFirst, setShowClienteRegisterFirst] = useState(false);

  const isOnline = useOnlineStatus();

  // Private system: require authentication before accessing any role view
  if (!currentUser || !activeRole) {
    return <LoginForm />;
  }

  // Render module based on role and activeTab
  const renderContent = () => {
    if (activeRole === 'admin') {
      switch (activeTab) {
        case 'metricas':
          return <AdminMetrics />;
        case 'catalogo':
          return <AdminCatalog />;
        case 'ventas':
          return <AdminSales />;
        case 'empleados':
          return <AdminEmployees />;
        case 'notificaciones':
          return <AdminNotifications />;
        case 'perfil':
          return <AdminProfile />;
        default:
          return <AdminMetrics />;
      }
    }

    if (activeRole === 'vendedor') {
      switch (activeTab) {
        case 'metricas':
          return <VendedorMetrics />;
        case 'catalogo':
          return <VendedorCatalog onOpenCart={() => setIsCartOpen(true)} />;
        case 'clientes':
          return <VendedorClients />;
        case 'pedidos':
          return <VendedorOrders />;
        case 'notificaciones':
          return <VendedorNotifications />;
        case 'perfil':
          return <VendedorProfile />;
        default:
          return <VendedorMetrics />;
      }
    }

    if (activeRole === 'cliente') {
      if (showClienteRegisterFirst) {
        return (
          <ClienteRegister
            onCompleted={() => setShowClienteRegisterFirst(false)}
          />
        );
      }

      switch (activeTab) {
        case 'catalogo':
          return <ClienteCatalog onOpenCart={() => setIsCartOpen(true)} />;
        case 'pedidos':
          return <ClienteOrders />;
        case 'notificaciones':
          return <ClienteNotifications />;
        case 'perfil':
          return <ClienteProfile />;
        default:
          return <ClienteCatalog onOpenCart={() => setIsCartOpen(true)} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-[#C9B368]/30 selection:text-[#1B1A18]">
      {/* Offline banner if disconnected */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Modo Sin Conexión — La aplicación sigue funcionando con los datos almacenados en caché.</span>
        </div>
      )}

      {/* Unified Institutional Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Menu */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        {/* Main Work Area - Sin pestañas repetitivas */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden pb-24 lg:pb-12">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomBar />

      {/* Shopping Cart & Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Supabase Bridge & Sample Data Clear Modal */}
      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Real-time Floating Notification Banner */}
      <FloatingNotificationBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
