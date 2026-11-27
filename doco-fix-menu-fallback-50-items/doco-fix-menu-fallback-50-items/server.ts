import express from 'express';
import { createServer as createViteServer } from 'vite';
import { dokoStore } from './server/store.ts';
import type { OrderStatus, OrderType, PaymentMethod, RoleType } from './src/types/doko.ts';
import { ROLES } from './src/types/doko.ts';

const app = express();
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'doko-restaurant' });
});

// Initial full state
app.get('/api/state', (_req, res) => {
  res.json(dokoStore.getState());
});

// Real-time Server-Sent Events stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`event: state\ndata: ${JSON.stringify(dokoStore.getState())}\n\n`);

  const unsubscribe = dokoStore.subscribe((nextState) => {
    res.write(`event: state\ndata: ${JSON.stringify(nextState)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// Optional auth / role switcher
app.post('/api/auth/session', (req, res) => {
  const { role, pin, displayName, phone, quickDemo } = req.body as {
    role: RoleType;
    pin?: string;
    displayName?: string;
    phone?: string;
    quickDemo?: boolean;
  };

  const def = ROLES.find((r) => r.id === role);
  if (!def) {
    res.status(400).json({ error: 'الصلاحية المطلوبة غير صالحة.' });
    return;
  }

  if (role !== 'customer' && !quickDemo) {
    if (!pin || pin !== def.pin) {
      res.status(401).json({ error: 'رمز الدخول (PIN) غير صحيح لهذه الصلاحية.' });
      return;
    }
  }

  res.json({
    session: {
      role,
      displayName: displayName?.trim() || def.label,
      phone: phone?.trim(),
      isGuest: role === 'customer' && !displayName?.trim(),
      loggedInAt: new Date().toISOString(),
    },
  });
});

// Create Order (triggers automatic real-time inventory deduction)
app.post('/api/orders', (req, res) => {
  const result = dokoStore.createOrder(req.body);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.status(201).json({ order: result.order });
});

// Update Order Status (Chef / Waiter / Cashier / Manager)
app.patch('/api/orders/:id/status', (req, res) => {
  const { status, actorRole, actorName } = req.body as {
    status: OrderStatus;
    actorRole: RoleType;
    actorName: string;
  };
  const result = dokoStore.updateOrderStatus(
    req.params.id,
    status,
    actorRole || 'manager',
    actorName || 'طاقم دوكو'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ order: result.order });
});

// Toggle single dish preparation in KDS
app.patch('/api/orders/:id/item-toggle', (req, res) => {
  const { menuItemId, actorRole, actorName } = req.body as {
    menuItemId: string;
    actorRole: RoleType;
    actorName: string;
  };
  const result = dokoStore.toggleOrderItemPrepared(
    req.params.id,
    menuItemId,
    actorRole || 'chef',
    actorName || 'الشيف'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ order: result.order });
});

// Settle Payment (Cashier / Manager)
app.patch('/api/orders/:id/pay', (req, res) => {
  const { paymentMethod, discount, actorRole, actorName } = req.body as {
    paymentMethod: PaymentMethod;
    discount: number;
    actorRole: RoleType;
    actorName: string;
  };
  const result = dokoStore.payOrder(
    req.params.id,
    paymentMethod,
    discount || 0,
    actorRole || 'cashier',
    actorName || 'الكاشير'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ order: result.order });
});

// Real-Time Inventory Adjust & Create
app.patch('/api/inventory/:id/adjust', (req, res) => {
  const { delta, reason, actorRole, actorName } = req.body as {
    delta: number;
    reason: string;
    actorRole: RoleType;
    actorName: string;
  };
  const result = dokoStore.adjustInventory(
    req.params.id,
    Number(delta),
    reason,
    actorRole || 'manager',
    actorName || 'المدير'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ item: result.item });
});

app.post('/api/inventory', (req, res) => {
  const { item, actorRole, actorName } = req.body;
  const created = dokoStore.addInventoryItem(
    item,
    actorRole || 'manager',
    actorName || 'المدير'
  );
  res.status(201).json({ item: created });
});

// Menu Management
app.patch('/api/menu/:id', (req, res) => {
  const { patch, actorRole, actorName } = req.body;
  const result = dokoStore.updateMenuItem(
    req.params.id,
    patch,
    actorRole || 'manager',
    actorName || 'المدير'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ item: result.item });
});

app.post('/api/menu', (req, res) => {
  const { dish, actorRole, actorName } = req.body;
  const created = dokoStore.addMenuItem(
    dish,
    actorRole || 'manager',
    actorName || 'المدير'
  );
  res.status(201).json({ item: created });
});

// Tables & Reservations
app.patch('/api/tables/:id', (req, res) => {
  const { status, guestName, actorRole, actorName } = req.body;
  const result = dokoStore.updateTableStatus(
    req.params.id,
    status,
    guestName,
    actorRole || 'waiter',
    actorName || 'طاقم الصالة'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ table: result.table });
});

app.post('/api/reservations', (req, res) => {
  const { reservation, actorRole, actorName } = req.body;
  const created = dokoStore.createReservation(
    reservation,
    actorRole || 'customer',
    actorName || reservation?.customerName || 'ضيف'
  );
  res.status(201).json({ reservation: created });
});

app.patch('/api/reservations/:id', (req, res) => {
  const { status, tableNumber, actorRole, actorName } = req.body;
  const result = dokoStore.updateReservation(
    req.params.id,
    { status, tableNumber },
    actorRole || 'reception',
    actorName || 'الريسبشن'
  );
  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ reservation: result.reservation });
});

// Detailed Reports
app.get('/api/reports', (req, res) => {
  const range = (req.query.range as 'today' | '7d' | 'all') || 'all';
  const channel = (req.query.channel as 'all' | OrderType) || 'all';
  res.json(dokoStore.getReports(range, channel));
});


export default app;

// Local development only. Vercel imports the Express app as a serverless function.
if (process.env.NODE_ENV !== 'production') {
  const startDevServer = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    const port = Number(process.env.PORT || 3000);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Doko Restaurant Server running on http://localhost:${port}`);
    });
  };
  startDevServer();
}
