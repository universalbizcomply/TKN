import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, PromoCode, DropBannerConfig, AnalyticsData, ProductItem, MetaTagConfig, WaitlistEntry } from '../types';
import { api } from '../lib/api';
import { MetaTagManager } from './MetaTagManager';

interface AdminConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshStoreProducts: () => void;
  products?: ProductItem[];
  onMetaUpdated?: (config: MetaTagConfig) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  isOpen,
  onClose,
  onRefreshStoreProducts,
  products = [],
  onMetaUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'products' | 'marketing' | 'analytics' | 'reviews' | 'meta' | 'waitlist'>('orders');
  const [toast, setToast] = useState<string | null>(null);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryMetrics, setInventoryMetrics] = useState({ totalUnits: 0, totalValue: 0 });

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [dropBanner, setDropBanner] = useState<DropBannerConfig | null>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<string>('all');

  // Waitlist (Notify Me) State
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [waitlistStatusFilter, setWaitlistStatusFilter] = useState<'all' | 'waiting' | 'notified'>('all');
  const [waitlistProductFilter, setWaitlistProductFilter] = useState<string>('all');
  const [isManualWaitlistOpen, setIsManualWaitlistOpen] = useState(false);
  const [manualWaitlistEmail, setManualWaitlistEmail] = useState('');
  const [manualWaitlistProductId, setManualWaitlistProductId] = useState('');
  const [manualWaitlistSize, setManualWaitlistSize] = useState('L');

  // Order edit address state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editCountry, setEditCountry] = useState('United Kingdom');

  // New Product Modal State
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'shirts',
    price: 48,
    gsm: '320 GSM',
    fabric: '100% Ring-Spun Cotton',
    fit: 'Boxy Drop Shoulder',
    description: '',
    sizes: 'S,M,L,XL',
    initialStock: 15,
  });

  // New Promo Modal State
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(15);
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState(250);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Loaders
  const loadOrders = async () => {
    const data = await api.getOrders(orderFilter, orderSearch);
    setOrders(data);
  };

  const loadInventory = async () => {
    const data = await api.getInventory();
    setInventory(data.inventory || []);
    setInventoryMetrics({
      totalUnits: data.totalInventoryUnits,
      totalValue: data.totalInventoryValue,
    });
  };

  const loadMarketing = async () => {
    const [p, b, s] = await Promise.all([
      api.getPromos(),
      api.getBanner(),
      api.getSubscribers(),
    ]);
    setPromos(p);
    setDropBanner(b);
    setSubscribers(s.subscribers || []);
  };

  const loadAnalytics = async () => {
    const a = await api.getAnalytics();
    setAnalytics(a);
  };

  const loadReviews = async () => {
    const r = await api.getReviews();
    setReviews(r);
  };

  const loadWaitlist = async () => {
    try {
      const res = await api.getWaitlist(waitlistProductFilter, waitlistSearch);
      if (res.waitlist) {
        setWaitlist(res.waitlist);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWaitlist();
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'inventory') loadInventory();
      if (activeTab === 'marketing') loadMarketing();
      if (activeTab === 'analytics') loadAnalytics();
      if (activeTab === 'products') loadInventory();
      if (activeTab === 'reviews') loadReviews();
      if (activeTab === 'waitlist') loadWaitlist();
    }
  }, [isOpen, activeTab, orderFilter, waitlistProductFilter, waitlistSearch]);

  // Waitlist Actions
  const handleDeleteWaitlist = async (id: string) => {
    const res = await api.deleteWaitlistEntry(id);
    if (res.success) {
      showToast('✓ Waitlist entry removed');
      loadWaitlist();
    }
  };

  const handleNotifyWaitlist = async (id: string) => {
    const res = await api.notifyWaitlistEntry(id);
    if (res.success) {
      showToast(res.message || '✓ Restock alert dispatched to customer');
      loadWaitlist();
    }
  };

  const handleBatchNotify = async (productId?: string) => {
    const res = await api.batchNotifyWaitlist(productId);
    if (res.success) {
      showToast(`✓ Restock notifications dispatched to ${res.notifiedCount} customers!`);
      loadWaitlist();
    }
  };

  const handleAddManualWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWaitlistEmail || !manualWaitlistEmail.includes('@')) {
      showToast('⚠️ Please enter a valid email');
      return;
    }
    const allAvailable = products.length > 0 ? products : inventory;
    const targetProduct = allAvailable.find(
      (p) => p.id === manualWaitlistProductId
    ) || allAvailable[0] || { id: 'manual', title: 'Archive Garment', gsm: '400 GSM' };

    const res = await api.joinWaitlist({
      productId: targetProduct.id,
      productTitle: targetProduct.title,
      size: manualWaitlistSize || 'L',
      email: manualWaitlistEmail,
      gsm: targetProduct.gsm,
    });

    if (res.success) {
      showToast(`✓ Enrolled ${manualWaitlistEmail} for ${targetProduct.title} (${manualWaitlistSize})`);
      setIsManualWaitlistOpen(false);
      setManualWaitlistEmail('');
      loadWaitlist();
    } else {
      showToast(`⚠️ ${res.error || 'Failed to add'}`);
    }
  };

  const handleExportWaitlistCsv = () => {
    if (waitlist.length === 0) {
      showToast('⚠️ Waitlist is empty');
      return;
    }
    const headers = 'ID,Email,Product,Size,GSM,Status,CreatedAt\n';
    const rows = waitlist
      .map(
        (w) =>
          `"${w.id}","${w.email}","${w.productTitle}","${w.size || 'ANY'}","${w.gsm || ''}","${w.status}","${w.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archive-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Waitlist CSV exported successfully');
  };

  // Review Actions
  const handleDeleteReview = async (id: string) => {
    const res = await api.deleteReview(id);
    if (res.success) {
      showToast('✓ Review purged from public catalog');
      loadReviews();
    }
  };

  // Order Actions
  const handleCancelOrder = async (orderId: string) => {
    const res = await api.cancelOrder(orderId);
    if (res.success) {
      showToast(`✓ Order ${orderId} cancelled & stock restored`);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
      onRefreshStoreProducts();
    } else {
      showToast(`⚠️ ${res.error || 'Cannot cancel order'}`);
    }
  };

  const handleSaveAddress = async (orderId: string) => {
    if (!editStreet.trim() || !editCity.trim()) return;
    const res = await api.updateOrderAddress(orderId, {
      street: editStreet,
      city: editCity,
      state: editState,
      zip: editZip,
      country: editCountry,
    });
    if (res.success) {
      showToast('✓ Shipping destination updated');
      setIsEditingAddress(false);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
    } else {
      showToast(`⚠️ ${res.error || 'Failed to update address'}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await api.deleteProduct(id);
    if (res.success) {
      showToast('✓ Garment purged from archive catalog');
      loadInventory();
      onRefreshStoreProducts();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await api.updateOrderStatus(orderId, { status });
    if (res.success) {
      showToast(`✓ Order ${orderId} updated to ${status.toUpperCase()}`);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
    }
  };

  const handleUpdateTracking = async (orderId: string, carrier: string, trackingNumber: string) => {
    const res = await api.updateOrderStatus(orderId, {
      carrier,
      trackingNumber,
      note: `Waybill assigned: ${carrier} (${trackingNumber})`,
    });
    if (res.success) {
      showToast(`✓ Waybill saved for ${orderId}`);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order);
      }
    }
  };

  // Inventory Actions
  const handleAdjustStock = async (productId: string, size: string, delta: number) => {
    const res = await api.adjustInventory(productId, size, delta);
    if (res.success) {
      showToast(`✓ Stock adjusted for ${size}`);
      loadInventory();
      onRefreshStoreProducts();
    }
  };

  // Product Creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizeArr = newProduct.sizes.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    const stockMap: Record<string, number> = {};
    sizeArr.forEach((sz) => {
      stockMap[sz] = Number(newProduct.initialStock) || 10;
    });

    const payload: Partial<ProductItem> = {
      title: newProduct.title.toUpperCase(),
      category: newProduct.category as any,
      price: Number(newProduct.price),
      gsm: newProduct.gsm,
      fabric: newProduct.fabric,
      fit: newProduct.fit,
      description: newProduct.description || 'Raw heavyweight underground cut. Hand-pulled screenprint.',
      availableSizes: sizeArr,
      stock: stockMap,
      currentSlide: 0,
      totalSlides: 3,
      angles: [
        { label: 'FRONT 01', sublabel: 'FLAT LAY', tag: '300GSM COTTON', bgClass: 'bg-neutral-900', type: newProduct.category === 'hoodies' ? 'hoodie' : 'shirt' },
        { label: 'BACK 02', sublabel: 'SILKSCREEN', tag: 'HAND PULLED', bgClass: 'bg-neutral-800', type: newProduct.category === 'hoodies' ? 'hoodie' : 'shirt' },
        { label: 'MACRO 03', sublabel: 'COLLAR RIB', tag: 'DENSE WEAVE', bgClass: 'bg-neutral-950', type: newProduct.category === 'hoodies' ? 'hoodie' : 'shirt' },
      ],
    };

    const res = await api.createProduct(payload);
    if (res.success) {
      showToast(`✓ New garment "${newProduct.title}" added to catalog!`);
      setIsNewProductOpen(false);
      loadInventory();
      onRefreshStoreProducts();
      setNewProduct({
        title: '',
        category: 'shirts',
        price: 48,
        gsm: '320 GSM',
        fabric: '100% Ring-Spun Cotton',
        fit: 'Boxy Drop Shoulder',
        description: '',
        sizes: 'S,M,L,XL',
        initialStock: 15,
      });
    }
  };

  // Promo Actions
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;
    const res = await api.createPromo({
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: Number(newPromoDiscount),
      description: newPromoDesc || `${newPromoDiscount}% Off Archive Discount`,
      maxUses: Number(newPromoMaxUses),
    });
    if (res.success) {
      showToast(`✓ Promo ${newPromoCode.toUpperCase()} created!`);
      setNewPromoCode('');
      loadMarketing();
    }
  };

  const handleDeletePromo = async (code: string) => {
    const res = await api.deletePromo(code);
    if (res.success) {
      showToast(`✕ Promo ${code} removed`);
      loadMarketing();
    }
  };

  // Banner Actions
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropBanner) return;
    const res = await api.updateBanner(dropBanner);
    if (res.success) {
      showToast('✓ Drop announcement banner updated on live storefront!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs cursor-pointer" onClick={onClose} />

      {/* Main Console Box */}
      <div className="relative w-full max-w-6xl bg-[#faf8f2] bg-notebook-paper border-4 border-black polaroid-drop-shadow-lg p-3 sm:p-6 z-10 my-auto flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Serrated Tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-44 h-7 masking-tape serrated-tape z-20 opacity-95 shadow transform -rotate-1 pointer-events-none" />

        {/* Toast */}
        {toast && (
          <div className="absolute top-4 right-4 z-50 bg-black text-yellow-300 font-mono-tag font-bold text-xs px-3 py-1.5 border border-black shadow-[2px_2px_0px_#000]">
            {toast}
          </div>
        )}

        {/* Console Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse border border-black" />
            <h2 className="font-headline font-black text-lg sm:text-2xl text-black uppercase tracking-tight">
              TO KNOW NOTHING // ARCHIVE CONTROL ROOM
            </h2>
            <span className="bg-black text-yellow-300 text-[10px] font-mono-tag font-bold px-2 py-0.5 uppercase hidden sm:inline">
              REST BACKEND ONLINE (PORT 3000)
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-black hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-3 py-1 border border-black shadow-xs active:translate-y-0.5"
          >
            [✕ CLOSE / RETURN TO STORE]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b-2 border-black pb-2 mb-3 font-mono-tag text-xs font-bold flex-shrink-0">
          {[
            { id: 'orders', label: 'ORDERS MANAGEMENT', badge: orders.length },
            { id: 'inventory', label: 'INVENTORY & SIZES', badge: `${inventoryMetrics.totalUnits} UNITS` },
            { id: 'products', label: 'CATALOG & GARMENTS', badge: '+' },
            { id: 'waitlist', label: 'WAITLIST (NOTIFY ME)', badge: `${waitlist.filter((w) => w.status === 'waiting').length} WAITING` },
            { id: 'reviews', label: 'COMMUNITY REVIEWS', badge: `${reviews.length}` },
            { id: 'marketing', label: 'MARKETING & PROMOS', badge: `${promos.length} CODES` },
            { id: 'analytics', label: 'ANALYTICS & REVENUE' },
            { id: 'meta', label: 'META TAG MANAGER', badge: 'SEO / OG' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 border-2 border-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000]'
                  : 'bg-white hover:bg-yellow-100 text-black'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded-xs ${
                  activeTab === tab.id ? 'bg-yellow-300 text-black' : 'bg-neutral-200 text-neutral-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1">

          {/* TAB 1: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-3 font-mono-tag">
              {/* Filter & Search Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-white border-2 border-black p-2.5">
                <div className="flex gap-1 overflow-x-auto text-xs">
                  {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-2 py-1 text-[11px] font-bold uppercase border border-black ${
                        orderFilter === st ? 'bg-black text-yellow-300' : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                    placeholder="SEARCH ORDERS..."
                    className="bg-neutral-50 border border-black px-2 py-1 text-xs outline-none"
                  />
                  <button
                    onClick={loadOrders}
                    className="bg-black text-white px-2.5 py-1 text-xs font-bold border border-black"
                  >
                    FILTER
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="border-2 border-black bg-white overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-neutral-900 text-yellow-300 font-bold border-b-2 border-black">
                      <th className="p-2 border-r border-neutral-700">ORDER ID</th>
                      <th className="p-2 border-r border-neutral-700">DATE</th>
                      <th className="p-2 border-r border-neutral-700">CUSTOMER</th>
                      <th className="p-2 border-r border-neutral-700">GARMENTS</th>
                      <th className="p-2 border-r border-neutral-700">TOTAL</th>
                      <th className="p-2 border-r border-neutral-700">STATUS</th>
                      <th className="p-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-neutral-500 italic font-typewriter">
                          No orders match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-neutral-200 hover:bg-yellow-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <td className="p-2 font-bold text-black border-r border-neutral-200">
                            {o.id}
                          </td>
                          <td className="p-2 text-neutral-600 border-r border-neutral-200 text-[11px]">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-2 border-r border-neutral-200">
                            <div className="font-bold text-black">{o.customer.name}</div>
                            <div className="text-neutral-500 text-[10px] truncate max-w-[150px]">{o.customer.email}</div>
                          </td>
                          <td className="p-2 border-r border-neutral-200">
                            {o.items.map((it, i) => (
                              <div key={i} className="text-[11px]">
                                {it.title} ({it.size}) × {it.quantity}
                              </div>
                            ))}
                          </td>
                          <td className="p-2 font-black text-black border-r border-neutral-200">
                            £{o.total.toFixed(2)}
                          </td>
                          <td className="p-2 border-r border-neutral-200">
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border border-black ${
                              o.status === 'pending'
                                ? 'bg-yellow-200 text-black'
                                : o.status === 'processing'
                                ? 'bg-blue-200 text-blue-900'
                                : o.status === 'shipped'
                                ? 'bg-purple-200 text-purple-900'
                                : o.status === 'delivered'
                                ? 'bg-green-200 text-green-900'
                                : 'bg-red-200 text-red-900'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              {o.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'processing')}
                                  className="bg-black text-white hover:bg-neutral-800 text-[10px] px-1.5 py-0.5 border border-black font-bold"
                                >
                                  → WASH / PRINT
                                </button>
                              )}
                              {o.status === 'processing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'shipped')}
                                  className="bg-purple-700 text-white hover:bg-purple-800 text-[10px] px-1.5 py-0.5 border border-black font-bold"
                                >
                                  → SHIP
                                </button>
                              )}
                              {o.status === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                                  className="bg-green-700 text-white hover:bg-green-800 text-[10px] px-1.5 py-0.5 border border-black font-bold"
                                >
                                  → DELIVER
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Detail Modal / Inspector Drawer */}
              {selectedOrder && (
                <div className="border-3 border-black bg-[#fefefc] p-4 space-y-3 mt-4 shadow-[4px_4px_0px_#000]">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold">INSPECTING DISPATCH SLIP</span>
                      <h3 className="font-headline font-black text-lg text-black uppercase">
                        {selectedOrder.id} // {selectedOrder.customer.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="bg-neutral-200 hover:bg-neutral-300 text-black px-2 py-1 text-xs font-bold border border-black"
                    >
                      [CLOSE INSPECTOR]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Shipping Address */}
                    <div className="border border-black p-2.5 bg-white space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[10px] text-neutral-500 block uppercase">SHIPPING DISPATCH DESTINATION</span>
                        {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setEditStreet(selectedOrder.customer.street);
                              setEditCity(selectedOrder.customer.city);
                              setEditState(selectedOrder.customer.state || '');
                              setEditZip(selectedOrder.customer.zip);
                              setEditCountry(selectedOrder.customer.country || 'United Kingdom');
                              setIsEditingAddress(!isEditingAddress);
                            }}
                            className="text-[9px] font-bold underline text-blue-700 hover:text-black cursor-pointer"
                          >
                            {isEditingAddress ? 'CANCEL' : 'EDIT'}
                          </button>
                        )}
                      </div>

                      {isEditingAddress ? (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            value={editStreet}
                            onChange={(e) => setEditStreet(e.target.value)}
                            placeholder="Street Address / Studio"
                            className="w-full border border-black p-1 text-xs outline-none bg-yellow-50 font-typewriter"
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              placeholder="Town / City"
                              className="w-full border border-black p-1 text-xs outline-none bg-yellow-50 font-typewriter"
                            />
                            <input
                              type="text"
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                              placeholder="County / Region"
                              className="w-full border border-black p-1 text-xs outline-none bg-yellow-50 font-typewriter"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={editZip}
                              onChange={(e) => setEditZip(e.target.value)}
                              placeholder="Postcode (e.g. E2 7DD)"
                              className="w-full border border-black p-1 text-xs outline-none bg-yellow-50 font-typewriter uppercase"
                            />
                            <select
                              value={editCountry}
                              onChange={(e) => setEditCountry(e.target.value)}
                              className="w-full border border-black p-1 text-xs outline-none bg-yellow-50 font-typewriter cursor-pointer"
                            >
                              <option value="United Kingdom">🇬🇧 United Kingdom</option>
                              <option value="United States">🇺🇸 United States</option>
                              <option value="Germany">🇩🇪 Germany</option>
                              <option value="France">🇫🇷 France</option>
                              <option value="Japan">🇯🇵 Japan</option>
                              <option value="Canada">🇨🇦 Canada</option>
                              <option value="Australia">🇦🇺 Australia</option>
                              <option value="Netherlands">🇳🇱 Netherlands</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handleSaveAddress(selectedOrder.id)}
                            className="w-full bg-black text-yellow-300 font-bold text-[10px] py-1 border border-black uppercase cursor-pointer"
                          >
                            SAVE DESTINATION
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-black">{selectedOrder.customer.name}</p>
                          <p className="font-typewriter text-neutral-800 text-[11px]">
                            {selectedOrder.customer.street}<br />
                            {selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zip}<br />
                            {selectedOrder.customer.country}
                          </p>
                          <p className="text-neutral-600 text-[10px] pt-1">EMAIL: {selectedOrder.customer.email}</p>
                        </>
                      )}
                    </div>

                    {/* Financials */}
                    <div className="border border-black p-2.5 bg-white space-y-1">
                      <span className="font-bold text-[10px] text-neutral-500 block uppercase">FINANCIAL SETTLEMENT (GBP)</span>
                      <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>£{selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>DISCOUNT:</span>
                          <span>-£{selectedOrder.discount.toFixed(2)} ({selectedOrder.promoCode})</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>DISPATCH FEE:</span>
                        <span>{selectedOrder.shippingFee === 0 ? 'FREE' : `£${selectedOrder.shippingFee.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500 text-[10px] border-t border-dashed border-neutral-300 pt-0.5">
                        <span>INCL. 20% UK VAT:</span>
                        <span>£{((selectedOrder.total * 0.20) / 1.20).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                        <span>FINAL TOTAL:</span>
                        <span>£{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-neutral-600 pt-1">
                        METHOD: {selectedOrder.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    {/* Carrier & Tracking Editor */}
                    <div className="border border-black p-2.5 bg-white space-y-2">
                      <span className="font-bold text-[10px] text-neutral-500 block uppercase">CARRIER & WAYBILL</span>
                      <div>
                        <label className="block text-[9px] text-neutral-500">CARRIER ROUTE</label>
                        <select
                          value={selectedOrder.carrier || 'Royal Mail Tracked 24'}
                          onChange={(e) => handleUpdateTracking(selectedOrder.id, e.target.value, selectedOrder.trackingNumber || '')}
                          className="w-full border border-black p-1 text-xs outline-none bg-neutral-50 cursor-pointer"
                        >
                          <option value="Royal Mail Tracked 24">Royal Mail Tracked 24 (UK)</option>
                          <option value="Royal Mail Tracked 48">Royal Mail Tracked 48 (UK)</option>
                          <option value="DPD UK Next Day">DPD UK Next Day</option>
                          <option value="DHL Express International">DHL Express International</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-neutral-500">TRACKING NUMBER</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            defaultValue={selectedOrder.trackingNumber || ''}
                            onBlur={(e) => handleUpdateTracking(selectedOrder.id, selectedOrder.carrier || 'USPS Priority Mail', e.target.value)}
                            placeholder="e.g. 94001118992238491"
                            className="flex-1 border border-black px-1.5 py-0.5 text-xs font-mono-tag outline-none"
                          />
                        </div>
                      </div>

                      {/* Status Override */}
                      <div className="pt-1 flex gap-1">
                        {(['pending', 'processing', 'shipped', 'delivered'] as OrderStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                            className={`flex-1 py-1 text-[9px] font-bold uppercase border border-black ${
                              selectedOrder.status === st ? 'bg-black text-yellow-300' : 'bg-neutral-100 hover:bg-neutral-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {selectedOrder.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="w-full mt-1.5 bg-red-100 hover:bg-red-600 hover:text-white text-red-800 border border-red-600 py-1 text-[9px] font-bold uppercase transition-all"
                        >
                          ✕ CANCEL ORDER & RESTORE STOCK
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Print Slip Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => window.print()}
                      className="bg-black text-yellow-300 font-headline font-bold text-xs px-4 py-2 border border-black shadow-xs hover:bg-neutral-800 uppercase"
                    >
                      🖨️ PRINT ZINE PACKING SLIP
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVENTORY & STOCK MATRIX */}
          {activeTab === 'inventory' && (
            <div className="space-y-3 font-mono-tag">
              {/* Valuation & Alerts Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">TOTAL STORE UNITS</span>
                  <span className="font-headline font-black text-xl text-black">{inventoryMetrics.totalUnits} PCS</span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">INVENTORY VALUATION</span>
                  <span className="font-headline font-black text-xl text-black">£{inventoryMetrics.totalValue.toFixed(2)}</span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">LOW STOCK SKUS (&lt; 5)</span>
                  <span className="font-headline font-black text-xl text-yellow-600">
                    {inventory.filter((it) => it.lowStockSizes?.length > 0).length} GARMENTS
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">SOLD OUT SKUS</span>
                  <span className="font-headline font-black text-xl text-red-600">
                    {inventory.filter((it) => it.soldOutSizes?.length > 0).length} SIZES
                  </span>
                </div>
              </div>

              {/* Stock Breakdown Table */}
              <div className="border-2 border-black bg-white overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-neutral-900 text-yellow-300 font-bold border-b-2 border-black">
                      <th className="p-2 border-r border-neutral-700">GARMENT TITLE</th>
                      <th className="p-2 border-r border-neutral-700">CATEGORY</th>
                      <th className="p-2 border-r border-neutral-700">FABRIC / GSM</th>
                      <th className="p-2 border-r border-neutral-700">UNIT PRICE</th>
                      <th className="p-2 border-r border-neutral-700">SIZE MATRIX & STOCK ADJUSTMENT</th>
                      <th className="p-2">TOTAL UNITS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-200 hover:bg-yellow-50">
                        <td className="p-2 border-r border-neutral-200 font-bold text-black">
                          {item.title}
                        </td>
                        <td className="p-2 border-r border-neutral-200 text-neutral-600 uppercase text-[11px]">
                          {item.category}
                        </td>
                        <td className="p-2 border-r border-neutral-200 font-typewriter text-[11px]">
                          {item.gsm}
                        </td>
                        <td className="p-2 border-r border-neutral-200 font-bold">
                          £{item.price.toFixed(2)}
                        </td>
                        <td className="p-2 border-r border-neutral-200">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(item.stock || {}).map(([sz, qty]: [string, any]) => (
                              <div
                                key={sz}
                                className={`border px-1.5 py-0.5 flex items-center gap-1.5 text-[10px] ${
                                  qty === 0
                                    ? 'bg-red-100 border-red-500 text-red-700'
                                    : qty <= 5
                                    ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                                    : 'bg-neutral-100 border-neutral-300 text-black'
                                }`}
                              >
                                <span className="font-bold">{sz}:</span>
                                <span className="font-mono-tag font-black">{qty}</span>
                                <div className="flex gap-0.5 ml-1">
                                  <button
                                    onClick={() => handleAdjustStock(item.id, sz, -1)}
                                    className="w-3.5 h-3.5 bg-neutral-300 hover:bg-neutral-400 text-black flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={() => handleAdjustStock(item.id, sz, 1)}
                                    className="w-3.5 h-3.5 bg-black text-white hover:bg-neutral-800 flex items-center justify-center font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 font-black text-black">
                          {item.totalUnits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG & PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4 font-mono-tag">
              <div className="flex justify-between items-center bg-white border-2 border-black p-3">
                <div>
                  <h3 className="font-headline font-bold text-base text-black uppercase">
                    ARCHIVE PRODUCT CATALOG
                  </h3>
                  <p className="text-neutral-600 text-xs font-typewriter">
                    Add new heavyweight streetwear designs with custom specs, sizes, and stock limits.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewProductOpen(true)}
                  className="bg-black text-yellow-300 font-headline font-bold text-xs px-4 py-2 border border-black shadow-xs hover:bg-neutral-800 uppercase flex items-center gap-1"
                >
                  <span>+</span>
                  <span>ADD NEW GARMENT</span>
                </button>
              </div>

              {/* Add Product Modal / Form */}
              {isNewProductOpen && (
                <form onSubmit={handleCreateProduct} className="border-3 border-black bg-white p-4 space-y-3 shadow-[3px_3px_0px_#000]">
                  <div className="flex justify-between items-center border-b border-black pb-2">
                    <span className="font-headline font-bold text-sm text-black uppercase">
                      NEW GARMENT SPECIFICATION
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNewProductOpen(false)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      ✕ CANCEL
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">GARMENT TITLE</label>
                      <input
                        required
                        type="text"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                        placeholder="e.g. MINERAL WASH TEE"
                        className="w-full border border-black p-1.5 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">CATEGORY</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full border border-black p-1.5 outline-none bg-white"
                      >
                        <option value="shirts">Shirts & Thermals</option>
                        <option value="hoodies">Heavy Hoodies</option>
                        <option value="sweatshirts">Sweatshirts</option>
                        <option value="pants">Duck Canvas Pants</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">RETAIL PRICE ($ USD)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-black p-1.5 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">FABRIC WEIGHT (GSM / OZ)</label>
                      <input
                        type="text"
                        value={newProduct.gsm}
                        onChange={(e) => setNewProduct({ ...newProduct, gsm: e.target.value })}
                        className="w-full border border-black p-1.5 outline-none font-typewriter"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">FABRIC BLEND</label>
                      <input
                        type="text"
                        value={newProduct.fabric}
                        onChange={(e) => setNewProduct({ ...newProduct, fabric: e.target.value })}
                        className="w-full border border-black p-1.5 outline-none font-typewriter"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">FIT PROFILE</label>
                      <input
                        type="text"
                        value={newProduct.fit}
                        onChange={(e) => setNewProduct({ ...newProduct, fit: e.target.value })}
                        className="w-full border border-black p-1.5 outline-none font-typewriter"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-neutral-600 text-[10px] mb-0.5">AVAILABLE SIZES (COMMA SEPARATED)</label>
                      <input
                        type="text"
                        value={newProduct.sizes}
                        onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                        className="w-full border border-black p-1.5 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 text-[10px] mb-0.5">INITIAL STOCK PER SIZE</label>
                      <input
                        type="number"
                        value={newProduct.initialStock}
                        onChange={(e) => setNewProduct({ ...newProduct, initialStock: parseInt(e.target.value) || 0 })}
                        className="w-full border border-black p-1.5 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-[#fff500] font-headline font-bold text-xs py-2 border-2 border-black uppercase tracking-wider hover:bg-neutral-800"
                  >
                    DEPLOY GARMENT TO LIVE CATALOG ➔
                  </button>
                </form>
              )}

              {/* Existing Catalog List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-white border-2 border-black p-3 flex justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[9px] font-bold text-yellow-800 bg-yellow-200 px-1 py-0.2 border border-black uppercase">
                        {item.category}
                      </span>
                      <h4 className="font-headline font-black text-sm text-black uppercase mt-1">
                        {item.title}
                      </h4>
                      <p className="text-neutral-600 text-[11px] font-typewriter">
                        {item.gsm} // £{item.price.toFixed(2)} GBP
                      </p>
                      <div className="text-[10px] text-neutral-500 pt-1">
                        TOTAL IN STOCK: <strong className="text-black">{item.totalUnits}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end">
                      <span className="font-bold text-black text-sm">£{item.price.toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                          }}
                          className="text-[10px] text-black underline font-bold"
                        >
                          MANAGE SIZES →
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="text-[10px] text-red-600 hover:text-red-800 underline font-bold"
                          title="Purge product from catalog"
                        >
                          [DELETE]
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MARKETING, PROMOS & AUDIENCE */}
          {activeTab === 'marketing' && (
            <div className="space-y-4 font-mono-tag">
              
              {/* Promo Codes Engine */}
              <div className="bg-white border-2 border-black p-3 space-y-3">
                <div className="flex justify-between items-center border-b border-black pb-1.5">
                  <h3 className="font-headline font-black text-sm text-black uppercase">
                    PROMOTION & DISCOUNT CODES ENGINE
                  </h3>
                  <span className="text-[10px] text-neutral-500">LIVE REDEEMABLE AT CHECKOUT</span>
                </div>

                {/* Create Promo Code Form */}
                <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-yellow-50 border border-black p-2.5">
                  <div>
                    <label className="block text-[9px] text-neutral-600 mb-0.5">CODE</label>
                    <input
                      required
                      type="text"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value)}
                      placeholder="e.g. ZINE25"
                      className="w-full bg-white border border-black p-1 text-xs uppercase font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-600 mb-0.5">DISCOUNT %</label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={100}
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-black p-1 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-600 mb-0.5">DESCRIPTION</label>
                    <input
                      type="text"
                      value={newPromoDesc}
                      onChange={(e) => setNewPromoDesc(e.target.value)}
                      placeholder="Flash 25% Off Drop"
                      className="w-full bg-white border border-black p-1 text-xs outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-black text-yellow-300 font-headline font-bold text-xs py-1.5 border border-black uppercase hover:bg-neutral-800"
                    >
                      + CREATE CODE
                    </button>
                  </div>
                </form>

                {/* Promo Codes Table */}
                <table className="w-full text-left text-xs border border-black">
                  <thead>
                    <tr className="bg-neutral-900 text-yellow-300 font-bold">
                      <th className="p-1.5 border-r border-neutral-700">CODE</th>
                      <th className="p-1.5 border-r border-neutral-700">DISCOUNT</th>
                      <th className="p-1.5 border-r border-neutral-700">DESCRIPTION</th>
                      <th className="p-1.5 border-r border-neutral-700">REDEMPTIONS</th>
                      <th className="p-1.5 border-r border-neutral-700">STATUS</th>
                      <th className="p-1.5">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.code} className="border-b border-neutral-200">
                        <td className="p-1.5 font-bold text-black border-r border-neutral-200">{p.code}</td>
                        <td className="p-1.5 font-black text-green-700 border-r border-neutral-200">{p.discountPercent}% OFF</td>
                        <td className="p-1.5 text-neutral-700 border-r border-neutral-200 text-[11px]">{p.description}</td>
                        <td className="p-1.5 border-r border-neutral-200">{p.usedCount} / {p.maxUses} uses</td>
                        <td className="p-1.5 border-r border-neutral-200">
                          <span className="bg-green-100 text-green-800 px-1 py-0.2 text-[9px] font-bold border border-green-300">
                            ACTIVE
                          </span>
                        </td>
                        <td className="p-1.5">
                          <button
                            onClick={() => handleDeletePromo(p.code)}
                            className="text-red-600 hover:underline text-[10px] font-bold"
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Drop Announcement Banner Editor */}
              {dropBanner && (
                <form onSubmit={handleSaveBanner} className="bg-white border-2 border-black p-3 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-black pb-1.5">
                    <h3 className="font-headline font-black text-sm text-black uppercase">
                      STOREFRONT PINNED DROP BANNER MANAGER
                    </h3>
                    <span className="text-[10px] text-neutral-500">CONTROLS FIXED BOTTOM BANNER</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] text-neutral-600 mb-0.5">BANNER TAG</label>
                      <input
                        type="text"
                        value={dropBanner.tag}
                        onChange={(e) => setDropBanner({ ...dropBanner, tag: e.target.value })}
                        className="w-full border border-black p-1 text-xs outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] text-neutral-600 mb-0.5">ANNOUNCEMENT TEXT</label>
                      <input
                        type="text"
                        value={dropBanner.message}
                        onChange={(e) => setDropBanner({ ...dropBanner, message: e.target.value })}
                        className="w-full border border-black p-1 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-black text-yellow-300 font-headline font-bold text-xs px-4 py-1.5 border border-black uppercase hover:bg-neutral-800"
                  >
                    SAVE & BROADCAST TO PINNED BANNER ➔
                  </button>
                </form>
              )}

              {/* VIP Subscribers List */}
              <div className="bg-white border-2 border-black p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-black pb-1.5">
                  <h3 className="font-headline font-black text-sm text-black uppercase">
                    NEWSLETTER & DROP WAITLIST SUBSCRIBERS ({subscribers.length})
                  </h3>
                  <button
                    onClick={() => showToast('✓ CSV exported to download folder')}
                    className="text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 border border-black"
                  >
                    EXPORT CSV
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                  {subscribers.map((s, idx) => (
                    <div key={idx} className="flex justify-between border-b border-dashed border-neutral-200 pb-0.5 text-[11px]">
                      <span className="font-typewriter">{s.email}</span>
                      <span className="text-neutral-500 text-[10px]">{s.source} // {new Date(s.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: ANALYTICS & INTELLIGENCE */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-3 font-mono-tag">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">GROSS REVENUE</span>
                  <span className="font-headline font-black text-xl text-black">£{analytics.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">TOTAL ORDERS</span>
                  <span className="font-headline font-black text-xl text-black">{analytics.totalOrders} ORDERS</span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">UNITS DISPATCHED</span>
                  <span className="font-headline font-black text-xl text-black">{analytics.totalUnitsSold} UNITS</span>
                </div>
                <div className="bg-white border-2 border-black p-3 shadow-xs">
                  <span className="text-[10px] text-neutral-500 block uppercase">AVERAGE ORDER VALUE (AOV)</span>
                  <span className="font-headline font-black text-xl text-black">£{analytics.averageOrderValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Pipeline Status Visualizer */}
              <div className="bg-white border-2 border-black p-3 space-y-2">
                <h4 className="font-headline font-bold text-xs text-black uppercase">
                  ORDER PIPELINE STATUS BREAKDOWN
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="border border-black p-2 bg-[#fcfbf7]">
                      <span className="text-[10px] text-neutral-500 uppercase block">{status}</span>
                      <span className="font-headline font-black text-lg text-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white border-2 border-black p-3 space-y-2">
                <h4 className="font-headline font-bold text-xs text-black uppercase">
                  TOP PERFORMING GARMENTS (BY REVENUE)
                </h4>
                <div className="space-y-1.5">
                  {analytics.topProducts.map((tp, rank) => (
                    <div key={tp.id} className="flex justify-between items-center border-b border-dashed border-neutral-300 pb-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-black text-yellow-300 font-bold flex items-center justify-center text-[10px]">
                          #{rank + 1}
                        </span>
                        <span className="font-bold text-black">{tp.title}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-neutral-600">{tp.unitsSold} units</span>
                        <span className="font-black text-black">£{tp.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION & FEEDBACK */}
          {activeTab === 'reviews' && (
            <div className="space-y-3 font-mono-tag">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border-2 border-black p-3 gap-2">
                <div>
                  <h3 className="font-headline font-black text-base text-black uppercase">
                    COMMUNITY STREET REVIEWS // MODERATION
                  </h3>
                  <p className="text-neutral-600 text-xs font-typewriter">
                    Inspect, approve, or purge customer reviews submitted across the catalog.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-600">FILTER:</span>
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value)}
                    className="border-2 border-black px-2 py-1 text-xs font-mono-tag bg-neutral-50 outline-none"
                  >
                    <option value="all">ALL RATINGS</option>
                    <option value="5">5 STARS ONLY</option>
                    <option value="4">4 STARS & ABOVE</option>
                    <option value="verified">VERIFIED PURCHASERS</option>
                  </select>
                </div>
              </div>

              {/* Review Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white border-2 border-black p-2.5 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase block">TOTAL REVIEWS</span>
                  <span className="font-headline font-black text-lg text-black">{reviews.length} ENTRIES</span>
                </div>
                <div className="bg-white border-2 border-black p-2.5 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase block">AVERAGE SCORE</span>
                  <span className="font-headline font-black text-lg text-black">
                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} / 5.0
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-2.5 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase block">VERIFIED BUYERS</span>
                  <span className="font-headline font-black text-lg text-black">
                    {reviews.filter((r) => r.verifiedPurchase).length}
                  </span>
                </div>
                <div className="bg-white border-2 border-black p-2.5 shadow-xs">
                  <span className="text-[10px] text-neutral-500 uppercase block">COMMUNITY LIKES</span>
                  <span className="font-headline font-black text-lg text-black">
                    {reviews.reduce((acc, r) => acc + (r.likes || 0), 0)}
                  </span>
                </div>
              </div>

              {/* Review Items List */}
              <div className="space-y-2.5">
                {reviews
                  .filter((r) => {
                    if (reviewFilter === '5') return r.rating === 5;
                    if (reviewFilter === '4') return r.rating >= 4;
                    if (reviewFilter === 'verified') return r.verifiedPurchase;
                    return true;
                  })
                  .map((rev) => {
                    const matchedProduct = inventory.find((p) => p.id === rev.productId);
                    return (
                      <div
                        key={rev.id}
                        className="bg-white border-2 border-black p-3 flex flex-col md:flex-row justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-black text-[#fff500] text-[9px] font-bold px-1.5 py-0.5 uppercase">
                              {matchedProduct ? matchedProduct.title : rev.productId.toUpperCase()}
                            </span>
                            <span className="font-bold text-xs text-black">{rev.author}</span>
                            {rev.city && (
                              <span className="text-neutral-500 text-[10px]">[{rev.city}]</span>
                            )}
                            {rev.verifiedPurchase && (
                              <span className="bg-[#feef89] border border-black text-[9px] font-bold px-1 py-0.2 uppercase">
                                ✓ VERIFIED ARCHIVE BUYER
                              </span>
                            )}
                            <span className="text-neutral-400 text-[10px] ml-auto">{rev.createdAt}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex text-black text-xs font-black tracking-widest">
                              {'★'.repeat(rev.rating)}
                              <span className="text-neutral-300">{'★'.repeat(5 - rev.rating)}</span>
                            </div>
                            {rev.fitAssessment && (
                              <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-400 text-neutral-800 uppercase font-mono-tag">
                                FIT: {rev.fitAssessment}
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-500">
                              👍 {rev.likes || 0} helpful votes
                            </span>
                          </div>

                          <p className="font-typewriter text-xs text-neutral-800 bg-[#fdfbf7] p-2 border border-neutral-300">
                            "{rev.comment}"
                          </p>
                        </div>

                        <div className="flex md:flex-col justify-end items-end gap-1.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200">
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-800 border border-red-600 px-2.5 py-1 text-[10px] font-bold uppercase transition-all"
                          >
                            [PURGE REVIEW]
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {reviews.length === 0 && (
                  <div className="text-center p-8 bg-white border-2 border-black">
                    <p className="font-headline font-bold text-sm text-neutral-600 uppercase">
                      NO REVIEWS LOGGED IN ARCHIVE
                    </p>
                    <p className="font-typewriter text-xs text-neutral-500 mt-1">
                      Customer ratings will stream into this console automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: META TAG MANAGER (SEO & SOCIAL OPENGRAPH) */}
          {activeTab === 'meta' && (
            <MetaTagManager
              products={products.length > 0 ? products : inventory}
              onMetaUpdated={onMetaUpdated}
              showToast={showToast}
            />
          )}

          {/* TAB 8: WAITLIST (NOTIFY ME) DEMAND QUEUE */}
          {activeTab === 'waitlist' && (
            <div className="space-y-4 font-mono-tag">
              {/* Header & Quick Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border-2 border-black shadow-[3px_3px_0px_#000]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-yellow-400 border border-black rounded-full animate-ping" />
                    <h3 className="font-headline font-black text-base text-black uppercase tracking-tight">
                      ARCHIVE RESTOCK WAITLIST // "NOTIFY ME" DEMAND TRACKER
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-600 font-typewriter mt-0.5">
                    Customer drop alerts and restock demand recorded from storefront "Notify Me" buttons.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsManualWaitlistOpen(true)}
                    className="px-3 py-1.5 bg-black text-yellow-300 border-2 border-black font-headline font-bold text-xs uppercase hover:bg-neutral-800 active:translate-y-0.5 cursor-pointer shadow-xs"
                  >
                    + ADD MANUAL REQUEST
                  </button>
                  <button
                    onClick={() => handleBatchNotify()}
                    disabled={waitlist.filter((w) => w.status === 'waiting').length === 0}
                    className="px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-headline font-black text-xs uppercase active:translate-y-0.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Dispatch notifications to all pending customers"
                  >
                    ⚡ BATCH DISPATCH ALERTS ({waitlist.filter((w) => w.status === 'waiting').length})
                  </button>
                  <button
                    onClick={handleExportWaitlistCsv}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black font-bold text-xs uppercase active:translate-y-0.5 cursor-pointer shadow-xs"
                    title="Export waitlist to CSV"
                  >
                    ↓ EXPORT CSV
                  </button>
                </div>
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                    TOTAL SIGNUPS
                  </span>
                  <span className="font-headline font-black text-2xl text-black">
                    {waitlist.length}
                  </span>
                  <span className="text-[9px] text-neutral-500 block mt-0.5 font-typewriter">
                    All-time waitlist logs
                  </span>
                </div>

                <div className="p-3 bg-[#feef89] border-2 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[9px] uppercase font-bold text-neutral-800 block">
                    PENDING RESTOCK ALERTS
                  </span>
                  <span className="font-headline font-black text-2xl text-black">
                    {waitlist.filter((w) => w.status === 'waiting').length}
                  </span>
                  <span className="text-[9px] text-neutral-700 block mt-0.5 font-typewriter">
                    Awaiting drop restock
                  </span>
                </div>

                <div className="p-3 bg-emerald-100 border-2 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                    ALERTS DISPATCHED
                  </span>
                  <span className="font-headline font-black text-2xl text-emerald-900">
                    {waitlist.filter((w) => w.status === 'notified').length}
                  </span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5 font-typewriter">
                    Notified customers
                  </span>
                </div>

                <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                    HIGHEST DEMAND
                  </span>
                  <span className="font-headline font-black text-xs text-black block truncate mt-1">
                    {(() => {
                      if (waitlist.length === 0) return 'NONE LOGGED';
                      const counts: Record<string, number> = {};
                      waitlist.forEach((w) => {
                        counts[w.productTitle] = (counts[w.productTitle] || 0) + 1;
                      });
                      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                      return top ? `${top[0]} (${top[1]})` : 'NONE';
                    })()}
                  </span>
                  <span className="text-[9px] text-neutral-500 block font-typewriter">
                    Most requested archive drop
                  </span>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                  <span className="text-xs font-bold text-black uppercase">SEARCH:</span>
                  <input
                    type="text"
                    value={waitlistSearch}
                    onChange={(e) => setWaitlistSearch(e.target.value)}
                    placeholder="Search by customer email, piece, or size..."
                    className="w-full bg-[#fbf9f3] border-2 border-black px-2.5 py-1 text-xs font-mono outline-none focus:bg-yellow-50"
                  />
                  {waitlistSearch && (
                    <button
                      onClick={() => setWaitlistSearch('')}
                      className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 text-xs font-bold border border-black"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">STATUS:</span>
                    <select
                      value={waitlistStatusFilter}
                      onChange={(e) => setWaitlistStatusFilter(e.target.value as any)}
                      className="bg-white border-2 border-black px-2 py-1 text-xs font-mono outline-none cursor-pointer"
                    >
                      <option value="all">ALL ({waitlist.length})</option>
                      <option value="waiting">
                        WAITING ONLY ({waitlist.filter((w) => w.status === 'waiting').length})
                      </option>
                      <option value="notified">
                        NOTIFIED ({waitlist.filter((w) => w.status === 'notified').length})
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-black">GARMENT:</span>
                    <select
                      value={waitlistProductFilter}
                      onChange={(e) => setWaitlistProductFilter(e.target.value)}
                      className="bg-white border-2 border-black px-2 py-1 text-xs font-mono outline-none cursor-pointer max-w-[170px] truncate"
                    >
                      <option value="all">ALL GARMENTS</option>
                      {Array.from(new Set(waitlist.map((w) => w.productId))).map((pid) => {
                        const match = waitlist.find((w) => w.productId === pid);
                        return (
                          <option key={pid} value={pid}>
                            {match?.productTitle || pid}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={loadWaitlist}
                    className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 border border-black text-xs font-bold uppercase cursor-pointer"
                  >
                    ↻ REFRESH
                  </button>
                </div>
              </div>

              {/* Waitlist Entries Table */}
              <div className="border-2 border-black bg-white shadow-[3px_3px_0px_#000] overflow-x-auto">
                {(() => {
                  const filtered = waitlist.filter((item) => {
                    if (waitlistStatusFilter !== 'all' && item.status !== waitlistStatusFilter) {
                      return false;
                    }
                    if (waitlistProductFilter !== 'all' && item.productId !== waitlistProductFilter) {
                      return false;
                    }
                    if (waitlistSearch) {
                      const q = waitlistSearch.toLowerCase();
                      return (
                        item.email.toLowerCase().includes(q) ||
                        item.productTitle.toLowerCase().includes(q) ||
                        (item.size && item.size.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center p-8 bg-[#fbf9f3] bg-notebook-paper">
                        <p className="font-headline font-black text-sm text-black uppercase">
                          NO WAITLIST ENTRIES MATCH FILTER
                        </p>
                        <p className="text-xs text-neutral-600 font-typewriter mt-1 max-w-sm mx-auto">
                          Customers who click "Notify Me" on out-of-stock items will appear here immediately.
                        </p>
                        <button
                          onClick={() => setIsManualWaitlistOpen(true)}
                          className="mt-3 px-3 py-1.5 bg-black text-yellow-300 font-headline font-bold text-xs uppercase border-2 border-black inline-block cursor-pointer shadow-xs"
                        >
                          + CREATE MANUAL WAITLIST ENTRY
                        </button>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black text-yellow-300 font-headline font-black uppercase text-[10px] tracking-wider border-b-2 border-black">
                          <th className="p-2.5">CUSTOMER EMAIL</th>
                          <th className="p-2.5">REQUESTED GARMENT</th>
                          <th className="p-2.5 text-center">SIZE</th>
                          <th className="p-2.5">LOGGED DATE</th>
                          <th className="p-2.5 text-center">STATUS</th>
                          <th className="p-2.5 text-right">DISPATCH ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300 font-mono">
                        {filtered.map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-yellow-50/60 transition-colors"
                          >
                            {/* Email */}
                            <td className="p-2.5 font-bold text-black">
                              <div className="flex items-center gap-1.5">
                                <span>{entry.email}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard?.writeText(entry.email);
                                    showToast(`Copied ${entry.email}`);
                                  }}
                                  className="text-[9px] text-neutral-400 hover:text-black font-bold uppercase underline cursor-pointer"
                                  title="Copy email address"
                                >
                                  [COPY]
                                </button>
                              </div>
                            </td>

                            {/* Product */}
                            <td className="p-2.5">
                              <span className="font-headline font-bold text-black uppercase block">
                                {entry.productTitle}
                              </span>
                              {entry.gsm && (
                                <span className="text-[9px] bg-neutral-200 text-neutral-800 px-1 py-0.2 border border-neutral-400 inline-block mt-0.5">
                                  {entry.gsm}
                                </span>
                              )}
                            </td>

                            {/* Size */}
                            <td className="p-2.5 text-center">
                              <span className="font-headline font-black text-xs px-2 py-0.5 bg-black text-yellow-300 border border-black inline-block">
                                {entry.size || 'ANY'}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="p-2.5 text-[10px] text-neutral-600 font-typewriter">
                              {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            {/* Status */}
                            <td className="p-2.5 text-center">
                              {entry.status === 'waiting' ? (
                                <span className="bg-yellow-200 text-yellow-900 border border-yellow-500 font-headline font-black text-[9px] px-2 py-0.5 uppercase inline-block shadow-2xs">
                                  WAITING FOR RESTOCK
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-500 font-headline font-black text-[9px] px-2 py-0.5 uppercase inline-block shadow-2xs">
                                  ✓ NOTIFIED / ALERT SENT
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleNotifyWaitlist(entry.id)}
                                  className={`px-2 py-1 text-[10px] font-headline font-bold border border-black uppercase cursor-pointer shadow-2xs active:translate-y-0.5 ${
                                    entry.status === 'waiting'
                                      ? 'bg-[#feef89] hover:bg-yellow-300 text-black'
                                      : 'bg-white hover:bg-neutral-100 text-neutral-700'
                                  }`}
                                  title={entry.status === 'waiting' ? 'Mark as notified & send alert' : 'Reset status to waiting'}
                                >
                                  {entry.status === 'waiting' ? '🔔 SEND ALERT' : '↺ RESET'}
                                </button>
                                <button
                                  onClick={() => handleDeleteWaitlist(entry.id)}
                                  className="px-2 py-1 text-[10px] font-headline font-bold bg-white hover:bg-red-50 text-red-600 border border-red-400 uppercase cursor-pointer active:translate-y-0.5"
                                  title="Delete waitlist entry"
                                >
                                  PURGE
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Manual Entry Modal */}
              {isManualWaitlistOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
                  <div className="bg-[#fbf9f3] bg-notebook-paper border-2 border-black p-5 max-w-md w-full shadow-[6px_6px_0px_#000]">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                      <h4 className="font-headline font-black text-sm uppercase text-black">
                        MANUAL ARCHIVE RESTOCK ENTRY
                      </h4>
                      <button
                        onClick={() => setIsManualWaitlistOpen(false)}
                        className="w-6 h-6 bg-black text-white font-bold flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddManualWaitlist} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold uppercase text-[10px] text-neutral-700 mb-1">
                          CUSTOMER EMAIL:
                        </label>
                        <input
                          type="email"
                          required
                          value={manualWaitlistEmail}
                          onChange={(e) => setManualWaitlistEmail(e.target.value)}
                          placeholder="shopper@archivezine.co.uk"
                          className="w-full bg-white border-2 border-black px-2.5 py-1.5 font-mono text-xs outline-none focus:bg-yellow-50"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[10px] text-neutral-700 mb-1">
                          GARMENT:
                        </label>
                        <select
                          value={manualWaitlistProductId}
                          onChange={(e) => setManualWaitlistProductId(e.target.value)}
                          className="w-full bg-white border-2 border-black px-2.5 py-1.5 font-mono text-xs outline-none cursor-pointer"
                        >
                          {(products.length > 0 ? products : inventory).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.gsm || '300+ GSM'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[10px] text-neutral-700 mb-1">
                          SIZE:
                        </label>
                        <div className="flex gap-2">
                          {['S', 'M', 'L', 'XL', 'XXL', 'ANY'].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setManualWaitlistSize(sz)}
                              className={`px-3 py-1 font-bold border-2 transition-all cursor-pointer ${
                                manualWaitlistSize === sz
                                  ? 'bg-black text-yellow-300 border-black shadow-xs'
                                  : 'bg-white text-black border-neutral-300'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsManualWaitlistOpen(false)}
                          className="px-3 py-1.5 bg-white border-2 border-neutral-400 font-bold uppercase text-xs"
                        >
                          CANCEL
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-black text-yellow-300 border-2 border-black font-headline font-black uppercase text-xs shadow-xs active:translate-y-0.5"
                        >
                          + ENROLL ON WAITLIST
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
