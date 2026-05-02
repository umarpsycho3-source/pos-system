import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'backend', 'db.json');
const app = express();
const PORT = Number(process.env.PORT || 4000);
function normalizeEnv(value) {
  const v = String(value || '').trim();
  // If setx was called with quotes, sometimes quotes get persisted; strip them.
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).trim();
  }
  return v;
}

const JWT_SECRET = normalizeEnv(process.env.JWT_SECRET) || 'retail-pos-super-secret-change-this';
const MASTER_KEY = normalizeEnv(process.env.MASTER_KEY) || 'retail-admin-key-2026';
const ADMIN_EMAIL = normalizeEnv(process.env.ADMIN_EMAIL);
const ADMIN_PASSWORD = normalizeEnv(process.env.ADMIN_PASSWORD);
const ADMIN_PASSWORD_HASH = normalizeEnv(process.env.ADMIN_PASSWORD_HASH);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health/db', (_req, res) => {
  // This version uses file-based storage (backend/db.json)
  res.json({ ok: true, engine: 'json-file' });
});

// Serve the built frontend in production (Render single-service deploy)
const distPath = path.join(__dirname, 'dist');
console.log('[static]', { distPath, distExists: fs.existsSync(distPath), indexExists: fs.existsSync(path.join(distPath, 'index.html')) });
// Serve whenever a build exists (so `npm start` works locally even if NODE_ENV isn't set)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express v5 + path-to-regexp doesn't accept "*" as a route path.
  // Use a catch-all middleware instead for SPA routing.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    // Using `root` avoids Windows absolute-path edge cases in some Express/send versions.
    res.sendFile('index.html', { root: distPath });
  });
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function defaultDb() {
  return {
    shops: [
      {
        id: 'shop-demo',
        code: 'DEMO',
        name: 'My Retail Shop',
        pinHash: bcrypt.hashSync('1234', 10),
        status: 'active',
      },
    ],
    records: {
      'shop-demo': {
        products: [],
        customers: [],
        employees: [],
        sales: [],
        creditSales: [],
        settings: { currency: 'LKR ', shopName: 'My Retail Shop' },
      },
    },
  };
}

function ensureDbShape(raw) {
  if (raw.shops && raw.records) return raw;

  const migrated = defaultDb();
  migrated.records['shop-demo'] = {
    products: raw.products || [],
    customers: raw.customers || [],
    employees: raw.employees || [],
    sales: raw.sales || [],
    creditSales: raw.creditSales || [],
    settings: raw.settings || { currency: 'LKR ', shopName: 'My Retail Shop' },
  };
  return migrated;
}

function readDb() {
  if (!fs.existsSync(dbPath)) {
    const seed = defaultDb();
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const shaped = ensureDbShape(parsed);
  if (JSON.stringify(parsed) !== JSON.stringify(shaped)) writeDb(shaped);
  return shaped;
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function getShopRecords(db, shopId) {
  if (!db.records[shopId]) {
    db.records[shopId] = {
      products: [],
      customers: [],
      employees: [],
      sales: [],
      creditSales: [],
      settings: { currency: 'LKR ', shopName: 'My Retail Shop' },
    };
  }
  return db.records[shopId];
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const shopId = req.headers['x-shop-id'];

  if (!token || !shopId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.shopId !== shopId) return res.status(403).json({ message: 'Shop mismatch' });
    req.shopId = payload.shopId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function adminRequired(req, res, next) {
  const key = req.headers['x-master-key'];
  if (key && key === MASTER_KEY) return next();

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.kind !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.admin = { email: payload.email || 'admin' };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { shopCode, pin } = req.body || {};
  if (!shopCode || !pin) return res.status(400).json({ message: 'shopCode and pin required' });

  const db = readDb();
  const shop = db.shops.find((s) => s.code.toLowerCase() === String(shopCode).toLowerCase());
  if (!shop || shop.status !== 'active') return res.status(401).json({ message: 'Invalid credentials' });

  const ok = bcrypt.compareSync(String(pin), shop.pinHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '30d' });
  const settings = getShopRecords(db, shop.id).settings || { currency: 'LKR ', shopName: shop.name };

  res.json({
    token,
    shopId: shop.id,
    shopCode: shop.code,
    shopName: settings.shopName || shop.name,
    currency: settings.currency || 'LKR ',
  });
});

app.post('/api/admin/shops', adminRequired, (req, res) => {

  const { shopCode, shopName, pin } = req.body || {};
  if (!shopCode || !shopName || !pin) return res.status(400).json({ message: 'shopCode, shopName, pin required' });

  const db = readDb();
  const exists = db.shops.some((s) => s.code.toLowerCase() === String(shopCode).toLowerCase());
  if (exists) return res.status(409).json({ message: 'Shop code already exists' });

  const shopId = uid();
  const shop = {
    id: shopId,
    code: String(shopCode).toUpperCase(),
    name: shopName,
    pinHash: bcrypt.hashSync(String(pin), 10),
    status: 'active',
  };

  db.shops.unshift(shop);
  db.records[shopId] = {
    products: [],
    customers: [],
    employees: [],
    sales: [],
    creditSales: [],
    settings: { currency: 'LKR ', shopName },
  };
  writeDb(db);

  res.status(201).json({ id: shop.id, code: shop.code, name: shop.name, status: shop.status });
});

app.get('/api/admin/shops', adminRequired, (req, res) => {
  const db = readDb();
  res.json(db.shops.map((s) => ({ id: s.id, code: s.code, name: s.name, status: s.status })));
});

app.post('/api/admin/login', (req, res) => {
  const { email, password, masterKey } = req.body || {};
  const loginEmail = normalizeEnv(email);
  const loginPassword = normalizeEnv(password);
  const loginMasterKey = normalizeEnv(masterKey);

  // Allow master key bootstrap
  if (loginMasterKey && loginMasterKey === MASTER_KEY) {
    const token = jwt.sign({ kind: 'admin', email: 'master' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }

  if (!ADMIN_EMAIL) return res.status(400).json({ message: 'Admin is not configured' });
  if (loginEmail.toLowerCase() !== String(ADMIN_EMAIL).toLowerCase()) return res.status(401).json({ message: 'Invalid credentials' });

  const pass = loginPassword;
  let ok = false;
  if (ADMIN_PASSWORD_HASH) ok = bcrypt.compareSync(pass, ADMIN_PASSWORD_HASH);
  else if (ADMIN_PASSWORD) ok = pass === String(ADMIN_PASSWORD);

  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ kind: 'admin', email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token });
});

function listRoute(key, routeKey = key) {
  app.get(`/api/${routeKey}`, authRequired, (req, res) => {
    const db = readDb();
    const records = getShopRecords(db, req.shopId);
    let list = records[key] || [];

    if (routeKey === 'sales') {
      // Date filtering (sales reports)
      // Supports YYYY-MM-DD via ?from=2026-05-01&to=2026-05-02 (inclusive)
      const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000`) : null;
      const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : null;
      if (from || to) {
        list = list.filter((x) => {
          const t = new Date(x.createdAt || 0).getTime();
          if (Number.isNaN(t)) return false;
          if (from && t < from.getTime()) return false;
          if (to && t > to.getTime()) return false;
          return true;
        });
      }
    }

    res.json(list);
  });

  app.post(`/api/${routeKey}`, authRequired, (req, res) => {
    const db = readDb();
    const records = getShopRecords(db, req.shopId);
    const item = { id: req.body.id || uid(), ...req.body, shopId: req.shopId };
    records[key] = [item, ...(records[key] || [])];
    writeDb(db);
    res.status(201).json(item);
  });
}

function crudRoute(key, routeKey = key) {
  listRoute(key, routeKey);

  app.put(`/api/${routeKey}/:id`, authRequired, (req, res) => {
    const db = readDb();
    const records = getShopRecords(db, req.shopId);
    const idx = (records[key] || []).findIndex((x) => String(x.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ message: `${key.slice(0, -1)} not found` });
    records[key][idx] = { ...records[key][idx], ...req.body, id: records[key][idx].id, shopId: req.shopId };
    writeDb(db);
    res.json(records[key][idx]);
  });

  app.delete(`/api/${routeKey}/:id`, authRequired, (req, res) => {
    const db = readDb();
    const records = getShopRecords(db, req.shopId);
    records[key] = (records[key] || []).filter((x) => String(x.id) !== String(req.params.id));
    writeDb(db);
    res.status(204).send();
  });
}

crudRoute('products');
crudRoute('customers');
crudRoute('employees');
listRoute('sales');
listRoute('creditSales', 'credit-sales');

// Sales management: delete + returns (reports module)
app.delete('/api/sales/:id', authRequired, (req, res) => {
  const db = readDb();
  const records = getShopRecords(db, req.shopId);
  const before = records.sales || [];
  const id = String(req.params.id);

  const sale = before.find((s) => String(s.id) === id);
  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  records.sales = before.filter((s) => String(s.id) !== id && String(s.originalSaleId || '') !== id);
  writeDb(db);
  return res.status(204).send();
});

app.post('/api/sales/:id/return', authRequired, (req, res) => {
  const db = readDb();
  const records = getShopRecords(db, req.shopId);
  const id = String(req.params.id);
  const sale = (records.sales || []).find((s) => String(s.id) === id);
  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  const body = req.body || {};
  const requestedItems = Array.isArray(body.items) ? body.items : null;

  const originalItems = Array.isArray(sale.items) ? sale.items : [];
  const originalLineTotal = originalItems.reduce((sum, it) => {
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const disc = Number(it.discount || 0) / 100;
    return sum + price * qty * (1 - disc);
  }, 0);

  // If no items are provided => full return (all quantities)
  const itemsToReturn = requestedItems
    ? requestedItems
        .map((ri) => {
          const match = originalItems.find((it) => String(it.id) === String(ri.id));
          if (!match) return null;
          const maxQty = Number(match.qty || 0);
          const qty = Math.max(0, Math.min(maxQty, Number(ri.qty || 0)));
          if (!qty) return null;
          return { ...match, qty };
        })
        .filter(Boolean)
    : originalItems.map((it) => ({ ...it, qty: Number(it.qty || 0) }));

  if (itemsToReturn.length === 0) return res.status(400).json({ message: 'No items to return' });

  const returnLineTotal = itemsToReturn.reduce((sum, it) => {
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const disc = Number(it.discount || 0) / 100;
    return sum + price * qty * (1 - disc);
  }, 0);

  const ratio = originalLineTotal > 0 ? returnLineTotal / originalLineTotal : 1;
  const originalTotal = Number(sale.total || 0);
  const originalProfit = Number(sale.profit || 0);

  const returnedAt = new Date().toISOString();
  const returnSale = {
    id: uid(),
    type: 'Return',
    originalSaleId: sale.id,
    total: -Math.abs(Number((originalTotal * ratio).toFixed(2))),
    profit: -Math.abs(Number((originalProfit * ratio).toFixed(2))),
    method: 'Return',
    customerId: sale.customerId || null,
    items: itemsToReturn,
    createdAt: returnedAt,
  };

  // mark original sale
  const fullyReturned = ratio >= 0.999;
  sale.status = fullyReturned ? 'Returned' : 'Partially Returned';
  sale.returnedAt = returnedAt;
  sale.returnedTotal = Number((Math.abs(Number(sale.returnedTotal || 0)) + Math.abs(returnSale.total)).toFixed(2));

  records.sales = [returnSale, ...(records.sales || [])];
  writeDb(db);

  return res.status(201).json(returnSale);
});

app.get('/api/settings', authRequired, (req, res) => {
  const db = readDb();
  const records = getShopRecords(db, req.shopId);
  res.json(records.settings || { currency: 'LKR ', shopName: 'My Retail Shop' });
});

app.put('/api/settings', authRequired, (req, res) => {
  const db = readDb();
  const records = getShopRecords(db, req.shopId);
  records.settings = {
    ...(records.settings || { currency: 'LKR ', shopName: 'My Retail Shop' }),
    ...req.body,
  };
  writeDb(db);
  res.json(records.settings);
});

app.get('/api', (_req, res) => {
  res.json({
    status: 'ok',
    auth: '/api/auth/login',
    defaultDemoLogin: { shopCode: 'DEMO', pin: '1234' },
    endpoints: [
      '/api/products',
      '/api/customers',
      '/api/employees',
      '/api/sales',
      '/api/sales?from=YYYY-MM-DD&to=YYYY-MM-DD',
      '/api/sales/:id/return (POST full or partial)',
      '/api/sales/:id (DELETE)',
      '/api/credit-sales',
      '/api/settings',
      '/api/admin/login',
      '/api/admin/shops (admin token or master key)',
    ],
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Retail POS API running on http://localhost:${PORT}/api`);
});
