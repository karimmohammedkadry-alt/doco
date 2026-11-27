export type RoleType =
  | 'customer'
  | 'manager'
  | 'cashier'
  | 'chef'
  | 'waiter'
  | 'reception';

export interface RoleDefinition {
  id: RoleType;
  label: string;
  subtitle: string;
  pin?: string;
  permissions: string[];
}

export interface UserSession {
  role: RoleType;
  displayName: string;
  phone?: string;
  isGuest: boolean;
  loggedInAt: string;
}

export interface RecipeIngredient {
  inventoryId: string;
  amount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'لحوم' | 'مخبوزات' | 'أجبان وصلصات' | 'خضروات وباستا' | 'مشروبات وحلويات';
  unit: string;
  quantity: number;
  minThreshold: number;
  maxCapacity: number;
  costPerUnit: number;
  lastRestockedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  actorRole: RoleType;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category:
    | 'البرجر واللحوم'
    | 'الباستا'
    | 'البيتزا'
    | 'المقبلات'
    | 'الحلويات'
    | 'المشروبات';
  price: number;
  image?: string;
  accentKind?: 'burger' | 'steak' | 'pasta' | 'pizza' | 'salmon' | 'chicken' | 'dessert' | 'drink' | 'salad';
  prepMinutes: number;
  calories: number;
  available: boolean;
  featured?: boolean;
  spicyLevel?: 0 | 1 | 2;
  recipe: RecipeIngredient[];
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'unpaid';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  prepared: boolean;
}

export interface Order {
  id: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  estimatedCost: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid';
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  address?: string;
  createdByRole: RoleType;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing';

export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  zone: 'الصالة الرئيسية' | 'التراس الخارجي' | 'قسم العائلات';
  status: TableStatus;
  currentOrderId?: string;
  guestName?: string;
}

export type ReservationStatus = 'confirmed' | 'seated' | 'waiting' | 'cancelled';

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  tableNumber?: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  role: RoleType;
  actorName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DokoState {
  menu: MenuItem[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  orders: Order[];
  tables: RestaurantTable[];
  reservations: Reservation[];
  auditLogs: AuditLogEntry[];
  nextOrderNumber: number;
}

export interface ReportsSummary {
  range: 'today' | '7d' | 'all';
  channel: 'all' | OrderType;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  grossRevenue: number;
  totalCost: number;
  netProfit: number;
  avgOrderValue: number;
  completionRate: number;
  byChannel: {
    type: OrderType;
    label: string;
    count: number;
    revenue: number;
  }[];
  byPayment: {
    method: PaymentMethod;
    label: string;
    count: number;
    revenue: number;
  }[];
  hourlyTrend: {
    hourLabel: string;
    orders: number;
    revenue: number;
  }[];
  dailyTrend: {
    dateLabel: string;
    orders: number;
    revenue: number;
    profit: number;
  }[];
  topDishes: {
    menuItemId: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
  byRole: {
    role: RoleType;
    label: string;
    ordersCount: number;
    revenue: number;
  }[];
  lowStockCount: number;
  totalInventoryValue: number;
  recentOrders: Order[];
}

export const ROLES: RoleDefinition[] = [
  {
    id: 'customer',
    label: 'عميل (زائر / عضو)',
    subtitle: 'تصفح المنيو، الطلب المباشر، الحجز، وتتبع الطلب بدون تسجيل إجباري',
    permissions: [
      'تصفح المنيو الكامل والأسعار',
      'إتمام الطلبات (صالة / تيك أواي / دليفري)',
      'حجز طاولة فوري وتتبع حالة الطلب لحظياً',
    ],
  },
  {
    id: 'manager',
    label: 'المدير العام',
    subtitle: 'التحكم الكامل في التقارير المالية، المخزون اللحظي، المنيو، والصلاحيات',
    pin: '1111',
    permissions: [
      'تقارير الطلبات المفصلة والأرباح وتصدير CSV',
      'إدارة المخزون اللحظي والتوريد والهدر',
      'تعديل أسعار المنيو وتوافر الأصناف والصلاحيات',
    ],
  },
  {
    id: 'cashier',
    label: 'الكاشير (POS)',
    subtitle: 'نقطة البيع السريعة، تحصيل المدفوعات، خصومات الفواتير، وإغلاق الطاولات',
    pin: '2222',
    permissions: [
      'إنشاء طلبات سريعة (صالة / تيك أواي / دليفري)',
      'تحصيل المدفوعات (كاش / بطاقة / محفظة)',
      'إصدار وطباعة الفواتير وإغلاق حساب الطاولات',
    ],
  },
  {
    id: 'chef',
    label: 'الشيف (شاشة المطبخ)',
    subtitle: 'استقبال التذاكر لحظياً، متابعة التحضير، وتنبيهات نقص المكونات',
    pin: '3333',
    permissions: [
      'استقبال طلبات المطبخ بالصوت والتوقيت اللحظي',
      'تحديث حالة كل طبق (تحضير -> جاهز للتقديم)',
      'مراقبة حالة المخزون الحرجة أثناء التشغيل',
    ],
  },
  {
    id: 'waiter',
    label: 'الجارسون (الصالة)',
    subtitle: 'إدارة الطاولات، تسجيل طلبات الضيوف، واستلام الأطباق الجاهزة',
    pin: '4444',
    permissions: [
      'خريطة الطاولات الحية وحالات الإشغال',
      'فتح طلبات جديدة على الطاولات وإرسالها للمطبخ',
      'استلام تنبيهات الأطباق الجاهزة وطلب الفاتورة',
    ],
  },
  {
    id: 'reception',
    label: 'الريسبشن (الاستقبال)',
    subtitle: 'إدارة حجوزات الطاولات، قائمة الانتظار، وتسكين الضيوف',
    pin: '5555',
    permissions: [
      'تأكيد وإلغاء حجوزات الموقع والهاتف',
      'تسكين الضيوف على الطاولات المتاحة لحظياً',
      'إدارة قائمة الانتظار وسعة الصالة والتراس',
    ],
  },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز للتقديم',
  served: 'تم التقديم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: 'صالة',
  takeaway: 'تيك أواي',
  delivery: 'دليفري',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقدي (كاش)',
  card: 'بطاقة بنكية',
  wallet: 'محفظة إلكترونية',
  unpaid: 'غير مدفوع',
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  available: 'متاحة',
  occupied: 'مشغولة',
  reserved: 'محجوزة',
  billing: 'بانتظار الحساب',
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: 'مؤكد',
  seated: 'تم التسكين',
  waiting: 'قائمة الانتظار',
  cancelled: 'ملغي',
};
