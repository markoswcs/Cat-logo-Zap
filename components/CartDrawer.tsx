import React, { useState } from 'react';
import { CartItem, CustomerInfo, StoreConfig } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { PAYMENT_METHODS } from '../constants';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  MessageCircle, 
  ChevronLeft, 
  User, 
  MapPin, 
  CreditCard, 
  Zap, 
  FileText,
  Minus,
  Plus,
  Banknote
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (cartItemId: string) => void;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  storeConfig: StoreConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  onRemoveItem,
  onUpdateQuantity,
  storeConfig 
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    address: '',
    paymentMethod: 'Pix',
    notes: ''
  });

  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const availablePaymentMethods = storeConfig.acceptedPaymentMethods && storeConfig.acceptedPaymentMethods.length > 0
    ? storeConfig.acceptedPaymentMethods
    : PAYMENT_METHODS;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setStep('checkout');
  };

  const handleBackToCart = () => {
    setStep('cart');
  };

  const handleFinish = () => {
    const link = generateWhatsAppLink(cart, customer, storeConfig);
    window.open(link, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const selectPaymentMethod = (method: string) => {
     // Cast to correct type since we know the method string comes from PAYMENT_METHODS
     setCustomer(prev => ({ ...prev, paymentMethod: method as any }));
  };

  const getPaymentIcon = (method: string) => {
    if (method === 'Pix') return <Zap size={24} />;
    if (method === 'Dinheiro') return <Banknote size={24} />;
    return <CreditCard size={24} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-2xl pointer-events-auto flex flex-col transform transition-transform duration-300 ease-out border-l border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button onClick={handleBackToCart} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {step === 'cart' ? 'Carrinho de Compras' : 'Finalizar Pedido'}
              </h2>
              {step === 'checkout' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Preencha seus dados para entrega</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-4 p-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={40} className="opacity-20 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Seu carrinho está vazio</p>
              <button onClick={onClose} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                Explorar produtos
              </button>
            </div>
          ) : (
            <>
              {step === 'cart' ? (
                <div className="p-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{item.name}</h4>
                          <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">
                            Tamanho: {item.selectedSize}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 h-8">
                              <button 
                                onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-gray-800 dark:text-gray-200">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                                className="w-8 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button 
                              onClick={() => onRemoveItem(item.cartItemId)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Personal Data Section */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-50 dark:border-gray-700 pb-2">
                      <User size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <h3>Quem recebe?</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Nome Completo</label>
                      <input
                        type="text"
                        name="name"
                        value={customer.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-sm text-gray-900 dark:text-white"
                        placeholder="Digite seu nome"
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-50 dark:border-gray-700 pb-2">
                      <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <h3>Onde entregar?</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Endereço Completo</label>
                      <textarea
                        name="address"
                        value={customer.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-800 outline-none resize-none transition-all text-sm text-gray-900 dark:text-white"
                        placeholder="Rua, número, bairro e complemento..."
                      />
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-50 dark:border-gray-700 pb-2">
                      <CreditCard size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <h3>Como pagar?</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {availablePaymentMethods.map((method) => {
                        const isSelected = customer.paymentMethod === method;
                        return (
                          <button
                            key={method}
                            onClick={() => selectPaymentMethod(method)}
                            className={`
                              relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
                              ${isSelected 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-200 hover:bg-white dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            {getPaymentIcon(method)}
                            <span className="text-sm font-semibold">{method}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-50 dark:border-gray-700 pb-2">
                      <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <h3>Alguma observação?</h3>
                    </div>
                    <input
                      type="text"
                      name="notes"
                      value={customer.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-sm text-gray-900 dark:text-white"
                      placeholder="Ex: Troco para 50, Campainha não funciona..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Total do Pedido</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
            </div>
            
            {step === 'cart' ? (
              <button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Continuar para Dados
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!customer.name || !customer.address}
                className={`
                  w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]
                  ${(!customer.name || !customer.address) 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-green-900/30'
                  }
                `}
              >
                <MessageCircle size={22} />
                Enviar Pedido no WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};