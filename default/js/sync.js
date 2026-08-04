(function() {
  const EXCLUDED_KEYS = [
    'mycart_cart',
    'mycart_wishlist',
    'mycart_customer',
    'mycart_cid',
    'mycart_dark_mode',
    'mycart_read_notifications',
    'mycart_admin_logged',
    'mycart_wholesale',
    'mycart_store_images_temp',
    'mycart_store_suspended'
  ];

  // Extract storeId from the URL pathname (e.g., /stores/watches/ -> watches)
  const pathParts = window.location.pathname.split('/');
  const storesIndex = pathParts.indexOf('stores');
  let storeId = 'default';
  if (storesIndex !== -1 && pathParts[storesIndex + 1]) {
    storeId = pathParts[storesIndex + 1];
  }

  // Helper to namespace localstorage keys to avoid collisions on localhost
  function getNamespacedKey(key) {
    if (key.startsWith('mycart_') && !['mycart_cid', 'mycart_dark_mode'].includes(key)) {
      return `${key}_${storeId}`;
    }
    return key;
  }

  // ===== Supabase configuration =====
  const cfg = window.SUPABASE_CONFIG || {};
  const SUPABASE_URL = (cfg.url || '').trim().replace(/\/+$/, '');
  const SUPABASE_ANON_KEY = (cfg.anonKey || '').trim();
  const SUPABASE_TOKEN = (cfg.writeToken || '').trim();
  const isConfigured = !!(
    SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_TOKEN &&
    !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
    !SUPABASE_ANON_KEY.includes('YOUR-ANON') &&
    !SUPABASE_TOKEN.includes('YOUR_SECRET')
  );

  const REST = SUPABASE_URL + '/rest/v1';

  // XHR to relative local files only works over http(s); file:// is blocked by CORS
  const canFetchLocal = /^https?:$/.test((window.location || {}).protocol || '');

  function sbHeaders(json) {
    const h = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  // ===== Debounced writes to Supabase =====
  const pending = new Map();
  let flushTimer = null;

function flushPending() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!isConfigured || pending.size === 0) return;
  const items = Array.from(pending.entries());
  pending.clear();
  items.forEach(function(entry) {
    const key = entry[0];
    const value = entry[1];
    fetch(REST + '/rpc/save_store_data', {
      method: 'POST',
      headers: sbHeaders(true),
      body: JSON.stringify({ p_store: storeId, p_key: key, p_value: value, p_token: SUPABASE_TOKEN })
    }).catch(function(err) {
      console.warn('Supabase save failed for', key, err);
    });
  });
}

  function queueWrite(key, value) {
    if (!isConfigured) return;
    pending.set(key, value);
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushPending, 1200);
  }

  // Best-effort flush on unload (catch the last writes)
  window.addEventListener('pagehide', function() {
    if (!isConfigured || pending.size === 0) return;
    try {
      const items = Array.from(pending.entries());
      pending.clear();
      items.forEach(function(entry) {
        const blob = new Blob([JSON.stringify({ p_store: storeId, p_key: entry[0], p_value: entry[1], p_token: SUPABASE_TOKEN })], { type: 'application/json' });
        navigator.sendBeacon(REST + '/rpc/save_store_data', blob);
      });
    } catch (e) { }
  });

  // Also flush when the tab is hidden (covers closing/backgrounding more reliably than pagehide)
  if (document.addEventListener) {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden' && isConfigured && pending.size) {
        flushPending();
      }
    });
  }

  // Expose a manual flush so saving code can push immediately and reliably
  window.__supabaseFlushNow = function() { flushPending(); };

  // ===== Intercept localStorage to apply store namespacing dynamically =====
  const originalGetItem = localStorage.getItem;
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  localStorage.getItem = function(key) {
    return originalGetItem.call(this, getNamespacedKey(key));
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem.call(this, getNamespacedKey(key));
  };

  localStorage.setItem = function(key, value) {
    // Write locally first (with namespace)
    try {
      originalSetItem.call(this, getNamespacedKey(key), value);
    } catch (e) {
      console.error('Local localStorage write failed:', e);
    }

    // Sync config-related mycart_ keys with Supabase
    if (key.startsWith('mycart_') && !EXCLUDED_KEYS.includes(key) && !window.__syncingFromCloud) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
      queueWrite(key, parsedValue);
    }
  };

  // ===== Static fallback (offline / not configured) =====
  const STATIC_KEYS = [
    'mycart_admin_products',
    'mycart_admin_settings',
    'mycart_appearance',
    'mycart_bg',
    'mycart_categories',
    'mycart_logo',
    'mycart_marketing',
    'mycart_orders',
    'mycart_wholesale_code'
  ];

  function loadStaticFallback() {
    if (!canFetchLocal) return;
    STATIC_KEYS.forEach(function(key) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data/' + key + '.json', false);
        xhr.send(null);
        if (xhr.status === 200) {
          window.__syncingFromCloud = true;
          localStorage.setItem(key, xhr.responseText);
          window.__syncingFromCloud = false;
        }
      } catch (e) {
        console.warn('Failed to load static fallback for ' + key + ':', e);
      }
    });
  }

  function readStaticSeed() {
    if (!canFetchLocal) return {};
    const out = {};
    STATIC_KEYS.forEach(function(key) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data/' + key + '.json', false);
        xhr.send(null);
        if (xhr.status === 200) {
          try { out[key] = JSON.parse(xhr.responseText); } catch (e) { out[key] = xhr.responseText; }
        }
      } catch (e) { }
    });
    return out;
  }

  function isAdminPage() {
    return /admin\.html/i.test(window.location.pathname);
  }

  // ===== Live refresh: pull latest shared data from Supabase so new remote
  // orders/notifications appear in the admin panel without a manual reload =====
  async function pullLiveSync() {
    if (!isConfigured) return;
    try {
      const res = await fetch(REST + '/store_data?store_id=eq.' + encodeURIComponent(storeId) + '&select=key,value', {
        headers: sbHeaders(false)
      });
      if (!res.ok) return;
      const rows = await res.json();
      const map = {};
      rows.forEach(function(r){ map[r.key] = r.value; });

      // Only pull keys that drive notifications/badges (low conflict risk)
      if ('mycart_orders' in map) {
        const localRaw = originalGetItem.call(localStorage, getNamespacedKey('mycart_orders'));
        const cl = map.mycart_orders;
        try {
          const lArr = JSON.parse(localRaw || '[]');
          const cArr = Array.isArray(cl) ? cl : JSON.parse(JSON.stringify(cl || []));
          // Only apply when the cloud has MORE orders (a new customer order arrived).
          // This never clobbers the admin's own in-progress status edits.
          if (cArr.length > lArr.length) {
            window.__syncingFromCloud = true;
            originalSetItem.call(localStorage, getNamespacedKey('mycart_orders'), JSON.stringify(cArr));
            window.__syncingFromCloud = false;
            if (typeof window.checkAdminNewOrders === 'function') { try { window.checkAdminNewOrders(); } catch(e){} }
            if (typeof window.updateNotifBadge === 'function') { try { window.updateNotifBadge(); } catch(e){} }
            if (typeof window.renderOrders === 'function') { try { window.renderOrders(); } catch(e){} }
          }
        } catch (e) { }
      }

      if ('mycart_store_notifications' in map) {
        const localRaw = originalGetItem.call(localStorage, getNamespacedKey('mycart_store_notifications'));
        const cl = map.mycart_store_notifications;
        const strVal = typeof cl === 'string' ? cl : JSON.stringify(cl);
        if (strVal !== localRaw) {
          window.__syncingFromCloud = true;
          originalSetItem.call(localStorage, getNamespacedKey('mycart_store_notifications'), strVal);
          window.__syncingFromCloud = false;
          if (typeof window.updateNotifBadge === 'function') { try { window.updateNotifBadge(); } catch(e){} }
        }
      }
    } catch (e) { }
  }

  // ===== Load all data from Supabase =====
  async function loadFromCloud() {
    if (!isConfigured) { loadStaticFallback(); return; }

    try {
      const res = await fetch(REST + '/store_data?store_id=eq.' + encodeURIComponent(storeId) + '&select=key,value', {
        headers: sbHeaders(false)
      });
      if (!res.ok) throw new Error('Supabase HTTP ' + res.status);
      const rows = await res.json();
      const applied = [];

      window.__syncingFromCloud = true;
      rows.forEach(function(r) {
        try {
          const strVal = typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
          originalSetItem.call(localStorage, getNamespacedKey(r.key), strVal);
          applied.push(r.key);
        } catch (e) {
          console.error('Error applying cloud data:', r.key, e);
        }
      });
      window.__syncingFromCloud = false;

      // Seed the database once when it is empty (first run)
      if (applied.length === 0) {
        setTimeout(function() {
          try {
            const seed = readStaticSeed();
            Object.keys(localStorage).forEach(function(rawKey) {
              if (rawKey.startsWith('mycart_') && rawKey.endsWith('_' + storeId)) {
                const base = rawKey.slice(0, -(storeId.length + 1));
                if (!EXCLUDED_KEYS.includes(base) && !(base in seed)) {
                  try { seed[base] = JSON.parse(localStorage.getItem(base)); } catch (e) { seed[base] = localStorage.getItem(base); }
                }
              }
            });
            Object.keys(seed).forEach(function(key) { queueWrite(key, seed[key]); });
            flushPending();
          } catch (e) { console.warn('Seed failed:', e); }
        }, 1500);
      }

      window.__cloudApplied = true;
      window.__supabasePreloaded = true;
      window.dispatchEvent(new Event('supabase:data-loaded'));

      // Admin panel: reload once so every tab reads consistent cloud data
      if (isAdminPage()) {
        try {
          const flag = 'sb_reloaded_' + storeId;
          if (sessionStorage.getItem(flag) !== '1' && localStorage.getItem('mycart_admin_logged') === 'true') {
            sessionStorage.setItem(flag, '1');
            setTimeout(function() { window.location.reload(); }, 400);
          }
        } catch (e) { }
      }
    } catch (err) {
      console.warn('Supabase load failed, using static fallback:', err);
      loadStaticFallback();
    }
  }

  // 1. Synchronously pre-populate localStorage with server-side data on load
  try {
    // Clean up oversized legacy store-images temp value (from old uncompressed version)
    try {
      const legacyRaw = originalGetItem.call(localStorage, `mycart_store_images_temp_${storeId}`);
      if (legacyRaw && legacyRaw.length > 700000) {
        originalRemoveItem.call(localStorage, `mycart_store_images_temp_${storeId}`);
      }
    } catch (e) {}

    // If Supabase is configured, fetch cloud data; otherwise use static fallback files
    if (!isConfigured) {
      if (canFetchLocal) {
        const staticKeys = STATIC_KEYS;
        staticKeys.forEach(function(key) {
          try {
            const staticXhr = new XMLHttpRequest();
            staticXhr.open('GET', `data/${key}.json`, false);
            staticXhr.send(null);
            if (staticXhr.status === 200) {
              localStorage.setItem(key, staticXhr.responseText);
            }
          } catch (e) {
            console.warn(`Failed to load static fallback for ${key}:`, e);
          }
        });
      }
    } else {
      loadFromCloud();
    }
  } catch (err) {
    console.warn('Could not sync data from server (running offline or direct file mode):', err);
  }

  // Poll the cloud while the admin panel is open, so new remote orders trigger
  // the notification badge/sound without a manual refresh.
  var liveTimer = null;
  function startLiveSync() {
    if (!isConfigured || liveTimer) return;
    liveTimer = setInterval(pullLiveSync, 5000);
    pullLiveSync();
  }
  function stopLiveSync() {
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }
  window.__supabaseStartLive = startLiveSync;
  window.__supabaseStopLive = stopLiveSync;

  if (isConfigured && isAdminPage()) startLiveSync();
})();
