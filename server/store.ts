// Server In-Memory E-Commerce Store & Admin Operations Engine

export interface ProductStock {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  badge?: string;
  gsm: string;
  fabric: string;
  fit: string;
  description: string;
  availableSizes: string[];
  stock: Record<string, number>;
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

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode?: string;
  paymentMethod: 'card' | 'apple_pay' | 'cash_on_delivery' | 'crypto';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  carrier?: string;
  trackingNumber?: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
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

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  author: string;
  rating: number;
  fit: 'small' | 'true-to-size' | 'oversized';
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  likes: number;
}

export interface DropBannerConfig {
  tag: string;
  message: string;
  ctaText: string;
  dropDate: string;
  active: boolean;
}

export interface SearchEvent {
  id: string;
  query: string;
  resultCount: number;
  timestamp: string;
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

// -------------------------------------------------------------
// SEED STORE DATA
// -------------------------------------------------------------

export let products: ProductStock[] = [
  {
    id: 'acid-box-tee',
    title: 'ACID BOX TEE',
    price: 48.0,
    originalPrice: 60.0,
    category: 'shirts',
    badge: 'HEAVY WASH',
    gsm: '300 GSM',
    fabric: '100% Combed Heavy Jersey',
    fit: 'Boxy Drop-Shoulder Relaxed',
    description: 'Custom mineral acid wash. Double-needle stitched 1.25" neck ribbing that never bacon-curls. Hand-pulled silkscreen back print.',
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { S: 14, M: 22, L: 8, XL: 4, XXL: 0 },
  },
  {
    id: '500gsm-hoodie',
    title: '500GSM HOODIE',
    price: 88.0,
    category: 'hoodies',
    badge: 'BESTSELLER',
    gsm: '500 GSM',
    fabric: 'Ultra-Dense French Terry Fleece',
    fit: 'Structured Boxy with Double Hood',
    description: 'Built like body armor. 100% 480-500GSM Ring-Spun French Terry, Distressed Collar, Hand-Screened in London, UK. No drawstrings, double-layered stiff hood, thick 4" ribbed cuffs.',
    availableSizes: ['S', 'M', 'L', 'XL'],
    stock: { S: 6, M: 18, L: 3, XL: 9 },
  },
  {
    id: 'raw-edge-crew',
    title: 'RAW EDGE CREW',
    price: 72.0,
    category: 'sweatshirts',
    badge: 'HEAVY WEIGHT',
    gsm: '440 GSM',
    fabric: 'Heavy Loopback Cotton',
    fit: 'Relaxed Drop-Armhole',
    description: 'Deconstructed crewneck sweatshirt with raw rolled hem, exposed flatlock chainstitching, and garment dyed heather grey yarn.',
    availableSizes: ['M', 'L', 'XL', 'XXL'],
    stock: { M: 12, L: 15, XL: 5, XXL: 2 },
  },
  {
    id: 'waffle-thermal',
    title: 'WAFFLE THERMAL',
    price: 54.0,
    category: 'shirts',
    badge: 'ARCHIVE STAPLE',
    gsm: '380 GSM',
    fabric: 'Heavy Gauge Honeycomb Knit',
    fit: 'Straight Relaxed',
    description: 'Tactile honeycomb waffle long sleeve. Designed for layering under raw denim jackets or oversized tees with extended ribbed wrist gaiters.',
    availableSizes: ['S', 'M', 'L', 'XL'],
    stock: { S: 19, M: 24, L: 11, XL: 7 },
  },
  {
    id: 'skate-pant',
    title: 'SKATE PANT',
    price: 92.0,
    category: 'pants',
    badge: 'WORKWEAR',
    gsm: '14 OZ',
    fabric: 'Heavy Cotton Duck Canvas',
    fit: 'Relaxed Wide Straight Leg',
    description: 'Indestructible 14oz ring-spun duck canvas with double front knee panels, hammer loop, reinforced tool pocket, and brass rivets.',
    availableSizes: ['30', '32', '34', '36'],
    stock: { '30': 8, '32': 14, '34': 6, '36': 3 },
  },
  {
    id: 'heavy-zip-hoodie',
    title: '550GSM ZIP HOODIE',
    price: 98.0,
    category: 'hoodies',
    badge: 'ARCHIVE SOLD OUT',
    gsm: '550 GSM',
    fabric: 'Ultra-Heavy Diagonal Loop Terry',
    fit: 'Oversized Boxy with #10 YKK Brass Zip',
    description: 'Heavyweight two-way zip hoodie with antique brass hardware, custom fabric pullers, and seamless boxy shoulders. Completely sold out archive edition.',
    availableSizes: ['S', 'M', 'L', 'XL'],
    stock: { S: 0, M: 0, L: 0, XL: 0 },
  },
  {
    id: 'heavy-pocket-tee',
    title: 'HEAVY POCKET TEE',
    price: 44.0,
    category: 'shirts',
    badge: 'RESTOCK',
    gsm: '320 GSM',
    fabric: '100% Carded Ring-Spun Cotton',
    fit: 'Square Boxy Cut',
    description: 'Reinforced patch chest pocket with hidden pencil slot. Pre-shrunk industrial wash to eliminate shrinkage.',
    availableSizes: ['S', 'M', 'L', 'XL'],
    stock: { S: 5, M: 8, L: 0, XL: 3 },
  },
  {
    id: 'lookbook-01',
    title: 'LOOKBOOK #01',
    price: 0,
    category: 'lookbook',
    badge: 'ARCHIVE PIC',
    gsm: 'PHOTO ARCHIVE',
    fabric: 'On-Body Editorial Print',
    fit: 'Editorial Skate Session',
    description: 'Archived polaroid photo study from the Downtown London DIY Skate drop. Features full ensemble fit: 500GSM Charcoal Hoodie paired with Duck Canvas Carpenter Pants.',
    availableSizes: ['FIT INSP.'],
    stock: { 'FIT INSP.': 999 },
  },
];

export let orders: Order[] = [
  {
    id: 'TKN-9021',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    customer: {
      name: 'Callum Davies',
      email: 'callum.davies@hackneyskate.co.uk',
      street: '14 Redchurch Street, Shoreditch',
      city: 'London',
      state: 'Greater London',
      zip: 'E2 7DD',
      country: 'United Kingdom',
    },
    items: [
      {
        productId: '500gsm-hoodie',
        title: '500GSM HOODIE',
        size: 'L',
        colorIndex: 0,
        price: 88.0,
        quantity: 1,
        gsm: '500 GSM',
      },
      {
        productId: 'acid-box-tee',
        title: 'ACID BOX TEE',
        size: 'L',
        colorIndex: 0,
        price: 48.0,
        quantity: 1,
        gsm: '300 GSM',
      },
    ],
    subtotal: 136.0,
    discount: 20.4,
    shippingFee: 0,
    total: 115.6,
    promoCode: 'NOTHING26',
    paymentMethod: 'card',
    status: 'shipped',
    carrier: 'Royal Mail Tracked 24',
    trackingNumber: 'GB-RM-940028192UK',
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 28).toISOString(), note: 'Order slip printed in London studio' },
      { status: 'processing', timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), note: 'Garment silkscreen inspected & packaged with zine sticker pack' },
      { status: 'shipped', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), note: 'Handed to Royal Mail East London Mail Centre' },
    ],
  },
  {
    id: 'TKN-8492',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    customer: {
      name: 'Maya Lin',
      email: 'maya.lin@berlinzine.de',
      street: 'Kastanienallee 42',
      city: 'Berlin',
      state: 'BE',
      zip: '10435',
      country: 'Germany',
    },
    items: [
      {
        productId: 'skate-pant',
        title: 'SKATE PANT',
        size: '32',
        colorIndex: 0,
        price: 92.0,
        quantity: 1,
        gsm: '14 OZ',
      },
    ],
    subtotal: 92.0,
    discount: 0,
    shippingFee: 12.0,
    total: 104.0,
    paymentMethod: 'apple_pay',
    status: 'processing',
    carrier: 'DHL Express International',
    trackingNumber: 'DHL-DE-99238102',
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 14).toISOString(), note: 'Payment settled via Apple Pay' },
      { status: 'processing', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), note: 'Duck canvas hemmed & double-rivet inspected at London workshop' },
    ],
  },
  {
    id: 'TKN-7814',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer: {
      name: 'Leo Tanaka',
      email: 'leo.tanaka@shibuya-street.jp',
      street: '2-14-1 Jinnan, Shibuya',
      city: 'Tokyo',
      state: 'TK',
      zip: '150-0041',
      country: 'Japan',
    },
    items: [
      {
        productId: 'raw-edge-crew',
        title: 'RAW EDGE CREW',
        size: 'XL',
        colorIndex: 0,
        price: 72.0,
        quantity: 1,
        gsm: '440 GSM',
      },
      {
        productId: 'waffle-thermal',
        title: 'WAFFLE THERMAL',
        size: 'XL',
        colorIndex: 0,
        price: 54.0,
        quantity: 1,
        gsm: '380 GSM',
      },
    ],
    subtotal: 126.0,
    discount: 12.6,
    shippingFee: 0,
    total: 113.4,
    promoCode: 'HEAVY10',
    paymentMethod: 'card',
    status: 'pending',
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'Order placed, awaiting print queue batch' },
    ],
  },
];

export let promoCodes: PromoCode[] = [
  {
    code: 'NOTHING26',
    discountPercent: 15,
    description: '15% Off Official Zine Launch Promo',
    maxUses: 500,
    usedCount: 84,
    active: true,
  },
  {
    code: 'HEAVY10',
    discountPercent: 10,
    description: '10% Heavyweight Cotton Community Discount',
    maxUses: 1000,
    usedCount: 219,
    active: true,
  },
  {
    code: 'VIPSKATE',
    discountPercent: 20,
    description: '20% VIP Underground Skater Pass',
    maxUses: 100,
    usedCount: 47,
    active: true,
  },
];

export let dropBanner: DropBannerConfig = {
  tag: "[WHAT'S NEW DROP - NEW ARRIVALS]",
  message: 'Fresh oversized heavy tees, workwear pants & acid wash zip-ups uploaded every Friday @ midnight.',
  ctaText: '[EXPLORE DROP →]',
  dropDate: '2026-09-25T00:00:00Z',
  active: true,
};

export let subscribers: Array<{ email: string; date: string; source: string }> = [
  { email: 'skater.sam@gmail.com', date: new Date().toISOString(), source: 'footer_popup' },
  { email: 'nyczeen@archive.art', date: new Date().toISOString(), source: 'drop_waitlist' },
];

export let waitlist: WaitlistEntry[] = [
  {
    id: 'wl-1',
    productId: 'heavy-zip-hoodie',
    productTitle: '550GSM ZIP HOODIE',
    size: 'L',
    email: 'marcus.archive@gmail.com',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'waiting',
    gsm: '550 GSM',
  },
  {
    id: 'wl-2',
    productId: 'acid-box-tee',
    productTitle: 'ACID BOX TEE',
    size: 'XXL',
    email: 'elena.street@outlook.co.uk',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'waiting',
    gsm: '300 GSM',
  },
  {
    id: 'wl-3',
    productId: 'heavy-zip-hoodie',
    productTitle: '550GSM ZIP HOODIE',
    size: 'XL',
    email: 'kofi.london@studio.uk',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'notified',
    gsm: '550 GSM',
  },
];

export let reviews: Review[] = [
  {
    id: 'rev-01',
    productId: 'acid-box-tee',
    productTitle: 'ACID BOX TEE',
    author: 'milo_parks',
    rating: 5,
    fit: 'true-to-size',
    title: 'Sturdiest tee in my rotation',
    comment: 'The 300 GSM combed jersey is thick enough that it never clings. Hand-pulled silkscreen print on the back has zero cracking after repeated cold washes.',
    date: '2026-09-12T14:20:00Z',
    verified: true,
    likes: 19,
  },
  {
    id: 'rev-02',
    productId: 'acid-box-tee',
    productTitle: 'ACID BOX TEE',
    author: 'karen.v',
    rating: 5,
    fit: 'oversized',
    title: 'Mineral wash has crazy visual depth',
    comment: 'The boxy drop-shoulder cut is spot on. Perfect drape over wide-leg skater pants. True streetwear staple.',
    date: '2026-09-14T09:15:00Z',
    verified: true,
    likes: 12,
  },
  {
    id: 'rev-03',
    productId: '500gsm-hoodie',
    productTitle: '500GSM HOODIE',
    author: 'brklyn_skate',
    rating: 5,
    fit: 'true-to-size',
    title: 'Feels like wearing protective armor',
    comment: 'The double-layered hood stays completely upright without sloppy drawstrings. 500 GSM French Terry is ridiculously dense and warm.',
    date: '2026-09-10T18:40:00Z',
    verified: true,
    likes: 34,
  },
  {
    id: 'rev-04',
    productId: 'skate-pant',
    productTitle: 'SKATE PANT',
    author: 'julian_east',
    rating: 5,
    fit: 'true-to-size',
    title: '14oz duck canvas takes a heavy beating',
    comment: 'Skated in these for 3 weeks straight in LES park. No blowout, custom brass hardware is tough as hell.',
    date: '2026-09-08T11:00:00Z',
    verified: true,
    likes: 27,
  },
  {
    id: 'rev-05',
    productId: 'raw-edge-crew',
    productTitle: 'RAW EDGE CREW',
    author: 'hana_t',
    rating: 5,
    fit: 'oversized',
    title: 'Raw edge hems roll nicely after first wash',
    comment: 'Deep pigment black dye with subtle distress on the collar rib. Cozy 440 GSM fleece interior.',
    date: '2026-09-05T16:30:00Z',
    verified: true,
    likes: 15,
  },
];

// -------------------------------------------------------------
// SEARCH ANALYTICS ENGINE & SEEDED QUERIES
// -------------------------------------------------------------

export let searchEventsLog: SearchEvent[] = [
  { id: 'se-101', query: '500gsm hoodie', resultCount: 2, timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  { id: 'se-102', query: 'beanie', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 2.2).toISOString() },
  { id: 'se-103', query: 'acid box tee', resultCount: 2, timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString() },
  { id: 'se-104', query: 'carpenter pants', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 4.0).toISOString() },
  { id: 'se-105', query: 'heavy zip hoodie', resultCount: 1, timestamp: new Date(Date.now() - 3600000 * 5.5).toISOString() },
  { id: 'se-106', query: 'leather jacket', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 6.8).toISOString() },
  { id: 'se-107', query: 'raw edge crew', resultCount: 1, timestamp: new Date(Date.now() - 3600000 * 8.0).toISOString() },
  { id: 'se-108', query: 'thermal waffle', resultCount: 1, timestamp: new Date(Date.now() - 3600000 * 9.5).toISOString() },
  { id: 'se-109', query: 'socks', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 11.2).toISOString() },
  { id: 'se-110', query: 'skate pant', resultCount: 1, timestamp: new Date(Date.now() - 3600000 * 13.0).toISOString() },
  { id: 'se-111', query: 'tote bag', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 15.4).toISOString() },
  { id: 'se-112', query: 'silver ring', resultCount: 0, timestamp: new Date(Date.now() - 3600000 * 18.0).toISOString() },
];

export let searchTermFrequencies: Record<
  string,
  {
    count: number;
    resultCount: number;
    lastSearchedAt: string;
    category?: string;
    recommendation?: string;
  }
> = {
  '500gsm hoodie': {
    count: 54,
    resultCount: 2,
    lastSearchedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    category: 'hoodies',
    recommendation: 'High customer conversion. 500GSM Boxy Hoodie is a core storefront driver.',
  },
  'beanie': {
    count: 38,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 2.2).toISOString(),
    category: 'accessories',
    recommendation: 'High unmet demand! Customers looking for heavy ribbed knit beanies. Consider launching in next Friday drop.',
  },
  'acid box tee': {
    count: 46,
    resultCount: 2,
    lastSearchedAt: new Date(Date.now() - 3600000 * 3.1).toISOString(),
    category: 'shirts',
    recommendation: 'Top t-shirt query. Mineral acid wash is a primary aesthetic draw.',
  },
  'heavy zip hoodie': {
    count: 39,
    resultCount: 1, // product exists but stock is 0
    lastSearchedAt: new Date(Date.now() - 3600000 * 5.5).toISOString(),
    category: 'hoodies',
    recommendation: 'Product in archive catalog but 100% sold out. High waitlist demand (trigger restock notification).',
  },
  'carpenter pants': {
    count: 29,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 4.0).toISOString(),
    category: 'pants',
    recommendation: 'Unmet demand for double-knee carpenter workwear. Skate pant is currently available in 14oz duck canvas.',
  },
  'raw edge crew': {
    count: 28,
    resultCount: 1,
    lastSearchedAt: new Date(Date.now() - 3600000 * 8.0).toISOString(),
    category: 'sweatshirts',
    recommendation: 'Steady traffic for 440GSM loopback crewneck with deconstructed raw edge hem.',
  },
  'leather jacket': {
    count: 22,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 6.8).toISOString(),
    category: 'outerwear',
    recommendation: 'Unmet demand for premium leather outerwear. Currently outside core cotton fleece catalog.',
  },
  'skate pant': {
    count: 24,
    resultCount: 1,
    lastSearchedAt: new Date(Date.now() - 3600000 * 13.0).toISOString(),
    category: 'pants',
    recommendation: 'Strong interest in wide-leg 14oz duck canvas pants.',
  },
  'thermal waffle': {
    count: 20,
    resultCount: 1,
    lastSearchedAt: new Date(Date.now() - 3600000 * 9.5).toISOString(),
    category: 'shirts',
    recommendation: '380GSM waffle knit thermal long sleeve is performing well in autumn layering searches.',
  },
  'socks': {
    count: 17,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 11.2).toISOString(),
    category: 'accessories',
    recommendation: 'Unmet demand for branded heavy cushion crew socks (easy add-on merchandise for checkout basket size).',
  },
  'tote bag': {
    count: 15,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 15.4).toISOString(),
    category: 'accessories',
    recommendation: 'Unmet demand for heavy duck canvas silkscreen tote bags.',
  },
  'oversized black tee': {
    count: 23,
    resultCount: 3,
    lastSearchedAt: new Date(Date.now() - 3600000 * 12.0).toISOString(),
    category: 'shirts',
    recommendation: 'Broad generic search converting well to Acid Box Tee and Vintage Pigment Pocket Tee.',
  },
  'silver ring': {
    count: 12,
    resultCount: 0,
    lastSearchedAt: new Date(Date.now() - 3600000 * 18.0).toISOString(),
    category: 'jewelry',
    recommendation: 'Unmet demand for 925 sterling silver archive jewelry accessories.',
  },
};

// -------------------------------------------------------------
// STORE METHODS & ADMIN ACTION DISPATCHER
// -------------------------------------------------------------

export const store = {
  // Products
  getProducts(): ProductStock[] {
    return products;
  },
  findProduct(id: string): ProductStock | undefined {
    return products.find((p) => p.id.toLowerCase() === id.toLowerCase());
  },
  findProductByQuery(query: string): ProductStock | undefined {
    const q = query.toLowerCase();
    return products.find(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.gsm.toLowerCase().includes(q)
    );
  },
  updateProductStock(productId: string, size: string, delta?: number, absoluteStock?: number): { success: boolean; product?: ProductStock; error?: string } {
    const product = this.findProduct(productId);
    if (!product) return { success: false, error: `Product ${productId} not found` };

    const upperSize = size.toUpperCase();
    if (absoluteStock !== undefined) {
      product.stock[upperSize] = Math.max(0, absoluteStock);
      if (!product.availableSizes.includes(upperSize)) {
        product.availableSizes.push(upperSize);
      }
    } else if (delta !== undefined) {
      const current = product.stock[upperSize] || 0;
      product.stock[upperSize] = Math.max(0, current + delta);
      if (!product.availableSizes.includes(upperSize)) {
        product.availableSizes.push(upperSize);
      }
    }
    return { success: true, product };
  },
  setProductPrice(productId: string, price: number, badge?: string): { success: boolean; product?: ProductStock; error?: string } {
    const product = this.findProduct(productId);
    if (!product) return { success: false, error: `Product ${productId} not found` };
    product.price = price;
    if (badge !== undefined) product.badge = badge;
    return { success: true, product };
  },

  // Orders
  getOrders(): Order[] {
    return orders;
  },
  findOrder(id: string): Order | undefined {
    const cleanId = id.trim().toUpperCase();
    return orders.find((o) => o.id.toUpperCase() === cleanId);
  },
  updateOrderStatus(
    orderId: string,
    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    carrier?: string,
    trackingNumber?: string,
    note?: string
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.findOrder(orderId);
    if (!order) return { success: false, error: `Order ${orderId} not found` };

    if (status) order.status = status;
    if (carrier) order.carrier = carrier;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    order.timeline.push({
      status: status || order.status,
      timestamp: new Date().toISOString(),
      note: note || `Back office update: status ${status || order.status}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
    });

    return { success: true, order };
  },
  cancelOrder(orderId: string, reason?: string): { success: boolean; order?: Order; error?: string } {
    const order = this.findOrder(orderId);
    if (!order) return { success: false, error: `Order ${orderId} not found` };

    if (order.status === 'delivered') {
      return { success: false, error: `Order ${orderId} is already delivered and cannot be cancelled.` };
    }

    order.status = 'cancelled';
    // Restore inventory
    order.items.forEach((item) => {
      const product = this.findProduct(item.productId);
      if (product && product.stock && product.stock[item.size] !== undefined) {
        product.stock[item.size] += item.quantity;
      }
    });

    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: reason || 'Order cancelled by Admin Office. Stock automatically returned to inventory.',
    });

    return { success: true, order };
  },
  updateOrderAddress(orderId: string, address: Partial<Order['customer']>): { success: boolean; order?: Order; error?: string } {
    const order = this.findOrder(orderId);
    if (!order) return { success: false, error: `Order ${orderId} not found` };

    if (order.status === 'shipped' || order.status === 'delivered') {
      return { success: false, error: `Cannot change delivery address after order has already shipped.` };
    }

    order.customer = { ...order.customer, ...address };
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Delivery destination revised by back-office admin: ${order.customer.street}, ${order.customer.city}`,
    });

    return { success: true, order };
  },

  // Promo Codes
  getPromoCodes(): PromoCode[] {
    return promoCodes;
  },
  createOrUpdatePromoCode(code: string, discountPercent: number, description?: string, maxUses?: number): { success: boolean; promo: PromoCode } {
    const cleanCode = code.trim().toUpperCase();
    const existing = promoCodes.find((p) => p.code === cleanCode);
    if (existing) {
      existing.discountPercent = discountPercent;
      if (description) existing.description = description;
      if (maxUses) existing.maxUses = maxUses;
      existing.active = true;
      return { success: true, promo: existing };
    }

    const newPromo: PromoCode = {
      code: cleanCode,
      discountPercent,
      description: description || `${discountPercent}% Off Heavyweight Archive`,
      maxUses: maxUses || 250,
      usedCount: 0,
      active: true,
    };
    promoCodes.push(newPromo);
    return { success: true, promo: newPromo };
  },
  togglePromoCode(code: string, active?: boolean): { success: boolean; promo?: PromoCode; error?: string } {
    const promo = promoCodes.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());
    if (!promo) return { success: false, error: `Promo code ${code} not found` };
    promo.active = active !== undefined ? active : !promo.active;
    return { success: true, promo };
  },

  // Drop Banner
  getBanner(): DropBannerConfig {
    return dropBanner;
  },
  updateBanner(updates: Partial<DropBannerConfig>): DropBannerConfig {
    dropBanner = { ...dropBanner, ...updates };
    return dropBanner;
  },

  // Waitlist
  getWaitlist(): WaitlistEntry[] {
    return waitlist;
  },
  batchNotifyWaitlist(productId?: string): { count: number } {
    let count = 0;
    waitlist.forEach((w) => {
      if ((!productId || productId === 'all' || w.productId === productId) && w.status === 'waiting') {
        w.status = 'notified';
        count++;
      }
    });
    return { count };
  },

  // Store Analytics & Snapshot
  getStoreSnapshot() {
    const grossRevenue = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const processingOrders = orders.filter((o) => o.status === 'processing');
    const shippedOrders = orders.filter((o) => o.status === 'shipped');

    const lowStockItems: Array<{ id: string; title: string; size: string; count: number }> = [];
    products.forEach((p) => {
      Object.entries(p.stock).forEach(([size, qty]) => {
        if (size !== 'FIT INSP.' && qty <= 5) {
          lowStockItems.push({ id: p.id, title: p.title, size, count: qty });
        }
      });
    });

    const waitingCustomers = waitlist.filter((w) => w.status === 'waiting');
    const searchSummary = this.getSearchAnalytics();

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalOrders: orders.length,
      pendingOrdersCount: pendingOrders.length,
      processingOrdersCount: processingOrders.length,
      shippedOrdersCount: shippedOrders.length,
      pendingOrders: pendingOrders.map((o) => ({ id: o.id, customer: o.customer.name, total: o.total, itemsCount: o.items.length })),
      lowStockItems,
      waitingCustomersCount: waitingCustomers.length,
      activePromosCount: promoCodes.filter((p) => p.active).length,
      bannerActive: dropBanner.active,
      bannerMessage: dropBanner.message,
      searchAnalytics: {
        totalSearches: searchSummary.totalSearches,
        uniqueTermsCount: searchSummary.uniqueTermsCount,
        zeroResultRate: searchSummary.zeroResultRate,
        unmetDemandCount: searchSummary.unmetDemandTerms.length,
        topSearches: searchSummary.topSearchTerms.slice(0, 5).map((t) => `${t.term} (${t.count}x, ${t.resultCount} results)`),
        topUnmetDemand: searchSummary.unmetDemandTerms.slice(0, 5).map((t) => `${t.term} (${t.count}x)`),
      },
    };
  },

  // Search Analytics Engine
  recordSearch(query: string, resultCount = 0): { success: boolean; term: string; count: number; resultCount: number } {
    const raw = (query || '').trim();
    if (!raw || raw.length < 2) {
      return { success: false, term: raw, count: 0, resultCount: 0 };
    }
    const cleanQuery = raw.toLowerCase();

    // Log individual event
    const event: SearchEvent = {
      id: `se-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      query: cleanQuery,
      resultCount,
      timestamp: new Date().toISOString(),
    };
    searchEventsLog.unshift(event);
    if (searchEventsLog.length > 300) {
      searchEventsLog.pop();
    }

    // Update aggregation
    if (searchTermFrequencies[cleanQuery]) {
      searchTermFrequencies[cleanQuery].count += 1;
      searchTermFrequencies[cleanQuery].resultCount = resultCount;
      searchTermFrequencies[cleanQuery].lastSearchedAt = event.timestamp;
    } else {
      let category = 'archive';
      let recommendation =
        resultCount === 0
          ? `Unmet customer demand: "${cleanQuery}" returned 0 catalog items. Review for future drop.`
          : `Catalog match found (${resultCount} items).`;

      if (cleanQuery.includes('hoodie') || cleanQuery.includes('fleece') || cleanQuery.includes('zip')) category = 'hoodies';
      else if (cleanQuery.includes('tee') || cleanQuery.includes('shirt') || cleanQuery.includes('thermal')) category = 'shirts';
      else if (cleanQuery.includes('crew') || cleanQuery.includes('sweatshirt')) category = 'sweatshirts';
      else if (cleanQuery.includes('pant') || cleanQuery.includes('canvas') || cleanQuery.includes('jean')) category = 'pants';
      else if (cleanQuery.includes('beanie') || cleanQuery.includes('hat') || cleanQuery.includes('cap') || cleanQuery.includes('sock') || cleanQuery.includes('bag') || cleanQuery.includes('ring')) category = 'accessories';

      searchTermFrequencies[cleanQuery] = {
        count: 1,
        resultCount,
        lastSearchedAt: event.timestamp,
        category,
        recommendation,
      };
    }

    return {
      success: true,
      term: cleanQuery,
      count: searchTermFrequencies[cleanQuery].count,
      resultCount,
    };
  },

  getSearchAnalytics(): SearchAnalyticsSummary {
    const allTerms: SearchAnalyticsTerm[] = Object.entries(searchTermFrequencies).map(([term, data]) => ({
      term,
      count: data.count,
      resultCount: data.resultCount,
      hasResults: data.resultCount > 0,
      lastSearchedAt: data.lastSearchedAt,
      category: data.category,
      recommendation: data.recommendation,
    }));

    // Sort by count descending
    allTerms.sort((a, b) => b.count - a.count);

    const totalSearches = allTerms.reduce((acc, t) => acc + t.count, 0);
    const unmetDemandTerms = allTerms.filter((t) => t.resultCount === 0);
    const zeroResultTotalQueries = unmetDemandTerms.reduce((acc, t) => acc + t.count, 0);
    const zeroResultRate = totalSearches > 0 ? Number(((zeroResultTotalQueries / totalSearches) * 100).toFixed(1)) : 0;

    return {
      totalSearches,
      uniqueTermsCount: allTerms.length,
      zeroResultCount: unmetDemandTerms.length,
      zeroResultRate,
      topSearchTerms: allTerms,
      unmetDemandTerms,
      recentQueries: searchEventsLog.slice(0, 30).map((e) => ({
        id: e.id,
        term: e.query,
        resultCount: e.resultCount,
        timestamp: e.timestamp,
      })),
    };
  },

  clearSearchAnalytics(): { success: boolean; message: string } {
    searchEventsLog = [];
    searchTermFrequencies = {};
    return { success: true, message: 'Search analytics log cleared.' };
  },

  // Full Admin Authority Action Executor
  executeAdminAction(action: {
    type:
      | 'update_order_status'
      | 'cancel_order'
      | 'update_order_address'
      | 'adjust_inventory'
      | 'create_promo'
      | 'toggle_promo'
      | 'update_banner'
      | 'notify_waitlist'
      | 'get_store_snapshot'
      | 'get_search_analytics';
    params: any;
  }): { success: boolean; actionType: string; summary: string; data?: any; error?: string } {
    try {
      switch (action.type) {
        case 'get_search_analytics': {
          const stats = this.getSearchAnalytics();
          return {
            success: true,
            actionType: action.type,
            summary: `Search Analytics: ${stats.totalSearches} total queries, ${stats.zeroResultRate}% zero-result rate. Top unmet demand: ${stats.unmetDemandTerms.slice(0, 3).map((t) => t.term).join(', ') || 'None'}.`,
            data: stats,
          };
        }
        case 'update_order_status': {
          const { orderId, status, carrier, trackingNumber, note } = action.params;
          const res = this.updateOrderStatus(orderId, status, carrier, trackingNumber, note);
          if (!res.success) return { success: false, actionType: action.type, summary: res.error || 'Failed to update order status', error: res.error };
          return {
            success: true,
            actionType: action.type,
            summary: `Order ${orderId} successfully set to status: [${status?.toUpperCase() || res.order?.status}]${trackingNumber ? ` with tracking ${trackingNumber}` : ''}.`,
            data: res.order,
          };
        }

        case 'cancel_order': {
          const { orderId, reason } = action.params;
          const res = this.cancelOrder(orderId, reason);
          if (!res.success) return { success: false, actionType: action.type, summary: res.error || 'Failed to cancel order', error: res.error };
          return {
            success: true,
            actionType: action.type,
            summary: `Order ${orderId} has been cancelled and items automatically returned to stock.`,
            data: res.order,
          };
        }

        case 'update_order_address': {
          const { orderId, street, city, state, zip, country } = action.params;
          const res = this.updateOrderAddress(orderId, { street, city, state, zip, country });
          if (!res.success) return { success: false, actionType: action.type, summary: res.error || 'Failed to update address', error: res.error };
          return {
            success: true,
            actionType: action.type,
            summary: `Order ${orderId} destination updated to: ${res.order?.customer.street}, ${res.order?.customer.city}.`,
            data: res.order,
          };
        }

        case 'adjust_inventory': {
          const { productId, size, delta, absoluteStock } = action.params;
          const res = this.updateProductStock(productId, size, delta, absoluteStock);
          if (!res.success) return { success: false, actionType: action.type, summary: res.error || 'Failed to adjust stock', error: res.error };
          const newQty = res.product?.stock[size.toUpperCase()] ?? 'N/A';
          return {
            success: true,
            actionType: action.type,
            summary: `Inventory updated for ${res.product?.title} (Size ${size.toUpperCase()}). Current stock is now: ${newQty} units.`,
            data: res.product,
          };
        }

        case 'create_promo': {
          const { code, discountPercent, description, maxUses } = action.params;
          const res = this.createOrUpdatePromoCode(code, Number(discountPercent), description, maxUses ? Number(maxUses) : undefined);
          return {
            success: true,
            actionType: action.type,
            summary: `Promo code [${res.promo.code}] created: ${res.promo.discountPercent}% off (limit ${res.promo.maxUses} uses).`,
            data: res.promo,
          };
        }

        case 'toggle_promo': {
          const { code, active } = action.params;
          const res = this.togglePromoCode(code, active);
          if (!res.success) return { success: false, actionType: action.type, summary: res.error || 'Promo not found', error: res.error };
          return {
            success: true,
            actionType: action.type,
            summary: `Promo code [${res.promo?.code}] is now ${res.promo?.active ? 'ACTIVE' : 'DEACTIVATED'}.`,
            data: res.promo,
          };
        }

        case 'update_banner': {
          const updated = this.updateBanner(action.params);
          return {
            success: true,
            actionType: action.type,
            summary: `Storefront drop announcement updated: "${updated.message}" (Active: ${updated.active ? 'YES' : 'NO'}).`,
            data: updated,
          };
        }

        case 'notify_waitlist': {
          const { productId } = action.params;
          const res = this.batchNotifyWaitlist(productId);
          return {
            success: true,
            actionType: action.type,
            summary: `Dispatched restock notification to ${res.count} customers on the waitlist.`,
            data: res,
          };
        }

        case 'get_store_snapshot': {
          const snapshot = this.getStoreSnapshot();
          return {
            success: true,
            actionType: action.type,
            summary: `Store Snapshot retrieved: £${snapshot.grossRevenue} gross revenue, ${snapshot.pendingOrdersCount} pending orders, ${snapshot.lowStockItems.length} low-stock alerts.`,
            data: snapshot,
          };
        }

        default:
          return { success: false, actionType: action.type, summary: `Unknown action type: ${action.type}` };
      }
    } catch (err: any) {
      return { success: false, actionType: action.type, summary: `Action failed: ${err.message}`, error: err.message };
    }
  },
};
