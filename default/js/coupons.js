const LS_DISCOUNTS = 'mycart_discount_codes';
const LS_APPLIED_COUPON = 'mycart_applied_coupon';

const CouponType = Object.freeze({
  PERCENT: 'percent',
  FIXED: 'fixed',
  FREESHIP: 'freeship'
});

const CouponStatus = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  EXHAUSTED: 'exhausted',
  NOT_STARTED: 'not_started',
  INACTIVE: 'inactive'
});

function loadCoupons() {
  try {
    const stored = localStorage.getItem(LS_DISCOUNTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map(migrateCoupon);
    }
  } catch (e) { console.warn('Failed to load coupons:', e); }
  return [];
}

function saveCoupons(coupons) {
  try {
    localStorage.setItem(LS_DISCOUNTS, JSON.stringify(coupons));
    return true;
  } catch (e) {
    console.error('Failed to save coupons:', e);
    return false;
  }
}

function migrateCoupon(c) {
  if (!c.id) c.id = 'cp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  if (!c.type) c.type = c.percent ? CouponType.PERCENT : CouponType.PERCENT;
  if (c.type === CouponType.PERCENT && c.percent && c.value === undefined) c.value = c.percent;
  if (c.type === CouponType.FIXED && c.value === undefined) c.value = 0;
  if (!c.description) c.description = '';
  if (!c.startDate) c.startDate = 0;
  if (!c.endDate && c.expiresAt) { c.endDate = c.expiresAt; }
  if (!c.endDate) c.endDate = 0;
  if (!c.limit) c.limit = 0;
  if (!c.uses) c.uses = 0;
  if (!c.perUserLimit) c.perUserLimit = 0;
  if (!c.userUsed) c.userUsed = {};
  if (!c.minOrder) c.minOrder = 0;
  if (!c.maxDiscount) c.maxDiscount = 0;
  if (c.isActive === undefined) c.isActive = true;
  if (!c.createdAt) c.createdAt = Date.now();
  if (!c.categoryIds) c.categoryIds = [];
  if (!c.productIds) c.productIds = [];
  delete c.expiresAt;
  delete c.percent;
  return c;
}

function createCoupon(data) {
  const now = Date.now();
  return {
    id: 'cp_' + now + '_' + Math.random().toString(36).slice(2, 7),
    code: (data.code || '').trim().toUpperCase(),
    type: data.type || CouponType.PERCENT,
    value: parseFloat(data.value) || 0,
    description: data.description || '',
    startDate: parseDateInput(data.startDate) || 0,
    endDate: parseDateInput(data.endDate) || 0,
    limit: parseInt(data.limit) || 0,
    uses: 0,
    perUserLimit: parseInt(data.perUserLimit) || 0,
    userUsed: {},
    minOrder: parseFloat(data.minOrder) || 0,
    maxDiscount: parseFloat(data.maxDiscount) || 0,
    isActive: data.isActive !== false,
    createdAt: now,
    categoryIds: data.categoryIds || [],
    productIds: data.productIds || []
  };
}

function parseDateInput(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const ts = new Date(val).getTime();
  return isNaN(ts) ? 0 : ts;
}

function getCouponStatus(coupon) {
  const now = Date.now();
  if (!coupon.isActive) return CouponStatus.INACTIVE;
  if (coupon.startDate && coupon.startDate > now) return CouponStatus.NOT_STARTED;
  if (coupon.endDate && coupon.endDate > 0 && now > coupon.endDate) return CouponStatus.EXPIRED;
  if (coupon.limit && coupon.limit > 0 && coupon.uses >= coupon.limit) return CouponStatus.EXHAUSTED;
  return CouponStatus.ACTIVE;
}

function getCouponStatusLabel(status) {
  const labels = {
    [CouponStatus.ACTIVE]: { text: 'نشط', color: '#16a34a', bg: 'rgba(22,163,74,.1)' },
    [CouponStatus.EXPIRED]: { text: 'منتهي', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    [CouponStatus.EXHAUSTED]: { text: 'مستنفذ', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    [CouponStatus.NOT_STARTED]: { text: 'لم يبدأ', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    [CouponStatus.INACTIVE]: { text: 'متوقف', color: '#64748b', bg: 'rgba(100,116,139,.1)' }
  };
  return labels[status] || labels[CouponStatus.INACTIVE];
}

function canUserUseCoupon(coupon, customerId) {
  if (!coupon.perUserLimit || coupon.perUserLimit <= 0) return true;
  const used = coupon.userUsed[customerId] || 0;
  return used < coupon.perUserLimit;
}

function isCartEligible(coupon, cartItems, subtotal) {
  if (coupon.minOrder && subtotal < coupon.minOrder) return { ok: false, reason: `الحد الأدنى للطلب ${formatCurrency(coupon.minOrder)}` };
  if (coupon.categoryIds && coupon.categoryIds.length) {
    const hasMatching = cartItems.some(it => (it.categoryIds && it.categoryIds.some(c => coupon.categoryIds.includes(c))) || coupon.categoryIds.includes(it.category));
    if (!hasMatching) return { ok: false, reason: 'الكوبون ينطبق على تصنيفات محددة فقط' };
  }
  if (coupon.productIds && coupon.productIds.length) {
    const hasMatching = cartItems.some(it => coupon.productIds.includes(it.id));
    if (!hasMatching) return { ok: false, reason: 'الكوبون ينطبق على منتجات محددة فقط' };
  }
  return { ok: true };
}

function calculateDiscount(coupon, subtotal) {
  if (coupon.type === CouponType.FREESHIP) return { amount: 0, isFreeShip: true };
  let amount = 0;
  if (coupon.type === CouponType.PERCENT) {
    amount = Math.round(subtotal * (coupon.value || 0) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0 && amount > coupon.maxDiscount) {
      amount = coupon.maxDiscount;
    }
  } else if (coupon.type === CouponType.FIXED) {
    amount = Math.min(coupon.value || 0, subtotal);
  }
  return { amount, isFreeShip: false };
}

function validateCouponForUse(coupon, cartItems, subtotal, customerId) {
  const status = getCouponStatus(coupon);
  if (status === CouponStatus.INACTIVE) return { valid: false, error: 'هذا الكوبون متوقف حالياً' };
  if (status === CouponStatus.NOT_STARTED) {
    const start = new Date(coupon.startDate);
    return { valid: false, error: `يبدأ سريان الكوبون في ${start.toLocaleDateString('ar-SA')}` };
  }
  if (status === CouponStatus.EXPIRED) return { valid: false, error: 'انتهت صلاحية هذا الكوبون' };
  if (status === CouponStatus.EXHAUSTED) return { valid: false, error: 'تم استنفاذ استخدامات هذا الكوبون' };
  if (!canUserUseCoupon(coupon, customerId)) {
    return { valid: false, error: `لقد تجاوزت الحد المسموح به من الاستخدام (${coupon.perUserLimit} مرة لكل مستخدم)` };
  }
  const eligible = isCartEligible(coupon, cartItems, subtotal);
  if (!eligible.ok) return { valid: false, error: eligible.reason };
  return { valid: true };
}

function findCouponByCode(code) {
  const coupons = loadCoupons();
  return coupons.find(c => c.code === (code || '').trim().toUpperCase());
}

function addCoupon(data) {
  const coupons = loadCoupons();
  if (coupons.some(c => c.code === (data.code || '').trim().toUpperCase())) {
    return { success: false, error: 'هذا الكود موجود مسبقاً' };
  }
  if (!data.code || !data.code.trim()) return { success: false, error: 'كود الكوبون مطلوب' };
  if (data.type !== CouponType.FREESHIP) {
    const val = parseFloat(data.value);
    if (!val || val <= 0) return { success: false, error: 'قيمة الخصم مطلوبة' };
    if (data.type === CouponType.PERCENT && (val > 100 || val < 1)) return { success: false, error: 'نسبة الخصم يجب أن تكون بين 1 و 100' };
  }
  const coupon = createCoupon(data);
  coupons.unshift(coupon);
  saveCoupons(coupons);
  return { success: true, coupon };
}

function updateCoupon(id, data) {
  const coupons = loadCoupons();
  const idx = coupons.findIndex(c => c.id === id);
  if (idx === -1) return { success: false, error: 'الكوبون غير موجود' };
  const existing = coupons[idx];
  if (data.code && data.code.trim().toUpperCase() !== existing.code) {
    if (coupons.some((c, i) => i !== idx && c.code === data.code.trim().toUpperCase())) {
      return { success: false, error: 'هذا الكود موجود مسبقاً' };
    }
    existing.code = data.code.trim().toUpperCase();
  }
  if (data.type !== undefined) existing.type = data.type;
  if (data.value !== undefined) existing.value = parseFloat(data.value) || 0;
  if (data.description !== undefined) existing.description = data.description || '';
  if (data.startDate !== undefined) existing.startDate = parseDateInput(data.startDate);
  if (data.endDate !== undefined) existing.endDate = parseDateInput(data.endDate);
  if (data.limit !== undefined) existing.limit = parseInt(data.limit) || 0;
  if (data.perUserLimit !== undefined) existing.perUserLimit = parseInt(data.perUserLimit) || 0;
  if (data.minOrder !== undefined) existing.minOrder = parseFloat(data.minOrder) || 0;
  if (data.maxDiscount !== undefined) existing.maxDiscount = parseFloat(data.maxDiscount) || 0;
  if (data.isActive !== undefined) existing.isActive = !!data.isActive;
  if (data.categoryIds) existing.categoryIds = data.categoryIds;
  if (data.productIds) existing.productIds = data.productIds;
  coupons[idx] = existing;
  saveCoupons(coupons);
  return { success: true, coupon: existing };
}

function deleteCoupon(id) {
  const coupons = loadCoupons();
  const filtered = coupons.filter(c => c.id !== id);
  saveCoupons(filtered);
  return filtered.length !== coupons.length;
}

function toggleCouponActive(id) {
  const coupons = loadCoupons();
  const idx = coupons.findIndex(c => c.id === id);
  if (idx === -1) return false;
  coupons[idx].isActive = !coupons[idx].isActive;
  saveCoupons(coupons);
  return true;
}

function recordCouponUse(code, customerId) {
  const coupons = loadCoupons();
  const idx = coupons.findIndex(c => c.code === code);
  if (idx === -1) return false;
  coupons[idx].uses = (coupons[idx].uses || 0) + 1;
  if (!coupons[idx].userUsed) coupons[idx].userUsed = {};
  coupons[idx].userUsed[customerId] = (coupons[idx].userUsed[customerId] || 0) + 1;
  saveCoupons(coupons);
  return true;
}

function sortCoupons(coupons, sortBy, desc = false) {
  const sorted = [...coupons];
  sorted.sort((a, b) => {
    let va, vb;
    switch (sortBy) {
      case 'createdAt': va = a.createdAt; vb = b.createdAt; break;
      case 'endDate': va = a.endDate || Infinity; vb = b.endDate || Infinity; break;
      case 'uses': va = a.uses || 0; vb = b.uses || 0; break;
      case 'value': va = a.value || 0; vb = b.value || 0; break;
      case 'code': default: va = a.code; vb = b.code; break;
    }
    if (va < vb) return desc ? 1 : -1;
    if (va > vb) return desc ? -1 : 1;
    return 0;
  });
  return sorted;
}

function filterCoupons(coupons, { status, search, type }) {
  return coupons.filter(c => {
    if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !(c.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (type && c.type !== type) return false;
    if (status) {
      const s = getCouponStatus(c);
      if (s !== status) return false;
    }
    return true;
  });
}

function getActiveCouponsForDisplay() {
  const coupons = loadCoupons();
  return coupons
    .filter(c => getCouponStatus(c) === CouponStatus.ACTIVE)
    .sort((a, b) => {
      const aEnd = a.endDate || Infinity;
      const bEnd = b.endDate || Infinity;
      return aEnd - bEnd;
    });
}

function formatCurrency(val) {
  try {
    const s = loadAdminSettings ? loadAdminSettings() : {};
    const cur = (s && s.currency) ? s.currency : (typeof CURRENCY !== 'undefined' ? CURRENCY : '₪');
    return `${cur}${Number(val).toFixed(2)}`;
  } catch (e) { return `₪${Number(val).toFixed(2)}`; }
}

function getCouponTypeLabel(type, value) {
  if (type === CouponType.PERCENT) return `خصم ${value}%`;
  if (type === CouponType.FIXED) return `خصم ${formatCurrency(value)}`;
  if (type === CouponType.FREESHIP) return 'شحن مجاني';
  return '';
}

function getCouponTimeRemaining(coupon) {
  if (!coupon.endDate || coupon.endDate <= 0) return null;
  const diff = coupon.endDate - Date.now();
  if (diff <= 0) return { expired: true, text: 'انتهت الصلاحية', days: 0, hours: 0, mins: 0, secs: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  let text = '';
  if (days > 0) text += `${days}ي `;
  if (hours > 0 || days > 0) text += `${String(hours).padStart(2, '0')}:`;
  text += `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return { expired: false, text, days, hours, mins, secs, totalMs: diff };
}

function dateToInputValue(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function setAppliedCoupon(couponCode) {
  try {
    if (couponCode) localStorage.setItem(LS_APPLIED_COUPON, couponCode);
    else localStorage.removeItem(LS_APPLIED_COUPON);
  } catch (e) {}
}

function getAppliedCoupon() {
  try { return localStorage.getItem(LS_APPLIED_COUPON) || ''; }
  catch (e) { return ''; }
}

function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {} finally { try { document.body.removeChild(ta); } catch(e) {} }
  } catch (e) {}
}

function getCustomerId() {
  try {
    if (typeof customer !== 'undefined' && customer && customer.id) return customer.id;
    let cid = localStorage.getItem('mycart_cid');
    if (!cid) { cid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); localStorage.setItem('mycart_cid', cid); }
    return cid;
  } catch(e) { return 'anon_' + Date.now(); }
}

function applyCouponCodeFromWidget(code) {
  const inp = document.getElementById('discountCode');
  if (!inp) {
    if (typeof openCartSheet === 'function') {
      openCartSheet();
      setTimeout(() => applyCouponCodeFromWidget(code), 300);
    } else if (typeof showToast === 'function') {
      showToast('💡 افتح السلة وضع الكود: ' + code, 'info');
    }
    return;
  }
  inp.value = code;
  if (typeof applyDiscountCode === 'function') applyDiscountCode();
  else if (typeof showToast === 'function') showToast('✅ تم نسخ الكود، اضغط تطبيق', 'success');
}

function renderCouponDetectorWidget() {
  const wrap = document.getElementById('couponDetectorCards');
  const badge = document.getElementById('couponDetectorBadge');
  const empty = document.getElementById('couponDetectorEmpty');
  const navBadge = document.getElementById('navCouponBadge');
  if (!wrap) return;
  const usable = getActiveCouponsForDisplay ? getActiveCouponsForDisplay() : [];
  if (badge) badge.textContent = usable.length;
  if (navBadge) {
    if (usable.length > 0) { navBadge.style.display = 'flex'; navBadge.textContent = usable.length; }
    else navBadge.style.display = 'none';
  }
  if (!usable.length) {
    wrap.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  wrap.innerHTML = usable.map(c => {
    const tm = getCouponTimeRemaining(c);
    const typeBadge = c.type === CouponType.PERCENT
      ? { icon: 'fa-percent', color: '#ef4444', bg: '#fef2f2', label: `خصم ${c.value}%` }
      : c.type === CouponType.FIXED
      ? { icon: 'fa-coins', color: '#16a34a', bg: '#f0fdf4', label: `خصم ${formatCurrency(c.value)}` }
      : { icon: 'fa-truck-fast', color: '#3b82f6', bg: '#eff6ff', label: 'شحن مجاني' };
    const usagesText = c.limit
      ? `${Math.max(0, c.limit - (c.uses || 0))} متبقي من ${c.limit}`
      : 'استخدام غير محدود ♾️';
    const countdownHtml = tm && !tm.expired
      ? `<div class="cpn-countdown" data-cpncd="${c.id}" style="display:flex;align-items:center;gap:4px;background:#fff7ed;color:#9a3412;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:800;white-space:nowrap;border:1px solid #fed7aa"><i class="fa-solid fa-fire-flame-curved"></i> <span>${tm.text}</span></div>`
      : (tm && tm.expired
        ? `<div style="display:flex;align-items:center;gap:4px;background:#fef2f2;color:#991b1b;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:800;white-space:nowrap;border:1px solid #fecaca"><i class="fa-solid fa-hourglass-end"></i> انتهى</div>`
        : '');
    const minOrdBadge = c.minOrder
      ? `<span style="font-size:.65rem;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:999px;font-weight:800;border:1px solid #fde68a">🛒 الحد الأدنى: ${formatCurrency(c.minOrder)}</span>` : '';
    const maxBadge = (c.type === CouponType.PERCENT && c.maxDiscount)
      ? `<span style="font-size:.65rem;background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:999px;font-weight:800;border:1px solid #fecaca">سقف الخصم ${formatCurrency(c.maxDiscount)}</span>` : '';
    const useBadge = c.limit
      ? `<span style="font-size:.65rem;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:999px;font-weight:800;border:1px solid #bfdbfe">👥 ${usagesText}</span>`
      : `<span style="font-size:.65rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;font-weight:800;border:1px solid #86efac">♾️ غير محدود</span>`;
    return `
      <div style="flex:0 0 290px;max-width:290px;background:#fff;border-radius:18px;border:1.5px solid #fde68a;box-shadow:0 8px 24px rgba(217,119,6,.14);overflow:hidden;scroll-snap-align:start;display:flex;flex-direction:column">
        <div style="padding:10px 14px;background:linear-gradient(135deg,${typeBadge.bg} 0%,#fff 100%);display:flex;align-items:center;justify-content:space-between;gap:6px;border-bottom:1.5px dashed #fcd34d">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;background:${typeBadge.color};color:#fff;font-weight:900;font-size:.78rem;box-shadow:0 2px 8px ${typeBadge.color}40">
            <i class="fa-solid ${typeBadge.icon}"></i> ${typeBadge.label}
          </span>
          ${countdownHtml}
        </div>
        <div style="padding:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
            <div style="font-size:.68rem;color:#6b7280;font-weight:800">كود الخصم الحصري:</div>
            <div dir="ltr" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="copyTextToClipboard('${c.code}');if(typeof showToast==='function')showToast('✅ تم نسخ الكود ${c.code}','success')" title="اضغط لنسخ الكود">
              <span style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#78350f;font-weight:900;letter-spacing:2.5px;padding:4px 12px;border-radius:10px;font-size:.95rem;border:1.5px dashed #b45309;box-shadow:inset 0 -2px 0 #b4530933">${c.code}</span>
              <i class="fa-regular fa-copy" style="color:#d97706;font-size:.85rem"></i>
            </div>
          </div>
          ${c.description ? `<div style="font-size:.76rem;color:#78350f;font-weight:700;margin-bottom:10px;line-height:1.45;background:#fffbeb;padding:6px 10px;border-radius:10px;border:1px solid #fde68a"><i class="fa-solid fa-circle-info" style="color:#d97706;margin-left:4px"></i>${c.description}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">
            ${useBadge}${minOrdBadge}${maxBadge}
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="copyTextToClipboard('${c.code}');if(typeof showToast==='function')showToast('✅ تم نسخ ${c.code}','success')" style="flex:1;padding:10px 10px;border:1.5px solid #fbbf24;background:#fffbeb;color:#92400e;border-radius:12px;font-weight:800;font-size:.8rem;cursor:pointer;font-family:inherit;transition:transform .15s" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''">
              <i class="fa-regular fa-copy"></i> نسخ الكود
            </button>
            <button onclick="applyCouponCodeFromWidget('${c.code}')" style="flex:1.25;padding:10px 10px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:12px;font-weight:900;font-size:.8rem;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(217,119,6,.3);transition:transform .15s" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''">
              <i class="fa-solid fa-bolt-lightning"></i> تطبيق الآن
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
  if (!window._couponWidgetInterval) {
    window._couponWidgetInterval = setInterval(() => {
      const all = loadCoupons();
      let needsRerender = false;
      document.querySelectorAll('.cpn-countdown').forEach(el => {
        const cid = el.getAttribute('data-cpncd');
        const c = all.find(x => String(x.id) === String(cid));
        if (!c) return;
        const tm = getCouponTimeRemaining(c);
        if (!tm) return;
        const s = el.querySelector('span');
        if (tm.expired) { needsRerender = true; }
        else if (s) { s.textContent = tm.text; }
      });
      if (needsRerender) renderCouponDetectorWidget();
    }, 1000);
  }
}

function toggleCpnValueField() {
  const type = document.getElementById('cpnType')?.value;
  const group = document.getElementById('cpnValueGroup');
  const label = document.getElementById('cpnValueLabel');
  if (!group || !label) return;
  if (type === CouponType.FREESHIP) {
    group.style.display = 'none';
  } else {
    group.style.display = 'block';
    if (type === CouponType.PERCENT) {
      label.textContent = 'قيمة الخصم (%) *';
      document.getElementById('cpnValue').min = '1';
      document.getElementById('cpnValue').max = '100';
    } else {
      label.textContent = 'قيمة الخصم (مبلغ) *';
      document.getElementById('cpnValue').min = '0.01';
      document.getElementById('cpnValue').max = '';
    }
  }
}

function generateCouponCode() {
  const prefixes = ['SAVE', 'EID', 'RAM', 'SHOP', 'WELCOME', 'SUMMER', 'WIN', 'LUCKY'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const code = (prefix + num).toUpperCase();
  document.getElementById('cpnCode').value = code;
}

function setCouponEndDate(hours) {
  const now = new Date();
  now.setTime(now.getTime() + (hours * 60 * 60 * 1000));
  document.getElementById('cpnEndDate').value = dateToInputValue(now.getTime());
}

let _editingCouponId = null;

function openCouponForm(couponId) {
  _editingCouponId = couponId || null;
  const title = document.getElementById('couponFormTitle');
  const form = document.getElementById('couponForm');
  if (title) title.textContent = couponId ? 'تعديل الكوبون' : 'كوبون خصم جديد';
  if (form) form.reset();
  document.getElementById('cpnIsActive').checked = true;
  document.getElementById('cpnPerUserLimit').value = '1';
  toggleCpnValueField();
  if (couponId) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.id === couponId);
    if (c) {
      document.getElementById('cpnId').value = c.id;
      document.getElementById('cpnCode').value = c.code || '';
      document.getElementById('cpnType').value = c.type || CouponType.PERCENT;
      document.getElementById('cpnValue').value = c.value || '';
      document.getElementById('cpnMaxDiscount').value = c.maxDiscount || '';
      document.getElementById('cpnMinOrder').value = c.minOrder || '';
      document.getElementById('cpnDescription').value = c.description || '';
      document.getElementById('cpnStartDate').value = dateToInputValue(c.startDate);
      document.getElementById('cpnEndDate').value = dateToInputValue(c.endDate);
      document.getElementById('cpnLimit').value = c.limit || '';
      document.getElementById('cpnPerUserLimit').value = c.perUserLimit || '';
      document.getElementById('cpnIsActive').checked = c.isActive !== false;
      toggleCpnValueField();
    }
  } else {
    document.getElementById('cpnId').value = '';
  }
  document.getElementById('couponFormModal').style.display = 'flex';
}

function closeCouponForm() {
  document.getElementById('couponFormModal').style.display = 'none';
  _editingCouponId = null;
}

function submitCouponForm(e) {
  e.preventDefault();
  const data = {
    code: document.getElementById('cpnCode').value.trim().toUpperCase(),
    type: document.getElementById('cpnType').value,
    value: document.getElementById('cpnValue').value,
    maxDiscount: document.getElementById('cpnMaxDiscount').value,
    minOrder: document.getElementById('cpnMinOrder').value,
    description: document.getElementById('cpnDescription').value.trim(),
    startDate: document.getElementById('cpnStartDate').value,
    endDate: document.getElementById('cpnEndDate').value,
    limit: document.getElementById('cpnLimit').value,
    perUserLimit: document.getElementById('cpnPerUserLimit').value,
    isActive: document.getElementById('cpnIsActive').checked
  };
  let result;
  if (_editingCouponId) {
    result = updateCoupon(_editingCouponId, data);
  } else {
    result = addCoupon(data);
  }
  if (result.success) {
    showToast(result.coupon ? 'تم حفظ الكوبون بنجاح' : 'تم إضافة الكوبون', 'success');
    closeCouponForm();
    renderAdminCoupons();
  } else {
    showToast(result.error || 'خطأ غير معروف', 'error');
  }
}

function clearCouponFilters() {
  document.getElementById('couponSearch').value = '';
  document.getElementById('couponStatusFilter').value = '';
  document.getElementById('couponTypeFilter').value = '';
  document.getElementById('couponSortBy').value = 'createdAt';
  renderAdminCoupons();
}

function renderAdminCoupons() {
  const listEl = document.getElementById('adminCouponsList');
  const search = document.getElementById('couponSearch')?.value.trim() || '';
  const statusFilter = document.getElementById('couponStatusFilter')?.value || '';
  const typeFilter = document.getElementById('couponTypeFilter')?.value || '';
  const sortBy = document.getElementById('couponSortBy')?.value || 'createdAt';
  if (!listEl) return;

  let coupons = loadCoupons();
  coupons = filterCoupons(coupons, { status: statusFilter, search, type: typeFilter });
  coupons = sortCoupons(coupons, sortBy, true);

  // Update stats
  const all = loadCoupons();
  const statTotal = document.getElementById('statCouponsTotal');
  const statActive = document.getElementById('statCouponsActive');
  const statExpired = document.getElementById('statCouponsExpired');
  const statUsed = document.getElementById('statCouponsUsed');
  if (statTotal) statTotal.textContent = all.length;
  if (statActive) statActive.textContent = all.filter(c => getCouponStatus(c) === CouponStatus.ACTIVE).length;
  if (statExpired) statExpired.textContent = all.filter(c => getCouponStatus(c) === CouponStatus.EXPIRED).length;
  if (statUsed) statUsed.textContent = all.reduce((s, c) => s + (c.uses || 0), 0);

  if (!coupons.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)"><i class="fa-solid fa-ticket" style="font-size:2rem;margin-bottom:10px;color:var(--border)"></i><p>لا توجد أكواد خصم مطابقة للبحث</p></div>';
    return;
  }

  listEl.innerHTML = coupons.map(c => {
    const status = getCouponStatus(c);
    const statusInfo = getCouponStatusLabel(status);
    const tm = getCouponTimeRemaining(c);
    const remaining = c.limit ? Math.max(0, c.limit - (c.uses || 0)) : null;
    const typeLabel = getCouponTypeLabel(c.type, c.value);
    const countdownText = tm && !tm.expired ? tm.text : (tm && tm.expired ? 'انتهت' : 'بدون انتهاء');
    const countdownColor = tm && tm.expired ? '#ef4444' : (tm && tm.totalMs < 86400000 ? '#ef4444' : '#d97706');
    const useText = c.limit ? `${remaining} متبقي من ${c.limit}` : 'غير محدود';
    const userUseText = c.perUserLimit ? `لك: ${c.perUserLimit - ((c.userUsed && c.userUsed[getCustomerId()]) || 0)} مرة` : '';

    return `<div style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:14px;transition:all .2s;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;font-size:.9rem;letter-spacing:1px;white-space:nowrap" dir="ltr">${c.code}</div>
          <div style="font-weight:700;font-size:.85rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${typeLabel}</div>
        </div>
        <span style="background:${statusInfo.bg};color:${statusInfo.color};padding:2px 8px;border-radius:6px;font-size:.68rem;font-weight:800;white-space:nowrap">${statusInfo.text}</span>
      </div>
      ${c.description ? `<div style="font-size:.75rem;color:var(--text-muted);line-height:1.4">${c.description}</div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:.7rem">
        <span style="background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:6px;font-weight:700">👥 ${useText}</span>
        ${c.perUserLimit ? `<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:6px;font-weight:700">${userUseText}</span>` : ''}
        <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-weight:700">⏱ ${countdownText}</span>
        ${c.minOrder ? `<span style="background:#f0fdf4;color:#16a34a;padding:2px 8px;border-radius:6px;font-weight:700">🛒 حد أدنى ${formatCurrency(c.minOrder)}</span>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="font-size:.7rem;color:var(--text-muted)">
          <i class="fa-solid fa-chart-line"></i> ${c.uses || 0} استخدام
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="toggleCouponActive('${c.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.75rem;color:${c.isActive ? '#16a34a' : '#64748b'}"><i class="fa-solid fa-${c.isActive ? 'toggle-on' : 'toggle-off'}"></i></button>
          <button onclick="openCouponForm('${c.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.75rem;color:#3b82f6"><i class="fa-solid fa-pen"></i></button>
          <button onclick="showConfirmModal('هل أنت متأكد من حذف هذا الكوبون؟',function(){ deleteCoupon('${c.id}'); renderAdminCoupons(); showToast('تم الحذف','success'); })" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.75rem;color:#ef4444"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function exportCoupons() {
  const coupons = loadCoupons();
  const data = JSON.stringify(coupons, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coupons_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('تم تصدير الكوبونات', 'success');
}

function importCoupons(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) { showToast('ملف غير صالح', 'error'); return; }
      const existing = loadCoupons();
      const merged = [...existing];
      let added = 0;
      imported.forEach(c => {
        const migrated = migrateCoupon({ ...c });
        if (!merged.some(x => x.code === migrated.code)) {
          merged.unshift(migrated);
          added++;
        }
      });
      saveCoupons(merged);
      renderAdminCoupons();
      showToast(`تم استيراد ${added} كوبون جديد`, 'success');
    } catch(err) {
      showToast('خطأ في قراءة الملف', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function initAdminCouponPage() {
  renderAdminCoupons();
  if (!window._adminCouponInterval) {
    window._adminCouponInterval = setInterval(() => {
      if (document.getElementById('adminCouponsList')) renderAdminCoupons();
    }, 60000);
  }
}

if (typeof window !== 'undefined') {
  window.openCouponForm = openCouponForm;
  window.closeCouponForm = closeCouponForm;
  window.submitCouponForm = submitCouponForm;
  window.generateCouponCode = generateCouponCode;
  window.setCouponEndDate = setCouponEndDate;
  window.toggleCpnValueField = toggleCpnValueField;
  window.renderAdminCoupons = renderAdminCoupons;
  window.clearCouponFilters = clearCouponFilters;
  window.exportCoupons = exportCoupons;
  window.importCoupons = importCoupons;
  window.initAdminCouponPage = initAdminCouponPage;

  const initCDW = () => {
    try {
      renderCouponDetectorWidget();
      setInterval(() => { if (document.getElementById('couponDetectorCards')) renderCouponDetectorWidget(); }, 30000);
    } catch (e) {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCDW);
  else setTimeout(initCDW, 50);
  if (document.visibilityState) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && document.getElementById('couponDetectorCards')) setTimeout(renderCouponDetectorWidget, 200);
    });
  }
}
