import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

// Define the absolute path for DB storage inside AI Studio project workspace
const DB_FILE_PATH = path.join(process.cwd(), "db.json");

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: "retailer" | "admin";
  createdAt: string;
  updatedAt: string;
  isAnonymized: boolean;
}

export interface Retailer {
  id: string;
  userId: string;
  companyName: string;
  uen: string;
  address: string;
  postalCode: string;
  showroomLocations: string;
  tier: "Standard" | "Silver" | "Gold" | "Platinum";
  status: "Pending" | "Approved" | "Declined";
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: "Ceiling Fan" | "LED Downlight";
  description: string;
  basePrice: number;       // Retail Price SGD
  wholesalePrice: number;  // Distributor Base Price SGD
  moq: number;
  technicalSpecs: {
    rpmRange?: string;
    wattage: string;
    blades?: number | string;
    motorType?: string;
    lumens?: string;
    beamAngle?: string;
  };
  specSheetUrl: string;
  imageUrl: string;
  stockCount: number;
  isPreOrder: boolean;
  preOrderDiscount: number; // percentage, e.g. 15 for 15%
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  discountApplied: number;
}

export interface Order {
  id: string;
  retailerId: string;
  userId: string;
  procurementRef: string;
  status: "Pending Payment Proof" | "Payment Verified" | "Processing" | "Dispatched";
  totalQty: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  receiptUrl: string | null; // invoice or payment bank receipt screenshot base64
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: "registration" | "marketing" | "analytics";
  givenAt: string;
  withdrawnAt: string | null;
  ipAddress: string;
  userAgent: string;
}

export interface SystemSetting {
  id: string;
  campaignName: string;
  discountPercentage: number;
  isActive: boolean;
  endDate: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
  createdAt: string;
}

export interface LocalDatabase {
  users: User[];
  retailers: Retailer[];
  products: Product[];
  orders: Order[];
  consentRecords: ConsentRecord[];
  systemSettings: SystemSetting[];
  faqs: FAQItem[];
}

const INITIAL_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    q: "How does the B2B distributor qualification process work?",
    a: "Singapore retail distributorships of mechanical fans and smart LED fixtures are strictly gated to retail show-houses holding active ACRA corporate profiles. Standard registrations default to 'Pending' status. Our distributorship panel validates showrooms within 2-3 business days before unlocking active wholesale discount lines.",
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "faq-2",
    q: "What are the volume-based distributor tiers and MOQ limits?",
    a: "Point One operates under a high-efficiency discount architecture across four tiers:\n\n• Standard Tier: Baseline wholesale price; strict MOQs (5 units for fans, 20 units for lights) apply.\n• Silver Tier (Annual Volume > $50k): 5% additional bulk discount.\n• Gold Tier (Annual Volume > $120k): 10% discount.\n• Platinum Tier (Annual Volume > $250k): 15% discount.\n\nAll pricing validations are computed automatically inside the procurement cart.",
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "faq-3",
    q: "How do we arrange wire transfer payments?",
    a: "To minimize merchant processing overhead, no direct credit card gateways exist in this B2B gate. Once an order is logged on the portal, our accounts desk validates inventory blocks and issues a formal GST tax invoice via email. Payment is made offline via FAST or GIRO wire, and the deposit slip image is uploaded securely to your order timeline. Shipment is dispatched upon payment clearance.",
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "faq-4",
    q: "What warranties protect Singapore distributor orders?",
    a: "Our proprietary Brushless DC permanent magnet ceiling fan motors are backed by an elite Lifetime Motor Warranty. LED downlight drivers are covered by an administrative 3-year replacement warranty. Claims can be filed direct by compiling client service logs first on the portal.",
    createdAt: "2026-05-27T12:00:00Z"
  },
  {
    id: "faq-5",
    q: "How are pre-order campaign discount rates applied?",
    a: "Seasonal factory fabrication runs feature a compound 15% campaign discount. Pre-order lines are immediately allocated to factory manufacturing pipelines. Changes, cancellations, or refunds are strictly prohibited once structural mold tooling starts.",
    createdAt: "2026-05-27T12:00:00Z"
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "PO-AERO-52-BLK-BLDC",
    name: "Point One Aero V2 52'' Brushless DC Ceiling Fan (Pitch Black)",
    category: "Ceiling Fan",
    description: "Ultra-quiet signature ventilation fixture featuring our proprietary 6-speed reversible premium brushless BLDC motor. Extremely high efficiency, crafted in military-grade ABS composite.",
    basePrice: 599.00,
    wholesalePrice: 349.00,
    moq: 5,
    technicalSpecs: {
      rpmRange: "80 - 240 RPM",
      wattage: "35W (at max speed)",
      blades: "3 Blades, Hand-Balanced",
      motorType: "Super High Torque Permanent Magnet BLDC"
    },
    specSheetUrl: "https://www.pointonetechnology.com/specs/aero52-bldc-v2.pdf",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=600",
    stockCount: 120,
    isPreOrder: false,
    preOrderDiscount: 0,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "p2",
    sku: "PO-ZEPHYR-46-WHT-LED",
    name: "Po-Zephyr 46'' Smart Ceiling Fan with 24W Quad-Color LED Dimmer",
    category: "Ceiling Fan",
    description: "Compact architectural fan integrated with 24W designer circadian LED ring (OSRAM chips). Tri-color, dimmable via smart distributor RF control and smart home IoT routers.",
    basePrice: 650.00,
    wholesalePrice: 390.00,
    moq: 5,
    technicalSpecs: {
      rpmRange: "90 - 260 RPM",
      wattage: "28W (Fan) + 24W (LED)",
      blades: "5 Slim-Profile ABS Blades",
      motorType: "Ultra-Efficient Brushless DC Inner-Rotor"
    },
    specSheetUrl: "https://www.pointonetechnology.com/specs/zephyr46-led.pdf",
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600",
    stockCount: 75,
    isPreOrder: false,
    preOrderDiscount: 0,
    createdAt: "2026-01-05T00:00:00Z"
  },
  {
    id: "p3",
    sku: "PO-LUMEN-DK-12W-AMB",
    name: "Point One Pure Glow 12W COB Anti-Glare LED Architect Downlight",
    category: "LED Downlight",
    description: "Anti-glare architectural spotlight, UGR<16 recessed bezel with true 95+ CRI OSRAM LED chip. Exceptional color rendering for luxury Singapore residential showroom displays.",
    basePrice: 48.00,
    wholesalePrice: 22.00,
    moq: 20,
    technicalSpecs: {
      wattage: "12W",
      lumens: "980 lm",
      beamAngle: "36 Degree Spotlight Accent",
      motorType: "Flicker-Free Constant Current Isolated Driver"
    },
    specSheetUrl: "https://www.pointonetechnology.com/specs/lumendk12w.pdf",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600",
    stockCount: 500,
    isPreOrder: false,
    preOrderDiscount: 0,
    createdAt: "2026-02-12T00:00:00Z"
  },
  {
    id: "p4",
    sku: "PO-KINETIC-56-TITAN-PRE",
    name: "Point One Kinetic 56'' Brushless Fan (Titanium Edition - Pre-Order Only)",
    category: "Ceiling Fan",
    description: "Premium large-span high-velocity fan engineered for commercial workspaces or bungalows. Sleek metallic titanium aircraft blades, dynamic blade sweep, optimized aerodynamics.",
    basePrice: 899.00,
    wholesalePrice: 519.00,
    moq: 4,
    technicalSpecs: {
      rpmRange: "60 - 200 RPM",
      wattage: "42W (Heavy-Duty Motor)",
      blades: "3 Premium Aircraft Aluminum Alloy Blades",
      motorType: "Brushless 16-Pole Outer Rotor High-Torque BLDC"
    },
    specSheetUrl: "https://www.pointonetechnology.com/specs/kinetic56-pre.pdf",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
    stockCount: 0,
    isPreOrder: true,
    preOrderDiscount: 15, // 15% pre-order markdown
    createdAt: "2026-05-10T00:00:00Z"
  }
];

const INITIAL_SETTINGS: SystemSetting[] = [
  {
    id: "preorder_campaign",
    campaignName: "Pre-Order Ventilation Drive Q2/Q3",
    discountPercentage: 15,
    isActive: true,
    endDate: "2026-09-30T15:59:59Z",
    updatedAt: "2026-05-27T12:00:00Z"
  }
];

// Helper to check and load/save DB state dynamically and atomic
export class DB {
  private static load(): LocalDatabase {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync("hostsystems2018!", salt);
      const initialDb: LocalDatabase = {
        users: [
          // Pre-populate admin user for logging in easily
          {
            id: "admin-user-id",
            email: "andrew.lim@hostsystems.sg",
            passwordHash: passwordHash,
            fullName: "Andrew Lim (Master Admin)",
            phone: "+65 6717 6511",
            role: "admin",
            createdAt: "2026-05-15T00:00:00Z",
            updatedAt: "2026-05-15T00:00:00Z",
            isAnonymized: false
          }
        ],
        retailers: [],
        products: INITIAL_PRODUCTS,
        orders: [],
        consentRecords: [],
        systemSettings: INITIAL_SETTINGS,
        faqs: INITIAL_FAQS
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    
    try {
      const content = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const db = JSON.parse(content) as LocalDatabase;
      
      let changed = false;

      // Ensure faqs list is present and initialized
      if (!db.faqs) {
        db.faqs = INITIAL_FAQS;
        changed = true;
      }

      // Migration: Remove old admin and add the new one on-the-fly
      const oldIndex = db.users.findIndex(u => u.email.toLowerCase() === "admin@pointone.sg");
      if (oldIndex >= 0) {
        db.users.splice(oldIndex, 1);
        changed = true;
      }
      
      const newAdminIdx = db.users.findIndex(u => u.email.toLowerCase() === "andrew.lim@hostsystems.sg");
      if (newAdminIdx < 0) {
        const salt = bcrypt.genSaltSync(12);
        const passwordHash = bcrypt.hashSync("hostsystems2018!", salt);
        db.users.push({
          id: "admin-user-id",
          email: "andrew.lim@hostsystems.sg",
          passwordHash: passwordHash,
          fullName: "Andrew Lim (Master Admin)",
          phone: "+65 6717 6511",
          role: "admin",
          createdAt: "2026-05-15T00:00:00Z",
          updatedAt: "2026-05-15T00:00:00Z",
          isAnonymized: false
        });
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
      }
      
      return db;
    } catch {
      // In case of corrupt files
      return {
        users: [],
        retailers: [],
        products: INITIAL_PRODUCTS,
        orders: [],
        consentRecords: [],
        systemSettings: INITIAL_SETTINGS,
        faqs: INITIAL_FAQS
      };
    }
  }

  private static save(db: LocalDatabase) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  }

  // FAQ Operations
  static getFaqs(): FAQItem[] {
    const db = this.load();
    return db.faqs || INITIAL_FAQS;
  }

  static saveFaq(faq: FAQItem): FAQItem {
    const db = this.load();
    if (!db.faqs) db.faqs = [];
    const idx = db.faqs.findIndex(f => f.id === faq.id || (f.q.trim().toLowerCase() === faq.q.trim().toLowerCase() && f.id === "new"));
    if (idx >= 0) {
      db.faqs[idx] = faq;
    } else {
      db.faqs.push(faq);
    }
    this.save(db);
    return faq;
  }

  static deleteFaq(faqId: string): boolean {
    const db = this.load();
    if (!db.faqs) return false;
    const initialLength = db.faqs.length;
    db.faqs = db.faqs.filter(f => f.id !== faqId);
    if (db.faqs.length === initialLength) return false;
    this.save(db);
    return true;
  }

  // User Operations
  static getUsers(): User[] {
    return this.load().users;
  }

  static saveUser(user: User): User {
    const db = this.load();
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      db.users[idx] = user;
    } else {
      db.users.push(user);
    }
    this.save(db);
    return user;
  }

  // Retailer Operations
  static getRetailers(): Retailer[] {
    return this.load().retailers;
  }

  static findRetailerByUserId(userId: string): Retailer | undefined {
    return this.load().retailers.find(r => r.userId === userId);
  }

  static saveRetailer(retailer: Retailer): Retailer {
    const db = this.load();
    const idx = db.retailers.findIndex(r => r.id === retailer.id);
    if (idx >= 0) {
      db.retailers[idx] = retailer;
    } else {
      db.retailers.push(retailer);
    }
    this.save(db);
    return retailer;
  }

  // Products Operations
  static getProducts(): Product[] {
    return this.load().products;
  }

  static saveProduct(product: Product): Product {
    const db = this.load();
    const idx = db.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      db.products[idx] = product;
    } else {
      db.products.push(product);
    }
    this.save(db);
    return product;
  }

  static deleteProduct(productId: string): boolean {
    const db = this.load();
    const filter = db.products.filter(p => p.id !== productId);
    if (filter.length === db.products.length) return false;
    db.products = filter;
    this.save(db);
    return true;
  }

  // Orders Operations
  static getOrders(): Order[] {
    return this.load().orders;
  }

  static saveOrder(order: Order): Order {
    const db = this.load();
    const idx = db.orders.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      db.orders[idx] = order;
    } else {
      db.orders.push(order);
    }
    this.save(db);
    return order;
  }

  // Consent Records Operations
  static getConsentRecords(): ConsentRecord[] {
    return this.load().consentRecords;
  }

  static saveConsentRecord(record: ConsentRecord): ConsentRecord {
    const db = this.load();
    db.consentRecords.push(record);
    this.save(db);
    return record;
  }

  // Systems Settings
  static getSystemSettings(): SystemSetting[] {
    return this.load().systemSettings;
  }

  static saveSystemSetting(setting: SystemSetting): SystemSetting {
    const db = this.load();
    const idx = db.systemSettings.findIndex(s => s.id === setting.id);
    if (idx >= 0) {
      db.systemSettings[idx] = setting;
    } else {
      db.systemSettings.push(setting);
    }
    this.save(db);
    return setting;
  }
}
