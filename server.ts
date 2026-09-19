import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { geminiRouter } from './server/geminiService';
import { store } from './server/store';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Gemini AI Routes (Chat, Image Studio, Veo 3 Video)
app.use('/api/gemini', geminiRouter);

// In-Memory Durable E-Commerce Database
interface ProductStock {
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

interface Order {
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
  items: Array<{
    productId: string;
    title: string;
    size: string;
    colorIndex: number;
    price: number;
    quantity: number;
    gsm?: string;
  }>;
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

interface PromoCode {
  code: string;
  discountPercent: number;
  description: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
}

// Seed Store Data
let products: ProductStock[] = [
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

let orders: Order[] = [
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

let promoCodes: PromoCode[] = [
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

let dropBanner = {
  tag: "[WHAT'S NEW DROP - NEW ARRIVALS]",
  message: 'Fresh oversized heavy tees, workwear pants & acid wash zip-ups uploaded every Friday @ midnight.',
  ctaText: '[EXPLORE DROP →]',
  dropDate: '2026-09-25T00:00:00Z',
  active: true,
};

let subscribers: Array<{ email: string; date: string; source: string }> = [
  { email: 'skater.sam@gmail.com', date: new Date().toISOString(), source: 'footer_popup' },
  { email: 'nyczeen@archive.art', date: new Date().toISOString(), source: 'drop_waitlist' },
];

interface WaitlistEntry {
  id: string;
  productId: string;
  productTitle: string;
  size?: string;
  email: string;
  createdAt: string;
  status: 'waiting' | 'notified';
  gsm?: string;
}

let waitlist: WaitlistEntry[] = [
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

interface Review {
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

let reviews: Review[] = [
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
// USER & STAFF ACCOUNT DATA STORE
// -------------------------------------------------------------
interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
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
  linkedAccounts?: Record<string, {
    provider: string;
    accountId: string;
    emailOrHandle: string;
    displayName?: string;
    avatarUrl?: string;
    linkedAt: string;
  }>;
  tier: 'ARCHIVE_INITIATE' | 'CORE_PATRON' | 'VIP_ARCHIVE_PATRON';
  ordersCount: number;
  totalSpent: number;
  savedPaymentLast4?: string;
  createdAt: string;
}

interface InternalStaffAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'staff' | 'manager' | 'admin';
  department: string;
  lastLogin: string;
  permissions: string[];
}

let internalStaff: InternalStaffAccount[] = [
  {
    id: 'staff-admin-01',
    name: 'Alexander Wright',
    email: 'admin@toknownothing.com',
    password: 'tkn2026',
    role: 'admin',
    department: 'Studio Executive & Creative Direction',
    lastLogin: new Date().toISOString(),
    permissions: [
      'all',
      'orders_manage',
      'inventory_manage',
      'products_manage',
      'marketing_manage',
      'analytics_view',
      'ai_studio',
      'staff_manage',
      'reviews_manage',
    ],
  },
  {
    id: 'staff-mgr-01',
    name: 'Sofia Chen',
    email: 'manager@toknownothing.com',
    password: 'manager2026',
    role: 'manager',
    department: 'Floor Operations & Garment Logistics',
    lastLogin: new Date().toISOString(),
    permissions: [
      'orders_manage',
      'inventory_manage',
      'products_manage',
      'waitlist_manage',
      'reviews_manage',
      'analytics_view',
    ],
  },
  {
    id: 'staff-pack-01',
    name: 'Liam O’Connor',
    email: 'staff@toknownothing.com',
    password: 'staff2026',
    role: 'staff',
    department: 'Fulfillment, Quality Control & Packing',
    lastLogin: new Date().toISOString(),
    permissions: ['orders_view_update_status', 'inventory_view', 'waitlist_view'],
  },
];

let customerAccounts: CustomerAccount[] = [
  {
    id: 'cust-callum',
    name: 'Callum Davies',
    email: 'callum.davies@hackneyskate.co.uk',
    password: 'archive26',
    phone: '+44 7911 123456',
    address: {
      street: '14 Redchurch Street, Shoreditch',
      city: 'London',
      state: 'Greater London',
      zip: 'E2 7DD',
      country: 'United Kingdom',
    },
    measurements: {
      heightCm: 184,
      weightKg: 78,
      preferredFit: 'oversized-boxy',
      preferredChestInches: 42,
    },
    tier: 'VIP_ARCHIVE_PATRON',
    ordersCount: 3,
    totalSpent: 348.5,
    savedPaymentLast4: '4242',
    createdAt: '2026-01-15T10:00:00Z',
    linkedAccounts: {
      google: {
        provider: 'google',
        accountId: 'goog-1029481',
        emailOrHandle: 'callum.davies@hackneyskate.co.uk',
        displayName: 'Callum Davies',
        linkedAt: '2026-01-15T10:05:00Z',
      },
    },
  },
  {
    id: 'cust-maya',
    name: 'Maya Lin',
    email: 'maya.lin@berlinzine.de',
    password: 'berlin2026',
    phone: '+49 151 2345678',
    address: {
      street: 'Kastanienallee 42',
      city: 'Berlin',
      state: 'BE',
      zip: '10435',
      country: 'Germany',
    },
    measurements: {
      heightCm: 172,
      weightKg: 62,
      preferredFit: 'true-to-size',
      preferredChestInches: 38,
    },
    tier: 'CORE_PATRON',
    ordersCount: 2,
    totalSpent: 210.0,
    savedPaymentLast4: '8812',
    createdAt: '2026-02-20T14:30:00Z',
    linkedAccounts: {
      apple: {
        provider: 'apple',
        accountId: 'apple-relay-0991',
        emailOrHandle: 'maya.lin@privaterelay.appleid.com',
        displayName: 'Maya Lin',
        linkedAt: '2026-02-20T14:35:00Z',
      },
      instagram: {
        provider: 'instagram',
        accountId: 'ig-maya-zine',
        emailOrHandle: '@mayalin_berlin',
        displayName: 'mayalin.raw',
        linkedAt: '2026-02-22T09:15:00Z',
      },
    },
  },
];

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Internal Authentication API (Staff, Manager, Admin)
app.post('/api/auth/internal/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = internalStaff.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid staff credentials. Please check your email and passcode.',
    });
  }

  if (role && user.role !== role) {
    return res.status(403).json({
      success: false,
      error: `Account assigned role is ${user.role.toUpperCase()}, not ${role.toUpperCase()}.`,
    });
  }

  user.lastLogin = new Date().toISOString();
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get('/api/auth/internal/staff', (req, res) => {
  const safeList = internalStaff.map(({ password: _, ...user }) => user);
  res.json({ success: true, staff: safeList });
});

// Customer Authentication & Profile API
app.post('/api/auth/customer/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let customer = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);

  if (customer) {
    if (password && customer.password && customer.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect archive password. Try "archive26" for demo or register new.',
      });
    }
    const { password: _, ...safeCustomer } = customer;
    return res.json({ success: true, customer: safeCustomer });
  }

  // Auto-initialize new customer account if signing in first time
  const newCust: CustomerAccount = {
    id: `cust-${Date.now()}`,
    name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
    email: cleanEmail,
    password: password || 'archive26',
    address: {
      street: '',
      city: 'London',
      state: '',
      zip: '',
      country: 'United Kingdom',
    },
    tier: 'ARCHIVE_INITIATE',
    ordersCount: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  };

  customerAccounts.push(newCust);
  const { password: _, ...safeCustomer } = newCust;
  res.json({ success: true, customer: safeCustomer, isNew: true });
});

app.post('/api/auth/customer/register', (req, res) => {
  const { name, email, password, address, measurements, phone } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'An archive account with this email already exists. Please log in.',
    });
  }

  const newCust: CustomerAccount = {
    id: `cust-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: password || 'archive26',
    phone: phone || '',
    address: address || {
      street: '',
      city: 'London',
      state: '',
      zip: '',
      country: 'United Kingdom',
    },
    measurements,
    tier: 'ARCHIVE_INITIATE',
    ordersCount: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  };

  customerAccounts.push(newCust);
  const { password: _, ...safeCustomer } = newCust;
  res.status(201).json({ success: true, customer: safeCustomer });
});

// One-Click Social & Federated Sign-In / Registration (Google, Apple, Shop Pay, Instagram, Discord, GitHub)
app.post('/api/auth/customer/social-auth', (req, res) => {
  const { provider, email, name, accountId, handle, avatarUrl } = req.body;
  if (!provider) {
    return res.status(400).json({ success: false, error: 'Provider is required' });
  }

  const cleanProvider = String(provider).toLowerCase();
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const effAccountId = accountId || `${cleanProvider}-${Date.now()}`;
  const effHandle = handle || cleanEmail || `${cleanProvider}_user`;

  // Search existing by email or existing linked account
  let customer = customerAccounts.find((c) => {
    if (cleanEmail && c.email.toLowerCase() === cleanEmail) return true;
    if (c.linkedAccounts && (c.linkedAccounts as any)[cleanProvider]?.accountId === effAccountId) return true;
    return false;
  });

  const linkedItem = {
    provider: cleanProvider,
    accountId: effAccountId,
    emailOrHandle: effHandle,
    displayName: name || effHandle,
    avatarUrl,
    linkedAt: new Date().toISOString(),
  };

  if (customer) {
    if (!customer.linkedAccounts) customer.linkedAccounts = {};
    customer.linkedAccounts[cleanProvider] = linkedItem;
    if (name && (!customer.name || customer.name === customer.email.split('@')[0])) {
      customer.name = name;
    }
    const { password: _, ...safeCustomer } = customer;
    return res.json({ success: true, customer: safeCustomer, isNew: false });
  }

  // Create new customer account with linked account pre-associated
  const fallbackEmail = cleanEmail || `${cleanProvider}.${Date.now()}@archive-patron.local`;
  const newCust: CustomerAccount = {
    id: `cust-${Date.now()}`,
    name: name || effHandle.replace(/[@._]/g, ' ').toUpperCase(),
    email: fallbackEmail,
    password: 'archive-linked-sso',
    address: {
      street: '',
      city: 'London',
      state: '',
      zip: '',
      country: 'United Kingdom',
    },
    tier: 'ARCHIVE_INITIATE',
    ordersCount: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    linkedAccounts: {
      [cleanProvider]: linkedItem,
    },
  };

  customerAccounts.push(newCust);
  const { password: _, ...safeCustomer } = newCust;
  res.status(201).json({ success: true, customer: safeCustomer, isNew: true });
});

// Link external account to current active logged-in customer profile
app.post('/api/customer/link-account', (req, res) => {
  const { email, provider, accountId, emailOrHandle, displayName, avatarUrl } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ success: false, error: 'Email and provider are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanProvider = String(provider).toLowerCase();
  const cust = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!cust) return res.status(404).json({ success: false, error: 'Customer account not found' });

  if (!cust.linkedAccounts) cust.linkedAccounts = {};
  cust.linkedAccounts[cleanProvider] = {
    provider: cleanProvider,
    accountId: accountId || `${cleanProvider}-${Date.now()}`,
    emailOrHandle: emailOrHandle || cleanEmail,
    displayName: displayName || cust.name,
    avatarUrl,
    linkedAt: new Date().toISOString(),
  };

  const { password: _, ...safeCustomer } = cust;
  res.json({ success: true, customer: safeCustomer });
});

// Unlink external account from customer profile
app.post('/api/customer/unlink-account', (req, res) => {
  const { email, provider } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ success: false, error: 'Email and provider are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanProvider = String(provider).toLowerCase();
  const cust = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!cust) return res.status(404).json({ success: false, error: 'Customer account not found' });

  if (cust.linkedAccounts && cust.linkedAccounts[cleanProvider]) {
    delete cust.linkedAccounts[cleanProvider];
  }

  const { password: _, ...safeCustomer } = cust;
  res.json({ success: true, customer: safeCustomer });
});

app.get('/api/customer/profile', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });

  const cleanEmail = String(email).trim().toLowerCase();
  const cust = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!cust) return res.status(404).json({ success: false, error: 'Customer not found' });

  const { password: _, ...safeCustomer } = cust;
  res.json({ success: true, customer: safeCustomer });
});

app.put('/api/customer/profile', (req, res) => {
  const { email, name, phone, address, measurements, savedPaymentLast4 } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });

  const cleanEmail = String(email).trim().toLowerCase();
  const cust = customerAccounts.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!cust) return res.status(404).json({ success: false, error: 'Customer not found' });

  if (name) cust.name = name.trim();
  if (phone !== undefined) cust.phone = phone;
  if (address) cust.address = { ...cust.address, ...address };
  if (measurements) cust.measurements = { ...cust.measurements, ...measurements };
  if (savedPaymentLast4) cust.savedPaymentLast4 = savedPaymentLast4;

  const { password: _, ...safeCustomer } = cust;
  res.json({ success: true, customer: safeCustomer });
});

app.get('/api/customer/orders', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });

  const cleanEmail = String(email).trim().toLowerCase();
  const customerOrders = orders.filter((o) => o.customer.email.toLowerCase() === cleanEmail);
  res.json({ success: true, orders: customerOrders });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

app.post('/api/products', (req, res) => {
  const newProduct: ProductStock = {
    ...req.body,
    id: req.body.id || `custom-${Date.now()}`,
    stock: req.body.stock || { S: 10, M: 10, L: 10, XL: 5 },
  };
  products.push(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const { size, delta, absoluteStock } = req.body;
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (absoluteStock !== undefined) {
    product.stock[size] = Math.max(0, absoluteStock);
  } else if (delta !== undefined) {
    product.stock[size] = Math.max(0, (product.stock[size] || 0) + delta);
  }

  res.json({ success: true, product });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  products[idx] = { ...products[idx], ...req.body };
  res.json({ success: true, product: products[idx] });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter((p) => p.id !== id);
  res.json({ success: true, message: 'Product deleted' });
});

// Orders API
app.get('/api/orders', (req, res) => {
  const { status, search } = req.query;
  let result = [...orders];

  if (status && status !== 'all') {
    result = result.filter((o) => o.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, orders: result });
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order });
});

app.post('/api/orders', (req, res) => {
  const { customer, items, promoCode, paymentMethod, isGuest, createAccount, accountPassword } = req.body;

  if (!customer || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid order data' });
  }

  // Calculate pricing
  const subtotal = items.reduce(
    (acc: number, item: { price: number; quantity: number }) => acc + item.price * item.quantity,
    0
  );

  let discount = 0;
  if (promoCode) {
    const promo = promoCodes.find((p) => p.code.toUpperCase() === promoCode.toUpperCase() && p.active);
    if (promo) {
      discount = (subtotal * promo.discountPercent) / 100;
      promo.usedCount += 1;
    }
  }

  const shippingFee = subtotal - discount >= 120 ? 0 : 10;
  const total = Math.max(0, subtotal - discount + shippingFee);

  // Decrement inventory stock
  items.forEach((item: { productId: string; size: string; quantity: number }) => {
    const product = products.find((p) => p.id === item.productId);
    if (product && product.stock && product.stock[item.size] !== undefined) {
      product.stock[item.size] = Math.max(0, product.stock[item.size] - item.quantity);
    }
  });

  const newOrder: Order = {
    id: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    customer,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    shippingFee,
    total: Number(total.toFixed(2)),
    promoCode,
    paymentMethod: paymentMethod || 'card',
    status: 'pending',
    carrier: 'Royal Mail Tracked 24',
    timeline: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: isGuest
          ? 'Guest order confirmed & added to London studio print queue'
          : 'Archive member order confirmed & added to London studio print queue',
      },
    ],
  };

  orders.unshift(newOrder);

  // Link to customer account or create if requested
  const emailClean = customer.email?.trim().toLowerCase();
  let matchedCustomer = customerAccounts.find((c) => c.email.toLowerCase() === emailClean);

  if (matchedCustomer) {
    matchedCustomer.ordersCount += 1;
    matchedCustomer.totalSpent = Number((matchedCustomer.totalSpent + newOrder.total).toFixed(2));
    if (matchedCustomer.totalSpent >= 500) {
      matchedCustomer.tier = 'VIP_ARCHIVE_PATRON';
    } else if (matchedCustomer.totalSpent >= 200) {
      matchedCustomer.tier = 'CORE_PATRON';
    }
    // Update address if missing
    if (!matchedCustomer.address.street && customer.street) {
      matchedCustomer.address = {
        street: customer.street,
        city: customer.city || 'London',
        state: customer.state || '',
        zip: customer.zip || '',
        country: customer.country || 'United Kingdom',
      };
    }
  } else if (createAccount && emailClean) {
    const newCust: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: customer.name || emailClean.split('@')[0],
      email: emailClean,
      password: accountPassword || 'archive26',
      address: {
        street: customer.street || '',
        city: customer.city || 'London',
        state: customer.state || '',
        zip: customer.zip || '',
        country: customer.country || 'United Kingdom',
      },
      tier: newOrder.total >= 200 ? 'CORE_PATRON' : 'ARCHIVE_INITIATE',
      ordersCount: 1,
      totalSpent: newOrder.total,
      createdAt: new Date().toISOString(),
    };
    customerAccounts.push(newCust);
    matchedCustomer = newCust;
  }

  res.status(201).json({
    success: true,
    order: newOrder,
    isGuest: Boolean(isGuest),
    customer: matchedCustomer ? (({ password, ...rest }) => rest)(matchedCustomer) : null,
  });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, carrier, trackingNumber, note } = req.body;

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (status) order.status = status;
  if (carrier) order.carrier = carrier;
  if (trackingNumber) order.trackingNumber = trackingNumber;

  order.timeline.push({
    status: status || order.status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status || order.status} in archive console`,
  });

  res.json({ success: true, order });
});

app.post('/api/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: `Order cannot be cancelled because it is already ${order.status}`,
    });
  }

  order.status = 'cancelled';
  // Restore stock
  order.items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product && product.stock && product.stock[item.size] !== undefined) {
      product.stock[item.size] += item.quantity;
    }
  });

  order.timeline.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    note: 'Customer requested order cancellation before screenprint queue',
  });

  res.json({ success: true, order });
});

app.patch('/api/orders/:id/address', (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (order.status !== 'pending' && order.status !== 'processing') {
    return res.status(400).json({
      success: false,
      error: 'Cannot change address after shipment dispatch',
    });
  }

  order.customer = { ...order.customer, ...req.body };
  order.timeline.push({
    status: order.status,
    timestamp: new Date().toISOString(),
    note: `Shipping destination updated: ${order.customer.street}, ${order.customer.city}`,
  });

  res.json({ success: true, order });
});

// Reviews API
app.get('/api/reviews', (req, res) => {
  const { productId } = req.query;
  let result = [...reviews];
  if (productId) {
    result = result.filter((r) => r.productId === productId);
  }
  res.json({ success: true, reviews: result });
});

app.post('/api/reviews', (req, res) => {
  const { productId, author, rating, fit, title, comment } = req.body;
  if (!productId || !author || !comment) {
    return res.status(400).json({ success: false, error: 'Missing required review fields' });
  }

  const product = products.find((p) => p.id === productId);
  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    productTitle: product ? product.title : 'ARCHIVE APPAREL',
    author: author.trim().replace(/^@/, ''),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    fit: fit || 'true-to-size',
    title: title || 'Street Feedback',
    comment: comment.trim(),
    date: new Date().toISOString(),
    verified: true,
    likes: 0,
  };

  reviews.unshift(newReview);
  res.status(201).json({ success: true, review: newReview });
});

app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  reviews = reviews.filter((r) => r.id !== id);
  res.json({ success: true, message: 'Review deleted' });
});

app.post('/api/reviews/:id/like', (req, res) => {
  const { id } = req.params;
  const rev = reviews.find((r) => r.id === id);
  if (!rev) {
    return res.status(404).json({ success: false, error: 'Review not found' });
  }
  rev.likes += 1;
  res.json({ success: true, likes: rev.likes });
});

// Inventory Management API
app.get('/api/inventory', (req, res) => {
  const summary = products.map((p) => {
    const totalUnits = Object.values(p.stock).reduce((a, b) => a + b, 0);
    const lowStockSizes = Object.entries(p.stock)
      .filter(([_, qty]) => qty <= 5 && qty > 0)
      .map(([sz]) => sz);
    const soldOutSizes = Object.entries(p.stock)
      .filter(([_, qty]) => qty === 0)
      .map(([sz]) => sz);

    return {
      id: p.id,
      title: p.title,
      price: p.price,
      gsm: p.gsm,
      category: p.category,
      totalUnits,
      stockValue: totalUnits * p.price,
      stock: p.stock,
      lowStockSizes,
      soldOutSizes,
    };
  });

  const totalInventoryUnits = summary.reduce((acc, it) => acc + it.totalUnits, 0);
  const totalInventoryValue = summary.reduce((acc, it) => acc + it.stockValue, 0);

  res.json({
    success: true,
    totalInventoryUnits,
    totalInventoryValue,
    inventory: summary,
  });
});

app.post('/api/inventory/adjust', (req, res) => {
  const { productId, size, delta, newAmount } = req.body;
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (newAmount !== undefined) {
    product.stock[size] = Math.max(0, newAmount);
  } else if (delta !== undefined) {
    product.stock[size] = Math.max(0, (product.stock[size] || 0) + delta);
  }

  res.json({ success: true, product });
});

// Marketing & Promos API
app.get('/api/marketing/promos', (req, res) => {
  res.json({ success: true, promos: promoCodes });
});

app.post('/api/marketing/promos', (req, res) => {
  const { code, discountPercent, description, maxUses } = req.body;
  if (!code || !discountPercent) {
    return res.status(400).json({ success: false, error: 'Code and discount % required' });
  }

  const existing = promoCodes.find((p) => p.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    existing.discountPercent = discountPercent;
    existing.description = description || existing.description;
    existing.maxUses = maxUses || existing.maxUses;
    return res.json({ success: true, promo: existing });
  }

  const newPromo: PromoCode = {
    code: code.trim().toUpperCase(),
    discountPercent,
    description: description || `${discountPercent}% Off Archive Discount`,
    maxUses: maxUses || 200,
    usedCount: 0,
    active: true,
  };

  promoCodes.push(newPromo);
  res.status(201).json({ success: true, promo: newPromo });
});

app.delete('/api/marketing/promos/:code', (req, res) => {
  const { code } = req.params;
  promoCodes = promoCodes.filter((p) => p.code.toUpperCase() !== code.toUpperCase());
  res.json({ success: true, message: 'Promo removed' });
});

app.post('/api/marketing/validate-promo', (req, res) => {
  const { code } = req.body;
  const promo = promoCodes.find((p) => p.code.toUpperCase() === String(code).trim().toUpperCase() && p.active);
  if (!promo) {
    return res.status(400).json({ success: false, error: 'Invalid or expired code' });
  }
  if (promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ success: false, error: 'Promo usage limit reached' });
  }
  res.json({ success: true, promo });
});

app.get('/api/marketing/banner', (req, res) => {
  res.json({ success: true, banner: dropBanner });
});

app.post('/api/marketing/banner', (req, res) => {
  dropBanner = { ...dropBanner, ...req.body };
  res.json({ success: true, banner: dropBanner });
});

app.get('/api/marketing/subscribers', (req, res) => {
  res.json({ success: true, subscribers, count: subscribers.length });
});

app.post('/api/marketing/subscribe', (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }
  if (!subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    subscribers.push({ email, date: new Date().toISOString(), source: source || 'storefront' });
  }
  res.json({ success: true, message: 'Subscribed to archive drop dispatches!' });
});

// Waitlist (Notify Me) API
app.get('/api/waitlist', (req, res) => {
  const { productId, search, status } = req.query;
  let filtered = [...waitlist];

  if (productId && productId !== 'all') {
    filtered = filtered.filter((w) => w.productId === productId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((w) => w.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase().trim();
    filtered = filtered.filter(
      (w) =>
        w.email.toLowerCase().includes(q) ||
        w.productTitle.toLowerCase().includes(q) ||
        (w.size && w.size.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, waitlist: filtered, count: filtered.length });
});

app.post('/api/waitlist', (req, res) => {
  const { productId, productTitle, size, email, gsm } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  if (!productId || !productTitle) {
    return res.status(400).json({ success: false, error: 'Product details required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanSize = size ? String(size).trim() : 'ANY';

  // Check if already on waitlist for this product and size
  const existing = waitlist.find(
    (w) =>
      w.email.toLowerCase() === cleanEmail &&
      w.productId === productId &&
      (w.size || 'ANY') === cleanSize
  );

  if (existing) {
    existing.status = 'waiting';
    return res.json({
      success: true,
      message: `You're already on the waitlist for ${productTitle} (${cleanSize}). We'll ping ${cleanEmail} the moment it drops!`,
      entry: existing,
    });
  }

  const newEntry: WaitlistEntry = {
    id: `wl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    productTitle,
    size: cleanSize,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    gsm,
  };

  waitlist.unshift(newEntry);

  res.status(201).json({
    success: true,
    message: `Waitlist confirmed! We'll dispatch a restock alert to ${cleanEmail} for ${productTitle} (${cleanSize}).`,
    entry: newEntry,
  });
});

app.delete('/api/waitlist/:id', (req, res) => {
  const { id } = req.params;
  waitlist = waitlist.filter((w) => w.id !== id);
  res.json({ success: true, message: 'Waitlist entry deleted' });
});

app.post('/api/waitlist/:id/notify', (req, res) => {
  const { id } = req.params;
  const entry = waitlist.find((w) => w.id === id);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Waitlist entry not found' });
  }
  entry.status = entry.status === 'waiting' ? 'notified' : 'waiting';
  res.json({
    success: true,
    message: entry.status === 'notified' ? `Restock alert sent to ${entry.email}` : `Status reset to waiting`,
    entry,
  });
});

app.post('/api/waitlist/batch-notify', (req, res) => {
  const { productId } = req.body;
  let count = 0;
  waitlist.forEach((w) => {
    if ((!productId || productId === 'all' || w.productId === productId) && w.status === 'waiting') {
      w.status = 'notified';
      count++;
    }
  });
  res.json({ success: true, notifiedCount: count, message: `Dispatched restock notification to ${count} customers` });
});

// Analytics & Reports API
app.get('/api/analytics', (req, res) => {
  const grossRevenue = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0);
  const totalOrders = orders.length;
  const totalUnitsSold = orders.reduce(
    (acc, o) => acc + (o.status !== 'cancelled' ? o.items.reduce((s, it) => s + it.quantity, 0) : 0),
    0
  );
  const averageOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

  const ordersByStatus = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  // Top products calculation
  const productSales: Record<string, { title: string; unitsSold: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { title: item.title, unitsSold: 0, revenue: 0 };
        }
        productSales[item.productId].unitsSold += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    }
  });

  const topProducts = Object.entries(productSales)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalInventoryUnits = products.reduce(
    (acc, p) => acc + Object.values(p.stock).reduce((a, b) => a + b, 0),
    0
  );
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + Object.values(p.stock).reduce((a, b) => a + b, 0) * p.price,
    0
  );

  const searchAnalytics = store.getSearchAnalytics();

  res.json({
    success: true,
    analytics: {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalOrders,
      totalUnitsSold,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      totalInventoryUnits,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      ordersByStatus,
      topProducts,
      searchAnalytics,
    },
  });
});

// Search Analytics API (Customer Storefront Search Tracker & Unmet Demand Detection)
app.post('/api/analytics/search', (req, res) => {
  const { query, resultCount } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid search query string required' });
  }

  const recorded = store.recordSearch(query, typeof resultCount === 'number' ? resultCount : 0);
  res.json({
    success: true,
    recorded,
    summary: store.getSearchAnalytics(),
  });
});

app.get('/api/analytics/search', (req, res) => {
  const summary = store.getSearchAnalytics();
  res.json({
    success: true,
    searchAnalytics: summary,
  });
});

app.delete('/api/analytics/search', (req, res) => {
  const result = store.clearSearchAnalytics();
  res.json({
    success: true,
    message: result.message,
    searchAnalytics: store.getSearchAnalytics(),
  });
});

// Meta Tag Manager (Storefront SEO, OpenGraph & Canonical URL Backend)
interface MetaTagConfig {
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

const DEFAULT_META_TAGS: MetaTagConfig = {
  title: 'TO KNOW NOTHING // Heavy Apparel Archive — London, UK',
  description: 'UK-based heavy cotton streetwear archive storefront featuring 300-500GSM cut & sew garments, compact polaroid grids, London studio workshop, and Royal Mail dispatch.',
  canonicalBaseUrl: 'https://toknownothing.co.uk',
  canonicalPathRule: 'preserve_path',
  ogTitle: 'TO KNOW NOTHING // Heavy Apparel Archive [London UK]',
  ogDescription: 'UK-based heavy cotton streetwear archive storefront featuring 300-500GSM cut & sew garments, compact polaroid grids, London studio workshop, and Royal Mail dispatch.',
  ogImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
  ogImageAlt: 'TO KNOW NOTHING heavy 500GSM streetwear archive polaroid lookbook',
  ogType: 'website',
  siteName: 'TO KNOW NOTHING APPAREL LTD',
  twitterCard: 'summary_large_image',
  twitterSite: '@toknownothing_uk',
  twitterCreator: '@toknownothing_uk',
  robots: 'index, follow',
  locale: 'en_GB',
  themeColor: '#fff500',
  enableStructuredData: true,
  keywords: 'heavy streetwear, 500gsm hoodie, london fashion, cut and sew, heavy cotton, streetwear archive, royal mail dispatch',
  updatedAt: new Date().toISOString(),
};

let metaTagConfig: MetaTagConfig = { ...DEFAULT_META_TAGS };

function resolveServerCanonicalUrl(config: MetaTagConfig, reqPath = '/'): string {
  let base = config.canonicalBaseUrl.trim();
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (config.canonicalPathRule === 'root') return `${base}/`;
  const cleanPath = reqPath.startsWith('/') ? reqPath : `/${reqPath}`;
  return `${base}${cleanPath === '/' ? '/' : cleanPath}`;
}

app.get('/api/meta-tags', (req, res) => {
  res.json({ success: true, meta: metaTagConfig });
});

app.put('/api/meta-tags', (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid payload structure' });
  }

  if (updates.title !== undefined && (!updates.title || typeof updates.title !== 'string')) {
    return res.status(400).json({ success: false, error: 'Storefront title cannot be empty' });
  }

  if (updates.canonicalBaseUrl !== undefined && (!updates.canonicalBaseUrl || typeof updates.canonicalBaseUrl !== 'string')) {
    return res.status(400).json({ success: false, error: 'Canonical base URL is required' });
  }

  metaTagConfig = {
    ...metaTagConfig,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    meta: metaTagConfig,
    message: 'Storefront title, OpenGraph social card, and canonical URL structure successfully updated',
  });
});

app.post('/api/meta-tags/reset', (req, res) => {
  metaTagConfig = {
    ...DEFAULT_META_TAGS,
    updatedAt: new Date().toISOString(),
  };
  res.json({
    success: true,
    meta: metaTagConfig,
    message: 'Meta tags restored to London Studio factory defaults',
  });
});

app.get('/api/meta-tags/raw-html', (req, res) => {
  const canonicalUrl = resolveServerCanonicalUrl(metaTagConfig);
  const snippet = `<!-- Primary Meta Tags -->
<title>${metaTagConfig.title}</title>
<meta name="title" content="${metaTagConfig.title}" />
<meta name="description" content="${metaTagConfig.description}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta name="robots" content="${metaTagConfig.robots}" />
<meta name="theme-color" content="${metaTagConfig.themeColor}" />

<!-- Open Graph / Social -->
<meta property="og:type" content="${metaTagConfig.ogType}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="${metaTagConfig.siteName}" />
<meta property="og:locale" content="${metaTagConfig.locale}" />
<meta property="og:title" content="${metaTagConfig.ogTitle || metaTagConfig.title}" />
<meta property="og:description" content="${metaTagConfig.ogDescription || metaTagConfig.description}" />
<meta property="og:image" content="${metaTagConfig.ogImage}" />
<meta property="og:image:alt" content="${metaTagConfig.ogImageAlt}" />

<!-- Twitter / X -->
<meta name="twitter:card" content="${metaTagConfig.twitterCard}" />
<meta name="twitter:url" content="${canonicalUrl}" />
<meta name="twitter:title" content="${metaTagConfig.ogTitle || metaTagConfig.title}" />
<meta name="twitter:description" content="${metaTagConfig.ogDescription || metaTagConfig.description}" />
<meta name="twitter:image" content="${metaTagConfig.ogImage}" />
<meta name="twitter:site" content="${metaTagConfig.twitterSite}" />
<meta name="twitter:creator" content="${metaTagConfig.twitterCreator}" />`;

  res.json({ success: true, html: snippet });
});

// ==========================================
// ARCHIVE SOCIAL FEED (Instagram / TikTok / Community Fit Pics & Studio BTS)
// ==========================================
interface SocialFeedPost {
  id: string;
  platform: 'instagram' | 'tiktok';
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

let mockSocialFeed: SocialFeedPost[] = [
  {
    id: 'post-1',
    platform: 'instagram',
    authorHandle: '@marcus.skate',
    authorName: 'Marcus Bell',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    category: 'fit-pic',
    caption: 'Southbank concrete session in the 500GSM Charcoal Zip Hoodie. Heavy drop shoulder with zero hood sag. Proper heavyweight blank that takes a beating. 🛹 #streetwear #londonfits #toknownothing #500gsm',
    timestamp: '2h ago',
    likes: 418,
    commentsCount: 32,
    sharesCount: 14,
    taggedGarment: {
      productId: '500gsm-hoodie',
      productTitle: '500GSM HOODIE',
      gsm: '500 GSM',
      price: 88,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Southbank Skate Space, London',
    isVerified: false,
    tags: ['#londonstreetwear', '#500gsm', '#skate', '#hoodie'],
  },
  {
    id: 'post-2',
    platform: 'tiktok',
    authorHandle: '@toknownothing.studio',
    authorName: 'TO KNOW NOTHING STUDIO',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    category: 'bts',
    caption: 'Late night in the Hackney studio ✂️ Test pulling our high-density puff ink across 20 raw fleece panels. The tactile finish is crazy. Sound on for that squeegee pull 🔊 #bts #screenprinting #londonfashion #process',
    timestamp: '5h ago',
    likes: 1240,
    commentsCount: 94,
    sharesCount: 210,
    taggedGarment: {
      productId: 'raw-edge-sweatshirt',
      productTitle: 'RAW EDGE SWEATSHIRT',
      gsm: '450 GSM',
      price: 74,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
    mediaType: 'video',
    videoDuration: '0:28',
    location: 'Hackney Dye & Print Lab, London',
    isVerified: true,
    tags: ['#screenprinting', '#bts', '#studio', '#puffink'],
  },
  {
    id: 'post-3',
    platform: 'instagram',
    authorHandle: '@sora_urban',
    authorName: 'Sora Takahashi',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    category: 'fit-pic',
    caption: 'Acid wash box tee (300GSM carded cotton) layered over white thermal. Crisp 1.25" collar that does not bacon after 10 washes. Shoreditch coffee run ☕️ #toknownothing #minimalstreetwear #fitcheck',
    timestamp: '1d ago',
    likes: 675,
    commentsCount: 41,
    sharesCount: 19,
    taggedGarment: {
      productId: 'acid-box-tee',
      productTitle: 'ACID BOX TEE',
      gsm: '300 GSM',
      price: 48,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Redchurch St, Shoreditch',
    isVerified: false,
    tags: ['#acidwashtee', '#heavycotton', '#boxydrape', '#shoreditch'],
  },
  {
    id: 'post-4',
    platform: 'tiktok',
    authorHandle: '@kai.fits',
    authorName: 'Kai Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    category: 'fit-pic',
    caption: '3 ways to style 500GSM oversized hoodies when London weather is unpredictable 🌧️ -> ☀️. Heavy waffle thermal underneath for structure. #fashiontiktok #grwm #streetwear #layering',
    timestamp: '1d ago',
    likes: 892,
    commentsCount: 63,
    sharesCount: 145,
    taggedGarment: {
      productId: 'waffle-thermal',
      productTitle: 'WAFFLE THERMAL',
      gsm: '360 GSM',
      price: 54,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    mediaType: 'video',
    videoDuration: '0:42',
    location: 'Soho, London',
    isVerified: false,
    tags: ['#grwm', '#layering', '#hoodiestyle', '#outfitideas'],
  },
  {
    id: 'post-5',
    platform: 'instagram',
    authorHandle: '@toknownothing.studio',
    authorName: 'TO KNOW NOTHING ARCHIVE',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    category: 'bts',
    caption: 'Hardware QC: Custom antique brass #10 two-way YKK zippers arrived from Japan. Heavyweight pullers hand-oxidized to match our garment dye lots. Built to outlast the fleece.',
    timestamp: '2d ago',
    likes: 538,
    commentsCount: 29,
    sharesCount: 12,
    taggedGarment: {
      productId: '500gsm-hoodie',
      productTitle: '500GSM HOODIE',
      gsm: '500 GSM',
      price: 88,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Archive Workshop, Bermondsey',
    isVerified: true,
    tags: ['#hardware', '#ykkzippers', '#bts', '#craftsmanship'],
  },
  {
    id: 'post-6',
    platform: 'instagram',
    authorHandle: '@elena_reid',
    authorName: 'Elena Reid',
    authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    category: 'community',
    caption: 'Borrowed this from my partner\'s archive and never giving it back. The raw cut hem roll is so clean. Heavyweight fleece that doesn\'t lose its box structure 🖤 #fitpic #streetstyle #london',
    timestamp: '3d ago',
    likes: 785,
    commentsCount: 52,
    sharesCount: 28,
    taggedGarment: {
      productId: 'raw-edge-sweatshirt',
      productTitle: 'RAW EDGE SWEATSHIRT',
      gsm: '450 GSM',
      price: 74,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Covent Garden, London',
    isVerified: false,
    tags: ['#rawcut', '#heavyfleece', '#londonstyle', '#oversized'],
  },
  {
    id: 'post-7',
    platform: 'tiktok',
    authorHandle: '@toknownothing.bts',
    authorName: 'STUDIO LAB',
    authorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    category: 'bts',
    caption: 'Fabric density scale test: standard 280gsm commercial fleece vs our 500gsm custom French Terry loopback. Look at how the seam doesn\'t collapse under pressure ⚖️ #textiles #manufacturing #bts #quality',
    timestamp: '4d ago',
    likes: 2190,
    commentsCount: 147,
    sharesCount: 380,
    taggedGarment: {
      productId: '500gsm-hoodie',
      productTitle: '500GSM HOODIE',
      gsm: '500 GSM',
      price: 88,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    mediaType: 'video',
    videoDuration: '0:39',
    location: 'London Textile Mill',
    isVerified: true,
    tags: ['#gsmtest', '#textileengineering', '#bts', '#heavyfleece'],
  },
  {
    id: 'post-8',
    platform: 'instagram',
    authorHandle: '@zayn_archive',
    authorName: 'Zayn Malik-Ross',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    category: 'fit-pic',
    caption: 'Double knee duck canvas skate pants after 3 months of daily wear, grip tape rub, and rain. The fabric has softened right where it counts but zero blowouts. Best trousers I own. 🛹',
    timestamp: '5d ago',
    likes: 620,
    commentsCount: 39,
    sharesCount: 17,
    taggedGarment: {
      productId: 'skate-pant-duck',
      productTitle: 'DUCK CANVAS SKATE PANT',
      gsm: '14 OZ',
      price: 82,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Victoria Park, London',
    isVerified: false,
    tags: ['#duckcanvas', '#workwear', '#skatepant', '#patina'],
  },
];

// GET /api/social-feed - fetch posts with optional filters
app.get('/api/social-feed', (req, res) => {
  const { platform, category, search } = req.query;

  let results = [...mockSocialFeed];

  if (platform && platform !== 'all') {
    results = results.filter((p) => p.platform === platform);
  }

  if (category && category !== 'all') {
    results = results.filter((p) => p.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.caption.toLowerCase().includes(q) ||
        p.authorHandle.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.taggedGarment && p.taggedGarment.productTitle.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    posts: results,
    totalCount: mockSocialFeed.length,
    filteredCount: results.length,
    countsByPlatform: {
      all: mockSocialFeed.length,
      instagram: mockSocialFeed.filter((p) => p.platform === 'instagram').length,
      tiktok: mockSocialFeed.filter((p) => p.platform === 'tiktok').length,
    },
    countsByCategory: {
      all: mockSocialFeed.length,
      'fit-pic': mockSocialFeed.filter((p) => p.category === 'fit-pic').length,
      'bts': mockSocialFeed.filter((p) => p.category === 'bts').length,
      'community': mockSocialFeed.filter((p) => p.category === 'community').length,
    },
  });
});

// POST /api/social-feed/:id/like - toggle like
app.post('/api/social-feed/:id/like', (req, res) => {
  const { id } = req.params;
  const post = mockSocialFeed.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Social post not found' });
  }

  if (post.hasLiked) {
    post.likes = Math.max(0, post.likes - 1);
    post.hasLiked = false;
  } else {
    post.likes += 1;
    post.hasLiked = true;
  }

  res.json({
    success: true,
    likes: post.likes,
    hasLiked: post.hasLiked,
    message: post.hasLiked ? 'Post liked!' : 'Like removed',
  });
});

// POST /api/social-feed - submit community fit pic
app.post('/api/social-feed', (req, res) => {
  const {
    platform = 'instagram',
    authorHandle,
    authorName,
    caption,
    taggedGarment,
    mediaUrl,
    location,
    category = 'fit-pic',
  } = req.body;

  if (!authorHandle || !caption) {
    return res.status(400).json({ success: false, message: 'Author handle and caption are required' });
  }

  const newPost: SocialFeedPost = {
    id: `post-${Date.now()}`,
    platform: platform === 'tiktok' ? 'tiktok' : 'instagram',
    authorHandle: authorHandle.startsWith('@') ? authorHandle : `@${authorHandle}`,
    authorName: authorName || authorHandle,
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    category: category || 'fit-pic',
    caption,
    timestamp: 'Just now',
    likes: 1,
    hasLiked: true,
    commentsCount: 0,
    sharesCount: 0,
    taggedGarment: taggedGarment || {
      productTitle: 'ARCHIVE COMMUNITY PIECE',
      gsm: 'HEAVYWEIGHT',
    },
    mediaUrl:
      mediaUrl ||
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: location || 'London, UK',
    isVerified: false,
    tags: ['#toknownothing', '#fitpic', '#community'],
  };

  mockSocialFeed.unshift(newPost);

  res.status(201).json({
    success: true,
    message: 'Fit pic broadcast successfully posted to archive feed!',
    post: newPost,
  });
});


// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');
        const canonical = resolveServerCanonicalUrl(metaTagConfig, req.path);
        // Inject dynamic title, description, and OpenGraph tags
        html = html.replace(/<title>.*?<\/title>/i, `<title>${metaTagConfig.title}</title>`);
        html = html.replace(
          /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
          `<meta name="description" content="${metaTagConfig.description}" />`
        );
        html = html.replace(
          /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
          `<meta property="og:title" content="${metaTagConfig.ogTitle || metaTagConfig.title}" />`
        );
        html = html.replace(
          /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
          `<meta property="og:description" content="${metaTagConfig.ogDescription || metaTagConfig.description}" />`
        );
        res.send(html);
      } else {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TO KNOW NOTHING (London, UK) Server running on port ${PORT}`);
  });
}

startServer();
