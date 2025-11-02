import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-10 w-10" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">ClothingPOS</CardTitle>
            <CardDescription className="text-base mt-2">
              Professional Point of Sale System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Product Management</h3>
                <p className="text-sm text-muted-foreground">Manage inventory and stock levels</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Sales Processing</h3>
                <p className="text-sm text-muted-foreground">Fast checkout with multiple payment options</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Analytics & Reports</h3>
                <p className="text-sm text-muted-foreground">Track sales and performance metrics</p>
              </div>
            </div>
          </div>
          <Button
            asChild
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            <a href="/api/login">Sign In to Continue</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
