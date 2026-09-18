import { Order, PromoCode, DropBannerConfig, AnalyticsData, ProductItem, MetaTagConfig, WaitlistEntry } from '../types';

export const api = {
  // Products
  async getProducts(): Promise<ProductItem[]> {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      return data.products || [];
    } catch (e) {
      console.error('Failed to fetch products', e);
      return [];
    }
  },

  async updateStock(productId: string, size: string, delta?: number, absoluteStock?: number) {
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size, delta, absoluteStock }),
    });
    return res.json();
  },

  async createProduct(productData: Partial<ProductItem>) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<ProductItem>) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Orders
  async getOrders(status?: string, search?: string): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      return data.orders || [];
    } catch (e) {
      console.error('Failed to fetch orders', e);
      return [];
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      return data.order || null;
    } catch (e) {
      console.error('Failed to fetch order', e);
      return null;
    }
  },

  async createOrder(orderPayload: {
    customer: {
      name: string;
      email: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    items: Array<{
      productId: string;
      title: string;
      size: string;
      colorIndex: number;
      price: number;
      quantity: number;
      gsm?: string;
    }>;
    promoCode?: string;
    paymentMethod: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error creating order' };
    }
  },

  async updateOrderStatus(
    orderId: string,
    updates: {
      status?: string;
      carrier?: string;
      trackingNumber?: string;
      note?: string;
    }
  ) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async cancelOrder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async updateOrderAddress(orderId: string, address: any) {
    const res = await fetch(`/api/orders/${orderId}/address`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    return res.json();
  },

  // Reviews
  async getReviews(productId?: string) {
    try {
      const url = productId ? `/api/reviews?productId=${productId}` : '/api/reviews';
      const res = await fetch(url);
      const data = await res.json();
      return data.reviews || [];
    } catch {
      return [];
    }
  },

  async createReview(reviewData: {
    productId: string;
    author: string;
    rating: number;
    fit: string;
    title: string;
    comment: string;
  }) {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return res.json();
  },

  async deleteReview(id: string) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async likeReview(id: string) {
    const res = await fetch(`/api/reviews/${id}/like`, {
      method: 'POST',
    });
    return res.json();
  },

  // Inventory
  async getInventory(): Promise<{
    totalInventoryUnits: number;
    totalInventoryValue: number;
    inventory: any[];
  }> {
    try {
      const res = await fetch('/api/inventory');
      return res.json();
    } catch (e) {
      console.error('Failed to fetch inventory', e);
      return { totalInventoryUnits: 0, totalInventoryValue: 0, inventory: [] };
    }
  },

  async adjustInventory(productId: string, size: string, delta?: number, newAmount?: number) {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, size, delta, newAmount }),
    });
    return res.json();
  },

  // Marketing
  async getPromos(): Promise<PromoCode[]> {
    try {
      const res = await fetch('/api/marketing/promos');
      const data = await res.json();
      return data.promos || [];
    } catch (e) {
      return [];
    }
  },

  async createPromo(promo: Partial<PromoCode>) {
    const res = await fetch('/api/marketing/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo),
    });
    return res.json();
  },

  async deletePromo(code: string) {
    const res = await fetch(`/api/marketing/promos/${code}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async validatePromo(code: string): Promise<{ success: boolean; promo?: PromoCode; error?: string }> {
    try {
      const res = await fetch('/api/marketing/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Validation failed' };
    }
  },

  async getBanner(): Promise<DropBannerConfig | null> {
    try {
      const res = await fetch('/api/marketing/banner');
      const data = await res.json();
      return data.banner || null;
    } catch (e) {
      return null;
    }
  },

  async updateBanner(banner: Partial<DropBannerConfig>) {
    const res = await fetch('/api/marketing/banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    return res.json();
  },

  async getSubscribers() {
    const res = await fetch('/api/marketing/subscribers');
    return res.json();
  },

  async subscribe(email: string, source = 'storefront') {
    const res = await fetch('/api/marketing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData | null> {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      return data.analytics || null;
    } catch (e) {
      console.error('Failed to fetch analytics', e);
      return null;
    }
  },

  // Meta Tag Manager (SEO & Social Sharing)
  async getMetaTags(): Promise<MetaTagConfig | null> {
    try {
      const res = await fetch('/api/meta-tags');
      const data = await res.json();
      return data.meta || null;
    } catch (e) {
      console.error('Failed to fetch meta tags', e);
      return null;
    }
  },

  async updateMetaTags(updates: Partial<MetaTagConfig>): Promise<{ success: boolean; meta?: MetaTagConfig; error?: string }> {
    try {
      const res = await fetch('/api/meta-tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update meta tags' };
    }
  },

  async resetMetaTags(): Promise<{ success: boolean; meta?: MetaTagConfig; error?: string }> {
    try {
      const res = await fetch('/api/meta-tags/reset', {
        method: 'POST',
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to reset meta tags' };
    }
  },

  async getRawMetaHtml(): Promise<{ success: boolean; html?: string }> {
    try {
      const res = await fetch('/api/meta-tags/raw-html');
      return res.json();
    } catch {
      return { success: false };
    }
  },

  // Waitlist (Notify Me for out-of-stock garments & sizes)
  async getWaitlist(productId?: string, search?: string): Promise<{ success: boolean; waitlist: WaitlistEntry[]; count: number }> {
    try {
      const params = new URLSearchParams();
      if (productId && productId !== 'all') params.append('productId', productId);
      if (search) params.append('search', search);
      const res = await fetch(`/api/waitlist?${params.toString()}`);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch waitlist', e);
      return { success: false, waitlist: [], count: 0 };
    }
  },

  async joinWaitlist(data: {
    productId: string;
    productTitle: string;
    size?: string;
    email: string;
    gsm?: string;
  }): Promise<{ success: boolean; message: string; entry?: WaitlistEntry; error?: string }> {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to join waitlist', message: 'Failed to join waitlist' };
    }
  },

  async deleteWaitlistEntry(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  async notifyWaitlistEntry(id: string): Promise<{ success: boolean; message?: string; entry?: WaitlistEntry }> {
    try {
      const res = await fetch(`/api/waitlist/${id}/notify`, {
        method: 'POST',
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  async batchNotifyWaitlist(productId?: string): Promise<{ success: boolean; notifiedCount: number; message: string }> {
    try {
      const res = await fetch('/api/waitlist/batch-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, notifiedCount: 0, message: 'Batch notification failed' };
    }
  },
};
