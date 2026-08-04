function openAdmin() {
  try { localStorage.setItem('mycart_admin_logged', 'true'); } catch(e) {}
  fixOrderWholesaleFlags();
  document.getElementById('adminOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  adminRefreshAll();
  updateAdminFeeBadge();
  refreshLoginNavItem();
}

function fixOrderWholesaleFlags() {
  try {
    const reqs = JSON.parse(localStorage.getItem('mycart_join_requests') || '[]');
    const approvedPhones = reqs.filter(function(r) { return r.status === 'approved'; }).map(function(r) { return String(r.phone || '').replace(/\D/g, ''); }).filter(function(p) { return p.length > 0; });
    const orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
    let changed = false;
    orders.forEach(function(o) {
      if (o.wholesale === true || o.isWholesale === true) {
        const op = (o.customer && o.customer.phone ? String(o.customer.phone).replace(/\D/g, '') : '');
        if (approvedPhones.indexOf(op) === -1) { o.wholesale = false; delete o.isWholesale; changed = true; }
      }
    });
    if (changed) { try { localStorage.setItem('mycart_orders', JSON.stringify(orders)); } catch(e) {} }
  } catch(e) {}
}

function updateAdminFeeBadge() {
  var el = document.getElementById('adminFeeBadge');
  if (!el) return;
  var info = getFeeInfo();
  if (info.plan === 'free') {
    if (info.accrued > 0) {
      el.innerHTML = '<i class="fa-solid fa-coins" style="margin-'+(document.dir==='rtl'?'l':'r')+'eft:3px"></i>'+info.accrued+' ₪';
      el.style.display = 'inline-block';
      el.style.background = info.accrued >= info.limit ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)';
      el.style.color = info.accrued >= info.limit ? '#ef4444' : '#f59e0b';
    } else {
      el.style.display = 'none';
    }
  } else {
    el.innerHTML = '<i class="fa-solid fa-crown" style="margin-'+(document.dir==='rtl'?'l':'r')+'eft:3px"></i>VIP';
    el.style.display = 'inline-block';
    el.style.background = 'rgba(16,185,129,.12)';
    el.style.color = '#10b981';
  }
}

function closeAdmin() {
  if (adminHasUnsaved() && !confirm('⚠️ لديك تغييرات غير محفوظة!\nإذا أغلقت اللوحة الآن ستضيع تعديلاتك عند تحديث الصفحة.\n\nهل تريد الخروج دون حفظ؟')) {
    return;
  }
  adminMarkSaved();
  document.getElementById('adminOverlay').classList.remove('show');
  document.body.style.overflow = '';
  document.getElementById('adminSidebar').classList.remove('open');
}

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

function switchAdminTab(tab, subTab = '') {
  const tabMap = ['dashboard','orders','products','categories','addProduct','joinrequests','settings','storecard','banners','coupons','marketing','appearance','spinwheel','subscription'];
  const idx = tabMap.indexOf(tab);
  
  document.querySelectorAll('.admin-sidebar button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.submenu-btn').forEach(b => b.classList.remove('active'));

  if (idx >= 0) {
    const mainBtn = Array.from(document.querySelectorAll('.admin-sidebar button')).find(b => {
      const oc = (b.getAttribute('onclick') || '');
      return oc.includes(`switchAdminTab('${tab}'`) || oc.includes(`'${tab}'`);
    });
    if (mainBtn) mainBtn.classList.add('active');
  }

  document.getElementById('admin-' + tab).classList.add('active');
  const titles = { dashboard:'الإحصائيات', orders:'الطلبات', products:'المنتجات', categories:'التصنيفات', addProduct:'إضافة منتج', joinrequests:'طلبات الانضمام', settings:'الإعدادات', storecard:'بطاقة المتجر', banners:'البانرات الإعلانية', coupons:'أكواد الخصم', marketing:'التسويق', appearance:'المظهر والتخطيط', spinwheel:'عجلة الحظ', subscription:'الاشتراك' };
  document.getElementById('adminPageTitle').textContent = titles[tab] || tab;

  if (tab === 'dashboard') adminRenderDashboard();
  if (tab === 'orders') adminRenderOrders();
  if (tab === 'products') adminRenderProducts();
  if (tab === 'categories') adminRenderCategories();
  if (tab === 'addProduct') adminLoadForm();
  if (tab === 'settings') adminLoadSettings();
  if (tab === 'storecard') adminRenderStoreCard();
  if (tab === 'appearance') adminRenderAppearance();
  if (tab === 'banners') adminRenderBanners();
  if (tab === 'coupons') adminRenderCoupons();
  if (tab === 'subscription') adminRenderSubscriptionTab();
  if (tab === 'spinwheel') adminRenderSpinWheel();
  if (tab === 'joinrequests') adminRenderJoinRequests();
  
  if (tab === 'marketing') {
    adminRenderMarketing(subTab || 'seo');
    toggleAdminMktSubMenu(null, true);
    
    // Highlight the sub-menu button
    const targetSub = subTab || 'seo';
    document.querySelectorAll('.submenu-btn').forEach(btn => {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${targetSub}'`)) {
        btn.classList.add('active');
      }
    });
  } else {
    // Hide marketing sub-menu when switching to other tabs
    const sub = document.getElementById('adminMktSubMenu');
    const chev = document.getElementById('adminMktChevron');
    if (sub) sub.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  }

  document.getElementById('adminSidebar').classList.remove('open');
}

// ===== Unsaved-changes guard =====
let adminUnsavedSteps = [];

function adminHasUnsaved() {
  return adminUnsavedSteps.length > 0;
}

function adminMarkUnsaved(label) {
  if (adminUnsavedSteps.indexOf(label) === -1) adminUnsavedSteps.push(label);
  const bar = document.getElementById('adminUnsavedBar');
  if (bar) bar.classList.add('show');
}

function adminMarkSaved() {
  adminUnsavedSteps = [];
  const bar = document.getElementById('adminUnsavedBar');
  if (bar) bar.classList.remove('show');
}

function adminDismissUnsavedTap() {
  const bar = document.getElementById('adminUnsavedBar');
  if (bar) bar.classList.remove('show');
}

function adminChangeHook(e) {
  const t = e.target;
  if (!t || !t.closest) return;
  if (!t.closest('#adminOverlay')) return;
  if (t.matches('input, select, textarea')) adminMarkUnsaved('edit');
}

document.addEventListener('input', adminChangeHook, true);
document.addEventListener('change', adminChangeHook, true);

document.addEventListener('click', function(e) {
  if (!e.target.closest) return;
  const el = e.target.closest('[onclick]');
  if (!el || !el.closest('#adminOverlay')) return;
  const oc = el.getAttribute('onclick') || '';
  if (/switchAdminTab|openAdmin|closeAdmin|toggleAdminSidebar|toggleAdminMktSubMenu|showAdminNotif|closeAdminNotif|Tooltip|Pick|Preview/i.test(oc)) return;
  if (/(remove|delete|reorder|move(Up|Down|Left|Right)|add|toggle|increment|decrement|swap|shift)/i.test(oc)) {
    adminMarkUnsaved('action');
  }
}, true);

window.addEventListener('beforeunload', function(e) {
  const ov = document.getElementById('adminOverlay');
  if (ov && ov.classList.contains('show') && adminHasUnsaved()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function adminRefreshAll() {
  adminSettings = loadAdminSettings();
  WHOLESALE_CODE = adminSettings.wholesaleCode || '';
  CURRENCY = adminSettings.currency || '₪';
  products = loadProducts();
  wishlist = JSON.parse(localStorage.getItem('mycart_wishlist')) || [];
  adminRenderDashboard();
  adminRenderOrders();
  adminRenderProducts();
  adminRenderCategories();
  adminUpdateCouponBadge();
  updateAdminFeeBadge();
  updateAdminJoinBadge();
}

let quickAdminSalesRange = 'week';
let quickAdminSalesCustomFrom = '';
let quickAdminSalesCustomTo = '';

function setQuickAdminSalesRange(r) {
  quickAdminSalesRange = r;
  adminRenderDashboard();
}

function onAdminSalesCustomInput() {
  quickAdminSalesCustomFrom = document.getElementById('adminSalesFrom') ? document.getElementById('adminSalesFrom').value : '';
  quickAdminSalesCustomTo = document.getElementById('adminSalesTo') ? document.getElementById('adminSalesTo').value : '';
}

function applyAdminSalesCustom() {
  onAdminSalesCustomInput();
  if (quickAdminSalesCustomFrom && quickAdminSalesCustomTo && quickAdminSalesCustomFrom > quickAdminSalesCustomTo) {
    const t = quickAdminSalesCustomFrom; quickAdminSalesCustomFrom = quickAdminSalesCustomTo; quickAdminSalesCustomTo = t;
  }
  adminRenderDashboard();
}

function adminRenderDashboard() {
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const revenue = allOrders.reduce((s, o) => s + (o.total || 0) - (o.delivery || 0), 0);
  const deliveryCost = allOrders.reduce((s, o) => s + (o.delivery || 0), 0);
  const customers = new Set(allOrders.map(o => o.customer?.phone)).size;
  const traders = (function() { try { return JSON.parse(localStorage.getItem('mycart_join_requests') || '[]'); } catch(e) { return []; } })().length;
  const rangeTitles = { today:'مبيعات اليوم', week:'المبيعات اليومية (آخر 7 أيام)', month:'المبيعات اليومية (آخر 30 يوم)', custom:'المبيعات اليومية (الفترة المخصصة)' };
  const chartTitle = rangeTitles[quickAdminSalesRange] || rangeTitles.week;
  const rangeBtns = [ { r:'today', label:'اليوم' }, { r:'week', label:'آخر 7 أيام' }, { r:'month', label:'آخر 30 يوم' }, { r:'custom', label:'مخصص' } ];
  const btnHtml = rangeBtns.map(function(b) {
    return '<button onclick="setQuickAdminSalesRange(\''+b.r+'\')" style="'+(quickAdminSalesRange===b.r?'background:#8b5cf6;color:#fff':'background:#f1f5f9;color:#64748b')+';border:none;padding:5px 12px;border-radius:999px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:inherit">'+b.label+'</button>';
  }).join('');
  const customHtml = '<div style="display:'+(quickAdminSalesRange==='custom'?'flex':'none')+';align-items:center;gap:6px;flex-wrap:wrap">'
    + '<input type="date" id="adminSalesFrom" value="'+quickAdminSalesCustomFrom+'" onchange="onAdminSalesCustomInput()" style="padding:4px 6px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.72rem">'
    + '<span style="font-size:.7rem;color:#64748b">إلى</span>'
    + '<input type="date" id="adminSalesTo" value="'+quickAdminSalesCustomTo+'" onchange="onAdminSalesCustomInput()" style="padding:4px 6px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.72rem">'
    + '<button onclick="applyAdminSalesCustom()" style="background:#8b5cf6;color:#fff;border:none;padding:5px 12px;border-radius:999px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:inherit">عرض</button>'
    + '</div>';
  document.getElementById('admin-dashboard').innerHTML = `
    <div class="admin-stats">
      <div class="admin-stat"><i class="fa-solid fa-box"></i><div><span>${products.length}</span><p>المنتجات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-receipt"></i><div><span>${allOrders.length}</span><p>الطلبات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-money-bill"></i><div><span>${CURRENCY}${revenue.toFixed(2)}</span><p>الإيرادات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-users"></i><div><span>${customers}</span><p>العملاء</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-user-tie"></i><div><span>${traders}</span><p>التجار</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-truck-ramp-box"></i><div><span>${CURRENCY}${deliveryCost.toFixed(2)}</span><p>تكلفة التوصيل</p></div></div>
    </div>
    <div style="margin-top:16px">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:8px">${chartTitle}</h3>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px">${btnHtml}${customHtml}</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px;overflow-x:auto">
        <canvas id="adminChart" height="180" style="width:100%;max-height:180px"></canvas>
      </div>
    </div>
    <div class="admin-section-title" style="margin-top:16px">آخر الطلبات</div>
    ${(() => {
      if (!allOrders.length) return '<div class="admin-empty"><i class="fa-solid fa-receipt"></i><p>لا يوجد طلبات</p></div>';
      var last = allOrders.slice(0, 5);
      return last.map(function(o, idx) {
        return '<div class="admin-order-card" onclick="adminShowOrderDetail('+idx+')" style="cursor:pointer"><div class="admin-order-header"><span class="oid">#'+String(o.id).slice(-6)+'</span><span class="odate">'+(o.date||'')+'</span><span class="ostatus '+(o._status==='done'?'done':'pending')+'">'+(o._status==='done'?'مكتمل':'جديد')+'</span></div><div class="admin-order-body"><div class="oinfo"><i class="fa-solid fa-user"></i> '+(o.customer?.name||'—')+' | '+(o.customer?.phone||'')+'</div><div class="ototal">'+CURRENCY+(o.total?.toFixed(2)||'0.00')+'</div></div></div>';
      }).join('');
    })()}
  `;
  // Render chart
  setTimeout(adminRenderChart, 50);
}

function adminRenderChart() {
  const canvas = document.getElementById('adminChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(rect.width, 300) * dpr;
  canvas.height = 180 * dpr;
  canvas.style.height = '180px';
  ctx.scale(dpr, dpr);
  const W = canvas.width / dpr;
  const H = 180;
  const orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let start, end;
  if (quickAdminSalesRange === 'today') { start = new Date(today); end = new Date(today); }
  else if (quickAdminSalesRange === 'month') { start = new Date(today); start.setDate(start.getDate() - 29); end = new Date(today); }
  else if (quickAdminSalesRange === 'custom') {
    if (quickAdminSalesCustomFrom && quickAdminSalesCustomTo) {
      start = new Date(quickAdminSalesCustomFrom + 'T00:00:00');
      end = new Date(quickAdminSalesCustomTo + 'T00:00:00');
      if (end < start) { const t = start; start = end; end = t; }
    } else { start = new Date(today); end = new Date(today); }
  } else { start = new Date(today); start.setDate(start.getDate() - 6); end = new Date(today); }

  let totalDays = Math.round((end - start) / 86400000) + 1;
  if (totalDays > 31) { start = new Date(end); start.setDate(start.getDate() - 30); totalDays = 31; }

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('ar-SA').split('،')[0];
    const total = orders.filter(o => o.date && o.date.includes(dateStr)).reduce((s, o) => s + (o.total || 0), 0);
    days.push({ label: totalDays > 7 ? String(d.getDate()) : d.toLocaleDateString('ar-SA', { weekday:'short' }), value: total });
  }
  const max = Math.max(...days.map(d => d.value), 1);
  const barW = Math.min(36, (W - 60) / days.length - 6);
  const gap = 6;
  const startX = 36;
  const bottomY = H - 26;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = bottomY - (i / 4) * (H - 46);
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(W - 10, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px Tajawal'; ctx.textAlign = 'right';
    ctx.fillText(`${CURRENCY}${Math.round(max * i / 4)}`, startX - 4, y + 3);
  }
  days.forEach((d, i) => {
    const x = startX + i * (barW + gap) + gap;
    const h = (d.value / max) * (H - 50);
    const y = bottomY - h;
    const grad = ctx.createLinearGradient(0, y, 0, bottomY);
    grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#fca5a5');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
    else ctx.rect(x, y, barW, h);
    ctx.fill();
    ctx.fillStyle = '#64748b'; ctx.font = '9px Tajawal'; ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, H - 6);
    if (d.value > 0 && days.length <= 10) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 9px Tajawal';
      ctx.fillText(`${CURRENCY}${d.value}`, x + barW / 2, y - 4);
    }
  });
}

let quickAdminOrderSortDir = 'desc'; // 'desc' or 'asc'

function toggleQuickAdminOrderSortDir() {
  quickAdminOrderSortDir = quickAdminOrderSortDir === 'desc' ? 'asc' : 'desc';
  adminRenderOrders();
}

let quickAdminOrderFilterStatus = 'all';

const QUICK_ORDER_STATUSES = {
  pending: { label: 'جديد', color: '#f59e0b', bg: '#fef3c7', text: '#92400e', icon: 'fa-box-open' },
  processing: { label: 'قيد التجهيز', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: 'fa-gears' },
  shipped: { label: 'مشحون', color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6', icon: 'fa-truck-fast' },
  completed: { label: 'مستلم / مكتمل', color: '#10b981', bg: '#dcfce7', text: '#166534', icon: 'fa-circle-check' },
  returned: { label: 'مرتجع', color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-rotate-left' },
  cancelled: { label: 'ملغي', color: '#64748b', bg: '#f1f5f9', text: '#334155', icon: 'fa-ban' }
};

function setQuickAdminOrderFilterStatus(status) {
  quickAdminOrderFilterStatus = status;
  quickAdminOrdersPage = 1;
  adminRenderOrders();
}

function updateQuickOrderStatusSelect(idx, newStatus) {
  const o = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!o[idx]) return;
  o[idx]._status = newStatus;
  try { localStorage.setItem('mycart_orders', JSON.stringify(o)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); }
  adminRenderOrders();
}

let quickAdminOrderSearchQuery = '';
let quickAdminOrdersPage = 1;
let quickAdminProductsPage = 1;
let quickAdminCategoriesPage = 1;
let quickAdminCouponsPage = 1;
let quickAdminJoinRequestsPage = 1;
let quickAdminTraderOrdersPage = 1;
const ORDERS_PER_PAGE = 10;
const ITEMS_PER_PAGE = 10;

function setQuickAdminOrderSearchQuery(q) {
  quickAdminOrderSearchQuery = q.trim().toLowerCase();
  quickAdminOrdersPage = 1;
  adminRenderOrders();
}

function setQuickAdminOrdersPage(p) {
  quickAdminOrdersPage = p;
  adminRenderOrders();
  document.getElementById('admin-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildPaginationHtml(currentPage, totalPages, totalItems, setPageFn) {
  if (totalPages <= 1) return '';
  let h = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:16px 0 8px;flex-wrap:wrap">';
  h += '<button onclick="'+setPageFn+'(1)" '+(currentPage===1?'disabled':'')+' style="background:'+(currentPage===1?'#f1f5f9':'var(--accent)')+';color:'+(currentPage===1?'#94a3b8':'#fff')+';border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(currentPage===1?'default':'pointer')+';font-family:inherit" title="الأولى"><i class="fa-solid fa-angles-right"></i></button>';
  h += '<button onclick="'+setPageFn+'('+(currentPage-1)+')" '+(currentPage===1?'disabled':'')+' style="background:'+(currentPage===1?'#f1f5f9':'var(--accent)')+';color:'+(currentPage===1?'#94a3b8':'#fff')+';border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(currentPage===1?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:4px"><i class="fa-solid fa-chevron-right"></i> السابق</button>';
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7 && p > 3 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
      if (p === 4 || p === totalPages - 2) h += '<span style="color:#94a3b8;font-size:.8rem">...</span>';
      continue;
    }
    h += '<button onclick="'+setPageFn+'('+p+')" style="background:'+(p===currentPage?'var(--accent)':'#f1f5f9')+';color:'+(p===currentPage?'#fff':'#475569')+';border:none;width:34px;height:34px;border-radius:8px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">'+p+'</button>';
  }
  h += '<button onclick="'+setPageFn+'('+(currentPage+1)+')" '+(currentPage===totalPages?'disabled':'')+' style="background:'+(currentPage===totalPages?'#f1f5f9':'var(--accent)')+';color:'+(currentPage===totalPages?'#94a3b8':'#fff')+';border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(currentPage===totalPages?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:4px">التالي <i class="fa-solid fa-chevron-left"></i></button>';
  h += '<button onclick="'+setPageFn+'('+totalPages+')" '+(currentPage===totalPages?'disabled':'')+' style="background:'+(currentPage===totalPages?'#f1f5f9':'var(--accent)')+';color:'+(currentPage===totalPages?'#94a3b8':'#fff')+';border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(currentPage===totalPages?'default':'pointer')+';font-family:inherit" title="الأخيرة"><i class="fa-solid fa-angles-left"></i></button>';
  h += '</div>';
  h += '<div style="text-align:center;font-size:.72rem;color:var(--text-muted);margin-bottom:12px">صفحة '+currentPage+' من '+totalPages+' — إجمالي '+totalItems+' عنصر</div>';
  return h;
}

function exportQuickOrdersCSV() {
  const orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!orders.length) { showToast('⚠️ لا توجد طلبات لتصديرها', 'error'); return; }

  let csvContent = "\uFEFFرقم الطلب,التاريخ,اسم العميل,رقم الهاتف,المدينة,العنوان,المنتجات,المجموع,الحالة\n";

  orders.forEach(o => {
    const rawSt = o._status === 'done' ? 'completed' : (o._status || 'pending');
    const stLabel = (QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending).label;
    const itemsStr = (o.items || []).map(i => `${i.name} (${i.qty})`).join(' - ').replace(/"/g, '""');
    const nameStr = (o.customer?.name || '').replace(/"/g, '""');
    const phoneStr = (o.customer?.phone || '').replace(/"/g, '""');
    const cityStr = (o.customer?.city || '').replace(/"/g, '""');
    const addrStr = (o.customer?.address || '').replace(/"/g, '""');
    
    csvContent += `"#${String(o.id).slice(-6)}","${o.date||''}","${nameStr}","${phoneStr}","${cityStr}","${addrStr}","${itemsStr}","${o.total?.toFixed(2)||'0'}","${stLabel}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 تم تصدير ملف الطلبات بنجاح', 'success');
}

function adminRenderOrders() {
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  document.getElementById('adminOrderBadge').textContent = allOrders.length;

  const counts = {
    all: allOrders.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    returned: 0,
    cancelled: 0
  };

  allOrders.forEach(o => {
    const st = o._status === 'done' ? 'completed' : (o._status || 'pending');
    if (counts[st] !== undefined) counts[st]++;
    else counts.pending++;
  });

  const filterTabsHtml = `
    <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch">
      <button onclick="setQuickAdminOrderFilterStatus('all')" style="background:${quickAdminOrderFilterStatus==='all'?'#1e293b':'#f1f5f9'};color:${quickAdminOrderFilterStatus==='all'?'#fff':'#475569'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-layer-group"></i> الكل (${counts.all})</button>
      <button onclick="setQuickAdminOrderFilterStatus('pending')" style="background:${quickAdminOrderFilterStatus==='pending'?'#f59e0b':'#fef3c7'};color:${quickAdminOrderFilterStatus==='pending'?'#fff':'#92400e'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-box-open"></i> جديد (${counts.pending})</button>
      <button onclick="setQuickAdminOrderFilterStatus('processing')" style="background:${quickAdminOrderFilterStatus==='processing'?'#3b82f6':'#dbeafe'};color:${quickAdminOrderFilterStatus==='processing'?'#fff':'#1e40af'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-gears"></i> التجهيز (${counts.processing})</button>
      <button onclick="setQuickAdminOrderFilterStatus('shipped')" style="background:${quickAdminOrderFilterStatus==='shipped'?'#8b5cf6':'#ede9fe'};color:${quickAdminOrderFilterStatus==='shipped'?'#fff':'#5b21b6'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-truck-fast"></i> المشحون (${counts.shipped})</button>
      <button onclick="setQuickAdminOrderFilterStatus('completed')" style="background:${quickAdminOrderFilterStatus==='completed'?'#10b981':'#dcfce7'};color:${quickAdminOrderFilterStatus==='completed'?'#fff':'#166534'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-circle-check"></i> المستلم (${counts.completed})</button>
      <button onclick="setQuickAdminOrderFilterStatus('returned')" style="background:${quickAdminOrderFilterStatus==='returned'?'#ef4444':'#fee2e2'};color:${quickAdminOrderFilterStatus==='returned'?'#fff':'#991b1b'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-rotate-left"></i> المرتجع (${counts.returned})</button>
      <button onclick="setQuickAdminOrderFilterStatus('cancelled')" style="background:${quickAdminOrderFilterStatus==='cancelled'?'#64748b':'#f1f5f9'};color:${quickAdminOrderFilterStatus==='cancelled'?'#fff':'#334155'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-ban"></i> الملغي (${counts.cancelled})</button>
    </div>
  `;

  var sortedOrdersWithIdx = allOrders.map((o, idx) => ({ order: o, realIdx: idx }));
  sortedOrdersWithIdx.sort((a, b) => {
    const timeA = a.order.id || 0;
    const timeB = b.order.id || 0;
    return quickAdminOrderSortDir === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (quickAdminOrderFilterStatus !== 'all') {
    sortedOrdersWithIdx = sortedOrdersWithIdx.filter(item => {
      var st = item.order._status === 'done' ? 'completed' : (item.order._status || 'pending');
      return st === quickAdminOrderFilterStatus;
    });
  }

  if (quickAdminOrderSearchQuery) {
    sortedOrdersWithIdx = sortedOrdersWithIdx.filter(item => {
      const o = item.order;
      const idStr = String(o.id || '');
      const name = (o.customer?.name || '').toLowerCase();
      const phone = (o.customer?.phone || '').toLowerCase();
      const city = (o.customer?.city || '').toLowerCase();
      return idStr.includes(quickAdminOrderSearchQuery) || name.includes(quickAdminOrderSearchQuery) || phone.includes(quickAdminOrderSearchQuery) || city.includes(quickAdminOrderSearchQuery);
    });
  }

  var topBar = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="admin-section-title" style="margin:0">جميع الطلبات (${allOrders.length})</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button onclick="exportQuickOrdersCSV()" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534">
          <i class="fa-solid fa-file-csv"></i> تصدير Excel
        </button>
        <button onclick="toggleQuickAdminOrderSortDir()" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;display:inline-flex;align-items:center;gap:6px">
          <i class="fa-solid ${quickAdminOrderSortDir === 'desc' ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide'}"></i>
          <span>${quickAdminOrderSortDir === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
        </button>
      </div>
    </div>

    <!-- Search Input Bar -->
    <div style="position:relative;margin-bottom:12px">
      <i class="fa-solid fa-magnifying-glass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:.85rem"></i>
      <input type="text" placeholder="البحث برقم الطلب، اسم العميل، أو رقم الهاتف..." value="${quickAdminOrderSearchQuery}" oninput="setQuickAdminOrderSearchQuery(this.value)" style="width:100%;padding:9px 36px 9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:.85rem;outline:none;background:var(--card);color:var(--text)">
    </div>
  `;

  document.getElementById('admin-orders').innerHTML = topBar + filterTabsHtml + (() => {
    if (!sortedOrdersWithIdx.length) return '<div class="admin-empty"><i class="fa-solid fa-filter"></i><p>لا توجد طلبات بهذه الحالة</p></div>';
    const totalPages = Math.ceil(sortedOrdersWithIdx.length / ORDERS_PER_PAGE);
    if (quickAdminOrdersPage > totalPages) quickAdminOrdersPage = totalPages;
    const startIdx = (quickAdminOrdersPage - 1) * ORDERS_PER_PAGE;
    const pageItems = sortedOrdersWithIdx.slice(startIdx, startIdx + ORDERS_PER_PAGE);
    const pageHtml = pageItems.map((item) => {
      var o = item.order;
      var realIdx = item.realIdx;
      var rawSt = o._status === 'done' ? 'completed' : (o._status || 'pending');
      var currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;
      var isWholesale = o.wholesale === true || o.isWholesale === true;

      var statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
        var info = QUICK_ORDER_STATUSES[stKey];
        var isCurrent = rawSt === stKey;
        return `<button type="button" onclick="updateQuickOrderStatusSelect(${realIdx}, '${stKey}')" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:4px 10px;border-radius:999px;font-size:.72rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 2px 8px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
      }).join('');

      return `
      <div class="admin-order-card" onclick="adminShowOrderDetail(${realIdx})" style="position:relative;padding-right:48px;cursor:pointer;margin-bottom:12px;border:1px solid var(--border);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.04)">
        <div style="position:absolute;right:0;top:0;bottom:0;width:44px;background:${currSt.bg};border-radius:10px 0 0 10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:${currSt.text}"><i class="fa-solid ${currSt.icon}"></i></div>
        <div class="admin-order-header" style="padding:10px 14px 4px">
          <span class="oid" style="font-size:.95rem">#${String(o.id).slice(-6)}</span>
          ${isWholesale ? '<span style="font-size:.6rem;background:rgba(245,158,11,.15);color:#f59e0b;padding:2px 8px;border-radius:999px;font-weight:800">جملة</span>' : ''}
          <span class="odate">${o.date || ''}</span>
          <span class="ostatus" style="background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:4px;font-size:.75rem"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
        </div>
        <div class="admin-order-body" style="padding:0 14px 12px">
          <div style="display:flex;flex-wrap:wrap;gap:2px 12px;font-size:.82rem;color:var(--text);margin-bottom:4px">
            <span><i class="fa-solid fa-user" style="width:14px;color:var(--accent)"></i> ${o.customer?.name || '—'}</span>
            <span><i class="fa-solid fa-phone" style="width:14px;color:var(--accent)"></i> ${o.customer?.phone || '—'}</span>
            <span><i class="fa-solid fa-location-dot" style="width:14px;color:var(--accent)"></i> ${o.customer?.city || ''} ${o.customer?.address || ''}</span>
          </div>
          <div class="oitems">${o.items?.map(it => `${it.name} × ${it.qty}`).join(' | ') || ''}</div>
          
          <!-- Status Chips Bar -->
          <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="font-size:.7rem;font-weight:800;color:var(--text-muted);margin-bottom:6px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-arrows-rotate"></i> تغيير حالة الطلب:</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center" onclick="event.stopPropagation()">
              ${statusChipsHtml}
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
            <div class="ototal" style="margin:0">${CURRENCY}${o.total?.toFixed(2) || '0.00'}</div>
            <div style="display:flex;gap:6px;align-items:center" onclick="event.stopPropagation()">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminShowOrderDetail(${realIdx})" style="background:#f1f5f9;color:var(--text);padding:4px 8px;font-size:.75rem"><i class="fa-solid fa-pen-to-square"></i> التفاصيل</button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteOrder(${realIdx})" style="padding:4px 8px;font-size:.75rem"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
    /* Pagination UI */
    let pagHtml = '';
    if (totalPages > 1) {
      pagHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:16px 0 8px;flex-wrap:wrap">';
      /* First page */
      pagHtml += '<button onclick="setQuickAdminOrdersPage(1)" '+(quickAdminOrdersPage===1?'disabled':'')+' style="background:'+(quickAdminOrdersPage===1?'#f1f5f9':'var(--accent)')+';color:'+(quickAdminOrdersPage===1?'#94a3b8':'#fff')+';border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(quickAdminOrdersPage===1?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:2px" title="الصفحة الأولى"><i class="fa-solid fa-angles-right"></i></button>';
      /* Previous */
      pagHtml += '<button onclick="setQuickAdminOrdersPage('+(quickAdminOrdersPage-1)+')" '+(quickAdminOrdersPage===1?'disabled':'')+' style="background:'+(quickAdminOrdersPage===1?'#f1f5f9':'var(--accent)')+';color:'+(quickAdminOrdersPage===1?'#94a3b8':'#fff')+';border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(quickAdminOrdersPage===1?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:4px"><i class="fa-solid fa-chevron-right"></i> السابق</button>';
      for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 7 && p > 3 && p < totalPages - 1 && Math.abs(p - quickAdminOrdersPage) > 1) {
          if (p === 4 || p === totalPages - 2) pagHtml += '<span style="color:#94a3b8;font-size:.8rem">...</span>';
          continue;
        }
        pagHtml += '<button onclick="setQuickAdminOrdersPage('+p+')" style="background:'+(p===quickAdminOrdersPage?'var(--accent)':'#f1f5f9')+';color:'+(p===quickAdminOrdersPage?'#fff':'#475569')+';border:none;width:34px;height:34px;border-radius:8px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">'+p+'</button>';
      }
      /* Next */
      pagHtml += '<button onclick="setQuickAdminOrdersPage('+(quickAdminOrdersPage+1)+')" '+(quickAdminOrdersPage===totalPages?'disabled':'')+' style="background:'+(quickAdminOrdersPage===totalPages?'#f1f5f9':'var(--accent)')+';color:'+(quickAdminOrdersPage===totalPages?'#94a3b8':'#fff')+';border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(quickAdminOrdersPage===totalPages?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:4px">التالي <i class="fa-solid fa-chevron-left"></i></button>';
      /* Last page */
      pagHtml += '<button onclick="setQuickAdminOrdersPage('+totalPages+')" '+(quickAdminOrdersPage===totalPages?'disabled':'')+' style="background:'+(quickAdminOrdersPage===totalPages?'#f1f5f9':'var(--accent)')+';color:'+(quickAdminOrdersPage===totalPages?'#94a3b8':'#fff')+';border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:'+(quickAdminOrdersPage===totalPages?'default':'pointer')+';font-family:inherit;display:inline-flex;align-items:center;gap:2px" title="الصفحة الأخيرة"><i class="fa-solid fa-angles-left"></i></button>';
      pagHtml += '</div>';
      pagHtml += '<div style="text-align:center;font-size:.72rem;color:var(--text-muted);margin-bottom:12px">صفحة '+quickAdminOrdersPage+' من '+totalPages+' — إجمالي '+sortedOrdersWithIdx.length+' طلب</div>';
    }
    return pageHtml + pagHtml;
  })();
}

function adminDeleteOrder(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا الطلب؟', function() {
    const o = JSON.parse(localStorage.getItem('mycart_orders')) || [];
    o.splice(idx, 1);
    try { localStorage.setItem('mycart_orders', JSON.stringify(o)); } catch(e) {}
    adminRefreshAll();
  });
}

function exportProductsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 تم تصدير كافة المنتجات بنجاح!', 'success');
}

function triggerImportProducts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          let count = 0;
          
          // Get existing categories
          const storedCats = localStorage.getItem('mycart_categories');
          let cats = [];
          if (storedCats) { try { cats = JSON.parse(storedCats); } catch(ex) {} }
          let catsModified = false;

          imported.forEach(p => {
            if (p.name && p.price !== undefined) {
              if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 1000);
              if (!p.createdAt) p.createdAt = new Date().toLocaleDateString('ar-EG');
              products.unshift(p);
              count++;

              // Extract and add category or brand if missing
              const addCategoryIfMissing = (catName, isBrand) => {
                if (catName && typeof catName === 'string') {
                  const trimmed = catName.trim();
                  if (trimmed && !cats.some(c => c.name === trimmed)) {
                    cats.push({ name: trimmed, image: '', isBrand: isBrand, createdAt: new Date().toLocaleDateString('ar-EG') });
                    catsModified = true;
                  }
                }
              };

              if (p.category) {
                addCategoryIfMissing(p.category, false);
              }
              if (Array.isArray(p.categories)) {
                p.categories.forEach(c => addCategoryIfMissing(c, false));
              }
              if (p.brand) {
                addCategoryIfMissing(p.brand, true);
              }
            }
          });

          saveProductsToLS();
          
          if (catsModified) {
            try {
              localStorage.setItem('mycart_categories', JSON.stringify(cats));
              localStorage.setItem('mycart_admin_categories_sync', Date.now().toString());
            } catch(ex) {}
            if (typeof adminRenderCategories === 'function') adminRenderCategories();
            if (typeof renderCategories === 'function') renderCategories();
          }

          adminRenderProducts();
          showToast(`✅ تم استيراد ${count} منتج بنجاح!`, 'success');
        } else {
          showToast('⚠️ صيغة ملف JSON غير صحيحة', 'error');
        }
      } catch(err) {
        showToast('⚠️ خطأ في قراءة ملف JSON', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function adminRenderProducts() {
  const searchQ = (document.getElementById('adminProdSearch')?.value || '').trim().toLowerCase();
  const filtered = searchQ ? products.filter(p => p.name.toLowerCase().includes(searchQ)) : products;
  const prodTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (quickAdminProductsPage > prodTotalPages) quickAdminProductsPage = prodTotalPages || 1;
  const prodStart = (quickAdminProductsPage - 1) * ITEMS_PER_PAGE;
  const pageProducts = filtered.slice(prodStart, prodStart + ITEMS_PER_PAGE);
  document.getElementById('admin-products').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="admin-section-title" style="margin:0">إدارة المنتجات (${filtered.length})</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="exportProductsJSON()" title="تصدير المنتجات كملف JSON"><i class="fa-solid fa-file-export"></i> تصدير JSON</button>
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="triggerImportProducts()" title="استيراد منتجات من ملف JSON"><i class="fa-solid fa-file-import"></i> استيراد JSON</button>
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="switchAdminTab('addProduct')"><i class="fa-solid fa-plus"></i> إضافة منتج جديد</button>
      </div>
    </div>
<div style="display:flex;gap:6px;margin-bottom:12px;align-items:center">
<input type="checkbox" id="adminSelectAllCb" onchange="adminToggleSelectAll()" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" ${filtered.length && document.querySelectorAll('.admin-prod-cb:checked').length === filtered.length ? 'checked' : ''}>
<div style="position:relative;flex:1">
<i class="fa-solid fa-magnifying-glass" style="position:absolute;right:28px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:.9rem"></i>
<input type="text" id="adminProdSearch" placeholder="بحث في المنتجات باسم المنتج..." value="${searchQ}" oninput="quickAdminProductsPage=1;adminRenderProducts()" style="width:100%;padding:10px 40px 10px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:.85rem;box-sizing:border-box">
</div>
<button class="admin-btn admin-btn-danger admin-btn-sm" id="adminDelSelectedBtn" onclick="adminDeleteSelectedProducts()" style="display:${document.querySelectorAll('.admin-prod-cb:checked').length ? 'inline-flex' : 'none'};gap:4px"><i class="fa-solid fa-trash"></i> حذف المحدد</button>
</div>
    ${pageProducts.length ? pageProducts.map((p, i) => {
      const realIdx = products.indexOf(p);
      const addedDate = p.createdAt || p.dateAdded || 'غير محدد';
      return `
      <div class="admin-prod-row" style="padding:10px 12px">
        <input type="checkbox" class="admin-prod-cb" data-idx="${realIdx}" onchange="adminToggleProdSelect()" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
        <img src="${getProductImages(p)[0]}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid var(--border)">
        <div class="admin-prod-info" style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <strong style="font-size:.88rem">${p.name}</strong>
            ${p.brand ? `<span style="font-weight:700;color:var(--accent);font-size:.7rem;background:rgba(239,68,68,.08);padding:1px 6px;border-radius:4px">[${p.brand}]</span>` : ''}
            ${p.featured ? `<span style="font-size:.65rem;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-weight:800">⭐ مميز</span>` : ''}
            ${p.type === 'bundle' ? `<span style="font-size:.65rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:1px 8px;border-radius:4px;font-weight:800"><i class="fa-solid fa-cubes"></i> بكج</span>` : ''}
          </div>
          <div style="font-size:.72rem;color:var(--text-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px">
            <span style="font-weight:800;color:var(--text)">${CURRENCY}${p.price}</span>
            <span>• التصنيف: ${getProductCats(p).join('، ') || 'عام'}</span>
            ${getProductDiscount(p) ? `<span style="color:#ef4444;font-weight:700"> خصم ${getProductDiscount(p)}%</span>` : ''}
            ${p.type === 'bundle' ? `<span style="color:#f59e0b;font-weight:700"><i class="fa-solid fa-boxes"></i> ${(p.bundleProducts||[]).length} منتجات</span>` : `<span><i class="fa-solid fa-box" style="margin-inline-end:2px"></i> ${p.stock !== undefined ? p.stock : 'غير محدود'}</span>`}
            <span style="margin-right:auto;color:#64748b;font-size:.68rem"><i class="fa-solid fa-calendar-days" style="margin-left:2px;color:#94a3b8"></i> تاريخ الإضافة: <strong>${addedDate}</strong></span>
          </div>
        </div>
        <div class="admin-prod-actions" style="display:flex;gap:4px">
          <a class="admin-btn admin-btn-secondary admin-btn-sm" href="#product/${p.id}" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:5px 9px" title="مشاهدة" onclick="closeAdmin()"><i class="fa-solid fa-eye"></i></a>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminEditProduct(${realIdx})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteProduct(${realIdx})" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `}).join('') : '<div class="admin-empty"><i class="fa-solid fa-box"></i><p>لا توجد منتجات مطابقة للبحث</p></div>'}
    ${buildPaginationHtml(quickAdminProductsPage, prodTotalPages, filtered.length, 'setQuickAdminProductsPage')}
  `;
  if (searchQ) document.getElementById('adminProdSearch')?.focus();
}

function setQuickAdminProductsPage(p) {
  quickAdminProductsPage = p;
  adminRenderProducts();
  document.getElementById('admin-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function adminDeleteSelectedProducts() {
  const cbs = document.querySelectorAll('.admin-prod-cb:checked');
  if (!cbs.length) return;
  showConfirmModal(`هل أنت متأكد من حذف ${cbs.length} منتج؟`, function() {
    const indices = [...cbs].map(cb => parseInt(cb.dataset.idx)).sort((a,b) => b - a);
    indices.forEach(idx => products.splice(idx, 1));
    saveProductsToLS();
    adminRefreshAll();
  });
}

function toggleBrandIndicator(cb) {
  const indicator = document.getElementById('acBrandToggleIndicator');
  const thumb = document.getElementById('acBrandToggleThumb');
  if (!indicator || !thumb) return;
  if (cb.checked) {
    indicator.style.background = 'var(--accent)';
    thumb.style.right = '18px';
  } else {
    indicator.style.background = 'var(--border)';
    thumb.style.right = '2px';
  }
}

let adminEditingCatIdx = null;
let adminCatModalEl = null;

function adminCloseCatModal() {
  if (adminCatModalEl) { document.body.removeChild(adminCatModalEl); adminCatModalEl = null; }
  adminEditingCatIdx = null;
}

function showCategoryModal(editIdx) {
  adminCloseCatModal();
  const isEdit = editIdx !== undefined && editIdx !== null;
  let catData = { name: '', image: '', isBrand: false };
  if (isEdit) {
    const stored = localStorage.getItem('mycart_categories');
    let cats = [];
    if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
    const c = cats[editIdx];
    if (!c) return;
    catData = c;
    adminEditingCatIdx = editIdx;
  }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:20px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:0">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 0">
        <h3 style="font-size:1.05rem;font-weight:800;margin:0">${isEdit ? '✏️ تعديل التصنيف' : '➕ إضافة تصنيف جديد'}</h3>
        <button onclick="adminCloseCatModal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:18px 22px 22px">
        <div style="margin-bottom:14px">
          <label style="font-weight:700;font-size:.8rem;display:block;margin-bottom:4px">اسم التصنيف</label>
          <input type="text" id="acName" placeholder="مثال: جوالات" value="${catData.name}" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box">
        </div>
        <div style="margin-bottom:14px">
          <label style="font-weight:700;font-size:.8rem;display:block;margin-bottom:4px">صورة التصنيف</label>
          <div style="display:flex;gap:10px;align-items:center">
            <input type="text" id="acImage" placeholder="رابط الصورة أو ارفع صورة" value="${catData.image}" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box">
            <button style="padding:9px 14px;border:none;border-radius:10px;background:var(--bg);color:var(--text);cursor:pointer;font-size:1rem;border:1.5px solid var(--border);flex-shrink:0;font-family:inherit" onclick="document.getElementById('acImageFile').click()"><i class="fa-solid fa-upload"></i></button>
            <input type="file" id="acImageFile" accept="image/*" style="display:none" onchange="adminUploadCatImageModal(this)">
            <img id="acPreview" style="width:44px;height:44px;border-radius:10px;object-fit:cover;display:${catData.image ? 'block' : 'none'};border:2px solid var(--border);flex-shrink:0" src="${catData.image || ''}">
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;margin-bottom:6px;transition:.2s">
          <input type="checkbox" id="acIsBrand" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" ${catData.isBrand ? 'checked' : ''} onchange="toggleBrandIndicator(this)">
          <div style="flex:1">
            <div style="font-weight:700;font-size:.8rem;color:var(--text)">🏷️ علامة تجارية</div>
            <div style="font-size:.7rem;color:var(--text-muted)">يظهر في فلتر الماركات بدلاً من تصنيف المنتجات</div>
          </div>
          <div id="acBrandToggleIndicator" style="width:36px;height:20px;border-radius:999px;background:${catData.isBrand ? 'var(--accent)' : 'var(--border)'};position:relative;transition:.3s;flex-shrink:0">
            <div id="acBrandToggleThumb" style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;right:${catData.isBrand ? '18px' : '2px'};transition:.3s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
          </div>
        </label>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button onclick="adminSaveCategoryModal()" style="flex:1;padding:11px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .2s">${isEdit ? '<i class="fa-solid fa-pen"></i> تحديث التصنيف' : '<i class="fa-solid fa-plus"></i> إضافة تصنيف'}</button>
          <button onclick="adminCloseCatModal()" style="padding:11px 18px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;transition:.2s">إلغاء</button>
        </div>
      </div>
    </div>
  `;
  overlay.onclick = function(e) { if (e.target === overlay) adminCloseCatModal(); };
  document.body.appendChild(overlay);
  adminCatModalEl = overlay;
  // Live preview on image input
  const imgInput = document.getElementById('acImage');
  if (imgInput) {
    imgInput.oninput = function() {
      const preview = document.getElementById('acPreview');
      if (this.value.trim()) { preview.src = this.value.trim(); preview.style.display = 'block'; }
      else preview.style.display = 'none';
    };
  }
}

async function adminUploadCatImageModal(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ الصورة كبيرة جداً', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  document.getElementById('acImage').value = url;
  document.getElementById('acPreview').src = url;
  document.getElementById('acPreview').style.display = 'block';
}

function adminToggleCatForm() {
  const catTab = document.getElementById('admin-categories');
  if (!catTab || !catTab.classList.contains('active')) switchAdminTab('categories');
  showCategoryModal();
}

function adminRenderCategories() {
  document.getElementById('admin-categories').innerHTML = `
    <div class="admin-section-title">إدارة التصنيفات</div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <button class="admin-btn admin-btn-primary" onclick="adminToggleCatForm()" style="margin:0"><i class="fa-solid fa-plus"></i> إضافة تصنيف جديد</button>
      <input type="text" id="adminCatSearch" placeholder="بحث..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.8rem;font-family:inherit" oninput="adminRenderCategoriesListOnly()">
    </div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:6px;font-size:.75rem">
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:700">
        <input type="checkbox" id="adminSelectAllCats" onchange="adminToggleSelectAllCats(this)" style="width:14px;height:14px"> تحديد الكل
      </label>
      <button id="adminBulkDeleteCatsBtn" class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminBulkDeleteCategories()" style="display:none;margin-right:auto;font-size:.7rem;padding:2px 8px">
        <i class="fa-solid fa-trash"></i> حذف المحدد
      </button>
    </div>
    <div id="adminCategoriesList"></div>
  `;
  adminRenderCategoriesListOnly();
}

function adminRenderCategoriesListOnly() {
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { 
    try { 
      cats = JSON.parse(stored); 
      let changed = false;
      cats.forEach(c => {
        if (!c.createdAt) {
          c.createdAt = new Date().toLocaleDateString('ar-EG');
          changed = true;
        }
      });
      if (changed) {
        try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
      }
    } catch(e) {} 
  }
  
  const query = (document.getElementById('adminCatSearch')?.value || '').trim().toLowerCase();
  const filtered = cats.map((c, originalIdx) => ({ ...c, originalIdx }))
                       .filter(c => c.name.toLowerCase().includes(query));

  const listContainer = document.getElementById('adminCategoriesList');
  if (!listContainer) return;

  if (!cats.length) {
    listContainer.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-tags"></i><p>لا يوجد تصنيفات بعد</p></div>';
    return;
  }

  if (!filtered.length) {
    listContainer.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-tags"></i><p>لا توجد نتائج مطابقة</p></div>';
    const selectAllBtn = document.getElementById('adminSelectAllCats');
    if (selectAllBtn) selectAllBtn.checked = false;
    const bulkBtn = document.getElementById('adminBulkDeleteCatsBtn');
    if (bulkBtn) bulkBtn.style.display = 'none';
    return;
  }

  const catTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (quickAdminCategoriesPage > catTotalPages) quickAdminCategoriesPage = catTotalPages || 1;
  const catStart = (quickAdminCategoriesPage - 1) * ITEMS_PER_PAGE;
  const pageCats = filtered.slice(catStart, catStart + ITEMS_PER_PAGE);

  listContainer.innerHTML = pageCats.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:4px;${c.isBrand ? 'border-right:3px solid var(--accent);background:rgba(239,68,68,.02)' : ''}">
      <input type="checkbox" class="admin-cat-checkbox" data-name="${c.name}" onchange="adminUpdateBulkDeleteBtn()" style="width:16px;height:16px;cursor:pointer;margin:0">
      <div style="position:relative">
        <img src="${c.image || 'https://placehold.co/48x48/e2e8f0/64748b?text=' + encodeURIComponent(c.name.slice(0,2))}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;background:#e2e8f0;${c.isBrand ? 'border:2px solid var(--accent)' : ''}">
        ${c.isBrand ? '<span style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.45rem"><i class="fa-solid fa-award"></i></span>' : ''}
      </div>
      <div style="flex:1">
        <strong style="font-size:.85rem;${c.isBrand ? 'color:var(--accent)' : ''}">${c.name}</strong>
        ${c.isBrand ? '<span style="font-size:.6rem;background:var(--accent);color:#fff;padding:2px 7px;border-radius:4px;margin-inline-start:6px;font-weight:800;display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-award"></i> ماركة</span>' : ''}
        <div style="display:flex;align-items:center;gap:12px;font-size:.72rem;color:var(--text-muted);margin-top:2px">
          <span>${products.filter(p => c.isBrand ? (p.brand === c.name) : getProductCats(p).includes(c.name)).length} منتج</span>
          <span style="display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-calendar-days" style="font-size:.65rem;color:#94a3b8"></i> تاريخ الإضافة: <strong>${c.createdAt || 'غير محدد'}</strong></span>
        </div>
      </div>
      <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="showCategoryModal(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-pen"></i></button>
      <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteCategory(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') + buildPaginationHtml(quickAdminCategoriesPage, catTotalPages, filtered.length, 'setQuickAdminCategoriesPage');

  adminUpdateSelectAllState();
}

function setQuickAdminCategoriesPage(p) {
  quickAdminCategoriesPage = p;
  adminRenderCategoriesListOnly();
  document.getElementById('adminCategoriesList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function adminUpdateBulkDeleteBtn() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const bulkBtn = document.getElementById('adminBulkDeleteCatsBtn');
  if (bulkBtn) {
    bulkBtn.style.display = checkedCount > 0 ? 'inline-block' : 'none';
    bulkBtn.innerHTML = `<i class="fa-solid fa-trash"></i> حذف المحدد (${checkedCount})`;
  }
  const selectAllBtn = document.getElementById('adminSelectAllCats');
  if (selectAllBtn && checkboxes.length > 0) {
    selectAllBtn.checked = checkedCount === checkboxes.length;
  }
}

function adminUpdateSelectAllState() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const selectAllBtn = document.getElementById('adminSelectAllCats');
  if (selectAllBtn) {
    selectAllBtn.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
  }
  adminUpdateBulkDeleteBtn();
}

function adminToggleSelectAllCats(el) {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  checkboxes.forEach(cb => cb.checked = el.checked);
  adminUpdateBulkDeleteBtn();
}

function adminBulkDeleteCategories() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox:checked');
  const namesToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-name'));
  if (!namesToDelete.length) return;
  
  showConfirmModal(`هل أنت متأكد من حذف ${namesToDelete.length} تصنيفات محددة؟`, function() {
    const stored = localStorage.getItem('mycart_categories');
    let cats = [];
    if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
    
    cats = cats.filter(c => !namesToDelete.includes(c.name));
    
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    
    const selectAllBtn = document.getElementById('adminSelectAllCats');
    if (selectAllBtn) selectAllBtn.checked = false;
    
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم حذف التصنيفات المحددة', 'success');
  });
}

function adminSaveCategoryModal() {
  const name = document.getElementById('acName').value.trim();
  const image = document.getElementById('acImage').value.trim();
  const isBrand = document.getElementById('acIsBrand').checked;
  if (!name) { showToast('يرجى إدخال اسم التصنيف', 'error'); return; }
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }

  if (adminEditingCatIdx !== null) {
    const existing = cats[adminEditingCatIdx];
    if (!existing) { adminCloseCatModal(); return; }
    if (name !== existing.name && cats.some((c, i) => i !== adminEditingCatIdx && c.name === name)) {
      showToast('هذا التصنيف موجود مسبقاً', 'error'); return;
    }
    cats[adminEditingCatIdx] = { 
      name, 
      image, 
      isBrand, 
      createdAt: existing.createdAt || new Date().toLocaleDateString('ar-EG') 
    };
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    adminCloseCatModal();
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم تحديث التصنيف', 'success');
    return;
  }

  if (cats.some(c => c.name === name)) { showToast('هذا التصنيف موجود مسبقاً', 'error'); return; }
  cats.unshift({ 
    name, 
    image, 
    isBrand, 
    createdAt: new Date().toLocaleDateString('ar-EG') 
  });
  try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
  try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
  adminCloseCatModal();
  adminRenderCategories();
  renderCategories();
  showToast('✅ تم إضافة التصنيف', 'success');
}

function showConfirmModal(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:60000;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:20px;max-width:380px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:28px 24px 22px;text-align:center">
      <div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.5rem;color:#ef4444"><i class="fa-solid fa-trash-can"></i></div>
      <h3 style="font-size:1rem;font-weight:800;margin:0 0 6px">تأكيد الحذف</h3>
      <p style="font-size:.85rem;color:var(--text-muted);margin:0 0 18px">${msg}</p>
      <div style="display:flex;gap:10px">
        <button id="confirmYesBtn" style="flex:1;padding:10px;border:none;border-radius:12px;background:#ef4444;color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">نعم، احذف</button>
        <button id="confirmNoBtn" style="padding:10px 18px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit">إلغاء</button>
      </div>
    </div>
  `;
  overlay.onclick = function(e) { if (e.target === overlay) { document.body.removeChild(overlay); } };
  document.body.appendChild(overlay);
  document.getElementById('confirmYesBtn').onclick = function() { document.body.removeChild(overlay); onConfirm(); };
  document.getElementById('confirmNoBtn').onclick = function() { document.body.removeChild(overlay); };
}

function adminDeleteCategory(idx) {
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
  const c = cats[idx];
  if (!c) return;
  showConfirmModal(`هل أنت متأكد من حذف التصنيف <strong>"${c.name}"</strong>؟`, function() {
    cats.splice(idx, 1);
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    if (adminEditingCatIdx === idx) adminCloseCatModal();
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم حذف التصنيف', 'success');
  });
}

function adminDeleteProduct(idx) {
  var pname = products[idx] ? products[idx].name : 'هذا المنتج';
  showConfirmModal('هل أنت متأكد من حذف المنتج <strong>"' + pname + '"</strong>؟', function() {
    products.splice(idx, 1);
    saveProductsToLS();
    adminRefreshAll();
  });
}

function adminRenderImageList(imgs) {
  const container = document.getElementById('apImageList');
  if (!container) return;
  if (!imgs || !imgs.length) {
    container.innerHTML = '<div style="font-size:.8rem;color:var(--text-muted)">لم يتم إضافة صور بعد</div>';
    return;
  }
  let html = `<div style="margin-bottom:10px;position:relative">
    <img src="${imgs[0]}" style="width:100%;height:130px;border-radius:10px;object-fit:cover;border:3px solid var(--accent);display:block;background:var(--card)">
    <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
      <button type="button" onclick="adminRemoveImg(0)" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,0.9);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-trash-can"></i></button>
      <button type="button" onclick="adminMoveImg(0,1)" ${imgs.length === 1 ? 'disabled style="opacity:.3"' : ''} style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-left"></i></button>
    </div>
    <div style="position:absolute;bottom:8px;right:8px;background:var(--card);padding:3px 10px;border-radius:6px;font-size:.7rem;font-weight:600;color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.12)">★ ${imgs[0].startsWith('data:') ? 'الصورة الرئيسية' : 'الصورة الرئيسية'}</div>
  </div>`;
  if (imgs.length > 1) {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    for (let i = 1; i < imgs.length; i++) {
      html += `<div style="position:relative;width:70px">
        <img src="${imgs[i]}" onclick="adminSetPrimaryImg(${i})" style="width:100%;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid var(--border);display:block">
        <div style="display:flex;gap:2px;margin-top:2px;justify-content:center">
          <button type="button" onclick="adminMoveImg(${i},-1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-right"></i></button>
          <button type="button" onclick="adminSetPrimaryImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit" title="تعيين كأساسية"><i class="fa-solid fa-star"></i></button>
          <button type="button" onclick="adminMoveImg(${i},1)" ${i === imgs.length - 1 ? 'disabled style="opacity:.3"' : ''} style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" onclick="adminRemoveImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid #ef4444;background:#fef2f2;color:#ef4444;cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function adminAddOption() {
  const container = document.getElementById('apOptions');
  const div = document.createElement('div');
  div.className = 'option-card';
  div.innerHTML = `<div class="option-header">
    <input type="text" class="optName" placeholder="اسم الخيار">
    <select class="optType" onchange="optTypeChange(this)">
      <option value="text">🎨 نص</option>
      <option value="color">🎨 لون</option>
      <option value="image">🖼️ صورة</option>
    </select>
    <button type="button" onclick="adminRemoveOption(this)"><i class="fa-solid fa-trash-can"></i></button>
  </div>
  <div class="optValues">
    <button type="button" onclick="adminAddOptValue(this)" style="padding:4px 10px;border:1px dashed var(--border);border-radius:6px;background:none;cursor:pointer;color:var(--text-muted);font-size:.7rem;font-family:inherit"><i class="fa-solid fa-plus"></i> إضافة اختيار</button>
  </div>`;
  container.appendChild(div);
}

function adminAddOptValue(btn) {
  const container = btn.closest('.optValues');
  const type = container.closest('.option-card').querySelector('.optType').value;
  const div = document.createElement('div');
  div.className = 'opt-value';
  div.innerHTML = `<input type="text" class="optV" placeholder="اختيار">
    <label>السعر<input type="number" class="optPrice" step="0.01" value="0"></label>
    <label>جملة <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:pointer;font-size:.75rem;margin-right:2px;" onclick="showTooltipExample(this, 'هذا السعر يظهر فقط للزبائن المسجلين كتجار جملة في متجرك')" title="توضيح"></i><input type="number" class="optWholesalePrice" step="0.01" value="0"></label>
    ${type==='color'?`<input type="color" class="optExtra" value="#000000">`:type==='image'?`<img class="optExtra" src="" onclick="showOptImgChooser(this)"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="">`}
    <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value=""></label>
    <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  btn.before(div);
}

function adminResetForm() {
  adminEditingId = null;
  adminLoadForm();
}

function adminLoadSettings() {
  const s = loadAdminSettings();
  const logo = localStorage.getItem('mycart_logo');
  const mode = s.logoDisplayMode || 'both';
  const scrolledMode = s.scrolledHeader || 'both';
  document.getElementById('admin-settings').innerHTML = `
    <div class="admin-section-title">الإعدادات المعروضة</div>
    <div class="admin-settings-grid">
      <div class="admin-card">
        <h4><i class="fa-solid fa-store"></i> معلومات الهيدر والشعار</h4>
        <div class="admin-form-group"><label>اسم المتجر</label><input type="text" id="asName" value="${s.storeName || 'متجري'}"></div>
        <div class="admin-form-group"><label>وصف المتجر (Tagline)</label><input type="text" id="asTagline" value="${s.tagline || 'اختر منتجك المفضل'}"></div>
        <div class="admin-form-group"><label>طريقة عرض الهيدر والشعار</label>
          <select id="asLogoMode" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
            <option value="both" ${mode==='both'?'selected':''}>إظهار الشعار + اسم المتجر والوصف</option>
            <option value="logo_only" ${mode==='logo_only'?'selected':''}>إظهار الشعار فقط</option>
            <option value="text_only" ${mode==='text_only'?'selected':''}>إظهار اسم المتجر والوصف فقط (إخفاء الشعار)</option>
            <option value="none" ${mode==='none'?'selected':''}>إخفاء الشعار والاسم والوصف بالكامل</option>
          </select>
        </div>
        <div class="admin-form-group"><label>عند تصغير الهيدر (التمرير): إظهار</label>
          <select id="asScrolledHeader" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
            <option value="both" ${scrolledMode==='both'?'selected':''}>الشعار + اسم المتجر معاً</option>
            <option value="logo" ${scrolledMode==='logo'?'selected':''}>الشعار فقط (إخفاء الاسم)</option>
            <option value="name" ${scrolledMode==='name'?'selected':''}>اسم المتجر فقط (إخفاء الشعار)</option>
          </select>
        </div>
        <div class="admin-form-group"><label>صورة الشعار</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <img class="admin-preview-img" id="asLogo" src="${logo || ''}" style="${logo ? 'display:block;max-width:180px;max-height:60px;width:auto;height:auto;border-radius:10px;object-fit:contain' : 'display:none'}">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadLogo()"><i class="fa-solid fa-upload"></i> تغيير</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" id="asRemoveLogoBtn" onclick="adminRemoveLogo()" style="${logo ? 'display:inline-block' : 'display:none'}"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
        <div class="admin-form-group"><label>أيقونة التبويب (Favicon)</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <img class="admin-preview-img" id="asFavicon" src="${s.favicon || localStorage.getItem('mycart_favicon') || ''}" style="${(s.favicon || localStorage.getItem('mycart_favicon')) ? 'display:block;max-width:32px;max-height:32px;width:32px;height:32px;border-radius:4px;object-fit:contain' : 'display:none'}">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadFavicon()"><i class="fa-solid fa-upload"></i> تغيير الأيقونة</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" id="asRemoveFaviconBtn" onclick="adminRemoveFavicon()" style="${(s.favicon || localStorage.getItem('mycart_favicon')) ? 'display:inline-block' : 'display:none'}"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-sliders"></i> إعدادات المتجر العامة</h4>
        <div class="admin-form-group"><label>نسبة خصم الجملة (%) <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'تُستخدم تلقائياً عندما لا يوجد سعر جملة مخصص للمنتج. مثال: إذا كانت النسبة 20% والسعر 100، يصبح سعر الجملة 80. يمكنك تعديل هذه النسبة من هنا.')"></i></label><input type="number" id="asWDiscount" min="1" max="90" value="${s.wholesaleDiscount || 15}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem"></div>
        <div class="admin-form-group"><label>العملة</label><input type="text" id="asCurrency" value="${s.currency || '₪'}" maxlength="5"></div>
        <div class="admin-form-group"><label>الموقع</label>
          <select id="asLang" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
            <option value="ar" ${(s.lang||'ar')==='ar'?'selected':''}>🇸🇦 العربية</option>
            <option value="en" ${s.lang==='en'?'selected':''}>🇬🇧 English</option>
          </select>
        </div>
        <div class="admin-form-group"><label>اللون الأساسي</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="asAccent" value="${s.accentColor || '#ef4444'}" oninput="document.getElementById('asAccentVal').textContent=this.value" style="width:44px;height:40px;border:none;border-radius:6px;cursor:pointer;padding:0;background:none"><span style="font-size:.75rem;color:var(--text-muted)" id="asAccentVal">${s.accentColor || '#ef4444'}</span></div></div>
        <div class="admin-form-group"><div style="font-size:.72rem;color:var(--text-muted);background:color-mix(in srgb,var(--accent,var(--primary,#ef4444)) 8%,transparent);border:1px dashed color-mix(in srgb,var(--accent,var(--primary,#ef4444)) 25%,transparent);border-radius:8px;padding:8px 10px"><i class="fa-solid fa-id-card"></i> بيانات الاتصال والعنوان وساعات العمل والخريطة وصور المتجر أصبحت الآن في تبويب <b>بطاقة المتجر</b>.</div></div>
        <div class="admin-form-group"><label>خلفية الهيدر</label>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadBg()"><i class="fa-solid fa-image"></i> تغيير الخلفية</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminRemoveBg()"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-truck"></i> مناطق التوصيل</h4>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input type="text" id="asZoneName" placeholder="اسم المنطقة" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
          <input type="number" id="asZonePrice" placeholder="السعر" min="0" step="0.5" style="width:80px;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminAddZone()" style="padding:8px 14px;font-size:.8rem"><i class="fa-solid fa-plus"></i></button>
        </div>
        <div id="adminZonesList">${renderAdminZones()}</div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-database"></i> البيانات</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminExport()"><i class="fa-solid fa-file-export"></i> تصدير</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="document.getElementById('adminImportFile').click()"><i class="fa-solid fa-file-import"></i> استيراد</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminResetAll()"><i class="fa-solid fa-trash"></i> إعادة تعيين</button>
        </div>
        <input type="file" id="adminImportFile" accept=".json" style="display:none" onchange="adminImport(event)">
        <div id="adminDataStatus" style="font-size:.7rem;color:var(--text-muted);margin-top:6px"></div>
      </div>
    </div>
    <button class="admin-btn admin-btn-primary" onclick="adminSaveSettings()" style="margin-top:12px;width:100%"><i class="fa-solid fa-floppy-disk"></i> حفظ كافة الإعدادات والشعار</button>
  `;
  renderAdminStoreImages();
}

function adminAddZone() {
  const name = document.getElementById('asZoneName').value.trim();
  const price = parseFloat(document.getElementById('asZonePrice').value);
  if (!name || isNaN(price) || price < 0) { showToast('أدخل اسم المنطقة والسعر', 'error'); return; }
  const zones = loadDeliveryZones();
  zones.push({ name, price });
  saveDeliveryZones(zones);
  document.getElementById('asZoneName').value = '';
  document.getElementById('asZonePrice').value = '';
  adminLoadSettings();
  showToast('✅ تم إضافة منطقة التوصيل', 'success');
}

function adminDeleteZone(idx) {
  const zones = loadDeliveryZones();
  zones.splice(idx, 1);
  saveDeliveryZones(zones);
  adminLoadSettings();
}

async function adminUploadLogo() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, 800, 600, async function(url) {
      showToast('🔄 جاري رفع الشعار...', 'info');
      const imgbbUrl = await uploadToImgbb(url);
      if (!imgbbUrl) return;
      const logoImg = document.getElementById('asLogo');
      const scLogoImg = document.getElementById('scLogo');
      const rmBtn = document.getElementById('asRemoveLogoBtn');
      if (logoImg) { logoImg.src = imgbbUrl; logoImg.style.display = 'block'; }
      if (scLogoImg) { scLogoImg.src = imgbbUrl; scLogoImg.style.display = 'inline-block'; }
      if (rmBtn) rmBtn.style.display = 'inline-block';
      
      try { localStorage.setItem('mycart_logo', imgbbUrl); } catch(ex) {}
      adminSettings.logo = imgbbUrl;
      try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
      
      showToast('✅ تم تغيير الشعار', 'success');
      init();
    });
  };
  input.click();
}

function adminRemoveLogo() {
  localStorage.removeItem('mycart_logo');
  delete adminSettings.logo;
  try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
  
  const logoImg = document.getElementById('asLogo');
  const rmBtn = document.getElementById('asRemoveLogoBtn');
  if (logoImg) logoImg.style.display = 'none';
  if (rmBtn) rmBtn.style.display = 'none';
  
  showToast('✅ تم إزالة الشعار', 'success');
  init();
}

async function adminUploadBg() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, 1200, 800, async function(url) {
      showToast('🔄 جاري رفع الخلفية...', 'info');
      const imgbbUrl = await uploadToImgbb(url);
      if (!imgbbUrl) return;
      try { localStorage.setItem('mycart_bg', imgbbUrl); } catch(ex) {}
      document.getElementById('header').style.setProperty('--header-bg', `url(${imgbbUrl})`);
      document.getElementById('header').classList.add('has-bg');
      showToast('✅ تم تغيير الخلفية', 'success');
    });
  };
  input.click();
}

function adminRemoveBg() {
  localStorage.removeItem('mycart_bg');
  const header = document.getElementById('header');
  if (header) {
    header.style.removeProperty('--header-bg');
    header.classList.remove('has-bg');
  }
  showToast('✅ تم إزالة الخلفية', 'success');
}

function adminSaveSettings() {
  const nameEl = document.getElementById('asName');
  const tagEl = document.getElementById('asTagline');
  const modeEl = document.getElementById('asLogoMode');
  const currEl = document.getElementById('asCurrency');
  const accentEl = document.getElementById('asAccent');

  const langEl = document.getElementById('asLang');
  const prev = loadAdminSettings();
  const s = {
    storeName: (nameEl ? nameEl.value.trim() : '') || 'متجري',
    tagline: (tagEl ? tagEl.value.trim() : '') || 'اختر منتجك المفضل',
    phone: prev.phone || '',
    whatsapp: prev.whatsapp || '',
    email: prev.email || '',
    address: prev.address || '',
    hours: prev.hours || '',
    lat: prev.lat || '',
    lng: prev.lng || '',
    logoDisplayMode: modeEl ? modeEl.value : 'both',
    scrolledHeader: document.getElementById('asScrolledHeader')?.value || 'both',
    wholesaleDiscount: parseInt(document.getElementById('asWDiscount')?.value) || 15,
    currency: (currEl ? currEl.value.trim() : '') || '₪',
    accentColor: accentEl ? accentEl.value : '#ef4444',
    lang: langEl ? langEl.value : 'ar',
    logo: adminSettings.logo,
    favicon: adminSettings.favicon,
    showStoreCard: adminSettings.showStoreCard !== false,
    social: adminSettings.social || {},
    storeImages: (function() { try { return JSON.parse(localStorage.getItem('mycart_store_images_temp')) || []; } catch(e) { return []; } })()
  };
  try { localStorage.setItem('mycart_admin_settings', JSON.stringify(s)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
  adminSettings = s;
  WHOLESALE_CODE = s.wholesaleCode;
  CURRENCY = s.currency;
  init();
  adminMarkSaved();
  showToast('✅ تم حفظ الإعدادات والشعار', 'success');
}

function adminRenderStoreCard() {
  const s = loadAdminSettings();
  const social = s.social || {};
  const acc = s.accentColor || '#ef4444';
  const logo = localStorage.getItem('mycart_logo') || s.logo || '';
  const fields = [
    ['facebook', 'fa-brands fa-facebook-f', '#1877f2', 'فيسبوك', 'رابط صفحتك على فيسبوك'],
    ['instagram', 'fa-brands fa-instagram', '#e1306c', 'انستغرام', 'رابط حسابك على انستغرام'],
    ['twitter', 'fa-brands fa-x-twitter', '#0f1419', 'إكس (تويتر)', 'رابط حسابك على إكس'],
    ['tiktok', 'fa-brands fa-tiktok', '#010101', 'تيك توك', 'رابط حسابك على تيك توك'],
    ['youtube', 'fa-brands fa-youtube', '#ff0000', 'يوتيوب', 'رابط قناتك على يوتيوب'],
    ['telegram', 'fa-brands fa-telegram', '#229ed9', 'تيليغرام', 'رابط قناتك على تيليغرام'],
    ['snapchat', 'fa-brands fa-snapchat', '#fffc00', 'سناب شات', 'رابط حسابك على سناب شات'],
    ['website', 'fa-solid fa-globe', '#0ea5e9', 'الموقع الإلكتروني', 'رابط موقعك الخاص (إن وجد)']
  ];
  const esc = function(v){ return (v||'').replace(/"/g, '&quot;'); };
  document.getElementById('admin-storecard').innerHTML = `
    <div class="admin-section-title">بطاقة تعريف المتجر</div>
    <div class="admin-settings-grid">
      <div class="admin-card">
        <h4><i class="fa-solid fa-id-card"></i> تفعيل البطاقة</h4>
        <div class="admin-form-group">
          <label style="display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer">
            <span>إظهار بطاقة المتجر للزبائن (زر المتجر في الهيدر)</span>
            <input type="checkbox" id="scShow" ${s.showStoreCard !== false ? 'checked' : ''} style="width:20px;height:20px;accent-color:${acc};cursor:pointer">
          </label>
          <p style="font-size:.72rem;color:var(--text-muted);margin:4px 0 0">عند إلغاء التفعيل يختفي زر المتجر من الهيدر ولا يستطيع الزبون فتح البطاقة.</p>
        </div>
        <div class="admin-form-group"><label>اسم المتجر</label><input type="text" id="scName" value="${esc(s.storeName || 'متجري')}"></div>
        <div class="admin-form-group"><label>الوصف المختصر (Tagline)</label><input type="text" id="scTagline" value="${esc(s.tagline || 'اختر منتجك المفضل')}"></div>
        <div class="admin-form-group"><label>شعار المتجر</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <img id="scLogo" src="${logo}" style="${logo ? 'display:inline-block;max-width:140px;max-height:48px;width:auto;height:auto;border-radius:8px;object-fit:contain' : 'display:none'}">
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadLogo()"><i class="fa-solid fa-upload"></i> اختيار الشعار</button>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-address-book"></i> بيانات الاتصال</h4>
        <div class="admin-form-group"><label>هاتف المتجر</label><input type="text" id="scPhone" value="${esc(s.phone || '')}" placeholder="05XXXXXXXX" ></div>
        <div class="admin-form-group"><label>رقم واتساب</label><input type="text" id="scWhatsapp" value="${esc(s.whatsapp || '')}" placeholder="05XXXXXXXX"></div>
        <div class="admin-form-group"><label>البريد الإلكتروني</label><input type="email" id="scEmail" value="${esc(s.email || '')}" placeholder="example@mail.com"></div>
        <div class="admin-form-group"><label>عنوان المتجر</label><input type="text" id="scAddress" value="${esc(s.address || '')}" placeholder="الخليل - عقبة تفوح"></div>
        <div class="admin-form-group"><label>ساعات العمل</label><input type="text" id="scHours" value="${esc(s.hours || '')}" placeholder="السبت - الخميس 9ص - 10م"></div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-map-location-dot"></i> الخريطة والموقع</h4>
        <div class="admin-form-group"><label>خط العرض (Latitude)</label><input type="text" id="scLat" value="${esc(s.lat || '')}" placeholder="31.9038"></div>
        <div class="admin-form-group"><label>خط الطول (Longitude)</label><input type="text" id="scLng" value="${esc(s.lng || '')}" placeholder="35.2034"></div>
        <div class="admin-form-group"><label>تحديد الموقع تلقائياً</label>
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminDetectStoreLocation()"><i class="fa-solid fa-location-crosshairs"></i> استخدم موقعي الحالي</button>
        </div>
        <div id="scLocStatus" style="font-size:.7rem;color:var(--text-muted);margin-top:4px"></div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-image"></i> صور توثيق المتجر</h4>
        <p style="font-size:.72rem;color:var(--text-muted);margin-bottom:8px">أضف صوراً توثق موقع المتجر ومكانه (تظهر في بطاقة تعريف المتجر).</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="document.getElementById('scStoreImages').click()"><i class="fa-solid fa-upload"></i> إضافة صورة</button>
          <input type="file" id="scStoreImages" accept="image/*" multiple style="display:none" onchange="adminAddStoreImages(event)">
        </div>
        <div id="scStoreImagesList" style="display:flex;flex-wrap:wrap;gap:8px"></div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-share-nodes"></i> روابط التواصل الاجتماعي</h4>
        <p style="font-size:.72rem;color:var(--text-muted);margin-bottom:8px">ضع روابط كاملة (تظهر كأيقونات داخل بطاقة المتجر). اترك الحقل فارغاً لإخفاء الأيقونة.</p>
        ${fields.map(f => `
          <div class="admin-form-group">
            <label style="display:flex;align-items:center;gap:8px"><i class="${f[1]}" style="color:${f[2]};width:22px;text-align:center"></i> ${f[3]}</label>
            <input type="url" id="sc_${f[0]}" value="${esc(social[f[0]] || '')}" placeholder="${f[4]}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem" dir="ltr">
          </div>`).join('')}
      </div>
      <div class="admin-card" style="grid-column:1/-1">
        <button class="admin-btn admin-btn-primary" onclick="adminSaveStoreCard()" style="width:100%;padding:12px"><i class="fa-solid fa-floppy-disk"></i> حفظ بطاقة المتجر</button>
      </div>
    </div>`;
  renderAdminStoreImages();
}

function adminSaveStoreCard() {
  const s = loadAdminSettings();
  const g = function(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  s.storeName = g('scName') || 'متجري';
  s.tagline = g('scTagline') || 'اختر منتجك المفضل';
  s.phone = g('scPhone');
  s.whatsapp = g('scWhatsapp');
  s.email = g('scEmail');
  s.address = g('scAddress');
  s.hours = g('scHours');
  s.lat = g('scLat');
  s.lng = g('scLng');
  const social = s.social || {};
  ['facebook','instagram','twitter','tiktok','youtube','telegram','snapchat','website'].forEach(function(k) {
    const el = document.getElementById('sc_' + k);
    if (el) social[k] = el.value.trim();
  });
  s.social = social;
  s.showStoreCard = document.getElementById('scShow') ? document.getElementById('scShow').checked : (s.showStoreCard !== false);
  try { localStorage.setItem('mycart_admin_settings', JSON.stringify(s)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
  adminSettings = s;
  try { localStorage.setItem('mycart_store_images_temp', JSON.stringify(getAdminStoreImages())); } catch(e) {}
  applyStoreCardVisibility();
  init();
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  showToast('✅ تم حفظ بطاقة المتجر', 'success');
}

function adminDetectStoreLocation() {
  const status = document.getElementById('scLocStatus');
  if (!status) return;
  if (!navigator.geolocation) { status.textContent = '❌ المتصفح لا يدعم تحديد الموقع'; return; }
  status.textContent = '⏳ جاري تحديد موقعك...';
  navigator.geolocation.getCurrentPosition(function(pos) {
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);
    const latEl = document.getElementById('scLat');
    const lngEl = document.getElementById('scLng');
    if (latEl) latEl.value = lat;
    if (lngEl) lngEl.value = lng;
    status.textContent = '✅ تم تحديد الموقع: ' + lat + ', ' + lng;
  }, function(err) {
    status.textContent = '❌ تعذر تحديد الموقع (' + err.message + ')';
  });
}

function renderAdminStoreImages() {
  ['scStoreImagesList'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
      const imgs = getAdminStoreImages();
      el.innerHTML = imgs.length
        ? imgs.map(function(img, idx) { return '<div style="position:relative;width:64px;height:64px;border-radius:10px;overflow:hidden;border:1px solid var(--border)"><img src="' + img + '" style="width:100%;height:100%;object-fit:cover;display:block"><button type="button" onclick="adminRemoveStoreImage(' + idx + ')" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(239,68,68,.9);color:#fff;cursor:pointer;font-size:.7rem;line-height:1;display:flex;align-items:center;justify-content:center">×</button></div>'; }).join('')
        : '<div style="font-size:.72rem;color:var(--text-muted)">لا توجد صور مضافة بعد</div>';
    }
  });
}

function applyStoreCardVisibility() {
  const btn = document.getElementById('storeInfoBtn');
  if (!btn) return;
  const show = adminSettings.showStoreCard !== false;
  btn.style.display = show ? '' : 'none';
}

function getAdminStoreImages() {
  try {
    const temp = JSON.parse(localStorage.getItem('mycart_store_images_temp'));
    if (Array.isArray(temp)) return temp;
  } catch(e) {}
  try { const s = JSON.parse(localStorage.getItem('mycart_admin_settings')) || {}; return s.storeImages || []; } catch(e) { return []; }
}

async function adminAddStoreImages(event) {
  const files = event.target.files;
  if (!files || !files.length) return;
  const imgs = getAdminStoreImages();
  const max = 6;
  const tasks = [];
  Array.from(files).forEach(function(file) {
    if (imgs.length + tasks.length >= max) return;
    if (!file.type || file.type.indexOf('image') === -1) return;
    tasks.push(new Promise(function(resolve) {
      const reader = new FileReader();
      reader.onload = function(e) {
        compressStoreImage(e.target.result, function(dataUrl) {
          resolve(dataUrl);
        });
      };
      reader.readAsDataURL(file);
    }));
  });
  if (!tasks.length) { showToast('⚠️ لا يمكن إضافة المزيد من الصور (الحد الأقصى 6)', 'error'); return; }
  showToast('⏳ جاري رفع الصور إلى ImgBB...', 'info');
  const compressed = await Promise.all(tasks);
  for (const dataUrl of compressed) {
    let url = dataUrl;
    if (typeof uploadToImgbb === 'function') {
      try { url = await uploadToImgbb(dataUrl); } catch(e) {}
      if (!url) url = dataUrl;
    }
    imgs.push(url);
  }
  try { localStorage.setItem('mycart_store_images_temp', JSON.stringify(imgs)); }
  catch(err) { showToast('⚠️ مساحة التخزين ممتلئة - أزل بعض الصور', 'error'); }
  renderAdminStoreImages();
  if (typeof adminMarkUnsaved === 'function') adminMarkUnsaved('storeImages');
  event.target.value = '';
  showToast('✅ تمت إضافة الصور (اضغط حفظ كافة الإعدادات)', 'success');
}

function compressStoreImage(dataUrl, cb) {
  const img = new Image();
  img.onload = function() {
    let w = img.width, h = img.height;
    const maxW = 900, maxH = 900;
    if (w > maxW) { h = h * maxW / w; w = maxW; }
    if (h > maxH) { w = w * maxH / h; h = maxH; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let quality = 0.6;
    let out = canvas.toDataURL('image/jpeg', quality);
    while (out.length > 200000 && quality > 0.3) { quality -= 0.1; out = canvas.toDataURL('image/jpeg', quality); }
    cb(out);
  };
  img.onerror = function() { cb(dataUrl); };
  img.src = dataUrl;
}

function compressAllMore(imgs) {
  const smaller = [];
  imgs.forEach(function(src) {
    if (src.length <= 150000) { smaller.push(src); return; }
    const img = new Image();
    img.src = src;
    try {
      const w = img.width, h = img.height;
      const nw = Math.round(w * 0.6), nh = Math.round(h * 0.6);
      const c = document.createElement('canvas');
      c.width = nw; c.height = nh;
      c.getContext('2d').drawImage(img, 0, 0, nw, nh);
      smaller.push(c.toDataURL('image/jpeg', 0.45));
    } catch(e) { smaller.push(src); }
  });
  return smaller;
}

function adminRemoveStoreImage(idx) {
  const imgs = getAdminStoreImages();
  imgs.splice(idx, 1);
  localStorage.setItem('mycart_store_images_temp', JSON.stringify(imgs));
  renderAdminStoreImages();
}

function renderAnnounceCard(i,item){const el=document.getElementById('admAnnounceCards');if(!el)return null;const d=document.createElement('div');d.className='ann-card';d.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:6px';d.innerHTML='<input type="text" class="admAnnounceLine" style="flex:1;min-height:38px;padding:0 10px;border-radius:6px;border:1px solid var(--border);font-size:.8rem;font-family:inherit" placeholder="نص الإعلان"><button type="button" onclick="this.closest(\'.ann-card\').remove()" style="width:32px;height:32px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center">×</button>';if(item!==undefined&&item!==null){const inp=d.querySelector('input');if(inp)inp.value=item;}el.appendChild(d);return d;}
function addAnnounceLine(){const d=renderAnnounceCard(-1);if(!d)return;const inp=d.querySelector('input');if(inp)inp.focus();}
function toggleAnnounceExtras(){const t=document.getElementById('admMktAnnounceType');const e=document.getElementById('admAnnounceExtras');if(!t||!e)return;const sh=t.value!=='static'&&t.value!=='pulse';e.style.display=sh?'inline':'none';if(!sh)return;const d=document.getElementById('admMktAnnounceDir');if(!d)return;const cur=d.value;const lab=document.querySelectorAll('#admAnnounceExtras label')[0];if(t.value==='rotate'){lab.textContent='من:';d.innerHTML='<option value="up">⬆ فوق</option><option value="down">⬇ تحت</option>';if(cur==='up'||cur==='down')d.value=cur;else d.value='up'}else{lab.textContent='اتجاه:';d.innerHTML='<option value="rtl">يمين→يسار</option><option value="ltr">يسار→يمين</option>';if(cur==='rtl'||cur==='ltr')d.value=cur;else d.value='rtl'}}

function adminRenderMarketing(subTab = 'seo') {
  const container = document.getElementById('admin-marketing');
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const currentOrigin = window.location.origin + '/';
  window._fbtProductIds = (data.fbt?.productIds || []).slice();
  
  let html = '';

  if (subTab === 'seo') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-magnifying-glass"></i> تحسين محركات البحث (SEO)</h4>
        <div class="admin-form-group"><label>عنوان الموقع</label><input type="text" id="admMktSeoTitle" placeholder="متجري - أفضل متجر إلكتروني" value="${data.seo?.title||''}" oninput="updateAdminSeoPreview()"></div>
        <div class="admin-form-group"><label>وصف الموقع</label><textarea id="admMktSeoDesc" rows="2" placeholder="وصف مختصر للموقع يظهر في محركات البحث" oninput="updateAdminSeoPreview()">${data.seo?.description||''}</textarea></div>
        <div class="admin-form-group"><label>كلمات مفتاحية</label><input type="text" id="admMktSeoKeywords" placeholder="متجر, تسوق, منتجات, ..." value="${data.seo?.keywords||''}"></div>
        
        <!-- SEO Preview -->
        <div class="seo-preview-card" style="margin-top: 15px; padding: 14px; border: 1px solid var(--border); border-radius: 12px; background: #f8fafc;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-eye"></i> مظهر محركات البحث (SEO)
          </div>
          <div id="admMktSeoPreviewUrl" style="font-size: 0.72rem; color: #475569; direction: ltr; text-align: right; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentOrigin}</div>
          <div id="admMktSeoPreviewTitle" style="font-size: 1.1rem; color: #1a0dab; font-weight: 500; cursor: pointer; text-decoration: none; margin-bottom: 4px; display: inline-block; word-break: break-word; font-family: sans-serif;">${data.seo?.title || 'متجري - أفضل متجر إلكتروني'}</div>
          <div id="admMktSeoPreviewDesc" style="font-size: 0.82rem; color: #4d5156; line-height: 1.4; word-break: break-word; font-family: sans-serif;">${data.seo?.description || 'وصف مختصر للموقع يظهر في محركات البحث'}</div>
        </div>
      </div>
    </div>`;
  } else if (subTab === 'social') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-share-nodes"></i> التواصل الاجتماعي</h4>
        <div class="admin-form-group"><label><i class="fa-brands fa-facebook"></i> فيسبوك</label><input type="url" id="admMktSocialFb" placeholder="https://facebook.com/..." value="${data.social?.facebook||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-instagram"></i> إنستغرام</label><input type="url" id="admMktSocialIg" placeholder="https://instagram.com/..." value="${data.social?.instagram||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-x-twitter"></i> تويتر / X</label><input type="url" id="admMktSocialX" placeholder="https://twitter.com/..." value="${data.social?.twitter||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-tiktok"></i> تيك توك</label><input type="url" id="admMktSocialTt" placeholder="https://tiktok.com/..." value="${data.social?.tiktok||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-whatsapp"></i> واتساب</label><input type="url" id="admMktSocialWa" placeholder="https://wa.me/..." value="${data.social?.whatsapp||''}"></div>
      </div>
      <div class="admin-card"><h4><i class="fa-solid fa-code"></i> أكواد التتبع</h4>
        <div class="admin-form-group"><label>Google Analytics ID</label><input type="text" id="admMktGaId" placeholder="G-XXXXXXXXXX" value="${data.tracking?.gaId||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-meta" style="color:#1877f2"></i> Facebook / Instagram Pixel ID</label><input type="text" id="admMktFbPixel" placeholder="1234567890" value="${data.tracking?.fbPixel||''}">
          <p style="font-size:.68rem;color:var(--text-muted);margin:3px 0 0">هذا البيكسل يعمل لكل من فيسبوك وإنستغرام معاً (Meta Pixel).</p>
        </div>
        <div class="admin-form-group"><label><i class="fa-brands fa-tiktok" style="color:#010101"></i> TikTok Pixel ID</label><input type="text" id="admMktTtPixel" placeholder="XXXXXXX" value="${data.tracking?.ttPixel||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-snapchat" style="color:#fffc00"></i> Snapchat Pixel ID</label><input type="text" id="admMktSnapPixel" placeholder="12ab34cd-5678-..." value="${data.tracking?.snapPixel||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-x-twitter" style="color:#0f1419"></i> X (تويتر) Pixel ID</label><input type="text" id="admMktTwPixel" placeholder="00000000-0000-0000-0000-000000000000" value="${data.tracking?.twPixel||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-pinterest-p" style="color:#e60023"></i> Pinterest Tag ID</label><input type="text" id="admMktPintPixel" placeholder="2610000000000" value="${data.tracking?.pintPixel||''}"></div>
        <div class="admin-form-group"><label><i class="fa-solid fa-table-columns"></i> كود الرأس (head)</label><textarea id="admMktHeadScript" rows="3" placeholder="أكواد توضع داخل <head>">${data.tracking?.headerScript||''}</textarea></div>
        <div class="admin-form-group"><label>كود التذييل (قبل إغلاق body)</label><textarea id="admMktFooterScript" rows="3" placeholder="أكواد توضع قبل إغلاق </body>">${data.tracking?.footerScript||''}</textarea></div>
      </div>
      <div class="admin-card"><h4>🔗 أزرار مشاركة المنتجات</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktShareShow" style="width:16px;height:16px" ${data.share?.show ? 'checked' : ''}> تفعيل أزرار مشاركة المنتجات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض أزرار لنشر روابط المنتجات عبر فيسبوك، واتساب وتويتر.</p>
      </div>
      <div class="admin-card"><h4>🎁 النافذة الترويجية المنبثقة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktPromoPopupShow" style="width:16px;height:16px" ${data.promoPopup?.show ? 'checked' : ''}> تفعيل النافذة الترويجية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">نافذة ترحيبية تظهر للزائر تقدم له كود خصم فوري.</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
          <input type="text" id="admMktPromoPopupTitle" placeholder="عنوان النافذة" value="${data.promoPopup?.title||''}">
          <input type="text" id="admMktPromoPopupText" placeholder="نص وصفي للعرض" value="${data.promoPopup?.text||''}">
          <input type="text" id="admMktPromoPopupCode" placeholder="كود الخصم" value="${data.promoPopup?.code||''}" style="font-weight:800;letter-spacing:1px">
        </div>
      </div>
    </div>`;
  } else if (subTab === 'offers') {
    const offersList = data.offersList || [];
    const prodOpts = (typeof products !== 'undefined' ? products : []).map(p =>
      `<label style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:var(--bg);border-radius:6px;font-size:.75rem;cursor:pointer"><input type="checkbox" class="admOfferProdCb" value="${p.id}" style="width:14px;height:14px"> ${p.name}</label>`
    ).join('');
    html = `<div style="margin-bottom:16px;border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--card-bg)">
      <div style="font-size:.85rem;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-gem" style="color:#f59e0b"></i> إدارة العروض الخاصة <span style="font-size:.65rem;font-weight:400;color:var(--text-muted)">(${offersList.length} عرض)</span></div>
      ${offersList.length ? `<div style="margin-bottom:12px;display:flex;flex-direction:column;gap:5px">${offersList.map((o,i) => `<div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:.78rem;${!o.active?'opacity:.6':''}">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px"><strong>${o.name}</strong> <span style="font-size:.7rem;font-weight:700;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px">${o.type==='percent'?o.value+'%':CURRENCY+o.value}</span> ${!o.active?'<span style="font-size:.65rem;color:#94a3b8">(معطل)</span>':''}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">${o.applyTo==='all'?`جميع المنتجات`:`${(o.productIds||[]).length} منتج`}${o.badge?` • <span style="background:#fef3c7;padding:0 4px;border-radius:3px">${o.badge}</span>`:''}${o.endDate?` • حتى ${o.endDate}`:''}</div>
        </div>
        <button onclick="adminToggleOffer(${i})" style="background:none;border:none;color:${o.active?'#f59e0b':'#94a3b8'};cursor:pointer;font-size:.85rem" title="${o.active?'تعطيل':'تفعيل'}"><i class="fa-solid fa-${o.active?'toggle-on':'toggle-off'}"></i></button>
        <button onclick="adminEditOffer(${i})" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.8rem" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="adminDeleteOffer(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.8rem" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
      </div>`).join('')}</div>` : `<p style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px">لا توجد عروض مخصصة بعد.</p>`}
      <div id="admOfferFormTitle" style="font-size:.78rem;font-weight:700;margin-bottom:8px;color:var(--text-muted)">إضافة عرض جديد</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <input type="text" id="admOfferName" placeholder="اسم العرض" style="flex:1;min-width:140px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <select id="admOfferType" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)">
          <option value="percent">% نسبة</option>
          <option value="fixed">₪ قيمة</option>
        </select>
        <input type="number" id="admOfferValue" placeholder="القيمة" min="1" style="width:70px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <select id="admOfferApplyTo" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)" onchange="document.getElementById('admOfferProdPicker').style.display=this.value==='specific'?'block':'none'">
          <option value="all">جميع المنتجات</option>
          <option value="specific">منتجات محددة</option>
        </select>
        <input type="text" id="admOfferBadge" placeholder="الشارة" style="width:110px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <input type="date" id="admOfferEndDate" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem" title="تاريخ الانتهاء">
        <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer"><input type="checkbox" id="admOfferActive" checked style="width:15px;height:15px"> نشط</label>
        <button id="admOfferSubmitBtn" onclick="adminAddOffer()" class="admin-btn admin-btn-primary admin-btn-sm"><i class="fa-solid fa-plus"></i> إضافة</button>
        <button id="admOfferCancelBtn" onclick="adminCancelEdit()" style="display:none;background:none;border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;color:var(--text-muted);font-size:.78rem;font-family:inherit"><i class="fa-solid fa-xmark"></i> إلغاء</button>
      </div>
      <div id="admOfferProdPicker" style="display:none;margin-top:8px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:.75rem;font-weight:700;color:var(--text-muted)">المنتجات المحددة:</span>
          <button type="button" onclick="adminOpenOfferPicker()" style="padding:5px 12px;background:#f59e0b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit"><i class="fa-solid fa-plus"></i> اختر منتجات</button>
        </div>
        <div id="admOfferSelectedProds" style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;font-size:.72rem;color:var(--text-muted)">لم يتم اختيار أي منتج بعد</div>
      </div>
      <div style="display:none" id="admOfferProdCbs">${prodOpts || ''}</div>
    </div>
    <div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-tag"></i> عروض الكميات التراكمية <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'كل ما زادت كمية المنتج في السلة، قل السعر تلقائياً. مثال: 2 حبة = خصم 5%، 3 حبات = خصم 10%. الخصم يحسب تلقائي عند إضافة المنتج.')"></i></h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktVolDiscShow" style="width:16px;height:16px" ${data.volumeDiscount?.show ? 'checked' : ''}> تفعيل عروض الكميات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">تخفيض تلقائي للعملاء عند إضافة كمية أكبر من نفس المنتج.</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:0.75rem;font-weight:700">نوع الخصم:</span>
            <select id="admMktVolDiscType" style="padding:6px;border:1px solid var(--border);border-radius:8px;font-size:0.8rem;background:var(--card);color:var(--text)" onchange="
              const t = this.value;
              document.getElementById('admVolDiscVal').style.display = t==='bogo'?'none':'flex';
              document.getElementById('admVolDiscBogo').style.display = t==='bogo'?'flex':'none';
            ">
              <option value="percent" ${data.volumeDiscount?.type==='percent'?'selected':''}>نسبة مئوية (%)</option>
              <option value="fixed" ${data.volumeDiscount?.type==='fixed'?'selected':''}>قيمة ثابتة (₪)</option>
              <option value="bogo" ${data.volumeDiscount?.type==='bogo'?'selected':''}>اشترِ X واحصل على Y مجاناً</option>
            </select>
            <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'نسبة مئوية: خصم % من السعر. قيمة ثابتة: خصم مبلغ محدد. اشترِ X واحصل على Y: مثلاً اشترِ 2 واحصل على 1 مجاناً.')"></i>
          </div>
          <div id="admVolDiscVal" style="display:${data.volumeDiscount?.type==='bogo'?'none':'flex'};gap:8px;align-items:center;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:0.7rem;color:var(--text-muted)">عند شراء 2:</span>
              <input type="number" id="admMktVolDisc2" min="1" value="${data.volumeDiscount?.disc2||5}" style="width:60px">
              <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.7rem" onclick="showTooltipExample(this, 'الخصم اللي يحصل عليه الزبون عند شراء قطعتين من نفس المنتج.')"></i>
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:0.7rem;color:var(--text-muted)">عند شراء 3+:</span>
              <input type="number" id="admMktVolDisc3" min="1" value="${data.volumeDiscount?.disc3||10}" style="width:60px">
              <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.7rem" onclick="showTooltipExample(this, 'الخصم اللي يحصل عليه الزبون عند شراء 3 قطع أو أكثر من نفس المنتج.')"></i>
            </div>
          </div>
          <div id="admVolDiscBogo" style="display:${data.volumeDiscount?.type==='bogo'?'flex':'none'};gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:0.7rem;color:var(--text-muted)">اشترِ:</span>
            <input type="number" id="admMktVolBogoBuy" min="1" value="${data.volumeDiscount?.bogoBuy||2}" style="width:50px">
            <span style="font-size:0.7rem;color:var(--text-muted)">واحصل على:</span>
            <input type="number" id="admMktVolBogoGet" min="1" value="${data.volumeDiscount?.bogoGet||1}" style="width:50px">
            <span style="font-size:0.7rem;color:var(--text-muted)">مجاناً!</span>
          </div>
        </div>
      </div>
      <div class="admin-card"><h4>📦 حزمة "اشترِ معاً ووفر"</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktFbtShow" style="width:16px;height:16px" ${data.fbt?.show ? 'checked' : ''}> 📦 حزمة "اشترِ معاً ووفر" (منتجات مكملة)
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">اختر حتى 4 منتجات لتظهر كحزمة مع كل منتج.</p>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:0.75rem">خصم الحزمة:</span>
          <input type="number" id="admMktFbtDiscount" value="${data.fbt?.discount || 10}" style="width:60px">
          <select id="admMktFbtDiscountType" style="padding:6px;border:1px solid var(--border);border-radius:8px;font-size:0.8rem;background:var(--card);color:var(--text)">
            <option value="percent" ${data.fbt?.discountType==='percent'?'selected':''}>% نسبة مئوية</option>
            <option value="fixed" ${data.fbt?.discountType==='fixed'?'selected':''}>قيمة ثابتة (${CURRENCY})</option>
          </select>
        </div>
        <div style="margin-top:10px">
          <div style="font-size:0.75rem;font-weight:700;margin-bottom:6px">المنتجات المختارة:</div>
          <div id="admMktFbtProducts" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${(data.fbt?.productIds||[]).map(id => { const pr = (typeof products !== 'undefined' ? products : []).find(p => p.id === id); return pr ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:.7rem;background:var(--bg)">${pr.name} <i class="fa-solid fa-xmark" style="cursor:pointer;color:#ef4444" onclick="removeFbtProduct(${id})"></i></span>` : ''; }).join('')}</div>
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openFbtProductPicker()"><i class="fa-solid fa-plus"></i> اختيار منتجات</button>
        </div>
      </div>
      <div class="admin-card"><h4>🚚 شريط تقدم الشحن المجاني</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="admMktFreeShippingShow" style="width:16px;height:16px" ${data.freeShipping?.show ? 'checked' : ''}> 🚚 تفعيل شريط التقدم للشحن المجاني
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">شريط ملون متحرك في السلة يشجع العميل على زيادة مشترياته للحصول على توصيل مجاني.</p>
        <div style="display:flex;align-items:center;gap:8px;padding-right:24px">
          <span style="font-size:0.75rem;color:var(--text-muted)">الحد الأدنى للشحن المجاني:</span>
          <input type="number" id="admMktFreeShippingGoal" min="0" value="${data.freeShipping?.goal || 300}" style="width:80px">
        </div>
      </div>
      <div class="admin-card" style="grid-column:1/-1"><h4>📱 تحويل الطلبات تلقائياً إلى واتساب</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaNotifShow" style="width:16px;height:16px" ${data.waNotif?.show !== false ? 'checked' : ''}> 📱 تحويل العميل للواتساب تلقائياً بعد إتمام الطلب
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يفتح تطبيق واتساب بالرسالة وتفاصيل الفاتورة فور نقر المشتري على "إتمام الطلب" لتأكيد سريع.</p>
    </div>`;
  } else if (subTab === 'widgets') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4>📢 شريط الإعلان العلوي</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktAnnounceShow" style="width:16px;height:16px" ${data.announce?.show ? 'checked' : ''}> تفعيل شريط الإعلان العلوي
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">شريط نصي ملون في أعلى شاشة المتجر لجذب الانتباه (مثال: عروض مميزة بمناسبة الأعياد).</p>
        <div style="margin-top: 8px;">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <label style="font-size:0.75rem">لون الخلفية:</label>
            <input type="color" id="admMktAnnounceBg" value="${data.announce?.bg||'#ef4444'}" style="width:40px;height:30px;border:none;cursor:pointer">
            <label style="font-size:0.75rem;margin-right:10px">لون النص:</label>
            <input type="color" id="admMktAnnounceColor" value="${data.announce?.color||'#ffffff'}" style="width:40px;height:30px;border:none;cursor:pointer">
            <label style="font-size:0.75rem;margin-right:10px">النوع:</label>
            <select id="admMktAnnounceType" onchange="toggleAnnounceExtras()" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
              <option value="marquee" ${(data.announce?.animation?.type||'marquee')==='marquee'?'selected':''}>🔄 مستمر (شريط متحرك)</option>
              <option value="slide" ${data.announce?.animation?.type==='slide'?'selected':''}>▶ انزلاق</option>
              <option value="rotate" ${data.announce?.animation?.type==='rotate'?'selected':''}>🔁 تناوب</option>
              <option value="static" ${data.announce?.animation?.type==='static'?'selected':''}>■ ثابت</option>
              <option value="pulse" ${data.announce?.animation?.type==='pulse'?'selected':''}>💓 نبض</option>
            </select>
            <span id="admAnnounceExtras">
              <label style="font-size:0.75rem;margin-right:10px">اتجاه:</label>
              <select id="admMktAnnounceDir" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
                <option value="rtl" ${(data.announce?.animation?.direction||'rtl')==='rtl'?'selected':''}>يمين→يسار</option>
                <option value="ltr" ${data.announce?.animation?.direction==='ltr'?'selected':''}>يسار→يمين</option>
              </select>
              <label style="font-size:0.75rem;margin-right:10px">سرعة:</label>
              <select id="admMktAnnounceSpeed" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
                <option value="slow" ${(data.announce?.animation?.speed||'medium')==='slow'?'selected':''}>بطيء</option>
                <option value="medium" ${(data.announce?.animation?.speed||'medium')==='medium'?'selected':''}>متوسط</option>
                <option value="fast" ${data.announce?.animation?.speed==='fast'?'selected':''}>سريع</option>
              </select>
            </span>
          </div>
          <div id="admAnnounceCards" style="margin-top:10px">
            <button type="button" onclick="addAnnounceLine()" style="padding:6px 14px;border-radius:6px;border:1px dashed var(--border);background:transparent;cursor:pointer;font-size:.75rem;width:100%">+ إضافة نص</button>
          </div>
        </div>
      </div>
      <div class="admin-card"><h4>🎄 مؤثرات موسمية</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktSeasonalShow" style="width:16px;height:16px" ${data.seasonalEffect?.enabled ? 'checked' : ''}> تفعيل المؤثرات الموسمية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">إضافة تأثيرات بصرية احتفالية للمتجر (ثلج، رمضان، قلوب، إلخ).</p>
        <div style="margin-top: 8px;">
          <select id="admMktSeasonalType" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit;width:100%">
            <option value="snow" ${data.seasonalEffect?.type==='snow'?'selected':''}>❄️ ثلج</option>
            <option value="ramadan" ${data.seasonalEffect?.type==='ramadan'?'selected':''}>🏮 رمضان</option>
            <option value="confetti" ${data.seasonalEffect?.type==='confetti'?'selected':''}>🎊 أعياد</option>
            <option value="hearts" ${data.seasonalEffect?.type==='hearts'?'selected':''}>❤️ قلوب</option>
            <option value="leaves" ${data.seasonalEffect?.type==='leaves'?'selected':''}>🍂 أوراق</option>
            <option value="chillat" ${data.seasonalEffect?.type==='chillat'?'selected':''}>🎵 تشيلات</option>
            <option value="valentine" ${data.seasonalEffect?.type==='valentine'?'selected':''}>💖 عيد الحب</option>
            <option value="graduation" ${data.seasonalEffect?.type==='graduation'?'selected':''}>🎓 تخرج</option>
            <option value="eid" ${data.seasonalEffect?.type==='eid'?'selected':''}>🐏 عيد الأضحى</option>
            <option value="christmas" ${data.seasonalEffect?.type==='christmas'?'selected':''}>🎄 عيد الميلاد</option>
            <option value="newyear" ${data.seasonalEffect?.type==='newyear'?'selected':''}>🎆 رأس السنة</option>
            <option value="halloween" ${data.seasonalEffect?.type==='halloween'?'selected':''}>🎃 هالوين</option>
          </select>
        </div>
      </div>
      <div class="admin-card"><h4>💎 قسم العروض الخاصة في الصفحة الرئيسية</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktOffersSectionShow" style="width:16px;height:16px" ${data.offersSection?.show !== false ? 'checked' : ''}> 💎 تفعيل قسم "العروض الخاصة" في الصفحة الرئيسية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض المنتجات اللي عليها عروض مخصصة في قسم منفصل تحت البانر.</p>
      </div>
      <div class="admin-card"><h4>⏳ عداد العرض التنازلي للمنتجات</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktCountdownShow" style="width:16px;height:16px" ${data.countdown?.show ? 'checked' : ''}> تفعيل عداد العرض التنازلي للمنتجات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">عداد تنازلي وهمي يظهر داخل تفاصيل المنتج لخلق شعور بالاستعجال للشراء.</p>
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.75rem;">مدة العداد (بالدقائق):</span>
          <input type="number" id="admMktCountdownDuration" min="1" max="1440" value="${data.countdown?.duration||180}" style="width:80px">
        </div>
      </div>
      <div class="admin-card"><h4>🔥 عداد المشاهدين الحيّ في صفحة المنتج</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktLiveViewersShow" style="width:16px;height:16px" ${data.liveViewers?.show ? 'checked' : ''}> 🔥 عداد المشاهدين الحيّ في صفحة المنتج
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض نصاً مثل "يشاهد هذا المنتج 13 شخصاً الآن!" ويتغير تلقائياً.</p>
      </div>
      <div class="admin-card"><h4>💬 صندوق دعم واتساب العائم</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaChatShow" style="width:16px;height:16px" ${data.waChat?.show ? 'checked' : ''}> 💬 صندوق دعم واتساب العائم
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 6px">زر أخضر ثابت في أسفل الشاشة يأخذ العميل لواتساب مباشرة.</p>
        <input type="text" id="admMktWaChatGreeting" placeholder="نص الترحيب" value="${data.waChat?.greeting || ''}">
      </div>
      <div class="admin-card"><h4>🛍 إشعارات الشراء الحديثة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktSocialProofShow" style="width:16px;height:16px" ${data.socialProof?.show ? 'checked' : ''}> 🛍 تفعيل إشعارات الشراء الحديثة
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">نافذة تنبيه صغيرة أسفل الشاشة تُحاكي عمليات شراء حية لبناء المصداقية.</p>
      </div>
      <div class="admin-card"><h4>💬 زر الشراء السريع عبر واتساب</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaCheckoutShow" style="width:16px;height:16px" ${data.waCheckout?.show ? 'checked' : ''}> تفعيل زر الطلب المباشر عبر واتساب
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يضيف زراً أخضر واضحاً في صفحة المنتج للشراء عبر واتساب فوراً.</p>
      </div>
    </div>`;
  } else if (subTab === 'reviews') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4>💬 تقييمات المنتج بالنجوم</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktReviewsShow" style="width:16px;height:16px" ${data.reviews?.show ? 'checked' : ''}> 💬 تفعيل تقييمات العملاء في صفحة المنتج
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يسمح للمشترين بكتابة تقييمات بالنجوم والتعليقات على المنتجات.</p>
      </div>
    </div>`;
  } else if (subTab === 'pagebuilder') {
    html = adminRenderPageBuilder(data);
  } else if (subTab === 'popup') {
    const pp = data.promoPopup || {};
    const ptype = pp.type || 'discount';
    html = `<div class="admin-settings-grid">
      <div class="admin-card" style="grid-column:1/-1"><h4><i class="fa-solid fa-window-restore"></i> النافذة الترويجية المنبثقة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="admMktPromoPopupShow" style="width:16px;height:16px" ${pp.show ? 'checked' : ''}> تفعيل النافذة الترويجية عند فتح المتجر
        </label>
      </div>
      <!-- Type -->
      <div class="admin-card" style="grid-column:1/-1"><h4><i class="fa-solid fa-shapes"></i> نوع النافذة</h4>
        <select id="admMktPpType" onchange="adminPpToggleType()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;background:var(--card);color:var(--text);margin-top:6px">
          <option value="discount" ${ptype==='discount'?'selected':''}>🎫 خصم (كود + نسبة)</option>
          <option value="announcement" ${ptype==='announcement'?'selected':''}>📢 إعلان (رسالة + زر)</option>
          <option value="newsletter" ${ptype==='newsletter'?'selected':''}>📧 اشتراك بريد إلكتروني</option>
          <option value="sale" ${ptype==='sale'?'selected':''}>🔥 تخفيضات (مؤقت + نسبة)</option>
          <option value="newarrival" ${ptype==='newarrival'?'selected':''}>🆕 وصل حديثاً</option>
          <option value="halfprice" ${ptype==='halfprice'?'selected':''}>💰 نصف السعر</option>
          <option value="custom" ${ptype==='custom'?'selected':''}>✨ مخصص (كامل التحكم)</option>
        </select>
      </div>
      <!-- Content -->
      <div class="admin-card"><h4><i class="fa-solid fa-pen"></i> المحتوى</h4>
        <div class="admin-form-group"><label>العنوان</label><input type="text" id="admMktPpTitle" placeholder="عرض خاص لفترة محدودة!" value="${pp.title||''}"></div>
        <div class="admin-form-group"><label>النص</label><textarea id="admMktPpText" rows="2" placeholder="نص النافذة">${pp.text||''}</textarea></div>
        <div class="admin-form-group" id="admPpCodeGroup"><label>كود الخصم</label><div style="display:flex;gap:4px"><input type="text" id="admMktPpCode" placeholder="SPECIAL10" value="${pp.code||''}" style="flex:1;text-transform:uppercase"><button type="button" onclick="document.getElementById('admMktPpCode').value='LUCKY'+Math.random().toString(36).slice(2,6).toUpperCase()" title="توليد" style="padding:6px 10px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer">⚡</button></div></div>
        <div class="admin-form-group" id="admPpPercentGroup"><label>نسبة الخصم %</label><input type="number" id="admMktPpPercent" min="1" max="99" value="${pp.discountPercent||''}" placeholder="10"></div>
      </div>
      <!-- Media & Button -->
      <div class="admin-card"><h4><i class="fa-solid fa-image"></i> الوسائط والزر</h4>
        <div class="admin-form-group"><label>صورة النافذة</label><div style="display:flex;gap:6px;flex-wrap:wrap"><input type="text" id="admMktPpImage" placeholder="رابط الصورة" value="${pp.image||''}" style="flex:1;min-width:140px" oninput="adminPpPreviewImage(this.value)"><button type="button" onclick="adminPpUploadImage()" title="رفع صورة" style="padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.78rem;white-space:nowrap"><i class="fa-solid fa-upload"></i> رفع</button><input type="file" id="admPpFileInput" accept="image/*" style="display:none" onchange="adminPpHandleImageUpload(this)"></div>
          <div id="admPpImagePreview" style="margin-top:6px;${pp.image?'':'display:none'}">${pp.image ? '<img src="'+pp.image+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">' : ''}</div></div>
        <div class="admin-form-group" id="admPpBtnTextGroup"><label>نص الزر</label><input type="text" id="admMktPpBtnText" placeholder="تسوق الآن 🛍️" value="${pp.btnText||''}"></div>
        <div class="admin-form-group" id="admPpBtnLinkGroup"><label>رابط الزر</label><input type="text" id="admMktPpBtnLink" placeholder="#offers" value="${pp.btnLink||''}"></div>
      </div>
      <!-- Design -->
      <div class="admin-card"><h4><i class="fa-solid fa-palette"></i> التصميم</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="admin-form-group"><label>خلفية النافذة</label><input type="color" id="admMktPpBg" value="${pp.bgColor||'#ffffff'}"></div>
          <div class="admin-form-group"><label>لون النص</label><input type="color" id="admMktPpTextColor" value="${pp.textColor||'#0f172a'}"></div>
          <div class="admin-form-group"><label>لون التأكيد</label><input type="color" id="admMktPpAccent" value="${pp.accentColor||pp.color||'#ef4444'}"></div>
          <div class="admin-form-group"><label>خلفية الزر</label><input type="color" id="admMktPpBtnBg" value="${pp.btnBg||'#ef4444'}"></div>
          <div class="admin-form-group"><label>لون نص الزر</label><input type="color" id="admMktPpBtnColor" value="${pp.btnColor||'#ffffff'}"></div>
        </div>
      </div>
      <!-- Behaviour -->
      <div class="admin-card"><h4><i class="fa-solid fa-gear"></i> السلوك</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="admin-form-group"><label>تأخير الظهور (ثوانٍ)</label><input type="number" id="admMktPpDelay" min="0" value="${pp.delay||3}" style="width:80px"></div>
          <div class="admin-form-group"><label>حجم النافذة</label><select id="admMktPpSize" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="small" ${(pp.size||'medium')==='small'?'selected':''}>صغير</option>
            <option value="medium" ${(pp.size||'medium')==='medium'?'selected':''}>وسط</option>
            <option value="large" ${pp.size==='large'?'selected':''}>كبير</option>
            <option value="fullscreen" ${pp.size==='fullscreen'?'selected':''}>ملء الشاشة</option>
          </select></div>
          <div class="admin-form-group"><label>الموضع</label><select id="admMktPpPos" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="center" ${(pp.position||'center')==='center'?'selected':''}>وسط</option>
            <option value="top" ${pp.position==='top'?'selected':''}>أعلى</option>
            <option value="bottom" ${pp.position==='bottom'?'selected':''}>أسفل</option>
          </select></div>
          <div class="admin-form-group"><label>حركة الظهور</label><select id="admMktPpAnim" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="bounce" ${(pp.animation||'bounce')==='bounce'?'selected':''}>ارتداد</option>
            <option value="fade" ${pp.animation==='fade'?'selected':''}>تلاشي</option>
            <option value="slide" ${pp.animation==='slide'?'selected':''}>انزلاق</option>
            <option value="zoom" ${pp.animation==='zoom'?'selected':''}>تكبير</option>
          </select></div>
          <div class="admin-form-group" id="admPpExpiryGroup"><label>تاريخ انتهاء الكود</label><input type="datetime-local" id="admMktPpExpires" value="${pp.expiresAt ? new Date(pp.expiresAt).toISOString().slice(0,16) : ''}"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            <label style="display:flex;align-items:center;gap:4px;font-size:.72rem;cursor:pointer"><input type="checkbox" id="admMktPpShowClose" style="width:14px;height:14px" ${pp.showClose!==false?'checked':''}> زر إغلاق</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:.72rem;cursor:pointer"><input type="checkbox" id="admMktPpCloseOutside" style="width:14px;height:14px" ${pp.closeOutside!==false?'checked':''}> إغلاق خارجياً</label>
          </div>
        </div>
      </div>
      <!-- Custom extras (show only for custom type) -->
      <div class="admin-card" id="admPpCustomExtras" style="grid-column:1/-1;display:${ptype==='custom'?'block':'none'}"><h4><i class="fa-solid fa-code"></i> خيارات مخصصة</h4>
        <div class="admin-form-group"><label>أيقونة مخصصة (اسم كلاس Font Awesome)</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="admMktPpCustomIcon" placeholder="مثال: fa-star, fa-heart" value="${pp.customIcon||''}" style="flex:1;font-family:monospace;direction:ltr" oninput="document.getElementById('admPpCustomIconPreview').className='fa-solid '+this.value||'fa-gift'">
            <i id="admPpCustomIconPreview" class="fa-solid ${pp.customIcon||'fa-gift'}" style="font-size:1.4rem;color:${pp.accentColor||'#ef4444'}"></i>
          </div>
          <div style="font-size:.65rem;color:var(--text-muted);margin-top:2px">أمثلة: fa-star, fa-heart, fa-truck, fa-rocket, fa-crown, fa-bolt, fa-fire</div>
        </div>
        <div class="admin-form-group"><label>HTML مخصص (يلغي المحتوى الافتراضي)</label><textarea id="admMktPpCustomHtml" rows="4" placeholder="اكتب HTML مخصص للنافذة..." style="font-family:monospace;direction:ltr;font-size:.78rem">${pp.customHtml||''}</textarea>
          <div style="font-size:.65rem;color:var(--text-muted);margin-top:2px">اكتب HTML وسيظهر بالكامل داخل النافذة. العنوان والنص والصورة والرمز والكود والزر كلها تخفى.</div>
        </div>
      </div>
      <!-- Preview -->
      <div class="admin-card" style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center"><h4><i class="fa-solid fa-eye"></i> معاينة سريعة</h4>
        <div id="adminPpPreview" style="margin-top:10px;width:100%;max-width:320px;border-radius:16px;padding:20px;text-align:center;background:#fff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          ${pp.customHtml ? '<div style="font-size:.78rem;color:#64748b;padding:10px;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1"><i class="fa-solid fa-code"></i> HTML مخصص — استخدم المعاينة الحية</div>' : `
          <div style="font-size:2rem;margin-bottom:8px"><i class="fa-solid ${pp.customIcon||(ptype==='discount'?'fa-tag':ptype==='announcement'?'fa-bullhorn':ptype==='newsletter'?'fa-envelope-open-text':ptype==='sale'?'fa-fire':ptype==='newarrival'?'fa-gem':ptype==='halfprice'?'fa-bolt':'fa-gift')}" style="color:${pp.accentColor||'#ef4444'}"></i></div>
          <h5 id="adminPpPrevTitle" style="font-size:1rem;font-weight:800;margin-bottom:4px">${pp.title||'العنوان'}</h5>
          <p id="adminPpPrevText" style="font-size:.75rem;color:#64748b;margin-bottom:10px;${pp.text?'':'display:none'}">${pp.text||''}</p>
          <div id="adminPpPrevBadge" style="font-size:2rem;font-weight:900;color:#ef4444;margin-bottom:8px;${(ptype==='discount'||ptype==='sale'||ptype==='halfprice')&&pp.discountPercent?'':'display:none'}">-${pp.discountPercent||''}%</div>
          <div id="adminPpPrevCode" style="background:#fef2f2;border:2px dashed #ef4444;padding:8px 12px;border-radius:8px;font-weight:800;letter-spacing:1px;margin-bottom:8px;font-size:1rem;${pp.code?'':'display:none'}">${pp.code||''}</div>
          <button id="adminPpPrevBtn" style="background:#ef4444;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:.8rem;margin-top:6px;${pp.btnText&&pp.btnLink?'':'display:none'}">${pp.btnText||''}</button>
          `}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing('popup')"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
      <button class="admin-btn admin-btn-secondary" onclick="adminPpTestPreview()"><i class="fa-solid fa-play"></i> معاينة حية</button>
    </div>`;
  }

container.innerHTML = html + `
   <button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing('${subTab}')" style="margin-top:16px"><i class="fa-solid fa-floppy-disk"></i> حفظ التسويق</button>`;

  if (subTab === 'widgets') { toggleAnnounceExtras(); adminInitSectionToggles(); const el=document.getElementById('admAnnounceCards');if(el){const _al=(data.announce?.text||'').split('\n').map(t=>t.trim()).filter(t=>t);_al.forEach((t,i)=>{renderAnnounceCard(i,t);});} }
  if (subTab === 'pagebuilder') { adminInitPageBuilder(); }
  if (subTab === 'reviews') {
    admRenderSpinSegmentsList(data.spinWin?.segments || []);
  }
}

function adminSaveBannerSettings() {
  const settings = {
    layout: document.getElementById('admBannerLayout')?.value || 'slider',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    heroStyle: document.getElementById('admHeroStyle')?.value || 'only',
    sliderCounter: document.getElementById('admSliderCounter')?.value || 'show',
    autoplay: document.getElementById('admBannerAutoplay')?.checked ?? true,
    interval: parseInt(document.getElementById('admBannerInterval')?.value || 4000),
    aspectRatio: document.getElementById('admBannerAspectRatio')?.value || '2/1',
    borderRadius: document.getElementById('admBannerBorderRadius')?.value || '14px',
    objectFit: document.getElementById('admBannerObjectFit')?.value || 'cover'
  };
  localStorage.setItem('mycart_banner_settings', JSON.stringify(settings));
  const cur = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  cur.bannerSettings = Object.assign({}, cur.bannerSettings || {}, settings);
  try { localStorage.setItem('mycart_marketing', JSON.stringify(cur)); } catch(e) {}
  if (typeof renderAdminBannerPreview === 'function') renderAdminBannerPreview();
  if (typeof startBannerAutoScroll === 'function') {
    startBannerAutoScroll();
  }
}

function adminToggleHeroStyle(layout) {
  const isHero = layout === 'hero';
  const hg = document.getElementById('admHeroStyleGroup');
  const sg = document.getElementById('admSliderStyleGroup');
  const cg = document.getElementById('admSliderCounterGroup');
  if (hg) hg.style.display = isHero ? '' : 'none';
  if (sg) sg.style.display = isHero ? 'none' : '';
  if (cg) cg.style.display = isHero ? 'none' : '';
}

/* ===== Header Decoration System ===== */
const HEADER_DECO_STYLES = {
  none: { label: 'بدون', icon: 'fa-ban' },
  dots: { label: 'نقاط', icon: 'fa-braille' },
  lines: { label: 'خطوط', icon: 'fa-bars' },
  grid: { label: 'شبكة', icon: 'fa-border-all' },
  waves: { label: 'أمواج', icon: 'fa-water' },
  glass: { label: 'زجاجي', icon: 'fa-glass-water' },
  'border-anim': { label: 'حدود', icon: 'fa-border-none' },
  'shadow-anim': { label: 'ظل', icon: 'fa-circle-half-stroke' },
  shimmer: { label: 'لمعان', icon: 'fa-sparkles' },
  circles: { label: 'دوائر', icon: 'fa-circle' },
  diagonal: { label: 'مائل', icon: 'fa-arrows-split-up-and-left' },
  diamonds: { label: 'ماسات', icon: 'fa-diamond' },
  'confetti': { label: 'قصاصات', icon: 'fa-scissors' },
  'pulse-ring': { label: 'نبض', icon: 'fa-bullseye' },
  neon: { label: 'نيون', icon: 'fa-lightbulb' },
  'gradient-shift': { label: 'تدرج', icon: 'fa-gradient' },
  stars: { label: 'نجوم', icon: 'fa-star' },
  'border-dashed': { label: 'حدود متقطعة', icon: 'fa-ellipsis' },
  'border-double': { label: 'حدود مزدوجة', icon: 'fa-clone' },
  'border-neon-glow': { label: 'حدود نيون', icon: 'fa-wand-magic-sparkles' },
  'border-rainbow': { label: 'حدود قوس قزح', icon: 'fa-rainbow' },
  'border-zigzag': { label: 'حدود متعرجة', icon: 'fa-mountain' },
  'border-dots': { label: 'حدود منقاط', icon: 'fa-dice-d20' },
  clouds: { label: 'غيوم', icon: 'fa-cloud' },
  snow: { label: 'ثلج', icon: 'fa-snowflake' },
  ramadan: { label: 'رمضان', icon: 'fa-moon' },
  eid: { label: 'عيد', icon: 'fa-mosque' },
  love: { label: 'حب', icon: 'fa-heart' },
  fireworks: { label: 'ألعاب نارية', icon: 'fa-burst' },
  'falling-leaves': { label: 'أوراق خريف', icon: 'fa-leaf' },
  spring: { label: 'ربيع', icon: 'fa-seedling' },
  birthday: { label: 'عيد ميلاد', icon: 'fa-cake-candles' },
  'border-ramadan': { label: 'حدود رمضان', icon: 'fa-crescent' },
  'border-eid': { label: 'حدود عيد', icon: 'fa-lantern' },
  'border-love': { label: 'حدود حب', icon: 'fa-heart' },
  'border-fireworks': { label: 'حدود ألعاب نارية', icon: 'fa-star' },
  'border-snow': { label: 'حدود ثلج', icon: 'fa-snowflake' },
  'border-birthday': { label: 'حدود عيد ميلاد', icon: 'fa-gift' }
};

function loadHeaderDecoSettings() {
  try { return JSON.parse(localStorage.getItem('mycart_header_deco')) || {}; } catch(e) { return {}; }
}

function saveHeaderDecoSettings(settings) {
  try { localStorage.setItem('mycart_header_deco', JSON.stringify(settings)); } catch(e) {}
  applyHeaderDecoration();
}

function applyHeaderDecoration() {
  const s = loadHeaderDecoSettings();
  const header = document.getElementById('header');
  if (!header) return;
  /* Remove all deco classes */
  Object.keys(HEADER_DECO_STYLES).forEach(k => {
    if (k !== 'none') header.classList.remove('header-deco-' + k);
  });
  header.style.removeProperty('--border-angle');
  if (s.style && s.style !== 'none') {
    header.classList.add('header-deco-' + s.style);
  }
}

function adminRenderHeaderDeco() {
  const container = document.getElementById('admin-header-deco');
  if (!container) return;
  const s = loadHeaderDecoSettings();
  const currentStyle = s.style || 'none';

  const optionsHtml = Object.entries(HEADER_DECO_STYLES).map(([key, info]) => {
    const isActive = currentStyle === key;
    return '<button onclick="setHeaderDecoStyle(\'' + key + '\')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border:2px solid ' + (isActive ? 'var(--accent)' : 'var(--border)') + ';border-radius:10px;background:' + (isActive ? 'rgba(var(--accent-rgb,239,68,68),.08)' : 'var(--card)') + ';cursor:pointer;font-family:inherit;flex:1;min-width:70px;transition:all .15s">' +
      '<i class="fa-solid ' + info.icon + '" style="font-size:1.1rem;color:' + (isActive ? 'var(--accent)' : 'var(--text-muted)') + '"></i>' +
      '<span style="font-size:.68rem;font-weight:700;color:' + (isActive ? 'var(--accent)' : 'var(--text)') + '">' + info.label + '</span>' +
      '</button>';
  }).join('');

  container.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">' +
    '<h4 style="margin:0 0 12px;font-size:.9rem;font-weight:800;color:var(--text)"><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);margin-left:6px"></i> زخرفة الهيدر</h4>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:12px">' + optionsHtml + '</div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
    '<button onclick="previewHeaderDeco()" style="padding:7px 14px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);cursor:pointer;font-family:inherit;font-size:.78rem;font-weight:700"><i class="fa-solid fa-eye"></i> معاينة</button>' +
    '<span style="font-size:.72rem;color:var(--text-muted)">الزخرفة تُطبّق فوراً على المتجر</span>' +
    '</div></div>';
}

function setHeaderDecoStyle(style) {
  saveHeaderDecoSettings({ style });
  adminRenderHeaderDeco();
  applyHeaderDecoration();
  if (typeof liveAppPreview === 'function') liveAppPreview();
  showToast('تم تطبيق زخرفة الهيدر', 'success');
}

function previewHeaderDeco() {
  applyHeaderDecoration();
  showToast('تم تطبيق زخرفة الهيدر', 'success');
}

function adminRenderBanners() {
  const container = document.getElementById('admin-banners');
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const bSettings = typeof loadBannerSettings === 'function' ? loadBannerSettings() : (data.bannerSettings || { autoplay: true, interval: 4000, aspectRatio: '2/1', borderRadius: '14px' });
  const banners = data.banners || [];
  
  container.innerHTML = `
    <!-- Top Card: General Settings -->
    <div class="admin-card" style="margin-bottom:20px">
      <h4><i class="fa-solid fa-gears"></i> إعدادات السلايدر العام</h4>
      <div style="display:flex;flex-direction:column;gap:8px">
        <label style="display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;cursor:pointer">
          <input type="checkbox" id="admBannerAutoplay" ${bSettings.autoplay !== false ? 'checked' : ''} onchange="adminSaveBannerSettings()" style="width:16px;height:16px;accent-color:var(--accent)">
          تشغيل تلقائي (Auto-Play)
        </label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">تخطيط العرض:</label>
            <select id="admBannerLayout" onchange="adminSaveBannerSettings();adminToggleHeroStyle(this.value)" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="slider" ${bSettings.layout === 'slider' || !bSettings.layout ? 'selected' : ''}>سلايدر متحرك</option>
              <option value="grid" ${bSettings.layout === 'grid' ? 'selected' : ''}>شبكة صور</option>
              <option value="stack" ${bSettings.layout === 'stack' ? 'selected' : ''}>قائمة عمودية</option>
              <option value="hero" ${bSettings.layout === 'hero' ? 'selected' : ''}>صورة رئيسية</option>
              <option value="peek" ${bSettings.layout === 'peek' ? 'selected' : ''}>سلايدر متداخل</option>
              <option value="premium" ${bSettings.layout === 'premium' ? 'selected' : ''}>عالمية احترافية</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px" id="admHeroStyleGroup" ${bSettings.layout !== 'hero' ? 'style="display:none"' : ''}>
            <label style="font-size:.7rem;font-weight:700">نمط الصورة الرئيسية:</label>
            <select id="admHeroStyle" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="only" ${!bSettings.heroStyle || bSettings.heroStyle === 'only' ? 'selected' : ''}>رئيسية فقط (أول صورة)</option>
              <option value="side" ${bSettings.heroStyle === 'side' ? 'selected' : ''}>رئيسية كبيرة + الباقي جنبها</option>
              <option value="grid" ${bSettings.heroStyle === 'grid' ? 'selected' : ''}>رئيسية ثم شبكة صغيرة أسفلها</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px" id="admSliderStyleGroup" ${bSettings.layout === 'hero' ? 'style="display:none"' : ''}>
            <label style="font-size:.7rem;font-weight:700">نمط العرض:</label>
            <select id="admSliderStyle" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="default" ${bSettings.sliderStyle === 'default' || !bSettings.sliderStyle ? 'selected' : ''}>كلاسيكي</option>
              <option value="cards" ${bSettings.sliderStyle === 'cards' ? 'selected' : ''}>بطاقات جانبية</option>
              <option value="hero" ${bSettings.sliderStyle === 'hero' ? 'selected' : ''}>هيرو (نص على الصورة)</option>
              <option value="full" ${bSettings.sliderStyle === 'full' ? 'selected' : ''}>عريض كامل</option>
              <option value="preview" ${bSettings.sliderStyle === 'preview' ? 'selected' : ''}>مع صورة معاينة</option>
              <option value="grid" ${bSettings.sliderStyle === 'grid' ? 'selected' : ''}>شريط مصغرات</option>
              <option value="glass" ${bSettings.sliderStyle === 'glass' ? 'selected' : ''}>تأثير زجاجي</option>
              <option value="split" ${bSettings.sliderStyle === 'split' ? 'selected' : ''}>تقسيم جانبي</option>
              <option value="minimal" ${bSettings.sliderStyle === 'minimal' ? 'selected' : ''}>بسيط ومسطح</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px" id="admSliderCounterGroup" ${bSettings.layout === 'hero' ? 'style="display:none"' : ''}>
            <label style="font-size:.7rem;font-weight:700">عدّاد رقمي:</label>
            <select id="admSliderCounter" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="show" ${bSettings.sliderCounter !== 'hide' ? 'selected' : ''}>إظهار (مثل 2 / 5)</option>
              <option value="hide" ${bSettings.sliderCounter === 'hide' ? 'selected' : ''}>إخفاء</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">حركة الانتقال:</label>
            <select id="admSliderEffect" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="slide" ${bSettings.sliderEffect === 'slide' || !bSettings.sliderEffect ? 'selected' : ''}>انزلاق</option>
              <option value="fade" ${bSettings.sliderEffect === 'fade' ? 'selected' : ''}>تلاشي</option>
              <option value="zoom" ${bSettings.sliderEffect === 'zoom' ? 'selected' : ''}>تقريب زووم</option>
              <option value="flip" ${bSettings.sliderEffect === 'flip' ? 'selected' : ''}>قلب (Flip)</option>
              <option value="morph" ${bSettings.sliderEffect === 'morph' ? 'selected' : ''}>تحول (Morph)</option>
              <option value="blur" ${bSettings.sliderEffect === 'blur' ? 'selected' : ''}>ضبابي (Blur)</option>
              <option value="parallax" ${bSettings.sliderEffect === 'parallax' ? 'selected' : ''}>-parallax (عمق)</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">السرعة:</label>
            <select id="admBannerInterval" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="3000" ${bSettings.interval == 3000 ? 'selected' : ''}>3 ثوانٍ</option>
              <option value="4000" ${bSettings.interval == 4000 || !bSettings.interval ? 'selected' : ''}>4 ثوانٍ</option>
              <option value="5000" ${bSettings.interval == 5000 ? 'selected' : ''}>5 ثوانٍ</option>
              <option value="7000" ${bSettings.interval == 7000 ? 'selected' : ''}>7 ثوانٍ</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">نسبة الأبعاد:</label>
<select id="admBannerAspectRatio" onchange="adminSaveBannerSettings();updateAdminBannerSizeHints(this.value)" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="3/1" ${bSettings.aspectRatio === '3/1' ? 'selected' : ''}>عريض للغاية (3 : 1)</option>
              <option value="2.5/1" ${bSettings.aspectRatio === '2.5/1' ? 'selected' : ''}>عريض جداً (2.5 : 1)</option>
              <option value="2/1" ${bSettings.aspectRatio === '2/1' || !bSettings.aspectRatio ? 'selected' : ''}>متوسط (2 : 1)</option>
              <option value="16/9" ${bSettings.aspectRatio === '16/9' ? 'selected' : ''}>شاشة عريضة (16 : 9)</option>
              <option value="3/2" ${bSettings.aspectRatio === '3/2' ? 'selected' : ''}>كلاسيكي (3 : 2)</option>
              <option value="4/3" ${bSettings.aspectRatio === '4/3' ? 'selected' : ''}>تقليدي (4 : 3)</option>
              <option value="1/1" ${bSettings.aspectRatio === '1/1' ? 'selected' : ''}>مربع متساوي (1 : 1)</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">انحناء الحواف:</label>
            <select id="admBannerBorderRadius" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="14px" ${bSettings.borderRadius === '14px' || !bSettings.borderRadius ? 'selected' : ''}>دائري خفيف (14px)</option>
              <option value="0px" ${bSettings.borderRadius === '0px' ? 'selected' : ''}>حواف حادة (0px)</option>
              <option value="24px" ${bSettings.borderRadius === '24px' ? 'selected' : ''}>دائري كامل (24px)</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">عرض الصورة:</label>
            <select id="admBannerObjectFit" onchange="adminSaveBannerSettings()" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="cover" ${bSettings.objectFit === 'cover' || !bSettings.objectFit ? 'selected' : ''}>تغطية كاملة (cover)</option>
              <option value="contain" ${bSettings.objectFit === 'contain' ? 'selected' : ''}>صورة كاملة (contain)</option>
              <option value="fill" ${bSettings.objectFit === 'fill' ? 'selected' : ''}>ملء بدون احترام (fill)</option>
              <option value="none" ${bSettings.objectFit === 'none' ? 'selected' : ''}>بدون تغيير (none)</option>
              <option value="scale-down" ${bSettings.objectFit === 'scale-down' ? 'selected' : ''}>تصغير فقط (scale-down)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Preview of the slider style -->
    <div class="admin-card" style="margin-bottom:20px;position:relative">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h4 style="margin:0"><i class="fa-solid fa-eye"></i> معاينة حية لتخطيط العرض</h4>
        <span style="font-size:.7rem;font-weight:700;color:var(--accent)" id="admPreviewLabel">كلاسيكي</span>
      </div>
      <div id="admBannerPreview" style="background:#f1f5f9;border-radius:12px;overflow:hidden;padding:0;max-height:260px"></div>
      <p style="font-size:.68rem;color:var(--text-muted);margin:8px 2px 0">يتحدث تلقائياً أثناء تغيير الإعدادات — هذه محاكاة تقريبية للشكل النهائي على متجرك.</p>
    </div>
    
    <!-- Bottom Card: Banners List (Spans full width) -->
    <div class="admin-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:8px">
        <h4 style="margin:0"><i class="fa-solid fa-list"></i> قائمة البانرات الإعلانية</h4>
        <span style="font-size:0.75rem;font-weight:800;background:var(--accent);color:#fff;padding:4px 10px;border-radius:20px">عدد البانرات المضافة: ${banners.length}</span>
      </div>
      <div id="admBannersList" style="margin-bottom:15px">${adminRenderBannersList(banners)}</div>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminAddBanner()"><i class="fa-solid fa-plus"></i> إضافة بانر جديد</button>
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminSaveBanners()"><i class="fa-solid fa-floppy-disk"></i> حفظ كافة البانرات</button>
      </div>
    </div>`;
  adminToggleHeroStyle(bSettings.layout || 'slider');
  renderAdminBannerPreview();
}

function renderAdminBannerPreview() {
  const box = document.getElementById('admBannerPreview');
  const label = document.getElementById('admPreviewLabel');
  if (!box) return;
  const s = loadBannerSettings();
  const layout = s.layout || 'slider';
  const effect = s.sliderEffect || 'slide';
  const n = 4;
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444'];
  const lg = 'linear-gradient(135deg,#6366f1,#4f46e5)';
  let inner = '';
  let labelText = '';
  let previewH = 200;

  if (layout === 'stack') {
    labelText = 'قائمة عمودية';
    inner = '<div style="display:flex;flex-direction:column;gap:8px;padding:8px 16px">'+colors.slice(0,3).map((c,i)=>'<div style="height:88px;background:'+c+';border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem">بانر '+(i+1)+'</div>').join('')+'</div>';
  } else if (layout === 'grid') {
    labelText = 'شبكة صور';
    inner = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 16px">'+colors.map((c,i)=>'<div style="height:88px;background:'+c+';border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem">بانر '+(i+1)+'</div>').join('')+'</div>';
  } else if (layout === 'peek') {
    labelText = 'سلايدر متداخل';
    inner = '<div style="display:flex;gap:10px;padding:8px 12px;overflow-x:auto;scroll-snap-type:x mandatory">'+colors.map((c,i)=>'<div style="flex:0 0 75%;height:88px;background:'+c+';border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem;border:2px solid rgba(255,255,255,.3)">بانر '+(i+1)+'</div>').join('')+'</div>';
  } else if (layout === 'hero') {
    const hs = s.heroStyle || 'only';
    if (hs === 'only') {
      labelText = 'صورة رئيسية — رئيسية فقط';
      inner = '<div style="height:120px;border-radius:10px;background:'+lg+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800">الصورة الرئيسية فقط</div>';
    } else if (hs === 'side') {
      labelText = 'صورة رئيسية — رئيسية + ثانوية';
      inner = '<div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;background:#e2e8f0;border-radius:10px;overflow:hidden"><div style="height:120px;background:'+lg+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800">رئيسية كبيرة</div><div style="display:flex;flex-direction:column;gap:8px"><div style="height:56px;background:#10b981;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.7rem">ثانوية</div><div style="height:56px;background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.7rem">ثانوية</div></div></div>';
    } else {
      labelText = 'صورة رئيسية — رئيسية ثم شبكة';
      inner = '<div style="display:flex;flex-direction:column;gap:8px;background:#e2e8f0;border-radius:10px;overflow:hidden"><div style="height:64px;background:'+lg+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800">رئيسية</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 8px 8px"><div style="height:44px;background:#10b981;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.68rem">#1</div><div style="height:44px;background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.68rem">#2</div><div style="height:44px;background:#ef4444;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.68rem">#3</div></div></div>';
    }
  } else if (layout === 'premium') {
    labelText = 'عالمية احترافية';
    inner = '<div style="padding:8px 16px"><div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;background:#0f172a;border-radius:10px;overflow:hidden;padding:8px"><div style="height:120px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 40%,#a855f7 100%);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;position:relative;overflow:hidden"><div style="font-size:.9rem;font-weight:900;z-index:1;text-shadow:0 2px 8px rgba(0,0,0,.3)">بانر رئيسي</div><div style="font-size:.65rem;opacity:.8;z-index:1;margin-top:4px">تأثير Parallax + عمق</div></div><div style="display:flex;flex-direction:column;gap:8px"><div style="flex:1;background:#10b981;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.68rem">بطاقة ثانوية</div><div style="flex:1;background:#f59e0b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.68rem">بطاقة ثانوية</div></div></div></div>';
  } else {
    /* SLIDER with animated transition preview */
    const st = s.sliderStyle || 'default';
    let w;
    switch (st) {
      case 'cards': w = '78%'; break;
      case 'preview': w = '65%'; break;
      case 'grid': w = '48%'; break;
      case 'full': w = '100%'; break;
      default: w = 'calc(100% - 32px)';
    }
    const sname = { 'default':'كلاسيكي','cards':'بطاقات جانبية','full':'عريض كامل','preview':'معاينة جانبية','grid':'شريط مصغرات','glass':'زجاجي','split':'تقسيم جانبي','minimal':'بسيط' }[st] || 'كلاسيكي';
    const ename = { 'slide':'انزلاق','fade':'تلاشي','zoom':'زووم','flip':'قلب','morph':'تحول','blur':'ضبابي','parallax':'عمق' }[effect] || 'انزلاق';
    const oname = { 'cover':'تغطية كاملة','contain':'صورة كاملة','fill':'ملء','none':'بدون تغيير','scale-down':'تصغير فقط' }[s.objectFit] || 'تغطية كاملة';
    labelText = 'سلايدر — ' + sname + ' — ' + ename + ' — ' + oname;

    /* Build slide wrappers for transition animation */
    const ratio = s.aspectRatio || '2/1';
    const br = s.borderRadius || '14px';
    const of = s.objectFit || 'cover';
    /* Calculate preview height from aspect ratio */
    const previewW = 400;
    const ratioParts = ratio.split('/');
    const previewH = ratioParts.length === 2 && parseFloat(ratioParts[0]) ? Math.round(previewW / parseFloat(ratioParts[0]) * parseFloat(ratioParts[1])) : 200;
    /* Use real banner images if available */
    const bannerData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
    const realBanners = bannerData.banners || [];
    const slideWrappers = colors.map((c,i) => {
      const realImg = realBanners[i]?.image;
      const bgStyle = realImg
        ? 'background:'+c+';background-image:url('+realImg+');background-size:'+of+';background-position:center;background-repeat:no-repeat'
        : 'background:'+c;
      return '<div class="prev-slide" style="position:absolute;inset:0;transition:transform 0.5s cubic-bezier(.4,0,.2,1),opacity 0.5s ease,filter 0.5s ease;will-change:transform,opacity,filter;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem;'+bgStyle+';border-radius:'+br+'">'+(realImg?'':'بانر '+(i+1))+'</div>';
    }).join('');

    inner = '<div id="admPrevSlider" data-effect="'+effect+'" style="position:relative;height:'+previewH+'px;margin:8px 16px;border-radius:'+br+';overflow:hidden;background:#e2e8f0;aspect-ratio:'+ratio+'">'+slideWrappers+'</div>';

    /* Set initial state after render */
    requestAnimationFrame(() => {
      const sl = document.getElementById('admPrevSlider');
      if (!sl) return;
      applyPreviewSlide(sl, 0, effect);
      startPreviewAuto(sl, effect, n);
    });
  }

  if (label) label.textContent = labelText;
  box.innerHTML = '<div style="position:relative;display:flex;flex-direction:column;justify-content:center;min-height:'+(previewH+44)+'px">'+inner+
    (layout === 'slider' && s.sliderCounter !== 'hide' ? '<div id="admPrevCounter" style="background:rgba(15,23,42,.7);color:#fff;font-size:.7rem;font-weight:800;padding:3px 10px;border-radius:20px;position:absolute;top:8px;left:14px;z-index:5">1 / '+n+'</div>' : '')+
    '</div>';
}

/* Preview transition helpers */
let _prevAutoTimer = null;
function applyPreviewSlide(sl, idx, effect) {
  const slides = sl.querySelectorAll('.prev-slide');
  slides.forEach((s, i) => {
    s.style.transition = 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s ease, filter 0.5s ease';
    const isActive = i === idx;
    switch (effect) {
      case 'fade':
        s.style.transform = 'scale(1)';
        s.style.opacity = isActive ? '1' : '0';
        s.style.filter = 'none';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      case 'zoom':
        s.style.transform = isActive ? 'scale(1)' : 'scale(1.3)';
        s.style.opacity = isActive ? '1' : '0';
        s.style.filter = 'none';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      case 'flip':
        s.style.transform = isActive ? 'perspective(600px) rotateY(0deg)' : 'perspective(600px) rotateY(90deg)';
        s.style.opacity = isActive ? '1' : '0';
        s.style.filter = 'none';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      case 'morph':
        s.style.transform = isActive ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-5deg)';
        s.style.opacity = isActive ? '1' : '0';
        s.style.filter = isActive ? 'none' : 'blur(4px)';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      case 'blur':
        s.style.transform = 'scale(1)';
        s.style.opacity = isActive ? '1' : '0';
        s.style.filter = isActive ? 'blur(0px)' : 'blur(12px)';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      case 'parallax':
        s.style.transform = isActive ? 'translateX(0) scale(1)' : 'translateX(' + ((i < idx ? -30 : 30)) + '%) scale(1.05)';
        s.style.opacity = isActive ? '1' : '0.4';
        s.style.filter = 'none';
        s.style.zIndex = isActive ? '1' : '0';
        break;
      default: /* slide */
        s.style.transform = 'translateX(' + ((i - idx) * 100) + '%)';
        s.style.opacity = '1';
        s.style.filter = 'none';
        s.style.zIndex = isActive ? '1' : '0';
    }
  });
}
function startPreviewAuto(sl, effect, total) {
  if (_prevAutoTimer) clearInterval(_prevAutoTimer);
  let cur = 0;
  _prevAutoTimer = setInterval(() => {
    cur = (cur + 1) % total;
    applyPreviewSlide(sl, cur, effect);
    const cnt = document.getElementById('admPrevCounter');
    if (cnt) cnt.textContent = (cur + 1) + ' / ' + total;
  }, 2000);
}

function adminSaveBanners() {
  const currentData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  currentData.banners = adminGetBanners();
  currentData.bannerSettings = {
    layout: document.getElementById('admBannerLayout')?.value || 'slider',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    heroStyle: document.getElementById('admHeroStyle')?.value || 'only',
    sliderCounter: document.getElementById('admSliderCounter')?.value || 'show',
    autoplay: document.getElementById('admBannerAutoplay')?.checked ?? true,
    interval: parseInt(document.getElementById('admBannerInterval')?.value || 4000),
    aspectRatio: document.getElementById('admBannerAspectRatio')?.value || '2/1',
    borderRadius: document.getElementById('admBannerBorderRadius')?.value || '14px',
    objectFit: document.getElementById('admBannerObjectFit')?.value || 'cover'
  };
  try { localStorage.setItem('mycart_marketing', JSON.stringify(currentData)); } catch(e) {}
  localStorage.setItem('mycart_banner_settings', JSON.stringify(currentData.bannerSettings));
  adminMarkSaved();
  showToast('تم حفظ البانرات', 'success');
}

function adminRenderBannersList(banners) {
  if (!banners || !banners.length) return '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px;background:#f8fafc;border-radius:10px;border:1px dashed var(--border)">لا توجد بانرات إعلانية مضافة بعد.</p>';
  const total = banners.length;
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const bSettings = data.bannerSettings || {};
  return banners.map((b, i) => {
    const hasImg = !!b.image;
    const isActive = b.active !== false;
    return `
    <div class="banner-card" data-idx="${i}" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.02);opacity:${isActive?'1':'0.75'}">
      <!-- Row Header -->
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;flex-wrap:wrap">
        <!-- Number Badge -->
        <div style="width:28px;height:28px;border-radius:50%;background:${isActive?'var(--accent)':'#94a3b8'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;flex-shrink:0">${i+1}</div>
        
        <!-- Reorder Handles -->
        <div style="display:flex;flex-direction:column;gap:2px">
          <button type="button" onclick="adminMoveBanner(${i},-1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:0.75rem;padding:2px;${i===0?'opacity:.2;pointer-events:none':''}" title="تحريك لأعلى"><i class="fa-solid fa-chevron-up"></i></button>
          <button type="button" onclick="adminMoveBanner(${i},1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:0.75rem;padding:2px;${i===total-1?'opacity:.2;pointer-events:none':''}" title="تحريك لأسفل"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        
        <!-- Thumbnail -->
        <div style="width:64px;height:40px;border-radius:6px;overflow:hidden;border:1px solid #f1f5f9;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <img src="${b.image||''}" style="width:100%;height:100%;object-fit:cover;${hasImg?'':'opacity:0.2'}">
        </div>
        
        <!-- Title & Info -->
        <div style="flex:1;min-width:150px">
          <div style="font-weight:700;font-size:0.85rem;color:#1e293b">${b.title || '<span style="color:#94a3b8;font-weight:400;font-style:italic">بدون عنوان</span>'}</div>
          ${b.link ? `<div style="font-size:0.7rem;color:#64748b;margin-top:2px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.link}</div>` : ''}
        </div>
        
        <!-- Status Badge -->
        <span style="font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:6px;background:${isActive?'#dcfce7':'#f1f5f9'};color:${isActive?'#15803d':'#475569'}">
          ${isActive?'نشط':'معطل'}
        </span>
        
        <!-- Actions -->
        <div style="display:flex;gap:6px">
          <button type="button" class="banner-edit-btn" onclick="adminToggleEditBanner(${i})" style="background:#f1f5f9;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--accent)" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button type="button" onclick="adminDeleteBanner(${i})" style="background:#fef2f2;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ef4444" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
      
      <!-- Collapsible Edit Form -->
      <div class="banner-edit" style="display:none;padding:16px;background:#f8fafc;border-top:1px solid #f1f5f9">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
          <i class="fa-solid fa-${b.title ? 'pen-to-square' : 'plus-circle'}" style="color:var(--accent);font-size:.9rem"></i>
          <span style="font-weight:700;font-size:.85rem;color:#1e293b;flex:1">${b.title ? 'تعديل البانر #' + (i+1) : 'إضافة بانر جديد #' + (i+1)}</span>
          <button type="button" onclick="adminToggleEditBanner(${i})" style="background:#fee2e2;border:none;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ef4444;font-size:.75rem" title="إغلاق"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:12px">
          <!-- Title Input -->
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">عنوان البانر</label>
            <input type="text" class="banner-title-input" placeholder="اكتب عنواناً للبانر..." value="${(b.title||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <!-- Button Text -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">نص الزر</label>
              <input type="text" class="banner-btn-input" placeholder="مثال: تسوق الآن" value="${(b.btnText||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
            <!-- Product Selector Dropdown -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">ربط بمنتج سريع</label>
              <select onchange="this.parentElement.parentElement.querySelector('.banner-link-input').value = this.value" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff;height:35px">
                <option value="">-- اختر منتجاً --</option>
                ${(typeof products !== 'undefined' ? products : []).map(p => `<option value="javascript:openDetail(${p.id})" ${b.link === `javascript:openDetail(${p.id})` ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <!-- Destination Link -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">رابط التوجيه</label>
              <input type="text" class="banner-link-input" placeholder="الرابط عند الضغط" value="${(b.link||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.72rem;font-weight:700;cursor:pointer;color:#475569">
              <input type="checkbox" class="banner-show-minicard-input" ${b.showMiniCard ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;margin:0">
              <span>عرض بطاقة منبثقة مصغرة للمنتج المربوط على البانر أمام العملاء</span>
            </label>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px">
            <div style="flex:1;min-width:140px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">نص الشارة/العلم (مثال: جديد، عرض خاص)</label>
              <input type="text" class="banner-badge-text-input" placeholder="اتركه فارغاً لإخفاء الشارة" value="${(b.badgeText||'').replace(/"/g,'&quot;')}" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
            <div style="flex:1;min-width:120px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">حركة الشارة</label>
              <select class="banner-badge-anim-input" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff;height:32px">
                <option value="pulse" ${b.badgeAnim==='pulse'?'selected':''}>نبض (تكبير وتصغير)</option>
                <option value="glow" ${b.badgeAnim==='glow'?'selected':''}>وهج (إضاءة خلفية)</option>
                <option value="float" ${b.badgeAnim==='float'?'selected':''}>عائم (حركة رأسية)</option>
                <option value="none" ${b.badgeAnim==='none'?'selected':''}>بدون حركة</option>
              </select>
            </div>
            <div style="width:70px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">لون الشارة</label>
              <input type="color" class="banner-badge-color-input" value="${b.badgeColor || '#ef4444'}" style="width:100%;height:32px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;padding:0;background:none">
            </div>
          </div>
          
          <!-- Image Upload & Preview Box -->
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">صورة البانر <span class="banner-size-hint" style="font-size:0.65rem;color:#e11d48;font-weight:600;margin-right:6px">(المقاس الموصى به: ${bSettings.aspectRatio === '3/1' ? '1200 × 400 بكسل - نسبة 3:1' : bSettings.aspectRatio === '2.5/1' ? '1200 × 480 بكسل - نسبة 2.5:1' : bSettings.aspectRatio === '16/9' ? '1200 × 675 بكسل - نسبة 16:9' : bSettings.aspectRatio === '3/2' ? '1200 × 800 بكسل - نسبة 3:2' : bSettings.aspectRatio === '4/3' ? '1200 × 900 بكسل - نسبة 4:3' : bSettings.aspectRatio === '1/1' ? '1200 × 1200 بكسل - نسبة 1:1' : '1200 × 600 بكسل - نسبة 2:1'})</span></label>
            <div style="display:flex;align-items:center;gap:12px;background:#fff;padding:8px;border:1px solid #cbd5e1;border-radius:6px">
              <div style="width:60px;height:40px;border-radius:4px;overflow:hidden;border:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0">
                <img class="banner-img-preview" src="${b.image||''}" style="width:100%;height:100%;object-fit:cover;${hasImg?'':'display:none'}">
              </div>
              <button type="button" onclick="this.parentElement.querySelector('.banner-file-input').click()" style="background:#fff;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:700;color:#475569;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-cloud-arrow-up" style="color:var(--accent)"></i> رفع صورة</button>
              <input type="file" class="banner-file-input" accept="image/*" style="display:none" onchange="adminBannerUpload(this)">
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function adminToggleEditBanner(idx) {
  const card = document.querySelector(`.banner-card[data-idx="${idx}"]`);
  if (!card) return;
  const edit = card.querySelector('.banner-edit');
  const editBtn = card.querySelector('.banner-edit-btn');
  if (edit.style.display === 'block') {
    edit.style.display = 'none';
    if (editBtn) { editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>'; editBtn.title = 'تعديل'; }
  } else {
    edit.style.display = 'block';
    if (editBtn) { editBtn.innerHTML = '<i class="fa-solid fa-xmark" style="color:#ef4444"></i>'; editBtn.title = 'إغلاق'; }
  }
}

function adminToggleBanner(idx) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  const b = data.banners[idx];
  if (!b) return;
  b.active = b.active === false ? true : false;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminMoveBanner(idx, dir) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= data.banners.length) return;
  [data.banners[idx], data.banners[newIdx]] = [data.banners[newIdx], data.banners[idx]];
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminAddBanner() {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  data.banners.push({ image: '', title: '', link: '', btnText: '', active: true });
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
  const idx = data.banners.length - 1;
  setTimeout(() => adminToggleEditBanner(idx), 50);
}

function adminDeleteBanner(idx) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  data.banners.splice(idx, 1);
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminExport() {
  const data = {
    products, settings: loadAdminSettings(),
    orders: JSON.parse(localStorage.getItem('mycart_orders') || '[]'),
    cart: JSON.parse(localStorage.getItem('mycart_cart') || '[]'),
    customer: JSON.parse(localStorage.getItem('mycart_customer') || '{}'),
    logo: localStorage.getItem('mycart_logo') || '',
    bg: localStorage.getItem('mycart_bg') || '',
    marketing: JSON.parse(localStorage.getItem('mycart_marketing')) || {},
    categories: JSON.parse(localStorage.getItem('mycart_categories') || '[]'),
    date: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `متجري-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  document.getElementById('adminDataStatus').textContent = '✅ تم التصدير';
}

function adminImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.products) { products.length = 0; products.push(...data.products); saveProductsToLS(); }
      if (data.settings) { try { localStorage.setItem('mycart_admin_settings', JSON.stringify(data.settings)); } catch(e) {} adminSettings = data.settings; WHOLESALE_CODE = data.settings.wholesaleCode || ''; CURRENCY = data.settings.currency || '₪'; }
      if (data.orders) { try { localStorage.setItem('mycart_orders', JSON.stringify(data.orders)); } catch(e) {} }
      if (data.cart) { try { localStorage.setItem('mycart_cart', JSON.stringify(data.cart)); } catch(e) {} }
      if (data.customer) { try { localStorage.setItem('mycart_customer', JSON.stringify(data.customer)); } catch(e) {} }
      if (data.logo) { try { localStorage.setItem('mycart_logo', data.logo); } catch(e) {} document.getElementById('storeLogo').src = data.logo; }
      if (data.bg) { try { localStorage.setItem('mycart_bg', data.bg); } catch(e) {} document.getElementById('header').style.setProperty('--header-bg', `url(${data.bg})`); document.getElementById('header').classList.add('has-bg'); }
      // Re-render store with new settings
      renderProducts(getFilteredProducts());
      renderCartItems();
      document.getElementById('adminDataStatus').textContent = '✅ تم الاستيراد';
      adminRefreshAll();
      showToast('✅ تم استيراد البيانات', 'success');
    } catch(err) { showToast('⚠️ ملف غير صالح', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function adminResetAll() {
  showConfirmModal('هل أنت متأكد من حذف كل البيانات؟<br><small style="color:#ef4444">لا يمكن التراجع عن هذا الإجراء</small>', function() {
    showConfirmModal('تأكيد نهائي — سيتم مسح جميع البيانات؟', function() {
      localStorage.removeItem('mycart_admin_products');
      localStorage.removeItem('mycart_admin_settings');
      localStorage.removeItem('mycart_orders');
      localStorage.removeItem('mycart_cart');
      localStorage.removeItem('mycart_customer');
      localStorage.removeItem('mycart_logo');
      localStorage.removeItem('mycart_bg');
      localStorage.removeItem('mycart_wholesale');
      localStorage.removeItem('mycart_marketing');
      products.length = 0;
      adminRefreshAll();
      showToast('✅ تم إعادة تعيين الكل', 'success');
    });
  });
}

function adminRenderOrderDetailPage() {
  if (adminOrderEditMode) adminRenderOrderEditPage();
  else adminRenderOrderViewPage();
}

function adminRenderOrderViewPage() {
  const d = adminOrderEditData;
  if (!d) return;
  const currency = CURRENCY;
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = d.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (d.delivery || 0);
  const rawSt = d._status === 'done' ? 'completed' : (d._status || 'pending');
  const currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;
  const isWholesale = d.wholesale === true || d.isWholesale === true;

  const statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
    var info = QUICK_ORDER_STATUSES[stKey];
    var isCurrent = rawSt === stKey;
    return `<button type="button" onclick="updateQuickOrderStatusSelect(adminOrderEditIdx, '${stKey}'); adminOrderEditData._status = '${stKey}'; adminRenderOrderViewPage();" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:6px 14px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 3px 10px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
  }).join('');

  document.getElementById('admin-orderDetail').innerHTML = `
    <!-- Top Action Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <button onclick="adminBackToOrders()" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:.82rem;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-right"></i> العودة للطلبات</button>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-primary" onclick="adminToggleOrderEditMode()" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700"><i class="fa-solid fa-pen"></i> تعديل الطلب</button>
        <button class="admin-btn admin-btn-secondary" onclick="printOrderData(adminOrderEditData, CURRENCY)" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700"><i class="fa-solid fa-print"></i> طباعة الفاتورة</button>
      </div>
    </div>

    <!-- Header Status Banner -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="background:var(--accent);color:#fff;padding:6px 14px;border-radius:8px;font-weight:900;font-size:1.05rem">#${String(d.id).slice(-6)}</span>
        ${isWholesale ? '<span style="background:rgba(245,158,11,.15);color:#f59e0b;padding:4px 10px;border-radius:8px;font-weight:900;font-size:.78rem"><i class="fa-solid fa-bag-shopping"></i> طلب جملة</span>' : ''}
        <div>
          <div style="font-size:.78rem;color:var(--text-muted)">تاريخ الطلب</div>
          <div style="font-weight:800;font-size:.88rem;color:var(--text)"><i class="fa-regular fa-calendar" style="color:var(--accent)"></i> ${d.date}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:.8rem;color:var(--text-muted);font-weight:700">الحالة الحالية:</span>
        <span style="padding:6px 16px;border-radius:999px;font-size:.82rem;font-weight:900;background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px ${currSt.color}20"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
      </div>
    </div>

    <!-- 2-Column Main Dashboard Layout -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px" class="order-details-grid">
      
      <!-- MAIN LEFT COLUMN: Products & Status Changer -->
      <div>
        <!-- Interactive Status Control Box -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.82rem;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrows-rotate" style="color:var(--accent)"></i> تغيير حالة الطلب بنقرة واحدة:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${statusChipsHtml}
          </div>
        </div>

        <!-- Products Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-box-open" style="color:var(--accent)"></i> محتويات الطلب (${d.items?.length || 0} منتجات)</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${d.items.map(item => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
                <img src="${item.image || 'https://placehold.co/50x50/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#e2e8f0;border:1px solid #cbd5e1">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:800;font-size:.88rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
                  ${item.variant ? `<div style="font-weight:600;color:#64748b;font-size:.78rem;margin-top:2px">${variantSwatchHtml(item.variantData)} الخيار: ${item.variant}</div>` : ''}
                  <div style="font-size:.78rem;color:#64748b;margin-top:2px">${currency}${item.price} × <strong style="color:#1e293b">${item.qty}</strong></div>
                </div>
                <div style="font-weight:900;font-size:.98rem;color:var(--accent);flex-shrink:0">${currency}${(item.price * item.qty).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SIDEBAR RIGHT COLUMN: Customer Info & Order Summary -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Customer Info Sidebar Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-user-gear" style="color:var(--accent)"></i> بيانات الزبون والتوصيل</div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:.84rem">
            <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="width:34px;height:34px;border-radius:9px;background:#e0e7ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-user"></i></span>
              <div style="flex:1;min-width:0;line-height:1.3">
                <span style="color:var(--text-muted);font-size:.72rem">الاسم الكامل</span><br>
                <strong id="ovName" style="font-size:.9rem;color:#0f172a;word-break:break-word">${d.customer?.name || '—'}</strong>
              </div>
              ${d.customer?.name ? `<button onclick="copyBtn(this,document.getElementById('ovName').textContent,'الاسم')" title="نسخ الاسم" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;color:#64748b;cursor:pointer;flex-shrink:0"><i class="fa-regular fa-copy"></i></button>` : ''}
            </div>
            <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="width:34px;height:34px;border-radius:9px;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-phone"></i></span>
              <div style="flex:1;min-width:0;line-height:1.3">
                <span style="color:var(--text-muted);font-size:.74rem">رقم الهاتف</span><br>
                <strong dir="ltr" id="ovPhone" style="font-size:.9rem;color:#0f172a;display:inline-block;word-break:break-all">${d.customer?.phone || '—'}</strong>
              </div>
              ${d.customer?.phone ? `<button onclick="copyBtn(this,document.getElementById('ovPhone').textContent,'رقم الهاتف')" title="نسخ الهاتف" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;color:#64748b;cursor:pointer;flex-shrink:0"><i class="fa-regular fa-copy"></i></button>` : ''}
            </div>
            ${d.customer?.city ? `<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="width:34px;height:34px;border-radius:9px;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-city"></i></span>
              <div style="flex:1;min-width:0;line-height:1.3">
                <span style="color:var(--text-muted);font-size:.74rem">المدينة</span><br>
                <strong id="ovCity" style="color:#0f172a;word-break:break-word">${d.customer.city}</strong>
              </div>
              <button onclick="copyBtn(this,document.getElementById('ovCity').textContent,'المدينة')" title="نسخ المدينة" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;color:#64748b;cursor:pointer;flex-shrink:0"><i class="fa-regular fa-copy"></i></button>
            </div>` : ''}
            ${d.customer?.address ? `<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="width:34px;height:34px;border-radius:9px;background:#d1fae5;color:#047857;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-location-dot"></i></span>
              <div style="flex:1;min-width:0;line-height:1.3">
                <span style="color:var(--text-muted);font-size:.74rem">العنوان</span><br>
                <strong id="ovAddr" style="color:#0f172a;word-break:break-word">${d.customer.address}</strong>
              </div>
              <button onclick="copyBtn(this,document.getElementById('ovAddr').textContent,'العنوان')" title="نسخ العنوان" style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;color:#64748b;cursor:pointer;flex-shrink:0"><i class="fa-regular fa-copy"></i></button>
            </div>` : ''}
            </div>
            ${d.deliveryZone ? `<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="width:34px;height:34px;border-radius:9px;background:#fde68a;color:#92400e;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-truck-fast"></i></span>
              <div style="flex:1;min-width:0;line-height:1.3"><span style="color:var(--text-muted);font-size:.74rem">منطقة التوصيل</span><br><strong style="color:#0f172a;word-break:break-word">${d.deliveryZone}</strong></div>
            </div>` : ''}
            ${d.customer?.location ? `<div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;padding:12px;border-radius:12px">
              <span style="color:#047857;font-size:.74rem;font-weight:800;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-location-dot" style="color:#10b981"></i> موقع الزبون (GPS)</span>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <span dir="ltr" style="background:#fff;border:1px solid #d1fae5;padding:5px 10px;border-radius:8px;font-family:monospace;font-size:.85rem;font-weight:700;color:#065f46;word-break:break-all;flex:1;min-width:0">${d.customer.location}</span>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <button onclick="copyBtn(this,'${String(d.customer.location).replace(/'/g,'')}','الإحداثيات')" style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;background:#fff;border:1px solid #a7f3d0;color:#047857;border-radius:8px;padding:5px 10px;font-size:.75rem;font-weight:800;cursor:pointer"><i class="fa-regular fa-copy"></i> نسخ</button>
                  <a href="https://www.google.com/maps?q=${encodeURIComponent(d.customer.location)}" target="_blank" style="white-space:nowrap;background:#10b981;color:#fff;border-radius:8px;padding:6px 12px;font-size:.75rem;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-map-location-dot"></i> فتح الخريطة</a>
                </div>
              </div>
            </div>` : ''}
            ${d.note ? `<div style="background:#fff7ed;border:1px solid #ffedd5;padding:10px 12px;border-radius:8px"><span style="color:#c2410c;font-size:.74rem;font-weight:800">📝 ملاحظة الزبون:</span><p style="font-size:.82rem;font-weight:700;color:#9a3412;margin-top:2px">${d.note}</p></div>` : ''}
          </div>
        </div>

        <!-- Order Financial Summary Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-calculator" style="color:var(--accent)"></i> الملخص المالي</div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:.85rem">
            <div style="display:flex;justify-content:space-between;color:#64748b"><span>المجموع الفرعي:</span><strong style="color:#1e293b">${currency}${subtotal.toFixed(2)}</strong></div>
            ${disc > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a"><span>الخصم (${disc}%):</span><strong>-${currency}${discAmt.toFixed(2)}</strong></div>` : ''}
            ${d.delivery ? `<div style="display:flex;justify-content:space-between;color:#64748b"><span>التوصيل:</span><strong style="color:#1e293b">${currency}${d.delivery.toFixed(2)}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:900;padding-top:8px;border-top:1.5px solid var(--border);margin-top:4px;color:var(--accent)">
              <span>المجموع الكلي:</span>
              <span>${currency}${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function adminRenderOrderEditPage() {
  const d = adminOrderEditData;
  if (!d) return;
  const currency = CURRENCY;
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = d.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (d.delivery || 0);
  const rawSt = d._status === 'done' ? 'completed' : (d._status || 'pending');
  const currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;

  const statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
    var info = QUICK_ORDER_STATUSES[stKey];
    var isCurrent = rawSt === stKey;
    return `<button type="button" onclick="updateQuickOrderStatusSelect(adminOrderEditIdx, '${stKey}'); adminOrderEditData._status = '${stKey}'; adminRenderOrderEditPage();" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:6px 14px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 3px 10px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
  }).join('');

  document.getElementById('admin-orderDetail').innerHTML = `
    <!-- Top Action Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <button onclick="adminBackToOrders()" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:.82rem;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-right"></i> العودة للطلبات</button>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-primary" onclick="adminSaveOrderEdit()" style="padding:8px 18px;border-radius:10px;font-size:.82rem;font-weight:800"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button>
        <button class="admin-btn admin-btn-secondary" onclick="adminToggleOrderEditMode()" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700">إلغاء التعديل</button>
      </div>
    </div>

    <!-- Header Status Banner -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="background:#ef4444;color:#fff;padding:6px 14px;border-radius:8px;font-weight:900;font-size:1.05rem">#${String(d.id).slice(-6)} (وضع التعديل)</span>
        <div>
          <div style="font-size:.78rem;color:var(--text-muted)">تاريخ الطلب</div>
          <div style="font-weight:800;font-size:.88rem;color:var(--text)"><i class="fa-regular fa-calendar" style="color:var(--accent)"></i> ${d.date}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:.8rem;color:var(--text-muted);font-weight:700">الحالة:</span>
        <span style="padding:6px 16px;border-radius:999px;font-size:.82rem;font-weight:900;background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:6px"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
      </div>
    </div>

    <!-- 2-Column Main Dashboard Layout (Edit Mode) -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px" class="order-details-grid">
      
      <!-- MAIN LEFT COLUMN: Products & Status Changer -->
      <div>
        <!-- Interactive Status Control Box -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.82rem;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrows-rotate" style="color:var(--accent)"></i> حالة الطلب:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${statusChipsHtml}
          </div>
        </div>

        <!-- Products Card Edit -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:.9rem;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px"><i class="fa-solid fa-box-open" style="color:var(--accent)"></i> المنتجات في الطلب</div>
            <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="openProductPicker()" style="padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800"><i class="fa-solid fa-plus"></i> إضافة منتج</button>
          </div>
          <div id="oeItemsList" style="display:flex;flex-direction:column;gap:8px">
            ${d.items.map((item, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
                <img src="${item.image || 'https://placehold.co/50x50/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#e2e8f0">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:800;font-size:.88rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
                  ${item.variant ? `<div style="font-weight:600;color:#64748b;font-size:.78rem">${variantSwatchHtml(item.variantData)} الخيار: ${item.variant}</div>` : ''}
                  <div style="font-size:.78rem;color:#64748b">${currency}${item.price}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <span style="font-size:.75rem;font-weight:700;color:var(--text-muted)">الكمية:</span>
                  <input type="number" value="${item.qty}" min="1" style="width:55px;padding:5px;border:1.5px solid var(--border);border-radius:6px;text-align:center;font-family:inherit;font-size:.85rem;font-weight:800" onchange="adminOrderEditChangeQty(${i},this.value)">
                </div>
                <button onclick="adminOrderEditRemoveItem(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;flex-shrink:0;padding:4px"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SIDEBAR RIGHT COLUMN: Editable Customer Info & Summary -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Customer Info Edit Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-user-pen" style="color:var(--accent)"></i> تعديل بيانات العميل</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">الاسم الكامل</label>
              <input type="text" id="oeName" value="${d.customer?.name || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">رقم الهاتف</label>
              <input type="text" id="oePhone" value="${d.customer?.phone || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700" dir="ltr">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">المدينة</label>
              <input type="text" id="oeCity" value="${d.customer?.city || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">العنوان التفصيلي</label>
              <input type="text" id="oeAddr" value="${d.customer?.address || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
          </div>
        </div>

        <!-- Order Financial Summary & Discount Edit Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-calculator" style="color:var(--accent)"></i> الملخص والخصم</div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:.85rem">
            <div style="display:flex;align-items:center;justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 10px">
              <span style="font-weight:800;color:#15803d;font-size:.8rem"><i class="fa-solid fa-tag"></i> نسبة الخصم (%)</span>
              <input type="number" id="oeDiscount" value="${disc}" min="0" max="100" style="width:65px;padding:5px;border:1.5px solid #86efac;border-radius:6px;text-align:center;font-family:inherit;font-size:.85rem;font-weight:800" onchange="adminOrderEditUpdateTotal()">
            </div>
            <div style="display:flex;justify-content:space-between;color:#64748b;margin-top:4px"><span>المجموع الفرعي:</span><strong style="color:#1e293b">${currency}${subtotal.toFixed(2)}</strong></div>
            ${d.delivery ? `<div style="display:flex;justify-content:space-between;color:#64748b"><span>التوصيل:</span><strong style="color:#1e293b">${currency}${d.delivery.toFixed(2)}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:900;padding-top:8px;border-top:1.5px solid var(--border);margin-top:4px;color:var(--accent)">
              <span>المجموع الكلي:</span>
              <span id="oeTotal">${currency}${total.toFixed(2)}</span>
            </div>
          </div>
          <button class="admin-btn admin-btn-primary" onclick="adminSaveOrderEdit()" style="width:100%;margin-top:14px;padding:10px;border-radius:8px;font-weight:900"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button>
        </div>
      </div>

    </div>
  `;
}

/* ── Subscription ── */
function adminRenderSubscriptionTab() {
  var container = document.getElementById('admin-subscription');
  if (!container) return;
  var info = getFeeInfo();
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var planLabel = plans[info.plan] || info.plan;
  var isFree = info.plan === 'free';
  var statusColor = isFree && info.accrued >= info.limit ? '#ef4444' : '#10b981';
  var sett = getAgencySettings();
  var freeFee = sett.freeFee || '2', monthlyFee = sett.monthlyFee || '100', annualFee = sett.annualFee || '1000';
  var suspDate = localStorage.getItem('mycart_fee_threshold_date');
  var daysLeft = '';
  if (suspDate && isFree) { var diff = Math.ceil((new Date(suspDate) - new Date()) / 86400000); daysLeft = diff > 0 ? 'مهلة '+diff+' يوم' : '⚠️ منتهي!'; }
  var pct = isFree && info.accrued > 0 ? Math.min(100, Math.round((info.accrued/info.limit)*100)) : 0;
  container.innerHTML = ''
    + '<div class="sub-hero"><div style="position:relative;z-index:1">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:14px">'
    + '<div><span style="display:inline-flex;align-items:center;gap:4px;font-size:.65rem;background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:999px;font-weight:800;margin-bottom:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> الاشتراك والفوترة</span>'
    + '<h2 style="font-size:1.2rem;font-weight:1000;margin:0;color:#0f172a">'+planLabel+'</h2>'
    + '<p style="font-size:.75rem;color:#64748b;margin:1px 0 0">'+(isFree?'الخطة المجانية • '+freeFee+' ₪ رسم لكل طلب':'إعفاء كامل من عمولات الطلبات')+'</p></div>'
    + '<a href="../../agency/index.html" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;background:#f1f5f9;color:#1e293b;font-weight:700;font-size:.72rem;text-decoration:none;border:1px solid #e2e8f0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg> منصة الشركة</a></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">'
    + '<div class="sub-hero-stat"><div class="label">إجمالي الطلبات</div><div class="value">'+info.count+'</div></div>'
    + (isFree ? '<div class="sub-hero-stat"><div class="label">الرسوم المتراكمة</div><div class="value" style="color:'+statusColor+'">'+info.accrued+' / '+info.limit+' ₪</div></div>' : '<div class="sub-hero-stat"><div class="label">حالة العمولات</div><div class="value" style="color:#10b981">0 ₪ (إعفاء)</div></div>')
    + '<div class="sub-hero-stat"><div class="label">الحالة</div><div class="value" style="color:'+(daysLeft && daysLeft.indexOf('منتهي')>=0 ? '#ef4444' : '#10b981')+'">'+(daysLeft && daysLeft.indexOf('منتهي')>=0 ? 'موقوف' : 'نشط')+'</div></div>'
    + (daysLeft ? '<div class="sub-hero-stat"><div class="label">المهلة</div><div class="value" style="color:'+statusColor+'">'+daysLeft+'</div></div>' : '')
    + '</div></div></div>'
    + (isFree && info.accrued > 0 ? '<div class="sub-fee-bar"><div style="display:flex;justify-content:space-between;align-items:center"><div><span style="font-weight:800;font-size:.8rem;color:#0f172a">استهلاك حد الطلبات</span><br><span style="font-size:.65rem;color:#64748b">'+info.accrued+' ₪ من أصل '+info.limit+' ₪</span>'+(daysLeft?'<span style="font-size:.68rem;font-weight:900;color:#ef4444"> • '+daysLeft+'</span>':'')+'</div><span style="font-size:1rem;font-weight:1000;color:'+statusColor+'">'+pct+'%</span></div><div class="track"><div class="fill" style="width:'+pct+'%;background:'+statusColor+'"></div></div>'+(info.accrued>=info.limit?'<button onclick="paySubscriptionFees();setTimeout(adminRenderSubscriptionTab,300)" style="width:100%;margin-top:10px;padding:9px;border:none;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-weight:900;font-size:.78rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(6,182,212,.25)"><i class="fa-solid fa-wallet" style="font-size:1rem"></i> تسديد '+info.accrued+' ₪ الآن</button>':'')+'</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'
    // Free
    + '<div class="sub-plan-card'+(info.plan==='free'?' active':'')+'">'
    + (info.plan==='free'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">مجانية</h3><p style="font-size:.65rem;color:#64748b;margin:0">بدون تكاليف شهرية</p></div></div>'
    + '<div class="price">0 ₪<span>/ شهرياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> متجر إلكتروني متكامل</li><li><i class="fa-solid fa-check"></i> <strong>'+freeFee+' ₪</strong> رسم لكل طلب</li><li><i class="fa-solid fa-check"></i> منتجات وتصنيفات بلا حدود</li><li><i class="fa-solid fa-check"></i> استقبال طلبات بالواتساب</li></ul>'
    + (info.plan!=='free'?'<button onclick="adminSwitchPlan(\'free\')" style="width:100%;padding:8px;border:1.5px solid #e2e8f0;border-radius:10px;background:transparent;color:#1e293b;font-weight:800;font-size:.75rem;cursor:pointer;font-family:inherit">التبديل إلى المجانية</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div>'
    // Monthly
    + '<div class="sub-plan-card recommended'+(info.plan==='monthly'?' active':'')+'">'
    + (info.plan==='monthly'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'<span style="position:absolute;top:-8px;left:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:.55rem;font-weight:900;padding:3px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(59,130,246,.25)">المفضلة</span>')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">شهرية</h3><p style="font-size:.65rem;color:#64748b;margin:0">إلغاء عمولة الطلبات</p></div></div>'
    + '<div class="price">'+monthlyFee+' ₪<span>/ شهرياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> <strong>0 ₪ عمولة على الطلبات</strong></li><li><i class="fa-solid fa-check"></i> طلبات ومنتجات غير محدودة</li><li><i class="fa-solid fa-check"></i> ميزات التسويق كاملة</li><li><i class="fa-solid fa-check"></i> دعم فني مباشر</li></ul>'
    + (info.plan!=='monthly'?'<button onclick="adminSwitchPlan(\'monthly\')" style="width:100%;padding:8px;border:none;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-weight:900;font-size:.75rem;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(59,130,246,.25)">اشترك شهرياً</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div>'
    // Annual
    + '<div class="sub-plan-card'+(info.plan==='annual'?' active':'')+'">'
    + (info.plan==='annual'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">سنوية VIP</h3><p style="font-size:.65rem;color:#64748b;margin:0">الأفضل توفيراً</p></div></div>'
    + '<div class="price">'+annualFee+' ₪<span>/ سنوياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> <strong>توفير 200+ ₪ سنوياً</strong></li><li><i class="fa-solid fa-check"></i> <strong>0 ₪ عمولة (إعفاء كامل)</strong></li><li><i class="fa-solid fa-check"></i> نطاق خاص مجاني</li><li><i class="fa-solid fa-check"></i> دعم VIP وتخصيص ثيمات</li></ul>'
    + (info.plan!=='annual'?'<button onclick="adminSwitchPlan(\'annual\')" style="width:100%;padding:8px;border:none;border-radius:10px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;font-weight:900;font-size:.75rem;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(15,23,42,.15)">اشترك سنوياً</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div></div>'
    // History
    + '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-top:14px">'
    + '<h4 style="font-weight:900;margin:0 0 10px;display:flex;align-items:center;gap:6px;color:#0f172a;font-size:.85rem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> سجل الاشتراك</h4>'
    + renderSubscriptionLog()
    + '</div>';
}
function renderSubscriptionLog() {
  var log = []; try { var r = localStorage.getItem('mycart_subscription_log'); if (r) log = JSON.parse(r); } catch(e) {}
  if (!log.length) return '<p style="font-size:.75rem;color:#94a3b8;text-align:center;padding:10px 0">لا توجد حركات اشتراك بعد</p>';
  return '<div style="display:flex;flex-direction:column;gap:3px">'+log.slice().reverse().map(function(e){
    var icon = e.action === 'plan_change' ? 'fa-arrows-rotate' : e.action === 'payment' ? 'fa-wallet' : 'fa-circle-info';
    var color = e.action === 'plan_change' ? '#3b82f6' : e.action === 'payment' ? '#10b981' : '#64748b';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8fafc;border-radius:8px;font-size:.75rem">'
      + '<span style="width:24px;height:24px;border-radius:50%;background:'+color+'15;color:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:.6rem"></i></span>'
      + '<div style="flex:1"><div style="font-weight:700;font-size:.75rem">'+e.details+'</div><div style="font-size:.62rem;color:#94a3b8">'+e.date+'</div></div></div>';
  }).join('')+'</div>';
}
function addSubscriptionLog(action, details) {
  var log = []; try { var r = localStorage.getItem('mycart_subscription_log'); if (r) log = JSON.parse(r); } catch(e) {}
  log.push({ action:action, details:details, date:new Date().toLocaleDateString('ar-SA')+' '+new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}) });
  try { localStorage.setItem('mycart_subscription_log', JSON.stringify(log)); } catch(e) {}
}
function adminSwitchPlan(plan) {
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  if (plan === localStorage.getItem('mycart_subscription_plan')) { showAlertModal('أنت مشترك في هذه الخطة بالفعل.'); return; }
  showSubscriptionCodeModal(plan);
}
function getMyStoreKey() {
  var parts = window.location.pathname.split('/');
  var i = parts.indexOf('stores');
  return (i !== -1 && parts[i+1]) ? parts[i+1] : 'default';
}
function showSubscriptionCodeModal(plan) {
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var sett = getAgencySettings();
  var fees = { free:'0 ₪', monthly:(sett.monthlyFee||'100')+' ₪', annual:(sett.annualFee||'1000')+' ₪' };
  var log = []; try { log = JSON.parse(localStorage.getItem('mycart_subscription_log') || '[]'); } catch(e){}
  var isFirstChange = !log.some(function(e){ return e.action === 'plan_change'; });
  var waLink = '';
  var waNumber = (sett.supportWa || '0590000000').replace(/\s+/g, '');
  if (waNumber) {
    var waMsg = 'مرحباً FAST7 👋، أريد كود تفعيل اشتراكي في خطة '+(plans[plan]||'')+'. رقم متجري: '+(localStorage.getItem('mycart_store_name')||'');
    waLink = '<a href="https://wa.me/'+waNumber+'?text='+encodeURIComponent(waMsg)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;border:none;border-radius:10px;background:#25D366;color:#fff;font-weight:900;font-size:.85rem;cursor:pointer;font-family:inherit;margin-bottom:10px;text-decoration:none"><i class="fa-brands fa-whatsapp" style="font-size:1.1rem"></i> تواصل معنا عبر الواتساب</a>';
  }
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:70000;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML = '<div style="background:var(--card,#fff);border-radius:20px;max-width:400px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:24px;text-align:center">'
    + '<div style="width:52px;height:52px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.5rem;color:#2563eb"><i class="fa-solid fa-key"></i></div>'
    + '<h3 style="font-size:1rem;font-weight:900;margin:0 0 4px;color:var(--text,#1e293b)">تفعيل اشتراك '+plans[plan]+'</h3>'
    + '<p style="font-size:.85rem;color:var(--text-muted,#64748b);margin:0 0 12px">القيمة: <strong>'+fees[plan]+'</strong></p>'
    + (isFirstChange ? '<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:8px 10px;font-size:.72rem;color:#854d0e;margin-bottom:10px;text-align:right">📌 ملاحظة: في حال تغيير الاشتراك لأول مرة يجب دفع مسبق لقيمة الاشتراك.</div>' : '')
    + '<p style="font-size:.75rem;color:var(--text-muted,#64748b);margin:0 0 10px;text-align:right">للحصول على كود التفعيل، تواصل مع الشركة المزودة (FAST7) عبر الواتساب وسيرسل لك كوداً خاصاً بطلبك.</p>'
    + waLink
    + '<input id="subCodeInput" type="text" dir="ltr" placeholder="أدخل كود التفعيل..." style="width:100%;padding:11px 12px;border:2px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.9rem;text-align:center;letter-spacing:2px;margin-bottom:8px;background:#fff;color:#0f172a">'
    + '<div id="subCodeError" style="display:none;color:#ef4444;font-size:.75rem;font-weight:700;margin-bottom:8px">الكود غير صحيح. تأكد من الكود أو تواصل مع الشركة.</div>'
    + '<button id="subCodeGo" style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-weight:900;font-size:.85rem;cursor:pointer;font-family:inherit">تفعيل الاشتراك</button>'
    + '<button id="subCodeCancel" style="width:100%;margin-top:8px;padding:9px;border:none;border-radius:10px;background:transparent;color:var(--text-muted,#64748b);font-weight:700;font-size:.8rem;cursor:pointer;font-family:inherit">إلغاء</button>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.onclick = function(e){ if (e.target === overlay && overlay.parentNode) { document.body.removeChild(overlay); } };
  document.getElementById('subCodeGo').onclick = function(){ verifySubscriptionCode(plan, overlay); };
  document.getElementById('subCodeCancel').onclick = function(){ if (overlay.parentNode) document.body.removeChild(overlay); };
  document.getElementById('subCodeInput').addEventListener('keydown', function(e){ if (e.key === 'Enter') verifySubscriptionCode(plan, overlay); });
  setTimeout(function(){ var inp = document.getElementById('subCodeInput'); if (inp) inp.focus(); }, 60);
}
function verifySubscriptionCode(plan, overlay) {
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var inp = document.getElementById('subCodeInput');
  var err = document.getElementById('subCodeError');
  var code = (inp.value || '').trim();
  if (!code) { if (err) { err.style.display = 'block'; err.textContent = 'يرجى إدخال كود التفعيل.'; } return; }
  var codes = [];
  try { codes = JSON.parse(localStorage.getItem('fast7_subscription_codes') || '[]'); } catch(e){}
  var myId = getMyStoreKey();
  var mySub = (localStorage.getItem('mycart_store_subdomain') || '').toLowerCase();
  var foundIdx = -1;
  for (var i = 0; i < codes.length; i++) {
    var c = codes[i];
    if (!c || c.used) continue;
    if (String(c.code).trim().toUpperCase() !== code.toUpperCase()) continue;
    if (c.plan !== plan) continue;
    var st = String(c.storeId || '');
    if (st === myId || st === 'default' || (mySub && st === mySub)) { foundIdx = i; break; }
  }
  if (foundIdx === -1) { if (err) { err.style.display = 'block'; err.textContent = 'الكود غير صحيح أو غير صالح لهذه الخطة.'; } return; }
  codes[foundIdx].used = true;
  codes[foundIdx].usedAt = new Date().toLocaleString('ar-SA');
  try { localStorage.setItem('fast7_subscription_codes', JSON.stringify(codes)); } catch(e){}
  if (overlay && overlay.parentNode) document.body.removeChild(overlay);
  var oldPlan = localStorage.getItem('mycart_subscription_plan') || 'free';
  localStorage.setItem('mycart_subscription_plan', plan);
  if (plan !== 'free') { localStorage.removeItem('mycart_free_orders_count'); localStorage.removeItem('mycart_fee_threshold_date'); localStorage.removeItem('mycart_store_suspended'); }
  addSubscriptionLog('plan_change', 'التبديل من '+(plans[oldPlan]||oldPlan)+' ← '+plans[plan]+' (عبر كود التفعيل)');
  showAlertModal('✅ تم تفعيل '+plans[plan]+' بنجاح!');
  adminRenderSubscriptionTab();
}
function openSubscriptionSheet() {
  var sheet = document.getElementById('subscriptionSheet');
  if (!sheet) return;
  sheet.classList.add('open');
  var cnt = document.getElementById('subscriptionSheetContent');
  if (!cnt) return;
  var info = getFeeInfo();
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var planLabel = plans[info.plan] || info.plan;
  var isFree = info.plan === 'free';
  var statusColor = isFree && info.accrued >= info.limit ? '#ef4444' : '#10b981';
  var sett = getAgencySettings();
  var freeFee = sett.freeFee || '2', monthlyFee = sett.monthlyFee || '100', annualFee = sett.annualFee || '1000';
  var pct = isFree && info.accrued > 0 ? Math.min(100, Math.round((info.accrued/info.limit)*100)) : 0;
  var suspDate = localStorage.getItem('mycart_fee_threshold_date');
  var daysLeft = '';
  if (suspDate && isFree) { var diff = Math.ceil((new Date(suspDate) - new Date()) / 86400000); daysLeft = diff > 0 ? 'مهلة '+diff+' يوم' : '⚠️ منتهي!'; }
  cnt.innerHTML = '<div style="padding:4px 0">'
    + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.03)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">'
    + '<div><h3 style="font-size:1.1rem;font-weight:1000;margin:0;color:#0f172a">'+planLabel+'</h3><p style="font-size:.72rem;color:#64748b;margin:0">'+(isFree?'الخطة المجانية • رسم '+freeFee+' ₪ لكل طلب':'إعفاء من عمولات الطلبات')+'</p></div>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<span style="font-size:.7rem;background:#f1f5f9;padding:3px 10px;border-radius:999px;color:#475569;font-weight:700">الطلبات: '+info.count+'</span>'
    + (daysLeft ? '<span style="font-size:.7rem;background:#f1f5f9;padding:3px 10px;border-radius:999px;color:'+statusColor+';font-weight:700">'+daysLeft+'</span>' : '')
    + '</div></div>'
    + (isFree && info.accrued > 0 ? '<div style="background:#f8fafc;border-radius:10px;padding:10px 12px"><div style="display:flex;justify-content:space-between;font-size:.78rem;font-weight:700"><span>الرسوم المتراكمة</span><span style="color:'+statusColor+'">'+info.accrued+' / '+info.limit+' ₪</span></div><div style="height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:'+pct+'%;height:100%;background:'+statusColor+';border-radius:999px"></div></div>'+(info.accrued>=info.limit?'<button onclick="paySubscriptionFees();setTimeout(function(){openSubscriptionSheet();location.reload();},500)" style="width:100%;margin-top:8px;padding:8px;border:none;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-weight:800;font-size:.75rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="5" width="22" height="15" rx="2"/></svg> تسديد '+info.accrued+' ₪</button>':'')+'</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='free'?'#10b981':'#e2e8f0')+';border-radius:12px;padding:12px;text-align:center">'
    + '<div style="font-size:.85rem;font-weight:900">مجانية</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">0 ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ شهرياً</div>'
    + (info.plan!=='free'?'<button onclick="adminSwitchPlan(\'free\')" style="width:100%;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;background:transparent;color:#1e293b;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit">تبديل</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div>'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='monthly'?'#10b981':'#3b82f6')+';border-radius:12px;padding:12px;text-align:center;position:relative">'
    + '<span style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;font-size:.5rem;font-weight:900;padding:2px 8px;border-radius:999px">شائع</span>'
    + '<div style="font-size:.85rem;font-weight:900;margin-top:4px">شهرية</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">'+monthlyFee+' ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ شهرياً</div>'
    + (info.plan!=='monthly'?'<button onclick="adminSwitchPlan(\'monthly\')" style="width:100%;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit;box-shadow:0 2px 6px rgba(59,130,246,.25)">اشتراك</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div>'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='annual'?'#10b981':'#e2e8f0')+';border-radius:12px;padding:12px;text-align:center">'
    + '<div style="font-size:.85rem;font-weight:900">سنوية VIP</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">'+annualFee+' ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ سنوياً</div>'
    + (info.plan!=='annual'?'<button onclick="adminSwitchPlan(\'annual\')" style="width:100%;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit">اشتراك</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div></div></div>'
    + '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px">'
    + '<h4 style="font-weight:900;margin:0 0 8px;font-size:.8rem;display:flex;align-items:center;gap:6px;color:#0f172a"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> سجل الاشتراك</h4>'
    + renderSubscriptionLog()+'</div></div>';
}
function closeSubscriptionSheet() {
  var sheet = document.getElementById('subscriptionSheet');
  if (sheet) sheet.classList.remove('open');
}

// ===== FBT Product Picker =====
function filterFbtProducts() {
  const q = document.getElementById('fbtSearch').value.trim().toLowerCase();
  document.querySelectorAll('#fbtPickerList .fbtItem').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
}
function toggleFbtCard(el, saved) {
  if (el.checked) {
    const checked = document.querySelectorAll('#fbtPickerList .fbtCb:checked:not(:disabled)').length;
    if (checked > (4 - saved)) {
      el.checked = false;
      const label = el.closest('.fbtItem');
      label.style.borderColor = '#ef4444';
      label.style.background = '#fef2f2';
      label.style.animation = 'shake .4s ease';
      setTimeout(() => {
        label.style.borderColor = '#e2e8f0';
        label.style.background = '#fff';
        label.style.animation = '';
      }, 500);
      if (typeof showToast === 'function') showToast('لا يمكنك التحديد، الحد الأقصى 4 منتجات', 'error');
      return;
    }
  }
  const label = el.closest('.fbtItem');
  const checked = document.querySelectorAll('#fbtPickerList .fbtCb:checked:not(:disabled)').length;
  const total = saved + checked;
  const counter = document.getElementById('fbtLiveCount');
  if (counter) counter.textContent = total + ' / 4';
  if (el.checked) {
    label.style.borderColor = 'var(--accent)';
    label.style.background = 'linear-gradient(135deg,var(--accent),var(--accent-hover))';
    label.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)';
    label.querySelector('img').style.borderColor = 'rgba(255,255,255,.25)';
    const nameDiv = label.querySelector('div:nth-child(3) > div:first-child');
    if (nameDiv) nameDiv.style.color = '#fff';
    const priceDiv = label.querySelector('div:nth-child(3) > div:last-child');
    if (priceDiv) priceDiv.style.color = 'rgba(255,255,255,.75)';
  } else {
    label.style.borderColor = '#e2e8f0';
    label.style.background = '#fff';
    label.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)';
    label.querySelector('img').style.borderColor = '#f1f5f9';
    const nameDiv = label.querySelector('div:nth-child(3) > div:first-child');
    if (nameDiv) nameDiv.style.color = '#0f172a';
    const priceDiv = label.querySelector('div:nth-child(3) > div:last-child');
    if (priceDiv) priceDiv.style.color = '#94a3b8';
  }
}
function openFbtProductPicker() {
  const list = (typeof products !== 'undefined' ? products : []);
  const selected = window._fbtProductIds || [];
  const countSaved = selected.length;
  let html = '<div style="padding:4px 0">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border-radius:12px;margin-bottom:14px;border:1px solid #e2e8f0">';
  html += '<span style="font-size:.75rem;font-weight:600;color:#64748b"><i class="fa-solid fa-cube" style="margin-left:4px"></i>الحد الأقصى</span>';
  html += '<span id="fbtLiveCount" style="font-size:.85rem;font-weight:800;color:#0f172a;background:#e2e8f0;padding:3px 16px;border-radius:20px">' + countSaved + ' / 4</span>';
  html += '</div>';
  html += '<div style="margin-bottom:12px;position:relative">';
  html += '<i class="fa-solid fa-magnifying-glass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.75rem"></i>';
  html += '<input type="text" id="fbtSearch" placeholder="ابحث عن منتج..." oninput="filterFbtProducts()" style="width:100%;padding:10px 14px 10px 32px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.8rem;outline:none;box-sizing:border-box;background:#fff" autocomplete="off">';
  html += '</div>';
  html += '<div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:8px" id="fbtPickerList">';
  list.forEach(p => {
    const added = selected.includes(p.id);
    html += '<label class="fbtItem" data-id="' + p.id + '" data-name="' + p.name.replace(/"/g,'&quot;') + '" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1.5px solid ' + (added ? 'var(--accent)' : '#e2e8f0') + ';border-radius:12px;cursor:pointer;background:' + (added ? 'linear-gradient(135deg,var(--accent),var(--accent-hover))' : '#fff') + ';transition:all .2s;box-shadow:' + (added ? '0 4px 12px rgba(0,0,0,.1)' : '0 1px 2px rgba(0,0,0,.04)') + '">' +
      '<div style="width:22px;display:flex;align-items:center;justify-content:center">' +
      '<input type="checkbox" class="fbtCb" value="' + p.id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer"' + (added ? ' checked disabled' : ' onchange="toggleFbtCard(this,' + countSaved + ')"') + '>' +
      '</div>' +
      '<img src="' + (Array.isArray(p.images) ? p.images[0] : p.image || 'https://placehold.co/46x46/e2e8f0/64748b?text=N') + '" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:2px solid ' + (added ? 'rgba(255,255,255,.25)' : '#f1f5f9') + ';flex-shrink:0">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:.82rem;font-weight:700;color:' + (added ? '#fff' : '#0f172a') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</div>' +
      '<div style="font-size:.7rem;color:' + (added ? 'rgba(255,255,255,.75)' : '#94a3b8') + ';margin-top:2px">' + CURRENCY + p.price + (added ? ' <span style="font-weight:600">✓ مضاف</span>' : '') + '</div>' +
      '</div>' +
    '</label>';
  });
  if (!list.length) html += '<div style="font-size:.8rem;color:#94a3b8;padding:30px 10px;text-align:center">لا توجد منتجات.</div>';
  html += '<button onclick="addSelectedFbt()" style="width:100%;padding:12px;margin-top:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.15);transition:opacity .15s" id="fbtAddBtn">إضافة المنتجات المختارة</button>';
  html += '<button onclick="closeModal()" style="width:100%;padding:10px;margin-top:6px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-weight:600;cursor:pointer;font-family:inherit;font-size:.8rem;transition:all .15s">إلغاء</button>';
  html += '</div>';
  document.getElementById('modalTitle').textContent = 'اختيار منتجات للحزمة';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('backdropModal').classList.add('show');
}
function addSelectedFbt() {
  const selected = [...document.querySelectorAll('.fbtCb:checked')].map(cb => parseInt(cb.value));
  if (!window._fbtProductIds) window._fbtProductIds = [];
  const remaining = 4 - window._fbtProductIds.length;
  const toAdd = selected.slice(0, remaining).filter(id => !window._fbtProductIds.includes(id));
  if (!toAdd.length) { closeModal(); return; }
  window._fbtProductIds.push(...toAdd);
  refreshFbtProductTags();
  closeModal();
}
function removeFbtProduct(id) {
  if (!window._fbtProductIds) return;
  window._fbtProductIds = window._fbtProductIds.filter(x => x !== id);
  refreshFbtProductTags();
}
function refreshFbtProductTags() {
  const container = document.getElementById('admMktFbtProducts');
  if (!container) return;
  const list = typeof products !== 'undefined' ? products : [];
  container.innerHTML = (window._fbtProductIds || []).map(id => {
    const pr = list.find(p => p.id === id);
    return pr ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--accent);border-radius:8px;font-size:.75rem;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.1)"><img src="' + (Array.isArray(pr.images) ? pr.images[0] : pr.image || 'https://placehold.co/24x24/e2e8f0/64748b?text=N') + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover">' + pr.name + ' <i class="fa-solid fa-xmark" style="cursor:pointer;color:rgba(255,255,255,.7);font-size:.8rem" onclick="removeFbtProduct(' + id + ')"></i></span>' : '';
  }).join('');
}

// ==================== COUPONS MANAGEMENT ====================
function adminUpdateCouponBadge() {
  const badge = document.getElementById('adminCouponBadge');
  if (!badge) return;
  const coupons = loadCoupons();
  const active = coupons.filter(c => c.isActive && getCouponStatus(c) === CouponStatus.ACTIVE).length;
  if (active > 0) {
    badge.textContent = active;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function adminRenderCoupons() {
  const container = document.getElementById('admin-coupons');
  if (!container) return;
  const coupons = loadCoupons();
  const now = Date.now();
  const active = coupons.filter(c => c.isActive && getCouponStatus(c) === CouponStatus.ACTIVE).length;
  const expired = coupons.filter(c => getCouponStatus(c) === CouponStatus.EXPIRED).length;
  const exhausted = coupons.filter(c => getCouponStatus(c) === CouponStatus.EXHAUSTED).length;
  const totalUses = coupons.reduce((s, c) => s + (c.uses || 0), 0);

  let html = '<div style="padding:16px 0">';
  // Stats
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">';
  html += '<div class="admin-stat"><i class="fa-solid fa-ticket" style="color:#f59e0b"></i><div><span>' + coupons.length + '</span><p>إجمالي الكوبونات</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i><div><span>' + active + '</span><p>نشط</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-clock" style="color:#ef4444"></i><div><span>' + expired + '</span><p>منتهية</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-coins" style="color:#3b82f6"></i><div><span>' + totalUses + '</span><p>مجموع الاستخدامات</div></div>';
  html += '</div>';

  // Toolbar
  html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:16px">';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">';
  html += '<div style="flex:1;min-width:180px"><input type="text" id="adminCouponSearch" placeholder="بحث بالكود أو الوصف..." oninput="quickAdminCouponsPage=1;adminRenderCoupons()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem"></div>';
  html += '<div style="min-width:140px"><select id="adminCouponStatusFilter" onchange="quickAdminCouponsPage=1;adminRenderCoupons()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;background:var(--card);color:var(--text)"><option value="">جميع الحالات</option><option value="active">نشط</option><option value="expired">منتهي</option><option value="exhausted">مستنفذ</option><option value="inactive">متوقف</option></select></div>';
  html += '<button class="btn-secondary" onclick="adminExportCoupons()" style="padding:8px 14px;font-size:.85rem"><i class="fa-solid fa-file-export"></i> تصدير</button>';
  html += '<button class="btn-primary" onclick="openAdminCouponForm()" style="padding:8px 14px;font-size:.85rem"><i class="fa-solid fa-plus"></i> كوبون جديد</button>';
  html += '</div></div>';

  // List
  html += '<div id="adminCouponsList" style="display:flex;flex-direction:column;gap:10px">';
  if (!coupons.length) {
    html += '<div class="admin-empty"><i class="fa-solid fa-ticket"></i><p>لا توجد أكواد خصم. أنشئ أول كوبون الآن!</p></div>';
  } else {
    const search = (document.getElementById('adminCouponSearch')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('adminCouponStatusFilter')?.value || '';
    let filtered = coupons.filter(c => {
      if (search && !(c.code.toLowerCase().includes(search) || (c.description||'').toLowerCase().includes(search))) return false;
      if (statusFilter && getCouponStatus(c) !== statusFilter) return false;
      return true;
    });
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const cpnTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (quickAdminCouponsPage > cpnTotalPages) quickAdminCouponsPage = cpnTotalPages || 1;
    const cpnStart = (quickAdminCouponsPage - 1) * ITEMS_PER_PAGE;
    const pageCoupons = filtered.slice(cpnStart, cpnStart + ITEMS_PER_PAGE);
    pageCoupons.forEach((c, idx) => {
      const status = getCouponStatus(c);
      const statusLabels = { active:'نشط', expired:'منتهي', exhausted:'مستنفذ', not_started:'لم يبدأ', inactive:'متوقف' };
      const statusColors = { active:'#16a34a', expired:'#ef4444', exhausted:'#f59e0b', not_started:'#3b82f6', inactive:'#64748b' };
      const statusBg = { active:'rgba(22,163,74,.1)', expired:'rgba(239,68,68,.1)', exhausted:'rgba(245,158,11,.1)', not_started:'rgba(59,130,246,.1)', inactive:'rgba(100,116,128,.1)' };
      let typeLabel = '';
      if (c.type === CouponType.PERCENT) typeLabel = c.value + '% خصم';
      else if (c.type === CouponType.FIXED) typeLabel = CURRENCY + c.value + ' خصم';
      else if (c.type === CouponType.FREESHIP) typeLabel = 'شحن مجاني';
      html += '<div style="background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:14px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
      html += '<code style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:3px 10px;border-radius:6px;font-size:.8rem;font-weight:800;letter-spacing:.5px">' + c.code + '</code>';
      html += '<span style="font-size:.75rem;font-weight:600;color:' + statusColors[status] + ';background:' + statusBg[status] + ';padding:2px 8px;border-radius:999px">' + statusLabels[status] + '</span>';
      html += '<span style="font-size:.8rem;color:var(--text-muted)">' + typeLabel + '</span>';
      html += '</div>';
      if (c.description) html += '<div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">' + c.description + '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:4px;flex-shrink:0">';
      html += '<button onclick="toggleAdminCouponActive(' + idx + ')" title="' + (c.isActive ? 'إيقاف التفعيل' : 'تفعيل') + '" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:' + (c.isActive ? '#16a34a' : '#ef4444') + '"><i class="fa-solid fa-' + (c.isActive ? 'pause' : 'play') + '"></i></button>';
      html += '<button onclick="openAdminCouponForm(' + idx + ')" title="تعديل" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:var(--text)"><i class="fa-solid fa-pen"></i></button>';
      html += '<button onclick="deleteAdminCoupon(' + idx + ')" title="حذف" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:#ef4444"><i class="fa-solid fa-trash"></i></button>';
      html += '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.72rem;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">';
      html += '<span><i class="fa-solid fa-users" style="margin-inline-end:4px"></i>استخدامات: ' + (c.uses || 0) + (c.limit > 0 ? ' / ' + c.limit : '') + '</span>';
      if (c.startDate) html += '<span><i class="fa-solid fa-calendar-plus" style="margin-inline-end:4px"></i>منذ: ' + new Date(c.startDate).toLocaleDateString('ar-SA') + '</span>';
      if (c.endDate) html += '<span><i class="fa-solid fa-calendar-minus" style="margin-inline-end:4px"></i>حتى: ' + new Date(c.endDate).toLocaleDateString('ar-SA') + '</span>';
      if (c.minOrder > 0) html += '<span><i class="fa-solid fa-wallet" style="margin-inline-end:4px"></i> حد أدنى: ' + CURRENCY + c.minOrder + '</span>';
      html += '</div>';
      html += '</div>';
    });
    html += buildPaginationHtml(quickAdminCouponsPage, cpnTotalPages, filtered.length, 'setQuickAdminCouponsPage');
  }
  html += '</div></div>';
  container.innerHTML = html;
}

function setQuickAdminCouponsPage(p) {
  quickAdminCouponsPage = p;
  adminRenderCoupons();
  document.getElementById('adminCoupons')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAdminCouponForm(idx) {
  const coupons = loadCoupons();
  const isEdit = idx !== undefined && idx >= 0;
  const c = isEdit ? coupons[idx] : {};
  const modal = document.getElementById('adminCouponFormModal');
  if (!modal) return;
  document.getElementById('adminCouponFormTitle').textContent = isEdit ? 'تعديل كوبون' : 'كوبون خصم جديد';
  document.getElementById('adminCpnId').value = isEdit ? c.id : '';
  document.getElementById('adminCpnCode').value = c.code || '';
  document.getElementById('adminCpnType').value = c.type || CouponType.PERCENT;
  document.getElementById('adminCpnValue').value = c.value || '';
  document.getElementById('adminCpnDescription').value = c.description || '';
  document.getElementById('adminCpnStartDate').value = c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '';
  document.getElementById('adminCpnEndDate').value = c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '';
  document.getElementById('adminCpnLimit').value = c.limit > 0 ? c.limit : '';
  document.getElementById('adminCpnMinOrder').value = c.minOrder > 0 ? c.minOrder : '';
  document.getElementById('adminCpnIsActive').checked = c.isActive !== false;
  toggleAdminCpnValueField();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeAdminCouponForm() {
  const modal = document.getElementById('adminCouponFormModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function toggleAdminCpnValueField() {
  const type = document.getElementById('adminCpnType')?.value;
  const group = document.getElementById('adminCpnValueGroup');
  const label = document.getElementById('adminCpnValueLabel');
  if (!group || !label) return;
  if (type === CouponType.FREESHIP) {
    group.style.display = 'none';
  } else {
    group.style.display = 'block';
    label.textContent = type === CouponType.PERCENT ? 'قيمة الخصم (%)' : 'قيمة الخصم (مبلغ ثابت)';
  }
}

function submitAdminCouponForm(e) {
  e.preventDefault();
  const id = document.getElementById('adminCpnId').value;
  const coupons = loadCoupons();
  const idx = coupons.findIndex(c => c.id === id);
  const coupon = {
    id: id || undefined,
    code: document.getElementById('adminCpnCode').value.trim().toUpperCase(),
    type: document.getElementById('adminCpnType').value,
    value: parseFloat(document.getElementById('adminCpnValue').value) || 0,
    description: document.getElementById('adminCpnDescription').value.trim(),
    startDate: document.getElementById('adminCpnStartDate').value ? new Date(document.getElementById('adminCpnStartDate').value).getTime() : 0,
    endDate: document.getElementById('adminCpnEndDate').value ? new Date(document.getElementById('adminCpnEndDate').value).getTime() : 0,
    limit: parseInt(document.getElementById('adminCpnLimit').value) || 0,
    minOrder: parseFloat(document.getElementById('adminCpnMinOrder').value) || 0,
    isActive: document.getElementById('adminCpnIsActive').checked
  };
  if (!coupon.code) { showToast('⚠️ يرجى إدخال كود الكوبون', 'error'); return; }
  if (coupon.type !== CouponType.FREESHIP && (!coupon.value || coupon.value <= 0)) { showToast('⚠️ يرجى إدخال قيمة الخصم', 'error'); return; }
  if (idx >= 0) {
    coupon.uses = coupons[idx].uses || 0;
    coupon.userUsed = coupons[idx].userUsed || {};
    coupon.createdAt = coupons[idx].createdAt || Date.now();
    coupons[idx] = coupon;
  } else {
    coupon.uses = 0;
    coupon.userUsed = {};
    coupon.createdAt = Date.now();
    coupons.push(coupon);
  }
  saveCoupons(coupons);
  closeAdminCouponForm();
  adminRenderCoupons();
  adminUpdateCouponBadge();
  showToast('✓ تم حفظ الكوبون بنجاح', 'success');
}

function deleteAdminCoupon(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا الكوبون؟<br><small style="color:#ef4444">لا يمكن التراجع عن هذا الإجراء</small>', function() {
    const coupons = loadCoupons();
    coupons.splice(idx, 1);
    saveCoupons(coupons);
    adminRenderCoupons();
    adminUpdateCouponBadge();
    showToast('✓ تم حذف الكوبون', 'success');
  });
}

function toggleAdminCouponActive(idx) {
  const coupons = loadCoupons();
  if (!coupons[idx]) return;
  coupons[idx].isActive = !coupons[idx].isActive;
  saveCoupons(coupons);
  adminRenderCoupons();
  adminUpdateCouponBadge();
}

function adminExportCoupons() {
  const coupons = loadCoupons();
  if (!coupons.length) { showToast('⚠️ لا توجد كوبونات لتصديرها', 'error'); return; }
  const dataStr = JSON.stringify(coupons, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coupons-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ============ SPIN WHEEL ADMIN TAB ============

function adminRenderSpinWheel() {
  const container = document.getElementById('admin-spinwheel');
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const sw = data.spinWin || {};

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <h3 style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-circle-notch" style="color:#f59e0b"></i> إدارة عجلة الحظ التفاعلية</h3>
      <button class="admin-btn admin-btn-primary" onclick="adminSaveSpinWheel()"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
    </div>
    <div class="admin-settings-grid">
      <!-- Status -->
      <div class="admin-card">
        <h4><i class="fa-solid fa-power-off" style="color:#22c55e"></i> حالة العجلة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:.85rem;margin-top:8px">
          <input type="checkbox" id="admMktSpinWinShow" style="width:16px;height:16px" ${sw.show ? 'checked' : ''}> 🎡 تفعيل عجلة الحظ
        </label>
        <p style="font-size:.72rem;color:var(--text-muted);margin:6px 0 0;line-height:1.5">عند التفعيل، تظهر العجلة تلقائياً للزوار بعد 6 ثوانٍ من فتح المتجر.</p>
        <div style="margin-top:10px;padding:10px 14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:10px">
          <div style="font-size:.72rem;color:var(--text-muted)">عدد القطاعات: <strong id="swStatCount2" style="color:#f59e0b">${(sw.segments||[]).length}</strong></div>
          <div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">الحالة: <strong id="swStatStatus2" style="color:${sw.show?'#22c55e':'#94a3b8'}">${sw.show?'مفعلة':'غير مفعلة'}</strong></div>
        </div>
      </div>

      <!-- Segments -->
      <div class="admin-card" style="grid-column:1/-1">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <h4><i class="fa-solid fa-list"></i> قطاعات العجلة</h4>
          <span style="font-size:.72rem;color:var(--text-muted)">${(sw.segments||[]).length} قطاع</span>
        </div>
        <div id="admSpinSegmentsList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:12px"></div>

        <!-- Add Form -->
        <div style="background:var(--bg);border:1px dashed var(--border);border-radius:12px;padding:14px;margin-top:8px">
          <div style="font-size:.8rem;font-weight:800;margin-bottom:10px"><i class="fa-solid fa-plus-circle" style="color:#22c55e"></i> إضافة قطاع جديد</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div style="flex:2;min-width:120px">
              <label style="font-size:.65rem;color:var(--text-muted)">اسم الجائزة</label>
              <input type="text" id="admNewSegLabel" placeholder="خصم 20%" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
            <div style="flex:1;min-width:90px">
              <label style="font-size:.65rem;color:var(--text-muted)">النوع</label>
              <select id="admNewSegType" onchange="swToggleSegForm()" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)">
                <option value="discount">خصم %</option>
                <option value="freeship">شحن مجاني</option>
                <option value="none">حظ سعيد</option>
              </select>
            </div>
          </div>
          <div id="admNewSegDiscFields" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <div style="flex:1;min-width:70px">
              <label style="font-size:.65rem;color:var(--text-muted)">الخصم %</label>
              <input type="number" id="admNewSegPercent" min="1" max="99" value="10" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
            <div style="flex:2;min-width:130px">
              <label style="font-size:.65rem;color:var(--text-muted)">كود الخصم</label>
              <div style="display:flex;gap:4px">
                <input type="text" id="admNewSegCode" placeholder="SAVE10" style="flex:1;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;text-transform:uppercase">
                <button type="button" onclick="adminGenWheelCode()" title="توليد كود عشوائي" style="padding:7px 10px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.75rem;white-space:nowrap"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
              </div>
            </div>
            <div style="flex:1;min-width:70px">
              <label style="font-size:.65rem;color:var(--text-muted)">اللون</label>
              <input type="color" id="admNewSegColor" value="#ef4444" style="width:100%;height:34px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;padding:1px">
            </div>
          </div>
          <div id="admNewSegLimitRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <div style="flex:1;min-width:120px">
              <label style="font-size:.65rem;color:var(--text-muted)">عدد مرات الاستخدام (0 = غير محدود)</label>
              <input type="number" id="admNewSegLimit" min="0" value="0" placeholder="0" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
          </div>
          <button onclick="admAddSpinSegment();updateSwStats()" class="admin-btn admin-btn-secondary admin-btn-sm" style="margin-top:10px"><i class="fa-solid fa-plus"></i> إضافة</button>
        </div>
      </div>

      <!-- Preview -->
      <div class="admin-card" style="display:flex;flex-direction:column;align-items:center">
        <h4><i class="fa-solid fa-eye"></i> معاينة</h4>
        <div style="position:relative;width:120px;height:120px;margin:10px auto 0">
          <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #f59e0b;z-index:2"></div>
          <div id="swPreviewWheel2" style="width:100%;height:100%;border-radius:50%;border:3px solid rgba(255,255,255,.8);background:conic-gradient(#e2e8f0 0deg 360deg)"></div>
        </div>
      </div>
    </div>
  `;

  admRenderSpinSegmentsList(sw.segments || []);
  updateSwPreview((sw.segments || []));
}

function updateSwPreview(segs) {
  const wheel = document.getElementById('swPreviewWheel2');
  if (!wheel) return;
  if (!segs || !segs.length) { wheel.style.background = 'conic-gradient(#e2e8f0 0deg 360deg)'; return; }
  const count = segs.length;
  const segDeg = 360 / count;
  const parts = segs.map((s, i) => {
    const from = Math.round(i * segDeg * 10) / 10;
    const to = Math.round((i + 1) * segDeg * 10) / 10;
    return `${s.color || '#ef4444'} ${from}deg ${to}deg`;
  });
  wheel.style.background = `conic-gradient(${parts.join(', ')})`;
}

function updateSwStats() {
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const segs = data.spinWin?.segments || [];
  const c1 = document.getElementById('swStatCount2');
  const c2 = document.getElementById('swStatStatus2');
  if (c1) c1.textContent = segs.length;
  if (c2) {
    const enabled = !!data.spinWin?.show;
    c2.textContent = enabled ? 'مفعلة' : 'غير مفعلة';
    c2.style.color = enabled ? '#22c55e' : '#94a3b8';
  }
  updateSwPreview(segs);
}

function swToggleSegForm() {
  const t = document.getElementById('admNewSegType')?.value;
  const discFields = document.getElementById('admNewSegDiscFields');
  const limitRow = document.getElementById('admNewSegLimitRow');
  if (discFields) discFields.style.display = t === 'discount' ? 'flex' : 'none';
  if (limitRow) limitRow.style.display = t === 'none' ? 'none' : 'flex';
}

function adminGenWheelCode() {
  const prefix = 'LUCKY';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const el = document.getElementById('admNewSegCode');
  if (el) el.value = code;
}

function adminPpToggleType() {
  const t = document.getElementById('admMktPpType')?.value;
  const codeGrp = document.getElementById('admPpCodeGroup');
  const pctGrp = document.getElementById('admPpPercentGroup');
  const btnTextGrp = document.getElementById('admPpBtnTextGroup');
  const btnLinkGrp = document.getElementById('admPpBtnLinkGroup');
  const expGrp = document.getElementById('admPpExpiryGroup');
  const customExtras = document.getElementById('admPpCustomExtras');
  const showCode = (t === 'discount' || t === 'halfprice');
  const showPct = (t === 'discount' || t === 'sale' || t === 'halfprice');
  const showExp = (t === 'discount' || t === 'sale' || t === 'halfprice');
  const showBtn = (t !== 'newsletter');
  if (codeGrp) codeGrp.style.display = showCode ? 'block' : 'none';
  if (pctGrp) pctGrp.style.display = showPct ? 'block' : 'none';
  if (btnTextGrp) btnTextGrp.style.display = showBtn ? 'block' : 'none';
  if (btnLinkGrp) btnLinkGrp.style.display = showBtn ? 'block' : 'none';
  if (expGrp) expGrp.style.display = showExp ? 'block' : 'none';
  if (customExtras) customExtras.style.display = (t === 'custom') ? 'block' : 'none';
}

function adminPpUploadImage() {
  document.getElementById('admPpFileInput')?.click();
}

function adminPpPreviewImage(url) {
  const prev = document.getElementById('admPpImagePreview');
  if (!prev) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
    prev.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">';
    prev.style.display = 'block';
  } else { prev.style.display = 'none'; }
}

async function adminPpHandleImageUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('الصورة كبيرة جداً (الحد 5MB)', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  document.getElementById('admMktPpImage').value = url;
  const preview = document.getElementById('admPpImagePreview');
  if (preview) { preview.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">'; preview.style.display = 'block'; }
  showToast('✅ تم رفع الصورة بنجاح', 'success');
  input.value = '';
}

function adminPpTestPreview() {
  const title = document.getElementById('admMktPpTitle')?.value || '';
  const text = document.getElementById('admMktPpText')?.value || '';
  const code = document.getElementById('admMktPpCode')?.value || '';
  const pct = document.getElementById('admMktPpPercent')?.value || '';
  const btnText = document.getElementById('admMktPpBtnText')?.value || '';
  const btnLink = document.getElementById('admMktPpBtnLink')?.value || '';
  const bg = document.getElementById('admMktPpBg')?.value || '#ffffff';
  const tc = document.getElementById('admMktPpTextColor')?.value || '#0f172a';
  const ac = document.getElementById('admMktPpAccent')?.value || '#ef4444';
  const bb = document.getElementById('admMktPpBtnBg')?.value || '#ef4444';
  const bc = document.getElementById('admMktPpBtnColor')?.value || '#ffffff';
  const type = document.getElementById('admMktPpType')?.value || 'discount';
  const pos = document.getElementById('admMktPpPos')?.value || 'center';
  const sz = document.getElementById('admMktPpSize')?.value || 'medium';
  const anim = document.getElementById('admMktPpAnim')?.value || 'bounce';
  const delay = parseInt(document.getElementById('admMktPpDelay')?.value) || 0;
  const image = document.getElementById('admMktPpImage')?.value || '';
  const customHtml = document.getElementById('admMktPpCustomHtml')?.value || '';
  const customIcon = document.getElementById('admMktPpCustomIcon')?.value || '';

  const dummy = { show: true, type, title, text, code, discountPercent: parseInt(pct) || 0, image, btnText, btnLink, bgColor: bg, textColor: tc, accentColor: ac, btnBg: bb, btnColor: bc, position: pos, size: sz, animation: anim, delay, showClose: true, closeOutside: true, expiresAt: 0, customHtml, customIcon };
  sessionStorage.removeItem('promoPopupShown');
  renderPromoPopup(dummy);
  document.getElementById('promoPopupModal').style.display = 'flex';
}

function adminSaveSpinWheel() {
  const enabled = document.getElementById('admMktSpinWinShow')?.checked || false;
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  data.spinWin = data.spinWin || { show: false, segments: [] };
  data.spinWin.show = enabled;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
  updateSwStats();
  adminMarkSaved();
  showToast(enabled ? 'تم تفعيل عجلة الحظ 🎡' : 'تم إيقاف عجلة الحظ', 'success');
}

function adminRenderSectionOrderItems(data) {
  const order = (data.sectionOrder || ['banner','offers','flashSale','featured','newArrival','halfPrice','mostSold']).filter(function(s) { return s !== 'couponDetector'; });
  const labels = {
    banner: { label: '🖼️ البانرات', desc: 'البانرات الإعلانية' },
    offers: { label: '🎁 العروض الخاصة', desc: 'المنتضمن ضمن العروض' },
    flashSale: { label: '⚡ تخفيضات سريعة', desc: 'منتجات بخصم 20%+' },
    featured: { label: '💎 منتجات مميزة', desc: 'المنتجات الموسومة بمميز' },
    newArrival: { label: '🔖 وصل حديثاً', desc: 'أحدث المنتجات المضافة' },
    halfPrice: { label: '💰 نصف السعر', desc: 'المنتجات المخفضة 50%+' },
    mostSold: { label: '🔥 الأكثر مبيعاً', desc: 'المنتجات الأكثر مبيعاً' }
  };
  return order.filter(function(sid) { return sid !== 'couponDetector'; }).map(function(sid, idx) {
    var sec = labels[sid];
    if (!sec) return '';
    var showKey = sid === 'flashSale' ? 'flashSales' : sid === 'offers' ? 'offersSection' : sid;
    var showVal = (data[showKey] || {}).show !== false;
    return '<div class="section-order-item" data-id="' + sid + '" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;cursor:grab;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.04)">' +
      '<span style="color:var(--text-muted);font-size:.85rem;cursor:move;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
      '<span style="font-size:.72rem;color:var(--text-muted);background:var(--card);padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
      '<span style="flex:1;font-size:.8rem;font-weight:700">' + sec.label + '</span>' +
      '<span style="font-size:.68rem;color:var(--text-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + sec.desc + '</span>' +
      '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;font-size:.7rem;font-weight:600">' +
      '<input type="checkbox" class="section-toggle" data-section="' + sid + '" data-showkey="' + showKey + '" ' + (showVal ? 'checked' : '') + ' style="width:14px;height:14px;accent-color:var(--accent)">' +
      '<span>' + (showVal ? 'مفعل' : 'معطل') + '</span>' +
      '</label>' +
      '</div>';
  }).join('');
}

function moveSection(direction) {
  var container = document.getElementById('sectionOrderList');
  if (!container) return;
  var items = Array.from(container.querySelectorAll('.section-order-item'));
  var selected = items.find(function(item) { return item.style.outline === '2px solid var(--accent)'; });
  if (!selected) selected = items[0];
  var idx = items.indexOf(selected);
  if (idx < 0) return;
  var newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= items.length) return;
  container.insertBefore(items[newIdx], selected);
  items.forEach(function(it) { it.style.outline = 'none'; });
  selected.style.outline = '2px solid var(--accent)';
  selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveSectionOrder() {
  var container = document.getElementById('sectionOrderList');
  if (!container) return;
  var items = container.querySelectorAll('.section-order-item');
  var order = Array.from(items).map(function(item) { return item.dataset.id; });
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  mkt.sectionOrder = order;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  var status = document.getElementById('sectionOrderStatus');
  if (status) { status.textContent = '✓ تم حفظ الترتيب بنجاح'; status.style.display = 'block'; status.style.color = '#22c55e'; setTimeout(function() { status.style.display = 'none'; }, 2000); }
  showToast('✓ تم حفظ ترتيب الأقسام', 'success');
}

function adminInitSectionToggles() {
  setTimeout(function() {
    var container = document.getElementById('sectionOrderList');
    if (!container) return;
    container.querySelectorAll('.section-toggle').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var sectionId = this.dataset.section;
        var showKey = this.dataset.showkey || sectionId;
        var isChecked = this.checked;
        var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
        if (!mkt[showKey]) mkt[showKey] = {};
        mkt[showKey].show = isChecked;
        try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
        var label = this.closest('.section-order-item').querySelector('span:last-child');
        if (label) { label.textContent = isChecked ? 'مفعل' : 'معطل'; label.style.color = isChecked ? '#22c55e' : '#94a3b8'; }
        if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
        if (typeof initFlashSales === 'function') initFlashSales();
      });
    });
  }, 100);
}

// ===== PAGE BUILDER PROFESSIONAL =====
(function(){ if (!document.getElementById('pbStyles')) { var s = document.createElement('style'); s.id = 'pbStyles'; s.textContent =
'.pb-section-item:hover{border-color:var(--accent)!important;box-shadow:0 4px 16px rgba(0,0,0,.08)!important}'+
'.pb-section-item.dragging{opacity:.4;background:#f1f5f9!important}'+
'.pb-section-item.drag-over{border-color:var(--accent)!important;border-style:dashed!important;background:rgba(239,68,68,.04)!important}'+
'#pbSectionList .pb-section-item:last-child{margin-bottom:0}'+
'.pb-type-option:hover{background:var(--bg)!important;border-color:var(--accent)!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.06)}'+
'.pb-field{margin-bottom:14px;display:flex;flex-direction:column;gap:4px}'+
'.pb-field-label{font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:2px}'+
'.pb-field-input{padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.83rem;background:#fff;color:var(--text);transition:border-color .2s;outline:none;width:100%;box-sizing:border-box}'+
'.pb-field-input:focus{border-color:var(--accent)}'+
'.pb-field-textarea{resize:vertical;min-height:80px;line-height:1.6}'+
'.pb-field-select{cursor:pointer}'+
'.pb-field-checkbox{width:18px;height:18px;accent-color:var(--accent);cursor:pointer}'+
'.pb-items-container .pb-item-row:last-child{margin-bottom:0}'+
'.pb-item-row:hover{border-color:var(--accent)!important}'+
'.pb-item-row .pb-field{margin-bottom:6px}'+
'.pb-item-row .pb-field:last-child{margin-bottom:0}'+
'.pb-item-row .pb-field-label{font-size:.72rem}'+
'.pb-item-row .pb-field-input{font-size:.78rem;padding:8px 10px}'+
'.pb-item-row img{max-height:50px!important;border-radius:6px}'+
'.pb-color-val{direction:ltr;display:inline-block}'+
'@media(max-width:640px){#admin-marketing .admin-card>div:first-child{flex-direction:column;align-items:stretch!important;gap:10px}}'; document.head.appendChild(s); } })();
// Registry of all custom section types
var PB_SECTION_TYPES = {
  hero: { icon: '🏆', label: 'هيرو / بانر رئيسي', desc: 'بانر كامل مع نص وزر', color: '#fef2f2' },
  banner: { icon: '🖼️', label: 'بانر صور', desc: 'صورة مع رابط', color: '#f0fdf4' },
  text: { icon: '📝', label: 'نص / محتوى', desc: 'نص منسق مع عنوان', color: '#f8fafc' },
  spacer: { icon: '➖', label: 'فاصل / مسافة', desc: 'مسافة رأسية أو خط فاصل', color: '#f1f5f9' },
  divider: { icon: '〰️', label: 'خط فاصل', desc: 'خط أفقي مع نص', color: '#f8fafc' },
  gallery: { icon: '🖼️', label: 'معرض صور', desc: 'شبكة صور متعددة', color: '#fdf2f8' },
  video: { icon: '🎬', label: 'فيديو', desc: 'يوتيوب / فيميو / مباشر', color: '#fefce8' },
  countdown: { icon: '⏳', label: 'عد تنازلي', desc: 'مؤقت لفترة ترويجية', color: '#fff7ed' },
  testimonials: { icon: '💬', label: 'آراء العملاء', desc: 'شهادات وتقييمات', color: '#f0fdf4' },
  features: { icon: '⭐', label: 'مميزات', desc: 'مربعات مميزات بأيقونات', color: '#faf5ff' },
  newsletter: { icon: '📧', label: 'اشتراك بريد', desc: 'نموذج اشتراك إيميل', color: '#ecfdf5' },
  products: { icon: '🏷️', label: 'منتجات مخصصة', desc: 'عرض منتجات محددة', color: '#fff7ed' },
  categories: { icon: '📂', label: 'تصنيفات', desc: 'شبكة تصنيفات', color: '#fef2f2' },
  faq: { icon: '❓', label: 'أسئلة شائعة', desc: 'قائمة أسئلة وأجوبة', color: '#f8fafc' },
  contact: { icon: '📞', label: 'اتصل بنا', desc: 'معلومات تواصل + خريطة', color: '#f0f9ff' },
  social: { icon: '🔗', label: 'روابط التواصل', desc: 'أيقونات وسائل التواصل', color: '#fdf4ff' },
  html: { icon: '</>', label: 'HTML مخصص', desc: 'كود HTML / iframe', color: '#fefce8' },
  logos: { icon: '👥', label: 'شعارات', desc: 'شريط شعارات متحرك', color: '#f0f9ff' },
  note: { icon: '📝', label: 'ملاحظة', desc: 'صندوق ملاحظة / معلومة', color: '#eff6ff' },
  alert: { icon: '⚠️', label: 'تنبيه', desc: 'تحذير / انتباه مهم', color: '#fef3c7' },
  breaking: { icon: '📢', label: 'إعلان بارز', desc: 'شريط تنبيه بإطار ووميض', color: '#e0f2fe' }
};

function adminRenderPageBuilder(data) {
  // Remove couponDetector from section order if present
  if (data.sectionOrder) data.sectionOrder = data.sectionOrder.filter(function(s) { return s !== 'couponDetector'; });
  var order = data.sectionOrder || ['banner','offers','flashSale','featured','newArrival','halfPrice','mostSold'];
  const customSections = data.customSections || [];
  window._pbCustomSections = JSON.parse(JSON.stringify(customSections));
  // Ensure all custom sections are in the order list
  window._pbCustomSections.forEach(function(cs) {
    if (order.indexOf(cs._id) === -1) order.push(cs._id);
  });
  
  const labels = {
    banner: { icon: '🖼️', label: 'البانرات', desc: 'البانرات الإعلانية' },
    offers: { icon: '🎁', label: 'العروض الخاصة', desc: 'المنتجات ضمن العروض' },
    flashSale: { icon: '⚡', label: 'تخفيضات سريعة', desc: 'منتجات بخصم 20%+' },
    featured: { icon: '💎', label: 'منتجات مميزة', desc: 'المنتجات الموسومة بمميز' },
    newArrival: { icon: '🔖', label: 'وصل حديثاً', desc: 'أحدث المنتجات المضافة' },
    halfPrice: { icon: '💰', label: 'نصف السعر', desc: 'المنتجات المخفضة 50%+' },
    mostSold: { icon: '🔥', label: 'الأكثر مبيعاً', desc: 'المنتجات الأكثر مبيعاً' }
  };

  // Drop orphan/unknown ids (e.g. leftover test ids like "_tst") that are
  // neither a known built-in section nor a real custom section id.
  order = order.filter(function(s) {
    if (typeof s !== 'string') return false;
    if (s.indexOf('_custom_') === 0) {
      return window._pbCustomSections.some(function(c) { return c._id === s; });
    }
    return !!labels[s];
  });

  function renderItemHtml(sid, idx, isCustom, extra, editIdx) {
    if (isCustom) {
      var c = extra || {};
      var eIdx = editIdx != null ? editIdx : idx;
      var info = PB_SECTION_TYPES[c.type] || { icon: '📄', label: 'قسم', desc: '' };
      return '<div class="pb-section-item" data-id="' + sid + '" draggable="true" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,' + (info.color||'#f8fafc') + ',#fff);border:1.5px dashed var(--accent);border-radius:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .2s">' +
        '<span style="color:var(--text-muted);font-size:1rem;cursor:grab;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
        '<span style="font-size:.72rem;color:var(--text-muted);background:#fff;padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
        '<span style="font-size:1.2rem;flex-shrink:0">' + info.icon + '</span>' +
        '<span style="flex:1;font-size:.85rem;font-weight:700">' + (c.title || info.label) + '</span>' +
        '<span style="font-size:.7rem;color:var(--text-muted);padding:2px 8px;background:#fff;border-radius:4px;font-weight:600">' + info.label + '</span>' +
        '<span style="font-size:.7rem;color:' + (c._visible !== false ? '#22c55e' : '#94a3b8') + ';font-weight:600;flex-shrink:0">' + (c._visible !== false ? 'نشط' : 'متوقف') + '</span>' +
        '<button onclick="adminEditCustomSection(' + eIdx + ')" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.85rem;padding:4px" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>' +
        '<button onclick="adminToggleCustomSection(' + eIdx + ')" style="background:none;border:none;color:' + (c._visible !== false ? '#f59e0b' : '#22c55e') + ';cursor:pointer;font-size:.85rem;padding:4px" title="' + (c._visible !== false ? 'إخفاء' : 'إظهار') + '"><i class="fa-solid ' + (c._visible !== false ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
        '<button onclick="adminDuplicateCustomSection(' + eIdx + ')" style="background:none;border:none;color:#8b5cf6;cursor:pointer;font-size:.85rem;padding:4px" title="نسخ"><i class="fa-solid fa-copy"></i></button>' +
        '<button onclick="adminDeleteCustomSection(' + eIdx + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:4px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
        '</div>';
    }
    var sec = labels[sid] || { icon: '📄', label: sid, desc: '' };
    var showKey = sid === 'flashSale' ? 'flashSales' : sid === 'offers' ? 'offersSection' : sid;
    var showVal = (data[showKey] || {}).show !== false;
    return '<div class="pb-section-item" data-id="' + sid + '" draggable="true" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .2s">' +
      '<span style="color:var(--text-muted);font-size:1rem;cursor:grab;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
      '<span style="font-size:.72rem;color:var(--text-muted);background:var(--bg);padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
      '<span style="font-size:1.2rem;flex-shrink:0">' + sec.icon + '</span>' +
      '<span style="flex:1;font-size:.85rem;font-weight:700">' + sec.label + '</span>' +
      '<span style="font-size:.7rem;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + sec.desc + '</span>' +
      '<button onclick="adminEditBuiltinSection(\'' + sid + '\')" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.85rem;padding:4px" title="تعديل العنوان"><i class="fa-solid fa-pen-to-square"></i></button>' +
      '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;font-size:.72rem;font-weight:600">' +
      '<input type="checkbox" class="pb-section-toggle" data-section="' + sid + '" data-showkey="' + showKey + '" ' + (showVal ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:var(--accent)">' +
      '<span>' + (showVal ? 'مفعل' : 'معطل') + '</span>' +
      '</label>' +
      '</div>';
  }

  var itemsHtml = '';
  order.forEach(function(sid, idx) {
    if (sid.startsWith('_custom_')) {
      var c = window._pbCustomSections.find(function(s) { return s._id === sid; });
      var cIdx = c ? window._pbCustomSections.indexOf(c) : -1;
      if (c) itemsHtml += renderItemHtml(sid, idx, true, c, cIdx);
    } else {
      itemsHtml += renderItemHtml(sid, idx, false, null);
    }
  });

  // Build add-section type selector dropdown
  var typeOpts = '';
  for (var t in PB_SECTION_TYPES) {
    var info = PB_SECTION_TYPES[t];
    typeOpts += '<div class="pb-type-option" onclick="adminAddCustomSection(\'' + t + '\')" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s;background:var(--card);font-size:.8rem;font-weight:600">' +
      '<span style="font-size:1.1rem">' + info.icon + '</span>' +
      '<div style="flex:1"><div>' + info.label + '</div><div style="font-size:.65rem;font-weight:400;color:var(--text-muted)">' + info.desc + '</div></div>' +
      '<span style="color:var(--text-muted);font-size:.7rem"><i class="fa-solid fa-plus-circle"></i></span></div>';
  }

  return '<div class="admin-settings-grid" style="grid-template-columns:1fr">' +
    '<div class="admin-card" style="grid-column:1/-1">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
    '<div><h4 style="font-size:.95rem;font-weight:800"><i class="fa-solid fa-pen-ruler"></i> منشئ الصفحة الرئيسية</h4>' +
    '<p style="font-size:.75rem;color:var(--text-muted);margin:2px 0 0">اسحب الأقسام لترتيبها. أضف أقسام مخصصة متعددة الأنواع.</p></div>' +
    '<button onclick="adminShowAddSectionPicker()" class="admin-btn admin-btn-primary" style="padding:8px 18px;font-size:.8rem"><i class="fa-solid fa-plus"></i> إضافة قسم جديد</button>' +
    '</div>' +
    '<div id="pbSectionList">' + itemsHtml + '</div>' +
    (itemsHtml ? '' : '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:.85rem"><i class="fa-solid fa-layer-group" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.3"></i> لا توجد أقسام مخصصة بعد.<br>اضغط "إضافة قسم جديد" للبدء.</div>') +
    '<div style="display:flex;gap:8px;margin-top:16px">' +
    '<button onclick="adminSavePageBuilder()" style="padding:10px 24px;border:none;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer;font-family:inherit;font-size:.85rem;font-weight:800"><i class="fa-solid fa-check"></i> حفظ التغييرات</button>' +
    '<button onclick="adminResetPageBuilder()" style="padding:10px 20px;border:1px solid #ef4444;border-radius:10px;background:transparent;color:#ef4444;cursor:pointer;font-family:inherit;font-size:.8rem;font-weight:700"><i class="fa-solid fa-rotate-left"></i> إعادة تعيين</button>' +
    '</div>' +
    '<p id="pbStatus" style="font-size:.8rem;color:var(--text-muted);display:none;margin-top:8px"></p>' +
    '</div></div>';
}

function adminShowAddSectionPicker() {
  var pickerId = 'pbAddSectionPicker';
  var existing = document.getElementById(pickerId);
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = pickerId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  var opts = '';
  for (var t in PB_SECTION_TYPES) {
    var info = PB_SECTION_TYPES[t];
    opts += '<div onclick="adminAddCustomSection(\'' + t + '\')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s;background:var(--card);font-size:.82rem;font-weight:600" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'\'">' +
      '<span style="font-size:1.2rem">' + info.icon + '</span>' +
      '<div style="flex:1"><div>' + info.label + '</div><div style="font-size:.68rem;font-weight:400;color:var(--text-muted);margin-top:2px">' + info.desc + '</div></div>' +
      '<span style="color:var(--accent);font-size:.8rem"><i class="fa-solid fa-plus-circle"></i></span></div>';
  }
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:20px;max-width:520px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
    '<h3 style="font-size:1rem;font-weight:800;margin:0"><i class="fa-solid fa-plus"></i> إضافة قسم جديد</h3>' +
    '<button onclick="document.getElementById(\'' + pickerId + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + opts + '</div>' +
    '<p style="font-size:.7rem;color:var(--text-muted);margin:12px 0 0">اختر نوع القسم، وسيتم فتحه لك مباشرة للتعديل.</p></div>';
  document.body.appendChild(modal);
}

function adminAddCustomSection(type) {
  if (!PB_SECTION_TYPES[type]) return;
  var defaults = {
    hero: { title:'', subtitle:'', content:'', btnText:'', btnLink:'', bgImage:'', bgColor:'#0d9488', textColor:'#ffffff', overlay:true, height:360, btnStyle:'fill' },
    banner: { image:'', link:'', alt:'', borderRadius:16 },
    text: { title:'', content:'', bg:'#ffffff', textAlign:'center', textSize:'md' },
    spacer: { height:20 },
    divider: { text:'', lineColor:'#e2e8f0', lineStyle:'solid', thickness:2 },
    gallery: { images:[], layout:'grid', columns:'4', aspectRatio:'3/2', imageHeight:180, gap:10, lightbox:true, autoPlay:false, interval:3 },
    video: { url:'', autoplay:false, muted:true, controls:true, loop:false, ratio:'56.25' },
    countdown: { title:'', timerType:'duration', endDate:'', duration:24, message:'', bgType:'color', bgColor:'#0f172a', bgImage:'', overlay:true, textColor:'#ffffff', accentColor:'#ef4444', layout:'row', animation:true, showDays:true, showHours:true, showMinutes:true, showSeconds:true },
    testimonials: { items:[], bg:'#ffffff', textColor:'var(--text)', autoplay:true },
    features: { items:[], columns:'3', bg:'#ffffff', iconColor:'var(--accent)', showBorder:true },
    newsletter: { title:'', subtitle:'', btnText:'اشتراك', bg:'#0f172a', accentColor:'#ef4444', icon:'📧', placeholder:'بريدك الإلكتروني' },
    products: { title:'', icon:'fa-bag-shopping', mode:'category', category:'', productIds:'', layout:'grid', bgColor:'transparent', textColor:'var(--text)', showTitle:true, showPrice:true, showAddToCart:true, showRating:true },
    categories: { title:'', mode:'auto', categoryNames:'', includeBrands:'', layout:'grid', cardsPerView:'4', mobileCards:2, imageHeight:150, gap:12, cardRadius:12, cardShadow:'sm', textColor:'var(--text)', bgColor:'transparent', bgImage:'', showNames:true, showCount:true },
    faq: { items:[] },
    contact: { title:'', phone:'', email:'', address:'', mapUrl:'' },
    social: { items:[], bgColor:'transparent' },
    html: { code:'' },
    note: { title:'', text:'', icon:'📝', bgColor:'#eff6ff', accentColor:'#3b82f6', textColor:'#1e293b' },
    alert: { title:'تنبيه', text:'', icon:'⚠️', bgColor:'#fef3c7', accentColor:'#f59e0b', textColor:'#92400e' },
    breaking: { text:'', bgColor:'#1a5579', borderColor:'#1a5579', textColor:'#ffffff', blink:true, animation:'blink', link:'', deco:'none' }
  }[type] || {};
  var sections = window._pbCustomSections || [];
  defaults.type = type;
  defaults.title = defaults.title || '';
  defaults._id = '_custom_' + sections.length;
  defaults._visible = true;
  sections.push(defaults);
  window._pbCustomSections = sections;
  var picker = document.getElementById('pbAddSectionPicker');
  if (picker) picker.remove();
  adminRefreshPageBuilder();
  adminEditCustomSection(sections.length - 1);
}

function pbUploadImage(btn) {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
      var dataUrl = e.target.result;
      showToast('جاري رفع الصورة...', 'info');
      var url = await uploadToImgbb(dataUrl);
      if (!url) { showToast('فشل رفع الصورة', 'error'); return; }
      var i = btn.previousElementSibling;
      i.value = url;
      var p = i.closest('.pb-field').querySelector('img');
      if (p) { p.src = url; } else {
        var im = document.createElement('img');
        im.style.cssText = 'max-height:80px;border-radius:8px;border:1px solid var(--border);display:block;margin-bottom:6px';
        im.src = url;
        i.parentElement.parentElement.insertBefore(im, i.parentElement);
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function adminRenderPBField(name, label, value, type, extra) {
  var v = (value !== undefined && value !== null) ? String(value).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : '';
  var e = extra || {};
  if (type === 'text') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="text" class="pb-field-input" data-field="' + name + '" value="' + v + '" placeholder="' + (e.placeholder||'') + '"></div>';
  } else if (type === 'textarea') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><textarea class="pb-field-input pb-field-textarea" data-field="' + name + '" rows="' + (e.rows||4) + '" placeholder="' + (e.placeholder||'') + '">' + v + '</textarea></div>';
  } else if (type === 'number') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="number" class="pb-field-input" data-field="' + name + '" value="' + v + '" min="' + (e.min||0) + '" max="' + (e.max||9999) + '" style="width:120px"></div>';
  } else if (type === 'datetime-local') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="datetime-local" class="pb-field-input" data-field="' + name + '" value="' + v + '" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"></div>';
  } else if (type === 'color') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><div style="display:flex;align-items:center;gap:8px"><input type="color" class="pb-field-input" data-field="' + name + '" value="' + (v||'#ffffff') + '" style="width:45px;height:35px;padding:0;border:1px solid var(--border);border-radius:6px;cursor:pointer"><span class="pb-color-val" style="font-size:.7rem;color:var(--text-muted)">' + (v||'#ffffff') + '</span></div></div>';
  } else if (type === 'image') {
    var img = value ? '<img src="' + value.replace(/"/g,'&quot;') + '" style="max-height:80px;border-radius:8px;border:1px solid var(--border);display:block;margin-bottom:6px">' : '';
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label>' + img + '<div style="display:flex;gap:4px"><input type="text" class="pb-field-input" data-field="' + name + '" value="' + v + '" placeholder="' + (e.placeholder||'رابط الصورة') + '" style="flex:1"><button type="button" onclick="pbUploadImage(this)" style="padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.7rem"><i class="fa-solid fa-upload"></i></button></div></div>';
  } else if (type === 'select') {
    var opts = (e.options||[]).map(function(o) { return '<option value="' + o.value + '" ' + (value==o.value?'selected':'') + '>' + o.label + '</option>'; }).join('');
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><select class="pb-field-input pb-field-select" data-field="' + name + '" style="padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;background:var(--card);color:var(--text);max-width:300px">' + opts + '</select></div>';
  } else if (type === 'multiselect') {
    var opts = e.options || [];
    var vals = value ? String(value).split(',').map(function(s) { return s.trim(); }) : [];
    var btnText = vals.length > 0 ? vals.length + ' مختارة' : 'اختر...';
    var hiddenId = 'ms_' + name + '_' + Math.random().toString(36).substring(2, 7);
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><div style="display:flex;align-items:center;gap:8px">' +
      '<input type="hidden" id="' + hiddenId + '" data-field="' + name + '" value="' + (value || '') + '">' +
      '<button type="button" onclick="adminOpenMultiPicker(\'' + hiddenId + '\',\'' + label.replace(/'/g,"\\'") + '\',\'' + encodeURIComponent(JSON.stringify(opts)) + '\')" style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--card);cursor:pointer;font-family:inherit;font-size:.82rem;color:var(--text);text-align:right;display:flex;align-items:center;justify-content:space-between;transition:border-color .2s" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'\'">' +
      '<span id="' + hiddenId + '_label" style="color:' + (vals.length > 0 ? 'var(--text)' : 'var(--text-muted)') + '">' + btnText + '</span>' +
      '<span style="color:var(--text-muted);font-size:.75rem"><i class="fa-solid fa-chevron-down"></i></span></button></div></div>';
  } else if (type === 'checkbox') {
    return '<div class="pb-field" style="flex-direction:row;align-items:center;gap:10px"><label class="pb-field-label" style="margin-bottom:0;flex:1">' + label + '</label><input type="checkbox" class="pb-field-checkbox" data-field="' + name + '" ' + (value ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--accent)"></div>';
  } else if (type === 'section') {
    return '<div style="font-size:.9rem;font-weight:800;padding:10px 0 6px;border-bottom:2px solid var(--accent);margin-bottom:12px;color:var(--text)">' + label + '</div>';
  } else if (type === 'items') {
    var items = Array.isArray(value) ? value : [];
    var itemFields = e.itemFields || [{name:'text',label:'النص',type:'text'}];
    var itemHtml = items.map(function(item, i) {
      var fields = itemFields.map(function(f) {
        return adminRenderPBField(f.name, f.label, item[f.name], f.type, f.extra||{});
      }).join('');
      return '<div class="pb-item-row" data-index="' + i + '" style="display:grid;grid-template-columns:1fr auto;gap:6px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--bg)">' +
        '<div style="display:contents">' + fields + '</div>' +
        '<div style="display:flex;align-items:flex-end;gap:2px;padding-bottom:2px">' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);adminDeletePBItem(l.dataset.field,i)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:3px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i>0){l.insertBefore(p,l.children[i-1])}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأعلى"><i class="fa-solid fa-chevron-up"></i></button>' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i<l.children.length-1){l.insertBefore(l.children[i+1],p)}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأسفل"><i class="fa-solid fa-chevron-down"></i></button></div></div>';
    }).join('');
    return '<div class="pb-field" data-field="' + name + '"><label class="pb-field-label">' + label + '</label><div class="pb-items-container" data-field="' + name + '">' + itemHtml + '</div>' +
      '<button type="button" onclick="adminAddPBItem(\'' + name + '\')" style="padding:6px 14px;border:1px dashed var(--border);border-radius:8px;background:transparent;cursor:pointer;font-size:.75rem;font-weight:600;color:var(--text-muted);font-family:inherit;margin-top:2px"><i class="fa-solid fa-plus"></i> إضافة ' + (e.addLabel||'عنصر') + '</button></div>';
  }
  return '';
}

function adminToggleGalleryFields(layout, idx) {
  var container = document.getElementById('pbEditFields_' + idx);
  if (!container) return;
  var show = {};
  if (layout === 'grid') { show.columns = 1; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 0; show.interval = 0; }
  else if (layout === 'slider') { show.columns = 0; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 1; show.interval = 1; }
  else if (layout === 'carousel') { show.columns = 1; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 1; show.interval = 1; }
  else if (layout === 'masonry') { show.columns = 0; show.aspectRatio = 1; show.imageHeight = 0; show.gap = 1; show.lightbox = 1; show.autoPlay = 0; show.interval = 0; }
  Object.keys(show).forEach(function(name) {
    var el = container.querySelector('[data-field="' + name + '"]');
    if (el) {
      var pb = el.closest('.pb-field');
      if (pb) pb.style.display = show[name] ? '' : 'none';
    }
  });
}

function adminGetPBFields(section) {
  var t = section.type;
  var fields = [];
  if (t === 'hero') {
    fields = [
      { name:'title', label:'العنوان الرئيسي', type:'text', placeholder:'عنوان البانر' },
      { name:'subtitle', label:'النص الفرعي', type:'text', placeholder:'نص توضيحي قصير' },
      { name:'content', label:'وصف إضافي', type:'textarea', rows:2, placeholder:'...' },
      { name:'btnText', label:'نص الزر', type:'text' },
      { name:'btnLink', label:'رابط الزر', type:'text', placeholder:'https://...' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'overlay', label:'طبقة تعتيم', type:'checkbox' },
      { name:'height', label:'الارتفاع (بكسل)', type:'number', min:200, max:800 },
      { name:'btnStyle', label:'نوع الزر', type:'select', options:[{value:'fill',label:'مملوء'},{value:'outline',label:'مفرغ'},{value:'underline',label:'خط فقط'}] }
    ];
  } else if (t === 'banner') {
    fields = [
      { name:'image', label:'صورة البانر', type:'image' },
      { name:'link', label:'رابط الضغط', type:'text', placeholder:'https://...' },
      { name:'alt', label:'نص بديل', type:'text' },
      { name:'borderRadius', label:'استدارة الزوايا', type:'number', min:0, max:50 }
    ];
  } else if (t === 'text') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'content', label:'المحتوى (يدعم HTML)', type:'textarea', rows:6 },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textAlign', label:'محاذاة النص', type:'select', options:[{value:'right',label:'يمين'},{value:'center',label:'وسط'},{value:'left',label:'يسار'}] },
      { name:'textSize', label:'حجم الخط', type:'select', options:[{value:'sm',label:'صغير'},{value:'md',label:'متوسط'},{value:'lg',label:'كبير'}] }
    ];
  } else if (t === 'spacer') {
    fields = [
      { name:'height', label:'الارتفاع (بكسل)', type:'number', min:5, max:300 }
    ];
  } else if (t === 'divider') {
    fields = [
      { name:'text', label:'نص على الخط', type:'text' },
      { name:'lineColor', label:'لون الخط', type:'color' },
      { name:'lineStyle', label:'نوع الخط', type:'select', options:[{value:'solid',label:'متصل'},{value:'dashed',label:'متقطع'},{value:'dotted',label:'منقط'}] },
      { name:'thickness', label:'سماكة الخط', type:'number', min:1, max:10 }
    ];
  } else if (t === 'gallery') {
    fields = [
      { name:'images', label:'الصور', type:'items', itemFields:[{name:'src',label:'الصورة',type:'image'},{name:'link',label:'رابط (اختياري)',type:'text'},{name:'caption',label:'شرح (اختياري)',type:'text'}], addLabel:'صورة' },
      { name:'layout', label:'الشكل', type:'select', options:[{value:'grid',label:'شبكة'},{value:'carousel',label:'كاروسيل'},{value:'slider',label:'سلايدر'},{value:'masonry',label:'ماسونري'}] },
      { name:'columns', label:'الأعمدة', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'},{value:'6',label:'6'}] },
      { name:'aspectRatio', label:'نسبة الصورة', type:'select', options:[{value:'3/2',label:'3:2'},{value:'4/3',label:'4:3'},{value:'16/9',label:'16:9'},{value:'1/1',label:'مربع'},{value:'free',label:'حسب الصورة'}] },
      { name:'imageHeight', label:'الارتفاع', type:'number', min:80, max:500 },
      { name:'gap', label:'الفراغ', type:'number', min:0, max:30 },
      { name:'lightbox', label:'تكبير عند الضغط', type:'checkbox' },
      { name:'autoPlay', label:'تشغيل تلقائي', type:'checkbox' },
      { name:'interval', label:'الفاصل (ثواني)', type:'number', min:1, max:15 }
    ];
    if (section.layout === 'slider') fields = fields.filter(function(f) { return f.name !== 'columns'; });
    if (section.layout === 'grid') fields = fields.filter(function(f) { return f.name !== 'autoPlay' && f.name !== 'interval'; });
    if (section.layout === 'masonry') fields = fields.filter(function(f) { return f.name !== 'columns' && f.name !== 'imageHeight' && f.name !== 'autoPlay' && f.name !== 'interval'; });
  } else if (t === 'video') {
    fields = [
      { name:'url', label:'رابط الفيديو (YouTube/Vimeo)', type:'text', placeholder:'https://youtube.com/watch?v=...' },
      { name:'autoplay', label:'تشغيل تلقائي', type:'checkbox' },
      { name:'muted', label:'صامت', type:'checkbox' },
      { name:'controls', label:'إظهار عناصر التحكم', type:'checkbox' },
      { name:'loop', label:'تكرار', type:'checkbox' },
      { name:'ratio', label:'نسبة العرض للارتفاع', type:'select', options:[{value:'56.25',label:'16:9'},{value:'75',label:'4:3'},{value:'100',label:'1:1'}] }
    ];
  } else if (t === 'countdown') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'timerType', label:'نوع المؤقت', type:'select', options:[{value:'fixed',label:'تاريخ محدد'},{value:'duration',label:'مدة من الآن'}] },
      { name:'endDate', label:'تاريخ الانتهاء', type:'datetime-local' },
      { name:'duration', label:'المدة (بالساعات)', type:'number', min:1, max:720, extra:{min:1} },
      { name:'message', label:'رسالة عند الانتهاء', type:'text' },
      { name:'bgType', label:'نوع الخلفية', type:'select', options:[{value:'color',label:'لون'},{value:'image',label:'صورة'},{value:'transparent',label:'شفاف'}] },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'overlay', label:'طبقة تعتيم على الصورة', type:'checkbox' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'accentColor', label:'لون التمييز', type:'color' },
      { name:'layout', label:'ترتيب الأرقام', type:'select', options:[{value:'row',label:'صف أفقي'},{value:'column',label:'عمودي'},{value:'grid',label:'شبكة 2×2'}] },
      { name:'animation', label:'أنيميشن عند تغير الأرقام', type:'checkbox' },
      { name:'showDays', label:'إظهار الأيام', type:'checkbox' },
      { name:'showHours', label:'إظهار الساعات', type:'checkbox' },
      { name:'showMinutes', label:'إظهار الدقائق', type:'checkbox' },
      { name:'showSeconds', label:'إظهار الثواني', type:'checkbox' }
    ];
  } else if (t === 'testimonials') {
    fields = [
      { name:'items', label:'الآراء', type:'items', itemFields:[
        {name:'name',label:'الاسم',type:'text'},
        {name:'role',label:'الدور/المنصب',type:'text'},
        {name:'avatar',label:'الصورة الشخصية',type:'image'},
        {name:'text',label:'نص الرأي',type:'textarea',rows:3},
        {name:'rating',label:'التقييم (1-5)',type:'number',min:1,max:5}
      ], addLabel:'رأي' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'autoplay', label:'تشغيل تلقائي (كاروسيل)', type:'checkbox' }
    ];
  } else if (t === 'features') {
    fields = [
      { name:'items', label:'المميزات', type:'items', itemFields:[
        {name:'icon',label:'رمز (FontAwesome أو إيموجي)',type:'text',placeholder:'fa-star أو ⭐'},
        {name:'title',label:'العنوان',type:'text'},
        {name:'desc',label:'الوصف',type:'textarea',rows:2}
      ], addLabel:'ميزة' },
      { name:'columns', label:'عدد الأعمدة', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'iconColor', label:'لون الأيقونات', type:'color' },
      { name:'showBorder', label:'إظهار حدود', type:'checkbox' }
    ];
  } else if (t === 'newsletter') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'subtitle', label:'النص التوضيحي', type:'text' },
      { name:'btnText', label:'نص الزر', type:'text' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'accentColor', label:'لون الزر', type:'color' },
      { name:'icon', label:'الأيقونة', type:'text', placeholder:'📧' },
      { name:'placeholder', label:'نص الحقل', type:'text' }
    ];
  } else if (t === 'products') {
    var storeCats = [];
    try { storeCats = JSON.parse(localStorage.getItem('mycart_categories') || '[]'); } catch(e){}
    var storeProds = [];
    try { storeProds = JSON.parse(localStorage.getItem('mycart_admin_products') || '[]'); } catch(e){}
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'icon', label:'أيقونة القسم', type:'select', options:[
        {value:'fa-bag-shopping',label:'🛍️ حقيبة تسوق'},
        {value:'fa-boxes-stacked',label:'📦 صناديق منتجات'},
        {value:'fa-tags',label:'🏷️ تاجات'},
        {value:'fa-store',label:'🏪 متجر'},
        {value:'fa-cart-shopping',label:'🛒 سلة تسوق'},
        {value:'fa-bookmark',label:'🔖 إشارة مرجعية'},
        {value:'fa-star',label:'⭐ نجمة'},
        {value:'fa-fire',label:'🔥 نار'},
        {value:'fa-gift',label:'🎁 هدية'},
        {value:'fa-gem',label:'💎 ماسة'}
      ] },
      { name:'mode', label:'طريقة عرض المنتجات', type:'select', options:[{value:'category',label:'حسب التصنيف'},{value:'featured',label:'المميزة فقط'},{value:'ids',label:'منتجات محددة بالمعرف'}] },
      { name:'category', label:'اختر التصنيف (إذا اخترت حسب التصنيف)', type:'select', options:[{value:'',label:'اختر التصنيف...'}].concat(storeCats.map(function(c){return {value:c.name,label:c.name};})) },
      { name:'productIds', label:'اختر المنتجات (إذا اخترت منتجات محددة)', type:'multiselect', options:storeProds.map(function(p){return {value:String(p.id),label:p.name};}) },
      { name:'layout', label:'طريقة العرض', type:'select', options:[{value:'grid',label:'شبكة (Grid)'},{value:'carousel',label:'شريط متحرك (Carousel)'}] },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'showTitle', label:'إظهار عنوان المنتج', type:'checkbox' },
      { name:'showPrice', label:'إظهار السعر', type:'checkbox' },
      { name:'showAddToCart', label:'إظهار زر الإضافة للسلة', type:'checkbox' },
      { name:'showRating', label:'إظهار التقييم', type:'checkbox' }
    ];
  } else if (t === 'categories') {
    var storeCats = [];
    try { storeCats = JSON.parse(localStorage.getItem('mycart_categories') || '[]'); } catch(e){}
    var onlyCats = storeCats.filter(function(c){return !c.isBrand;});
    var onlyBrands = storeCats.filter(function(c){return c.isBrand;});
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'mode', label:'طريقة جلب التصنيفات', type:'select', options:[{value:'auto',label:'تلقائي (كل التصنيفات)'},{value:'manual',label:'يدوي (تحديد تصنيفات معينة)'}] },
      { name:'categoryNames', label:'اختر التصنيفات (إذا اخترت يدوي)', type:'multiselect', options:onlyCats.map(function(c){return {value:c.name,label:c.name};}) },
      { name:'includeBrands', label:'تضمين الماركات في الشبكة', type:'multiselect', options:onlyBrands.map(function(c){return {value:c.name,label:c.name};}) },
      { name:'layout', label:'التصميم', type:'select', options:[{value:'grid',label:'شبكة'},{value:'carousel',label:'شريط متحرك'},{value:'list',label:'قائمة دائرية مبسطة'}] },
      { name:'cardsPerView', label:'عدد العناصر الظاهرة (للشريط)', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'},{value:'6',label:'6'}] },
      { name:'mobileCards', label:'عدد العناصر في الجوال', type:'number', min:1, max:4 },
      { name:'imageHeight', label:'ارتفاع الصورة', type:'number', min:50, max:300 },
      { name:'gap', label:'الفراغ بين الكروت', type:'number', min:0, max:50 },
      { name:'cardRadius', label:'استدارة زوايا الكروت', type:'number', min:0, max:40 },
      { name:'cardShadow', label:'ظل الكروت', type:'select', options:[{value:'none',label:'بدون'},{value:'sm',label:'خفيف'},{value:'md',label:'متوسط'},{value:'lg',label:'قوي'}] },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'showNames', label:'إظهار أسماء التصنيفات', type:'checkbox' },
      { name:'showCount', label:'إظهار عدد المنتجات', type:'checkbox' }
    ];
  } else if (t === 'html') {
    fields = [
      { name:'code', label:'كود HTML', type:'textarea', rows:10 }
    ];
  } else if (t === 'video') {
    fields = [
      { name:'url', label:'رابط الفيديو (YouTube/Vimeo/Direct)', type:'text' },
      { name:'aspectRatio', label:'نسبة الأبعاد', type:'select', options:[{value:'16/9',label:'16:9'},{value:'4/3',label:'4:3'},{value:'1/1',label:'1:1'}] },
      { name:'autoPlay', label:'تشغيل تلقائي', type:'checkbox' },
      { name:'muted', label:'كتم الصوت', type:'checkbox' },
      { name:'loop', label:'تكرار مستمر', type:'checkbox' }
    ];
  } else if (t === 'countdown') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'endTime', label:'وقت الانتهاء (YYYY-MM-DD HH:MM:SS)', type:'text', placeholder:'2026-12-31 23:59:59' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' }
    ];
  } else if (t === 'testimonials') {
    fields = [
      { name:'items', label:'الآراء', type:'items', itemFields:[
        {name:'name',label:'الاسم',type:'text'},
        {name:'role',label:'الوظيفة/البلد',type:'text'},
        {name:'text',label:'الرأي',type:'textarea',rows:3},
        {name:'rating',label:'التقييم (1-5)',type:'number',min:1,max:5},
        {name:'image',label:'الصورة',type:'image'}
      ], addLabel:'رأي' },
      { name:'bgColor', label:'لون الخلفية', type:'color' }
    ];
  } else if (t === 'faq') {
    fields = [
      { name:'items', label:'الأسئلة والأجوبة', type:'items', itemFields:[
        {name:'question',label:'السؤال',type:'text'},
        {name:'answer',label:'الجواب',type:'textarea',rows:3}
      ], addLabel:'سؤال وجواب' }
    ];
  } else if (t === 'contact') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'phone', label:'رقم الهاتف', type:'text' },
      { name:'email', label:'البريد الإلكتروني', type:'text' },
      { name:'address', label:'العنوان', type:'text' },
      { name:'mapUrl', label:'رابط خريطة Google Map (iframe)', type:'text' }
    ];
  } else if (t === 'social') {
    fields = [
      { name:'items', label:'روابط التواصل', type:'items', itemFields:[
        {name:'icon',label:'أيقونة الشبكة (مثال: fa-facebook)',type:'text'},
        {name:'link',label:'الرابط الكامل',type:'text'}
      ], addLabel:'رابط' },
      { name:'bgColor', label:'لون الخلفية', type:'color' }
    ];
  } else if (t === 'logos') {
    fields = [
      { name:'images', label:'الشعارات', type:'items', itemFields:[
        {name:'src',label:'صورة الشعار',type:'image'},
        {name:'name',label:'الاسم (بديل إذا لا وجود صورة)',type:'text'},
        {name:'link',label:'الرابط (اختياري)',type:'text'}
      ], addLabel:'شعار' },
      { name:'height', label:'ارتفاع الشريط', type:'number', min:30, max:200 },
      { name:'speed', label:'سرعة الحركة', type:'select', options:[{value:'slow',label:'بطيء'},{value:'medium',label:'متوسط'},{value:'fast',label:'سريع'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'grayscale', label:'شعارات رمادية', type:'checkbox' },
      { name:'linkMode', label:'الروابط', type:'select', options:[{value:'none',label:'بدون روابط'},{value:'custom',label:'روابط مخصصة لكل شعار'}] }
    ];
  } else if (t === 'note' || t === 'alert') {
    fields = [
      { name:'title', label:'العنوان', type:'text', placeholder:'مثال: تخفيض جديد / انتباه' },
      { name:'text', label:'النص', type:'textarea', rows:3, placeholder:'اكتب النص هنا...' },
      { name:'icon', label:'الأيقونة (إيموجي)', type:'text', placeholder:'📝 / ⚠️' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'accentColor', label:'لون الشريط الجانبي', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' }
    ];
  } else if (t === 'breaking') {
    fields = [
      { name:'text', label:'النص', type:'textarea', rows:2, placeholder:'مثال: التوصيل متاح للضفة والداخل والقدس' },
      { name:'link', label:'الرابط (اختياري)', type:'text', placeholder:'https://...' },
      { name:'animation', label:'الأنميشن / الحركة', type:'select', options:[{value:'blink',label:'وميض'},{value:'pulse',label:'نبض'},{value:'flash',label:'برق'},{value:'slide',label:'اهتزاز'},{value:'bounce',label:'قفزة'},{value:'spin',label:'دوران'},{value:'marquee',label:'متحرك'},{value:'none',label:'بدون'}] },
      { name:'deco', label:'الزخرفة', type:'select', options:[{value:'none',label:'بدون'},{value:'shine',label:'لمعان متحرك'},{value:'sparkle',label:'نجم متراقص'},{value:'glow',label:'توهج خارجي'},{value:'double',label:'إطار مزدوج'},{value:'wave',label:'موجات سفلية'},{value:'stripes',label:'شرائط جانبية'},{value:'stars',label:'نجوم متناثرة'},{value:'dots',label:'نقاط علوية'}] },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'borderColor', label:'لون الإطار', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' }
    ];
  }
  return fields;
}

function renderSectionPreviewHTML(sec) {
  var t = sec.type;
  var shadowMap = { none:'0 0 0 transparent', sm:'0 1px 3px rgba(0,0,0,.08)', md:'0 4px 12px rgba(0,0,0,.1)', lg:'0 8px 25px rgba(0,0,0,.15)' };
  if (t === 'products') {
    var cols = Math.min(parseInt(sec.columns)||4, 6); var gap = sec.gap!=null?sec.gap:16;
    var cardR = (sec.cardRadius!=null?sec.cardRadius:12)+'px';
    var cardShadow = { none:'0 0 0 transparent', sm:'0 1px 3px rgba(0,0,0,.08)', md:'0 4px 12px rgba(0,0,0,.1)', lg:'0 8px 25px rgba(0,0,0,.15)' }[sec.cardShadow]||'0 1px 3px rgba(0,0,0,.08)';
    var cardCount = sec.layout === 'carousel' ? cols : Math.min(cols,6);
    var prodCards = Array(cardCount).fill(0).map(function(){return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid rgba(0,0,0,0.05);background:#fff;box-shadow:'+cardShadow+';display:flex;flex-direction:column"><div style="height:65px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:1.1rem"><i class="fa-solid fa-box"></i></div><div style="padding:10px;text-align:center;display:flex;flex-direction:column;justify-content:space-between;flex-grow:1">'+
      (sec.showRating?'<div style="font-size:.5rem;color:#f59e0b;margin-bottom:4px;direction:ltr;text-align:center">★★★★☆</div>':'')+
      (sec.showTitle!==false?'<div style="font-size:.65rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">اسم المنتج</div>':'')+
      (sec.showPrice!==false?'<div style="font-size:.7rem;font-weight:800;color:var(--accent);margin-top:4px">$29.99</div>':'')+
      (sec.showAddToCart!==false?'<div style="margin-top:6px;padding:6px;background:var(--accent);color:#fff;border-radius:6px;font-size:.6rem;font-weight:700">🛒 أضف للسلة</div>':'')+
    '</div></div>';});
    var pOpen = sec.layout === 'carousel' ? '<div style="display:flex;gap:'+gap+'px;overflow:hidden;padding:2px 0;position:relative">' :
      '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:'+gap+'px">';
    var pClose = '</div>';
    var pbIcon = sec.icon || 'fa-bag-shopping';
    var pbIconHtml = pbIcon.indexOf('fa-') === 0 ? '<i class="fa-solid '+pbIcon+'"></i>' : '<span>'+pbIcon+'</span>';
    var titleHtml = sec.title ? '<div style="text-align:center;margin-bottom:15px"><div style="font-size:.9rem;font-weight:800;color:'+(sec.textColor||'var(--text)')+';display:inline-block;border-bottom:2px solid var(--accent);padding-bottom:4px">' + pbIconHtml + ' ' + sec.title + '</div></div>' : '';
    return '<div style="padding:15px 10px;background:'+(sec.bgColor||'transparent')+'">' +
      titleHtml +
      pOpen + prodCards.join('') + pClose + '</div>';
  }
  if (t === 'categories') {
    var gap = sec.gap!=null?sec.gap:12;
    var cardR = (sec.cardRadius!=null?sec.cardRadius:12)+'px';
    var imgH = (sec.imageHeight||100)+'px';
    var isCompact = sec.compact;
    var cardShadow = shadowMap[sec.cardShadow]||shadowMap.sm;
    var tCol = sec.textColor || 'var(--text)';
    var bgCss = sec.bgImage ? 'url('+sec.bgImage+') center/cover no-repeat' : (sec.bgColor||'transparent');
    var showNames = sec.showNames !== false;
    var showCount = sec.showCount !== false;
    // Build real items for preview
    var catItems = [];
    if (sec.mode === 'auto') {
      var stored = localStorage.getItem('mycart_categories');
      var siteCats = [];
      if (stored) { try { siteCats = JSON.parse(stored); } catch(e) {} }
      var allProds = window._allProducts || [];
      var filterNames = sec.categoryNames ? sec.categoryNames.split(',').map(function(s){return s.trim()}).filter(Boolean) : [];
      var brandNames = sec.includeBrands ? sec.includeBrands.split(',').map(function(s){return s.trim()}).filter(Boolean) : [];
      siteCats.forEach(function(sc) {
        if (sc.isBrand && brandNames.indexOf(sc.name) === -1) return;
        if (filterNames.length && filterNames.indexOf(sc.name) === -1) return;
        var cnt = allProds.filter(function(p){return p.category === sc.name || (Array.isArray(p.categories) && p.categories.indexOf(sc.name) !== -1)}).length;
        catItems.push({name:sc.name, image:sc.image||'', count:cnt||''});
      });
      if (!catItems.length && allProds.length) {
        var allCats = [...new Set(allProds.flatMap(function(p){return p.categories&&p.categories.length?p.categories:(p.category?[p.category]:[])}))];
        allCats.forEach(function(cn) {
          if (filterNames.length && filterNames.indexOf(cn) === -1) return;
          var cnt = allProds.filter(function(p){return p.category===cn||(Array.isArray(p.categories)&&p.categories.indexOf(cn)!==-1)}).length;
          catItems.push({name:cn,image:'',count:cnt||''});
        });
      }
    } else {
      catItems = sec.items || [];
    }
    var hasItems = catItems.length > 0;
    if (!hasItems) catItems = Array(6).fill(null);
    function renderCatCard(cat) {
      if (!cat) {
        return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid var(--border);text-align:center;background:#fff;box-shadow:'+cardShadow+'"><div style="height:'+(isCompact?'40px':imgH)+';background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:'+(isCompact?'.85rem':'1.2rem')+'"><i class="fa-solid fa-folder-open"></i></div><div style="padding:'+(isCompact?'6px':'8px')+'">' +
          (showNames ? '<div style="font-weight:'+(isCompact?'600':'700')+';font-size:'+(isCompact?'.6rem':'.68rem')+'">تصنيف</div>' : '') +
        '</div></div>';
      }
      var imgHtml = cat.image ? '<img src="'+cat.image+'" style="width:100%;height:'+(isCompact?'40px':imgH)+';object-fit:cover;display:block">' : '<div style="height:'+(isCompact?'40px':imgH)+';background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:'+(isCompact?'.85rem':'1.2rem')+'"><i class="fa-solid fa-folder-open"></i></div>';
      var nameHtml = showNames ? '<div style="font-weight:'+(isCompact?'600':'700')+';font-size:'+(isCompact?'.6rem':'.68rem')+'">'+(cat.name||'')+'</div>' : '';
      var countHtml = showCount && cat.count ? '<div style="font-size:.52rem;color:'+tCol+';opacity:.6;margin-top:2px">'+cat.count+' منتج</div>' : '';
      if (sec.layout === 'list') {
        return '<div style="display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:'+cardR+';padding:'+(isCompact?'5px 10px':'7px 12px')+';border:1px solid var(--border);cursor:pointer;box-shadow:'+cardShadow+'">' +
          (cat.image ? '<img src="'+cat.image+'" style="width:'+(isCompact?'20':'28')+'px;height:'+(isCompact?'20':'28')+'px;border-radius:50%;object-fit:cover;flex-shrink:0">' : '<span style="font-size:'+(isCompact?'.85rem':'1.1rem')+';color:#94a3b8"><i class="fa-solid fa-folder"></i></span>') +
          nameHtml + countHtml +
        '</div>';
      }
      return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid var(--border);text-align:center;background:#fff;box-shadow:'+cardShadow+'">' +
        imgHtml +
        '<div style="padding:'+(isCompact?'5px 6px':'7px 8px')+'">' + nameHtml + countHtml + '</div></div>';
    }
    var layoutOpen = '', layoutClose = '';
    if (sec.layout === 'carousel') {
      var cpv = parseInt(sec.cardsPerView) || 4;
      var mcpv = parseInt(sec.mobileCards) || Math.min(cpv, 2);
      var respNote = cpv !== mcpv ? '<div style="font-size:.55rem;color:#94a3b8;text-align:center;margin-bottom:4px">ديسكتوب ' + cpv + ' · جوال ' + mcpv + '</div>' : '';
      layoutOpen = respNote + '<div style="display:flex;gap:'+gap+'px;overflow:hidden;padding:2px 0">';
      layoutClose = '</div>';
    } else if (sec.layout === 'list') {
      layoutOpen = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:'+gap+'px">';
      layoutClose = '</div>';
    } else {
      layoutOpen = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:'+gap+'px">';
      layoutClose = '</div>';
    }
    return '<div style="padding:10px;background:'+bgCss+'">' +
      (sec.title ? '<div style="font-size:.82rem;font-weight:800;color:'+tCol+';margin:0 0 10px;text-align:center">' + sec.title + '</div>' : '') +
      layoutOpen + catItems.slice(0,8).map(renderCatCard).join('') + layoutClose + (catItems.length>8?'<div style="text-align:center;font-size:.6rem;color:var(--text-muted);margin-top:6px">... +'+(catItems.length-8)+' تصنيف</div>':'') + '</div>';
  }
  if (t === 'html') {
    return '<div style="padding:10px;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:8px;text-align:center"><div style="font-size:1rem;color:#94a3b8"><i class="fa-solid fa-code"></i></div><div style="font-size:.6rem;color:var(--text-muted);margin-top:4px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(sec.code||sec.content||'&lt;!-- كود HTML --&gt;')+'</div></div>';
  }
if (t === 'breaking') {
    var bkText = sec.text || sec.title || 'إعلان بارز';
    var bkBg = sec.bgColor || '#1a5579';
    var bkBorder = sec.borderColor || '#1a5579';
    var bkFg = sec.textColor || '#ffffff';
    var bkAnim = sec.animation || (sec.blink === false ? 'none' : 'blink');
    var bkDeco = sec.deco || 'none';
    if (!document.getElementById('pbBreakingStyle')) {
      var bkStyle = document.createElement('style');
      bkStyle.id = 'pbBreakingStyle';
      bkStyle.textContent = '@keyframes pbBnBlink{0%,100%{box-shadow:0 0 0 1px inset currentColor;opacity:1}50%{box-shadow:0 0 0 6px inset currentColor;opacity:.88}}'
        + '@keyframes pbBnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}'
        + '@keyframes pbBnFlash{0%,100%{opacity:1}50%{opacity:.55}}'
        + '@keyframes pbBnSlide{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'
        + '@keyframes pbBnBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}60%{transform:translateY(-2px)}}'
        + '@keyframes pbBnSpin{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}'
        + '@keyframes pbBnPhone{0%,100%{transform:translateX(0)}50%{transform:translateX(-45%)}}'
        + '@keyframes pbDecoShine{0%{left:-80%}60%,100%{left:135%}}'
        + '@keyframes pbDecoSpark{0%,100%{opacity:.25;transform:scale(.7) rotate(0)}50%{opacity:1;transform:scale(1.2) rotate(36deg)}}'
        + '@keyframes pbDecoStars{0%,100%{opacity:.22}50%{opacity:.9}}'
        + '.pb-bn-blink{animation:pbBnBlink 1.1s steps(1) infinite}'
        + '.pb-bn-pulse{animation:pbBnPulse 1.6s ease-in-out infinite}'
        + '.pb-bn-flash{animation:pbBnFlash .7s steps(1) infinite}'
        + '.pb-bn-slide{animation:pbBnSlide 1.4s ease infinite}'
        + '.pb-bn-bounce{animation:pbBnBounce 1.2s ease-in-out infinite}'
        + '.pb-bn-spin{animation:pbBnSpin 1.8s ease-in-out infinite}'
        + '.pb-bn-marquee .pb-bn-mq{display:inline-block;white-space:nowrap;animation:pbBnPhone 1s ease-in-out infinite}'
        + '.pb-bn-deco-shine{position:relative;overflow:hidden}'
        + '.pb-bn-deco-shine::before{content:"";position:absolute;top:-10%;left:-80%;width:45%;height:120%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:pbDecoShine 2.8s infinite}'
        + '.pb-bn-deco-sparkle{position:relative}'
        + '.pb-bn-deco-sparkle::after{content:"✦";position:absolute;right:12px;top:5px;font-size:.8rem;color:inherit;animation:pbDecoSpark 1.4s ease-in-out infinite}'
        + '.pb-bn-deco-wave{position:relative;overflow:hidden}'
        + '.pb-bn-deco-stripes{position:relative;overflow:hidden}'
        + '.pb-bn-deco-stripes::before{content:"";position:absolute;top:0;bottom:0;left:0;width:10px;background:repeating-linear-gradient(45deg,currentColor 0 4px,transparent 4px 8px);opacity:.35}'
        + '.pb-bn-deco-stripes::after{content:"";position:absolute;top:0;bottom:0;right:0;width:10px;background:repeating-linear-gradient(45deg,currentColor 0 4px,transparent 4px 8px);opacity:.35}'
        + '.pb-bn-deco-stars{position:relative;overflow:hidden}'
        + '.pb-bn-deco-stars::after{content:"";position:absolute;left:8px;top:8px;width:3px;height:3px;border-radius:50%;background:currentColor;box-shadow:30px 22px 0 currentColor,60px 8px 0 currentColor,14px 44px 0 currentColor,52px 40px 0 currentColor,84px 20px 0 currentColor,96px 50px 0 currentColor,40px 60px 0 currentColor;opacity:.55;animation:pbDecoStars 2s ease-in-out infinite}'
        + '.pb-bn-deco-dots{position:relative;overflow:hidden}'
        + '.pb-bn-deco-dots::before{content:"";position:absolute;left:0;right:0;top:-3px;height:9px;background-image:radial-gradient(circle at 5px 5px,currentColor 3px,transparent 4px);background-size:14px 14px;opacity:.45}';
      document.head.appendChild(bkStyle);
    }
    var bkAnimClass = bkAnim === 'blink' ? ' pb-bn-blink' : bkAnim === 'pulse' ? ' pb-bn-pulse' : bkAnim === 'flash' ? ' pb-bn-flash' : bkAnim === 'slide' ? ' pb-bn-slide' : bkAnim === 'bounce' ? ' pb-bn-bounce' : bkAnim === 'spin' ? ' pb-bn-spin' : bkAnim === 'marquee' ? ' pb-bn-marquee' : '';
    var bkDecoClass = bkDeco === 'shine' ? ' pb-bn-deco-shine' : bkDeco === 'sparkle' ? ' pb-bn-deco-sparkle' : bkDeco === 'wave' ? ' pb-bn-deco-wave' : bkDeco === 'stripes' ? ' pb-bn-deco-stripes' : bkDeco === 'stars' ? ' pb-bn-deco-stars' : bkDeco === 'dots' ? ' pb-bn-deco-dots' : '';
    var bkShadow = '0 0 0 1px inset ' + bkFg;
    if (bkDeco === 'glow') bkShadow += ', 0 0 0 2px inset rgba(255,255,255,.22), 0 0 24px ' + bkBg + ', 0 8px 22px rgba(0,0,0,.28)';
    if (bkDeco === 'double') bkShadow += ', 0 0 0 5px ' + bkBorder + ', 0 0 0 6px ' + bkFg;
    var bkBoxStyle = 'text-align:center;background-color:'+bkBg+';border:3px solid '+bkBorder+';box-shadow:'+bkShadow+';border-radius:10px;padding:10px 12px;color:'+bkFg+';font-size:.75rem;font-weight:700;';
    if (bkDeco === 'wave') {
      var bkWaveSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='20'><path d='M0 10 Q20 0 40 10 Q60 20 80 10' fill='none' stroke='" + bkFg + "55' stroke-width='1.5'/></svg>";
      var bkWaveEnc = encodeURIComponent(bkWaveSvg).replace(/'/g, '%27');
      bkBoxStyle += 'background-image:url(\'data:image/svg+xml,' + bkWaveEnc + '\');background-repeat:repeat;';
    }
    var bkInner = bkAnim === 'marquee' ? '<span class="pb-bn-mq">'+bkText+'</span>' : '<span>'+bkText+'</span>';
    return '<div class="breaking-text'+bkAnimClass+bkDecoClass+'" style="'+bkBoxStyle+'">'+bkInner+'</div>';
  }
  if (t === 'note' || t === 'alert') {
    var ntIcon = sec.icon || (t === 'alert' ? '⚠️' : '📝');
    var ntBg = sec.bgColor || (t === 'alert' ? '#fef3c7' : '#eff6ff');
    var ntAcc = sec.accentColor || (t === 'alert' ? '#f59e0b' : '#3b82f6');
    var ntFg = sec.textColor || (t === 'alert' ? '#92400e' : '#1e293b');
    return '<div style="background:'+ntBg+';border-right:4px solid '+ntAcc+';border-radius:10px;padding:10px 12px;display:flex;gap:8px;align-items:flex-start">' +
      (ntIcon ? '<span style="flex-shrink:0;width:26px;height:26px;border-radius:8px;background:'+ntAcc+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.8rem">'+ntIcon+'</span>' : '') +
      '<div style="flex:1;min-width:0">' +
      (sec.title ? '<div style="font-size:.75rem;font-weight:800;color:'+ntFg+';margin-bottom:3px">'+sec.title+'</div>' : '') +
      (sec.text ? '<div style="font-size:.68rem;line-height:1.6;color:'+ntFg+';opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sec.text+'</div>' : '') +
      '</div></div>';
  }
  if (t === 'logos') {
    var lImgs = Array.isArray(sec.images) ? sec.images : [];
    var lH = sec.height || 60;
    var lBg = sec.bg || '#ffffff';
    var lGray = sec.grayscale !== false;
    var lItems = lImgs.length ? lImgs : [{name:'شعار 1'},{name:'شعار 2'},{name:'شعار 3'}];
    var lCards = lItems.map(function(li) {
      var inner = li.src
        ? '<img src="' + li.src + '" style="max-height:' + (lH - 8) + 'px;max-width:80px;object-fit:contain;display:block;border-radius:10px;' + (lGray ? 'filter:grayscale(1);opacity:.7' : '') + '">'
        : '<span style="font-size:.6rem;font-weight:700;color:#94a3b8">' + (li.name || 'شعار') + '</span>';
      return '<div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;height:' + lH + 'px;margin:0 8px;padding:0 12px;background:#fff;border-radius:10px;">' + inner + '</div>';
    }).join('');
    return '<div style="padding:12px;background:' + lBg + ';border:1px dashed var(--border);border-radius:10px">' +
      '<div style="display:flex;align-items:center;overflow:hidden;direction:ltr">' + lCards + lCards + '</div>' +
      '<div style="text-align:center;font-size:.58rem;color:var(--text-muted);margin-top:6px">حركة متواصلة ← ←</div></div>';
  }
  return '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:.75rem">معاينة قيد التطوير</div>';
}

function adminEditCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  window._pbEditingIdx = idx;
  var editId = 'pbEditModal';
  var existing = document.getElementById(editId);
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = editId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  
  var info = PB_SECTION_TYPES[sec.type] || { icon: '📄', label: 'قسم' };
  var fields = adminGetPBFields(sec);
  var fieldsHtml = '';
  fields.forEach(function(f) {
    fieldsHtml += adminRenderPBField(f.name, f.label, sec[f.name], f.type, f);
  });
  var previewId = 'pbLivePreview_' + idx;
  var fieldsId = 'pbEditFields_' + idx;
  
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:20px;max-width:820px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:8px"><button onclick="this.closest(\'#' + editId + '\').remove();adminShowAddSectionPicker()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--text-muted);padding:4px" title="رجوع"><i class="fa-solid fa-arrow-right"></i></button>' +
    '<div><h3 style="font-size:1rem;font-weight:800;margin:0"><span style="font-size:1.1rem">' + info.icon + '</span> ' + (info.label||'تعديل القسم') + '</h3></div></div>' +
    '<button onclick="this.closest(\'#' + editId + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;gap:16px;align-items:flex-start">' +
      // Preview column
      '<div style="flex:1;min-width:0">' +
        '<div id="' + previewId + '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;position:sticky;top:0">' +
          '<div style="font-size:.68rem;font-weight:700;color:#94a3b8;margin-bottom:10px;display:flex;align-items:center;gap:5px"><i class="fa-solid fa-eye"></i> معاينة حية</div>' +
          '<div class="preview-content">' + renderSectionPreviewHTML(sec) + '</div>' +
        '</div>' +
      '</div>' +
      // Fields column
      '<div style="width:340px;flex-shrink:0">' +
        '<div style="margin-bottom:10px;padding:8px 10px;background:#f8fafc;border-radius:8px;font-size:.75rem">' +
          '<label style="font-weight:700;display:block;margin-bottom:3px">عنوان القسم (داخلي)</label>' +
          '<input type="text" id="pbSecTitle" value="' + (sec.title||'').replace(/"/g,'&quot;') + '" oninput="refreshPBPreview(' + idx + ')" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem" placeholder="اسم تعريفي للقسم">' +
        '</div>' +
        '<div id="' + fieldsId + '" data-pbidx="' + idx + '">' + fieldsHtml + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">' +
        '<button onclick="adminSaveCustomSection(' + idx + ')" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem;min-width:100px"><i class="fa-solid fa-check"></i> حفظ</button>' +
        '<button onclick="document.getElementById(\'' + editId + '\').remove()" style="padding:11px 20px;border:1.5px solid var(--border);border-radius:10px;background:var(--card);color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.82rem">إلغاء</button>' +
        '<button onclick="adminDeleteCustomSection(' + idx + ');document.getElementById(\'' + editId + '\').remove()" style="padding:11px 18px;border:1.5px solid #fecaca;border-radius:10px;background:#fef2f2;color:#ef4444;font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-solid fa-trash-can"></i></button></div>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
  // Live preview on field change
  setTimeout(function() {
    var container = document.getElementById(fieldsId);
    if (container) {
      container.addEventListener('input', function() { refreshPBPreview(idx); });
      container.addEventListener('change', function() { refreshPBPreview(idx); });
      // Dynamic gallery field visibility
      var layoutSelect = container.querySelector('[data-field="layout"]');
      if (layoutSelect) {
        layoutSelect.setAttribute('onchange', 'adminToggleGalleryFields(this.value,' + idx + ')');
        adminToggleGalleryFields(layoutSelect.value, idx);
      }
    }
  }, 100);
}

function refreshPBPreview(idx) {
  var preview = document.getElementById('pbLivePreview_' + idx);
  if (!preview) return;
  var fieldsContainer = document.getElementById('pbEditFields_' + idx);
  if (!fieldsContainer) return;
  var sec = window._pbCustomSections && window._pbCustomSections[idx];
  if (!sec) return;
  // Build a temp section with current form values
  var tmp = JSON.parse(JSON.stringify(sec));
  var titleEl = document.getElementById('pbSecTitle');
  if (titleEl) tmp.title = titleEl.value || '';
  // Read layout from form first so adminGetPBFields uses the selected layout
  var layoutEl = fieldsContainer.querySelector('[data-field="layout"]');
  if (layoutEl) tmp.layout = layoutEl.value || 'grid';
  var fields = adminGetPBFields(tmp);
  fields.forEach(function(f) {
    if (f.type === 'section') return;
    var el;
    if (f.type === 'items') {
      tmp[f.name] = sec[f.name] || [];
      return;
    }
    if (f.type === 'multiselect') {
      el = fieldsContainer.querySelector('[data-field="' + f.name + '"]');
      if (el) tmp[f.name] = el.value || '';
      return;
    }
    el = fieldsContainer.querySelector('[data-field="' + f.name + '"]');
    if (!el) return;
    if (f.type === 'checkbox') tmp[f.name] = el.checked;
    else if (f.type === 'number') tmp[f.name] = parseFloat(el.value) || 0;
    else tmp[f.name] = el.value;
  });
  var content = preview.querySelector('.preview-content');
  if (content) content.innerHTML = renderSectionPreviewHTML(tmp);
}

function adminSaveCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  
  // Internal title
  var titleEl = document.getElementById('pbSecTitle');
  if (titleEl) sec.title = titleEl.value || '';
  
  // Save all fields from the form
  var container = document.getElementById('pbEditFields_' + idx);
  if (container) {
    // Read layout from DOM first so adminGetPBFields uses the selected layout
    var layoutEl = container.querySelector('[data-field="layout"]');
    if (layoutEl) sec.layout = layoutEl.value || 'grid';
  }
  var fields = adminGetPBFields(sec);
  if (container) {
    fields.forEach(function(f) {
      if (f.type === 'section') return;
      if (f.type === 'items') {
        // Items are stored in the DOM
        var itemsContainer = container.querySelector('.pb-items-container[data-field="' + f.name + '"]');
        if (itemsContainer) {
          var items = [];
          itemsContainer.querySelectorAll('.pb-item-row').forEach(function(row) {
            var item = {};
            row.querySelectorAll('.pb-field-input').forEach(function(inp) {
              item[inp.dataset.field] = inp.value;
            });
            row.querySelectorAll('.pb-field-checkbox').forEach(function(cb) {
              item[cb.dataset.field] = cb.checked;
            });
            items.push(item);
          });
          sec[f.name] = items;
        }
        return;
      }
      var el = container.querySelector('[data-field="' + f.name + '"]');
      if (!el) return;
      if (f.type === 'checkbox') sec[f.name] = el.checked;
      else if (f.type === 'number') sec[f.name] = parseFloat(el.value) || 0;
      else if (f.type === 'multiselect') sec[f.name] = el.value;
      else sec[f.name] = el.value;
    });
  }
  
  window._pbCustomSections = sections;
  var modal = document.getElementById('pbEditModal');
  if (modal) modal.remove();
  adminRefreshPageBuilder();
  adminMarkSaved();
  showToast('✅ تم حفظ القسم: ' + sec.title, 'success');
}

function adminDeleteCustomSection(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا القسم؟', function() {
    var sections = window._pbCustomSections || [];
    sections.splice(idx, 1);
    sections.forEach(function(s, i) { s._id = '_custom_' + i; });
    window._pbCustomSections = sections;
    adminRefreshPageBuilder();
    showToast('🗑️ تم حذف القسم', 'info');
  });
}

function adminToggleCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  sec._visible = sec._visible === false ? true : false;
  window._pbCustomSections = sections;
  adminRefreshPageBuilder();
  if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
}

function adminDuplicateCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  var copy = JSON.parse(JSON.stringify(sec));
  copy.title = copy.title ? copy.title + ' (نسخة)' : '';
  copy._id = '_custom_' + sections.length;
  sections.push(copy);
  window._pbCustomSections = sections;
  adminRefreshPageBuilder();
  showToast('📋 تم نسخ القسم', 'success');
}

function adminResetPageBuilder() {
  showConfirmModal('هل أنت متأكد من إعادة تعيين جميع الأقسام المخصصة؟<br><small style="color:#ef4444">لا يمكن التراجع</small>', function() {
    showConfirmModal('تأكيد: سيتم حذف جميع الأقسام المخصصة', function() {
      window._pbCustomSections = [];
      adminRefreshPageBuilder();
      showToast('🔄 تم إعادة تعيين المنشئ', 'info');
    });
  });
}

// Item management helpers for the form
function adminAddPBItem(fieldName) {
  var container = document.querySelector('.pb-items-container[data-field="' + fieldName + '"]');
  if (!container) return;
  var sec = window._pbCustomSections && window._pbCustomSections[window._pbEditingIdx];
  if (!sec) return;
  var fields = adminGetPBFields(sec).find(function(f) { return f.name === fieldName; });
  if (!fields) return;
  var emptyItem = {};
  (fields.itemFields || []).forEach(function(f) {
    if (f.type === 'checkbox') emptyItem[f.name] = false;
    else emptyItem[f.name] = '';
  });
  var itemFieldsHtml = (fields.itemFields || []).map(function(f) {
    return adminRenderPBField(f.name, f.label, emptyItem[f.name], f.type, f.extra||{});
  }).join('');
  var div = document.createElement('div');
  div.className = 'pb-item-row';
  div.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--bg)';
  div.innerHTML = '<div style="display:contents">' + itemFieldsHtml + '</div>' +
    '<div style="display:flex;align-items:flex-end;gap:2px;padding-bottom:2px">' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);adminDeletePBItem(l.dataset.field,i)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:3px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i>0){l.insertBefore(p,l.children[i-1])}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأعلى"><i class="fa-solid fa-chevron-up"></i></button>' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i<l.children.length-1){l.insertBefore(l.children[i+1],p)}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأسفل"><i class="fa-solid fa-chevron-down"></i></button></div>';
  container.appendChild(div);
}

function adminDeletePBItem(fieldName, idx) {
  var container = document.querySelector('.pb-items-container[data-field="' + fieldName + '"]');
  if (!container) return;
  var rows = container.querySelectorAll('.pb-item-row');
  if (rows[idx]) rows[idx].remove();
}

function adminOpenMultiPicker(hiddenId, label, optsJson) {
  var opts = JSON.parse(decodeURIComponent(optsJson));
  var hidden = document.getElementById(hiddenId);
  if (!hidden) return;
  var currentVal = hidden.value ? hidden.value.split(',').map(function(s) { return s.trim(); }) : [];
  var modalId = 'multiPicker_' + hiddenId;
  var existing = document.getElementById(modalId);
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = modalId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  var html = '<div style="background:var(--card);border-radius:16px;padding:24px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
    '<h3 style="font-size:1rem;font-weight:800;margin:0">' + label + '</h3>' +
    '<button onclick="document.getElementById(\'' + modalId + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">';
  opts.forEach(function(o) {
    var checked = currentVal.indexOf(o.value) !== -1;
    html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-radius:8px;transition:background .15s;font-size:.85rem;font-weight:600;background:' + (checked ? '#f8fafc' : 'transparent') + '">' +
      '<input type="checkbox" class="ms-item" data-value="' + o.value.replace(/"/g,'&quot;') + '" ' + (checked ? 'checked' : '') + ' style="accent-color:var(--accent);width:17px;height:17px">' +
      (o.image ? '<img src="' + o.image.replace(/"/g,'&quot;') + '" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid var(--border)" onerror="this.style.display=\'none\'">' : '<span style="width:32px;height:32px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#94a3b8;flex-shrink:0"><i class="fa-solid fa-folder"></i></span>') +
      ' ' + o.label + '</label>';
  });
  html += '</div>' +
    '<button onclick="adminSaveMultiPicker(\'' + hiddenId + '\',\'' + modalId + '\')" style="width:100%;margin-top:16px;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.88rem">تأكيد</button></div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

function adminSaveMultiPicker(hiddenId, modalId) {
  var hidden = document.getElementById(hiddenId);
  var modal = document.getElementById(modalId);
  if (!hidden || !modal) return;
  var checked = modal.querySelectorAll('.ms-item:checked');
  var vals = Array.from(checked).map(function(c) { return c.getAttribute('data-value'); }).join(',');
  hidden.value = vals;
  var label = document.getElementById(hiddenId + '_label');
  if (label) {
    var count = vals ? vals.split(',').filter(Boolean).length : 0;
    label.textContent = count > 0 ? count + ' مختارة' : 'اختر...';
    label.style.color = count > 0 ? 'var(--text)' : 'var(--text-muted)';
  }
  modal.remove();
  // Trigger change for live preview
  var evt = new Event('change', { bubbles: true });
  hidden.dispatchEvent(evt);
}

var BUILTIN_SECTION_FIELDS = {
  flashSale: { hasIntro: true },
  halfPrice: { hasIntro: true },
  offers: { hasIntro: false },
  featured: { hasIntro: false },
  newArrival: { hasIntro: false },
  mostSold: { hasIntro: false },
  couponDetector: { hasIntro: false },
  banner: { hasIntro: false }
};

function adminEditBuiltinSection(sid) {
  var id = 'editBuiltin_' + sid;
  var ex = document.getElementById(id);
  if (ex) ex.remove();
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var ov = overrides[sid] || {};
  var info = BUILTIN_SECTION_FIELDS[sid] || {};
  var labels = { flashSale:'تخفيضات سريعة', halfPrice:'نصف السعر', offers:'عروض خاصة', featured:'منتجات مميزة', newArrival:'وصل حديثاً', mostSold:'الأكثر مبيعاً', couponDetector:'كاشف الخصم', banner:'البانرات' };
  var iconMap = { flashSale:'fa-bolt', halfPrice:'fa-tags', offers:'fa-gem', featured:'fa-star', newArrival:'fa-bookmark', mostSold:'fa-fire', couponDetector:'fa-ticket', banner:'fa-images' };
  var colorMap = { flashSale:'#ef4444', halfPrice:'#ec4899', offers:'#f59e0b', featured:'#3b82f6', newArrival:'#f59e0b', mostSold:'#ef4444', couponDetector:'#8b5cf6', banner:'#3b82f6' };
  var gradientMap = { flashSale:'linear-gradient(145deg, #ff416c 0%, #ff4b2b 100%)', halfPrice:'linear-gradient(145deg, #ec4899 0%, #be185d 100%)', offers:'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', featured:'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)', newArrival:'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', mostSold:'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)', couponDetector:'linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)', banner:'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)' };
  var icon = iconMap[sid] || 'fa-star';
  var col = colorMap[sid] || 'var(--accent)';
  var grad = gradientMap[sid] || 'linear-gradient(145deg, #ef4444, #dc2626)';
  var titleVal = ov.title || '';
  var introTitleVal = ov.introTitle || '';
  var introSubVal = ov.introSub || '';
  var previewId = 'preview_' + id;
  var lbl = labels[sid] || sid;

  // Build form fields
  var fieldsHtml = '<div class="pb-field"><label class="pb-field-label">عنوان القسم</label><input type="text" id="builtinTitle" value="' + titleVal.replace(/"/g,'&quot;') + '" oninput="updateBuiltinPreview(\'' + previewId + '\',\'title\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"></div>';
  if (info.hasIntro) {
    fieldsHtml += '<div class="pb-field" style="margin-top:10px"><label class="pb-field-label">عنوان البطاقة</label><input type="text" id="builtinIntroTitle" value="' + introTitleVal.replace(/"/g,'&quot;') + '" oninput="updateBuiltinPreview(\'' + previewId + '\',\'introTitle\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"><div style="font-size:.7rem;color:var(--text-muted);margin-top:4px">النص الأساسي في البطاقة التعريفية</div></div>';
    fieldsHtml += '<div class="pb-field" style="margin-top:10px"><label class="pb-field-label">نص البطاقة الفرعي</label><textarea id="builtinIntroSub" rows="2" oninput="updateBuiltinPreview(\'' + previewId + '\',\'introSub\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;resize:vertical">' + introSubVal.replace(/"/g,'&quot;') + '</textarea></div>';
  }
  // Realistic intro card preview
  var introHtml = info.hasIntro ?
    '<div style="width:155px;flex-shrink:0;border-radius:16px;overflow:hidden;cursor:pointer;min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px 14px;gap:8px;color:#fff;background:' + grad + ';box-shadow:0 8px 24px rgba(239,68,68,.2)">' +
      '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.22);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,.15)"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div class="bi-preview-introTitle" style="font-size:1.05rem;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,.2)">' + (introTitleVal || lbl) + '</div>' +
      '<div class="bi-preview-introSub" style="font-size:.75rem;font-weight:600;opacity:.95;line-height:1.4">' + (introSubVal || 'نص توضيحي') + '</div>' +
      '<div style="margin-top:10px;font-size:.75rem;font-weight:800;background:rgba(255,255,255,.22);padding:6px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.45);backdrop-filter:blur(6px);box-shadow:0 4px 12px rgba(0,0,0,.1)">عرض الكل ›</div>' +
    '</div>' : '';

  // Modal container: two columns (form + preview)
  var modal = document.createElement('div');
  modal.id = id;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:28px;max-width:840px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
    '<h3 style="font-size:1.05rem;font-weight:800;margin:0"><i class="fa-solid ' + icon + '" style="color:' + col + '"></i> ' + lbl + '</h3>' +
    '<button onclick="this.closest(\'#' + id + '\').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;gap:20px;align-items:flex-start">' +
      // Left: preview
      '<div style="flex:1;min-width:0">' +
        '<div id="' + previewId + '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 16px;position:sticky;top:0">' +
          '<div style="font-size:.72rem;font-weight:700;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-eye"></i> معاينة حية</div>' +
          // Preview header (section header)
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
            '<h3 style="display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;color:var(--text);margin:0"><i class="fa-solid ' + icon + '" style="color:' + col + ';font-size:1.15rem;animation:flashPulse 2s infinite"></i> <span class="bi-preview-title">' + (titleVal || lbl) + '</span></h3>' +
            '<div style="display:flex;align-items:center;gap:6px">' +
              '<span style="display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#fff5f5,#fef2f2);color:#991b1b;padding:3px 8px;border-radius:999px;font-weight:800;font-size:.8rem;border:1px solid #fecaca;box-shadow:0 2px 6px rgba(239,68,68,.08)"><i class="fa-regular fa-clock" style="font-size:.7rem"></i> <span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span><span style="color:#ef4444;font-weight:900;font-size:.82rem;animation:timerBlink 1s infinite">:</span><span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span><span style="color:#ef4444;font-weight:900;font-size:.82rem;animation:timerBlink 1s infinite">:</span><span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span></span>' +
              '<span style="display:inline-flex;align-items:center;gap:5px"><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--text);display:inline-flex;align-items:center;justify-content:center;font-size:.75rem;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.05)"><i class="fa-solid fa-chevron-right"></i></button><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--text);display:inline-flex;align-items:center;justify-content:center;font-size:.75rem;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.05)"><i class="fa-solid fa-chevron-left"></i></button></span>' +
              '<button style="border:none;background:none;color:var(--accent);font-weight:800;font-size:.82rem;cursor:pointer;padding:4px">عرض الكل ›</button>' +
            '</div>' +
          '</div>' +
          // Products scroll area with intro card
          '<div style="display:flex;gap:12px;overflow:hidden">' +
            introHtml +
            // Fake product cards
            '<div style="width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--card)">' +
              '<div style="height:120px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem"><i class="fa-solid fa-box"></i></div>' +
              '<div style="padding:10px"><div style="height:10px;background:#f1f5f9;border-radius:4px;width:80%;margin-bottom:6px"></div><div style="height:10px;background:#f1f5f9;border-radius:4px;width:50%"></div></div>' +
            '</div>' +
            '<div style="width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--card)">' +
              '<div style="height:120px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem"><i class="fa-solid fa-box"></i></div>' +
              '<div style="padding:10px"><div style="height:10px;background:#f1f5f9;border-radius:4px;width:70%;margin-bottom:6px"></div><div style="height:10px;background:#f1f5f9;border-radius:4px;width:60%"></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Right: form fields
      '<div style="width:340px;flex-shrink:0">' +
        fieldsHtml +
        '<div style="display:flex;gap:10px;margin-top:20px">' +
        '<button onclick="adminSaveBuiltinSection(\'' + sid + '\',\'' + id + '\')" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.88rem"><i class="fa-solid fa-check"></i> حفظ</button>' +
        '<button onclick="document.getElementById(\'' + id + '\').remove()" style="padding:12px 24px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.85rem">إلغاء</button></div>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function updateBuiltinPreview(previewId, field, value) {
  var preview = document.getElementById(previewId);
  if (!preview) return;
  if (field === 'title') {
    var el = preview.querySelector('.bi-preview-title');
    if (el) el.textContent = value || '';
  } else if (field === 'introTitle') {
    var el = preview.querySelector('.bi-preview-introTitle');
    if (el) el.textContent = value || 'عنوان البطاقة';
  } else if (field === 'introSub') {
    var el = preview.querySelector('.bi-preview-introSub');
    if (el) el.innerHTML = value || 'نص توضيحي';
  }
}

function adminSaveBuiltinSection(sid, modalId) {
  var title = document.getElementById('builtinTitle');
  var introTitle = document.getElementById('builtinIntroTitle');
  var introSub = document.getElementById('builtinIntroSub');
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var ov = overrides[sid] || {};
  if (title) ov.title = title.value || '';
  if (introTitle) ov.introTitle = introTitle.value || '';
  if (introSub) ov.introSub = introSub.value || '';
  overrides[sid] = ov;
  mkt.sectionOverrides = overrides;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  document.getElementById(modalId).remove();
  adminMarkSaved();
  showToast('✅ تم تحديث ' + (sid === 'flashSale' ? 'تخفيضات سريعة' : sid === 'halfPrice' ? 'نصف السعر' : sid), 'success');
  if (typeof applySectionOverrides === 'function') applySectionOverrides();
}

function applySectionOverrides() {
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var sectionIds = { flashSale:'flashSaleSection', halfPrice:'halfPriceSection', offers:'offersSection', featured:'featuredSection', newArrival:'newArrivalSection', mostSold:'mostSoldSection', couponDetector:'couponDetectorWidget', banner:'bannerSlider' };
  Object.keys(overrides).forEach(function(sid) {
    var ov = overrides[sid];
    if (!ov) return;
    var el = document.getElementById(sectionIds[sid]);
    if (!el) return;
    if (ov.title) {
      var titleEl = el.querySelector('h3') || el.querySelector('.flash-section-header h3');
      if (titleEl) {
        // Preserve icons inside h3
        var icon = titleEl.querySelector('i');
        if (icon) { titleEl.textContent = ov.title; titleEl.prepend(icon); }
        else titleEl.textContent = ov.title;
      } else {
        // Try any span that looks like a title
        var sp = el.querySelector('[class*="title"]') || el.querySelector('.hp-intro-title');
        if (sp) sp.textContent = ov.title;
      }
    }
    if (ov.introTitle) {
      var introEl = el.querySelector('.hp-intro-title');
      if (introEl) introEl.textContent = ov.introTitle;
    }
    if (ov.introSub) {
      var subEl = el.querySelector('.hp-intro-sub');
      if (subEl) subEl.innerHTML = ov.introSub;
    }
  });
}

var _joinEditIdx = -1;
var _joinCodeEditIdx = -1;
var _joinTraderViewIdx = -1;
var _traderOrdersPage = 1;
const TRADER_ORDERS_PER_PAGE = 10;

function adminRenderJoinRequests() {
  const container = document.getElementById('admin-joinrequests');
  if (!container) return;
  let reqs = [];
  try { reqs = JSON.parse(localStorage.getItem('mycart_join_requests') || '[]'); } catch(e) {}
  reqs = reqs.slice().reverse();
  if (!reqs.length) {
    container.innerHTML = '<div class="admin-card" style="padding:40px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-user-plus" style="font-size:2rem;opacity:.3;display:block;margin-bottom:12px"></i> لا توجد طلبات انضمام بعد.<br><small style="font-size:.75rem">ستظهر هنا طلبات "أرسل طلب انضمام" التي يرسلها الزوار.</small></div>';
    updateAdminJoinBadge();
    return;
  }
  const jrTotalPages = Math.ceil(reqs.length / ITEMS_PER_PAGE);
  if (quickAdminJoinRequestsPage > jrTotalPages) quickAdminJoinRequestsPage = jrTotalPages || 1;
  const jrStart = (quickAdminJoinRequestsPage - 1) * ITEMS_PER_PAGE;
  const pageReqs = reqs.slice(jrStart, jrStart + ITEMS_PER_PAGE);
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px"><h3 style="margin:0;font-size:.95rem;font-weight:800"><i class="fa-solid fa-users"></i> طلبات انضمام التجار</h3></div>';
  pageReqs.forEach(function(r, i) {
    var d = r.date ? new Date(r.date) : null;
    var dateStr = d && !isNaN(d) ? d.toLocaleString('ar') : '';
    var codeHtml = '';
    if (r.status === 'approved') {
      if (_joinCodeEditIdx === i) {
        codeHtml = '<div style="margin-top:10px;padding:12px;background:rgba(245,158,11,.06);border:1px dashed rgba(245,158,11,.4);border-radius:10px">' +
          '<div style="font-size:.75rem;font-weight:800;margin-bottom:8px"><i class="fa-solid fa-pen"></i> تعديل كود الدخول</div>' +
          '<div class="admin-form-group"><label>كود الدخول</label>' +
          '<div style="display:flex;gap:8px"><input type="text" id="editJoinCodeVal" maxlength="8" value="' + escHtml(r.code || '') + '" style="flex:1;direction:ltr;text-align:center;letter-spacing:3px;font-weight:900">' +
          '<button onclick="adminGenJoinCodeValue()" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(16,185,129,.12);color:#10b981;cursor:pointer;font-family:inherit;font-size:.75rem;font-weight:700">توليد</button></div></div>' +
          '<div class="admin-form-group"><label>كلمة كشف الكود</label>' +
          '<div style="display:flex;gap:8px"><input type="text" id="editJoinRevealVal" value="' + escHtml(r.reveal || '') + '" style="flex:1;direction:ltr;text-align:center;font-weight:800">' +
          '<button onclick="adminGenJoinRevealValue()" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(245,158,11,.12);color:#f59e0b;cursor:pointer;font-family:inherit;font-size:.75rem;font-weight:700">توليد</button></div></div>' +
          '<div style="display:flex;gap:8px;margin-top:4px"><button onclick="adminSaveJoinCode(' + i + ')" style="flex:1;padding:9px;border:none;border-radius:8px;background:#10b981;color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>' +
          '<button onclick="adminCancelJoinCodeEdit()" style="flex:1;padding:9px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem">إلغاء</button></div>' +
          '</div>';
      } else {
        codeHtml = '<div style="margin-top:10px;padding:8px 12px;background:rgba(16,185,129,.08);border:1px dashed rgba(16,185,129,.4);border-radius:10px;display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap">' +
          '<span style="font-size:.72rem;font-weight:700;color:var(--text-muted)">كود دخول التاجر:</span>' +
          '<span style="direction:ltr;font-weight:900;font-size:1rem;color:#10b981;letter-spacing:3px">' + (r.code || '—') + '</span>' +
          '<span style="font-size:.68rem;font-weight:700;color:var(--text-muted)">كلمة كشف الكود:</span>' +
          '<span style="direction:ltr;font-weight:900;font-size:.85rem;color:#f59e0b">' + (r.reveal || '—') + '</span>' +
          '<button onclick="adminCopyJoinCode(' + i + ')" style="padding:6px 12px;border:none;border-radius:8px;background:#10b981;color:#fff;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-copy"></i> نسخ</button>' +
          '<button onclick="adminEditJoinCode(' + i + ')" style="padding:6px 12px;border:none;border-radius:8px;background:rgba(245,158,11,.12);color:#f59e0b;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-pen"></i> تعديل الكود</button>' +
          '</div>';
      }
    }
    var statusPill = r.suspended
      ? '<span style="background:rgba(239,68,68,.15);color:#ef4444;padding:3px 10px;border-radius:999px;font-size:.7rem;font-weight:700"><i class="fa-solid fa-pause"></i> موقوف مؤقتًا</span>'
      : (r.status === 'approved'
      ? '<span style="background:rgba(16,185,129,.15);color:#10b981;padding:3px 10px;border-radius:999px;font-size:.7rem;font-weight:700"><i class="fa-solid fa-check"></i> مفعّل أسعار الجملة</span>'
      : '<span style="background:rgba(245,158,11,.15);color:#f59e0b;padding:3px 10px;border-radius:999px;font-size:.7rem;font-weight:700">⏳ منتظر الموافقة</span>');
    html += '<div class="admin-card" style="margin-bottom:10px;padding:14px 16px">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="width:38px;height:38px;border-radius:50%;background:rgba(16,185,129,.12);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0"><i class="fa-solid fa-user"></i></span>' +
      '<div style="flex:1;min-width:150px"><div style="font-weight:800;font-size:.85rem">' + (r.name || '') + '</div>' +
      '<div style="font-size:.72rem;color:var(--text-muted)">' + (r.city || '') + (r.addr ? ' — ' + r.addr : '') + '</div>' +
      (r.note ? '<div style="font-size:.7rem;color:var(--text-muted);margin-top:4px">📝 ' + r.note + '</div>' : '') + '</div>' +
      '<div style="text-align:left"><a href="tel:' + (r.phone || '') + '" style="font-size:.82rem;font-weight:700;color:#10b981;text-decoration:none;direction:ltr;display:inline-block"><i class="fa-solid fa-phone"></i> ' + (r.phone || '') + '</a>' +
      (dateStr ? '<div style="font-size:.65rem;color:var(--text-muted);margin-top:2px">' + dateStr + '</div>' : '') + '</div>' + statusPill + '</div>' + codeHtml;
    if (_joinEditIdx === i) {
      html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">' +
        '<div class="admin-form-group"><label>الاسم الكامل</label><input type="text" id="editJoinName" value="' + escHtml(r.name || '') + '"></div>' +
        '<div class="admin-form-group"><label>رقم الهاتف</label><input type="tel" id="editJoinPhone" value="' + escHtml(r.phone || '') + '"></div>' +
        '<div class="admin-form-group"><label>المدينة</label><input type="text" id="editJoinCity" value="' + escHtml(r.city || '') + '"></div>' +
        '<div class="admin-form-group"><label>العنوان</label><input type="text" id="editJoinAddr" value="' + escHtml(r.addr || '') + '"></div>' +
        '<div class="admin-form-group"><label>ملاحظة</label><textarea id="editJoinNote" rows="2" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;resize:none;box-sizing:border-box;background:var(--card);color:var(--text)">' + escHtml(r.note || '') + '</textarea></div>' +
        '<div style="display:flex;gap:8px;margin-top:4px"><button onclick="adminSaveJoinRequest(' + i + ')" style="flex:1;padding:9px;border:none;border-radius:8px;background:#10b981;color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>' +
        '<button onclick="adminCancelEditJoinRequest()" style="flex:1;padding:9px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem">إلغاء</button></div>' +
        '</div>';
    }
    html += '<div style="display:flex;gap:6px;margin-top:10px">' +
      '<button onclick="adminShowTraderOrders(' + i + ')" style="padding:7px 12px;border:none;border-radius:8px;background:rgba(139,92,246,.12);color:#8b5cf6;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-bag-shopping"></i> سجل الطلبات</button>' +
      '<button onclick="adminEditJoinRequest(' + i + ')" style="padding:7px 12px;border:none;border-radius:8px;background:rgba(59,130,246,.12);color:#3b82f6;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-pen"></i> تعديل</button>' +
      (r.status === 'approved'
        ? '<span style="padding:7px 12px;border-radius:8px;background:rgba(16,185,129,.12);color:#10b981;font-size:.72rem;font-weight:700"><i class="fa-solid fa-circle-check"></i> مفعّل</span>'
        : '<button onclick="adminApproveJoinRequest(' + i + ')" style="padding:7px 12px;border:none;border-radius:8px;background:rgba(16,185,129,.15);color:#10b981;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-circle-check"></i> اعتماد وتفعيل أسعار الجملة</button>') +
      '<button onclick="adminToggleSuspend(' + i + ')" style="padding:7px 12px;border:none;border-radius:8px;background:' + (r.suspended ? 'rgba(16,185,129,.15)' : '#fef3c7') + ';color:' + (r.suspended ? '#10b981' : '#92400e') + ';cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid ' + (r.suspended ? 'fa-play' : 'fa-pause') + '"></i> ' + (r.suspended ? 'إعادة تفعيل' : 'إيقاف مؤقت') + '</button>' +
      '<button onclick="adminDeleteJoinRequest(' + i + ')" style="padding:7px 10px;border:none;border-radius:8px;background:#fef2f2;color:#ef4444;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700"><i class="fa-solid fa-trash-can"></i></button>' +
      '</div></div>';
  });
  container.innerHTML = html + buildPaginationHtml(quickAdminJoinRequestsPage, jrTotalPages, reqs.length, 'setQuickAdminJoinRequestsPage');
  updateAdminJoinBadge();
}

function setQuickAdminJoinRequestsPage(p) {
  quickAdminJoinRequestsPage = p;
  adminRenderJoinRequests();
  document.getElementById('admin-joinrequests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function adminShowTraderOrders(idx) {
  _traderOrdersPage = 1;
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  _joinTraderViewIdx = idx;
  const r = reqs[real];
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const phoneKey = (r.phone || '').replace(/\D/g, '');
  const nameKey = (r.name || '').trim().toLowerCase();
  const orders = allOrders.map(function(o, oi) {
    if (o.wholesale !== true && o.isWholesale !== true) return null;
    const op = (o.customer && o.customer.phone ? String(o.customer.phone).replace(/\D/g, '') : '');
    const on = (o.customer && o.customer.name ? String(o.customer.name).trim().toLowerCase() : '');
    if (phoneKey && op && op === phoneKey) { o._realIdx = oi; return o; }
    if (nameKey && on && on === nameKey) { o._realIdx = oi; return o; }
    return null;
  }).filter(Boolean);
  const totalSpent = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
  const joinedDate = r.date ? new Date(r.date) : null;
  const container = document.getElementById('admin-joinrequests');
  let ordersHtml;
  if (!orders.length) {
    ordersHtml = '<div class="admin-empty" style="padding:30px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-receipt" style="font-size:1.8rem;opacity:.3;display:block;margin-bottom:10px"></i> لا توجد طلبات جملة لهذا التاجر حتى الآن</div>';
  } else {
    const traderTotalPages = Math.ceil(orders.length / TRADER_ORDERS_PER_PAGE);
    if (_traderOrdersPage > traderTotalPages) _traderOrdersPage = traderTotalPages || 1;
    const traderStart = (_traderOrdersPage - 1) * TRADER_ORDERS_PER_PAGE;
    const pageOrders = orders.slice(traderStart, traderStart + TRADER_ORDERS_PER_PAGE);
    ordersHtml = pageOrders.map(function(o, oi) {
      const st = o._status === 'done' ? 'completed' : (o._status || 'pending');
      const info = QUICK_ORDER_STATUSES[st] || QUICK_ORDER_STATUSES.pending;
      return '<div class="admin-card" style="margin-bottom:8px;padding:12px 14px;cursor:pointer" onclick="adminShowOrderDetail(' + o._realIdx + ')">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<span style="font-weight:800;font-size:.8rem;color:#8b5cf6">#' + String(o.id).slice(-6) + '</span>' +
        '<span style="font-size:.66rem;color:var(--text-muted)">' + (o.date || '') + '</span>' +
        '<span style="font-size:.6rem;background:rgba(245,158,11,.15);color:#f59e0b;padding:2px 8px;border-radius:999px;font-weight:800">جملة</span>' +
        '<span style="flex:1"></span>' +
        '<span style="font-weight:800;font-size:.82rem">' + CURRENCY + (o.total ? o.total.toFixed(2) : '0.00') + '</span>' +
        '<span style="font-size:.62rem;padding:3px 9px;border-radius:999px;background:' + info.bg + ';color:' + info.text + ';font-weight:800">' + info.label + '</span>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;font-size:.66rem;font-weight:700;color:#8b5cf6;padding:5px 10px;border-radius:8px;background:rgba(139,92,246,.1)">تفاصيل الطلب <i class="fa-solid fa-arrow-left"></i></span>' +
        '</div></div>';
    }).join('') + buildPaginationHtml(_traderOrdersPage, traderTotalPages, orders.length, 'setTraderOrdersPage');
  }
  container.innerHTML =
    '<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
    '<button onclick="adminRenderJoinRequests()" style="padding:7px 14px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);cursor:pointer;font-family:inherit;font-size:.75rem;font-weight:700"><i class="fa-solid fa-arrow-right"></i> رجوع لطلبات الانضمام</button>' +
    (orders.length ? '<span style="display:inline-flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px 8px"><i class="fa-solid fa-calendar-days" style="color:#8b5cf6"></i><input type="date" id="stFrom" value="" style="border:none;background:transparent;font-family:inherit;font-size:.72rem;color:var(--text);outline:none" title="من تاريخ"><span style="color:var(--text-muted);font-size:.8rem">إلى</span><input type="date" id="stTo" value="" style="border:none;background:transparent;font-family:inherit;font-size:.72rem;color:var(--text);outline:none" title="إلى تاريخ"></span><button onclick="printTraderStatement(' + real + ',document.getElementById(\'stFrom\').value,document.getElementById(\'stTo\').value)" style="padding:7px 14px;border:none;border-radius:8px;background:#059669;color:#fff;cursor:pointer;font-family:inherit;font-size:.75rem;font-weight:800"><i class="fa-solid fa-print"></i> طباعة كشف حساب</button>' : '') +
    '</div>' +
    '<div class="admin-card" style="padding:16px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<span style="width:46px;height:46px;border-radius:50%;background:rgba(139,92,246,.12);color:#8b5cf6;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0"><i class="fa-solid fa-user-tie"></i></span>' +
    '<div style="flex:1;min-width:160px"><div style="font-weight:900;font-size:.95rem">' + escHtml(r.name || '') + '</div>' +
    '<div style="font-size:.72rem;color:var(--text-muted)">' + escHtml((r.city || '') + (r.addr ? ' — ' + r.addr : '')) + '</div>' +
    (joinedDate ? '<div style="font-size:.66rem;color:var(--text-muted);margin-top:3px">انضم: ' + joinedDate.toLocaleString('ar') + '</div>' : '') +
    '</div>' +
    '<div style="text-align:left"><a href="tel:' + (r.phone || '') + '" style="font-size:.85rem;font-weight:800;color:#10b981;text-decoration:none;direction:ltr;display:inline-block"><i class="fa-solid fa-phone"></i> ' + escHtml(r.phone || '') + '</a>' +
    '<div style="font-size:.68rem;color:var(--text-muted);margin-top:3px">كود الدخول: <span style="direction:ltr;font-weight:800;color:#10b981;letter-spacing:2px">' + (r.code || '—') + '</span>' +
    (r.reveal ? ' • الكشف: <span style="direction:ltr;font-weight:800;color:#f59e0b">' + escHtml(r.reveal) + '</span>' : '') + '</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
    '<div class="admin-stat" style="flex:1;min-width:120px"><i class="fa-solid fa-receipt"></i><div><span>' + orders.length + '</span><p>طلبات الجملة</p></div></div>' +
    '<div class="admin-stat" style="flex:1;min-width:120px"><i class="fa-solid fa-money-bill"></i><div><span>' + CURRENCY + totalSpent.toFixed(2) + '</span><p>إجمالي المشتريات</p></div></div>' +
    '</div></div>' +
    '<div class="admin-section-title">سجل طلبات التاجر</div>' +
    ordersHtml;
  container.scrollIntoView({ block: 'start' });
}

function setTraderOrdersPage(p) {
  _traderOrdersPage = p;
  if (_joinTraderViewIdx >= 0) adminShowTraderOrders(_joinTraderViewIdx);
  document.getElementById('admin-joinrequests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function printTraderStatement(real, fromD, toD) {
  const reqs = getAdminJoinRequests();
  const idx = real;
  if (real < 0 || real >= reqs.length) return;
  const r = reqs[real];
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const phoneKey = (r.phone || '').replace(/\D/g, '');
  const nameKey = (r.name || '').trim().toLowerCase();
  let orders = allOrders.map(function(o, oi) {
    if (o.wholesale !== true && o.isWholesale !== true) return null;
    const op = (o.customer && o.customer.phone ? String(o.customer.phone).replace(/\D/g, '') : '');
    const on = (o.customer && o.customer.name ? String(o.customer.name).trim().toLowerCase() : '');
    if (phoneKey && op && op === phoneKey) return o;
    if (nameKey && on && on === nameKey) return o;
    return null;
  }).filter(Boolean);

  function toD2(v){ try { return new Date(String(v).replace(/-/g,'/')).getTime(); } catch(err){ return 0; } }
  if (fromD) { const fv = toD2(fromD); orders = orders.filter(function(o){ return toD2(o.date) >= fv; }); }
  if (toD) { const tv = toD2(toD); orders = orders.filter(function(o){ return toD2(o.date) <= tv; }); }

  const totalSpent = orders.reduce(function(s, o) { return s + (o.total || 0); }, 0);
const summary = {};
  orders.forEach(function(o) { (o.items || []).forEach(function(it) {
    const key = it.name + (it.variant ? ' | ' + it.variant : '');
    if (!summary[key]) summary[key] = { qty: 0, image: it.image || '' };
    summary[key].qty += it.qty || 0;
    if (!summary[key].image && it.image) summary[key].image = it.image;
  }); });
  let itemRows = '';
  Object.keys(summary).forEach(function(k) {
    const s = summary[k];
    itemRows += '<tr><td style="padding:5px 10px;border:1px solid #e2e8f0"><div style="display:flex;align-items:center;gap:10px"><img src="' + (s.image || '') + '" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;background:#f1f5f9" onerror="this.style.display=\'none\'"><span>' + String(k) + '</span></div></td>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center">' + s.qty + '</td></tr>';
  });
  if (!itemRows) itemRows = '<tr><td colspan="2" style="padding:16px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8">لا توجد طلبات في هذه الفترة</td></tr>';
  let orderRows = '';
  orders.forEach(function(o) {
    const st = o._status === 'done' ? 'completed' : (o._status || 'pending');
    const info = QUICK_ORDER_STATUSES[st] || QUICK_ORDER_STATUSES.pending;
    orderRows += '<tr>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:#8b5cf6">#' + String(o.id).slice(-6) + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0">' + escHtml(o.date || '') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center">' + (o.items ? o.items.length : 0) + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-weight:800">' + CURRENCY + (o.total ? o.total.toFixed(2) : '0.00') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center"><span style="background:' + info.bg + ';color:' + info.text + ';padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700">' + info.label + '</span></td>' +
      '</tr>';
  });
  if (!orderRows) orderRows = '<tr><td colspan="5" style="padding:16px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8">لا توجد طلبات</td></tr>';
  const storeName = (adminSettings && adminSettings.storeName) || '';
  const logo = (adminSettings && adminSettings.logo) || localStorage.getItem('mycart_logo') || '';
  const rangeTxt = (fromD && toD) ? ('من ' + fromD + ' إلى ' + toD) : (fromD ? ('من ' + fromD) : (toD ? ('حتى ' + toD) : 'الكامل'));
  const win = window.open('', '_blank');
  win.document.write(
    '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب التاجر</title>' +
    '<style>' +
    '@page{margin:10mm}' +
    '*{box-sizing:border-box}' +
    'body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;margin:0;padding:20px}' +
    '.head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:14px}' +
    '.head img{width:64px;height:64px;object-fit:contain;border-radius:10px;background:#fff}' +
    '.head .t{flex:1;min-width:0}.head h1{font-size:20px;margin:0}.head .sub{color:#64748b;font-size:12px;margin-top:3px}' +
    '.badge{background:#059669;color:#fff;padding:6px 14px;border-radius:999px;font-weight:800;font-size:12px;white-space:nowrap}' +
    '.range{display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:4px}' +
    '.cards{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0 6px}.card{flex:1;min-width:110px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;text-align:center}' +
    '.card .v{font-size:20px;font-weight:900}.card .l{font-size:11px;color:#64748b;margin-top:2px}.money{color:#059669}' +
    '.cust{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-top:12px;font-size:12px;display:flex;flex-wrap:wrap;gap:6px 26px}.cust b{font-size:13px}.dtl{direction:ltr;display:inline-block}' +
    '.sum{font-size:14px;font-weight:900;margin:16px 0 8px}' +
    '.tbl{width:100%;border-collapse:collapse;font-size:12px}.tbl th{background:#f1f5f9;padding:8px 10px;border:1px solid #e2e8f0;text-align:right}.tbl td{padding:7px 10px;border:1px solid #e2e8f0}' +
    '.btnprint{background:#0f172a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;float:left;margin-bottom:10px}' +
    '.foot{text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;border-top:1px dashed #e2e8f0;padding-top:10px}' +
    '@media print{.btnprint{display:none}body{padding:0}}' +
    '</style></head><body>' +
    '<button class="btnprint" onclick="window.print()"><i class="fa-solid fa-print"></i> طباعة</button>' +
    '<div class="head">' +
    '<img src="' + (logo ? logo : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#10b981"/><text x="32" y="42" font-size="34" text-anchor="middle" fill="#fff" font-weight="bold">' + (storeName ? storeName.charAt(0) : 'F') + '</text></svg>')) + '">' +
    '<div class="t"><h1>' + escHtml(storeName || '') + '</h1><div class="sub">كشف حساب التاجر — ' + escHtml(r.name || '') + '</div></div>' +
    '<span class="badge"><i class="fa-solid fa-receipt"></i> كشف حساب</span>' +
    '</div>' +
    '<span class="range"><i class="fa-solid fa-calendar-days"></i> الفترة: ' + escHtml(rangeTxt) + '</span>' +
    '<div class="cards">' +
    '<div class="card"><div class="v">' + orders.length + '</div><div class="l">عدد الطلبات</div></div>' +
    '<div class="card"><div class="v">' + Object.keys(summary).length + '</div><div class="l">عدد الأصناف</div></div>' +
    '<div class="card"><div class="v money">' + CURRENCY + totalSpent.toFixed(2) + '</div><div class="l">إجمالي المشتريات</div></div>' +
    '</div>' +
    '<div class="cust">' +
    '<div>التاجر: <b>' + escHtml(r.name || '') + '</b></div>' +
    '<div>الهاتف: <b class="dtl">' + escHtml(r.phone || '') + '</b></div>' +
    '<div>المدينة: <b>' + escHtml(r.city || '—') + '</b></div>' +
    '<div>تاريخ الطباعة: <b>' + new Date().toLocaleString('ar') + '</b></div>' +
    '</div>' +
    '<div class="sum"><i class="fa-solid fa-box-open"></i> ملخص الأصناف</div>' +
    '<table class="tbl"><thead><tr><th>الصنف</th><th style="text-align:center">الكمية الإجمالية</th></tr></thead><tbody>' + itemRows + '</tbody></table>' +
    '<div class="sum"><i class="fa-solid fa-receipt"></i> سجل الطلبات</div>' +
    '<table class="tbl"><thead><tr><th>#</th><th>التاريخ</th><th style="text-align:center">المنتجات</th><th style="text-align:center">الإجمالي</th><th style="text-align:center">الحالة</th></tr></thead><tbody>' + orderRows + '</tbody></table>' +
    '<div class="foot">صدر عن لوحة التحكم — FAST7 ' + escHtml(storeName || '') + ' • نهاية الكشف</div>' +
    '</body></html>'
  );
  win.document.close();
  win.focus();
}

function toggleTraderOrderItems(i) {
  const el = document.getElementById('traderOrderItems' + i);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getAdminJoinRequests() {
  try { return JSON.parse(localStorage.getItem('mycart_join_requests') || '[]'); } catch(e) { return []; }
}

function saveAdminJoinRequests(reqs) {
  try { localStorage.setItem('mycart_join_requests', JSON.stringify(reqs)); } catch(e) {}
}

function updateAdminJoinBadge() {
  const badge = document.getElementById('adminJoinBadge');
  if (!badge) return;
  const reqs = getAdminJoinRequests();
  const n = reqs.filter(function(r) { return r.status !== 'approved'; }).length;
  if (n > 0) { badge.style.display = 'inline-block'; badge.textContent = n; }
  else { badge.style.display = 'none'; }
}

function adminEditJoinRequest(idx) { _joinCodeEditIdx = -1; _joinEditIdx = idx; adminRenderJoinRequests(); }

function adminCancelEditJoinRequest() { _joinEditIdx = -1; adminRenderJoinRequests(); }

function adminSaveJoinRequest(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  const name = document.getElementById('editJoinName').value.trim();
  const phone = document.getElementById('editJoinPhone').value.trim();
  const city = document.getElementById('editJoinCity').value.trim();
  const addr = document.getElementById('editJoinAddr').value.trim();
  const note = document.getElementById('editJoinNote').value.trim();
  if (!name || !phone || !city) { showToast('الاسم والهاتف والمدينة مطلوبة', 'error'); return; }
  reqs[real].name = name;
  reqs[real].phone = phone;
  reqs[real].city = city;
  reqs[real].addr = addr;
  reqs[real].note = note;
  saveAdminJoinRequests(reqs);
  _joinEditIdx = -1;
  adminRenderJoinRequests();
  adminMarkSaved();
  showToast('تم حفظ التعديلات', 'success');
}

function adminApproveJoinRequest(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  reqs[real].status = 'approved';
  reqs[real].approvedAt = new Date().toISOString();
  if (!reqs[real].code) reqs[real].code = genTraderCode();
  if (!reqs[real].reveal) reqs[real].reveal = genTraderReveal();
  saveAdminJoinRequests(reqs);
  _joinEditIdx = -1;
  updateAdminJoinBadge();
  adminRenderJoinRequests();
  showToast('تم اعتماد الطلب وتفعيل أسعار الجملة', 'success');
}

function adminToggleSuspend(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  const wasSuspended = !!reqs[real].suspended;
  reqs[real].suspended = !wasSuspended;
  saveAdminJoinRequests(reqs);
  if (reqs[real].suspended) {
    reqs[real].suspendedAt = new Date().toISOString();
  } else {
    delete reqs[real].suspendedAt;
  }
  saveAdminJoinRequests(reqs);
  adminRenderJoinRequests();
  showToast(reqs[real].suspended ? 'تم إيقاف التاجر مؤقتًا' : 'تم إعادة تفعيل التاجر', 'success');
}

function genTraderCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function genTraderReveal() {
  var words = ['شمعة','بستان','مفتاح','نجمة','قمر','زهرة','صقر','بحر','نخلة','مصباح','سيف','عنب','كرمة','قلعة'];
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 90 + 10);
}

function adminCopyJoinCode(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length || !reqs[real].code) return;
  try {
    navigator.clipboard.writeText(reqs[real].code);
    showToast('تم نسخ كود الدخول: ' + reqs[real].code, 'success');
  } catch(e) { showToast('كود الدخول: ' + reqs[real].code, 'info'); }
}

function adminEditJoinCode(idx) {
  _joinEditIdx = -1;
  _joinCodeEditIdx = idx;
  adminRenderJoinRequests();
}

function adminCancelJoinCodeEdit() {
  _joinCodeEditIdx = -1;
  adminRenderJoinRequests();
}

function adminGenJoinCodeValue() {
  const input = document.getElementById('editJoinCodeVal');
  if (!input) return;
  input.value = genTraderCode();
}

function adminGenJoinRevealValue() {
  const input = document.getElementById('editJoinRevealVal');
  if (!input) return;
  input.value = genTraderReveal();
}

function adminSaveJoinCode(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  const codeInput = document.getElementById('editJoinCodeVal');
  const revealInput = document.getElementById('editJoinRevealVal');
  if (!codeInput || !revealInput) return;
  const code = codeInput.value.trim().toUpperCase();
  if (!code) { showToast('اكتب كود الدخول', 'error'); return; }
  reqs[real].code = code;
  reqs[real].reveal = revealInput.value.trim();
  saveAdminJoinRequests(reqs);
  _joinCodeEditIdx = -1;
  adminRenderJoinRequests();
  adminMarkSaved();
  showToast('تم حفظ كود الدخول وكلمة الكشف', 'success');
}

function adminDeleteJoinRequest(idx) {
  const reqs = getAdminJoinRequests();
  const real = reqs.length - 1 - idx;
  if (real < 0 || real >= reqs.length) return;
  reqs.splice(real, 1);
  saveAdminJoinRequests(reqs);
  adminRenderJoinRequests();
}

function adminClearJoinRequests() {
  showConfirmModal('هل أنت متأكد من مسح جميع طلبات الانضمام؟', function() {
    saveAdminJoinRequests([]);
    adminRenderJoinRequests();
    showToast('تم مسح جميع الطلبات', 'info');
  });
}

function adminRefreshPageBuilder() {
  var container = document.getElementById('admin-marketing');
  if (!container) return;
  var data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  data.customSections = window._pbCustomSections || [];
  var newHtml = adminRenderPageBuilder(data);
  var saveBtn = container.querySelector('button[onclick*="adminSaveMarketing"]');
  if (saveBtn) {
    container.innerHTML = newHtml + '\n<button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing(\'pagebuilder\')" style="margin-top:16px;display:none"><i class="fa-solid fa-floppy-disk"></i> حفظ التسويق</button>';
  } else {
    container.innerHTML = newHtml;
  }
  adminInitPageBuilder();
}

function adminInitPageBuilder() {
  var list = document.getElementById('pbSectionList');
  if (!list) return;
  var items = list.querySelectorAll('.pb-section-item');
  var dragEl = null;

  items.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      dragEl = this;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (dragEl && dragEl !== this) {
        var children = Array.from(list.children);
        var fromIdx = children.indexOf(dragEl);
        var toIdx = children.indexOf(this);
        if (fromIdx < toIdx) {
          list.insertBefore(dragEl, this.nextSibling);
        } else {
          list.insertBefore(dragEl, this);
        }
      }
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      dragEl = null;
    });
  });

  // Hook section toggles
  var toggles = list.querySelectorAll('.pb-section-toggle');
  toggles.forEach(function(toggle) {
    toggle.addEventListener('change', function() {
      var isChecked = this.checked;
      var showKey = this.dataset.showkey;
      var label = this.nextElementSibling;
      if (label) {
        label.textContent = isChecked ? 'مفعل' : 'معطل';
      }
      var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
      if (!mkt[showKey]) mkt[showKey] = {};
      mkt[showKey].show = isChecked;
      try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
    });
  });
}

function adminSavePageBuilder() {
  var list = document.getElementById('pbSectionList');
  if (!list) return;
  var items = list.querySelectorAll('.pb-section-item');
  var order = Array.from(items).map(function(item) { return item.dataset.id; });
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  mkt.sectionOrder = order;
  mkt.customSections = window._pbCustomSections || [];
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
  var status = document.getElementById('pbStatus');
  if (status) { status.textContent = '✓ تم حفظ تخطيط الصفحة الرئيسية بنجاح'; status.style.display = 'block'; status.style.color = '#22c55e'; setTimeout(function() { status.style.display = 'none'; }, 3000); }
  adminMarkSaved();
  showToast('✅ تم حفظ تخطيط الصفحة الرئيسية', 'success');
}




// --- FAST7 ADMIN OPTION IMAGE CHOOSER MODAL ---
function showOptImgChooser(imgEl) {
  // Get all images currently in the product form
  const prodImgs = typeof adminGetImages === 'function' ? adminGetImages().filter(src => src && !src.includes('placehold.co')) : [];
  
  // Create chooser overlay
  const overlay = document.createElement('div');
  overlay.id = 'optImgChooserModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;direction:rtl;text-align:right;';
  
  let thumbsHtml = '';
  if (prodImgs.length) {
    thumbsHtml = `<div style="font-size:0.75rem;font-weight:700;margin-bottom:8px;color:var(--text,#1e293b);">أو اختر من صور المنتج الحالية:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;max-height:180px;overflow-y:auto;padding:2px;width:100%;box-sizing:border-box;">
        ${prodImgs.map(src => `<img src="${src}" onclick="selectChooserImg('${src}')" style="width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;cursor:pointer;transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='none'">`).join('')}
      </div>`;
  } else {
    thumbsHtml = `<div style="font-size:0.75rem;color:#94a3b8;margin-bottom:16px;text-align:center;">لم يتم رفع أي صور للمنتج بعد.</div>`;
  }
  
  overlay.innerHTML = `
    <div style="background:var(--card,#fff);width:100%;max-width:380px;padding:20px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.15);margin:16px;font-family:inherit;box-sizing:border-box;">
      <h3 style="margin:0 0 16px;font-size:0.9rem;font-weight:800;color:var(--text,#1e293b);">تحديد صورة الخيار</h3>
      
      <button type="button" onclick="triggerChooserUpload()" style="width:100%;padding:12px;border:none;background:var(--accent,#ef4444);color:#fff;font-weight:800;font-size:0.85rem;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;box-shadow:0 4px 10px rgba(239,68,68,0.15);font-family:inherit;">
        <i class="fa-solid fa-upload"></i> رفع صورة جديدة من جهازك
      </button>
      
      ${thumbsHtml}
      
      <button type="button" onclick="closeChooser()" style="width:100%;padding:10px;border:1px solid var(--border,#e2e8f0);background:var(--bg,#f8fafc);color:var(--text-muted,#64748b);font-weight:700;font-size:0.8rem;border-radius:10px;cursor:pointer;font-family:inherit;">إلغاء</button>
    </div>
  `;
  
  // Handlers
  window.selectChooserImg = function(src) {
    imgEl.src = src;
    closeChooser();
  };
  
  window.triggerChooserUpload = function() {
    imgEl.nextElementSibling.click();
    closeChooser();
  };
  
  window.closeChooser = function() {
    overlay.remove();
  };
  
  document.body.appendChild(overlay);
}
