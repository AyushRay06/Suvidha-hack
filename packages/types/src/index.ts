// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  phone: string;
  otp?: string;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  language?: 'en' | 'hi';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: 'CITIZEN' | 'ADMIN' | 'STAFF';
  language: string;
  isVerified: boolean;
}

// Service types
export type ServiceType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';

export interface ServiceConnection {
  id: string;
  serviceType: ServiceType;
  connectionNo: string;
  meterNo?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISCONNECTED';
  address: string;
  sanctionedLoad?: number;
  lastReading?: number;
  lastReadingDate?: string;
}

// Bill types
export interface Bill {
  id: string;
  connectionId: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  periodFrom: string;
  periodTo: string;
  unitsConsumed?: number;
  amount: number;
  lateFee: number;
  totalAmount: number;
  amountPaid: number;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  serviceType: ServiceType;
}

// Payment types
export interface PaymentRequest {
  billId: string;
  amount: number;
  method: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'CASH';
}

export interface PaymentResponse {
  paymentId: string;
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  receiptNo?: string;
  receiptUrl?: string;
}

// Grievance types
export interface GrievanceRequest {
  serviceType: ServiceType;
  connectionId?: string;
  category: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface Grievance {
  id: string;
  ticketNo: string;
  serviceType: ServiceType;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface GrievanceTimeline {
  id: string;
  action: string;
  description: string;
  actionBy: string;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  serviceType: ServiceType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  affectedArea?: string;
  startsAt: string;
  endsAt?: string;
}

// Kiosk types
export interface KioskInfo {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
}

// i18n types
export type Language = 'en' | 'hi';

export interface TranslatedContent {
  en: string;
  hi: string;
}

// Grievance categories by service type
export const GRIEVANCE_CATEGORIES: Record<ServiceType, string[]> = {
  ELECTRICITY: [
    'Billing Issue',
    'Power Outage',
    'Meter Problem',
    'New Connection',
    'Load Enhancement',
    'Voltage Fluctuation',
    'Other',
  ],
  GAS: [
    'Billing Issue',
    'Gas Leakage',
    'Meter Problem',
    'New Connection',
    'Cylinder Delivery',
    'Pressure Issue',
    'Other',
  ],
  WATER: [
    'Billing Issue',
    'No Water Supply',
    'Water Quality',
    'Pipe Leakage',
    'New Connection',
    'Meter Problem',
    'Other',
  ],
  MUNICIPAL: [
    'Waste Collection',
    'Road Damage',
    'Streetlight Issue',
    'Drainage Block',
    'Property Tax',
    'Birth/Death Certificate',
    'Other',
  ],
};
