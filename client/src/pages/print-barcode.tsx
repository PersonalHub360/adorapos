import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Product, PaperSize } from "@shared/schema";

export default function PrintBarcode() {
  const { toast } = useToast();
  const [productCode, setProductCode] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [printOptions, setPrintOptions] = useState({
    productName: true,
    price: false,
    promoPrice: false,
  });
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: paperSizes } = useQuery<PaperSize[]>({
    queryKey: ["/api/paper-sizes"],
  });

  const handleAddProduct = () => {
    if (!productCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product code",
        variant: "destructive",
      });
      return;
    }

    const product = products?.find(
      (p) => p.sku?.toLowerCase() === productCode.toLowerCase()
    );

    if (!product) {
      toast({
        title: "Product not found",
        description: `No product found with code: ${productCode}`,
        variant: "destructive",
      });
      return;
    }

    const existing = selectedProducts.find((item) => item.product.id === product.id);
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }

    setProductCode("");
    toast({
      title: "Product added",
      description: `${product.name} added to barcode print list`,
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(
      selectedProducts.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleSubmit = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPaperSize) {
      toast({
        title: "Error",
        description: "Please select a paper size",
        variant: "destructive",
      });
      return;
    }

    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print sent",
      description: "Barcode labels sent to printer",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Print Barcode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The field labels marked with * are required input fields.
          </p>

          <div className="space-y-2">
            <Label htmlFor="productCode">Add Product *</Label>
            <div className="flex gap-2">
              <Button
                size="icon"
                onClick={handleAddProduct}
                data-testid="button-add-product-to-print"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Input
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProduct();
                  }
                }}
                placeholder="Please type product code and select..."
                data-testid="input-product-code"
              />
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-32">Quantity</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                          data-testid={`input-quantity-${item.product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(item.product.id)}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-3">
            <Label>Print:</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="productName"
                  checked={printOptions.productName}
                  onCheckedChange={(checked) =>
                    setPrintOptions({ ...printOptions, productName: checked as boolean })
                  }
                  data-testid="checkbox-product-name"
                />
                <Label htmlFor="productName" className="font-normal cursor-pointer">
                  Product Name
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="price"
                  checked={printOptions.price}
                  onCheckedChange={(checked) =>
                    setPrintOptions({ ...printOptions, price: checked as boolean })
                  }
                  data-testid="checkbox-price"
                />
                <Label htmlFor="price" className="font-normal cursor-pointer">
                  Price
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="promoPrice"
                  checked={printOptions.promoPrice}
                  onCheckedChange={(checked) =>
                    setPrintOptions({ ...printOptions, promoPrice: checked as boolean })
                  }
                  data-testid="checkbox-promo-price"
                />
                <Label htmlFor="promoPrice" className="font-normal cursor-pointer">
                  Promotional Price
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paperSize">Paper Size *</Label>
            <Select value={selectedPaperSize} onValueChange={setSelectedPaperSize}>
              <SelectTrigger data-testid="select-paper-size">
                <SelectValue placeholder="Select paper size..." />
              </SelectTrigger>
              <SelectContent>
                {paperSizes?.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name} ({size.widthMm}mm x {size.heightMm}mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} className="w-full" data-testid="button-submit-print">
            Submit
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Barcode Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {selectedProducts.map((item) =>
                Array.from({ length: item.quantity }).map((_, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="border rounded-md p-4 text-center space-y-2"
                  >
                    <div className="font-mono text-2xl font-bold">{item.product.sku}</div>
                    <div className="h-16 bg-black bg-[linear-gradient(90deg,black_1px,transparent_1px,transparent_2px,black_2px)] bg-[length:3px_100%]"></div>
                    
                    {printOptions.productName && (
                      <div className="text-sm font-medium">{item.product.name}</div>
                    )}

                    {printOptions.price && (
                      <div className="text-sm">$ {item.product.price}</div>
                    )}

                    {printOptions.promoPrice && (
                      <div className="text-sm text-red-600">
                        Promo: $ {(parseFloat(item.product.price) * 0.9).toFixed(2)}
                      </div>
                    )}

                    {item.quantity > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {index + 1} of {item.quantity}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={handlePrint} data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
