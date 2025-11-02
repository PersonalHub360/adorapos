import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Calendar, User, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, Customer } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS() {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("walk-in");
  const [searchCode, setSearchCode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const handleSearchProduct = () => {
    if (!searchCode.trim()) return;
    
    const product = products?.find(
      p => p.sku?.toLowerCase() === searchCode.toLowerCase() || 
           p.name.toLowerCase().includes(searchCode.toLowerCase())
    );

    if (product && product.stock > 0) {
      const existingItem = cart.find(item => item.product.id === product.id);
      if (existingItem) {
        updateQuantity(product.id, 1);
      } else {
        setCart([...cart, { product, quantity: 1 }]);
      }
      setSearchCode("");
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > item.product.stock) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  
  const totalDiscount = discount + coupon;
  const grandTotal = Math.max(0, subtotal - totalDiscount + tax + shipping);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              className="w-48"
              data-testid="input-date"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <User className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary" className="text-sm px-4 py-2">
            Active Lifestyle Ltd.
          </Badge>
        </div>

        {/* Product Search */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-md">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <Input
              placeholder="Scan/Search product by name/code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct()}
              className="flex-1"
              data-testid="input-search-product"
            />
            <Button onClick={handleSearchProduct} data-testid="button-add-product">
              Add
            </Button>
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">SubTotal</TableHead>
                <TableHead className="text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No items in cart. Scan or search products to add.
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.product.sku || '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${parseFloat(item.product.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                        data-testid={`button-delete-${item.product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Items</Label>
              <span className="font-medium tabular-nums">{itemCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Coupon</Label>
              <Input
                type="number"
                value={coupon}
                onChange={(e) => setCoupon(parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                step="0.01"
                data-testid="input-coupon"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Tax</Label>
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                step="0.01"
                data-testid="input-tax"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Total</Label>
              <span className="font-medium tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Discount</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                step="0.01"
                data-testid="input-discount"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Shipping</Label>
              <Input
                type="number"
                value={shipping}
                onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                step="0.01"
                data-testid="input-shipping"
              />
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-xl font-bold">Grand Total</span>
          <span className="text-3xl font-bold tabular-nums">${grandTotal.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-3">
          <Button className="bg-green-600 hover:bg-green-700" data-testid="button-cash">
            Cash
          </Button>
          <Button variant="default" data-testid="button-pos">
            POS
          </Button>
          <Button variant="outline" data-testid="button-deposit">
            Deposit
          </Button>
          <Button variant="outline" data-testid="button-points">
            Points
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-check">
            Check
          </Button>
          <Button variant="secondary" data-testid="button-reopen">
            Reopen Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}
