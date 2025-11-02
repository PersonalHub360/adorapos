import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Printer, Check } from "lucide-react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: paperSizes } = useQuery<PaperSize[]>({
    queryKey: ["/api/paper-sizes"],
  });

  const filteredProducts = products?.filter((product) => {
    if (!productCode.trim()) return true;
    const searchTerm = productCode.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku?.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  });

  const handleSelectProduct = (product: Product) => {
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
    setDropdownOpen(false);
    toast({
      title: "Product added",
      description: `${product.name} added to barcode print list`,
    });
  };

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

    handleSelectProduct(product);
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

  useEffect(() => {
    if (showPreview) {
      // Use setTimeout to ensure canvas elements are in the DOM
      setTimeout(() => {
        selectedProducts.forEach((item) => {
          for (let i = 0; i < item.quantity; i++) {
            const canvas = document.getElementById(`barcode-${item.product.id}-${i}`) as HTMLCanvasElement;
            if (canvas && item.product.sku) {
              try {
                JsBarcode(canvas, item.product.sku, {
                  format: getBarcodeFormat(item.product.barcodeSymbology),
                  width: 2,
                  height: 60,
                  displayValue: false,
                });
              } catch (error) {
                console.error("Error generating barcode:", error);
              }
            }
          }
        });
      }, 100);
    }
  }, [showPreview, selectedProducts]);

  const getBarcodeFormat = (symbology?: string | null) => {
    switch (symbology) {
      case "Code39":
        return "CODE39";
      case "EAN13":
        return "EAN13";
      case "UPCA":
        return "UPC";
      case "QRCode":
        return "CODE128"; // JsBarcode doesn't support QR, fallback to CODE128
      case "Code128":
      default:
        return "CODE128";
    }
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
              <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PopoverTrigger asChild>
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      id="productCode"
                      value={productCode}
                      onChange={(e) => {
                        setProductCode(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddProduct();
                        }
                        if (e.key === "Escape") {
                          setDropdownOpen(false);
                        }
                      }}
                      placeholder="Please type product code and select..."
                      data-testid="input-product-code"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search products..." 
                      value={productCode}
                      onValueChange={setProductCode}
                    />
                    <CommandList>
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts?.slice(0, 10).map((product) => {
                          const isSelected = selectedProducts.some(
                            (item) => item.product.id === product.id
                          );
                          return (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={() => handleSelectProduct(product)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                      <span className="text-sm text-muted-foreground">
                                        {product.name[0]}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Code: {product.sku} • {product.category} • ${product.price}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                    setPrintOptions({ ...printOptions, productName: checked === true })
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
                    setPrintOptions({ ...printOptions, price: checked === true })
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
                    setPrintOptions({ ...printOptions, promoPrice: checked === true })
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
            <DialogDescription>
              Review and print barcode labels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {selectedProducts.map((item) =>
                Array.from({ length: item.quantity }).map((_, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="border rounded-md p-4 text-center space-y-2 bg-white"
                  >
                    <div className="font-mono text-lg font-bold">{item.product.sku}</div>
                    <div className="flex justify-center">
                      <canvas
                        id={`barcode-${item.product.id}-${index}`}
                        className="max-w-full"
                      />
                    </div>
                    
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
