export type Size = 'S' | 'M' | 'L' | 'XL' | 'Free Size';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export type AvailabilityMode = 'Made to Order' | 'Available to Order' | 'Unavailable';

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  createdAt?: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  details: string[];
  fabricCare?: string[];
  shippingInfo?: string;
  leadTime: string; // e.g. "5-7 business days", "7-10 business days"
  category: string;
  collection: string;
  rating: number;
  reviewCount: number;
  images: string[];
  badges?: ('BESTSELLER' | 'NEW' | 'LIMITED')[];
  sizes: Size[];
  colors: ProductColor[];
  availabilityMode: AvailabilityMode;
  fabric: 'Velvet' | 'Cotton' | 'Silk' | 'Linen';
  embroideryStyle: 'Floral' | 'Nature' | 'Traditional' | 'Minimal';
  occasion: 'Everyday' | 'Festive' | 'Wedding' | 'Party';
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  image: string;
  description?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  size: Size;
  color: ProductColor;
  quantity: number;
  variantId?: string;
}

export interface OrderItem {
  product: Product;
  size: Size;
  color: ProductColor;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderTimelineStep {
  title: string;
  date?: string;
  completed: boolean;
  current?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
  paymentMethod: {
    type: 'Razorpay' | 'Card' | 'UPI' | 'COD';
    cardLast4?: string;
    status: 'Paid' | 'Pending' | 'Failed';
  };
  timeline: OrderTimelineStep[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  category: 'Orders' | 'Offers' | 'New Arrivals' | 'Account' | 'Updates';
  read: boolean;
  actionText?: string;
  actionUrl?: string;
  imageUrl?: string;
}
