const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const authStore = {
  get token() {
    return localStorage.getItem('pos_token') || '';
  },
  get shopId() {
    return localStorage.getItem('pos_shop_id') || '';
  },
  setSession({ token, shopId }) {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_shop_id', shopId);
  },
  clear() {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_shop_id');
  },
};

async function request(path, options = {}) {
  const { noShop = false, noAuth = false, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  if (!noAuth && authStore.token && !headers.Authorization) headers.Authorization = `Bearer ${authStore.token}`;
  if (!noShop && authStore.shopId && headers['x-shop-id'] === undefined) headers['x-shop-id'] = authStore.shopId;

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  auth: {
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  },
  admin: {
    login: (payload) => request('/admin/login', { method: 'POST', body: JSON.stringify(payload), noAuth: true, noShop: true }),
    listShops: (adminToken) => request('/admin/shops', { headers: { Authorization: `Bearer ${adminToken}` }, noAuth: true, noShop: true }),
    createShop: (payload, adminToken) =>
      request('/admin/shops', { method: 'POST', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${adminToken}` }, noAuth: true, noShop: true }),
  },
  settings: {
    get: () => request('/settings'),
    update: (payload) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  },
  products: {
    list: () => request('/products'),
    create: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  customers: {
    list: () => request('/customers'),
    create: (payload) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  },
  employees: {
    list: () => request('/employees'),
    create: (payload) => request('/employees', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  },
  sales: {
    list: (params = {}) => {
      const q = new URLSearchParams();
      if (params.from) q.set('from', params.from);
      if (params.to) q.set('to', params.to);
      const qs = q.toString();
      return request(`/sales${qs ? `?${qs}` : ''}`);
    },
    create: (payload) => request('/sales', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/sales/${id}`, { method: 'DELETE' }),
    return: (id, payload) => request(`/sales/${id}/return`, { method: 'POST', body: payload ? JSON.stringify(payload) : '{}' }),
  },
  creditSales: {
    list: () => request('/credit-sales'),
    create: (payload) => request('/credit-sales', { method: 'POST', body: JSON.stringify(payload) }),
  },
};
