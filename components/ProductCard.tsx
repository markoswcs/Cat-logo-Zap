import React from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import { MessageCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-200">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-gray-800 dark:text-gray-100 text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{product.category}</p>
        
        <div className="mt-auto">
          <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-3">
            {formatCurrency(product.price)}
          </p>
          <button 
            onClick={() => onSelect(product)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            aria-label="Pedir no WhatsApp"
          >
            <MessageCircle size={20} />
            Pedir no Zap
          </button>
        </div>
      </div>
    </div>
  );
};