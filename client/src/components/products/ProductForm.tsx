import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, InsertProduct } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const categories = ["Shirts", "Pants", "Dresses", "Jackets", "Accessories", "Shoes"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  showHeader?: boolean;
}

export function ProductForm({ product, onSuccess, showHeader = true }: ProductFormProps) {
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
    
    const submitData = {
      ...formData,
      purchasePrice: formData.purchasePrice || "0",
      price: formData.price || "0",
      taxRate: formData.taxRate || "0",
      stock: formData.stock || 0,
      lowStockThreshold: formData.lowStockThreshold || 5,
    };
    
    mutation.mutate(submitData);
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
  );
}
