import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, X, Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Product, Customer, PromoCode, InsertSale, InsertSaleItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const availableProducts = products?.filter((p) => p.stock > 0);
  const filteredProducts = availableProducts?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyPromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}`);
      if (!response.ok) {
        throw new Error("Invalid or inactive promo code");
      }
      return response.json();
    },
    onSuccess: (data: PromoCode) => {
      setAppliedPromo(data);
      toast({
        title: "Promo code applied",
        description: `${data.type === 'percentage' ? `${data.value}%` : `$${data.value}`} discount applied`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (saleData: { sale: InsertSale; items: InsertSaleItem[] }) => {
      const response = await apiRequest("POST", "/api/sales", saleData);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Sale response data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      setReceipt(data);
      setCart([]);
      setSelectedCustomer("none");
      setPromoCode("");
      setAppliedPromo(null);
      setPaymentMethod("cash");
      setIsCheckoutOpen(false);
      toast({
        title: "Sale completed",
        description: "Transaction processed successfully",
      });
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
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({
          title: "Out of stock",
          description: "No more items available",
          variant: "destructive",
        });
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > item.product.stock) {
          toast({
            title: "Out of stock",
            description: "No more items available",
            variant: "destructive",
          });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  
  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? subtotal * (parseFloat(appliedPromo.value) / 100)
      : parseFloat(appliedPromo.value)
    : 0;
  
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }
    setIsCheckoutOpen(true);
  };

  const confirmCheckout = () => {
    const saleData = {
      sale: {
        customerId: selectedCustomer === "none" ? null : selectedCustomer,
        userId: user!.id,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        promoCodeId: appliedPromo?.id || null,
        total: total.toFixed(2),
        paymentMethod,
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
      })),
    };
    checkoutMutation.mutate(saleData);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-sales-title">Point of Sale</h1>
            <p className="text-muted-foreground mt-1">Select products to add to cart</p>
          </div>

          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>

          {productsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => addToCart(product)}
                  data-testid={`card-product-${product.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-1" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • {product.size} • {product.color}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xl font-bold tabular-nums">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {product.stock} in stock
                          </Badge>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-6 p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No products found" : "No products available"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="w-[400px] border-l bg-card p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Cart
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          ${parseFloat(item.product.price).toFixed(2)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`button-remove-${item.product.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center" data-testid={`text-quantity-${item.product.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold tabular-nums">
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
              </div>
            </Card>
          )}

          <Separator />

          <div className="space-y-3">
            <div>
              <Label htmlFor="customer" className="text-sm">Customer (Optional)</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="mt-1" data-testid="select-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="promo" className="text-sm">Promo Code</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  disabled={!!appliedPromo}
                  data-testid="input-promo-code"
                />
                {appliedPromo ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoCode("");
                    }}
                    data-testid="button-remove-promo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => applyPromoMutation.mutate(promoCode)}
                    disabled={!promoCode || applyPromoMutation.isPending}
                    data-testid="button-apply-promo"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {appliedPromo && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {appliedPromo.type === 'percentage' ? `${appliedPromo.value}%` : `$${appliedPromo.value}`} discount applied
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums" data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums text-green-600" data-testid="text-discount">
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums" data-testid="text-total">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            data-testid="button-checkout"
          >
            <Receipt className="h-5 w-5 mr-2" />
            Checkout
          </Button>
        </div>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Select payment method to complete the transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1" data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCheckoutOpen(false)}
                data-testid="button-cancel-checkout"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={confirmCheckout}
                disabled={checkoutMutation.isPending}
                data-testid="button-confirm-payment"
              >
                {checkoutMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {receipt && (
        <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receipt</DialogTitle>
              <DialogDescription>Transaction completed successfully</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="text-center">
                <h3 className="font-bold text-lg">ClothingPOS</h3>
                <p className="text-sm text-muted-foreground">Thank you for your purchase</p>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{receipt.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="capitalize">{receipt.paymentMethod}</span>
                </div>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span className="text-lg">${receipt.total ? parseFloat(receipt.total).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setReceipt(null)} data-testid="button-close-receipt">
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
