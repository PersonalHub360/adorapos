import {
  users,
  products,
  customers,
  sales,
  saleItems,
  promoCodes,
  paperSizes,
  categories,
  brands,
  units,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type PromoCode,
  type InsertPromoCode,
  type PaperSize,
  type InsertPaperSize,
  type Category,
  type InsertCategory,
  type Brand,
  type InsertBrand,
  type Unit,
  type InsertUnit,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, lte, sql, count } from "drizzle-orm";
import { MockStorage } from "./mockStorage";

export interface IStorage {
  // User operations (local auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;

  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Sales operations
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  getSale(id: string): Promise<Sale | undefined>;
  getRecentSales(limit?: number): Promise<Sale[]>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  getSalesByPeriod(startDate: Date, endDate: Date): Promise<Sale[]>;
  refundSale(id: string): Promise<Sale>;

  // Promo code operations
  getAllPromoCodes(): Promise<PromoCode[]>;
  getPromoCode(id: string): Promise<PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCode(id: string, promoCode: Partial<InsertPromoCode>): Promise<PromoCode>;
  deletePromoCode(id: string): Promise<void>;

  // Paper size operations
  getAllPaperSizes(): Promise<PaperSize[]>;
  getPaperSize(id: string): Promise<PaperSize | undefined>;
  createPaperSize(paperSize: InsertPaperSize): Promise<PaperSize>;
  updatePaperSize(id: string, paperSize: Partial<InsertPaperSize>): Promise<PaperSize>;
  deletePaperSize(id: string): Promise<void>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Brand operations
  getAllBrands(): Promise<Brand[]>;
  getBrand(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand>;
  deleteBrand(id: string): Promise<void>;

  // Unit operations
  getAllUnits(): Promise<Unit[]>;
  getUnit(id: string): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit>;
  deleteUnit(id: string): Promise<void>;

  // Dashboard & Reports
  getDashboardStats(): Promise<{
    todaySales: number;
    todayTransactions: number;
    lowStockCount: number;
    totalCustomers: number;
  }>;
  getSalesReport(period: 'today' | 'week' | 'month'): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalTransactions: number;
    averageTicket: number;
    topProducts: Array<{
      product: Product;
      quantitySold: number;
      revenue: number;
    }>;
    salesByPaymentMethod: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`)
      .orderBy(products.stock);
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Sales operations
  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    // Use a transaction to create sale and items, and update inventory
    return await db.transaction(async (tx) => {
      // Create the sale
      const [newSale] = await tx.insert(sales).values(sale).returning();

      // Create sale items
      if (items.length > 0) {
        await tx.insert(saleItems).values(
          items.map(item => ({
            ...item,
            saleId: newSale.id,
          }))
        );

        // Update product stock
        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }

      // Handle customer loyalty points
      if (newSale.customerId) {
        const pointsUsed = newSale.pointsUsed || 0;
        const pointsEarned = newSale.pointsEarned || 0;
        
        // Update customer points: subtract used points, add earned points
        const pointsChange = pointsEarned - pointsUsed;
        if (pointsChange !== 0) {
          await tx
            .update(customers)
            .set({
              points: sql`${customers.points} + ${pointsChange}`,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, newSale.customerId));
        }
      }

      return newSale;
    });
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async getRecentSales(limit: number = 10): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit);
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.createdAt));
  }

  async getSalesByPeriod(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(and(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      ))
      .orderBy(desc(sales.createdAt));
  }

  async refundSale(id: string): Promise<Sale> {
    return await db.transaction(async (tx) => {
      // Get the sale
      const [sale] = await tx.select().from(sales).where(eq(sales.id, id));
      if (!sale) {
        throw new Error("Sale not found");
      }

      if (sale.status === 'refunded') {
        throw new Error("Sale already refunded");
      }

      // Get sale items to reverse inventory
      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, id));

      if (items.length === 0) {
        throw new Error("No sale items found for this sale");
      }

      // Reverse inventory - add quantities back to products
      for (const item of items) {
        if (item.quantity > 0) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }

      // Reverse customer loyalty points transaction
      if (sale.customerId) {
        const pointsUsed = sale.pointsUsed || 0;
        const pointsEarned = sale.pointsEarned || 0;
        
        // Reverse: give back used points, take back earned points
        const pointsChange = pointsUsed - pointsEarned;
        if (pointsChange !== 0) {
          await tx
            .update(customers)
            .set({
              points: sql`${customers.points} + ${pointsChange}`,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, sale.customerId));
        }
      }

      // Update sale status
      const [refundedSale] = await tx
        .update(sales)
        .set({
          status: 'refunded',
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sales.id, id))
        .returning();

      return refundedSale;
    });
  }

  // Promo code operations
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async getPromoCode(id: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    return promoCode;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(and(
        eq(promoCodes.code, code),
        eq(promoCodes.isActive, true)
      ));
    return promoCode;
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const [newPromoCode] = await db.insert(promoCodes).values(promoCode).returning();
    return newPromoCode;
  }

  async updatePromoCode(id: string, promoCode: Partial<InsertPromoCode>): Promise<PromoCode> {
    const [updated] = await db
      .update(promoCodes)
      .set({ ...promoCode, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();
    return updated;
  }

  async deletePromoCode(id: string): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  // Paper size operations
  async getAllPaperSizes(): Promise<PaperSize[]> {
    return await db.select().from(paperSizes).orderBy(desc(paperSizes.createdAt));
  }

  async getPaperSize(id: string): Promise<PaperSize | undefined> {
    const [paperSize] = await db.select().from(paperSizes).where(eq(paperSizes.id, id));
    return paperSize;
  }

  async createPaperSize(paperSize: InsertPaperSize): Promise<PaperSize> {
    const [newPaperSize] = await db.insert(paperSizes).values(paperSize).returning();
    return newPaperSize;
  }

  async updatePaperSize(id: string, paperSize: Partial<InsertPaperSize>): Promise<PaperSize> {
    const [updated] = await db
      .update(paperSizes)
      .set({ ...paperSize, updatedAt: new Date() })
      .where(eq(paperSizes.id, id))
      .returning();
    return updated;
  }

  async deletePaperSize(id: string): Promise<void> {
    await db.delete(paperSizes).where(eq(paperSizes.id, id));
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    return await db.select().from(brands).orderBy(desc(brands.createdAt));
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand> {
    const [updated] = await db
      .update(brands)
      .set({ ...brand, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    return updated;
  }

  async deleteBrand(id: string): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  // Unit operations
  async getAllUnits(): Promise<Unit[]> {
    return await db.select().from(units).orderBy(desc(units.createdAt));
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [newUnit] = await db.insert(units).values(unit).returning();
    return newUnit;
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit> {
    const [updated] = await db
      .update(units)
      .set({ ...unit, updatedAt: new Date() })
      .where(eq(units.id, id))
      .returning();
    return updated;
  }

  async deleteUnit(id: string): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Dashboard & Reports
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's sales
    const todaySalesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${sales.total} AS NUMERIC)), 0)`,
        count: count(),
      })
      .from(sales)
      .where(and(
        gte(sales.createdAt, today),
        lt(sales.createdAt, tomorrow)
      ));

    // Get low stock count
    const lowStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`);

    // Get total customers
    const customersResult = await db.select({ count: count() }).from(customers);

    return {
      todaySales: Number(todaySalesResult[0]?.total || 0),
      todayTransactions: todaySalesResult[0]?.count || 0,
      lowStockCount: lowStockResult[0]?.count || 0,
      totalCustomers: customersResult[0]?.count || 0,
    };
  }

  async getSalesReport(period: 'today' | 'week' | 'month') {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    // Get sales summary
    const salesSummary = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${sales.total} AS NUMERIC)), 0)`,
        count: count(),
      })
      .from(sales)
      .where(gte(sales.createdAt, startDate));

    // Get total items sold
    const itemsSold = await db
      .select({
        total: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startDate));

    // Get top products
    const topProductsData = await db
      .select({
        productId: saleItems.productId,
        quantitySold: sql<number>`SUM(${saleItems.quantity})`,
        revenue: sql<number>`SUM(CAST(${saleItems.totalPrice} AS NUMERIC))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startDate))
      .groupBy(saleItems.productId)
      .orderBy(desc(sql`SUM(${saleItems.quantity})`))
      .limit(5);

    // Fetch product details for top products
    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          product: product!,
          quantitySold: Number(item.quantitySold),
          revenue: Number(item.revenue),
        };
      })
    );

    // Get sales by payment method
    const paymentMethodData = await db
      .select({
        paymentMethod: sales.paymentMethod,
        total: sql<number>`COALESCE(SUM(CAST(${sales.total} AS NUMERIC)), 0)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, startDate))
      .groupBy(sales.paymentMethod);

    const salesByPaymentMethod: Record<string, number> = {};
    paymentMethodData.forEach((item) => {
      salesByPaymentMethod[item.paymentMethod] = Number(item.total);
    });

    const totalRevenue = Number(salesSummary[0]?.totalRevenue || 0);
    const totalTransactions = salesSummary[0]?.count || 0;
    const totalSales = Number(itemsSold[0]?.total || 0);
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalSales,
      totalRevenue,
      totalTransactions,
      averageTicket,
      topProducts,
      salesByPaymentMethod,
    };
  }
}

// Use mock storage in development mode without database, otherwise use real database storage
export const storage = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL 
  ? new MockStorage() 
  : new DatabaseStorage();
