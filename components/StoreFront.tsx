import React, { useState } from 'react';
import { ShoppingBag, Search, LogIn, Moon, Sun } from 'lucide-react';
import { Product, CartItem, Size, Store } from '../types';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';

interface StoreFrontProps {
  store: Store;
  products: Product[];
  onGoToLogin: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const StoreFront: React.FC<StoreFrontProps> = ({ store, products, onGoToLogin, isDarkMode, onToggleTheme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived state
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Handlers
  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAddToCart = (product: Product, size: Size) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existingItem) {
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === size)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        selectedSize: size, 
        quantity: 1, 
        cartItemId: `${product.id}-${size}-${Date.now()}` 
      }];
    });
    
    closeProductModal();
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold overflow-hidden">
                {store.logo.includes('http') || store.logo.startsWith('data:') ? (
                  <img src={store.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  store.name.substring(0, 1)
                )}
            </div>
            <h1 className="font-bold text-gray-800 dark:text-white text-lg">{store.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onToggleTheme}
              className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onGoToLogin}
              className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              title="Área do Lojista"
            >
              <LogIn size={20} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 flex-grow w-full">
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="O que você procura hoje?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
        </div>

        {/* Categories */}
        <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2">
            <button 
              onClick={() => setSearchTerm('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${searchTerm === '' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
            >
              Todos
            </button>
            {store.categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSearchTerm(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${searchTerm === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Section */}
        {store.banner && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-sm aspect-[3/1] md:aspect-[4/1] relative group bg-gray-100 dark:bg-gray-800">
            <img 
              src={store.banner} 
              alt="Banner Promocional" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={openProductModal} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Nenhum produto encontrado.</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-semibold tracking-wide text-sm">
            OnTrack 2026
          </p>
        </div>
      </footer>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        storeConfig={{ 
          name: store.name, 
          phone: store.phone, 
          logo: store.logo,
          acceptedPaymentMethods: store.acceptedPaymentMethods
        }}
      />
    </div>
  );
};