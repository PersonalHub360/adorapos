# Clothing Store POS System

## Overview

This is a point-of-sale (POS) system for clothing stores built as a full-stack web application. The system enables retail staff to manage inventory, process sales transactions, track customers, and generate reports. It features role-based access control (admin and cashier roles) and provides a comprehensive interface for day-to-day retail operations.

The application is designed for fast-paced retail environments with emphasis on efficiency, data clarity, and workflow optimization following Material Design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on Radix UI primitives, providing accessible and customizable components following the "new-york" style variant.

**Design System**: Material Design approach with Tailwind CSS for styling. The design emphasizes:
- Scan-ability for fast-paced retail environments
- Efficiency with minimal clicks for common tasks
- Data clarity for complex information display
- Workflow optimization for natural retail operations

**State Management**: 
- TanStack Query (React Query) for server state management and data fetching
- React hooks for local component state
- Query client configured with custom fetch functions and error handling

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Landing: Authentication entry point
- Dashboard: Overview with sales stats and low-stock alerts
- Products: Product catalog management with CRUD operations
- Customers: Customer database management
- Sales/POS: Point-of-sale interface with cart, checkout, and multiple payment methods (CASH, CARD, ABA, ACLEDA, DUE)
- Inventory: Stock level monitoring and management
- Reports: Sales analytics and reporting by period

**Design Theme**: Colorful gradient-based design with vibrant purples, pinks, blues, and other bright colors throughout the interface

**Typography**: Inter font family for optimal readability at all sizes with defined hierarchy (3xl for titles down to xs for captions)

### Backend Architecture

**Runtime**: Node.js with Express.js web framework

**Language**: TypeScript with ES modules

**API Design**: RESTful API with JSON responses, organized by resource:
- `/api/auth/*` - Authentication endpoints
- `/api/products/*` - Product management
- `/api/customers/*` - Customer management
- `/api/sales/*` - Sales transactions
- `/api/reports/*` - Analytics and reporting
- `/api/dashboard/*` - Dashboard statistics

**Middleware**:
- JSON body parsing with raw body preservation
- Request logging with timing and response capture
- Session management
- Authentication guards (isAuthenticated, isAdmin)

**Development Server**: Vite integration for HMR in development mode with custom middleware mode

**Production Build**: ESBuild for server bundling, Vite for client bundling

### Data Storage

**Database**: PostgreSQL (via Neon serverless)

**ORM**: Drizzle ORM with schema-first approach

**Schema Design**:
- `sessions` - Session storage for authentication (required by Replit Auth)
- `users` - User accounts with role field (admin/cashier)
- `products` - Clothing inventory with attributes (category, size, color, price, stock, SKU)
- `customers` - Customer database with contact and loyalty information
- `sales` - Sales transactions with totals, payment method, and relationships
- `saleItems` - Line items for each sale
- `promoCodes` - Promotional discount codes

**Relationships**:
- Sales belong to customers and contain multiple sale items
- Sale items reference products
- All schemas use Zod for validation via drizzle-zod

**Connection**: WebSocket-based connection using `@neondatabase/serverless` with ws adapter

### Authentication & Authorization

**Provider**: Replit Auth using OpenID Connect (OIDC)

**Session Management**: 
- PostgreSQL session store via connect-pg-simple
- 7-day session TTL
- HTTP-only cookies with secure flag in production

**Strategy**: Passport.js with openid-client strategy

**Authorization Levels**:
- Unauthenticated: Landing page only
- Cashier: Access to sales, products (read), customers, dashboard
- Admin: Full access including inventory management, reports, and user management

**User Data**: Stored in database with profile information from OIDC claims (email, name, profile image)

### External Dependencies

**UI & Styling**:
- Radix UI primitives for accessible component foundations
- Tailwind CSS for utility-first styling
- class-variance-authority for component variants
- Lucide React for icons

**Data & Forms**:
- TanStack Query for data fetching and caching
- React Hook Form with Zod resolvers for form validation
- date-fns for date manipulation

**Development Tools**:
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal) for enhanced development experience
- TypeScript for type safety across the stack

**Database**:
- Neon serverless PostgreSQL
- Drizzle ORM and Drizzle Kit for schema management
- ws for WebSocket support

**Authentication**:
- Passport.js with openid-client for OIDC
- express-session with PostgreSQL store
- memoizee for caching OIDC configuration

**Build & Bundling**:
- Vite for frontend bundling and development
- ESBuild for server bundling
- PostCSS with Tailwind and Autoprefixer