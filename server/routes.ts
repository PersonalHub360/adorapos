import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./localAuth";
import { insertProductSchema, insertCustomerSchema, insertPromoCodeSchema, insertPaperSizeSchema, insertCategorySchema, insertBrandSchema, insertUnitSchema } from "@shared/schema";
import { z } from "zod";
import type { User } from "@shared/schema";

// Auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && (req.user as User).role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware and routes are setup in localAuth.ts
  await setupAuth(app);

  // Product routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("Creating product with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Generate unique product codes (5-digit: 10000-99999)
  app.post("/api/products/generate-codes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { count = 1 } = req.body;
      const products = await storage.getAllProducts();
      const existingCodes = new Set(products.map(p => p.sku).filter(Boolean));
      
      const generatedCodes: string[] = [];
      const maxAttempts = count * 100;
      let attempts = 0;
      
      while (generatedCodes.length < count && attempts < maxAttempts) {
        const code = Math.floor(10000 + Math.random() * 90000).toString();
        if (!existingCodes.has(code) && !generatedCodes.includes(code)) {
          generatedCodes.push(code);
          existingCodes.add(code);
        }
        attempts++;
      }
      
      if (generatedCodes.length < count) {
        return res.status(500).json({ 
          message: "Unable to generate enough unique codes", 
          generated: generatedCodes.length,
          requested: count
        });
      }
      
      res.json({ codes: generatedCodes });
    } catch (error) {
      console.error("Error generating product codes:", error);
      res.status(500).json({ message: "Failed to generate product codes" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/:id/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getSalesByCustomer(req.params.id);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching customer sales:", error);
      res.status(500).json({ message: "Failed to fetch customer sales" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Sales routes
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const { sale, items } = req.body;
      
      if (!sale || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid sale data" });
      }

      const createdSale = await storage.createSale(sale, items);
      res.status(201).json(createdSale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.post("/api/sales/import", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sales: salesData } = req.body;
      
      if (!Array.isArray(salesData)) {
        return res.status(400).json({ message: "Invalid import data" });
      }

      let imported = 0;
      const errors: string[] = [];

      for (const row of salesData) {
        try {
          if (!row['Payment Method'] || !row['Total']) {
            continue;
          }

          const paymentMethod = row['Payment Method'].toUpperCase();
          const subtotal = parseFloat(row['Subtotal'] || row['Total'] || '0');
          const discount = parseFloat(row['Discount'] || '0');
          const total = parseFloat(row['Total']);
          const status = row['Status'] || 'completed';

          if (isNaN(total) || total <= 0) {
            continue;
          }

          let customerId = null;
          if (row['Customer Name']) {
            const customers = await storage.getAllCustomers();
            const customer = customers.find(c => 
              c.name.toLowerCase() === row['Customer Name'].toLowerCase()
            );
            
            if (!customer) {
              const newCustomer = await storage.createCustomer({
                name: row['Customer Name'],
                email: null,
                phone: null,
              });
              customerId = newCustomer.id;
            } else {
              customerId = customer.id;
            }
          }

          const sale = {
            customerId,
            userId: (req.user as User).id,
            subtotal: subtotal.toFixed(2),
            discountAmount: discount.toFixed(2),
            total: total.toFixed(2),
            paymentMethod,
            status,
          };

          await storage.createSale(sale, []);
          imported++;
        } catch (rowError) {
          errors.push(`Failed to import row: ${JSON.stringify(row)}`);
        }
      }

      res.json({ 
        imported, 
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${imported} sales`
      });
    } catch (error) {
      console.error("Error importing sales:", error);
      res.status(500).json({ message: "Failed to import sales" });
    }
  });

  app.get("/api/sales/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sales = await storage.getRecentSales(limit);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.get("/api/sales/:id", isAuthenticated, async (req, res) => {
    try {
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales/:id/refund", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const refundedSale = await storage.refundSale(req.params.id);
      res.json(refundedSale);
    } catch (error: any) {
      console.error("Error refunding sale:", error);
      if (error.message === "Sale not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Sale already refunded") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Promo code routes
  app.get("/api/promo-codes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  app.get("/api/promo-codes/validate", isAuthenticated, async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const promoCode = await storage.getPromoCodeByCode(code);
      if (!promoCode) {
        return res.status(404).json({ message: "Invalid or inactive promo code" });
      }

      res.json(promoCode);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  app.post("/api/promo-codes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPromoCodeSchema.parse(req.body);
      const promoCode = await storage.createPromoCode(validatedData);
      res.status(201).json(promoCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid promo code data", errors: error.errors });
      }
      console.error("Error creating promo code:", error);
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  app.patch("/api/promo-codes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const promoCode = await storage.updatePromoCode(req.params.id, req.body);
      res.json(promoCode);
    } catch (error) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ message: "Failed to update promo code" });
    }
  });

  app.delete("/api/promo-codes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePromoCode(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  // Paper size routes
  app.get("/api/paper-sizes", isAuthenticated, async (req, res) => {
    try {
      const paperSizes = await storage.getAllPaperSizes();
      res.json(paperSizes);
    } catch (error) {
      console.error("Error fetching paper sizes:", error);
      res.status(500).json({ message: "Failed to fetch paper sizes" });
    }
  });

  app.post("/api/paper-sizes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPaperSizeSchema.parse(req.body);
      const paperSize = await storage.createPaperSize(validatedData);
      res.status(201).json(paperSize);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid paper size data", errors: error.errors });
      }
      console.error("Error creating paper size:", error);
      res.status(500).json({ message: "Failed to create paper size" });
    }
  });

  app.patch("/api/paper-sizes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const paperSize = await storage.updatePaperSize(req.params.id, req.body);
      res.json(paperSize);
    } catch (error) {
      console.error("Error updating paper size:", error);
      res.status(500).json({ message: "Failed to update paper size" });
    }
  });

  app.delete("/api/paper-sizes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePaperSize(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting paper size:", error);
      res.status(500).json({ message: "Failed to delete paper size" });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Brand routes
  app.get("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid brand data", errors: error.errors });
      }
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.patch("/api/brands/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const brand = await storage.updateBrand(req.params.id, req.body);
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBrand(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Unit routes
  app.get("/api/units", isAuthenticated, async (req, res) => {
    try {
      const units = await storage.getAllUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.post("/api/units", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid unit data", errors: error.errors });
      }
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.patch("/api/units/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const unit = await storage.updateUnit(req.params.id, req.body);
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteUnit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get("/api/reports/sales", isAuthenticated, async (req, res) => {
    try {
      const period = (req.query.period as 'today' | 'week' | 'month') || 'today';
      const report = await storage.getSalesReport(period);
      res.json(report);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
