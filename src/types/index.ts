// User and Authentication types
export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  preferences?: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  leads?: Lead[];
  appointments?: Appointment[];
  measurements?: Measurement[];
}

// Lead types
export interface Lead {
  id: string;
  customerId: string;
  customer?: Customer;
  source: 'referral' | 'website' | 'social_media' | 'walk_in';
  status: 'new' | 'contacted' | 'qualified' | 'hot' | 'warm' | 'cold' | 'converted' | 'lost';
  score: number;
  occasion?: 'wedding' | 'business' | 'prom' | 'general' | null;
  budgetRange?: string | null;
  notes?: string | null;
  lastContact?: string | null;
  nextFollowUp?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  longDescription?: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  slug?: string;
  brand?: string;
  fabric?: string;
  pattern?: string;
  season?: string;
  occasions: string[];
  styleAttributes: string[];
  care?: string;
  
  // Inventory Management
  trackStock: boolean;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  
  // Status & Visibility
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  
  // SEO & Marketing
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  weight?: number;
  dimensions?: string;
  
  // Supplier Information
  supplierId?: string;
  supplierSku?: string;
  leadTime?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  discontinuedAt?: string;
  
  // Relations
  variants?: ProductVariant[];
  images?: ProductImage[];
  supplier?: Supplier;
  reviews?: ProductReview[];
  
  // Computed fields
  totalVariantStock?: number;
  averageRating?: number;
  reviewCount?: number;
}

// 🚀 Enhanced SEO-Optimized Product System
export interface SEOCategory {
  id: string;
  name: string;
  slug: string; // e.g., 'suits', 'wedding', 'complete-looks'
  parentSlug?: string; // e.g., 'suits' for parent, 'wedding' for child
  
  // SEO Fields
  seoTitle: string; // Max 60 chars for Google
  metaDescription: string; // Max 160 chars for Google
  h1Heading: string;
  canonicalUrl?: string;
  
  // Schema.org structured data
  schemaType: 'Product' | 'ProductCollection' | 'Organization';
  schemaData?: any;
  
  // Navigation
  navPriority: number; // Higher = shown first
  showInMenu: boolean;
  showInBreadcrumbs: boolean;
  
  // Content
  description?: string;
  bannerImage?: string;
  contentBlocks?: CategoryContentBlock[];
  
  // Analytics
  pageViews?: number;
  conversionRate?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CategoryContentBlock {
  id: string;
  type: 'hero' | 'features' | 'guide' | 'testimonials' | 'faq';
  title: string;
  content: string;
  image?: string;
  ctaText?: string;
  ctaUrl?: string;
  order: number;
}

export interface SmartProduct {
  id: string;
  name: string;
  sku: string;
  slug: string; // SEO-friendly URL
  
  // Primary Category (matches your 6 main categories)
  primaryCategory: 'suits' | 'shirts' | 'ties' | 'vests' | 'complete-looks' | 'wedding-services';
  subcategory?: string; // wedding, business, tuxedos, etc.
  
  // Smart Filtering System (replaces endless collections)
  occasions: string[]; // ["wedding", "business", "prom", "cocktail", "formal"]
  styleAttributes: string[]; // ["classic", "modern", "slim", "regular", "vintage"]
  colorFamily: string; // "blues", "neutrals", "reds", "greens", "blacks"
  priceTier: 'budget' | 'premium' | 'luxury'; // Under $200, $200-400, $400+
  fabricType?: string; // "wool", "cotton", "silk", "polyester", "blend"
  seasons?: string[]; // ["spring", "summer", "fall", "winter"]
  
  // Product Details
  description: string;
  shortDescription?: string; // For cards/lists
  features: string[]; // Bullet points
  careInstructions?: string;
  
  // Pricing & Inventory
  price: number;
  compareAtPrice?: number; // Original price if on sale
  costPrice?: number; // For margin calculations
  inventory: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  
  // Media
  images: ProductImage[];
  videos?: ProductVideo[];
  
  // Variants (sizes, colors, etc.)
  variants: ProductVariant[];
  
  // SEO & Marketing
  seoTitle?: string;
  metaDescription?: string;
  searchKeywords: string[]; // For internal search
  structuredData?: any; // Schema.org Product data
  
  // E-commerce Features
  isDigital: boolean; // For digital products/services
  requiresShipping: boolean;
  weight?: number; // For shipping calculations
  dimensions?: ProductDimensions;
  
  // Business Logic
  status: 'draft' | 'active' | 'archived' | 'out_of_stock';
  featured: boolean; // Show on homepage
  newProduct: boolean; // "New" badge
  bestseller: boolean; // "Bestseller" badge
  
  // Analytics & Performance
  views: number;
  addToCartRate?: number;
  conversionRate?: number;
  
  // Relations
  relatedProducts?: string[]; // Product IDs
  upserveProducts?: string[]; // Product IDs
  bundleProducts?: string[]; // For complete looks
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Staff member ID
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  caption?: string;
  isPrimary: boolean;
  position: number;
  width?: number;
  height?: number;
  size?: number;
  createdAt: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  duration?: number;
  type: 'product_demo' | 'styling_guide' | 'review';
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  
  // Variant Attributes
  size?: string;
  color?: string;
  material?: string;
  fit?: string;
  
  // Pricing
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  
  // Inventory
  stock: number;
  reservedStock: number;
  minimumStock: number;
  reorderPoint: number;
  weight?: number;
  
  // Status
  isActive: boolean;
  position: number;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations
  product?: Product;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  occasions?: string[];
  styleAttributes?: string[];
  colorFamily?: string;
  priceTier?: string;
  priceRange?: { min: number; max: number };
  fabricType?: string;
  seasons?: string[];
  inStock?: boolean;
  featured?: boolean;
  newProduct?: boolean;
  bestseller?: boolean;
  search?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'created' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CompletePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  
  // Package Contents
  products: CompletePackageItem[];
  totalValue: number; // Sum of individual prices
  packagePrice: number; // Discounted bundle price
  savings: number; // totalValue - packagePrice
  
  // Categorization
  occasion: string; // "wedding", "business", "prom"
  style: string; // "classic", "modern", "luxury"
  
  // Media
  images: ProductImage[];
  
  // SEO
  seoTitle?: string;
  metaDescription?: string;
  
  // Business
  featured: boolean;
  available: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface CompletePackageItem {
  productId: string;
  product?: SmartProduct;
  quantity: number;
  variantId?: string;
  isOptional: boolean; // Can customer remove this item?
  customizations?: string; // Special instructions
}

// Form Data Types for Product Management
export interface SmartProductFormData {
  name: string;
  slug: string;
  primaryCategory: SmartProduct['primaryCategory'];
  subcategory?: string;
  description: string;
  shortDescription?: string;
  
  // Classification
  occasions: string[];
  styleAttributes: string[];
  colorFamily: string;
  priceTier: SmartProduct['priceTier'];
  fabricType?: string;
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  
  // Inventory
  inventory: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  
  // SEO
  seoTitle?: string;
  metaDescription?: string;
  searchKeywords: string[];
  
  // Media (URLs for now, can be enhanced with upload later)
  images: string[];
  
  // Status
  status: SmartProduct['status'];
  featured: boolean;
}

// Order types
export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  dueDate?: string | null;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  customizations?: string | null;
}

// Measurement types
export interface Measurement {
  id: string;
  customerId: string;
  customer?: Customer;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  shoulders?: number | null;
  armLength?: number | null;
  inseam?: number | null;
  neck?: number | null;
  height?: number | null;
  weight?: number | null;
  notes?: string | null;
  takenBy?: string | null;
  dateRecorded: string;
  updatedAt: string;
}

// Appointment types
export interface Appointment {
  id: string;
  customerId: string;
  customer?: Customer;
  service: 'consultation' | 'measurements' | 'fitting' | 'pickup';
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  data?: string | null;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    customers?: T[];
    leads?: T[];
    orders?: T[];
    products?: T[];
    measurements?: T[];
    appointments?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Dashboard types
export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalLeads: number;
  pendingAppointments: number;
  recentOrders: Order[];
}

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  salesByStatus: Array<{
    status: string;
    _count: number;
    _sum: { total: number };
  }>;
}

export interface LeadAnalytics {
  leadsByStatus: Array<{
    status: string;
    _count: number;
  }>;
  leadsBySource: Array<{
    source: string;
    _count: number;
  }>;
}

// Form types
export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  preferences?: string;
}

export interface LeadFormData {
  customerId: string;
  source: Lead['source'];
  status?: Lead['status'];
  score?: number;
  occasion?: Lead['occasion'];
  budgetRange?: string;
  notes?: string;
  nextFollowUp?: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  category: Product['category'];
  description?: string;
  price: number;
  fabric?: string;
  colors: string;
  sizes: string;
  stock: number;
  minimumStock: number;
  images: string;
}

export interface OrderFormData {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    customizations?: string;
  }>;
  dueDate?: string;
  notes?: string;
}

export interface MeasurementFormData {
  customerId: string;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  armLength?: number;
  inseam?: number;
  neck?: number;
  height?: number;
  weight?: number;
  notes?: string;
}

export interface AppointmentFormData {
  customerId: string;
  service: Appointment['service'];
  date: string;
  time: string;
  duration?: number;
  notes?: string;
}

// Wedding types
export interface WeddingParty {
  id: string;
  weddingCode: string; // For self-service portal access
  weddingDate: Date;
  groomInfo: WeddingContact;
  brideInfo: WeddingContact;
  stylePreferences: StylePreferences;
  attireType: AttireType;
  accessories: string[];
  specialRequests?: string;
  members: WeddingMember[];
  status: 'planning' | 'measurements' | 'fittings' | 'completed';
  estimatedPartySize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeddingContact {
  name: string;
  email: string;
  phone: string;
  customerId?: string; // Link to main customer system
}

export interface StylePreferences {
  suitColor: 'black' | 'navy' | 'light_grey' | 'dark_grey' | 'tan' | 'hunter_green' | 'midnight_blue' | 'burgundy' | 'medium_grey';
  userRole: 'bride' | 'groom' | 'groomsman' | 'guest';
}

export interface AttireType {
  type: 'tuxedo' | 'suit' | 'modern_fit' | 'slim_fit';
  description: string;
}

export interface WeddingMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'groom' | 'groomsman' | 'best_man' | 'father_groom' | 'father_bride' | 'guest';
  measurementStatus: 'pending' | 'submitted' | 'completed';
  measurements?: WeddingMeasurements;
  suitMeasurements?: SuitMeasurements;
  shippingAddress?: ShippingAddress;
  specialNotes?: string;
  customerId?: string; // Link to main customer system
  addedAt: Date;
  needsShipping?: boolean;
  orderStatus?: 'pending' | 'ordered' | 'in_production' | 'ready' | 'shipped' | 'delivered';
}

export interface WeddingMeasurements {
  chest?: number;
  waist?: number;
  inseam?: number;
  neck?: number;
  sleeve?: number;
  height?: number;
  weight?: number;
  notes?: string;
  submittedAt: Date;
}

export interface SuitMeasurements {
  // Jacket measurements
  jacketChest?: number;
  jacketWaist?: number;
  jacketLength?: number;
  shoulderWidth?: number;
  sleeveLength?: number;
  
  // Pants measurements
  pantWaist?: number;
  pantInseam?: number;
  pantOutseam?: number;
  pantRise?: number;
  pantThigh?: number;
  pantKnee?: number;
  pantHem?: number;
  
  // Shirt measurements (if included)
  shirtNeck?: number;
  shirtChest?: number;
  shirtWaist?: number;
  shirtSleeveLength?: number;
  shirtShoulderWidth?: number;
  
  // Fit preferences
  jacketFit?: 'slim' | 'regular' | 'relaxed';
  pantFit?: 'slim' | 'regular' | 'relaxed';
  
  // Additional notes
  alterationNotes?: string;
  fittingDate?: Date;
  finalizedAt?: Date;
  takenBy?: string; // Staff member who took measurements
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface WeddingFormData {
  // Step 1: Style Preferences
  suitColor: StylePreferences['suitColor'];
  estimatedPartySize: number;
  weddingDate: string;
  userRole: StylePreferences['userRole'];
  
  // Step 2: Contact Information
  groomName: string;
  groomEmail: string;
  groomPhone: string;
  brideName: string;
  brideEmail: string;
  bridePhone: string;
  
  // Step 3: Attire & Accessories
  attireType: AttireType['type'];
  accessories: string[];
  specialRequests?: string;
}

// Wedding Analytics
export interface WeddingAnalytics {
  totalWeddings: number;
  upcomingWeddings: number;
  completedWeddings: number;
  totalMembers: number;
  pendingMeasurements: number;
  weddingsByMonth: Array<{
    month: string;
    count: number;
  }>;
  popularColors: Array<{
    color: string;
    count: number;
  }>;
  averagePartySize: number;
}

// Enhanced Product System Types
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  website?: string;
  
  // Business Details
  taxId?: string;
  terms?: string;
  leadTime?: number;
  minimumOrder?: number;
  
  // Performance Metrics
  rating?: number;
  onTimeDelivery?: number;
  qualityRating?: number;
  
  // Status
  isActive: boolean;
  isPreferred: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations
  products?: Product[];
  purchaseOrders?: PurchaseOrder[];
  _count?: {
    products: number;
    purchaseOrders: number;
  };
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  
  // Dates
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  
  // Additional Info
  notes?: string;
  shippingCost?: number;
  taxAmount?: number;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations
  supplier: Supplier;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string;
  variantId?: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  quantityReceived: number;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId?: string;
  variantId?: string;
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  userId?: string;
  createdAt: string;
  
  // Relations
  product?: Product;
  variant?: ProductVariant;
}

export interface StockAlert {
  id: string;
  productId?: string;
  variantId?: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'REORDER';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  resolvedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId?: string;
  customerName?: string;
  email?: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  isPublished: boolean;
  isHelpful: number;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  status?: string;
  search?: string;
  lowStock?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  published?: boolean;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  fabric?: string;
  season?: string;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeVariants?: boolean;
  includeImages?: boolean;
  includeSupplier?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  longDescription?: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  slug?: string;
  brand?: string;
  fabric?: string;
  pattern?: string;
  season?: string;
  occasions?: string[];
  styleAttributes?: string[];
  care?: string;
  trackStock?: boolean;
  totalStock?: number;
  availableStock?: number;
  minimumStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  supplierId?: string;
  supplierSku?: string;
  leadTime?: number;
}

export interface CreateVariantRequest {
  name: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  material?: string;
  fit?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  minimumStock?: number;
  reorderPoint?: number;
  weight?: number;
  isActive?: boolean;
  position?: number;
}

export interface StockAdjustmentRequest {
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'TRANSFER';
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface ProductDashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalVariants: number;
  featuredProducts: number;
  recentlyAdded: number;
  totalInventoryValue: number;
  stockHealth: {
    healthy: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface SupplierPerformance {
  supplier: {
    name: string;
    rating?: number;
    onTimeDelivery?: number;
    qualityRating?: number;
  };
  performance: {
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    totalSpent: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
  };
}

// Legacy Product Interface (for backward compatibility)
export interface LegacyProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  sku: string;
  inStock: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Inventory Management Types
export interface CreateSupplierRequest {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  website?: string;
  taxId?: string;
  terms?: string;
  leadTime?: number;
  minimumOrder?: number;
  rating?: number;
  onTimeDelivery?: number;
  qualityRating?: number;
  isActive?: boolean;
  isPreferred?: boolean;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  orderNumber?: string;
  totalAmount: number;
  currency?: string;
  expectedDate?: string;
  notes?: string;
  shippingCost?: number;
  taxAmount?: number;
  items: {
    productId?: string;
    variantId?: string;
    description: string;
    quantity: number;
    unitCost: number;
  }[];
}

// 🔥 Suits API Integration Types
export interface SuitProduct {
  id: number; // API returns number, not string
  name: string;
  slug: string;
  category: 'business' | 'wedding' | 'prom' | 'casual' | 'formal'; // Updated to match API
  base_color: string; // Added from API
  fit_type: string; // Added from API
  is_tuxedo: boolean; // Added from API
  season_tags: string[]; // Added from API
  target_events: string[]; // Added from API
  prom_trending: boolean;
  base_price_2pc: string; // API returns as string
  base_price_3pc: string; // API returns as string
  rental_available: boolean; // Added from API
  
  // Optional fields that might not be in all responses
  description?: string;
  fabric?: string;
  pattern?: string;
  color?: string;
  
  // Legacy fields for backward compatibility
  stock_2pc?: number;
  stock_3pc?: number;
  is_available?: boolean;
  wedding_popular?: boolean;
  business_recommended?: boolean;
  rental_price_2pc?: number;
  rental_price_3pc?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SuitImages {
  suit_id: string;
  suit_slug: string;
  images: {
    main?: string;
    front?: string;
    back?: string;
    side?: string;
    detail?: string;
    lifestyle?: string;
    [key: string]: string | undefined;
  };
}

export interface SuitWithImages extends SuitProduct {
  images?: SuitImages['images'];
}

export interface SuitsAPIResponse {
  success: boolean;
  suits: SuitProduct[];
  count: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SuitDetailAPIResponse {
  success: boolean;
  suit: SuitProduct;
}

export interface SuitImagesAPIResponse {
  success: boolean;
  images: SuitImages['images'];
  suit_slug: string;
}

export interface SuitsWithImagesAPIResponse {
  success: boolean;
  suits: SuitWithImages[];
  count: number;
}

export interface PromSuitsAPIResponse {
  success: boolean;
  prom_suits: SuitWithImages[];
  count: number;
}

export interface WeddingSuitsAPIResponse {
  success: boolean;
  wedding_suits: SuitWithImages[];
  count: number;
}

// API Client Filters
export interface SuitFilters {
  category?: string;
  price_min?: number;
  price_max?: number;
  color?: string;
  fabric?: string;
  available_only?: boolean;
  prom_trending?: boolean;
  wedding_popular?: boolean;
  business_recommended?: boolean;
  page?: number;
  limit?: number;
}

// Enhanced Product Types for Integration
export interface KCTProduct extends SmartProduct {
  // Add suits-specific fields for integration
  suit_data?: SuitProduct;
  source: 'local' | 'suits_api' | 'ties_api' | 'vendor_api';
  external_id?: string;
  api_url?: string;
}

export interface ProductCatalogResponse {
  suits: SuitWithImages[];
  ties: any[]; // Will be defined when ties service is ready
  total_products: number;
  suits_count: number;
  ties_count: number;
} 