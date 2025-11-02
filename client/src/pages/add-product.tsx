import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddProduct() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => setLocation("/products")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Please go to the Product List page and click the "Add Product" button to add a new product.</p>
            <Button
              onClick={() => setLocation("/products")}
              className="mt-4"
              data-testid="button-go-to-products"
            >
              Go to Product List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
