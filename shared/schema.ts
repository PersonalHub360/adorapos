import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Local authentication with username/password
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(), // Hashed password
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default('admin'), // 'admin' or 'cashier'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Products table - Clothing items with complete details
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // shirts, pants, accessories, etc.
  size: varchar("size", { length: 50 }), // S, M, L, XL, etc.
  color: varchar("color", { length: 100 }),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull().default('0'), // Cost price
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Sales price (for backward compatibility)
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'), // Tax percentage (e.g., 10.00 for 10%)
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  sku: varchar("sku", { length: 100 }).unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  barcodeSymbology: varchar("barcode_symbology", { length: 50 }).default('Code128'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products, {
  purchasePrice: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  price: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  taxRate: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()).optional().nullable(),
  stock: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  lowStockThreshold: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Customers table - Customer profiles
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  points: integer("points").notNull().default(0), // Loyalty points
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Promo codes table - Discount codes
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'percentage' or 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// Paper sizes table - Barcode label sizes
export const paperSizes = pgTable("paper_sizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaperSizeSchema = createInsertSchema(paperSizes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaperSize = z.infer<typeof insertPaperSizeSchema>;
export type PaperSize = typeof paperSizes.$inferSelect;

// Categories table - Product categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Brands table - Product brands
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// Units table - Product measurement units
export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  shortName: varchar("short_name", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Sales table - Main transaction records
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Cashier/Admin who processed the sale
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  promoCodeId: varchar("promo_code_id").references(() => promoCodes.id),
  pointsUsed: integer("points_used").notNull().default(0), // Loyalty points used for discount
  pointsEarned: integer("points_earned").notNull().default(0), // Loyalty points earned from this sale
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // cash, card, digital_wallet
  status: varchar("status", { length: 20 }).notNull().default('completed'), // completed, refunded
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Sale items table - Individual products in each sale
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(), // Store name for historical record
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  saleId: true,
  createdAt: true,
});

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  promoCode: one(promoCodes, {
    fields: [sales.promoCodeId],
    references: [promoCodes.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));
