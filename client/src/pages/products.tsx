import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Filter, Eye, Barcode, X, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, InsertProduct, PaperSize } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const categories = ["Shirts", "Pants", "Dresses", "Jackets", "Accessories", "Shoes"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-products-title">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your clothing inventory</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <ProductForm
                onSuccess={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
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
          <Table>
            <TableHeader>
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
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        </Card>
      )}

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              onSuccess={() => setEditingProduct(null)}
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
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertProduct>({
    name: product?.name || "",
    category: product?.category || "",
    size: product?.size || "",
    color: product?.color || "",
    purchasePrice: product?.purchasePrice || "0",
    price: product?.price || "0",
    taxRate: product?.taxRate || "0",
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    sku: product?.sku || "",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    barcodeSymbology: product?.barcodeSymbology || "Code128",
  });
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || "");

  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (product) {
        await apiRequest("PATCH", `/api/products/${product.id}`, data);
      } else {
        await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: product ? "Product updated" : "Product added",
        description: product ? "Product details have been updated." : "New product has been added to inventory.",
      });
      onSuccess();
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
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const generateSKU = () => {
    const sku = Math.floor(10000 + Math.random() * 90000).toString();
    setFormData({ ...formData, sku });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        <DialogDescription>
          {product ? "Update product details" : "Add a new product to your inventory"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-product-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">Product Code *</Label>
            <div className="flex gap-2">
              <Input
                id="sku"
                type="number"
                value={formData.sku || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (value.length <= 5 && /^\d+$/.test(value))) {
                    setFormData({ ...formData, sku: value });
                  }
                }}
                placeholder="5-digit number"
                maxLength={5}
                pattern="\d{5}"
                data-testid="input-product-sku"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateSKU}
                title="Generate Code"
                data-testid="button-generate-sku"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-product-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              {imagePreview && (
                <div className="relative w-full h-32 border rounded-md overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                      setImagePreview("");
                      setFormData({ ...formData, imageUrl: "" });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!imagePreview && (
                <div className="text-xs text-muted-foreground">No file chosen</div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="barcodeSymbology">Barcode Symbology *</Label>
            <Select 
              value={formData.barcodeSymbology || "Code128"} 
              onValueChange={(v) => setFormData({ ...formData, barcodeSymbology: v })}
            >
              <SelectTrigger data-testid="select-barcode-symbology">
                <SelectValue placeholder="Select symbology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Code128">Code 128</SelectItem>
                <SelectItem value="Code39">Code 39</SelectItem>
                <SelectItem value="EAN13">EAN-13</SelectItem>
                <SelectItem value="UPCA">UPC-A</SelectItem>
                <SelectItem value="QRCode">QR Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger data-testid="select-product-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color || ""}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              data-testid="input-product-color"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={formData.size || ""} onValueChange={(v) => setFormData({ ...formData, size: v })}>
              <SelectTrigger data-testid="select-product-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price *</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              required
              placeholder="Cost price"
              data-testid="input-product-purchase-price"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Sales Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              placeholder="Selling price"
              data-testid="input-product-price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
              placeholder="e.g., 10 for 10%"
              data-testid="input-product-tax-rate"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              required
              data-testid="input-product-stock"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">Low Stock Alert</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
              data-testid="input-product-threshold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            data-testid="input-product-description"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-form">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-product">
            {mutation.isPending ? "Saving..." : product ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </>
  );
}
