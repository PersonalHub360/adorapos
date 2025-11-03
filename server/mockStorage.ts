import {
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
  type Expense,
  type InsertExpense,
  type ExpenseCategory,
  type InsertExpenseCategory,
} from "@shared/schema";
import { IStorage } from "./storage";

export class MockStorage implements IStorage {
  // User operations (local auth)
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Mock implementation with predefined user
    if (username === 'adora360') {
      return {
        id: 'mock-user-1',
        username: 'adora360',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: Sp123456@
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async createUser(user: UpsertUser): Promise<User> {
    return { ...user, id: 'mock-user-id', createdAt: new Date(), updatedAt: new Date() } as User;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return { ...user, id: 'mock-user-id', createdAt: new Date(), updatedAt: new Date() } as User;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return [
      {
        id: 'prod-1',
        name: 'Classic White T-Shirt',
        category: 'Shirts',
        size: 'M',
        color: 'White',
        purchasePrice: '8.50',
        price: '19.99',
        taxRate: '8.25',
        stock: 45,
        lowStockThreshold: 5,
        sku: 'TS-WH-M',
        description: 'Premium cotton t-shirt, perfect for everyday wear',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'prod-2',
        name: 'Black Denim Jeans',
        category: 'Pants',
        size: '32',
        color: 'Black',
        purchasePrice: '22.00',
        price: '49.99',
        taxRate: '8.25',
        stock: 28,
        lowStockThreshold: 5,
        sku: 'JEANS-BL-32',
        description: 'Comfortable stretch denim jeans with modern fit',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'prod-3',
        name: 'Red Hooded Sweatshirt',
        category: 'Sweatshirts',
        size: 'L',
        color: 'Red',
        purchasePrice: '18.75',
        price: '39.99',
        taxRate: '8.25',
        stock: 15,
        lowStockThreshold: 5,
        sku: 'SW-RD-L',
        description: 'Warm fleece hoodie with front pocket',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: 'prod-4',
        name: 'Blue Polo Shirt',
        category: 'Shirts',
        size: 'S',
        color: 'Blue',
        purchasePrice: '12.00',
        price: '29.99',
        taxRate: '8.25',
        stock: 32,
        lowStockThreshold: 5,
        sku: 'POLO-BL-S',
        description: 'Classic polo shirt with embroidered logo',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
      },
      {
        id: 'prod-5',
        name: 'Gray Athletic Shorts',
        category: 'Shorts',
        size: 'M',
        color: 'Gray',
        purchasePrice: '9.25',
        price: '24.99',
        taxRate: '8.25',
        stock: 18,
        lowStockThreshold: 5,
        sku: 'SHORTS-GR-M',
        description: 'Lightweight athletic shorts with moisture-wicking fabric',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: 'prod-6',
        name: 'Leather Belt',
        category: 'Accessories',
        size: 'M',
        color: 'Brown',
        purchasePrice: '6.50',
        price: '15.99',
        taxRate: '8.25',
        stock: 22,
        lowStockThreshold: 5,
        sku: 'BELT-BR-M',
        description: 'Genuine leather belt with classic buckle',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: 'prod-7',
        name: 'Winter Beanie',
        category: 'Accessories',
        size: 'One Size',
        color: 'Black',
        purchasePrice: '4.25',
        price: '12.99',
        taxRate: '8.25',
        stock: 8,
        lowStockThreshold: 5,
        sku: 'BEANIE-BL-OS',
        description: 'Warm acrylic beanie for cold weather',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: 'prod-8',
        name: 'Striped Dress Shirt',
        category: 'Shirts',
        size: 'L',
        color: 'Blue/White',
        purchasePrice: '15.75',
        price: '34.99',
        taxRate: '8.25',
        stock: 12,
        lowStockThreshold: 5,
        sku: 'DRESS-BW-L',
        description: 'Formal dress shirt with subtle stripe pattern',
        imageUrl: '',
        barcodeSymbology: 'Code128',
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05')
      }
    ];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.getAllProducts();
    return products.find(p => p.id === id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return { ...product, id: 'mock-product-id', createdAt: new Date(), updatedAt: new Date() } as Product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    return { ...product, id, createdAt: new Date(), updatedAt: new Date() } as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  async getLowStockProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products.filter(p => p.stock <= p.lowStockThreshold);
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return [];
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return { ...customer, id: 'mock-customer-id', createdAt: new Date(), updatedAt: new Date() } as Customer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    return { ...customer, id, createdAt: new Date(), updatedAt: new Date() } as Customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Sales operations
  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    return { ...sale, id: 'mock-sale-id', createdAt: new Date(), updatedAt: new Date() } as Sale;
  }

  async getAllSales(): Promise<Sale[]> {
    return [];
  }

  async getSale(id: string): Promise<Sale | undefined> {
    return undefined;
  }

  async getRecentSales(limit?: number): Promise<Sale[]> {
    return [];
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return [];
  }

  async getSalesByPeriod(startDate: Date, endDate: Date): Promise<Sale[]> {
    return [];
  }

  async refundSale(id: string): Promise<Sale> {
    return { id, status: 'refunded', createdAt: new Date(), updatedAt: new Date() } as Sale;
  }

  // Promo code operations
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return [];
  }

  async getPromoCode(id: string): Promise<PromoCode | undefined> {
    return undefined;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    return undefined;
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    return { ...promoCode, id: 'mock-promo-id', createdAt: new Date(), updatedAt: new Date() } as PromoCode;
  }

  async updatePromoCode(id: string, promoCode: Partial<InsertPromoCode>): Promise<PromoCode> {
    return { ...promoCode, id, createdAt: new Date(), updatedAt: new Date() } as PromoCode;
  }

  async deletePromoCode(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Paper size operations
  async getAllPaperSizes(): Promise<PaperSize[]> {
    return [];
  }

  async getPaperSize(id: string): Promise<PaperSize | undefined> {
    return undefined;
  }

  async createPaperSize(paperSize: InsertPaperSize): Promise<PaperSize> {
    return { ...paperSize, id: 'mock-paper-id', createdAt: new Date(), updatedAt: new Date() } as PaperSize;
  }

  async updatePaperSize(id: string, paperSize: Partial<InsertPaperSize>): Promise<PaperSize> {
    return { ...paperSize, id, createdAt: new Date(), updatedAt: new Date() } as PaperSize;
  }

  async deletePaperSize(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return [];
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return { ...category, id: 'mock-category-id', createdAt: new Date(), updatedAt: new Date() } as Category;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    return { ...category, id, createdAt: new Date(), updatedAt: new Date() } as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Brand operations
  async getAllBrands(): Promise<Brand[]> {
    return [];
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    return undefined;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    return { ...brand, id: 'mock-brand-id', createdAt: new Date(), updatedAt: new Date() } as Brand;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand> {
    return { ...brand, id, createdAt: new Date(), updatedAt: new Date() } as Brand;
  }

  async deleteBrand(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Unit operations
  async getAllUnits(): Promise<Unit[]> {
    return [];
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    return undefined;
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    return { ...unit, id: 'mock-unit-id', createdAt: new Date(), updatedAt: new Date() } as Unit;
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit> {
    return { ...unit, id, createdAt: new Date(), updatedAt: new Date() } as Unit;
  }

  async deleteUnit(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Expense operations
  async getAllExpenses(): Promise<Expense[]> {
    return [];
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    return { ...expense, id: 'mock-expense-id', createdAt: new Date(), updatedAt: new Date() } as Expense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    return { ...expense, id, createdAt: new Date(), updatedAt: new Date() } as Expense;
  }

  async deleteExpense(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Expense category operations
  async getAllExpenseCategories(): Promise<ExpenseCategory[]> {
    return [];
  }

  async getExpenseCategory(id: string): Promise<ExpenseCategory | undefined> {
    return undefined;
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    return { ...category, id: 'mock-expense-category-id', createdAt: new Date(), updatedAt: new Date() } as ExpenseCategory;
  }

  async updateExpenseCategory(id: string, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory> {
    return { ...category, id, createdAt: new Date(), updatedAt: new Date() } as ExpenseCategory;
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    // Mock implementation - do nothing
  }

  // Dashboard & Reports
  async getDashboardStats() {
    return {
      todaySales: 0,
      todayTransactions: 0,
      lowStockCount: 0,
      totalCustomers: 0,
      totalExpense: 0,
      totalPurchase: 0,
      profitLoss: 0,
      totalOrders: 0,
      salesByPaymentMethod: {},
    };
  }

  async getSalesReport(period: 'today' | 'week' | 'month') {
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalTransactions: 0,
      averageTicket: 0,
      topProducts: [],
      salesByPaymentMethod: {},
    };
  }
}