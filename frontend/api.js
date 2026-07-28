// ── API BASE URL ────────────────────────────────────
const API_BASE_URL = 'https://mongoledger.onrender.com/';

// ── GET TOKEN ────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('bk_token');
}

function getAdminToken() {
  return sessionStorage.getItem('bk_admin_token');
}

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── SHOP DATA API ────────────────────────────────────
async function apiGetData() {
  const res = await fetch(`${API_BASE_URL}/api/data`, {
    headers: getHeaders(getToken())
  });
  if (!res.ok) throw new Error('Data load nahi hua');
  return res.json();
}

async function apiSaveData(data) {
  const res = await fetch(`${API_BASE_URL}/api/data`, {
    method: 'POST',
    headers: getHeaders(getToken()),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Data save nahi hua');
  return res.json();
}

async function apiBackup(data) {
  const res = await fetch(`${API_BASE_URL}/api/backup`, {
    method: 'POST',
    headers: getHeaders(getToken()),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Backup save nahi hua');
  return res.json();
}

// ─── SHOP LOGIN ──────────────────────────────────────
async function apiShopLogin(phone, password) {
  const res = await fetch(`${API_BASE_URL}/api/shop/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

// ─── ADMIN LOGIN ──────────────────────────────────────
async function apiAdminLogin(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

// ─── ADMIN SHOP MANAGEMENT ────────────────────────────
async function apiCreateShop(shopData, adminToken) {
  const res = await fetch(`${API_BASE_URL}/api/admin/shops`, {
    method: 'POST',
    headers: getHeaders(adminToken),
    body: JSON.stringify(shopData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create shop');
  }
  return res.json();
}

async function apiGetShops(adminToken) {
  const res = await fetch(`${API_BASE_URL}/api/admin/shops`, {
    headers: getHeaders(adminToken)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to get shops');
  }
  return res.json();
}

// ─── DEACTIVATE SHOP ────────────────────────────────
// ✅ YAHI HAI DEACTIVATE API CALL
async function apiDeleteShop(shopId, adminToken) {
  const res = await fetch(`${API_BASE_URL}/api/admin/shops/${shopId}`, {
    method: 'DELETE',
    headers: getHeaders(adminToken)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to deactivate shop');
  }
  return res.json();
}

// ─── REACTIVATE SHOP ────────────────────────────────
// ✅ YEH BHI ADD KARO (Reactivate ke liye)
async function apiReactivateShop(shopId, adminToken) {
  const res = await fetch(`${API_BASE_URL}/api/admin/shops/${shopId}/reactivate`, {
    method: 'PUT',
    headers: getHeaders(adminToken)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to reactivate shop');
  }
  return res.json();
}