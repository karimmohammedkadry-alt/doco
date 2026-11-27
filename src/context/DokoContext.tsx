import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { STATIC_MENU } from '../data/static-menu';
import type {
  DokoState,
  InventoryItem,
  MenuItem,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  ReportsSummary,
  Reservation,
  RestaurantTable,
  RoleType,
  UserSession,
} from '../types/doko';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  variant: 'success' | 'error' | 'info';
}

interface DokoContextValue {
  state: DokoState | null;
  loading: boolean;
  session: UserSession;
  viewMode: 'website' | 'workspace';
  setViewMode: (mode: 'website' | 'workspace') => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  updateCartQty: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  preferredOrderType: OrderType;
  setPreferredOrderType: (type: OrderType) => void;
  preferredTableNumber: number;
  setPreferredTableNumber: (tableNum: number) => void;
  selectedDishDetail: MenuItem | null;
  setSelectedDishDetail: (dish: MenuItem | null) => void;
  selectedOrderDetailId: string | null;
  setSelectedOrderDetailId: (orderId: string | null) => void;
  lastPlacedOrderId: string | null;
  setLastPlacedOrderId: (id: string | null) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, variant?: ToastMessage['variant']) => void;
  switchRole: (payload: {
    role: RoleType;
    pin?: string;
    displayName?: string;
    phone?: string;
    quickDemo?: boolean;
  }) => Promise<boolean>;
  logoutToGuest: () => void;
  createOrder: (payload: {
    type: OrderType;
    items: { menuItemId: string; quantity: number; notes?: string }[];
    paymentMethod: PaymentMethod;
    tableNumber?: number;
    customerName: string;
    customerPhone?: string;
    address?: string;
    discount?: number;
  }) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  toggleOrderItemPrepared: (orderId: string, menuItemId: string) => Promise<void>;
  payOrder: (orderId: string, paymentMethod: PaymentMethod, discount?: number) => Promise<void>;
  adjustInventory: (itemId: string, delta: number, reason: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastRestockedAt'>) => Promise<void>;
  updateMenuItem: (
    menuId: string,
    patch: Partial<Pick<MenuItem, 'price' | 'available' | 'featured' | 'name' | 'description'>>
  ) => Promise<void>;
  addMenuItem: (dish: Omit<MenuItem, 'id'>) => Promise<void>;
  updateTableStatus: (
    tableId: string,
    status: RestaurantTable['status'],
    guestName?: string
  ) => Promise<void>;
  createReservation: (
    reservation: Omit<Reservation, 'id' | 'status' | 'createdAt'>
  ) => Promise<Reservation | null>;
  updateReservation: (
    resId: string,
    patch: { status?: Reservation['status']; tableNumber?: number }
  ) => Promise<void>;
  fetchReports: (range: 'today' | '7d' | 'all', channel: 'all' | OrderType) => Promise<ReportsSummary | null>;
}

const SESSION_STORAGE_KEY = 'doko_optional_session_v1';
const LAST_ORDER_KEY = 'doko_last_order_id_v1';

const DEFAULT_GUEST_SESSION: UserSession = {
  role: 'customer',
  displayName: 'زائر دوكو',
  isGuest: true,
  loggedInAt: new Date().toISOString(),
};

const DokoContext = createContext<DokoContextValue | null>(null);

export const DokoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DokoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as UserSession;
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_SESSION;
  });

  const [viewMode, setViewMode] = useState<'website' | 'workspace'>(() =>
    session.role !== 'customer' ? 'workspace' : 'website'
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [preferredOrderType, setPreferredOrderType] = useState<OrderType>('dine_in');
  const [preferredTableNumber, setPreferredTableNumber] = useState<number>(2);
  const [selectedDishDetail, setSelectedDishDetail] = useState<MenuItem | null>(null);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<string | null>(null);

  const [lastPlacedOrderId, setLastPlacedOrderIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_ORDER_KEY);
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((title: string, variant: ToastMessage['variant'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const setLastPlacedOrderId = useCallback((id: string | null) => {
    setLastPlacedOrderIdState(id);
    try {
      if (id) localStorage.setItem(LAST_ORDER_KEY, id);
      else localStorage.removeItem(LAST_ORDER_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/state')
      .then((r) => {
        if (!r.ok) throw new Error(`State API failed: ${r.status}`);
        return r.json();
      })
      .then((data: DokoState) => {
        if (active) {
          // Keep the customer catalog visible if persisted server state is empty.
          setState({
            ...data,
            menu: Array.isArray(data.menu) && data.menu.length > 0 ? data.menu : STATIC_MENU,
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          // Public catalog remains visible even while the server API is unavailable.
          setState({
            menu: STATIC_MENU,
            inventory: [],
            stockMovements: [],
            orders: [],
            tables: [],
            reservations: [],
            auditLogs: [],
            nextOrderNumber: 1,
          });
          setLoading(false);
        }
      });

    const source = new EventSource('/api/events');
    source.addEventListener('state', (evt) => {
      try {
        const next = JSON.parse((evt as MessageEvent).data) as DokoState;
        setState(next);
        setLoading(false);
      } catch {
        // ignore parse error
      }
    });

    return () => {
      active = false;
      source.close();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }, [session]);

  const addToCart = useCallback(
    (menuItem: MenuItem, quantity = 1, notes?: string) => {
      if (!menuItem.available) {
        pushToast('عذراً، هذا الطبق غير متوفر حالياً', 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((c) => c.menuItem.id === menuItem.id);
        if (existing) {
          return prev.map((c) =>
            c.menuItem.id === menuItem.id
              ? { ...c, quantity: c.quantity + quantity, notes: notes ?? c.notes }
              : c
          );
        }
        return [...prev, { menuItem, quantity, notes }];
      });
      pushToast(`تمت إضافة "${menuItem.name}" إلى السلة`, 'success');
    },
    [pushToast]
  );

  const updateCartQty = useCallback((menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === menuItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const switchRole = useCallback(
    async (payload: {
      role: RoleType;
      pin?: string;
      displayName?: string;
      phone?: string;
      quickDemo?: boolean;
    }) => {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast(data.error || 'تعذر تسجيل الدخول', 'error');
        return false;
      }
      setSession(data.session);
      if (payload.role === 'customer') {
        setViewMode('website');
      } else {
        setViewMode('workspace');
      }
      setAuthModalOpen(false);
      pushToast(`تم التبديل إلى صلاحية: ${data.session.displayName}`, 'success');
      return true;
    },
    [pushToast]
  );

  const logoutToGuest = useCallback(() => {
    setSession({
      ...DEFAULT_GUEST_SESSION,
      loggedInAt: new Date().toISOString(),
    });
    setViewMode('website');
    pushToast('أنت تتصفح الآن كضيف بدون تسجيل دخول', 'info');
  }, [pushToast]);

  const createOrder: DokoContextValue['createOrder'] = useCallback(
    async (payload) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          createdByRole: session.role,
          createdByName: session.displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast(data.error || 'فشل إرسال الطلب', 'error');
        return null;
      }
      const order = data.order as Order;
      setLastPlacedOrderId(order.id);
      pushToast(`تم تأكيد الطلب #${order.orderNumber} وإرساله للمطبخ`, 'success');
      return order;
    },
    [pushToast, session.displayName, session.role, setLastPlacedOrderId]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        pushToast(d.error || 'تعذر تحديث الحالة', 'error');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const toggleOrderItemPrepared = useCallback(
    async (orderId: string, menuItemId: string) => {
      await fetch(`/api/orders/${orderId}/item-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
    },
    [session.displayName, session.role]
  );

  const payOrder = useCallback(
    async (orderId: string, paymentMethod: PaymentMethod, discount = 0) => {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          discount,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تم تحصيل الفاتورة وإغلاق الطلب بنجاح', 'success');
      } else {
        const d = await res.json();
        pushToast(d.error || 'تعذر التحصيل', 'error');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const adjustInventory = useCallback(
    async (itemId: string, delta: number, reason: string) => {
      const res = await fetch(`/api/inventory/${itemId}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta,
          reason,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تم تحديث رصيد المخزون لحظياً', 'success');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const addInventoryItem = useCallback(
    async (item: Omit<InventoryItem, 'id' | 'lastRestockedAt'>) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تمت إضافة الصنف الجديد إلى المخزون', 'success');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const updateMenuItem = useCallback(
    async (
      menuId: string,
      patch: Partial<Pick<MenuItem, 'price' | 'available' | 'featured' | 'name' | 'description'>>
    ) => {
      const res = await fetch(`/api/menu/${menuId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patch,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تم تحديث بيانات الصنف في المنيو', 'success');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const addMenuItem = useCallback(
    async (dish: Omit<MenuItem, 'id'>) => {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dish,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تمت إضافة الطبق الجديد إلى المنيو', 'success');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const updateTableStatus = useCallback(
    async (tableId: string, status: RestaurantTable['status'], guestName?: string) => {
      await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          guestName,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
    },
    [session.displayName, session.role]
  );

  const createReservation = useCallback(
    async (reservation: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (!res.ok) {
        pushToast('تعذر إتمام الحجز', 'error');
        return null;
      }
      const data = await res.json();
      pushToast('تم تسجيل طلب حجز الطاولة بنجاح', 'success');
      return data.reservation as Reservation;
    },
    [pushToast, session.displayName, session.role]
  );

  const updateReservation = useCallback(
    async (resId: string, patch: { status?: Reservation['status']; tableNumber?: number }) => {
      const res = await fetch(`/api/reservations/${resId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patch,
          actorRole: session.role,
          actorName: session.displayName,
        }),
      });
      if (res.ok) {
        pushToast('تم تحديث حالة الحجز', 'success');
      }
    },
    [pushToast, session.displayName, session.role]
  );

  const fetchReports = useCallback(
    async (range: 'today' | '7d' | 'all', channel: 'all' | OrderType) => {
      try {
        const res = await fetch(`/api/reports?range=${range}&channel=${channel}`);
        if (!res.ok) return null;
        return (await res.json()) as ReportsSummary;
      } catch {
        return null;
      }
    },
    []
  );

  return (
    <DokoContext.Provider
      value={{
        state,
        loading,
        session,
        viewMode,
        setViewMode,
        authModalOpen,
        setAuthModalOpen,
        cartOpen,
        setCartOpen,
        cart,
        addToCart,
        updateCartQty,
        clearCart,
        preferredOrderType,
        setPreferredOrderType,
        preferredTableNumber,
        setPreferredTableNumber,
        selectedDishDetail,
        setSelectedDishDetail,
        selectedOrderDetailId,
        setSelectedOrderDetailId,
        lastPlacedOrderId,
        setLastPlacedOrderId,
        toasts,
        pushToast,
        switchRole,
        logoutToGuest,
        createOrder,
        updateOrderStatus,
        toggleOrderItemPrepared,
        payOrder,
        adjustInventory,
        addInventoryItem,
        updateMenuItem,
        addMenuItem,
        updateTableStatus,
        createReservation,
        updateReservation,
        fetchReports,
      }}
    >
      {children}
    </DokoContext.Provider>
  );
};

export function useDoko() {
  const ctx = useContext(DokoContext);
  if (!ctx) throw new Error('useDoko must be used inside DokoProvider');
  return ctx;
}
