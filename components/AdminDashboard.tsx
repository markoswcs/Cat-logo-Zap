import React, { useState } from 'react';
import { KiwifySettings, Store, User, SubscriptionPlan } from '../types';
import { Store as StoreIcon, Settings, LogOut, Moon, Sun, Link as LinkIcon, Save, Zap, ExternalLink, Calendar, CheckCircle, AlertTriangle, Clock, CreditCard, Crown, Edit2, Plus, X, Trash2, Check } from 'lucide-react';
import { formatCurrency } from '../utils';

interface AdminDashboardProps {
  user: User;
  stores: Store[];
  plans: SubscriptionPlan[];
  onUpdatePlans: (plans: SubscriptionPlan[]) => void;
  onSelectStore: (storeId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  kiwifySettings: KiwifySettings;
  onUpdateKiwifySettings: (settings: KiwifySettings) => void;
  onSimulatePayment: (email: string) => void;
  onStoreAction: (storeId: string, action: 'extend_pending' | 'mark_paid') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, 
  stores, 
  plans,
  onUpdatePlans,
  onSelectStore, 
  onLogout, 
  isDarkMode, 
  onToggleTheme,
  kiwifySettings,
  onUpdateKiwifySettings,
  onSimulatePayment,
  onStoreAction
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'integrations' | 'plans'>('stores');
  const [testEmail, setTestEmail] = useState('');

  // Plans State
  const [isEditingPlan, setIsEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState<Partial<SubscriptionPlan>>({});

  // Handle Form Changes
  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onUpdateKiwifySettings({
      ...kiwifySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (testEmail) {
      onSimulatePayment(testEmail);
      setTestEmail('');
    }
  };

  // --- PLANS LOGIC ---
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setIsEditingPlan(plan);
    setPlanForm({ ...plan });
  };

  const handleCreatePlan = () => {
    setIsEditingPlan({ 
        id: `plan-${Date.now()}`, 
        name: 'Novo Plano', 
        price: 0, 
        description: '', 
        features: [], 
        limits: {
            maxProducts: 10,
            canCustomizeBanner: false,
            canUseIntegrations: false,
            canUseCustomDomain: false
        }
    } as SubscriptionPlan);
    setPlanForm({
        id: `plan-${Date.now()}`,
        name: '',
        price: 0,
        description: '',
        features: [],
        limits: {
            maxProducts: 10,
            canCustomizeBanner: false,
            canUseIntegrations: false,
            canUseCustomDomain: false
        }
    });
  };

  const handleSavePlan = () => {
    if (!planForm.id || !planForm.name) return;

    const newPlan = planForm as SubscriptionPlan;
    
    // Check if updating existing or adding new
    const exists = plans.find(p => p.id === newPlan.id);
    let updatedPlans;
    
    if (exists) {
        updatedPlans = plans.map(p => p.id === newPlan.id ? newPlan : p);
    } else {
        updatedPlans = [...plans, newPlan];
    }
    
    onUpdatePlans(updatedPlans);
    setIsEditingPlan(null);
  };

  const handleDeletePlan = (planId: string) => {
     if (confirm('Tem certeza? Lojas que usam este plano podem ser afetadas.')) {
         onUpdatePlans(plans.filter(p => p.id !== planId));
     }
  };

  const handlePlanFormChange = (field: string, value: any) => {
     setPlanForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLimitChange = (field: string, value: any) => {
     setPlanForm(prev => ({
         ...prev,
         limits: {
             ...prev.limits!,
             [field]: value
         }
     }));
  };

  const addFeature = () => {
      setPlanForm(prev => ({ ...prev, features: [...(prev.features || []), 'Nova característica'] }));
  };

  const updateFeature = (index: number, value: string) => {
      const newFeatures = [...(planForm.features || [])];
      newFeatures[index] = value;
      setPlanForm(prev => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
      setPlanForm(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== index) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Super Usuário: {user.name}</p>
            </div>
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
              onClick={onLogout}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto">
           <button 
            onClick={() => setActiveTab('stores')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'stores' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            <StoreIcon size={18} /> Lojas
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'plans' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            <Crown size={18} /> Planos de Assinatura
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'integrations' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            <LinkIcon size={18} /> Integrações
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {activeTab === 'stores' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Lojas Cadastradas</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {stores.map(store => {
                const expiryDate = store.subscriptionExpiry ? new Date(store.subscriptionExpiry) : null;
                const isExpired = expiryDate ? expiryDate < new Date() : false;
                const paymentStatus = store.subscriptionPaymentStatus || 'paid';
                const planName = plans.find(p => p.id === store.plan)?.name || store.plan;
                
                return (
                  <div key={store.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-500 shrink-0 overflow-hidden">
                        {store.logo && store.logo.startsWith('http') ? (
                          <img src={store.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          store.name.substring(0, 1)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            {store.name}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${store.plan === 'free' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                              {planName}
                            </span>
                          </h3>
                          <button
                            onClick={() => onSelectStore(store.id)}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                          >
                            Entrar na Loja
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {store.id}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-3">
                           <div className="text-xs flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                              <Calendar size={12} className="text-gray-400" />
                              {expiryDate ? (
                                <span className={isExpired ? "text-red-500 font-bold" : "text-gray-600 dark:text-gray-300"}>
                                  Validade: {expiryDate.toLocaleDateString()}
                                  {isExpired && " (EXPIRADO)"}
                                </span>
                              ) : (
                                <span className="text-gray-400">Sem validade</span>
                              )}
                            </div>
                            
                            <div className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded font-bold uppercase ${paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              {paymentStatus === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {paymentStatus === 'paid' ? 'Pago' : 'Pagamento Pendente'}
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex gap-2">
                       <button
                         onClick={() => onStoreAction(store.id, 'extend_pending')}
                         className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-yellow-200 dark:border-yellow-800"
                         title="Ativa por 30 dias mas mantém status de pagamento pendente"
                       >
                         <Zap size={14} /> Liberar Acesso (30 dias)
                       </button>
                       {paymentStatus !== 'paid' && (
                         <button
                           onClick={() => onStoreAction(store.id, 'mark_paid')}
                           className="flex-1 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-green-200 dark:border-green-800"
                           title="Confirma que o pagamento foi recebido"
                         >
                           <CreditCard size={14} /> Confirmar Pagamento
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gerenciar Planos</h2>
                    <button 
                        onClick={handleCreatePlan}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <Plus size={18} /> Novo Plano
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded font-mono">
                                        ID: {plan.id}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                    {formatCurrency(plan.price)}
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                    {plan.description}
                                </p>
                                
                                <div className="space-y-4">
                                    <div className="border-t border-b border-gray-100 dark:border-gray-700 py-4">
                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Limites do Sistema</h4>
                                        <ul className="text-sm space-y-2">
                                            <li className="flex justify-between">
                                                <span>Produtos Máx:</span>
                                                <span className="font-bold">{plan.limits.maxProducts > 9999 ? 'Ilimitado' : plan.limits.maxProducts}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Banner Personalizado:</span>
                                                <span className={plan.limits.canCustomizeBanner ? "text-green-500" : "text-red-500"}>
                                                    {plan.limits.canCustomizeBanner ? 'Sim' : 'Não'}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Domínio Próprio:</span>
                                                <span className={plan.limits.canUseCustomDomain ? "text-green-500" : "text-red-500"}>
                                                    {plan.limits.canUseCustomDomain ? 'Sim' : 'Não'}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Integrações (API):</span>
                                                <span className={plan.limits.canUseIntegrations ? "text-green-500" : "text-red-500"}>
                                                    {plan.limits.canUseIntegrations ? 'Sim' : 'Não'}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Destaques (Visual)</h4>
                                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                            {plan.features.slice(0, 3).map((f, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <Check size={14} className="mt-0.5 text-emerald-500" /> {f}
                                                </li>
                                            ))}
                                            {plan.features.length > 3 && (
                                                <li className="text-xs opacity-60">+ {plan.features.length - 3} itens</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                                <button 
                                    onClick={() => handleEditPlan(plan)}
                                    className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-emerald-500 hover:text-emerald-500 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button 
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Excluir Plano"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'integrations' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 <div className="bg-green-500 text-white p-1 rounded">
                    <Zap size={20} className="fill-current" />
                 </div>
                 Integração Kiwify
              </h2>
              <a 
                href="https://docs.kiwify.com.br/api-reference/general" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                Ver Documentação <ExternalLink size={14} />
              </a>
            </div>

            {/* Config Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white">Configuração do Webhook</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Conecte sua conta Kiwify para renovar assinaturas automaticamente.</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isEnabled"
                      checked={kiwifySettings.isEnabled}
                      onChange={handleSettingChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token (API)</label>
                    <input 
                      type="password"
                      name="accessToken"
                      value={kiwifySettings.accessToken}
                      onChange={handleSettingChange}
                      placeholder="kwy_..."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Secret</label>
                    <input 
                      type="text"
                      name="webhookSecret"
                      value={kiwifySettings.webhookSecret}
                      onChange={handleSettingChange}
                      placeholder="Chave secreta do webhook"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Produto (Catálogo)</label>
                    <input 
                      type="text"
                      name="productId"
                      value={kiwifySettings.productId}
                      onChange={handleSettingChange}
                      placeholder="Ex: H384K23"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2">
                    <Save size={16} /> Salvar Configurações
                  </button>
               </div>
            </div>

            {/* Simulation Tool */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg">
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                    <Zap size={20} />
                  </div>
                  <h3 className="font-bold">Simulador de Pagamento</h3>
               </div>
               <p className="text-sm text-gray-300 mb-6">
                 Utilize esta ferramenta para simular um evento de webhook de "ORDER_APPROVED" da Kiwify. Isso irá renovar a assinatura da loja associada ao email por 30 dias.
               </p>

               <form onSubmit={handleSimulate} className="flex gap-2">
                 <input 
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Email do lojista (ex: loja@zap.com)"
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-400"
                    required
                 />
                 <button 
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                 >
                   Simular <CheckCircle size={18} />
                 </button>
               </form>
               <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-black/20 p-2 rounded">
                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                 Isso simula o que aconteceria se a Kiwify enviasse um POST para sua API informando que o boleto/pix desse cliente foi compensado.
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Plan Modal */}
      {isEditingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {planForm.id?.startsWith('plan-') ? 'Novo Plano' : 'Editar Plano'}
                    </h3>
                    <button onClick={() => setIsEditingPlan(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Plano</label>
                            <input 
                                type="text" 
                                value={planForm.name || ''} 
                                onChange={(e) => handlePlanFormChange('name', e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={planForm.price || 0} 
                                onChange={(e) => handlePlanFormChange('price', parseFloat(e.target.value))}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição Curta</label>
                        <input 
                            type="text" 
                            value={planForm.description || ''} 
                            onChange={(e) => handlePlanFormChange('description', e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    {/* Limits Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Settings size={16} /> Limites e Permissões (O que o lojista pode fazer)
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite de Produtos</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={planForm.limits?.maxProducts} 
                                        onChange={(e) => handleLimitChange('maxProducts', parseInt(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-xs text-gray-500 self-center">Use 999999 para ilimitado</span>
                                </div>
                            </div>
                            
                            <div className="grid sm:grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 p-2 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={planForm.limits?.canCustomizeBanner}
                                        onChange={(e) => handleLimitChange('canCustomizeBanner', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <span className="text-sm">Pode mudar Banner</span>
                                </label>
                                
                                <label className="flex items-center gap-2 p-2 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={planForm.limits?.canUseCustomDomain}
                                        onChange={(e) => handleLimitChange('canUseCustomDomain', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <span className="text-sm">Domínio Próprio</span>
                                </label>
                                
                                <label className="flex items-center gap-2 p-2 border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={planForm.limits?.canUseIntegrations}
                                        onChange={(e) => handleLimitChange('canUseIntegrations', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <span className="text-sm">Acesso a API/Integrações</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lista de Benefícios (Visual)</label>
                             <button onClick={addFeature} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300">Add Item</button>
                        </div>
                        <div className="space-y-2">
                            {planForm.features?.map((feature, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={feature}
                                        onChange={(e) => updateFeature(idx, e.target.value)}
                                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                    <button onClick={() => removeFeature(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsEditingPlan(null)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSavePlan}
                        className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                    >
                        Salvar Plano
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};