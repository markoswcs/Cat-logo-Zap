import React, { useState, useEffect } from 'react';
import { INITIAL_USERS, INITIAL_STORES, INITIAL_PRODUCTS, MOCK_ORDERS, SUBSCRIPTION_PLANS } from './constants';
import { Store, Product, User, Order, KiwifySettings, SubscriptionPlan } from './types';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { StoreFront } from './components/StoreFront';

type ViewState = 'storefront' | 'login' | 'admin' | 'seller';

const App: React.FC = () => {
  // --- MOCK DATABASE STATE ---
  const [users] = useState<User[]>(INITIAL_USERS);
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  
  // Admin Settings
  const [kiwifySettings, setKiwifySettings] = useState<KiwifySettings>({
    isEnabled: false,
    accessToken: '',
    webhookSecret: '',
    productId: ''
  });

  // --- SESSION STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('storefront');
  const [activeStoreId, setActiveStoreId] = useState<string>(INITIAL_STORES[0].id);

  // --- THEME STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // --- ACTIONS (DB OPERATIONS) ---

  const handleLogin = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentView('admin');
      } else if (user.role === 'seller' && user.storeId) {
        setActiveStoreId(user.storeId);
        setCurrentView('seller');
      }
    } else {
      alert('Usuário não encontrado!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('storefront');
    setActiveStoreId(INITIAL_STORES[0].id);
  };

  const handleUpdateStore = (storeId: string, updates: Partial<Store>) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, ...updates } : s));
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: Date.now().toString(), isDeleted: false };
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isDeleted: true } : p));
  };

  const handleRestoreProduct = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isDeleted: false } : p));
  };

  const handleUpdatePlans = (updatedPlans: SubscriptionPlan[]) => {
    setPlans(updatedPlans);
  };

  // --- INTEGRATION ACTIONS ---

  const handleSimulateKiwifyPayment = (email: string) => {
    // Logic: Find user by email, find their store, extend subscription by 30 days
    const user = users.find(u => u.email === email && u.role === 'seller');
    
    if (!user || !user.storeId) {
      alert(`Erro: Não foi encontrada nenhuma loja associada ao email ${email}`);
      return;
    }

    const store = stores.find(s => s.id === user.storeId);
    if (!store) {
      alert('Erro: Loja não encontrada.');
      return;
    }

    // Calculate new expiry date
    const currentExpiry = store.subscriptionExpiry ? new Date(store.subscriptionExpiry) : new Date();
    // If expired, start from today, else add to existing
    const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    baseDate.setDate(baseDate.getDate() + 30);

    handleUpdateStore(store.id, { 
      plan: 'pro', // Auto upgrade to pro/paid
      subscriptionExpiry: baseDate.toISOString(),
      subscriptionPaymentStatus: 'paid' // Simulating a real payment
    });

    alert(`Sucesso! Pagamento Webhook Simulado.\nA loja "${store.name}" foi renovada até ${baseDate.toLocaleDateString()}.`);
  };

  const handleStoreSubscriptionAction = (storeId: string, action: 'extend_pending' | 'mark_paid') => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    if (action === 'extend_pending') {
      // Extend 30 days BUT keep as Pending Payment
      const currentExpiry = store.subscriptionExpiry ? new Date(store.subscriptionExpiry) : new Date();
      const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
      baseDate.setDate(baseDate.getDate() + 30);

      handleUpdateStore(storeId, {
        subscriptionExpiry: baseDate.toISOString(),
        subscriptionPaymentStatus: 'pending',
        plan: 'pro' // Ensure they have features enabled
      });
      alert('Assinatura estendida por 30 dias com pagamento pendente.');
    } else if (action === 'mark_paid') {
      // Just mark as paid
      handleUpdateStore(storeId, {
        subscriptionPaymentStatus: 'paid'
      });
      alert('Pagamento marcado como confirmado manualmente.');
    }
  };

  // --- RENDER LOGIC ---

  const activeStore = stores.find(s => s.id === activeStoreId);
  const allStoreProducts = products.filter(p => p.storeId === activeStoreId);
  const visibleStoreProducts = allStoreProducts.filter(p => !p.isDeleted);
  const storeOrders = orders.filter(o => o.storeId === activeStoreId);

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onBack={() => setCurrentView('storefront')} />;
  }

  if (currentView === 'admin' && currentUser?.role === 'admin') {
    return (
      <AdminDashboard 
        user={currentUser}
        stores={stores}
        plans={plans}
        onUpdatePlans={handleUpdatePlans}
        onSelectStore={(storeId) => {
          setActiveStoreId(storeId);
          setCurrentView('seller');
        }}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        kiwifySettings={kiwifySettings}
        onUpdateKiwifySettings={setKiwifySettings}
        onSimulatePayment={handleSimulateKiwifyPayment}
        onStoreAction={handleStoreSubscriptionAction}
      />
    );
  }

  if (currentView === 'seller' && currentUser && activeStore) {
    const canAccess = currentUser.role === 'admin' || currentUser.storeId === activeStore.id;
    
    if (!canAccess) {
      return <div>Acesso negado.</div>;
    }

    return (
      <SellerDashboard 
        user={currentUser}
        store={activeStore}
        products={allStoreProducts}
        orders={storeOrders}
        plans={plans}
        onLogout={handleLogout}
        onUpdateStore={handleUpdateStore}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onRestoreProduct={handleRestoreProduct}
        onBackToAdmin={currentUser.role === 'admin' ? () => setCurrentView('admin') : undefined}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        kiwifySettings={kiwifySettings}
      />
    );
  }

  if (activeStore) {
    return (
      <StoreFront 
        store={activeStore} 
        products={visibleStoreProducts} 
        onGoToLogin={() => setCurrentView('login')} 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return <div>Carregando...</div>;
};

export default App;