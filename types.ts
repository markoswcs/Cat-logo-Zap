
export type Size = 'P' | 'M' | 'G' | 'GG';
export type Role = 'admin' | 'seller';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId?: string; // If seller, which store they own
}

export type PlanLevel = string; // Changed from union type to string to allow dynamic plans

export interface PlanLimits {
  maxProducts: number;
  canCustomizeBanner: boolean;
  canUseIntegrations: boolean; // Kiwify, etc
  canUseCustomDomain: boolean;
}

export interface SubscriptionPlan {
  id: PlanLevel;
  name: string;
  price: number;
  description: string;
  features: string[]; // For display in the pricing card
  limits: PlanLimits; // For logic enforcement
  recommended?: boolean;
}

export interface KiwifySettings {
  isEnabled: boolean;
  accessToken: string;
  webhookSecret: string;
  productId: string;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  logo: string;
  banner?: string; // Image for the store banner
  categories: string[];
  deletedCategories?: string[]; // Stores categories that were soft deleted
  acceptedPaymentMethods: string[];
  plan: PlanLevel; // New field for subscription status
  subscriptionExpiry?: string; // ISO Date for access expiration
  subscriptionPaymentStatus?: 'paid' | 'pending'; // Status of the payment for current period
}

export interface Product {
  id: string;
  storeId: string; // Linked to a store
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  isDeleted?: boolean; // Soft delete flag
}

export interface CartItem extends Product {
  cartItemId: string; 
  selectedSize: Size;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string; // Used as ID for RFM
  date: string; // ISO Date
  total: number;
  items: OrderItem[];
  status: 'completed' | 'pending' | 'cancelled';
}

export interface CustomerInfo {
  name: string;
  address: string;
  paymentMethod: 'Pix' | 'Cartão de Crédito' | 'Dinheiro';
  notes?: string;
}

export interface StoreConfig {
  name: string;
  phone: string;
  logo?: string;
  acceptedPaymentMethods?: string[];
}

// RFM Types
export type RFMSegment = 
  | 'Campeões' 
  | 'Leais' 
  | 'Precisam de Atenção' 
  | 'Novos' 
  | 'Em Risco' 
  | 'Perdidos';

export interface CustomerMetric {
  phone: string;
  name: string;
  lastOrderDate: string;
  totalSpent: number;
  orderCount: number;
  recency: number; // days since last order
  frequency: number;
  monetary: number;
  segment: RFMSegment;
}
