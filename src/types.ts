export type CategoryId = 'all' | 'best-seller' | 'whats-new' | 'hoodies' | 'shirts' | 'sweatshirts' | 'pants' | 'lookbook' | 'social';

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

export interface SearchAnalyticsTerm {
  term: string;
  count: number;
  resultCount: number;
  hasResults: boolean;
  lastSearchedAt: string;
  category?: string;
  recommendation?: string;
}

export interface SearchAnalyticsSummary {
  totalSearches: number;
  uniqueTermsCount: number;
  zeroResultCount: number;
  zeroResultRate: number;
  topSearchTerms: SearchAnalyticsTerm[];
  unmetDemandTerms: SearchAnalyticsTerm[];
  recentQueries: Array<{
    id: string;
    term: string;
    resultCount: number;
    timestamp: string;
  }>;
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
  searchAnalytics?: SearchAnalyticsSummary;
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

export type SocialPlatform = 'instagram' | 'tiktok';
export type SocialFeedCategory = 'all' | 'fit-pic' | 'bts' | 'community';

export interface SocialFeedPost {
  id: string;
  platform: SocialPlatform;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  category: 'fit-pic' | 'bts' | 'community';
  caption: string;
  timestamp: string;
  likes: number;
  hasLiked?: boolean;
  commentsCount: number;
  sharesCount?: number;
  taggedGarment?: {
    productId?: string;
    productTitle: string;
    gsm?: string;
    price?: number;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  videoDuration?: string;
  location?: string;
  aspectRatio?: 'square' | 'portrait';
  isVerified?: boolean;
  tags: string[];
}

export type LinkedAccountProvider = 'google' | 'apple' | 'shoppay' | 'instagram' | 'discord' | 'github';

export interface LinkedAccountItem {
  provider: LinkedAccountProvider;
  accountId: string;
  emailOrHandle: string;
  displayName?: string;
  avatarUrl?: string;
  linkedAt: string;
}

export interface LinkedAccounts {
  google?: LinkedAccountItem;
  apple?: LinkedAccountItem;
  shoppay?: LinkedAccountItem;
  instagram?: LinkedAccountItem;
  discord?: LinkedAccountItem;
  github?: LinkedAccountItem;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  measurements?: {
    heightCm?: number;
    weightKg?: number;
    preferredFit?: 'snug' | 'true-to-size' | 'oversized-boxy' | 'extreme-drop';
    preferredChestInches?: number;
  };
  linkedAccounts?: LinkedAccounts;
  tier: 'ARCHIVE_INITIATE' | 'CORE_PATRON' | 'VIP_ARCHIVE_PATRON';
  ordersCount: number;
  totalSpent: number;
  savedPaymentLast4?: string;
  createdAt: string;
}

export type InternalRole = 'staff' | 'manager' | 'admin';

export interface InternalStaffUser {
  id: string;
  name: string;
  email: string;
  role: InternalRole;
  department: string;
  lastLogin: string;
  permissions: string[];
}
