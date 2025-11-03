import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <Card className="w-full max-w-md shadow-2xl border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <ShoppingBag className="h-10 w-10" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">ClothingPOS</CardTitle>
            <CardDescription className="text-base mt-2">
              Professional Point of Sale System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Product Management</h3>
                <p className="text-sm text-muted-foreground">Manage inventory and stock levels</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-900/30 dark:to-blue-900/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Sales Processing</h3>
                <p className="text-sm text-muted-foreground">Fast checkout with multiple payment options</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
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
