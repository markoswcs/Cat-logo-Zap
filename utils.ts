import { CartItem, CustomerInfo, StoreConfig } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateWhatsAppLink = (
  cart: CartItem[],
  customer: CustomerInfo,
  store: StoreConfig
): string => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let message = `*Novo Pedido - ${store.name}*\n\n`;
  
  message += `*Cliente:* ${customer.name}\n`;
  message += `*Endereço:* ${customer.address}\n`;
  message += `*Pagamento:* ${customer.paymentMethod}\n`;
  if (customer.notes) message += `*Obs:* ${customer.notes}\n`;
  
  message += `\n*Itens do Pedido:*\n`;
  
  cart.forEach((item) => {
    message += `• ${item.quantity}x ${item.name} (${item.selectedSize})\n   ${formatCurrency(item.price * item.quantity)}\n`;
  });

  message += `\n*Total: ${formatCurrency(total)}*`;
  
  message += `\n\n_Enviado via Catálogo Zap_`;

  const encodedMessage = encodeURIComponent(message);
  
  // Use wa.me for universal linking
  return `https://wa.me/${store.phone}?text=${encodedMessage}`;
};