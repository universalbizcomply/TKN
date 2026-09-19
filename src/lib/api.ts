import { Order, PromoCode, DropBannerConfig, AnalyticsData, ProductItem, MetaTagConfig, WaitlistEntry, SocialFeedPost, SearchAnalyticsSummary, CustomerProfile, InternalStaffUser } from '../types';

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
    isGuest?: boolean;
    createAccount?: boolean;
    accountPassword?: string;
  }): Promise<{ success: boolean; order?: Order; isGuest?: boolean; customer?: CustomerProfile | null; error?: string }> {
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

  // Analytics & Search Intelligence
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

  async trackSearch(query: string, resultCount = 0): Promise<{ success: boolean; summary?: SearchAnalyticsSummary }> {
    try {
      if (!query || query.trim().length < 2) {
        return { success: false };
      }
      const res = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), resultCount }),
      });
      return await res.json();
    } catch (e) {
      console.warn('Failed to track storefront search event', e);
      return { success: false };
    }
  },

  async getSearchAnalytics(): Promise<SearchAnalyticsSummary | null> {
    try {
      const res = await fetch('/api/analytics/search');
      const data = await res.json();
      return data.searchAnalytics || null;
    } catch (e) {
      console.error('Failed to fetch search analytics', e);
      return null;
    }
  },

  async clearSearchAnalytics(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/analytics/search', {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to clear search analytics', e);
      return { success: false };
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

  // Archive Social Feed (Instagram, TikTok, Community Fit Pics, Studio BTS)
  async getSocialFeed(params?: {
    platform?: string;
    category?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    posts: SocialFeedPost[];
    totalCount: number;
    filteredCount: number;
    countsByPlatform: { all: number; instagram: number; tiktok: number };
    countsByCategory: { all: number; 'fit-pic': number; bts: number; community: number };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.platform && params.platform !== 'all') queryParams.append('platform', params.platform);
      if (params?.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);

      const url = `/api/social-feed${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      return {
        success: data.success ?? true,
        posts: data.posts || [],
        totalCount: data.totalCount || 0,
        filteredCount: data.filteredCount || 0,
        countsByPlatform: data.countsByPlatform || { all: 0, instagram: 0, tiktok: 0 },
        countsByCategory: data.countsByCategory || { all: 0, 'fit-pic': 0, bts: 0, community: 0 },
      };
    } catch (e) {
      console.error('Failed to fetch archive social feed', e);
      return {
        success: false,
        posts: [],
        totalCount: 0,
        filteredCount: 0,
        countsByPlatform: { all: 0, instagram: 0, tiktok: 0 },
        countsByCategory: { all: 0, 'fit-pic': 0, bts: 0, community: 0 },
      };
    }
  },

  async likeSocialPost(id: string): Promise<{ success: boolean; likes?: number; hasLiked?: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/social-feed/${id}/like`, {
        method: 'POST',
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Failed to like post' };
    }
  },

  async submitCommunityFitPic(postData: {
    platform: 'instagram' | 'tiktok';
    authorHandle: string;
    authorName?: string;
    caption: string;
    mediaUrl?: string;
    location?: string;
    category?: 'fit-pic' | 'bts' | 'community';
    taggedGarment?: {
      productId?: string;
      productTitle: string;
      gsm?: string;
      price?: number;
    };
  }): Promise<{ success: boolean; message: string; post?: SocialFeedPost }> {
    try {
      const res = await fetch('/api/social-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to submit fit pic' };
    }
  },

  // ==========================================
  // GEMINI AI ASSISTANT & DUAL-ROLE ENGINE
  // ==========================================
  async geminiAdminChat(payload: {
    model?: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
    role?: string;
    messages: Array<{ role: 'user' | 'model'; text: string }>;
  }): Promise<{
    success: boolean;
    text?: string;
    modelUsed?: string;
    actionsExecuted?: Array<{
      success: boolean;
      actionType: string;
      summary: string;
      data?: any;
      error?: string;
    }>;
    snapshot?: any;
    error?: string;
    isQuotaError?: boolean;
  }> {
    try {
      const res = await fetch('/api/gemini/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Admin Chat request failed' };
    }
  },

  async geminiCustomerChat(payload: {
    messages: Array<{ role: 'user' | 'model'; text: string }>;
    customerMode?: 'all' | 'sales' | 'support' | 'qa';
    preferredModel?: string;
  }): Promise<{
    success: boolean;
    text?: string;
    modelUsed?: string;
    suggestedProductIds?: string[];
    orderCard?: any;
    error?: string;
    isQuotaError?: boolean;
  }> {
    try {
      const res = await fetch('/api/gemini/customer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Customer Concierge request failed' };
    }
  },

  async geminiChat(payload: {
    model?: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
    role?: 'creative_director' | 'apparel_stylist' | 'rapid_ops' | 'operations_autopilot';
    systemInstruction?: string;
    messages: Array<{ role: 'user' | 'model'; text: string }>;
  }): Promise<{ success: boolean; text?: string; modelUsed?: string; note?: string; error?: string; isQuotaError?: boolean }> {
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Chat request failed' };
    }
  },

  async geminiImage(payload: {
    prompt: string;
    mode: 'generate' | 'edit';
    aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
    sourceImageBase64?: string;
  }): Promise<{ success: boolean; imageUrl?: string; text?: string; error?: string; isQuotaError?: boolean }> {
    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Image generation/editing failed' };
    }
  },

  async geminiGenerateVideo(payload: {
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    resolution?: '720p' | '1080p';
  }): Promise<{ success: boolean; operationName?: string; modelUsed?: string; error?: string; isQuotaError?: boolean }> {
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Video generation initiation failed' };
    }
  },

  async geminiVideoStatus(operationName: string): Promise<{ success: boolean; done?: boolean; error?: any }> {
    try {
      const res = await fetch('/api/gemini/video-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async geminiVideoDownload(operationName: string): Promise<Blob | null> {
    try {
      const res = await fetch('/api/gemini/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });
      if (!res.ok) throw new Error('Video download failed');
      return await res.blob();
    } catch (e: any) {
      console.error('Download error:', e);
      return null;
    }
  },

  // Internal Authentication (Staff / Manager / Admin)
  async loginInternal(credentials: {
    email: string;
    password: string;
    role?: 'staff' | 'manager' | 'admin';
  }): Promise<{ success: boolean; user?: InternalStaffUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/internal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error logging in' };
    }
  },

  async getInternalStaff(): Promise<{ success: boolean; staff?: InternalStaffUser[]; error?: string }> {
    try {
      const res = await fetch('/api/auth/internal/staff');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Customer Authentication & Profile
  async loginCustomer(credentials: {
    email: string;
    password?: string;
  }): Promise<{ success: boolean; customer?: CustomerProfile; isNew?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sign in' };
    }
  },

  async registerCustomer(customerData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    address?: CustomerProfile['address'];
    measurements?: CustomerProfile['measurements'];
  }): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to register account' };
    }
  },

  async getCustomerProfile(email: string): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await fetch(`/api/customer/profile?email=${encodeURIComponent(email)}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateCustomerProfile(payload: {
    email: string;
    name?: string;
    phone?: string;
    address?: CustomerProfile['address'];
    measurements?: CustomerProfile['measurements'];
    savedPaymentLast4?: string;
  }): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getCustomerOrders(email: string): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
    try {
      const res = await fetch(`/api/customer/orders?email=${encodeURIComponent(email)}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Social & Federated Authentication & Account Linking
  async socialAuthCustomer(data: {
    provider: string;
    email?: string;
    name?: string;
    accountId?: string;
    handle?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; customer?: CustomerProfile; isNew?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/customer/social-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Social sign-in failed' };
    }
  },

  async linkCustomerAccount(payload: {
    email: string;
    provider: string;
    accountId?: string;
    emailOrHandle: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await fetch('/api/customer/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to link account' };
    }
  },

  async unlinkCustomerAccount(payload: {
    email: string;
    provider: string;
  }): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await fetch('/api/customer/unlink-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to unlink account' };
    }
  },
};


