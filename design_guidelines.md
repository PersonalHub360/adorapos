# Design Guidelines: Clothing Store POS System

## Design Approach

**Selected Approach:** Design System (Material Design)

**Justification:** This POS system is a utility-focused, information-dense application where efficiency, data clarity, and workflow optimization are paramount. Material Design provides robust patterns for complex data interfaces, clear visual hierarchy, and established interaction models that reduce training time for retail staff.

**Core Principles:**
- Scan-ability: Information must be instantly readable in fast-paced retail environments
- Efficiency: Minimize clicks and cognitive load for common tasks
- Data Clarity: Present complex information (inventory, sales, reports) in digestible formats
- Workflow Optimization: Design for the natural flow of retail operations

## Typography

**Font Family:** Inter (via Google Fonts CDN) for exceptional readability at all sizes

**Hierarchy:**
- Page Titles: text-3xl font-bold (Dashboard sections, report headers)
- Section Headers: text-2xl font-semibold (Product Management, Sales Overview)
- Card/Component Titles: text-lg font-semibold (Product names, customer names)
- Body Text: text-base font-normal (Product details, descriptions, form labels)
- Small Text: text-sm (Metadata, timestamps, helper text)
- Data Display: text-sm font-medium tabular-nums (Prices, quantities, stock counts)
- Captions: text-xs (Table footnotes, status indicators)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4 or gap-6
- Form field spacing: space-y-4
- Button padding: px-6 py-2 or px-8 py-3

**Grid Structure:**
- Dashboard: 12-column grid with sidebar navigation (w-64 fixed sidebar, main content flex-1)
- Product Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Sales Interface: Two-column split (product selection 60%, cart summary 40%)
- Reports: Single column max-w-7xl with nested grids for data visualization
- Forms: Single column max-w-2xl for optimal completion

**Container Strategy:**
- Application chrome: Full viewport height with fixed header (h-16) and sidebar
- Content areas: p-6 or p-8 with max-width constraints per context
- Modals/Dialogs: max-w-lg to max-w-4xl depending on form complexity

## Component Library

### Navigation Components

**Sidebar Navigation (Admin/Cashier):**
- Fixed left sidebar (w-64) with full height
- Logo/branding area at top (h-16 flex items-center px-6)
- Navigation items: px-6 py-3 with left icon (w-5 h-5) and label
- Active state: Different treatment with indicator
- Role-based menu items with subtle dividers
- User profile section at bottom with role badge

**Top Bar:**
- Fixed header (h-16) spanning full width
- Left: Breadcrumb navigation (text-sm)
- Right: Quick actions (notification icon, user menu, logout)
- Search bar in center for product/customer lookup (max-w-md)

### Data Display Components

**Product Cards:**
- Compact card layout with image placeholder (aspect-square)
- Product name (text-lg font-semibold) truncated to 2 lines
- Metadata row: Category, Size, Color (text-sm space-x-2)
- Price display (text-xl font-bold tabular-nums)
- Stock indicator with visual urgency (text-sm with icon)
- Quick action buttons: Edit, Delete, View Details

**Data Tables:**
- Striped rows for scan-ability
- Fixed header with sortable columns (chevron icons from Heroicons)
- Column alignment: Left for text, right for numbers
- Pagination at bottom (showing "1-20 of 145 items")
- Bulk actions toolbar when rows selected
- Responsive: Stack to cards on mobile

**Transaction Cart:**
- Sticky summary panel during sales
- Line items with thumbnail, name, quantity spinner, price
- Subtotal, discount, tax, total sections clearly separated
- Large, prominent checkout button at bottom
- Remove item icon on hover

### Form Components

**Input Fields:**
- Consistent label positioning (text-sm font-medium mb-2)
- Input height: h-11 with px-4 py-2
- Border treatment with focus states
- Error messages (text-sm text-red-600 mt-1)
- Required field indicators (asterisk)

**Select Dropdowns:**
- Match input field height and styling
- Clear selection indicators
- Search-able for long lists (product categories, customers)

**Multi-Step Forms (Add Product):**
- Progress indicator at top showing steps (Basic Info → Pricing → Stock)
- Step content with consistent spacing
- Navigation buttons at bottom (Back, Next/Save)

### Action Components

**Primary Buttons:**
- Large touch targets: px-8 py-3 text-base font-medium
- Icons from Heroicons positioned left or right as needed
- Loading states with spinner replacement
- Critical actions: "Process Sale," "Save Product," "Generate Report"

**Secondary Buttons:**
- Outlined style with matching height
- Used for "Cancel," "Back," auxiliary actions

**Icon Buttons:**
- Square (w-10 h-10) for consistent hit areas
- Tooltips on hover for clarity
- Used in tables, cards for quick actions

**Action Groups:**
- Horizontal button clusters with gap-3
- Primary action rightmost, secondary/cancel leftmost

### Modal/Dialog Components

**Transaction Modals:**
- Receipt preview: max-w-md with print-optimized layout
- Payment selection: max-w-lg with large payment method cards
- Discount application: max-w-sm with code input and percentage selector

**Confirmation Dialogs:**
- max-w-md centered
- Clear warning icons for destructive actions
- Action buttons with appropriate hierarchy

### Dashboard Widgets

**Stat Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Card structure: Icon (w-12 h-12), Label (text-sm), Value (text-3xl font-bold), Change indicator
- Metrics: Today's Sales, Items Sold, Low Stock Alerts, Active Customers

**Sales Chart:**
- Container with aspect-video or fixed height (h-80)
- Chart library implementation placeholder
- Time period selector (Daily/Weekly/Monthly tabs)

**Best Sellers List:**
- Ranked list with position number
- Product thumbnail, name, units sold, revenue
- Top 5-10 items with "View All" link

**Recent Transactions:**
- Compact table or card list
- Transaction ID, timestamp, customer, total, payment method
- Click to view details action

### Notification System

**Low Stock Alerts:**
- Banner at dashboard top (dismissible)
- Badge count on inventory navigation item
- Table row highlighting in product list

**Toast Notifications:**
- Top-right positioning with slide-in animation
- Success, error, info variants with appropriate icons
- Auto-dismiss after 4-5 seconds with close button

### Search & Filter Components

**Product Search:**
- Instant search with debounce
- Filter chips below search (Category, Size, Color, Price Range)
- Active filters displayed as removable tags
- Results count indicator

**Advanced Filter Panel:**
- Collapsible sidebar (w-64 to w-80)
- Accordion sections for filter groups
- Apply/Clear buttons at bottom

## Inventory Management Views

**Stock Level Indicators:**
- Green: In Stock (>20 units)
- Yellow: Low Stock (5-20 units)  
- Red: Critical (<5 units)
- Badge or progress bar visualization

**Quick Stock Update:**
- Inline editing in product table
- Quantity adjustment with +/- buttons
- Bulk update functionality

## Reporting Interface

**Report Generator:**
- Date range picker (presets: Today, This Week, This Month, Custom)
- Report type selector (Sales, Inventory, Customer)
- Export options (PDF, CSV, Print)

**Report Display:**
- Summary metrics at top (total sales, transactions, avg ticket)
- Tabbed sections: Overview, Products, Customers, Trends
- Data tables with export capability
- Charts and graphs for visual analysis

## User Authentication

**Login Screen:**
- Centered form (max-w-md)
- Logo at top
- Role selector or automatic detection
- Simple, distraction-free layout

**Role Differentiation:**
- Admin: Full navigation access, all features visible
- Cashier: Limited to Sales, Customer lookup, basic inventory view
- Visual role indicator in top bar

## Responsive Considerations

**Desktop (lg and up):** Primary experience - sidebar navigation, multi-column layouts, data tables
**Tablet (md):** Collapsible sidebar, 2-column grids, optimized for portrait orientation
**Mobile (base):** Bottom navigation, single column, cards instead of tables, simplified sale flow

## Icons

**Icon Library:** Heroicons (via CDN)

**Icon Usage:**
- Navigation: shopping-bag, users, document-chart-bar, cog-6-tooth
- Actions: plus, pencil, trash, printer, download
- Status: check-circle, exclamation-triangle, x-circle
- Cart: shopping-cart, minus, plus, x-mark
- Payment: credit-card, banknotes, device-phone-mobile
- Size: w-5 h-5 for navigation and buttons, w-6 h-6 for prominent actions

## Accessibility

- All interactive elements have minimum 44x44px touch targets
- Form inputs with clear labels and error states
- Keyboard navigation throughout application
- Focus indicators on all interactive elements
- Screen reader announcements for success/error states
- Sufficient contrast ratios for all text
- Consistent tab order following visual layout

## Images

This application does not require hero images or marketing imagery. Product placeholder images should be used in cards and lists:
- Product thumbnails: aspect-square with neutral background
- Empty state illustrations for no products/customers/transactions
- User avatar placeholders in profile sections