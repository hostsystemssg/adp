import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";

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
  basePrice: number;       // Retail SGD
  wholesalePrice: number;  // Distributor Base SGD
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
  receiptUrl: string | null;
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

export const INITIAL_FAQS: FAQItem[] = [
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

export const INITIAL_PRODUCTS: Product[] = [
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
    preOrderDiscount: 15,
    createdAt: "2026-05-10T00:00:00Z"
  }
];

export const INITIAL_SETTINGS: SystemSetting[] = [
  {
    id: "preorder_campaign",
    campaignName: "Pre-Order Ventilation Drive Q2/Q3",
    discountPercentage: 15,
    isActive: true,
    endDate: "2026-09-30T15:59:59Z",
    updatedAt: "2026-05-27T12:00:00Z"
  }
];

// Helper database loaders/saves for FILE STORAGE (Legacy fallback)
export class DB {
  public static load(): LocalDatabase {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync("hostsystems2018!", salt);
      const initialDb: LocalDatabase = {
        users: [
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

      if (!db.faqs) {
        db.faqs = INITIAL_FAQS;
        changed = true;
      }

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

  public static save(db: LocalDatabase) {
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
}

// Map helper functions for PostgreSQL conversions
function mapRowToUser(r: any): User {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    fullName: r.full_name,
    phone: r.phone,
    role: r.role as any,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    isAnonymized: Boolean(r.is_anonymized)
  };
}

function mapRowToRetailer(r: any): Retailer {
  return {
    id: r.id,
    userId: r.user_id,
    companyName: r.company_name,
    uen: r.uen,
    address: r.address,
    postalCode: r.postal_code,
    showroomLocations: r.showroom_locations,
    tier: r.tier as any,
    status: r.status as any,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at
  };
}

function mapRowToProduct(r: any): Product {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category as any,
    description: r.description,
    basePrice: Number(r.base_price),
    wholesalePrice: Number(r.wholesale_price),
    moq: Number(r.moq),
    technicalSpecs: typeof r.technical_specs === 'string' ? JSON.parse(r.technical_specs) : r.technical_specs,
    specSheetUrl: r.spec_sheet_url || "",
    imageUrl: r.image_url || "",
    stockCount: Number(r.stock_count || 0),
    isPreOrder: Boolean(r.is_pre_order),
    preOrderDiscount: Number(r.pre_order_discount || 0),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
  };
}

function mapRowToFaq(r: any): FAQItem {
  return {
    id: r.id,
    q: r.question,
    a: r.answer,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
  };
}

function mapRowToConsent(r: any): ConsentRecord {
  return {
    id: r.id,
    userId: r.user_id,
    purpose: r.purpose as any,
    givenAt: r.given_at instanceof Date ? r.given_at.toISOString() : r.given_at,
    withdrawnAt: r.withdrawn_at ? (r.withdrawn_at instanceof Date ? r.withdrawn_at.toISOString() : r.withdrawn_at) : null,
    ipAddress: r.ip_address,
    userAgent: r.user_agent
  };
}

// MODERN ASYNCHRONOUS DATABASE LAYER (Capable of Vercel Postgres or local fallback list)
export class VercelDb {
  private static isPostgres(): boolean {
    return !!process.env.POSTGRES_URL;
  }

  public static async ensureTables() {
    if (!this.isPostgres()) {
      // Local fallback initializes sync file if absent
      DB.load();
      return;
    }

    try {
      // Ensure all standard tables exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          role TEXT CHECK (role IN ('retailer', 'admin')) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          is_anonymized BOOLEAN DEFAULT FALSE
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS retailers (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          company_name TEXT NOT NULL,
          uen TEXT UNIQUE NOT NULL,
          address TEXT NOT NULL,
          postal_code TEXT NOT NULL,
          showroom_locations TEXT NOT NULL,
          tier TEXT CHECK (tier IN ('Standard', 'Silver', 'Gold', 'Platinum')) DEFAULT 'Standard',
          status TEXT CHECK (status IN ('Pending', 'Approved', 'Declined')) DEFAULT 'Pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT CHECK (category IN ('Ceiling Fan', 'LED Downlight')) NOT NULL,
          description TEXT NOT NULL,
          base_price DECIMAL(10,2) NOT NULL,
          wholesale_price DECIMAL(10,2) NOT NULL,
          moq INTEGER NOT NULL,
          technical_specs JSONB NOT NULL,
          spec_sheet_url TEXT,
          image_url TEXT,
          stock_count INTEGER DEFAULT 0,
          is_pre_order BOOLEAN DEFAULT FALSE,
          pre_order_discount INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          retailer_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          procurement_ref TEXT NOT NULL,
          status TEXT CHECK (status IN ('Pending Payment Proof', 'Payment Verified', 'Processing', 'Dispatched')) NOT NULL,
          total_qty INTEGER NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          discount_amount DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          receipt_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          qty INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          discount_applied INTEGER DEFAULT 0
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS consent_records (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          purpose TEXT CHECK (purpose IN ('registration', 'marketing', 'analytics')) NOT NULL,
          given_at TIMESTAMPTZ DEFAULT NOW(),
          withdrawn_at TIMESTAMPTZ,
          ip_address TEXT NOT NULL,
          user_agent TEXT NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS faqs (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // Seed Default User (Admin)
      const usersQuery = await sql`SELECT COUNT(*)::INTEGER as count FROM users`;
      if (Number(usersQuery.rows[0].count) === 0) {
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash("hostsystems2018!", salt);
        await sql`
          INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at, is_anonymized)
          VALUES ('admin-user-id', 'andrew.lim@hostsystems.sg', ${hashed}, 'Andrew Lim (Master Admin)', '+65 6717 6511', 'admin', NOW(), NOW(), FALSE)
        `;
      }

      // Seed Products if empty
      const productsQuery = await sql`SELECT COUNT(*)::INTEGER as count FROM products`;
      if (Number(productsQuery.rows[0].count) === 0) {
        for (const p of INITIAL_PRODUCTS) {
          const specsStr = JSON.stringify(p.technicalSpecs);
          await sql`
            INSERT INTO products (id, sku, name, category, description, base_price, wholesale_price, moq, technical_specs, spec_sheet_url, image_url, stock_count, is_pre_order, pre_order_discount, created_at)
            VALUES (${p.id}, ${p.sku}, ${p.name}, ${p.category}, ${p.description}, ${p.basePrice}, ${p.wholesalePrice}, ${p.moq}, ${specsStr}, ${p.specSheetUrl}, ${p.imageUrl}, ${p.stockCount}, ${p.isPreOrder}, ${p.preOrderDiscount}, NOW())
          `;
        }
      }

      // Seed FAQs if empty
      const faqsQuery = await sql`SELECT COUNT(*)::INTEGER as count FROM faqs`;
      if (Number(faqsQuery.rows[0].count) === 0) {
        for (const f of INITIAL_FAQS) {
          await sql`
            INSERT INTO faqs (id, question, answer, created_at)
            VALUES (${f.id}, ${f.q}, ${f.a}, NOW())
          `;
        }
      }
    } catch (err) {
      console.error("Database connection initialization failed:", err);
    }
  }

  // FAQ Operations
  static async getFaqs(): Promise<FAQItem[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getFaqs();
    }
    const { rows } = await sql`SELECT * FROM faqs ORDER BY created_at ASC`;
    return rows.map(mapRowToFaq);
  }

  static async saveFaq(faq: FAQItem): Promise<FAQItem> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveFaq(faq);
    }
    const existing = await sql`SELECT id FROM faqs WHERE id = ${faq.id}`;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE faqs
        SET question = ${faq.q}, answer = ${faq.a}
        WHERE id = ${faq.id}
      `;
    } else {
      await sql`
        INSERT INTO faqs (id, question, answer, created_at)
        VALUES (${faq.id}, ${faq.q}, ${faq.a}, NOW())
      `;
    }
    return faq;
  }

  static async deleteFaq(faqId: string): Promise<boolean> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.deleteFaq(faqId);
    }
    const result = await sql`DELETE FROM faqs WHERE id = ${faqId}`;
    return (result.rowCount ?? 0) > 0;
  }

  // User Operations
  static async getUsers(): Promise<User[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getUsers();
    }
    const { rows } = await sql`SELECT * FROM users`;
    return rows.map(mapRowToUser);
  }

  static async saveUser(user: User): Promise<User> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveUser(user);
    }
    const existing = await sql`SELECT id FROM users WHERE id = ${user.id}`;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE users
        SET email = ${user.email}, password_hash = ${user.passwordHash}, full_name = ${user.fullName}, 
            phone = ${user.phone}, role = ${user.role}, updated_at = NOW(), is_anonymized = ${user.isAnonymized}
        WHERE id = ${user.id}
      `;
    } else {
      await sql`
        INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at, is_anonymized)
        VALUES (${user.id}, ${user.email}, ${user.passwordHash}, ${user.fullName}, ${user.phone}, ${user.role}, NOW(), NOW(), ${user.isAnonymized})
      `;
    }
    return user;
  }

  // Retailer Operations
  static async getRetailers(): Promise<Retailer[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getRetailers();
    }
    const { rows } = await sql`SELECT * FROM retailers`;
    return rows.map(mapRowToRetailer);
  }

  static async findRetailerByUserId(userId: string): Promise<Retailer | undefined> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.findRetailerByUserId(userId);
    }
    const { rows } = await sql`SELECT * FROM retailers WHERE user_id = ${userId} LIMIT 1`;
    if (rows.length === 0) return undefined;
    return mapRowToRetailer(rows[0]);
  }

  static async saveRetailer(r: Retailer): Promise<Retailer> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveRetailer(r);
    }
    const existing = await sql`SELECT id FROM retailers WHERE id = ${r.id}`;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE retailers
        SET user_id = ${r.userId}, company_name = ${r.companyName}, uen = ${r.uen}, address = ${r.address}, 
            postal_code = ${r.postalCode}, showroom_locations = ${r.showroomLocations}, tier = ${r.tier}, 
            status = ${r.status}, updated_at = NOW()
        WHERE id = ${r.id}
      `;
    } else {
      await sql`
        INSERT INTO retailers (id, user_id, company_name, uen, address, postal_code, showroom_locations, tier, status, created_at, updated_at)
        VALUES (${r.id}, ${r.userId}, ${r.companyName}, ${r.uen}, ${r.address}, ${r.postalCode}, ${r.showroomLocations}, ${r.tier}, ${r.status}, NOW(), NOW())
      `;
    }
    return r;
  }

  // Product Operations
  static async getProducts(): Promise<Product[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getProducts();
    }
    const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    return rows.map(mapRowToProduct);
  }

  static async saveProduct(p: Product): Promise<Product> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveProduct(p);
    }
    const existing = await sql`SELECT id FROM products WHERE id = ${p.id}`;
    const specsStr = JSON.stringify(p.technicalSpecs);
    if (existing.rows.length > 0) {
      await sql`
        UPDATE products
        SET sku = ${p.sku}, name = ${p.name}, category = ${p.category}, description = ${p.description}, 
            base_price = ${p.basePrice}, wholesale_price = ${p.wholesalePrice}, moq = ${p.moq}, 
            technical_specs = ${specsStr}, spec_sheet_url = ${p.specSheetUrl}, image_url = ${p.imageUrl}, 
            stock_count = ${p.stockCount}, is_pre_order = ${p.isPreOrder}, pre_order_discount = ${p.preOrderDiscount}
        WHERE id = ${p.id}
      `;
    } else {
      await sql`
        INSERT INTO products (id, sku, name, category, description, base_price, wholesale_price, moq, technical_specs, spec_sheet_url, image_url, stock_count, is_pre_order, pre_order_discount, created_at)
        VALUES (${p.id}, ${p.sku}, ${p.name}, ${p.category}, ${p.description}, ${p.basePrice}, ${p.wholesalePrice}, ${p.moq}, ${specsStr}, ${p.specSheetUrl}, ${p.imageUrl}, ${p.stockCount}, ${p.isPreOrder}, ${p.preOrderDiscount}, NOW())
      `;
    }
    return p;
  }

  static async deleteProduct(productId: string): Promise<boolean> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.deleteProduct(productId);
    }
    const result = await sql`DELETE FROM products WHERE id = ${productId}`;
    return (result.rowCount ?? 0) > 0;
  }

  // Orders Operations
  static async getOrders(): Promise<Order[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getOrders();
    }
    const ordersRes = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    const itemsRes = await sql`SELECT * FROM order_items`;
    return mapRowsToOrders(ordersRes.rows, itemsRes.rows);
  }

  static async saveOrder(o: Order): Promise<Order> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveOrder(o);
    }

    const existing = await sql`SELECT id FROM orders WHERE id = ${o.id}`;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE orders
        SET status = ${o.status}, receipt_url = ${o.receiptUrl}, updated_at = NOW()
        WHERE id = ${o.id}
      `;
    } else {
      await sql`
        INSERT INTO orders (id, retailer_id, user_id, procurement_ref, status, total_qty, subtotal, discount_amount, total_amount, receipt_url, created_at, updated_at)
        VALUES (${o.id}, ${o.retailerId}, ${o.userId}, ${o.procurementRef}, ${o.status}, ${o.totalQty}, ${o.subtotal}, ${o.discountAmount}, ${o.totalAmount}, ${o.receiptUrl}, NOW(), NOW())
      `;
    }

    // Save and link internal order items
    if (o.items && o.items.length > 0) {
      await sql`DELETE FROM order_items WHERE order_id = ${o.id}`;
      for (const item of o.items) {
        await sql`
          INSERT INTO order_items (id, order_id, product_id, qty, unit_price, total_price, discount_applied)
          VALUES (${item.id}, ${o.id}, ${item.productId}, ${item.qty}, ${item.unitPrice}, ${item.totalPrice}, ${item.discountApplied})
        `;
      }
    }

    return o;
  }

  // Consent Records Operations
  static async getConsentRecords(): Promise<ConsentRecord[]> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.getConsentRecords();
    }
    const { rows } = await sql`SELECT * FROM consent_records ORDER BY given_at DESC`;
    return rows.map(mapRowToConsent);
  }

  static async saveConsentRecord(record: ConsentRecord): Promise<ConsentRecord> {
    await this.ensureTables();
    if (!this.isPostgres()) {
      return DB.saveConsentRecord(record);
    }
    const existing = await sql`SELECT id FROM consent_records WHERE id = ${record.id}`;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE consent_records
        SET withdrawn_at = ${record.withdrawnAt}
        WHERE id = ${record.id}
      `;
    } else {
      await sql`
        INSERT INTO consent_records (id, user_id, purpose, given_at, withdrawn_at, ip_address, user_agent)
        VALUES (${record.id}, ${record.userId}, ${record.purpose}, NOW(), ${record.withdrawnAt}, ${record.ipAddress}, ${record.userAgent})
      `;
    }
    return record;
  }
}

// Map PostgreSQL rows helper
async function mapRowsToOrders(orderRows: any[], itemRows: any[]): Promise<Order[]> {
  const itemsMap: Record<string, OrderItem[]> = {};
  itemRows.forEach(row => {
    const item: OrderItem = {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      qty: Number(row.qty),
      unitPrice: Number(row.unit_price),
      totalPrice: Number(row.total_price),
      discountApplied: Number(row.discount_applied || 0)
    };
    if (!itemsMap[item.orderId]) {
      itemsMap[item.orderId] = [];
    }
    itemsMap[item.orderId].push(item);
  });

  return orderRows.map(row => ({
    id: row.id,
    retailerId: row.retailer_id,
    userId: row.user_id,
    procurementRef: row.procurement_ref,
    status: row.status as any,
    totalQty: Number(row.total_qty),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    totalAmount: Number(row.total_amount),
    receiptUrl: row.receipt_url,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    items: itemsMap[row.id] || []
  }));
}
