import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Edit, Trash2, Filter, Eye, Barcode, Upload, Download, FileText, Printer, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product, PaperSize, InsertProduct } from "@shared/schema";
import { insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ProductForm } from "@/components/products/ProductForm";

const categories = ["Shirts", "Pants", "Dresses", "Jackets", "Accessories", "Shoes"];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ row: number; sku: string; error: string }[]>([]);
  const [saveErrors, setSaveErrors] = useState<{ row: number; sku: string; error: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [barcodePrintDialogOpen, setBarcodePrintDialogOpen] = useState(false);
  const [selectedBarcodeProducts, setSelectedBarcodeProducts] = useState<Array<{product: Product, quantity: number}>>([]);
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState("");
  const [barcodePreviewOpen, setBarcodePreviewOpen] = useState(false);
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState<string>("");
  const [printOptions, setPrintOptions] = useState({
    productName: true,
    price: true,
    promoPrice: false,
  });
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: paperSizes } = useQuery<PaperSize[]>({
    queryKey: ["/api/paper-sizes"],
  });

  // Get unique sizes and colors from products
  const availableSizes = Array.from(new Set(products?.map(p => p.size).filter(Boolean))) as string[];
  const availableColors = Array.from(new Set(products?.map(p => p.color).filter(Boolean))) as string[];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesSize = sizeFilter === "all" || product.size === sizeFilter;
    const matchesColor = colorFilter === "all" || product.color?.toLowerCase() === colorFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesSize && matchesColor;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Product deleted",
        description: "The product has been removed from inventory.",
      });
      setDeletingProduct(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStockBadgeVariant = (stock: number, threshold: number) => {
    if (stock === 0) return "destructive";
    if (stock <= threshold) return "secondary";
    return "default";
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= threshold) return "Low Stock";
    return "In Stock";
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        name: "Example T-Shirt",
        category: "Shirts",
        size: "M",
        color: "Blue",
        purchasePrice: "10.00",
        price: "25.00",
        taxRate: "10",
        stock: "100",
        lowStockThreshold: "10",
        description: "A comfortable cotton t-shirt",
        barcodeSymbology: "Code128"
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "products_template.xlsx");
    
    toast({
      title: "Template downloaded",
      description: "Excel template file has been downloaded. Product codes will be auto-generated during import.",
    });
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setValidationErrors([]);
    setSaveErrors([]);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      // Track original row indices for accurate error reporting
      type ProductWithRow = { product: InsertProduct; originalRow: number; sku: string };
      const validProducts: ProductWithRow[] = [];
      const vErrors: { row: number; sku: string; error: string }[] = [];

      // Generate unique product codes for all rows
      const codesResponse = await apiRequest("POST", "/api/products/generate-codes", { count: rows.length }) as unknown as { codes: string[] };
      const generatedCodes = codesResponse.codes;
      
      // Validate each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 because: +1 for array index, +1 for header row
        const sku = generatedCodes[i];
        
        try {
          // Validate against schema (SKU is now auto-generated)
          const validated = insertProductSchema.parse({
            name: row.name,
            sku: sku,
            category: row.category,
            size: row.size || null,
            color: row.color || null,
            purchasePrice: row.purchasePrice || "0",
            price: row.price,
            taxRate: row.taxRate || "0",
            stock: row.stock || 0,
            lowStockThreshold: row.lowStockThreshold || 5,
            description: row.description || null,
            imageUrl: "",
            barcodeSymbology: row.barcodeSymbology || "Code128",
          });
          
          validProducts.push({
            product: validated,
            originalRow: rowNum,
            sku: sku
          });
        } catch (error: any) {
          const message = error.errors?.[0]?.message || error.message || "Invalid data";
          vErrors.push({ row: rowNum, sku: sku, error: message });
        }
      }

      // Store validation errors
      setValidationErrors(vErrors);

      // Show validation errors if all rows failed
      if (vErrors.length > 0 && validProducts.length === 0) {
        toast({
          title: "Validation failed",
          description: `All ${vErrors.length} rows have errors. See details below.`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Import valid products with accurate row tracking
      let successCount = 0;
      const sErrors: { row: number; sku: string; error: string }[] = [];

      for (const { product, originalRow, sku } of validProducts) {
        try {
          await apiRequest("POST", "/api/products", product);
          successCount++;
        } catch (error: any) {
          const message = error.message || "Failed to save";
          sErrors.push({ 
            row: originalRow, 
            sku: sku, 
            error: message 
          });
        }
      }

      // Store save errors separately
      setSaveErrors(sErrors);

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      // Show detailed results
      const messages = [];
      if (successCount > 0) messages.push(`${successCount} products imported with auto-generated codes`);
      if (sErrors.length > 0) messages.push(`${sErrors.length} failed to save`);
      if (vErrors.length > 0) messages.push(`${vErrors.length} validation errors`);

      toast({
        title: successCount > 0 ? "Import completed" : "Import failed",
        description: messages.join(". ") + (vErrors.length + sErrors.length > 0 ? " See details below." : ""),
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (successCount > 0 && vErrors.length === 0 && sErrors.length === 0) {
        setImportDialogOpen(false);
        setValidationErrors([]);
        setSaveErrors([]);
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An unexpected error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const exportToCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = filteredProducts.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      size: p.size || "",
      color: p.color || "",
      purchasePrice: p.purchasePrice,
      price: p.price,
      taxRate: p.taxRate || "0",
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      description: p.description || "",
      barcodeSymbology: p.barcodeSymbology || "Code128",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `${filteredProducts.length} products exported to CSV`,
    });
  };

  const exportToPDF = async () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        title: "No data",
        description: "No products to export",
        variant: "destructive",
      });
      return;
    }

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Products List", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["#", "Name", "Code", "Category", "Size", "Stock", "Purchase", "Sales", "Tax%"]],
      body: filteredProducts.map((p, index) => [
        index + 1,
        p.name,
        p.sku || "",
        p.category,
        p.size || "",
        p.stock,
        `$${p.purchasePrice}`,
        `$${p.price}`,
        p.taxRate || "0",
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    doc.save(`products_${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "PDF generated",
      description: `${filteredProducts.length} products exported to PDF`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-products-title">Products List</h1>
          <p className="text-muted-foreground mt-1">Manage your clothing inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} data-testid="button-export-pdf">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-size-filter">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            {availableSizes.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-color-filter">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {availableColors.map((color) => (
              <SelectItem key={color} value={color}>{color}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </Card>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <Card>
          <div className="max-h-[600px] overflow-auto relative">
            <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Sales Price</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => {
                const salesPrice = parseFloat(product.price);
                const purchasePrice = parseFloat(product.purchasePrice || '0');
                const taxRate = parseFloat(product.taxRate || '0');
                const stockValue = salesPrice * product.stock;
                
                return (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-muted-foreground/30">
                            {product.name[0]}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>
                      {product.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.size || '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums" data-testid={`text-stock-${product.id}`}>
                      {product.stock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      ${purchasePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums" data-testid={`text-product-price-${product.id}`}>
                      ${salesPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {taxRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ${stockValue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600"
                          onClick={() => setViewingProduct(product)}
                          data-testid={`button-view-${product.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600"
                          onClick={() => {
                            setSelectedBarcodeProducts([{product, quantity: 1}]);
                            setBarcodePrintDialogOpen(true);
                          }}
                          data-testid={`button-barcode-${product.id}`}
                        >
                          <Barcode className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600"
                              onClick={() => setEditingProduct(product)}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-600"
                              onClick={() => setDeletingProduct(product)}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"}
            </p>
            {isAdmin && !searchQuery && categoryFilter === "all" && (
              <Link href="/add-product">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product details
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct || undefined}
              onSuccess={() => setEditingProduct(null)}
              showHeader={false}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import multiple products. Product codes will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                id="excel-file-input"
                disabled={importing}
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                data-testid="button-choose-excel"
              >
                {importing ? "Importing..." : "Choose Excel File"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Supported format: Excel (.xlsx, .xls)
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Need a template?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleExcel}
                data-testid="button-download-sample"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Excel Template
              </Button>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Excel Format</h4>
              <p className="text-sm text-muted-foreground">
                Your Excel file should include these columns: name, category, size, color, 
                purchasePrice, price, taxRate, stock, lowStockThreshold, description, barcodeSymbology.
                <span className="block mt-1 font-medium text-primary">Note: Product codes (SKU) will be auto-generated (10000-99999).</span>
              </p>
            </div>
            {(validationErrors.length > 0 || saveErrors.length > 0) && (
              <div className="space-y-3">
                {validationErrors.length > 0 && (
                  <div className="border border-destructive/50 rounded-lg p-4">
                    <h4 className="font-medium text-destructive mb-2">
                      Validation Errors ({validationErrors.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {validationErrors.map((err, idx) => (
                        <div key={idx} className="text-sm bg-destructive/10 p-2 rounded">
                          <span className="font-medium">Row {err.row}</span>
                          {err.sku && err.sku !== "N/A" && <span className="text-muted-foreground"> (SKU: {err.sku})</span>}
                          <span className="block text-destructive">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {saveErrors.length > 0 && (
                  <div className="border border-orange-500/50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">
                      Save Errors ({saveErrors.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {saveErrors.map((err, idx) => (
                        <div key={idx} className="text-sm bg-orange-100 dark:bg-orange-900/20 p-2 rounded">
                          <span className="font-medium">Row {err.row}</span>
                          {err.sku && err.sku !== "N/A" && <span className="text-muted-foreground"> (SKU: {err.sku})</span>}
                          <span className="block text-orange-600 dark:text-orange-400">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog */}
      <Dialog open={barcodePrintDialogOpen} onOpenChange={setBarcodePrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Print Barcode</DialogTitle>
            <DialogDescription>
              The field labels marked with * are required input fields.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add Product Section */}
            <div className="space-y-2">
              <Label>Add Product *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Please type product code and select..."
                    value={barcodeSearchQuery}
                    onChange={(e) => setBarcodeSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-barcode-search"
                  />
                </div>
                <Button 
                  onClick={() => {
                    if (!barcodeSearchQuery.trim()) return;
                    const product = products?.find(
                      p => p.sku?.toLowerCase() === barcodeSearchQuery.toLowerCase() || 
                           p.name.toLowerCase().includes(barcodeSearchQuery.toLowerCase())
                    );
                    if (product) {
                      const exists = selectedBarcodeProducts.find(item => item.product.id === product.id);
                      if (!exists) {
                        setSelectedBarcodeProducts([...selectedBarcodeProducts, {product, quantity: 1}]);
                      }
                      setBarcodeSearchQuery("");
                    }
                  }}
                  data-testid="button-add-barcode-product"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Products Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-32">Quantity</TableHead>
                    <TableHead className="w-24 text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBarcodeProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No products added. Search and add products above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedBarcodeProducts.map((item, index) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.product.sku || '-'}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              setSelectedBarcodeProducts(
                                selectedBarcodeProducts.map((p, i) =>
                                  i === index ? {...p, quantity: newQuantity} : p
                                )
                              );
                            }}
                            className="w-full"
                            data-testid={`input-quantity-${item.product.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBarcodeProducts(
                                selectedBarcodeProducts.filter((_, i) => i !== index)
                              );
                            }}
                            data-testid={`button-delete-barcode-${item.product.id}`}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Print Options */}
            <div className="space-y-3">
              <Label>Print:</Label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print-product-name"
                    checked={printOptions.productName}
                    onChange={(e) => setPrintOptions({...printOptions, productName: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="print-product-name" className="font-normal cursor-pointer">
                    Product Name
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print-price"
                    checked={printOptions.price}
                    onChange={(e) => setPrintOptions({...printOptions, price: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="print-price" className="font-normal cursor-pointer">
                    Price
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="print-promo-price"
                    checked={printOptions.promoPrice}
                    onChange={(e) => setPrintOptions({...printOptions, promoPrice: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="print-promo-price" className="font-normal cursor-pointer">
                    Promotional Price
                  </Label>
                </div>
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label>Paper Size *</Label>
              <Select value={selectedPaperSizeId} onValueChange={setSelectedPaperSizeId}>
                <SelectTrigger data-testid="select-paper-size">
                  <SelectValue placeholder="Select paper size..." />
                </SelectTrigger>
                <SelectContent>
                  {paperSizes?.filter(size => size.isActive).map((size) => {
                    const widthInch = (size.widthMm / 25.4).toFixed(2);
                    const heightInch = (size.heightMm / 25.4).toFixed(2);
                    return (
                      <SelectItem key={size.id} value={size.id}>
                        {size.widthMm} mm ({widthInch} inch)
                      </SelectItem>
                    );
                  })}
                  {(!paperSizes || paperSizes.filter(s => s.isActive).length === 0) && (
                    <SelectItem value="none" disabled>
                      No paper sizes configured
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {(!paperSizes || paperSizes.filter(s => s.isActive).length === 0) && (
                <p className="text-xs text-muted-foreground">
                  Configure paper sizes in Settings
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-start">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedBarcodeProducts.length === 0) {
                    toast({
                      title: "No products selected",
                      description: "Please add at least one product to print barcodes.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!selectedPaperSizeId) {
                    toast({
                      title: "Paper size required",
                      description: "Please select a paper size.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setBarcodePrintDialogOpen(false);
                  setBarcodePreviewOpen(true);
                }}
                data-testid="button-submit-barcode"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Preview Dialog */}
      <Dialog open={barcodePreviewOpen} onOpenChange={setBarcodePreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Barcode</DialogTitle>
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                  toast({
                    title: "Printing",
                    description: "Sending to printer...",
                  });
                }}
                data-testid="button-print-barcode"
              >
                Print
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedBarcodeProducts.map((item) => (
              <div key={item.product.id} className="text-center space-y-2 p-4 border rounded-md">
                {printOptions.productName && (
                  <div className="font-medium text-sm">{item.product.name}</div>
                )}
                
                {/* Barcode SVG */}
                <div className="flex justify-center py-2">
                  <svg width="200" height="80" className="barcode">
                    <rect x="0" y="0" width="200" height="80" fill="white"/>
                    {/* Simple barcode representation */}
                    <g transform="translate(10, 10)">
                      {[...Array(20)].map((_, i) => (
                        <rect
                          key={i}
                          x={i * 9}
                          y="0"
                          width={Math.random() > 0.5 ? 3 : 2}
                          height="40"
                          fill="black"
                        />
                      ))}
                    </g>
                    <text x="100" y="65" textAnchor="middle" fontSize="12" fill="black">
                      {item.product.sku || '00000000'}
                    </text>
                  </svg>
                </div>

                {printOptions.price && (
                  <div className="text-sm">
                    Price: $ {parseFloat(item.product.price).toFixed(2)}
                  </div>
                )}

                {printOptions.promoPrice && (
                  <div className="text-sm text-red-600">
                    Promo: $ {(parseFloat(item.product.price) * 0.9).toFixed(2)}
                  </div>
                )}

                {item.quantity > 1 && (
                  <div className="text-xs text-muted-foreground">
                    Quantity: {item.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View complete product information
            </DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {viewingProduct.imageUrl ? (
                    <img
                      src={viewingProduct.imageUrl}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-muted-foreground/30">
                      {viewingProduct.name[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-bold">{viewingProduct.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{viewingProduct.category}</Badge>
                    {viewingProduct.size && <Badge variant="outline">{viewingProduct.size}</Badge>}
                    {viewingProduct.color && <Badge variant="outline">{viewingProduct.color}</Badge>}
                  </div>
                  <Badge className={
                    viewingProduct.stock === 0 ? "bg-red-500" :
                    viewingProduct.stock <= viewingProduct.lowStockThreshold ? "bg-orange-500" :
                    "bg-green-500"
                  }>
                    {getStockStatus(viewingProduct.stock, viewingProduct.lowStockThreshold)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Product Code</p>
                  <p className="font-medium">{viewingProduct.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Barcode Type</p>
                  <p className="font-medium">{viewingProduct.barcodeSymbology || 'Code128'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock Quantity</p>
                  <p className="font-medium text-lg">{viewingProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Low Stock Alert</p>
                  <p className="font-medium">{viewingProduct.lowStockThreshold} units</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase Price</p>
                  <p className="font-medium">${parseFloat(viewingProduct.purchasePrice || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sales Price</p>
                  <p className="font-medium text-lg">${parseFloat(viewingProduct.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax Rate</p>
                  <p className="font-medium">{parseFloat(viewingProduct.taxRate || '0').toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock Value</p>
                  <p className="font-medium text-lg">
                    ${(parseFloat(viewingProduct.price) * viewingProduct.stock).toFixed(2)}
                  </p>
                </div>
              </div>

              {viewingProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{viewingProduct.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewingProduct(null)}
                >
                  Close
                </Button>
                {isAdmin && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setEditingProduct(viewingProduct);
                      setViewingProduct(null);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

