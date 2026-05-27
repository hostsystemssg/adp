// @ts-nocheck
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("retailer"), // 'retailer' or 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isAnonymized: boolean("is_anonymized").default(false).notNull(),
});

// 2. Retailers Table (Company Profiles and Tiers)
export const retailers = pgTable("retailers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  uen: varchar("uen", { length: 12 }).unique().notNull(),
  address: text("address").notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  showroomLocations: text("showroom_locations").notNull(),
  tier: varchar("tier", { length: 50 }).default("Standard").notNull(), // 'Standard' | 'Silver' | 'Gold' | 'Platinum'
  status: varchar("status", { length: 50 }).default("Pending").notNull(), // 'Pending' | 'Approved' | 'Declined'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Products Table (Wholesale SKU Catalog)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // 'Ceiling Fan' | 'LED Downlight'
  description: text("description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(), // Retail SGD
  wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }).notNull(), // Distributor base SGD
  moq: integer("moq").default(5).notNull(), // Minimum Order Quantity
  technicalSpecs: text("technical_specs").notNull(), // JSON block (Wattage, Blades, RPM, Motor-Type)
  specSheetUrl: text("spec_sheet_url").notNull(),
  imageUrl: text("image_url"),
  stockCount: integer("stock_count").default(0).notNull(),
  isPreOrder: boolean("is_pre_order").default(false).notNull(),
  preOrderDiscount: numeric("pre_order_discount", { precision: 5, scale: 2 }).default("0.00"), // percentage like 15.00
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Orders Table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  retailerId: uuid("retailer_id").references(() => retailers.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  procurementRef: varchar("procurement_ref", { length: 100 }).notNull(), // Custom serial/PO
  status: varchar("status", { length: 50 }).default("Pending Payment Proof").notNull(), 
  // 'Pending Payment Proof' | 'Payment Verified' | 'Processing' | 'Dispatched'
  totalQty: integer("total_qty").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  receiptUrl: text("receipt_url"), // payment proof URL or base64 placeholder
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Order Items Detail
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  qty: integer("qty").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  discountApplied: numeric("discount_applied", { precision: 5, scale: 2 }).default("0.00"),
});

// 6. PDPA Consent Records Schema
export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  purpose: varchar("purpose", { length: 100 }).notNull(), // 'registration' | 'marketing' | 'analytics'
  givenAt: timestamp("given_at").defaultNow().notNull(),
  withdrawnAt: timestamp("withdrawn_at"),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent").notNull(),
});

// 7. System & Pre-Order Campaign Settings
export const systemSettings = pgTable("system_settings", {
  id: varchar("id", { length: 50 }).primaryKey(), // campaign key
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  endDate: timestamp("end_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
