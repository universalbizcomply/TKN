import { GoogleGenAI, GenerateVideosOperation, FunctionDeclaration, Type } from '@google/genai';
import { Request, Response, Router } from 'express';
import { store, ProductStock, Order, PromoCode } from './store';

export const geminiRouter = Router();

// Lazy or safe client initialization
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// ADMIN FUNCTION DECLARATIONS (Full Admin Authority)
// -------------------------------------------------------------
const adminFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'updateOrderStatus',
    description: 'Update the fulfillment status, carrier, tracking number, or timeline note of a customer order in the store.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { type: Type.STRING, description: 'Order ID, e.g. TKN-7814, TKN-8492, or TKN-9021' },
        status: { type: Type.STRING, description: 'New order status: pending, processing, shipped, delivered, or cancelled' },
        carrier: { type: Type.STRING, description: 'Shipping carrier, e.g. Royal Mail Tracked 24, DHL Express International' },
        trackingNumber: { type: Type.STRING, description: 'Tracking barcode or reference, e.g. GB-RM-940028192UK' },
        note: { type: Type.STRING, description: 'Timeline note explaining the fulfillment update' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'cancelOrder',
    description: 'Cancel a customer order and automatically return all ordered garments back to active stock.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { type: Type.STRING, description: 'Order ID to cancel, e.g. TKN-7814' },
        reason: { type: Type.STRING, description: 'Reason for cancellation' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'updateOrderAddress',
    description: 'Update the shipping destination address of an unfulfilled order.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { type: Type.STRING, description: 'Order ID, e.g. TKN-7814' },
        street: { type: Type.STRING, description: 'Street address' },
        city: { type: Type.STRING, description: 'City' },
        state: { type: Type.STRING, description: 'State or region' },
        zip: { type: Type.STRING, description: 'Postal code' },
        country: { type: Type.STRING, description: 'Country' },
      },
      required: ['orderId', 'street', 'city'],
    },
  },
  {
    name: 'adjustInventory',
    description: 'Adjust or set the inventory stock for a product size in the live warehouse.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: 'Product ID, e.g. 500gsm-hoodie, acid-box-tee, skate-pant' },
        size: { type: Type.STRING, description: 'Garment size, e.g. S, M, L, XL, XXL, 30, 32, 34' },
        delta: { type: Type.NUMBER, description: 'Relative unit change to add or subtract, e.g. +10, -3' },
        absoluteStock: { type: Type.NUMBER, description: 'Set exact inventory quantity, e.g. 0 or 25' },
      },
      required: ['productId', 'size'],
    },
  },
  {
    name: 'createPromoCode',
    description: 'Create or update a promotional discount coupon for the storefront.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: 'Promo coupon code uppercase, e.g. FLASH25, ARCHIVE15' },
        discountPercent: { type: Type.NUMBER, description: 'Percentage off, e.g. 15, 20, 25' },
        description: { type: Type.STRING, description: 'Campaign description' },
        maxUses: { type: Type.NUMBER, description: 'Maximum allowed uses, e.g. 100 or 500' },
      },
      required: ['code', 'discountPercent'],
    },
  },
  {
    name: 'togglePromoCode',
    description: 'Activate or deactivate an existing promotional code.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: 'Promo code to toggle' },
        active: { type: Type.BOOLEAN, description: 'True to activate, false to pause' },
      },
      required: ['code'],
    },
  },
  {
    name: 'updateDropBanner',
    description: 'Update the storefront banner announcement text, tag, or active visibility.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: 'Announcement text' },
        tag: { type: Type.STRING, description: 'Tag header, e.g. [WHAT\'S NEW DROP]' },
        active: { type: Type.BOOLEAN, description: 'Whether the banner is displayed' },
      },
    },
  },
  {
    name: 'notifyWaitlist',
    description: 'Trigger restock alerts to customers waiting for a sold-out item.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: 'Product ID or "all" to alert waiting customers' },
      },
    },
  },
  {
    name: 'getStoreSnapshot',
    description: 'Retrieve real-time revenue, order queues, low-stock alerts, and urgent tasks for the store.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: { type: Type.STRING, description: 'Optional focus area: all, revenue, inventory, orders' },
      },
    },
  },
];

// Helper to execute function call against store
function executeStoreTool(name: string, args: any) {
  switch (name) {
    case 'updateOrderStatus': {
      return store.executeAdminAction({
        type: 'update_order_status',
        params: {
          orderId: args.orderId,
          status: args.status,
          carrier: args.carrier,
          trackingNumber: args.trackingNumber,
          note: args.note,
        },
      });
    }
    case 'cancelOrder': {
      return store.executeAdminAction({
        type: 'cancel_order',
        params: {
          orderId: args.orderId,
          reason: args.reason,
        },
      });
    }
    case 'updateOrderAddress': {
      return store.executeAdminAction({
        type: 'update_order_address',
        params: {
          orderId: args.orderId,
          street: args.street,
          city: args.city,
          state: args.state,
          zip: args.zip,
          country: args.country,
        },
      });
    }
    case 'adjustInventory': {
      return store.executeAdminAction({
        type: 'adjust_inventory',
        params: {
          productId: args.productId,
          size: args.size,
          delta: args.delta,
          absoluteStock: args.absoluteStock,
        },
      });
    }
    case 'createPromoCode': {
      return store.executeAdminAction({
        type: 'create_promo',
        params: {
          code: args.code,
          discountPercent: args.discountPercent,
          description: args.description,
          maxUses: args.maxUses,
        },
      });
    }
    case 'togglePromoCode': {
      return store.executeAdminAction({
        type: 'toggle_promo',
        params: {
          code: args.code,
          active: args.active,
        },
      });
    }
    case 'updateDropBanner': {
      return store.executeAdminAction({
        type: 'update_banner',
        params: {
          message: args.message,
          tag: args.tag,
          active: args.active,
        },
      });
    }
    case 'notifyWaitlist': {
      return store.executeAdminAction({
        type: 'notify_waitlist',
        params: {
          productId: args.productId,
        },
      });
    }
    case 'getStoreSnapshot': {
      return store.executeAdminAction({
        type: 'get_store_snapshot',
        params: {},
      });
    }
    default:
      return { success: false, actionType: name, summary: `Unknown tool call: ${name}` };
  }
}

// -------------------------------------------------------------
// 1. BACK OFFICE ADMIN CHATBOT (FULL ADMIN AUTHORITY)
// -------------------------------------------------------------
const ADMIN_SYSTEM_INSTRUCTION = `You are the Executive Chief of Operations and Full-Authority Store Co-Pilot for "TO KNOW NOTHING" (London heavyweight apparel archive & studio, Redchurch St Shoreditch & Bermondsey workshop).
You have FULL ADMINISTRATIVE AUTHORITY to manage, automate, and resolve issues for the business owner.

You are equipped with real executable store tools:
1. updateOrderStatus: Change order status (pending, processing, shipped, delivered, cancelled), assign carrier (e.g. Royal Mail Tracked 24) and tracking numbers.
2. cancelOrder: Cancel order and immediately return garments back into inventory stock.
3. updateOrderAddress: Update destination shipping address.
4. adjustInventory: Add or set inventory units for any garment and size.
5. createPromoCode: Create or update discount coupons with percentage, limits, and descriptions.
6. togglePromoCode: Enable or disable active promo codes.
7. updateDropBanner: Change the storefront announcement banner text and visibility.
8. notifyWaitlist: Dispatch restock alerts to waiting customers.
9. getStoreSnapshot: Retrieve live financial performance, pending orders, and low-stock alerts.

When the business owner asks you to perform an action (e.g. "Mark order TKN-7814 as shipped with tracking RM-9821", "Restock 500GSM HOODIE size L by 20 units", "Create promo CODE20 for 20% off", "What orders are pending?"), ALWAYS CALL the relevant function tool to execute it directly!
Keep your conversational tone confident, executive, efficient, and precise. Summarize the executed action clearly.`;

geminiRouter.post('/admin-chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], model = 'gemini-3.5-flash', role = 'operations_autopilot' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required.' });
    }

    const ai = getGenAI();
    let targetModel = model;

    // Build multi-turn contents
    const contents: any[] = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    // Inject live store context into system instructions
    const snapshot = store.getStoreSnapshot();
    const dynamicSystemInstruction = `${ADMIN_SYSTEM_INSTRUCTION}

CURRENT STORE STATE:
- Gross Revenue: £${snapshot.grossRevenue}
- Total Orders: ${snapshot.totalOrders} (Pending: ${snapshot.pendingOrdersCount}, Processing: ${snapshot.processingOrdersCount}, Shipped: ${snapshot.shippedOrdersCount})
- Pending Orders: ${JSON.stringify(snapshot.pendingOrders)}
- Low Stock Items: ${JSON.stringify(snapshot.lowStockItems.slice(0, 6))}
- Active Promos: ${snapshot.activePromosCount}
- Drop Banner: "${snapshot.bannerMessage}" (Active: ${snapshot.bannerActive})
- Customers Waiting on Waitlist: ${snapshot.waitingCustomersCount}`;

    let response;
    const actionsExecuted: any[] = [];

    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          tools: [{ functionDeclarations: adminFunctionDeclarations }],
        },
      });
    } catch (primaryErr: any) {
      // Fallback if pro-preview is rate-limited
      if (primaryErr?.message?.includes('Quota exceeded') || primaryErr?.status === 'RESOURCE_EXHAUSTED') {
        targetModel = 'gemini-3.5-flash';
        response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction: dynamicSystemInstruction,
            tools: [{ functionDeclarations: adminFunctionDeclarations }],
          },
        });
      } else {
        throw primaryErr;
      }
    }

    // Check if the model triggered any tool calls
    const functionCalls = response.functionCalls;
    let finalBotText = response.text || '';

    if (functionCalls && functionCalls.length > 0) {
      const toolResults: any[] = [];
      for (const call of functionCalls) {
        if (!call.name) continue;
        const result = executeStoreTool(call.name, call.args);
        actionsExecuted.push(result);
        toolResults.push({
          callId: (call as any).id,
          name: call.name,
          response: result,
        });
      }

      // If text was empty or brief, append confirmation of actions
      if (!finalBotText || finalBotText.trim().length === 0) {
        finalBotText = actionsExecuted.map((a) => `✅ **${a.summary}**`).join('\n\n');
      }
    }

    res.json({
      success: true,
      text: finalBotText,
      modelUsed: targetModel,
      actionsExecuted,
      snapshot: store.getStoreSnapshot(),
    });
  } catch (error: any) {
    console.error('Gemini Admin Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Admin Chat request failed',
      isQuotaError: error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED',
    });
  }
});

// Backwards-compatible /chat route (routes to admin-chat or legacy roles)
geminiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { model, role = 'creative_director', systemInstruction, messages = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required.' });
    }

    // If role is rapid_ops or operations, delegate with admin tools!
    if (role === 'rapid_ops' || role === 'operations_autopilot') {
      req.url = '/admin-chat';
      return (geminiRouter as any).handle(req, res);
    }

    const ai = getGenAI();
    let targetModel = model || (role === 'creative_director' ? 'gemini-3.5-flash' : 'gemini-3.5-flash');

    const defaultRolePrompts: Record<string, string> = {
      creative_director:
        'You are the Archive Creative Director and Brand Copywriter for "TO KNOW NOTHING", a London-based heavy apparel archive (Hackney & Bermondsey workshop). You specialize in 300–500GSM ultra-dense cut-and-sew cotton, mineral acid washes, raw edge distressing, silkscreen puff printing, and gritty skate zine culture. You craft high-impact editorial drop manifestos, concept collections, analyze competitive streetwear positioning, and provide authentic, sharp advice.',
      apparel_stylist:
        'You are the Senior Apparel Stylist and Garment Spec Advisor for "TO KNOW NOTHING" in London, UK. You provide expert sizing guidance for our boxy drop-shoulder tees (300-320GSM), ultra-heavy french terry hoodies (500GSM), and 14oz duck canvas skate pants. You explain how heavy cotton drapes, recommend layering combinations, and advise on cold wash and flat dry care to prevent shrinkage or silkscreen cracking.',
    };

    const activeSystemInstruction = systemInstruction || defaultRolePrompts[role] || defaultRolePrompts.creative_director;

    const contents = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: { systemInstruction: activeSystemInstruction },
      });
    } catch (primaryErr: any) {
      if (targetModel === 'gemini-3.1-pro-preview' && primaryErr?.message?.includes('Quota exceeded')) {
        targetModel = 'gemini-3.5-flash';
        response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config: { systemInstruction: activeSystemInstruction },
        });
      } else {
        throw primaryErr;
      }
    }

    res.json({
      success: true,
      text: response.text,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Chat generation failed',
      isQuotaError: error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED',
    });
  }
});

// -------------------------------------------------------------
// 2. FRONT-OF-HOUSE CUSTOMER CHATBOT (SALES, CUSTOMER SERVICE, Q&A)
// -------------------------------------------------------------
const CUSTOMER_SYSTEM_INSTRUCTION = `You are TKN, the official AI Customer Concierge & Archive Assistant for "TO KNOW NOTHING", a London-based heavy apparel streetwear brand and zine studio (Redchurch St Shoreditch workshop & Bermondsey print atelier).
Your name is TKN. Always refer to yourself as TKN (or "TKN Archive Concierge").

You have three integrated responsibilities to help store visitors:

1. SALES ASSISTANT:
- Recommend garments based on the customer's personal style, layering preferences, or fit silhouette.
- Expertly explain what heavyweight cut-and-sew cotton means: 300 GSM combed jersey tees (thick, no cling, no bacon collar), 500 GSM loopback French Terry hoodies (rigid upright double hood, built like body armor), and 14oz duck canvas skate pants (indestructible with double knees and brass rivets).
- Suggest matching capsule outfits (e.g. Acid Box Tee + Duck Canvas Skate Pants, or 500GSM Hoodie + Raw Edge Crew).
- When mentioning products, reference their exact titles: ACID BOX TEE (£48), 500GSM HOODIE (£88), RAW EDGE CREW (£72), WAFFLE THERMAL (£54), SKATE PANT (£92), 550GSM ZIP HOODIE (£98 - sold out), HEAVY POCKET TEE (£44).

2. CUSTOMER SERVICE:
- Order Tracking: You have access to real-time order tracking. If a customer provides an order number (e.g. TKN-9021, TKN-8492, TKN-7814), confirm their current status, carrier (Royal Mail Tracked 24 or DHL Express), tracking number, and dispatch progress.
- Sizing Guidance: Provide precise fit advice. Our shirts & hoodies feature a boxy drop-shoulder cut. If they prefer a traditional fit, advise true-to-size or sizing down. If they want an exaggerated skate oversized silhouette, suggest sizing up.
- Wash & Care: 100% heavy combed cotton requires cold wash (30°C max), washed inside-out to preserve silkscreen puff prints, and hang-dried or flat-dried. Advise them to NEVER tumble-dry heavy loopback terry to eliminate shrinkage.
- Shipping & Returns: London studio orders dispatch within 24h via Royal Mail Tracked 24. Free UK shipping over £120. 14-day return and exchange window for unworn items with original archive tags attached.

3. Q&A:
- Answer questions on drop schedules (new capsules drop every Friday at midnight UK time).
- Pop-up locations: 14 Redchurch Street, Shoreditch, London E2.
- Sustainability: Made from ethically sourced ring-spun cotton with water-based eco inks and recyclable zine mailers.

TONE:
Streetwear-fluent, respectful, knowledgeable, warm, concise, and helpful. Avoid robotic corporate jargon. Use clean formatting with bullet points when listing specs or instructions.`;

geminiRouter.post('/customer-chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], customerMode = 'all', preferredModel } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required.' });
    }

    const ai = getGenAI();
    const model = preferredModel || 'gemini-3.5-flash';

    // Scan messages for order numbers (e.g. TKN-9021)
    let referencedOrder: Order | undefined;
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';
    const orderMatch = lastUserMessage.match(/TKN-\d{4}/i);

    if (orderMatch) {
      referencedOrder = store.findOrder(orderMatch[0]);
    }

    // Determine relevant products to recommend
    const allProducts = store.getProducts();
    const matchingProducts: ProductStock[] = [];
    const lowerText = lastUserMessage.toLowerCase();

    allProducts.forEach((p) => {
      if (
        lowerText.includes(p.id) ||
        lowerText.includes(p.title.toLowerCase()) ||
        lowerText.includes(p.category) ||
        (lowerText.includes('hoodie') && p.category === 'hoodies') ||
        (lowerText.includes('pant') && p.category === 'pants') ||
        (lowerText.includes('tee') && p.category === 'shirts') ||
        (lowerText.includes('heavy') && p.gsm.includes('500'))
      ) {
        matchingProducts.push(p);
      }
    });

    // Build context injection
    let contextualNotes = `\nAVAILABLE PRODUCTS IN STORE:\n`;
    allProducts.forEach((p) => {
      const inStockSizes = Object.entries(p.stock)
        .filter(([_, q]) => q > 0)
        .map(([s, q]) => `${s}(${q})`)
        .join(', ');
      contextualNotes += `- ${p.title} (£${p.price}, ${p.gsm}, Category: ${p.category}): Sizes available: [${inStockSizes || 'SOLD OUT'}]\n`;
    });

    if (referencedOrder) {
      contextualNotes += `\n[VERIFIED LIVE ORDER LOOKUP FOR CUSTOMER]:
Order ID: ${referencedOrder.id}
Customer Name: ${referencedOrder.customer.name}
Destination: ${referencedOrder.customer.street}, ${referencedOrder.customer.city}, ${referencedOrder.customer.country}
Status: ${referencedOrder.status.toUpperCase()}
Carrier: ${referencedOrder.carrier || 'Royal Mail Tracked 24'}
Tracking Number: ${referencedOrder.trackingNumber || 'Awaiting barcode assignment'}
Items: ${referencedOrder.items.map((i) => `${i.title} (${i.size}) x${i.quantity}`).join(', ')}
Total: £${referencedOrder.total}
Timeline: ${referencedOrder.timeline.map((t) => `${t.status}: ${t.note}`).join(' -> ')}\n`;
    }

    const contents = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: `${CUSTOMER_SYSTEM_INSTRUCTION}\n${contextualNotes}`,
      },
    });

    // Extract suggested product IDs for client UI
    const suggestedProductIds = Array.from(new Set(matchingProducts.map((p) => p.id)));

    res.json({
      success: true,
      text: response.text,
      modelUsed: model,
      suggestedProductIds: suggestedProductIds.slice(0, 3),
      orderCard: referencedOrder || null,
    });
  } catch (error: any) {
    console.error('Customer Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Customer assistant service temporarily unavailable.',
      isQuotaError: error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED',
    });
  }
});

// -------------------------------------------------------------
// 3. CREATE & EDIT IMAGES (gemini-3.1-flash-image-preview)
// -------------------------------------------------------------
geminiRouter.post('/image', async (req: Request, res: Response) => {
  try {
    const { prompt, mode = 'generate', aspectRatio = '1:1', sourceImageBase64 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text prompt is required for image creation or editing.',
      });
    }

    const ai = getGenAI();
    const model = 'gemini-3.1-flash-image-preview';

    let contents: any;

    if (mode === 'edit' && sourceImageBase64) {
      let mimeType = 'image/png';
      let rawData = sourceImageBase64;
      if (sourceImageBase64.includes(';base64,')) {
        const parts = sourceImageBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/png';
        rawData = parts[1];
      }

      contents = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: rawData,
            },
          },
          { text: prompt },
        ],
      };
    } else {
      contents = {
        parts: [{ text: prompt }],
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: '1K',
        },
      },
    });

    let imageUrl = '';
    let responseText = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          responseText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: responseText || 'No image was generated by the model.',
      });
    }

    res.json({
      success: true,
      imageUrl,
      text: responseText,
      modelUsed: model,
      aspectRatio,
      mode,
    });
  } catch (error: any) {
    console.error('Gemini Image API Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process image generation/editing',
      isQuotaError: error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED',
    });
  }
});

// -------------------------------------------------------------
// 4. GENERATE VIDEO FROM TEXT (veo-3.1-fast-generate-preview)
// -------------------------------------------------------------
geminiRouter.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9', resolution = '720p' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video prompt is required.',
      });
    }

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const ai = getGenAI();
    const model = 'veo-3.1-fast-generate-preview';

    const operation = await ai.models.generateVideos({
      model,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: validAspectRatio,
      },
    });

    res.json({
      success: true,
      operationName: operation.name,
      modelUsed: model,
      aspectRatio: validAspectRatio,
    });
  } catch (error: any) {
    console.error('Veo Generate Video API Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to initiate video generation',
      isQuotaError: error?.message?.includes('Quota exceeded') || error?.status === 'RESOURCE_EXHAUSTED',
    });
  }
});

geminiRouter.post('/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ success: false, error: 'operationName is required' });
    }

    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      success: true,
      done: Boolean(updated.done),
      error: updated.error || null,
      hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
    });
  } catch (error: any) {
    console.error('Veo Video Status Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to check video status',
    });
  }
});

geminiRouter.post('/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ success: false, error: 'operationName is required' });
    }

    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ success: false, error: 'Video download URI not ready or not found.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey || '' },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
    }

    const arrayBuf = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    console.error('Veo Video Download Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to download generated video',
    });
  }
});
