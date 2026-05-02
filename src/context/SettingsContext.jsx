import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, authStore } from '../services/api';

const DataStoreContext = createContext(null);

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function SettingsProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authStore.token && authStore.shopId));
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sales, setSales] = useState([]);
  const [creditSales, setCreditSales] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]);
  const [currency, setCurrency] = useState('LKR ');
  const [shopName, setShopName] = useState('My Retail Shop');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshFromBackend = async () => {
    const [p, c, e, s, cs, st] = await Promise.all([
      api.products.list(),
      api.customers.list(),
      api.employees.list(),
      api.sales.list(),
      api.creditSales.list(),
      api.settings.get(),
    ]);
    setProducts(Array.isArray(p) ? p : []);
    setCustomers(Array.isArray(c) ? c : []);
    setEmployees(Array.isArray(e) ? e : []);
    setSales(Array.isArray(s) ? s : []);
    setCreditSales(Array.isArray(cs) ? cs : []);
    setCurrency(st?.currency || 'LKR ');
    setShopName(st?.shopName || 'My Retail Shop');
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!authStore.token || !authStore.shopId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        await refreshFromBackend();
        setIsAuthenticated(true);
      } catch {
        setError('Session expired. Please login again.');
        authStore.clear();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        await refreshFromBackend();
      } catch {
        // keep current UI state, avoid disrupting active checkout
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (shopCode, pin) => {
    setError('');
    setLoading(true);
    try {
      const session = await api.auth.login({ shopCode, pin });
      authStore.setSession({ token: session.token, shopId: session.shopId });
      setCurrency(session.currency || 'LKR ');
      setShopName(session.shopName || 'My Retail Shop');
      await refreshFromBackend();
      setIsAuthenticated(true);
    } catch {
      setError('Invalid shop code or PIN.');
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authStore.clear();
    setIsAuthenticated(false);
    setProducts([]);
    setCustomers([]);
    setEmployees([]);
    setSales([]);
    setCreditSales([]);
    setHeldOrders([]);
  };

  const withSafeError = async (fn, rollback) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      rollback?.();
      setError(e.message || 'Operation failed.');
      throw e;
    }
  };

  const createProduct = async (payload) => {
    const optimistic = { ...payload, id: uid() };
    setProducts((prev) => [optimistic, ...prev]);
    await withSafeError(async () => {
      const saved = await api.products.create(payload);
      setProducts((prev) => [saved, ...prev.filter((p) => p.id !== optimistic.id)]);
    }, () => setProducts((prev) => prev.filter((p) => p.id !== optimistic.id)));
  };

  const updateProduct = async (id, payload) => {
    const old = products;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    await withSafeError(async () => {
      await api.products.update(id, payload);
    }, () => setProducts(old));
  };

  const deleteProduct = async (id) => {
    const old = products;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await withSafeError(async () => {
      await api.products.remove(id);
    }, () => setProducts(old));
  };

  const createCustomer = async (payload) => {
    const optimistic = { ...payload, id: uid() };
    setCustomers((prev) => [optimistic, ...prev]);
    await withSafeError(async () => {
      const saved = await api.customers.create(payload);
      setCustomers((prev) => [saved, ...prev.filter((c) => c.id !== optimistic.id)]);
      return saved;
    }, () => setCustomers((prev) => prev.filter((c) => c.id !== optimistic.id)));
    return optimistic;
  };

  const updateCustomer = async (id, payload) => {
    const old = customers;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
    await withSafeError(async () => {
      await api.customers.update(id, payload);
    }, () => setCustomers(old));
  };

  const deleteCustomer = async (id) => {
    const old = customers;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    await withSafeError(async () => {
      await api.customers.remove(id);
    }, () => setCustomers(old));
  };

  const createEmployee = async (payload) => {
    const optimistic = { ...payload, id: uid() };
    setEmployees((prev) => [optimistic, ...prev]);
    await withSafeError(async () => {
      const saved = await api.employees.create(payload);
      setEmployees((prev) => [saved, ...prev.filter((e) => e.id !== optimistic.id)]);
    }, () => setEmployees((prev) => prev.filter((e) => e.id !== optimistic.id)));
  };

  const updateEmployee = async (id, payload) => {
    const old = employees;
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)));
    await withSafeError(async () => {
      await api.employees.update(id, payload);
    }, () => setEmployees(old));
  };

  const deleteEmployee = async (id) => {
    const old = employees;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await withSafeError(async () => {
      await api.employees.remove(id);
    }, () => setEmployees(old));
  };

  const updateSettings = async (payload) => {
    const oldCurrency = currency;
    const oldShopName = shopName;
    if (payload.currency !== undefined) setCurrency(payload.currency);
    if (payload.shopName !== undefined) setShopName(payload.shopName);

    await withSafeError(async () => {
      await api.settings.update({
        currency: payload.currency ?? currency,
        shopName: payload.shopName ?? shopName,
      });
    }, () => {
      setCurrency(oldCurrency);
      setShopName(oldShopName);
    });
  };

  const holdOrder = (order) => {
    setHeldOrders((prev) => [{ id: uid(), time: new Date().toLocaleTimeString(), ...order }, ...prev]);
  };

  const removeHeldOrder = (id) => setHeldOrders((prev) => prev.filter((h) => h.id !== id));

  const recordSale = async ({ total, profit, method, items, customerId }) => {
    const sale = {
      id: uid(),
      total,
      profit,
      method,
      customerId: customerId || null,
      items,
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [sale, ...prev]);
    await withSafeError(async () => {
      const saved = await api.sales.create(sale);
      setSales((prev) => [saved, ...prev.filter((s) => s.id !== sale.id)]);

      if (method === 'Credit') {
        const credit = {
          id: uid(),
          customerId,
          items,
          total,
          createdAt: sale.createdAt,
          status: 'Unpaid',
        };
        setCreditSales((prev) => [credit, ...prev]);
        const savedCredit = await api.creditSales.create(credit);
        setCreditSales((prev) => [savedCredit, ...prev.filter((c) => c.id !== credit.id)]);
      }
    }, () => setSales((prev) => prev.filter((s) => s.id !== sale.id)));
  };

  const deleteSale = async (id) => {
    const old = sales;
    setSales((prev) => prev.filter((s) => String(s.id) !== String(id) && String(s.originalSaleId || '') !== String(id)));
    await withSafeError(async () => {
      await api.sales.remove(id);
    }, () => setSales(old));
  };

  const returnSale = async (id, items) => {
    const old = sales;
    // Optimistic: mark as returned in UI, server also adds a negative return entry
    setSales((prev) => prev.map((s) => (String(s.id) === String(id) ? { ...s, status: 'Returned' } : s)));
    await withSafeError(async () => {
      const returned = await api.sales.return(id, items ? { items } : undefined);
      setSales((prev) => [returned, ...prev.map((s) => (String(s.id) === String(id) ? { ...s, status: 'Returned' } : s))]);
    }, () => setSales(old));
  };

  const metrics = useMemo(() => {
    const computeSaleNetAndCost = (sale) => {
      const total = Number(sale.total || 0);
      const items = Array.isArray(sale.items) ? sale.items : [];

      const netBeforeGlobalTotal = items.reduce((sum, it) => {
        const qty = Number(it.qty || 0);
        const price = Number(it.price || 0);
        const disc = Number(it.discount || 0) / 100;
        return sum + price * qty * (1 - disc);
      }, 0);

      const absScale = netBeforeGlobalTotal > 0 ? Math.abs(total) / netBeforeGlobalTotal : 1;

      const costTotalAbs = items.reduce((sum, it) => {
        const qty = Number(it.qty || 0);
        const cost = Number(it.cost || 0);
        return sum + cost * qty;
      }, 0);

      // Profit is selling - cost. We scale the pre-global item nets to match the recorded sale total.
      // This makes discounts (including global discount) correctly reduce profit.
      const sellingAbs = netBeforeGlobalTotal * absScale;
      const profitAbs = sellingAbs - costTotalAbs;

      const signedProfit = total < 0 ? -Math.abs(profitAbs) : profitAbs;

      return { total, cost: total < 0 ? -Math.abs(costTotalAbs) : costTotalAbs, profit: signedProfit };
    };

    const today = new Date().toDateString();
    const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + computeSaleNetAndCost(s).total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + computeSaleNetAndCost(s).profit, 0);
    const todayCost = todaySales.reduce((sum, s) => sum + computeSaleNetAndCost(s).cost, 0);
    const todayOrders = todaySales.filter((s) => s.type !== 'Return').length;
    const nonCashPayments = todaySales
      .filter((s) => s.type !== 'Return' && s.method !== 'Cash')
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    const totalRevenue = sales.reduce((sum, s) => sum + computeSaleNetAndCost(s).total, 0);
    const totalProfit = sales.reduce((sum, s) => sum + computeSaleNetAndCost(s).profit, 0);

    const now = new Date();
    const thisMonthSales = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const monthlyRevenue = thisMonthSales.reduce((sum, s) => sum + computeSaleNetAndCost(s).total, 0);
    const monthlyProfit = thisMonthSales.reduce((sum, s) => sum + computeSaleNetAndCost(s).profit, 0);
    const monthlyCost = thisMonthSales.reduce((sum, s) => sum + computeSaleNetAndCost(s).cost, 0);

    return { todayRevenue, todayCost, todayProfit, todayOrders, nonCashPayments, totalRevenue, totalProfit, monthlyRevenue, monthlyCost, monthlyProfit };
  }, [sales]);

  const value = {
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    loading,
    error,
    setError,
    usingFallback: false,
    currency,
    shopName,
    setCurrency,
    setShopName,
    updateSettings,
    products,
    customers,
    employees,
    sales,
    creditSales,
    heldOrders,
    holdOrder,
    removeHeldOrder,
    createProduct,
    updateProduct,
    deleteProduct,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    recordSale,
    deleteSale,
    returnSale,
    ...metrics,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export const useDataStore = () => useContext(DataStoreContext);
export const useSettings = useDataStore;
