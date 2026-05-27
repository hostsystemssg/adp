import { z } from "zod";

// User Registration Validation Schema with PDPA consent gate
export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  fullName: z.string().min(2, { message: "Full name is required" }),
  phone: z.string().min(8, { message: "Valid Singapore phone number is required" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  uen: z.string()
    .length(9, { message: "UEN must be exactly 9 characters (e.g. 201826157C, 12345678A)" })
    .or(z.string().length(10, { message: "UEN must be exactly 10 characters (e.g. 201812345C)" })),
  address: z.string().min(10, { message: "Full business address is required" }),
  postalCode: z.string().length(6, { message: "Singapore postal code must be exactly 6 digits" }),
  showroomLocations: z.string().min(2, { message: "Please specify at least one showroom or store location" }),
  consentGiven: z.boolean().refine(val => val === true, {
    message: "You must read and agree to the Privacy Policy and Terms of Use to register"
  })
});

// Login Validation Schema
export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Create/Update Product Validation Schema (Admin Panel CRUD)
export const ProductSchema = z.object({
  sku: z.string().min(3, { message: "SKU contains at least 3 characters" }),
  name: z.string().min(2, { message: "Product name is required" }),
  category: z.enum(["Ceiling Fan", "LED Downlight"]),
  description: z.string().min(5, { message: "Product description must be detailed" }),
  basePrice: z.coerce.number().positive({ message: "Base retail price must be positive number" }),
  wholesalePrice: z.coerce.number().positive({ message: "Wholesale distributor price must be positive" }),
  moq: z.coerce.number().int().min(1, { message: "MOQ must be at least 1 unit" }),
  technicalSpecs: z.object({
    rpmRange: z.string().optional(),
    wattage: z.string().min(1, "Wattage spec is required"),
    blades: z.union([z.string(), z.number()]).optional(),
    motorType: z.string().optional(),
    lumens: z.string().optional(),
    beamAngle: z.string().optional(),
  }),
  specSheetUrl: z.string().url({ message: "Valid specification sheet PDF link is required" }),
  imageUrl: z.string().url({ message: "Valid visualization image URL is required" }),
  stockCount: z.coerce.number().int().min(0, { message: "Stock count cannot be negative" }),
  isPreOrder: z.boolean().default(false),
  preOrderDiscount: z.coerce.number().min(0).max(100).default(0),
});

// Order Creation Validation Schema (Cart checkout)
export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1),
});

export const CreateOrderSchema = z.object({
  procurementRef: z.string().min(2, { message: "Distributor Reference / PO Number is required" }),
  items: z.array(OrderItemSchema).min(1, { message: "Cart cannot be empty" }),
});

// Update Consent Patch Schema
export const ConsentPatchSchema = z.object({
  withdrawn: z.boolean(),
});
