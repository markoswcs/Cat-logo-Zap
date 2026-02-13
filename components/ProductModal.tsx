import React, { useState } from 'react';
import { Product, Size } from '../types';
import { formatCurrency } from '../utils';
import { X, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: Size) => void;
}

const SIZES: Size[] = ['P', 'M', 'G', 'GG'];

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    if (selectedSize) {
      onAddToCart(product, selectedSize);
      setSelectedSize(null); // Reset for next time
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 pointer-events-auto transform transition-transform duration-300 ease-out shadow-2xl relative border border-transparent dark:border-gray-700">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>

        <div className="flex gap-4 mb-6">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{product.name}</h3>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl mt-1">{formatCurrency(product.price)}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{product.description}</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Escolha o Tamanho
          </label>
          <div className="flex gap-3">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border transition-all
                  ${selectedSize === size 
                    ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!selectedSize}
          className={`
            w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
            ${selectedSize 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none' 
              : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Check size={20} />
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
};