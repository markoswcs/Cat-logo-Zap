
import { Product, Store, User, Order, SubscriptionPlan } from './types';

export const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Dinheiro'];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Iniciante',
    price: 0,
    description: 'Para quem está começando',
    features: ['Até 10 produtos', 'Catálogo Básico', 'Link para WhatsApp'],
    limits: {
      maxProducts: 10,
      canCustomizeBanner: false,
      canUseIntegrations: false,
      canUseCustomDomain: false
    }
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 29.90,
    description: 'Para lojas em crescimento',
    features: ['Até 50 produtos', 'Banner Personalizado', 'Dashboard de Vendas', 'Matriz RFV'],
    limits: {
      maxProducts: 50,
      canCustomizeBanner: true,
      canUseIntegrations: false,
      canUseCustomDomain: true
    },
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 59.90,
    description: 'Sem limites para grandes negócios',
    features: ['Produtos ilimitados', 'Integrações (Kiwify)', 'Suporte Prioritário', 'Tudo do Pro'],
    limits: {
      maxProducts: 999999,
      canCustomizeBanner: true,
      canUseIntegrations: true,
      canUseCustomDomain: true
    }
  }
];

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@zap.com', role: 'admin' },
  { id: '2', name: 'Loja Moda Style', email: 'loja@zap.com', role: 'seller', storeId: 'store-1' },
];

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    ownerId: '2',
    name: 'Moda Style',
    phone: '5511999999999',
    logo: 'https://via.placeholder.com/150',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    categories: ['Camisetas', 'Calças', 'Vestidos', 'Casacos', 'Shorts', 'Camisas', 'Calçados', 'Acessórios'],
    acceptedPaymentMethods: ['Pix', 'Cartão de Crédito', 'Dinheiro'],
    plan: 'free',
    subscriptionExpiry: futureDate.toISOString(),
    subscriptionPaymentStatus: 'paid'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    storeId: 'store-1',
    name: 'Camiseta Básica Premium',
    price: 49.90,
    image: 'https://picsum.photos/400/400?random=1',
    category: 'Camisetas',
    description: 'Camiseta 100% algodão com corte moderno e confortável.'
  },
  {
    id: '2',
    storeId: 'store-1',
    name: 'Calça Jeans Slim',
    price: 129.90,
    image: 'https://picsum.photos/400/400?random=2',
    category: 'Calças',
    description: 'Jeans com elastano, lavagem escura e modelagem slim fit.'
  },
  {
    id: '3',
    storeId: 'store-1',
    name: 'Vestido Floral Verão',
    price: 89.90,
    image: 'https://picsum.photos/400/400?random=3',
    category: 'Vestidos',
    description: 'Tecido leve e fresco, ideal para dias quentes.'
  },
  {
    id: '4',
    storeId: 'store-1',
    name: 'Jaqueta Bomber',
    price: 199.90,
    image: 'https://picsum.photos/400/400?random=4',
    category: 'Casacos',
    description: 'Estilo urbano e proteção contra o vento.'
  },
  {
    id: '5',
    storeId: 'store-1',
    name: 'Shorts Linho',
    price: 69.90,
    image: 'https://picsum.photos/400/400?random=5',
    category: 'Shorts',
    description: 'Elegância e conforto em uma peça versátil.'
  },
  {
    id: '6',
    storeId: 'store-1',
    name: 'Camisa Polo Listrada',
    price: 79.90,
    image: 'https://picsum.photos/400/400?random=6',
    category: 'Camisas',
    description: 'Clássica e atemporal, perfeita para o dia a dia.'
  },
  {
    id: '7',
    storeId: 'store-1',
    name: 'Tênis Casual Branco',
    price: 159.90,
    image: 'https://picsum.photos/400/400?random=7',
    category: 'Calçados',
    description: 'Conforto e estilo para qualquer ocasião.'
  },
  {
    id: '8',
    storeId: 'store-1',
    name: 'Boné Aba Curva',
    price: 39.90,
    image: 'https://picsum.photos/400/400?random=8',
    category: 'Acessórios',
    description: 'Proteção solar com muito estilo.'
  },
  {
    id: '9',
    storeId: 'store-1',
    name: 'Relógio Digital Sport',
    price: 89.90,
    image: 'https://picsum.photos/400/400?random=9',
    category: 'Acessórios',
    description: 'Resistente à água e com cronômetro integrado.'
  },
  {
    id: '10',
    storeId: 'store-1',
    name: 'Mochila Urbana Notebook',
    price: 149.90,
    image: 'https://picsum.photos/400/400?random=10',
    category: 'Acessórios',
    description: 'Compartimento acolchoado para notebook até 15 polegadas.'
  },
  {
    id: '11',
    storeId: 'store-1',
    name: 'Blusa de Moletom Capuz',
    price: 119.90,
    image: 'https://picsum.photos/400/400?random=11',
    category: 'Casacos',
    description: 'Moletom flanelado super confortável para o inverno.'
  },
  {
    id: '12',
    storeId: 'store-1',
    name: 'Kit 3 Pares de Meias',
    price: 29.90,
    image: 'https://picsum.photos/400/400?random=12',
    category: 'Acessórios',
    description: 'Algodão macio e cano médio, cores variadas.'
  }
];

// Helper to generate dates relative to today
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const MOCK_ORDERS: Order[] = [
  // Recent Orders (High Recency)
  { id: '101', storeId: 'store-1', customerName: 'Maria Silva', customerPhone: '5511999991111', date: daysAgo(1), total: 250.00, status: 'completed', items: [{ productId: '1', name: 'Camiseta', quantity: 2, price: 49.90 }, { productId: '2', name: 'Calça Jeans', quantity: 1, price: 129.90 }] },
  { id: '102', storeId: 'store-1', customerName: 'João Souza', customerPhone: '5511999992222', date: daysAgo(2), total: 89.90, status: 'completed', items: [{ productId: '3', name: 'Vestido', quantity: 1, price: 89.90 }] },
  { id: '103', storeId: 'store-1', customerName: 'Ana Pereira', customerPhone: '5511999993333', date: daysAgo(3), total: 450.00, status: 'completed', items: [{ productId: '4', name: 'Jaqueta', quantity: 2, price: 199.90 }] },
  
  // Frequent Buyers (High Frequency)
  { id: '104', storeId: 'store-1', customerName: 'Maria Silva', customerPhone: '5511999991111', date: daysAgo(10), total: 120.00, status: 'completed', items: [] },
  { id: '105', storeId: 'store-1', customerName: 'Maria Silva', customerPhone: '5511999991111', date: daysAgo(25), total: 300.00, status: 'completed', items: [] },
  
  // Old Orders (Low Recency)
  { id: '106', storeId: 'store-1', customerName: 'Carlos Lima', customerPhone: '5511999994444', date: daysAgo(60), total: 50.00, status: 'completed', items: [] },
  { id: '107', storeId: 'store-1', customerName: 'Roberto Dias', customerPhone: '5511999995555', date: daysAgo(95), total: 500.00, status: 'completed', items: [] },
  
  // At Risk (Was good, stopped buying)
  { id: '108', storeId: 'store-1', customerName: 'Lucia Santos', customerPhone: '5511999996666', date: daysAgo(45), total: 600.00, status: 'completed', items: [] },
  { id: '109', storeId: 'store-1', customerName: 'Lucia Santos', customerPhone: '5511999996666', date: daysAgo(120), total: 400.00, status: 'completed', items: [] },

  // New Customer
  { id: '110', storeId: 'store-1', customerName: 'Novo Cliente', customerPhone: '5511988887777', date: daysAgo(0), total: 150.00, status: 'completed', items: [{productId: '7', name: 'Tênis', quantity: 1, price: 159.90}] }
];
