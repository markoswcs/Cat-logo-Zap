import React, { useState, useMemo } from 'react';
import { Store, Product, User, Order, CustomerMetric, RFMSegment, SubscriptionPlan, KiwifySettings } from '../types';
import { formatCurrency } from '../utils';
import { PAYMENT_METHODS } from '../constants';
import { 
  Store as StoreIcon, 
  Package, 
  Tags, 
  LogOut, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft,
  AlertTriangle,
  X,
  AlertCircle,
  RefreshCcw,
  Image as ImageIcon,
  Upload,
  Moon,
  Sun,
  CreditCard,
  Check,
  Layout,
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MessageCircle,
  ExternalLink,
  Crown,
  Zap,
  QrCode,
  Loader2,
  ShieldCheck,
  Link as LinkIcon,
  Lock
} from 'lucide-react';

interface SellerDashboardProps {
  user: User;
  store: Store;
  products: Product[];
  orders: Order[];
  plans: SubscriptionPlan[];
  onLogout: () => void;
  onUpdateStore: (storeId: string, updates: Partial<Store>) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onRestoreProduct: (productId: string) => void;
  onBackToAdmin?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  kiwifySettings: KiwifySettings;
}

type Tab = 'overview' | 'config' | 'categories' | 'products' | 'trash' | 'subscription';
type Period = 'today' | 'week' | 'month' | 'year';

// --- RFM HELPER FUNCTIONS ---

const getRFMSegment = (recency: number, frequency: number, monetary: number): RFMSegment => {
  // Simplified Logic for Mock purposes
  // Recency Score (1-5): 5 is recent, 1 is old
  const rScore = recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 120 ? 2 : 1;
  
  // Frequency Score (1-5)
  const fScore = frequency >= 10 ? 5 : frequency >= 6 ? 4 : frequency >= 4 ? 3 : frequency >= 2 ? 2 : 1;

  // Average F+M Score approximation
  const fmScore = Math.ceil((fScore + (monetary > 1000 ? 5 : monetary > 500 ? 4 : monetary > 200 ? 3 : 2)) / 2);

  if (rScore >= 4 && fmScore >= 4) return 'Campeões';
  if (rScore >= 3 && fmScore >= 3) return 'Leais';
  if (rScore >= 4 && fmScore <= 2) return 'Novos';
  if (rScore <= 2 && fmScore >= 4) return 'Em Risco';
  if (rScore <= 2 && fmScore <= 2) return 'Perdidos';
  return 'Precisam de Atenção';
};

const RFM_COLORS: Record<RFMSegment, string> = {
  'Campeões': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'Leais': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Novos': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'Precisam de Atenção': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  'Em Risco': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'Perdidos': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const RFM_DESCRIPTIONS: Record<RFMSegment, string> = {
  'Campeões': 'Compram frequentemente e gastam muito. Mime-os!',
  'Leais': 'Compram com regularidade. Tente aumentar o ticket.',
  'Novos': 'Primeira compra recente. Crie relacionamento.',
  'Precisam de Atenção': 'Recência e frequência médias.',
  'Em Risco': 'Bons clientes que pararam de comprar. Reative-os!',
  'Perdidos': 'Não compram há muito tempo e gastaram pouco.',
};

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, 
  store, 
  products, 
  orders,
  plans,
  onLogout, 
  onUpdateStore,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestoreProduct,
  onBackToAdmin,
  isDarkMode,
  onToggleTheme,
  kiwifySettings
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // --- DASHBOARD STATE ---
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [selectedRFMSegment, setSelectedRFMSegment] = useState<RFMSegment | null>(null);

  // --- SUBSCRIPTION STATE ---
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // --- PLAN LIMITS LOGIC ---
  const currentPlan = plans.find(p => p.id === store.plan) || plans[0]; // Fallback to first if not found
  const productCount = products.filter(p => !p.isDeleted).length;
  const isProductLimitReached = productCount >= currentPlan.limits.maxProducts;

  // --- ANALYTICS LOGIC ---
  
  // 1. Filter Orders by Period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    if (selectedPeriod === 'today') start.setHours(0, 0, 0, 0);
    else if (selectedPeriod === 'week') start.setDate(now.getDate() - 7);
    else if (selectedPeriod === 'month') start.setMonth(now.getMonth() - 1);
    else if (selectedPeriod === 'year') start.setFullYear(now.getFullYear() - 1);

    return orders.filter(o => new Date(o.date) >= start);
  }, [orders, selectedPeriod]);

  // 2. Calculate KPIs
  const kpis = useMemo(() => {
    const totalSales = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = filteredOrders.length;
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

    // Top Products
    const productCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { totalSales, orderCount, avgTicket, topProducts };
  }, [filteredOrders]);

  // 3. Calculate RFM Matrix
  const rfmData = useMemo(() => {
    const customers: Record<string, CustomerMetric> = {};

    orders.forEach(order => {
      const phone = order.customerPhone;
      if (!customers[phone]) {
        customers[phone] = {
          phone,
          name: order.customerName,
          lastOrderDate: order.date,
          totalSpent: 0,
          orderCount: 0,
          recency: 0,
          frequency: 0,
          monetary: 0,
          segment: 'Novos' // Default
        };
      }
      
      const c = customers[phone];
      c.totalSpent += order.total;
      c.orderCount += 1;
      if (new Date(order.date) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = order.date;
      }
    });

    const now = new Date();
    
    return Object.values(customers).map(c => {
      const lastOrder = new Date(c.lastOrderDate);
      const diffTime = Math.abs(now.getTime() - lastOrder.getTime());
      c.recency = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      c.frequency = c.orderCount;
      c.monetary = c.totalSpent;
      c.segment = getRFMSegment(c.recency, c.frequency, c.monetary);
      return c;
    });
  }, [orders]);

  const rfmGroups = useMemo(() => {
    const groups: Record<RFMSegment, CustomerMetric[]> = {
      'Campeões': [],
      'Leais': [],
      'Precisam de Atenção': [],
      'Novos': [],
      'Em Risco': [],
      'Perdidos': []
    };
    rfmData.forEach(c => groups[c.segment].push(c));
    return groups;
  }, [rfmData]);

  // Store Config State
  const [storeName, setStoreName] = useState(store.name);
  const [storePhone, setStorePhone] = useState(store.phone);
  const [storeLogo, setStoreLogo] = useState(store.logo);
  const [storeBanner, setStoreBanner] = useState(store.banner || '');
  const [storePaymentMethods, setStorePaymentMethods] = useState<string[]>(store.acceptedPaymentMethods || PAYMENT_METHODS);

  // Category State
  const [newCategory, setNewCategory] = useState('');

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    description: ''
  });

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<{ type: 'product' | 'category', id: string, name: string } | null>(null);

  // Derived Lists
  const activeProducts = products.filter(p => !p.isDeleted);
  const deletedProducts = products.filter(p => p.isDeleted);
  const deletedCategories = store.deletedCategories || [];

  // --- SUBSCRIPTION HANDLERS ---

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === store.plan) return; // Already on this plan
    setSelectedPlanForUpgrade(plan);
    setPaymentMethod('credit_card'); // Default to CC for mock
  };

  const handleConfirmSubscription = () => {
    if (!selectedPlanForUpgrade) return;

    // Kiwify Logic Check
    if (kiwifySettings.isEnabled && kiwifySettings.productId) {
      // Redirect to Kiwify Checkout
      const checkoutUrl = `https://pay.kiwify.com.br/${kiwifySettings.productId}?email=${encodeURIComponent(user.email)}`;
      window.open(checkoutUrl, '_blank');
      // We don't close the modal immediately so they can see the message about approval,
      // but in a real app we might show a "Waiting for confirmation" state.
      alert('Você será redirecionado para a Kiwify para concluir o pagamento de forma segura.');
      return;
    }

    // Mock Logic (Fallback)
    setIsProcessingPayment(true);
    setTimeout(() => {
      onUpdateStore(store.id, { plan: selectedPlanForUpgrade.id });
      setIsProcessingPayment(false);
      setSelectedPlanForUpgrade(null);
      alert(`Parabéns! Seu plano foi alterado para ${selectedPlanForUpgrade.name} com sucesso.`);
    }, 2000);
  };

  // --- File Upload Handlers ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Actions ---

  const handleSaveStore = () => {
    if (storePaymentMethods.length === 0) {
      alert('Selecione pelo menos um método de pagamento.');
      return;
    }

    onUpdateStore(store.id, { 
      name: storeName, 
      phone: storePhone,
      logo: storeLogo,
      banner: storeBanner,
      acceptedPaymentMethods: storePaymentMethods
    });
    alert('Loja atualizada com sucesso!');
  };

  const togglePaymentMethod = (method: string) => {
    setStorePaymentMethods(prev => {
      if (prev.includes(method)) {
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      // Prevent duplicates
      if (store.categories.includes(newCategory.trim())) {
        alert('Esta categoria já existe!');
        return;
      }
      onUpdateStore(store.id, { categories: [...store.categories, newCategory.trim()] });
      setNewCategory('');
    }
  };

  const requestDeleteCategory = (cat: string) => {
    // Check if products use this category
    const productsInCat = activeProducts.filter(p => p.category === cat).length;
    const warning = productsInCat > 0 
      ? ` (Existem ${productsInCat} produtos ativos nesta categoria)` 
      : '';
    setItemToDelete({ type: 'category', id: cat, name: cat + warning });
  };

  const requestDeleteProduct = (product: Product) => {
    setItemToDelete({ type: 'product', id: product.id, name: product.name });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'category') {
      // Soft delete category: Move from categories to deletedCategories
      const catName = itemToDelete.id;
      const newCategories = store.categories.filter(c => c !== catName);
      const newDeletedCategories = [...(store.deletedCategories || []), catName];
      
      onUpdateStore(store.id, { 
        categories: newCategories,
        deletedCategories: newDeletedCategories
      });
    } else {
      onDeleteProduct(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const handleRestoreCategory = (catName: string) => {
    const newDeleted = deletedCategories.filter(c => c !== catName);
    const newActive = [...store.categories, catName];
    
    // Check duplication just in case
    if (store.categories.includes(catName)) {
      // If already exists (maybe re-created manually), just remove from trash
      onUpdateStore(store.id, { deletedCategories: newDeleted });
    } else {
      onUpdateStore(store.id, { 
        categories: newActive, 
        deletedCategories: newDeleted 
      });
    }
  };

  const openProductForm = (product?: Product) => {
    // Check Limit (Only for new products)
    if (!product && isProductLimitReached) {
        alert(`Você atingiu o limite de ${currentPlan.limits.maxProducts} produtos do seu plano. Faça upgrade para continuar cadastrando.`);
        setActiveTab('subscription');
        return;
    }

    if (store.categories.length === 0) {
      alert('Você precisa criar pelo menos uma categoria antes de adicionar produtos.');
      setActiveTab('categories');
      return;
    }

    if (product) {
      setIsEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        image: product.image,
        description: product.description || ''
      });
    } else {
      setIsAddingProduct(true);
      setProductForm({
        name: '',
        price: '',
        category: store.categories[0] || '',
        image: '', // Start empty for new product
        description: ''
      });
    }
  };

  const closeProductForm = () => {
    setIsEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fallback image if none selected
    const finalImage = productForm.image || `https://via.placeholder.com/400?text=${encodeURIComponent(productForm.name)}`;

    const productData = {
      storeId: store.id,
      name: productForm.name,
      price: parseFloat(productForm.price),
      category: productForm.category,
      image: finalImage,
      description: productForm.description
    };

    if (isEditingProduct) {
      onUpdateProduct(isEditingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    closeProductForm();
  };

  const isKiwifyEnabled = kiwifySettings.isEnabled && kiwifySettings.productId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.role === 'admin' && onBackToAdmin && (
              <button onClick={onBackToAdmin} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                {store.name} 
                {user.role === 'admin' && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-0.5 rounded">God Mode</span>}
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-medium uppercase">
                  {currentPlan.name}
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gerenciamento da Loja</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={onToggleTheme}
              className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <BarChart2 size={18} /> Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'products' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Package size={18} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'categories' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Tags size={18} /> Categorias
          </button>
           <button 
            onClick={() => setActiveTab('config')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'config' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <StoreIcon size={18} /> Configurações
          </button>
          <button 
            onClick={() => setActiveTab('subscription')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'subscription' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Crown size={18} /> Assinatura
          </button>
          <button 
            onClick={() => setActiveTab('trash')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'trash' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Trash2 size={18} /> Lixeira
            {(deletedProducts.length > 0 || deletedCategories.length > 0) && (
              <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded-full">
                {deletedProducts.length + deletedCategories.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        
        {/* DASHBOARD OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-600" /> Dashboard de Vendas
              </h2>
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedPeriod === p ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total de Vendas</span>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <DollarSign size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(kpis.totalSales)}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pedidos</span>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Package size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.orderCount}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ticket Médio</span>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <BarChart2 size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(kpis.avgTicket)}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Melhor Produto</span>
                   <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={kpis.topProducts[0]?.[0] || '-'}>
                  {kpis.topProducts[0]?.[0] || '-'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpis.topProducts[0]?.[1] || 0} vendidos</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Top Products List */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-1">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Produtos Mais Vendidos</h3>
                {kpis.topProducts.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Sem dados para o período.</p>
                ) : (
                  <div className="space-y-4">
                    {kpis.topProducts.map(([name, count], index) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-800'}`}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{count} un</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RFM Matrix */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <Users size={18} className="text-blue-500" />
                      Matriz RFV (Clientes)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clique em um grupo para ver a lista de clientes</p>
                  </div>
                  <a href="https://ajuda.zaxapp.com.br/o-que-e-metologodia-rfv" target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                     O que é isso? <ExternalLink size={10} />
                  </a>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(rfmGroups) as RFMSegment[]).map(segment => {
                    const count = rfmGroups[segment].length;
                    return (
                      <button
                        key={segment}
                        onClick={() => setSelectedRFMSegment(segment)}
                        className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${RFM_COLORS[segment]}`}
                      >
                        <h4 className="font-bold text-sm mb-1">{segment}</h4>
                        <p className="text-2xl font-bold mb-2">{count}</p>
                        <p className="text-[10px] opacity-80 leading-tight">
                          {RFM_DESCRIPTIONS[segment]}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
             <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="text-yellow-300" size={32} />
                    <h2 className="text-3xl font-bold">Gerenciar Assinatura</h2>
                  </div>
                  <p className="text-emerald-100 max-w-xl">
                    Seu plano atual é <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{currentPlan.name}</span>. 
                    Faça upgrade para desbloquear mais recursos e vender mais.
                  </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const isCurrent = store.plan === plan.id;
                  return (
                    <div 
                      key={plan.id} 
                      className={`
                        relative bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm p-6 flex flex-col transition-all duration-200
                        ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md'}
                        ${plan.recommended && !isCurrent ? 'border-blue-400 dark:border-blue-700' : ''}
                      `}
                    >
                      {plan.recommended && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          Recomendado
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                        <div className="mt-2 flex items-baseline">
                          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                          </span>
                          {plan.price > 0 && <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/mês</span>}
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        {/* Limits Display */}
                        <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 font-bold">
                            <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            Até {plan.limits.maxProducts > 9999 ? 'Infinitos' : plan.limits.maxProducts} produtos
                        </li>
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(plan)}
                        className={`
                          w-full py-3 rounded-xl font-bold transition-all
                          ${isCurrent 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 active:scale-[0.98]'
                          }
                        `}
                      >
                        {isCurrent ? 'Plano Atual' : 'Escolher Plano'}
                      </button>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Seus Produtos</h2>
                  <p className="text-xs text-gray-500">
                      Você está usando {productCount} de {currentPlan.limits.maxProducts > 9999 ? 'Infinitos' : currentPlan.limits.maxProducts} produtos do seu plano.
                  </p>
              </div>
              <button 
                onClick={() => openProductForm()}
                disabled={isProductLimitReached}
                className={`
                    px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm
                    ${isProductLimitReached 
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }
                `}
              >
                {isProductLimitReached ? <Lock size={18} /> : <Plus size={18} />}
                Novo Produto
              </button>
            </div>

            {activeProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum produto ativo</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Comece adicionando produtos ao seu catálogo para que seus clientes possam ver.</p>
                <button 
                  onClick={() => openProductForm()}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Adicionar primeiro produto
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Preço</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {activeProducts.map(product => {
                        // Check if category still exists
                        const categoryExists = store.categories.includes(product.category);
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {categoryExists ? (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-600">
                                  {product.category}
                                </span>
                              ) : (
                                <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-2.5 py-1 rounded text-xs font-medium border border-red-100 dark:border-red-800 flex items-center gap-1 w-fit" title="Esta categoria foi excluída">
                                  <AlertCircle size={12} /> {product.category}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openProductForm(product)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => requestDeleteProduct(product)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Categorias da Loja</h2>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                onClick={handleAddCategory}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {store.categories.map(cat => {
                 const productCount = activeProducts.filter(p => p.category === cat).length;
                 return (
                  <div key={cat} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 group">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-white">{cat}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{productCount} produtos</p>
                    </div>
                    <button 
                      onClick={() => requestDeleteCategory(cat)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
              {store.categories.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhuma categoria cadastrada.</p>
              )}
            </div>
          </div>
        )}

        {/* TRASH TAB */}
        {activeTab === 'trash' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-red-900 dark:text-red-200 text-sm">Itens Excluídos</h3>
                  <p className="text-red-700 dark:text-red-300 text-xs">Itens na lixeira não aparecem na loja. Restaure-os para voltar a vender.</p>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                {/* Deleted Products */}
                <div>
                   <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                     <Package size={18} /> Produtos Excluídos
                   </h3>
                   {deletedProducts.length === 0 ? (
                     <p className="text-sm text-gray-400 italic">Lixeira vazia.</p>
                   ) : (
                     <div className="space-y-2">
                       {deletedProducts.map(p => (
                         <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                            <button 
                              onClick={() => onRestoreProduct(p.id)}
                              className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
                            >
                              <RefreshCcw size={12} /> Restaurar
                            </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>

                {/* Deleted Categories */}
                <div>
                   <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                     <Tags size={18} /> Categorias Excluídas
                   </h3>
                   {deletedCategories.length === 0 ? (
                     <p className="text-sm text-gray-400 italic">Lixeira vazia.</p>
                   ) : (
                     <div className="space-y-2">
                       {deletedCategories.map(cat => (
                         <div key={cat} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat}</span>
                            <button 
                              onClick={() => handleRestoreCategory(cat)}
                              className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"
                            >
                              <RefreshCcw size={12} /> Restaurar
                            </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Configurações da Loja</h2>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
              
              {/* Logo & Banner Section */}
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo da Loja</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center group relative shadow-inner">
                      {storeLogo ? (
                        <img src={storeLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="text-gray-300 dark:text-gray-500" size={32} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all shadow-sm">
                          <Upload size={18} />
                          <span>Escolher Logo...</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="hidden" 
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">
                          Recomendado: Imagem quadrada (JPG ou PNG).
                        </p>
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className={!currentPlan.limits.canCustomizeBanner ? "opacity-60 relative pointer-events-none" : ""}>
                  {!currentPlan.limits.canCustomizeBanner && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                          <div className="bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                              <Lock size={16} /> Upgrade necessário
                          </div>
                      </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Promocional</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="banner-upload" 
                      accept="image/*" 
                      onChange={handleBannerUpload}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="banner-upload"
                      className={`
                        w-full h-32 md:h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative bg-gray-50 dark:bg-gray-700/50
                        ${storeBanner ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}
                      `}
                    >
                      {storeBanner ? (
                        <>
                          <img src={storeBanner} alt="Banner Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold flex items-center gap-2">
                              <Upload size={20} /> Trocar Banner
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-500 dark:text-gray-300">
                            <Layout size={20} />
                          </div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Enviar Banner</p>
                          <p className="text-xs text-gray-400 mt-1">Recomendado: Formato Horizontal</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700" />
              {/* ... Rest of Config tab same as before ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da Loja</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp (apenas números)</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">O número que receberá os pedidos.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CreditCard size={18} />
                  Métodos de Pagamento Aceitos
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(method => {
                    const isSelected = storePaymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        onClick={() => togglePaymentMethod(method)}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                           {method}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={handleSaveStore}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ... (Previous Modals: Upgrade Modal, Delete, etc. remain here but logic uses 'plans' prop) ... */}
      
      {/* Subscription Payment Modal - Using dynamic plans logic */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">Confirmar Mudança de Plano</h3>
                  <p className="text-emerald-100 text-sm">Você está mudando para o plano <span className="font-bold text-white">{selectedPlanForUpgrade.name}</span></p>
                </div>
                <button onClick={() => setSelectedPlanForUpgrade(null)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="mt-4 text-3xl font-bold">
                 R$ {selectedPlanForUpgrade.price.toFixed(2).replace('.', ',')}<span className="text-base font-normal opacity-80">/mês</span>
              </div>
            </div>

            {isKiwifyEnabled ? (
              // --- KIWIFY FLOW ---
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pagamento Seguro via Kiwify</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                  Você será redirecionado para a página de checkout seguro da Kiwify. O acesso será liberado automaticamente após a confirmação.
                </p>
                <button 
                  onClick={handleConfirmSubscription}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ExternalLink size={20} />
                  Ir para Pagamento Seguro
                </button>
                <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                  <LinkIcon size={12} /> Integração oficial Kiwify
                </div>
              </div>
            ) : (
              // --- MOCK FLOW (Keep for testing without integration) ---
              <>
                <div className="p-6 overflow-y-auto">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Escolha a forma de pagamento</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <button 
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800'}`}
                      >
                        <CreditCard size={24} />
                        <span className="font-bold text-sm">Cartão de Crédito</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800'}`}
                      >
                        <QrCode size={24} />
                        <span className="font-bold text-sm">Pix Instantâneo</span>
                      </button>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Número do Cartão</label>
                            <div className="relative">
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                          </div>
                          {/* ... other fake inputs ... */}
                          <div className="mt-4">
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nome no Cartão</label>
                              <input type="text" placeholder="Nome como está no cartão" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="text-center py-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="bg-white dark:bg-white p-4 inline-block rounded-xl border-2 border-gray-200 mb-4">
                        <QrCode size={120} className="text-gray-900" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Escaneie o QR Code para pagar</p>
                      <p className="text-xs text-gray-400">O pagamento é aprovado instantaneamente.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <button 
                    onClick={handleConfirmSubscription}
                    disabled={isProcessingPayment}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> Processando...
                      </>
                    ) : (
                      <>
                        <Zap size={20} className={paymentMethod === 'pix' ? "fill-white" : ""} /> 
                        {paymentMethod === 'pix' ? 'Pagar com Pix' : 'Confirmar Assinatura'}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Modal Form */}
      {(isAddingProduct || isEditingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar border border-transparent dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              {isEditingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Imagem do Produto</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    id="product-image" 
                    accept="image/*"
                    onChange={handleProductImageUpload}
                    className="hidden" 
                  />
                  <label 
                    htmlFor="product-image" 
                    className={`
                      w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative bg-gray-50 dark:bg-gray-700/50
                      ${productForm.image ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}
                    `}
                  >
                    {productForm.image ? (
                      <>
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold flex items-center gap-2">
                            <Upload size={20} /> Trocar Imagem
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500 dark:text-gray-300">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Clique para enviar uma foto</p>
                        <p className="text-xs text-gray-400 mt-1">JPG ou PNG</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nome do Produto</label>
                <input
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                  className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={e => setProductForm({...productForm, price: e.target.value})}
                    className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoria</label>
                  <select
                    required
                    value={productForm.category}
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                    className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {store.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                  className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeProductForm} className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 transform transition-all scale-100 border border-transparent dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Excluir {itemToDelete.type === 'product' ? 'Produto' : 'Categoria'}?
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Você está prestes a excluir <span className="font-bold text-gray-800 dark:text-gray-200">"{itemToDelete.name}"</span>. Esta ação enviará o item para a <span className="font-bold">Lixeira</span>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFM Customer List Modal */}
      {selectedRFMSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-gray-700">
              <div className={`p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center ${RFM_COLORS[selectedRFMSegment]}`}>
                <div>
                  <h3 className="text-xl font-bold">{selectedRFMSegment}</h3>
                  <p className="text-sm opacity-90">{RFM_DESCRIPTIONS[selectedRFMSegment]}</p>
                </div>
                <button onClick={() => setSelectedRFMSegment(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-4 flex-1">
                {rfmGroups[selectedRFMSegment].length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum cliente neste grupo.</p>
                ) : (
                   <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Cliente</th>
                        <th className="px-4 py-3">Última Compra</th>
                        <th className="px-4 py-3">Total Gasto</th>
                         <th className="px-4 py-3 rounded-r-lg text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {rfmGroups[selectedRFMSegment].map((customer) => (
                        <tr key={customer.phone} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900 dark:text-white">{customer.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                          </td>
                           <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                             {new Date(customer.lastOrderDate).toLocaleDateString()}
                             <br/>
                             <span className="text-xs text-gray-400">({customer.recency} dias atrás)</span>
                          </td>
                           <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                             {formatCurrency(customer.totalSpent)}
                             <br/>
                             <span className="text-xs text-gray-400 dark:text-gray-500">({customer.orderCount} pedidos)</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a 
                              href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};