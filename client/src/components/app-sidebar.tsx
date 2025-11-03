import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ShoppingCart,
  Package,
  FileBarChart,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  List,
  Tag,
  Building2,
  Ruler,
  Barcode,
  Receipt,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [productsOpen, setProductsOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        });
        // Force page reload to clear all state and redirect to login
        window.location.href = "/login";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const productSubMenuItems = [
    {
      title: "Product List",
      url: "/products",
      icon: List,
    },
    {
      title: "Add Product",
      url: "/products/add",
      icon: Plus,
    },
    {
      title: "Categories",
      url: "/products/categories",
      icon: Tag,
    },
    {
      title: "Brands",
      url: "/products/brands",
      icon: Building2,
    },
    {
      title: "Units",
      url: "/products/units",
      icon: Ruler,
    },
    {
      title: "Print Barcode",
      url: "/products/print-barcode",
      icon: Barcode,
    },
  ];

  const adminMenuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "POS",
      url: "/pos",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: FileBarChart,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: Receipt,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileBarChart,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const cashierMenuItems = [
    {
      title: "POS",
      url: "/",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Products",
      url: "/products",
      icon: ShoppingBag,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : cashierMenuItems;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">ClothingPOS</h2>
            <p className="text-xs text-muted-foreground">Point of Sale</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={location === item.url ? 'bg-sidebar-accent' : ''}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {isAdmin && (
                <Collapsible open={productsOpen} onOpenChange={setProductsOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="link-products-menu">
                        <ShoppingBag className="h-5 w-5" />
                        <span>Products</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {productSubMenuItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location === subItem.url}
                              data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <Link href={subItem.url}>
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md p-3 bg-sidebar-accent">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || user?.email || 'User'}
            </p>
            <Badge variant="secondary" className="text-xs">
              {user?.role === 'admin' ? 'Admin' : 'Cashier'}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
