export type CategoryId = 'all' | 'best-seller' | 'whats-new' | 'hoodies' | 'shirts' | 'sweatshirts' | 'pants' | 'lookbook';

export type ProductSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export interface ProductAngle {
  label: string;
  sublabel: string;
  tag: string;
  bgClass: string;
  type: 'shirt' | 'hoodie' | 'crew' | 'thermal' | 'pants' | 'lookbook';
  svgVariant?: string;
  detailWeave?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: CategoryId;
  badge?: string;
  totalSlides: number;
  currentSlide: number;
  angles: ProductAngle[];
  gsm: string;
  fabric: string;
  fit: string;
  description: string;
  availableSizes: string[];
  stock?: Record<string, number>;
}

export interface CartItem {
  product: ProductItem;
  selectedSize: string;
  selectedColorIndex: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderCustomer {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  size: string;
  colorIndex: number;
  price: number;
  quantity: number;
  gsm?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode?: string;
  paymentMethod: 'card' | 'apple_pay' | 'cash_on_delivery' | 'crypto';
  status: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  timeline: OrderTimeline[];
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  description: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
}

export interface DropBannerConfig {
  tag: string;
  message: string;
  ctaText: string;
  dropDate: string;
  active: boolean;
}

export interface AnalyticsData {
  grossRevenue: number;
  totalOrders: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  totalInventoryUnits: number;
  totalInventoryValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: { id: string; title: string; unitsSold: number; revenue: number }[];
}

export type ViewMode = 'store' | 'admin' | 'tracking';
export type AdminTab = 'orders' | 'inventory' | 'marketing' | 'analytics' | 'products' | 'reviews' | 'meta' | 'waitlist';

export interface WaitlistEntry {
  id: string;
  productId: string;
  productTitle: string;
  size?: string;
  email: string;
  createdAt: string;
  status: 'waiting' | 'notified';
  gsm?: string;
}

export interface MetaTagConfig {
  title: string;
  description: string;
  canonicalBaseUrl: string;
  canonicalPathRule: 'root' | 'preserve_path' | 'preserve_query';
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  ogType: string;
  siteName: string;
  twitterCard: 'summary_large_image' | 'summary';
  twitterSite: string;
  twitterCreator: string;
  robots: string;
  locale: string;
  themeColor: string;
  enableStructuredData: boolean;
  keywords: string;
  updatedAt: string;
}

export type FitRating = 'small' | 'true-to-size' | 'oversized';

export interface ProductReview {
  id: string;
  productId: string;
  productTitle: string;
  author: string;
  rating: number; // 1 to 5
  fit: FitRating;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  likes: number;
}
