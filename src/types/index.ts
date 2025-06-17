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
  sku: string;
  category: 'suits' | 'tuxedos' | 'shirts' | 'accessories';
  description?: string | null;
  price: number;
  fabric?: string | null;
  colors: string;
  sizes: string;
  stock: number;
  minimumStock: number;
  images: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
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