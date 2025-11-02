import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, AlertTriangle, TrendingUp, Search, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import type { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStock, setEditingStock] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = products?.filter((p) => p.stock <= p.lowStockThreshold);
  const outOfStockProducts = products?.filter((p) => p.stock === 0);

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      await apiRequest("PATCH", `/api/products/${id}`, { stock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Stock updated",
        description: "Product stock level has been updated.",
      });
      setEditingStock(null);
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
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= threshold) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const handleEditStock = (product: Product) => {
    setEditingStock(product);
    setNewStock(product.stock);
  };

  const handleUpdateStock = () => {
    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, stock: newStock });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-inventory-title">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage product stock levels</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-products">
              {products?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-low-stock-items">
              {lowStockProducts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive" data-testid="text-out-of-stock">
              {outOfStockProducts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unavailable items</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-inventory"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Alert Level</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock, product.lowStockThreshold);
                  return (
                    <TableRow key={product.id} data-testid={`row-inventory-${product.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold" data-testid={`text-product-name-${product.id}`}>
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.size || "—"}</TableCell>
                      <TableCell>{product.color || "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums" data-testid={`text-stock-${product.id}`}>
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {product.lowStockThreshold}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} data-testid={`badge-status-${product.id}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStock(product)}
                            data-testid={`button-edit-stock-${product.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        </Card>
      )}

      {editingStock && (
        <Dialog open={!!editingStock} onOpenChange={() => setEditingStock(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock Level</DialogTitle>
              <DialogDescription>
                Adjust the stock quantity for {editingStock.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock: {editingStock.stock}</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  data-testid="input-new-stock"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingStock(null)}
                  data-testid="button-cancel-stock"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateStock}
                  disabled={updateStockMutation.isPending}
                  data-testid="button-save-stock"
                >
                  {updateStockMutation.isPending ? "Saving..." : "Update Stock"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
