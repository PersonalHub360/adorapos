import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";

export default function AddProduct() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/products");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => setLocation("/products")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Product List
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>
            Add a new product to your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm onSuccess={handleSuccess} showHeader={false} />
        </CardContent>
      </Card>
    </div>
  );
}
