const ADMIN_PASSWORD = 'admin123';
const LS_PRODUCTS = 'mycart_admin_products';
const LS_SETTINGS = 'mycart_admin_settings';
const LS_CATEGORIES = 'mycart_categories';

function showToast(msg, type) {
  var el = document.getElementById('toast') || (function(){
    var d = document.createElement('div');
    d.id = 'toast';
    d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:12px;font-size:.85rem;font-weight:700;z-index:99999;transition:all .3s;opacity:0;pointer-events:none;white-space:nowrap';
    document.body.appendChild(d);
    return d;
  })();
  if (type === 'error') el.style.background = '#ef4444';
  else if (type === 'success') el.style.background = '#10b981';
  else el.style.background = '#333';
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.bottom = '20px';
  clearTimeout(el._to);
  el._to = setTimeout(function(){ el.style.opacity = '0'; el.style.bottom = '60px'; }, 2500);
}
function copyText(txt, label) {
  navigator.clipboard.writeText(txt).then(() => {
    alert(`✓ تم نسخ ${label}`);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); alert(`✓ تم نسخ ${label}`); } catch(e) {}
    document.body.removeChild(ta);
  });
}

if (typeof products === 'undefined' || !Array.isArray(products)) { products = loadProducts(); }

// ===== AUTH =====
function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  const stored = localStorage.getItem('mycart_admin_pass');
  if (pass === (stored || ADMIN_PASSWORD)) {
    try { localStorage.setItem('mycart_admin_logged', 'true'); } catch(e) {}
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(function() { document.getElementById('loginError').style.display = 'none'; }, 3000);
  }
}

function adminLogout() { try { localStorage.setItem('mycart_admin_logged', 'false'); } catch(e) {} location.reload(); }
function topbarLogout() { try { localStorage.setItem('mycart_admin_logged', 'false'); } catch(e) {} location.reload(); }

function toggleMobileMenu() {
  var sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
}

// ===== SAVE PRODUCT (admin.html form) =====
function saveProduct(e) {
  e.preventDefault();
  var name = document.getElementById('pName').value.trim();
  var price = parseFloat(document.getElementById('pPrice').value);
  if (!name || !price) { alert('الرجاء إدخال اسم وسعر المنتج'); return; }
  var note = document.getElementById('pNote').value.trim();
  var features = document.getElementById('pFeatures').value.split("\n").map(function(s){return s.trim();}).filter(Boolean);
  var specsRaw = document.getElementById('pSpecs').value.split("\n").map(function(s){return s.trim();}).filter(Boolean);
  var specs = specsRaw.map(function(s) {
    var i = s.indexOf(' : '); if (i > 0) return [s.slice(0,i).trim(), s.slice(i+3).trim()];
    var j = s.indexOf(':'); if (j > 0) return [s.slice(0,j).trim(), s.slice(j+1).trim()];
    return [s, ''];
  });
  var categories = [].slice.call(document.querySelectorAll('.pCatCb:checked')).map(function(cb){return cb.value;});
  var options = [].slice.call(document.querySelectorAll('#pOptions .option-card')).map(function(card){
    var name = card.querySelector('.optName').value.trim();
    if (!name) return null;
    var type = card.querySelector('.optType').value;
    var values = [].slice.call(card.querySelectorAll('.opt-value')).map(function(el){return {
      value: el.querySelector('.optV').value.trim(),
      price: parseFloat(el.querySelector('.optPrice').value) || 0,
      stock: parseInt(el.querySelector('.optStock').value) || 0,
      extra: type==='color' ? (el.querySelector('.optExtra')||{}).value || '#000000' : type==='image' ? (el.querySelector('.optExtra')||{}).src || '' : ''
    }}).filter(function(x){return x.value;});
    return values.length ? {name:name, type:type, values:values} : null;
  }).filter(Boolean);
  var existingDate = editingId !== null ? (products[editingId].createdAt || products[editingId].dateAdded) : null;
  var imgs = getProductImagesFromUI().filter(function(img){return !img.includes('placehold.co');});
  var product = {
    id: editingId !== null ? products[editingId].id : Date.now(),
    name: name, price: price,
    oldPrice: parseFloat(document.getElementById('pOldPrice').value) || 0,
    categories: categories.length ? categories : ['عام'],
    images: imgs.length ? imgs : ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'],
    brand: getSelectedBrand(),
    featured: document.getElementById('pFeatured').checked,
    badge: document.getElementById('pBadge').value.trim(),
    note: note,
    video: getVideoUrls(),
    features: features, specs: specs,
    options: options.length ? options : undefined,
    createdAt: existingDate || new Date().toLocaleDateString('ar-EG')
  };
  if (editingId !== null) products[editingId] = product;
  else products.push(product);
  saveProductsToLS();
  resetForm();
  renderProductsList();
  updateStats();
  saveProductSuccess(product);
}

function saveProductSuccess(product) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--card,#ffffff);border-radius:16px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:24px;text-align:center;font-family:inherit';
  box.innerHTML = `
    <div style="width:60px;height:60px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.8rem;color:#10b981">
      <i class="fa-solid fa-circle-check"></i>
    </div>
    <h3 style="margin:0 0 8px;font-size:1.1rem;font-weight:800;color:var(--text)">تم حفظ المنتج بنجاح!</h3>
    <p style="margin:0 0 20px;font-size:0.85rem;color:var(--text-muted)">يمكنك الآن معاينة المنتج مباشرة في المتجر أو الاستمرار في لوحة التحكم.</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <a href="index.html#product/${product.id}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;background:var(--accent);color:#fff;border-radius:10px;font-weight:700;font-size:0.85rem;text-decoration:none">
        <i class="fa-solid fa-eye"></i> معاينة المنتج في المتجر
      </a>
      <button id="btnGoToProducts" style="padding:10px;background:none;border:1.5px solid var(--border);color:var(--text);border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit">
        الذهاب لقائمة المنتجات
      </button>
      <button id="btnDismissModal" style="padding:10px;background:none;border:none;color:var(--text-muted);font-size:0.8rem;cursor:pointer;font-family:inherit">
        إغلاق
      </button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelector('#btnGoToProducts').onclick = function() {
    overlay.remove();
    location.hash = '#products';
  };
  box.querySelector('#btnDismissModal').onclick = function() {
    overlay.remove();
  };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

function editProduct(idx) {
  const p = products[idx];
  if (!p) return;
  editingId = idx;
  
  // Fill text fields
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pFeatured').checked = !!p.featured;
  document.getElementById('pNote').value = p.note || '';
  
  // Features (array to lines)
  document.getElementById('pFeatures').value = (p.features || []).join('\n');
  
  // Specs (array of [name, val] to lines of "name : val")
  document.getElementById('pSpecs').value = (p.specs || []).map(s => s.join(' : ')).join('\n');
  
  // Brand
  populateBrandOptions(p.brand);
  
  // Categories checkboxes
  renderCategoryCheckboxes();
  
  // Images list
  renderAdminImageList(p.images || []);
  
  // Video URLs list
  const videoList = document.getElementById('pVideoList');
  if (videoList) {
    videoList.innerHTML = '';
    (p.video || []).forEach(url => {
      videoList.appendChild(createVideoCard(url));
    });
  }
  
  // Options
  const optionsContainer = document.getElementById('pOptions');
  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    (p.options || []).forEach(opt => {
      addOption(opt);
    });
  }
  
  // Change submit button text
  document.getElementById('submitBtn').textContent = 'تعديل المنتج';
  
  // Navigate to add product tab
  location.hash = '#addProduct';
}

function resetForm() {
  editingId = null;
  document.getElementById('productForm').reset();
  document.getElementById('pVideoList').innerHTML = '';
  document.getElementById('editId').value = '';
  document.getElementById('pImageList').innerHTML = '';
  document.getElementById('pOptions').innerHTML = '';
  document.getElementById('pNote').value = '';
  document.getElementById('submitBtn').textContent = 'حفظ المنتج';
  renderCategoryCheckboxes();
}

function getSelectedBrand() {
  var active = document.querySelector('#pBrandList .cat-check-label[style*="var(--accent)"]');
  return active ? active.textContent.trim() : '';
}

// ===== SAVE SETTINGS =====
function saveSettings() {
  settings.storeName = document.getElementById('setStoreName').value.trim() || 'متجري';
  var taglineEl = document.getElementById('setStoreTagline');
  if (taglineEl) settings.tagline = taglineEl.value.trim();
  var modeEl = document.getElementById('setHeaderDisplayMode');
  if (modeEl) settings.logoDisplayMode = modeEl.value;
  settings.wholesaleCode = document.getElementById('setWholesaleCode').value.trim() || 'ADMIN123';
  settings.currency = document.getElementById('setCurrency').value.trim() || '₪';
  var color = document.getElementById('setAccent').value;
  settings.accentColor = color;
  
  // Preserve logo and header bg in settings
  const logo = localStorage.getItem('mycart_logo');
  if (logo) settings.logo = logo;
  else delete settings.logo;
  
  const headerBg = localStorage.getItem('mycart_header_bg');
  if (headerBg) settings.headerBg = headerBg;
  else delete settings.headerBg;

  applyAccentColor(color);
  saveSettingsToLS();
  alert('✓ تم حفظ الإعدادات');
}

// ===== SAVE MARKETING =====
function saveMarketing() {
  var data = {};
  try { data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}'); } catch(e) {}
  var mktEls = ['mktSeoTitle','mktSeoDesc','mktSeoKeywords','mktSocialFb','mktSocialIg','mktSocialX','mktSocialTt','mktSocialWa',
    'mktAnnounceText','mktWaChatGreeting','mktFbPixel','mktTtPixel','mktGaPixel'];
  mktEls.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) data[id.replace('mkt','').charAt(0).toLowerCase() + id.replace('mkt','').slice(1)] = el.value;
  });
  var boolEls = ['mktSocialShareShow','mktVolDiscShow','mktFbtShow','mktFreeShippingShow','mktWaNotifShow','mktAnnounceShow',
    'mktCountdownShow','mktLiveViewersShow','mktWaChatShow','mktSocialProofShow','mktWaCheckoutShow','mktReviewsShow','mktSpinWinShow'];
  boolEls.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) data[id.replace('mkt','').charAt(0).toLowerCase() + id.replace('mkt','').slice(1)] = el.checked;
  });
  // Section visibility toggles from offers tab
  ['mktFeaturedShow','mktNewArrivalShow','mktHalfPriceShow','mktFlashSaleShow','mktMostSoldShow'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      var key = (id === 'mktFlashSaleShow' ? 'flashSales' : id.replace('mkt','').charAt(0).toLowerCase() + id.replace('mkt','').slice(1).replace('Show',''));
      if (!data[key]) data[key] = {};
      data[key].show = el.checked;
    }
  });
  // Promo popup (nested object)
  data.promoPopup = {
    show: document.getElementById('mktPromoPopupShow')?.checked || false,
    type: document.getElementById('mktPpType')?.value || 'discount',
    title: document.getElementById('mktPpTitle')?.value.trim() || '',
    text: document.getElementById('mktPpText')?.value.trim() || '',
    code: document.getElementById('mktPpCode')?.value.trim().toUpperCase() || '',
    discountPercent: parseInt(document.getElementById('mktPpPercent')?.value) || 0,
    image: document.getElementById('mktPpImage')?.value.trim() || '',
    btnText: document.getElementById('mktPpBtnText')?.value.trim() || '',
    btnLink: document.getElementById('mktPpBtnLink')?.value.trim() || '',
    bgColor: document.getElementById('mktPpBg')?.value || '#ffffff',
    textColor: document.getElementById('mktPpTextColor')?.value || '#0f172a',
    accentColor: document.getElementById('mktPpAccent')?.value || '#ef4444',
    btnBg: document.getElementById('mktPpBtnBg')?.value || '#ef4444',
    btnColor: document.getElementById('mktPpBtnColor')?.value || '#ffffff',
    delay: parseInt(document.getElementById('mktPpDelay')?.value) || 3,
    size: document.getElementById('mktPpSize')?.value || 'medium',
    position: document.getElementById('mktPpPos')?.value || 'center',
    animation: document.getElementById('mktPpAnim')?.value || 'bounce',
    expiresAt: (function(){ var el = document.getElementById('mktPpExpires'); return el?.value ? new Date(el.value).getTime() : 0; })(),
    showClose: document.getElementById('mktPpShowClose')?.checked !== false,
    closeOutside: document.getElementById('mktPpCloseOutside')?.checked !== false,
    customHtml: document.getElementById('mktPpCustomHtml')?.value || '',
    customIcon: document.getElementById('mktPpCustomIcon')?.value.trim() || ''
  };
  // Section ordering
  var orderEl = document.getElementById('mktSectionOrder');
  if (orderEl) {
    try {
      var order = JSON.parse(orderEl.value || '[]');
      data.sectionOrder = order;
    } catch(e) {}
  }
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  showToast('✓ تم حفظ الإعدادات التسويقية', 'success');
}

// ===== EXPORT / IMPORT =====
function exportAllData() {
  var data = { products: products, settings: settings, categories: categories, orders: orders };
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  showToast('تم تصدير البيانات', 'success');
}

function importAllData(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (data.products) { products = data.products; saveProductsToLS(); }
      if (data.settings) { try { localStorage.setItem('mycart_admin_settings', JSON.stringify(data.settings)); } catch(e) {} }
      if (data.orders) { try { localStorage.setItem('mycart_orders', JSON.stringify(data.orders)); } catch(e) {} }
      adminRefreshAll();
      showToast('✓ تم استيراد البيانات بنجاح', 'success');
    } catch(ex) { alert('حدث خطأ في الملف'); }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (!confirm('هل أنت تأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا!')) return;
  products = [];
  saveProductsToLS();
  localStorage.removeItem('mycart_admin_settings');
  localStorage.removeItem('mycart_categories');
  localStorage.removeItem('mycart_orders');
  alert('تم إعادة تعيين البيانات');
  adminRefreshAll();
}

function toggleMktSubMenu(e, forceOpen = false) {
  if (e) e.stopPropagation();
  const sub = document.getElementById('mktSubMenu');
  const chev = document.getElementById('mktChevron');
  if (!sub) return;
  const isOpen = sub.style.display === 'flex';
  if (isOpen && !forceOpen) {
    sub.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  } else {
    sub.style.display = 'flex';
    if (chev) chev.style.transform = 'rotate(180deg)';
  }
}

function switchTab(hash) {
  // Split hash into main tab and sub-tab
  const parts = hash.split('/');
  const tab = parts[0];
  const subTab = parts[1];

  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });

  // Remove active class from all sidebar buttons
  document.querySelectorAll('#sidebar nav button').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show the active tab
  const activeTab = document.getElementById('tab-' + tab);
  if (activeTab) {
    activeTab.classList.add('active');
    if (tab === 'coupons') { renderAdminCoupons(); updateCouponBadge(); }
  } else if (tab === 'coupons') {
    // إعادة بناء تبويب الكوبونات إذا لم يكن موجوداً (safety fallback)
    const app = document.getElementById('app') || document.querySelector('.app-main') || document.body;
    const wrap = document.createElement('div');
    wrap.className = 'tab-content active';
    wrap.id = 'tab-coupons';
    wrap.innerHTML = `
      <div class="section-header">
        <h3><i class="fa-solid fa-ticket" style="color:#f59e0b"></i> إدارة أكواد الخصم والكوبونات</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary" onclick="exportCoupons()"><i class="fa-solid fa-file-export"></i> تصدير</button>
          <button class="btn-secondary" onclick="document.getElementById('importCouponsFile').click()"><i class="fa-solid fa-file-import"></i> استيراد</button>
          <input type="file" id="importCouponsFile" accept=".json" style="display:none" onchange="importCoupons(event)">
          <button class="btn-primary" onclick="openCouponForm()"><i class="fa-solid fa-plus"></i> كوبون جديد</button>
        </div>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:20px">
        <div class="stat-card"><i class="fa-solid fa-ticket" style="color:#f59e0b"></i><div><span id="statCouponsTotal">0</span><p>إجمالي الكوبونات</p></div></div>
        <div class="stat-card"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i><div><span id="statCouponsActive">0</span><p>النشطة</p></div></div>
        <div class="stat-card"><i class="fa-solid fa-clock" style="color:#ef4444"></i><div><span id="statCouponsExpired">0</span><p>منتهية الصلاحية</p></div></div>
        <div class="stat-card"><i class="fa-solid fa-coins" style="color:#3b82f6"></i><div><span id="statCouponsUsed">0</span><p>مجموع الاستخدامات</p></div></div>
      </div>
      <div class="card" style="margin-bottom:20px;padding:14px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;align-items:end">
          <div class="form-group" style="margin:0"><label style="font-size:.8rem;font-weight:700;margin-bottom:4px;display:block"><i class="fa-solid fa-search"></i> بحث</label>
            <input type="text" id="couponSearch" placeholder="بحث بالكود أو الوصف..." oninput="renderAdminCoupons()" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;width:100%"></div>
          <div class="form-group" style="margin:0"><label style="font-size:.8rem;font-weight:700;margin-bottom:4px;display:block"><i class="fa-solid fa-filter"></i> الحالة</label>
            <select id="couponStatusFilter" onchange="renderAdminCoupons()" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;width:100%;background:var(--card);color:var(--text)">
              <option value="">جميع الحالات</option><option value="active">نشط</option><option value="expired">منتهي</option><option value="exhausted">مستنفذ</option><option value="not_started">لم يبدأ</option><option value="inactive">متوقف</option></select></div>
          <div class="form-group" style="margin:0"><label style="font-size:.8rem;font-weight:700;margin-bottom:4px;display:block"><i class="fa-solid fa-layer-group"></i> النوع</label>
            <select id="couponTypeFilter" onchange="renderAdminCoupons()" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;width:100%;background:var(--card);color:var(--text)">
              <option value="">الكل</option><option value="percent">نسبة مئوية %</option><option value="fixed">قيمة ثابتة</option><option value="freeship">شحن مجاني</option></select></div>
          <div class="form-group" style="margin:0"><label style="font-size:.8rem;font-weight:700;margin-bottom:4px;display:block"><i class="fa-solid fa-sort"></i> ترتيب حسب</label>
            <select id="couponSortBy" onchange="renderAdminCoupons()" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;width:100%;background:var(--card);color:var(--text)">
              <option value="createdAt">الأحدث إنشاءً</option><option value="endDate">الأقرب انتهاءً</option><option value="uses">الأكثر استخداماً</option><option value="value">الأعلى قيمة</option><option value="code">الكود (أ-ي)</option></select></div>
          <button class="btn-secondary" onclick="clearCouponFilters()" style="padding:8px 14px;font-size:.85rem"><i class="fa-solid fa-rotate-left"></i> مسح الفلاتر</button>
        </div>
      </div>
      <div id="adminCouponsList" style="display:flex;flex-direction:column;gap:12px"></div>`;
    // نضيفه داخل app-main إذا وجدنا التبويبات هناك
    const tabsHost = document.querySelector('.app-main') || document.querySelector('#app > .app-main') || document.querySelector('#app main') || app;
    tabsHost.appendChild(wrap);
    // نضع الـ Modal إذا لم يكن موجوداً
    if (!document.getElementById('couponFormModal')) {
      const modal = document.createElement('div');
      modal.id = 'couponFormModal';
      modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;align-items:center;justify-content:center;padding:16px';
      modal.innerHTML = `<div id="couponFormCard" style="background:var(--card);border-radius:18px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;border:1px solid var(--border);box-shadow:0 25px 50px rgba(0,0,0,.25)">
        <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem"><i class="fa-solid fa-ticket"></i></div>
          <h3 id="couponFormTitle" style="margin:0;flex:1;font-size:1.05rem">كوبون خصم جديد</h3>
          <button onclick="closeCouponForm()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);padding:4px 8px"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="padding:20px">
          <form id="couponForm" onsubmit="submitCouponForm(event)"><input type="hidden" id="cpnId">
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
              <div class="form-group" style="grid-column:1/-1"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">كود الكوبون *</label>
                <div style="display:flex;gap:6px"><input type="text" id="cpnCode" required placeholder="SAVE20" style="flex:1;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;text-transform:uppercase;letter-spacing:.5px"><button type="button" onclick="generateCouponCode()" class="btn-secondary" style="padding:10px 14px;font-size:.85rem"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد</button></div></div>
              <div class="form-group"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">نوع الخصم *</label>
                <select id="cpnType" onchange="toggleCpnValueField()" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;background:var(--card);color:var(--text)">
                  <option value="percent">نسبة مئوية %</option><option value="fixed">قيمة ثابتة</option><option value="freeship">شحن مجاني</option></select></div>
              <div class="form-group" id="cpnValueGroup"><label id="cpnValueLabel" style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">قيمة الخصم (%) *</label><input type="number" id="cpnValue" min="1" max="100" step="0.01" placeholder="20" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group" id="cpnMaxDiscountGroup"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">حد أقصى للخصم</label><input type="number" id="cpnMaxDiscount" min="0" step="0.5" placeholder="0 = بدون حد" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">الحد الأدنى للطلب</label><input type="number" id="cpnMinOrder" min="0" step="0.5" placeholder="0" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group" style="grid-column:1/-1"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">وصف الكوبون</label><input type="text" id="cpnDescription" placeholder="وصف اختياري" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group" style="background:rgba(59,130,246,.05);padding:12px;border-radius:10px;border:1px dashed rgba(59,130,246,.3)"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block;color:#1d4ed8"><i class="fa-solid fa-calendar-plus"></i> تاريخ بدء السريان</label><input type="datetime-local" id="cpnStartDate" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem"></div>
              <div class="form-group" style="background:rgba(239,68,68,.05);padding:12px;border-radius:10px;border:1px dashed rgba(239,68,68,.3)"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block;color:#b91c1c"><i class="fa-solid fa-hourglass-half"></i> تاريخ الانتهاء</label><input type="datetime-local" id="cpnEndDate" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" onclick="setCouponEndDate(1)" class="btn-secondary" style="padding:5px 10px;font-size:.72rem">24 ساعة</button><button type="button" onclick="setCouponEndDate(3)" class="btn-secondary" style="padding:5px 10px;font-size:.72rem">3 أيام</button><button type="button" onclick="setCouponEndDate(7)" class="btn-secondary" style="padding:5px 10px;font-size:.72rem">أسبوع</button><button type="button" onclick="setCouponEndDate(30)" class="btn-secondary" style="padding:5px 10px;font-size:.72rem">شهر</button></div></div>
              <div class="form-group"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">حد الاستخدام الإجمالي</label><input type="number" id="cpnLimit" min="0" placeholder="0 = غير محدود" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group"><label style="font-size:.85rem;font-weight:700;margin-bottom:5px;display:block">حد الاستخدام لكل مستخدم</label><input type="number" id="cpnPerUserLimit" min="0" placeholder="0 = غير محدود" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem"></div>
              <div class="form-group" style="grid-column:1/-1"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:.9rem;margin-top:4px"><input type="checkbox" id="cpnIsActive" checked style="width:18px;height:18px"> تفعيل الكوبون فور الإنشاء</label></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap"><button type="submit" class="btn-primary" style="flex:1;min-width:160px;padding:12px;font-size:.95rem"><i class="fa-solid fa-floppy-disk"></i> حفظ الكوبون</button><button type="button" class="btn-secondary" onclick="closeCouponForm()" style="padding:12px 18px;font-size:.95rem"><i class="fa-solid fa-xmark"></i> إلغاء</button></div>
          </form></div></div>`;
      document.body.appendChild(modal);
    }
    // إعادة رسم لضمان الظهور
    setTimeout(() => { renderAdminCoupons(); updateCouponBadge(); }, 50);
  }

  // Set active button
  const activeBtn = document.querySelector(`#sidebar nav button[data-tab="${tab}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Handle marketing tab and sub-tabs
  if (tab === 'marketing') {
    // Open the marketing submenu
    toggleMktSubMenu(null, true);
    
    // Hide all marketing sub-tab contents
    document.querySelectorAll('.mkt-subtab-content').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide the fallback "no panel" message
    const noPanel = document.getElementById('mktNoPanel');
    if (noPanel) noPanel.style.display = 'none';
    
    // Show the selected sub-tab content, default to 'seo'
    const targetSubTab = subTab || 'seo';
    const subTabContent = document.getElementById('mkt-sub-' + targetSubTab);
    if (subTabContent) {
      subTabContent.style.display = 'block';
    }
    
    // Highlight the active submenu button
    document.querySelectorAll('.submenu-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${targetSubTab}'`)) {
        btn.classList.add('active');
      }
    });
  } else {
    // Close marketing submenu if we're not on marketing tab
    const subMenu = document.getElementById('mktSubMenu');
    const chev = document.getElementById('mktChevron');
    if (subMenu) subMenu.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  }
  
  // Render marketing > offers subtab (Homepage Section Customization)
  if (tab === 'marketing' && targetSubTab === 'offers') {
    renderOffersAdmin();
  }

  // Render spin wheel management page
  if (tab === 'spinwheel') {
    renderSpinWheelAdmin();
  }

  // Render banners page
  if (tab === 'banners') {
    const container = document.getElementById('bannersFullPage');
    if (container) {
      const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
      container.innerHTML = `
        <div class="settings-grid">
          <div class="card"><h4><i class="fa-solid fa-images"></i> إدارة البانرات الإعلانية</h4>
            <p style="font-size:.8rem;color:var(--text-muted)">يمكنك إدارة البانرات من لوحة التحكم السريعة في صفحة المتجر.</p>
            <div id="bannersListAdminSaved">
              ${(data.banners||[]).map(b => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;${b.active===false?'opacity:.5':''}">
                  <img src="${b.image||''}" style="width:60px;height:40px;border-radius:6px;object-fit:cover">
                  <div style="flex:1"><strong>${b.title||'بانر'}</strong><br><span style="font-size:.7rem;color:var(--text-muted)">${b.link||'بدون رابط'}</span></div>
                  <span style="font-size:.65rem;color:${b.active!==false?'#22c55e':'#94a3b8'}">${b.active!==false?'نشط':'متوقف'}</span>
                </div>`).join('')||'<p style="color:var(--text-muted);font-size:.8rem">لا توجد بانرات</p>'}
            </div>
          </div>
        </div>`;
    }
  }

  // Update the page title
  const titles = {
    dashboard: 'الإحصائيات',
    orders: 'الطلبات',
    products: 'المنتجات',
    categories: 'التصنيفات',
    addProduct: 'إضافة منتج',
    settings: 'الإعدادات',
    banners: 'البانرات الإعلانية',
    coupons: 'إدارة أكواد الخصم',
    appearance: 'المظهر والتخطيط',
    spinwheel: 'عجلة الحظ',
    marketing: 'التسويق',
    subscription: 'الاشتراك'
  };
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) {
    pageTitleEl.textContent = titles[tab] || '���� ������';
  }
}

function handleHashChange() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  switchTab(hash);
}

function initAdmin() {
  populateSettings();
  if (localStorage.getItem('mycart_admin_logged') === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  }
  updateStats();
  renderSalesChart();
  renderProductsList();
  renderCategoriesList();
  renderZones();
  renderOrders();
  renderRecentOrders();
  updateCouponBadge();
  var hash = location.hash.replace('#','') || 'dashboard';
  switchTab(hash);
  
  window.addEventListener('hashchange', handleHashChange);
}

document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('mycart_admin_logged') === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initAdmin();
  }
});
function loadSettings() {
  const stored = localStorage.getItem(LS_SETTINGS);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return { storeName: '???', tagline: '???? ??? ??????', wholesaleCode: 'ADMIN123', currency: '?', accentColor: '#ef4444' };
}
if (typeof settings === 'undefined') var settings = loadSettings();
if (typeof categories === 'undefined') var categories = loadCategories();
let editingId = null;
let _mktSwitching = false;

function loadCategories() {
  const stored = localStorage.getItem(LS_CATEGORIES);
  if (stored) {
    try {
      let cats = JSON.parse(stored);
      let changed = false;
      cats.forEach(c => {
        if (!c.createdAt) {
          c.createdAt = new Date().toLocaleDateString('ar-EG');
          changed = true;
        }
      });
      if (changed) {
        try { localStorage.setItem(LS_CATEGORIES, JSON.stringify(cats)); } catch(e) {}
      }
      return cats;
    } catch(e) {}
  }
  return [];
}

function saveCategoriesToLS() {
  try { localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories)); } catch(e) { alert('?? ����� ������� ������'); return; }
  try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
}

function variantSwatchHtml(vd) {
  if (!vd || !vd.attrs) return '';
  return vd.attrs.map(a => {
    if (a.t === 'color') return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${a.c||'#ccc'};border:1px solid var(--border);vertical-align:middle;margin:0 1px" title="${a.n}: ${a.v}"></span>`;
    if (a.t === 'image' && a.i) return `<img src="${a.i}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid var(--border);vertical-align:middle;margin:0 1px" title="${a.n}: ${a.v}">`;
    return '';
  }).join('');
}

function renderCategoryCheckboxes() {
  const container = document.getElementById('pCatList');
  if (!container) return;
  if (!categories.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:.8rem;padding:4px 0">�� ���� �������. ��� ������� �����.</div>';
    return;
  }
  const prodCats = editingId !== null && products[editingId] ? getProductCats(products[editingId]) : [];
  container.innerHTML = categories.map(c =>
    `<label class="cat-check-label"><input type="checkbox" class="pCatCb" value="${c.name}" ${prodCats.includes(c.name) ? 'checked' : ''}> ${c.name}</label>`
  ).join('');
}

function filterCatCheckboxes() {
  const q = (document.getElementById('pCatSearch').value || '').trim().toLowerCase();
  document.querySelectorAll('#pCatList .cat-check-label').forEach(lbl => {
    lbl.style.display = q && !lbl.textContent.trim().toLowerCase().includes(q) ? 'none' : '';
  });
}

function addOption(data) {
  const container = document.getElementById('pOptions');
  const div = document.createElement('div');
  div.className = 'option-card';
  const d = data || {};
  div.innerHTML = `<div class="option-header">
    <input type="text" class="optName" placeholder="��� ������" value="${d.name||''}">
    <select class="optType" onchange="optTypeChange(this)">
      <option value="text" ${d.type==='text'?'selected':''}>?? ��</option>
      <option value="color" ${d.type==='color'?'selected':''}>?? ���</option>
      <option value="image" ${d.type==='image'?'selected':''}>??? ����</option>
    </select>
    <button type="button" onclick="removeOption(this)"><i class="fa-solid fa-trash-can"></i></button>
  </div>
  <div class="optValues">
    <div class="opt-label-row"><span class="lbl-choice">��������</span><span class="lbl-price">�����+</span><span class="lbl-extra"></span><span class="lbl-stock">�������</span><span class="lbl-spacer"></span></div>
    ${(d.values||[]).map(v => `
    <div class="opt-value">
      <input type="text" class="optV" placeholder="������" value="${v.value}">
      <label>+<input type="number" class="optPrice" step="0.01" value="${v.price||0}"></label>
      ${d.type==='color'?`<input type="color" class="optExtra" value="${v.extra||'#000000'}">`:d.type==='image'?`<img class="optExtra" src="${v.extra||''}" onclick="this.nextElementSibling.click()"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="">`}
      <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value="${v.stock||''}"></label>
      <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('')}
    <button type="button" class="add-opt-val" onclick="addOptValue(this)"><i class="fa-solid fa-plus"></i> ����� ������</button>
  </div>`;
  container.appendChild(div);
}
function removeOption(btn) { btn.closest('.option-card').remove(); }
function addOptValue(btn) {
  const container = btn.closest('.optValues');
  const type = container.closest('.option-card').querySelector('.optType').value;
  const div = document.createElement('div');
  div.className = 'opt-value';
  div.innerHTML = `<input type="text" class="optV" placeholder="������">
    <label>+<input type="number" class="optPrice" step="0.01" value="0"></label>
    ${type==='color'?`<input type="color" class="optExtra" value="#000000">`:type==='image'?`<img class="optExtra" src="" onclick="this.nextElementSibling.click()"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="">`}
    <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value=""></label>
    <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  btn.before(div);
}
function optTypeChange(sel) {
  const card = sel.closest('.option-card');
  const type = sel.value;
  card.querySelectorAll('.opt-value').forEach(el => {
    const v = el.querySelector('.optV').value;
    const price = el.querySelector('.optPrice').value;
    const stock = el.querySelector('.optStock').value;
    const oldExtra = el.querySelector('.optExtra');
    const oldVal = oldExtra ? (oldExtra.type==='color'?oldExtra.value:oldExtra.src) : '';
    el.innerHTML = `<input type="text" class="optV" placeholder="������" value="${v}">
      <label>+<input type="number" class="optPrice" step="0.01" value="${price}"></label>
      ${type==='color'?`<input type="color" class="optExtra" value="${oldVal||'#000000'}">`:type==='image'?`<img class="optExtra" src="${oldVal||''}" onclick="this.nextElementSibling.click()"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="${oldVal}">`}
      <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value="${stock}"></label>
      <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  });
}
async function optImgUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  const img = input.parentElement.querySelector('.optExtra');
  if (img) img.src = url;
}
function pickVariantImgs(btn) {
  const row = btn.closest('.option-card');
  const available = getProductImagesFromUI();
  if (!available.length) { alert('?? �� ���� ��� ������. ���� ��� �����.'); return; }
  const current = (row.querySelector('.vImages').value ? row.querySelector('.vImages').value.split('|||') : []);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--card);border-radius:14px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto';
  box.innerHTML = `<h3 style="margin:0 0 12px;font-size:1rem">���� ����� �������</h3><div id="vPickerGrid" style="display:flex;flex-wrap:wrap;gap:8px">${available.map((img, i) => `<img src="${img}" data-idx="${i}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;cursor:pointer;border:3px solid ${current.includes(img) ? 'var(--accent)' : 'var(--border)'}">`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn-primary" id="vPickerConfirm">�����</button><button class="btn-secondary" id="vPickerCancel">�����</button></div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const grid = box.querySelector('#vPickerGrid');
  const selected = [...current];
  grid.querySelectorAll('img').forEach(img => {
    img.onclick = function() {
      const src = this.src;
      const idx = selected.indexOf(src);
      if (idx > -1) { selected.splice(idx, 1); this.style.borderColor = 'var(--border)'; }
      else { selected.push(src); this.style.borderColor = 'var(--accent)'; }
    };
  });
  box.querySelector('#vPickerConfirm').onclick = function() {
    row.querySelector('.vImages').value = selected.join('|||');
    const count = row.querySelector('.vImgCount');
    count.textContent = selected.length ? selected.length + ' �' : '';
    const thumbs = row.querySelector('.vImgThumbs');
    if (thumbs) thumbs.innerHTML = selected.slice(0,3).map(s => `<img src="${s}" style="width:18px;height:18px;border-radius:3px;object-fit:cover;border:1px solid var(--border)">`).join('');
    document.body.removeChild(overlay);
  };
  box.querySelector('#vPickerCancel').onclick = function() { document.body.removeChild(overlay); };
}

function populateBrandOptions(selectedBrand) {
  const container = document.getElementById('pBrandList');
  if (!container) return;
  try {
    const cats = JSON.parse(localStorage.getItem('mycart_categories') || '[]');
    const brandCats = cats.filter(c => c.isBrand);
    const selected = selectedBrand || '';
    container.innerHTML = '<label class="brand-pill" onclick="selectBrand(this,\'\')" style="cursor:pointer">بدون</label>' +
      brandCats.map(c => `<label class="brand-pill${selected === c.name ? ' selected' : ''}" onclick="selectBrand(this,'${c.name}')" style="cursor:pointer">${c.name}</label>`).join('');
    container.querySelectorAll('.brand-pill').forEach(l => {
      if (l.classList.contains('selected')) l._brandVal = l.textContent.trim() === 'بدون' ? '' : l.textContent.trim();
    });
  } catch(e) { container.innerHTML = ''; }
}

function selectBrand(el, name) {
  document.querySelectorAll('#pBrandList .brand-pill').forEach(l => { l.classList.remove('selected'); l._brandVal = undefined; });
  el.classList.add('selected');
  el._brandVal = name;
}

function getSelectedBrand() {
  const sel = document.querySelector('#pBrandList .cat-check-label[style*="var(--accent)"]');
  return sel ? (sel._brandVal !== undefined ? sel._brandVal : '') : '';
}

function filterBrandOptions() {
  const q = document.getElementById('pBrandSearch').value.trim().toLowerCase();
  document.querySelectorAll('#pBrandList .cat-check-label').forEach(l => {
    l.style.display = l.textContent.trim().toLowerCase().includes(q) ? '' : 'none';
  });
}

function getProductImages(p) {
  if (p.images && Array.isArray(p.images) && p.images.length) return p.images;
  if (p.image) return [p.image];
  return ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
}

function getProductDiscount(p) {
  const old = p.oldPrice || 0;
  const curr = p.price || 0;
  if (old > 0 && curr < old) return Math.round((old - curr) / old * 100);
  return p.discount || 0;
}

function getProductImagesFromUI() {
  const imgs = [];
  document.querySelectorAll('#pImageList img').forEach(img => imgs.push(img.src));
  return imgs;
}

function getVideoUrls() {
  const urls = [];
  document.querySelectorAll('#pVideoList > div').forEach(card => {
    const el = card.querySelector('div[title]');
    if (el) urls.push(el.getAttribute('title'));
  });
  return urls.length ? urls : undefined;
}

function addVideoUrl() {
  const input = document.getElementById('pVideoUrl');
  const url = input.value.trim();
  if (!url) return;
  const list = document.getElementById('pVideoList');
  const item = createVideoCard(url);
  list.appendChild(item);
  input.value = '';
  input.focus();
}

function createVideoCard(url) {
  const platform = getVideoPlatform(url);
  const embed = getVideoEmbedUrlForAdmin(url);
  const card = document.createElement('div');
  card.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);margin-bottom:6px';
  card.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:.6rem;color:var(--text-muted);background:#f1f5f9;padding:1px 8px;border-radius:999px;font-weight:700">' + platform + '</span>' +
      '<div style="flex:1;font-size:.75rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:left" title="' + url + '">' + url + '</div>' +
      '<button type="button" onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:2px;font-size:.85rem;flex-shrink:0"><i class="fa-solid fa-xmark"></i></button>' +
    '</div>' +
    (embed ? '<div style="width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden"><iframe src="' + embed + '" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div>' :
      '<div style="text-align:center;padding:20px;background:#f8fafc;border-radius:8px"><p style="font-size:.8rem;color:#94a3b8">لا يمكن عرض هذا الفيديو مباشرة</p><a href="' + url + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:var(--accent);color:#fff;border-radius:8px;font-weight:700;font-size:.8rem;text-decoration:none;margin-top:4px"><i class="fa-solid fa-play"></i> فتح الرابط</a></div>');
  return card;
}

function getVideoThumb(url) {
  var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return 'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg';
  return '';
}

function getVideoPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/tiktok\.com/.test(url)) return 'TikTok';
  if (/instagram\.com/.test(url)) return 'Instagram';
  if (/facebook\.com|fb\.com/.test(url)) return 'Facebook';
  return 'رابط';
}

function previewVideo(url) {
  if (!url) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--card,#fff);border-radius:14px;padding:16px;max-width:700px;width:94%;position:relative';
  const embed = getVideoEmbedUrlForAdmin(url);
  box.innerHTML = '<button type="button" onclick="this.closest(\'div[style*=\\"fixed\\"]\').remove()" style="position:absolute;top:-12px;left:-12px;width:32px;height:32px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:1.1rem;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)"><i class="fa-solid fa-xmark"></i></button>' +
    (embed ? '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px"><iframe src="' + embed + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>' :
      '<div style="text-align:center;padding:30px 20px"><div style="font-size:2rem;margin-bottom:10px">🎬</div><p style="font-weight:700;margin-bottom:10px">لا يمكن عرض الفيديو مباشرة</p><a href="' + url + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:var(--accent,#ef4444);color:#fff;border-radius:10px;font-weight:700;text-decoration:none"><i class="fa-solid fa-play"></i> افتح الرابط</a></div>');
  overlay.appendChild(box);
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function getVideoEmbedUrlForAdmin(url) {
  if (!url) return '';
  var ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1] + '?modestbranding=1&rel=0';
  var ytShort = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return 'https://www.youtube.com/embed/' + ytShort[1] + '?modestbranding=1&rel=0';
  var ttMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (ttMatch) return 'https://www.tiktok.com/embed/' + ttMatch[1];
  var igMatch = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) return 'https://www.instagram.com/p/' + igMatch[1] + '/embed';
  var fbMatch = url.match(/facebook\.com\/[\w.-]+\/videos\/(\d+)/);
  if (fbMatch) return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=0';
  return '';
}

function renderAdminImageList(imgs) {
  const container = document.getElementById('pImageList');
  if (!container) return;
  if (!imgs || !imgs.length) {
    container.innerHTML = '<div style="font-size:.8rem;color:var(--text-muted)">�� ��� ����� ��� ���</div>';
    return;
  }
  let html = `<div style="margin-bottom:10px;position:relative">
    <img src="${imgs[0]}" style="width:100%;height:130px;border-radius:10px;object-fit:cover;border:3px solid var(--accent);display:block;background:var(--card)">
    <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
      <button type="button" onclick="adminRemoveImg(0)" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,0.9);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-trash-can"></i></button>
      <button type="button" onclick="adminMoveImg(0,1)" ${imgs.length === 1 ? 'disabled style="opacity:.3"' : ''} style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-left"></i></button>
    </div>
    <div style="position:absolute;bottom:8px;right:8px;background:var(--card);padding:3px 10px;border-radius:6px;font-size:.7rem;font-weight:600;color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.12)">? ������ ��������</div>
  </div>`;
  if (imgs.length > 1) {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    for (let i = 1; i < imgs.length; i++) {
      html += `<div style="position:relative;width:70px">
        <img src="${imgs[i]}" onclick="adminSetPrimaryImg(${i})" style="width:100%;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid var(--border);display:block">
        <div style="display:flex;gap:2px;margin-top:2px;justify-content:center">
          <button type="button" onclick="adminMoveImg(${i},-1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-right"></i></button>
          <button type="button" onclick="adminSetPrimaryImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit" title="����� �������"><i class="fa-solid fa-star"></i></button>
          <button type="button" onclick="adminMoveImg(${i},1)" ${i === imgs.length - 1 ? 'disabled style="opacity:.3"' : ''} style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" onclick="adminRemoveImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid #ef4444;background:#fef2f2;color:#ef4444;cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function adminSetPrimaryImg(idx) {
  const imgs = getProductImagesFromUI();
  if (idx < 0 || idx >= imgs.length || idx === 0) return;
  const item = imgs.splice(idx, 1)[0];
  imgs.unshift(item);
  renderAdminImageList(imgs);
}

function adminMoveImg(idx, dir) {
  const imgs = getProductImagesFromUI();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= imgs.length) return;
  [imgs[idx], imgs[newIdx]] = [imgs[newIdx], imgs[idx]];
  renderAdminImageList(imgs);
}

function adminRemoveImg(idx) {
  const imgs = getProductImagesFromUI();
  imgs.splice(idx, 1);
  renderAdminImageList(imgs);
}

function addImageByUrl() {
  const input = document.getElementById('pImageUrl');
  if (!input) return;
  const url = input.value.trim();
  if (!url) { alert('أدخل رابط الصورة أولاً'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { alert('الرابط غير صالح'); return; }
  const imgs = getProductImagesFromUI().filter(img => !img.includes('placehold.co'));
  imgs.push(url);
  renderAdminImageList(imgs);
  input.value = '';
  alert('✓ تم إضافة الصورة من الرابط');
}

function uploadProductImages() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
  input.onchange = async function(e) {
    const files = [...e.target.files];
    if (!files.length) return;
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length && files.length > 1) alert('تم تخطي بعض الصور الكبيرة (الحد 5MB)');
    if (!valid.length) return;
    const currentImgs = getProductImagesFromUI();
    showToast('🔄 جاري رفع الصور إلى ImgBB...', 'info');
    for (const file of valid) {
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
      const url = await uploadToImgbb(dataUrl);
      if (!url) continue;
      currentImgs.push(url);
    }
    renderAdminImageList(currentImgs);
  };
  input.click();
}

let editingCatIdx = null;

function cancelEditCategory() {
  editingCatIdx = null;
  document.getElementById('catName').value = '';
  document.getElementById('catImage').value = '';
  document.getElementById('catIsBrand').checked = false;
  document.getElementById('catImagePreview').style.display = 'none';
  document.getElementById('catSubmitBtn').innerHTML = '<i class="fa-solid fa-plus"></i> إضافة تصنيف';
  document.getElementById('catCancelBtn').style.display = 'none';
}

function renderCategoriesList() {
  const container = document.getElementById('categoriesList');
  const query = (document.getElementById('catSearchInput')?.value || '').trim().toLowerCase();
  
  const filtered = categories.map((c, originalIdx) => ({ ...c, originalIdx }))
                            .filter(c => c.name.toLowerCase().includes(query));

  if (!categories.length) {
    container.innerHTML = '<div class="empty"><i class="fa-solid fa-tags"></i><p>لا يوجد تصنيفات بعد</p></div>';
    return;
  }

  if (!filtered.length) {
    container.innerHTML = '<div class="empty"><i class="fa-solid fa-tags"></i><p>لا توجد نتائج مطابقة</p></div>';
    const selectAllBtn = document.getElementById('selectAllCatsBtn');
    if (selectAllBtn) selectAllBtn.checked = false;
    const bulkBtn = document.getElementById('bulkDeleteCatsBtn');
    if (bulkBtn) bulkBtn.style.display = 'none';
    return;
  }

  container.innerHTML = filtered.map(c => `
    <div class="product-card-admin" style="display:flex;align-items:center;gap:12px">
      <input type="checkbox" class="cat-checkbox" data-name="${c.name}" onchange="updateBulkDeleteBtn()" style="width:18px;height:18px;cursor:pointer;margin:0">
      <img src="${c.image || 'https://placehold.co/48x48/e2e8f0/64748b?text=' + encodeURIComponent(c.name.slice(0,2))}" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover">
      <div class="product-info-admin" style="flex:1">
        <strong>${c.name} ${c.isBrand ? '<span style="font-size:.65rem;background:rgba(239,68,68,0.05);color:var(--accent);border:1px solid var(--accent);padding:2px 8px;border-radius:6px;margin-inline-start:6px;font-weight:700;display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-award"></i> ماركة</span>' : ''}</strong>
        <div style="display:flex;align-items:center;gap:12px;font-size:.72rem;color:var(--text-muted);margin-top:2px">
          <span>${products.filter(p => c.isBrand ? (p.brand === c.name) : getProductCats(p).includes(c.name)).length} منتج</span>
          <span style="display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-calendar-days" style="font-size:.65rem;color:#94a3b8"></i> تاريخ الإضافة: <strong>${c.createdAt || 'غير محدد'}</strong></span>
        </div>
      </div>
      <div class="product-actions-admin">
        <button class="btn-sm btn-secondary" onclick="editCategory(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-sm btn-danger" onclick="deleteCategory(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  
  updateSelectAllState();
}

function updateBulkDeleteBtn() {
  const checkboxes = document.querySelectorAll('.cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const bulkBtn = document.getElementById('bulkDeleteCatsBtn');
  if (bulkBtn) {
    bulkBtn.style.display = checkedCount > 0 ? 'inline-flex' : 'none';
    bulkBtn.innerHTML = `<i class="fa-solid fa-trash"></i> حذف المحدد (${checkedCount})`;
  }
  
  const selectAllBtn = document.getElementById('selectAllCatsBtn');
  if (selectAllBtn && checkboxes.length > 0) {
    selectAllBtn.checked = checkedCount === checkboxes.length;
  }
}

function updateSelectAllState() {
  const checkboxes = document.querySelectorAll('.cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const selectAllBtn = document.getElementById('selectAllCatsBtn');
  if (selectAllBtn) {
    selectAllBtn.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
  }
  updateBulkDeleteBtn();
}

function toggleSelectAllCats(el) {
  const checkboxes = document.querySelectorAll('.cat-checkbox');
  checkboxes.forEach(cb => cb.checked = el.checked);
  updateBulkDeleteBtn();
}

function bulkDeleteCategories() {
  const checkboxes = document.querySelectorAll('.cat-checkbox:checked');
  const namesToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-name'));
  if (!namesToDelete.length) return;
  
  if (!confirm(`هل أنت متأكد من حذف ${namesToDelete.length} تصنيفات محددة؟`)) return;
  
  categories = categories.filter(c => !namesToDelete.includes(c.name));
  
  const selectAllBtn = document.getElementById('selectAllCatsBtn');
  if (selectAllBtn) selectAllBtn.checked = false;
  
  saveCategoriesToLS();
  renderCategoriesList();
  renderCategoryCheckboxes();
  populateBrandOptions();
}

function editCategory(idx) {
  const c = categories[idx];
  if (!c) return;
  editingCatIdx = idx;
  document.getElementById('catName').value = c.name;
  document.getElementById('catImage').value = c.image || '';
  document.getElementById('catIsBrand').checked = c.isBrand || false;
  const preview = document.getElementById('catImagePreview');
  if (c.image) { preview.src = c.image; preview.style.display = 'block'; }
  else preview.style.display = 'none';
  document.getElementById('catSubmitBtn').innerHTML = '<i class="fa-solid fa-pen"></i> تحديث التصنيف';
  document.getElementById('catCancelBtn').style.display = '';
}

function addCategory() {
  const name = document.getElementById('catName').value.trim();
  const image = document.getElementById('catImage').value.trim();
  const isBrand = document.getElementById('catIsBrand').checked;
  if (!name) { alert('يرجى إدخال اسم التصنيف'); return; }

  if (editingCatIdx !== null) {
    const existing = categories[editingCatIdx];
    if (!existing) { cancelEditCategory(); return; }
    if (name !== existing.name && categories.some((c, i) => i !== editingCatIdx && c.name === name)) {
      alert('هذا التصنيف موجود مسبقاً'); return;
    }
    categories[editingCatIdx] = { 
      name, 
      image, 
      isBrand, 
      createdAt: existing.createdAt || new Date().toLocaleDateString('ar-EG') 
    };
    saveCategoriesToLS();
    cancelEditCategory();
    renderCategoriesList();
    renderCategoryCheckboxes();
    populateBrandOptions();
    return;
  }

  if (categories.some(c => c.name === name)) { alert('هذا التصنيف موجود مسبقاً'); return; }
  categories.unshift({ 
    name, 
    image, 
    isBrand, 
    createdAt: new Date().toLocaleDateString('ar-EG') 
  });
  saveCategoriesToLS();
  document.getElementById('catName').value = '';
  document.getElementById('catImage').value = '';
  document.getElementById('catIsBrand').checked = false;
  document.getElementById('catImagePreview').style.display = 'none';
  renderCategoriesList();
  renderCategoryCheckboxes();
  populateBrandOptions();
}

function deleteCategory(idx) {
  const c = categories[idx];
  if (!c) return;
  if (!confirm(`حذف التصنيف "${c.name}"؟`)) return;
  categories.splice(idx, 1);
  if (editingCatIdx === idx) cancelEditCategory();
  saveCategoriesToLS();
  renderCategoriesList();
  renderCategoryCheckboxes();
}

function uploadCatImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { alert('حجم الصورة كبير جداً (الحد 200 كيلوبايت)'); return; }
    const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    showToast('🔄 جاري رفع الصورة...', 'info');
    const url = await uploadToImgbb(dataUrl);
    if (!url) return;
    document.getElementById('catImage').value = url;
    document.getElementById('catImagePreview').src = url;
    document.getElementById('catImagePreview').style.display = 'block';
  };
  input.click();
}

// ===== SALES CHART =====
function renderSalesChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(rect.width, 300) * dpr;
  canvas.height = 200 * dpr;
  canvas.style.height = '200px';
  ctx.scale(dpr, dpr);
  const W = canvas.width / dpr;
  const H = 200;

  const orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('ar-SA');
    const total = orders.filter(o => o.date && o.date.includes(d.toLocaleDateString('ar-SA').split('�')[0])).reduce((s, o) => s + (o.total || 0), 0);
    days.push({ label: d.toLocaleDateString('ar-SA', { weekday:'short' }), value: total });
  }
  const max = Math.max(...days.map(d => d.value), 1);
  const barW = Math.min(40, (W - 60) / days.length - 8);
  const gap = 8;
  const startX = 40;
  const bottomY = H - 30;

  ctx.clearRect(0, 0, W, H);
  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = bottomY - (i / 4) * (H - 50);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(W - 10, y);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Tajawal';
    ctx.textAlign = 'right';
    ctx.fillText(`${settings.currency || '?'}${Math.round(max * i / 4)}`, startX - 4, y + 3);
  }
  // Bars
  days.forEach((d, i) => {
    const x = startX + i * (barW + gap) + gap;
    const h = (d.value / max) * (H - 55);
    const y = bottomY - h;
    // Bar
  const grad = ctx.createLinearGradient(0, y, 0, bottomY);
  grad.addColorStop(0, '#ef4444');
  grad.addColorStop(1, '#fca5a5');
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
  else ctx.rect(x, y, barW, h);
  ctx.fill();
    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Tajawal';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, H - 8);
    // Value on top
    if (d.value > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px Tajawal';
      ctx.fillText(`${settings.currency || '?'}${d.value}`, x + barW / 2, y - 4);
    }
  });
}

// ===== NOTIFICATIONS =====
let notifOrderCount = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
let notifInterval = null;

function checkNewOrders() {
  const current = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  if (current > notifOrderCount) {
    const diff = current - notifOrderCount;
    notifOrderCount = current;
    // Show badge
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = diff;
      badge.style.display = 'flex';
      // Play beep
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.stop(audioCtx.currentTime + 0.3);
      } catch(e) {}
    }
    updateStats();
    renderOrders();
  } else if (current < notifOrderCount) {
    notifOrderCount = current;
  }
}

function getAgencyNotifs() {
  var list = [];
  try { var r = localStorage.getItem('mycart_agency_notifications'); if (r) list = JSON.parse(r); } catch(e) {}
  return list.filter(function(n){ return n.target === 'all' || n.target === (localStorage.getItem('mycart_store_subdomain') || ''); });
}

function getReadNotifIds() {
  try { var r = localStorage.getItem('mycart_read_notifications'); return r ? JSON.parse(r) : []; } catch(e) { return []; }
}

function markNotifRead(id) {
  var ids = getReadNotifIds();
  if (ids.indexOf(String(id)) === -1) {
    ids.push(String(id));
    try { localStorage.setItem('mycart_read_notifications', JSON.stringify(ids)); } catch(e) {}
  }
}

function handleNotifClick(notifId, targetHash) {
  if (notifId) markNotifRead(notifId);
  closeNotifModal();
  updateNotifBadge();
  if (targetHash) location.hash = targetHash;
}

function updateNotifBadge() {
  var badge = document.getElementById('notifBadge');
  if (!badge) return;
  const currentOrders = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  if (currentOrders > notifOrderCount) {
    const diff = currentOrders - notifOrderCount;
    notifOrderCount = currentOrders;
    playNotifSoundAdmin();
    updateStats();
    renderOrders();
  } else if (currentOrders < notifOrderCount) {
    notifOrderCount = currentOrders;
  }
  var agencyNotifs = [];
  try {
    var r = localStorage.getItem('mycart_store_notifications') || localStorage.getItem('mycart_store_notifications_default');
    if (r) agencyNotifs = JSON.parse(r);
  } catch(e) {}

  var readIds = getReadNotifIds();
  var unreadAgency = agencyNotifs.filter(function(n, i){ return readIds.indexOf(String(n.id || 'agency_'+i)) === -1; }).length;

  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var unreadOrders = orders.filter(function(o){ return readIds.indexOf(String(o.id)) === -1; }).length;

  var feeInfo = typeof getFeeInfo === 'function' ? getFeeInfo() : null;
  var hasFeeWarning = feeInfo && feeInfo.plan === 'free' && feeInfo.accrued > 0 && feeInfo.accrued >= feeInfo.limit;
  var total = unreadAgency + unreadOrders + (hasFeeWarning ? 1 : 0);

  if (total > 0) { badge.textContent = total; badge.style.display = 'flex'; }
  else { badge.style.display = 'none'; }
}

function startNotifCheck() {
  notifOrderCount = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  if (notifInterval) clearInterval(notifInterval);
  notifInterval = setInterval(function(){ updateNotifBadge(); }, 3000);
  updateNotifBadge();
}

function closeNotifModal() {
  var d = document.getElementById('adminNotifDropdownStandalone');
  if (d) d.remove();
}

var _adminNotifFilter = 'all';

function clearAllAdminNotifs() {
  var readIds = getReadNotifIds();
  var agencyNotifs = [];
  try {
    var r = localStorage.getItem('mycart_store_notifications') || localStorage.getItem('mycart_store_notifications_default');
    if (r) agencyNotifs = JSON.parse(r);
  } catch(e) {}
  agencyNotifs.forEach(function(n, i){
    var nid = String(n.id || ('agency_' + i));
    if (readIds.indexOf(nid) === -1) readIds.push(nid);
  });
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  orders.forEach(function(o){
    var oid = String(o.id);
    if (readIds.indexOf(oid) === -1) readIds.push(oid);
  });
  try { localStorage.setItem('mycart_read_notifications', JSON.stringify(readIds)); } catch(e) {}
  updateNotifBadge();
  var d = document.getElementById('adminNotifDropdownStandalone');
  if (d) d.remove();
  showNotifPanel();
}

function filterAdminNotifs(filter) {
  _adminNotifFilter = filter;
  var d = document.getElementById('adminNotifDropdownStandalone');
  if (d) d.remove();
  showNotifPanel();
}

function showNotifPanel() {
  var badge = document.getElementById('notifBadge');
  var existing = document.getElementById('adminNotifDropdownStandalone');
  if (existing) { existing.remove(); return; }
  var btn = document.getElementById('notifBtn');
  if (!btn) return;
  var rect = btn.getBoundingClientRect();

  var readIds = getReadNotifIds();
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var recent = orders.slice(0, 5);
  var agencyNotifs = [];
  try {
    var r = localStorage.getItem('mycart_store_notifications') || localStorage.getItem('mycart_store_notifications_default');
    if (r) agencyNotifs = JSON.parse(r);
  } catch(e) {}

  var drop = document.createElement('div');
  drop.id = 'adminNotifDropdownStandalone';
  drop.style.cssText = 'position:fixed;top:'+(rect.bottom+8)+'px;left:'+Math.max(10, rect.left-180)+'px;min-width:310px;max-width:350px;max-height:450px;overflow-y:auto;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.15);z-index:99999;padding:14px;font-family:Tajawal,sans-serif;direction:rtl';

  var itemsHtml = '';
  var feeInfo = typeof getFeeInfo === 'function' ? getFeeInfo() : null;
  if (feeInfo && feeInfo.plan === 'free' && feeInfo.accrued > 0 && feeInfo.accrued >= feeInfo.limit) {
    itemsHtml += '<div onclick="handleNotifClick(null, \'#subscription\')" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:#fef2f2;border:1.5px solid #fecaca;cursor:pointer">'
      + '<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.6rem;color:#fff"><i class="fa-solid fa-triangle-exclamation"></i></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.72rem;font-weight:800;color:#991b1b">?? ������� ����� ������</div>'
      + '<div style="font-size:.62rem;color:#b91c1c">����� ������: '+feeInfo.accrued+' ? (����: '+feeInfo.limit+' ?). ��� ����� �������.</div></div></div>';
  }

  var ntypes = {
    general:{bg:'#eff6ff',bd:'#bfdbfe',icon:'fa-bullhorn',icBg:'#2563eb',color:'#1e3a8a',sub:'#1d4ed8'},
    payment:{bg:'#fef2f2',bd:'#fecaca',icon:'fa-triangle-exclamation',icBg:'#dc2626',color:'#991b1b',sub:'#b91c1c'},
    post:{bg:'#ecfdf5',bd:'#a7f3d0',icon:'fa-newspaper',icBg:'#7c3aed',color:'#065f46',sub:'#047857'},
    update:{bg:'#e0f2fe',bd:'#bae6fd',icon:'fa-rotate',icBg:'#0891b2',color:'#075985',sub:'#0369a1'},
    offer:{bg:'#fdf2f8',bd:'#fbcfe8',icon:'fa-tag',icBg:'#db2777',color:'#831843',sub:'#9d174d'},
    marketing:{bg:'#fff7ed',bd:'#ffedd5',icon:'fa-bullhorn',icBg:'#ea580c',color:'#7c2d12',sub:'#9a3412'},
    welcome:{bg:'#ecfdf5',bd:'#a7f3d0',icon:'fa-hand-wave',icBg:'#059669',color:'#065f46',sub:'#047857'},
    warning:{bg:'#fef2f2',bd:'#fecaca',icon:'fa-triangle-exclamation',icBg:'#dc2626',color:'#991b1b',sub:'#b91c1c'}
  };

  if (agencyNotifs.length) {
    var shownAgency = agencyNotifs.slice(0, 4);
    shownAgency.forEach(function(n, idx){
      var nid = String(n.id || ('agency_' + idx));
      var isRead = readIds.indexOf(nid) !== -1;
      if (_adminNotifFilter === 'unread' && isRead) return;

      var t = ntypes[n.type] || ntypes.general;
      var targetHash = '#marketing';
      if (n.type === 'payment' || n.type === 'warning') targetHash = '#subscription';

      var cardBg = isRead ? '#f8fafc' : t.bg;
      var cardBorder = isRead ? '#e2e8f0' : t.bd;
      var titleColor = isRead ? '#64748b' : t.color;
      var subColor = isRead ? '#94a3b8' : t.sub;

      itemsHtml += '<div onclick="handleNotifClick(\''+nid+'\', \''+targetHash+'\')" style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:'+cardBg+';border:1.5px solid '+cardBorder+';cursor:pointer;opacity:'+(isRead ? '0.75' : '1')+'">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<div style="width:26px;height:26px;border-radius:50%;background:'+(isRead ? '#94a3b8' : t.icBg)+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.65rem;color:#fff"><i class="fa-solid '+t.icon+'"></i></div>'
        + '<div style="flex:1;min-width:0"><div style="font-size:.78rem;font-weight:800;color:'+titleColor+'">'+(n.type==='payment'?'?? ':'')+n.title+(isRead ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(�����)</span>' : '')+'</div>'
        + '<div style="font-size:.68rem;color:'+subColor+';line-height:1.4">'+n.message+'</div></div></div>'
        + (n.image ? '<img src="'+n.image+'" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid '+cardBorder+';margin-top:2px;'+(isRead?'filter:grayscale(30%)':'')+'" onerror="this.style.display=\'none\'">' : '')
        + (n.link ? '<div style="font-size:.65rem;font-weight:700;color:'+(isRead?'#94a3b8':t.icBg)+';display:flex;align-items:center;gap:4px"><i class="fa-solid fa-link"></i> '+n.link+'</div>' : '')
        + '</div>';
    });
  }

  if (orders.length > 0) {
    var newestOrder = orders[0];
    var oid = String(newestOrder.id);
    var isReadOrder = readIds.indexOf(oid) !== -1;
    if (_adminNotifFilter !== 'unread' || !isReadOrder) {
      itemsHtml += '<div onclick="handleNotifClick(\''+oid+'\', \'#orders/'+newestOrder.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:'+(isReadOrder ? '#f8fafc' : '#f0fdf4')+';border:1.5px solid '+(isReadOrder ? '#e2e8f0' : '#bbf7d0')+';cursor:pointer;opacity:'+(isReadOrder ? '0.75' : '1')+'">'
        + '<div style="width:28px;height:28px;border-radius:50%;background:'+(isReadOrder ? '#94a3b8' : '#16a34a')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.7rem;color:#fff"><i class="fa-solid fa-bag-shopping"></i></div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:.78rem;font-weight:800;color:'+(isReadOrder ? '#64748b' : '#166534')+'">?? ��� ���� #'+String(newestOrder.id).slice(-6)+(isReadOrder ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(�����)</span>' : '')+'</div>'
        + '<div style="font-size:.68rem;color:'+(isReadOrder ? '#94a3b8' : '#15803d')+'">'+(newestOrder.customer?.name || '���� ����')+' � �������: '+(newestOrder.total ? newestOrder.total + ' ?' : '')+'</div>'
        + '</div>'
        + '<span style="font-size:.6rem;background:'+(isReadOrder ? '#94a3b8' : '#16a34a')+';color:#fff;padding:2px 7px;border-radius:999px;font-weight:800">'+(isReadOrder ? '��� ��������' : '����')+'</span>'
        + '</div>';
    }
  }

  recent.forEach(function(o, i){
    if (i === 0 && orders.length > 0) return;
    var oid = String(o.id);
    var isReadOrder = readIds.indexOf(oid) !== -1;
    if (_adminNotifFilter === 'unread' && isReadOrder) return;

    var st = o._status || o.status || 'pending';
    var stColor = isReadOrder ? '#94a3b8' : (st==='completed'?'#10b981':st==='cancelled'?'#ef4444':'#f59e0b');
    var stLabel = st==='completed'?'�����':st==='cancelled'?'����':'����';
    itemsHtml += '<div onclick="handleNotifClick(\''+oid+'\', \'#orders/'+o.id+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:'+(i<recent.length-1?'4px':'0')+';background:'+(isReadOrder ? '#f8fafc' : '#fef2f2')+';border:1px solid '+(isReadOrder ? '#e2e8f0' : '#fecaca')+';opacity:'+(isReadOrder ? '0.75' : '1')+'">'
      + '<div style="width:7px;height:7px;border-radius:50%;background:'+stColor+';flex-shrink:0"></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:700;color:'+(isReadOrder ? '#64748b' : '#1e293b')+'">��� #'+String(o.id).slice(-6)+(isReadOrder ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(�����)</span>' : '')+'</div>'
      + '<div style="font-size:.65rem;color:#64748b">'+(o.customer?.name || '')+' � '+(o.total?o.total+' ?':'')+'</div></div>'
      + '<span style="font-size:.6rem;padding:2px 7px;border-radius:999px;background:'+stColor+'15;color:'+stColor+';font-weight:800">'+stLabel+'</span>'
      + '</div>';
  });

  var headerControlHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<button onclick="filterAdminNotifs(\'all\')" style="background:'+(_adminNotifFilter==='all'?'#8b5cf6':'#f1f5f9')+';color:'+(_adminNotifFilter==='all'?'#fff':'#64748b')+';border:none;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;cursor:pointer">����</button>'
    + '<button onclick="filterAdminNotifs(\'unread\')" style="background:'+(_adminNotifFilter==='unread'?'#8b5cf6':'#f1f5f9')+';color:'+(_adminNotifFilter==='unread'?'#fff':'#64748b')+';border:none;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;cursor:pointer">��� ����� ?</button>'
    + '</div>'
    + '<button onclick="clearAllAdminNotifs()" style="background:none;border:none;color:#ef4444;font-size:.65rem;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-check-double"></i> ����� ���� ������</button>'
    + '</div>';

  drop.innerHTML = '<div style="font-size:.8rem;font-weight:800;color:#1e293b;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between"><span style="display:flex;align-items:center;gap:6px"><i class="fa-solid fa-bell" style="color:#8b5cf6;font-size:.75rem"></i> ���������</span><button onclick="closeNotifModal()" style="background:none;border:none;color:#94a3b8;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + headerControlHtml
    + (itemsHtml || '<div style="font-size:.75rem;color:#94a3b8;text-align:center;padding:20px 0">'+(_adminNotifFilter==='unread'?'�� ���� ������� ��� ������ ?':'�� ���� �������')+'</div>')
    + '<div style="border-top:1px solid #f1f5f9;margin-top:8px;padding-top:8px;text-align:center">'
    + '<button onclick="closeNotifModal();location.hash=\'#orders\'" style="background:none;border:none;font-size:.7rem;color:#8b5cf6;font-weight:800;cursor:pointer;font-family:inherit;padding:4px 0">��� �� ������� <i class="fa-solid fa-arrow-left"></i></button></div>';

  document.body.appendChild(drop);
  setTimeout(function(){
    const closeHandler = function(ev) {
      if (!drop.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) {
        drop.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 20);
}

function startNotifCheck() {
  notifOrderCount = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  if (notifInterval) clearInterval(notifInterval);
  notifInterval = setInterval(function(){ checkNewOrders(); updateNotifBadge(); }, 3000);
  updateNotifBadge();
}

// ===== DELIVERY ZONES =====
function loadDeliveryZones() {
  const stored = localStorage.getItem('mycart_delivery_zones');
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  return [{name:'���', price:5},{name:'���', price:10}];
}

function saveDeliveryZones(zones) {
  try { localStorage.setItem('mycart_delivery_zones', JSON.stringify(zones)); } catch(e) {}
}

function renderZones() {
  const list = document.getElementById('zonesList');
  if (!list) return;
  const zones = loadDeliveryZones();
  const currency = settings.currency || '?';
  if (!zones.length) {
    list.innerHTML = '<div style="font-size:.8rem;color:var(--text-muted)">�� ���� ����� �����</div>';
    return;
  }
  list.innerHTML = zones.map((z, i) =>
    `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:.8rem"><span><strong>${z.name}</strong> � ${currency}${z.price}</span><button onclick="deleteZone(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem"><i class="fa-solid fa-xmark"></i></button></div>`
  ).join('');
}

function addZone() {
  const name = document.getElementById('zoneName').value.trim();
  const price = parseFloat(document.getElementById('zonePrice').value);
  if (!name || isNaN(price) || price < 0) { alert('���� ��� ������� ������'); return; }
  const zones = loadDeliveryZones();
  zones.push({ name, price });
  saveDeliveryZones(zones);
  document.getElementById('zoneName').value = '';
  document.getElementById('zonePrice').value = '';
  renderZones();
}

function deleteZone(idx) {
  const zones = loadDeliveryZones();
  zones.splice(idx, 1);
  saveDeliveryZones(zones);
  renderZones();
}

// ===== FEATURED PRODUCTS =====
async function toggleFeatured(idx) {
  if (!products[idx]) return;
  products[idx].featured = !products[idx].featured;
  await saveProductsToLS();
  renderProductsList();
}

function getProductCats(p) {
  if (p.categories && Array.isArray(p.categories) && p.categories.length) return p.categories;
  if (p.category) return [p.category];
  return ['����'];
}

function loadProducts() {
  const stored = localStorage.getItem(LS_PRODUCTS);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return [];
}

async function saveProductsToLS() {
  try {
    const productsForLS = [];
    for (const p of products) {
      const packed = JSON.parse(JSON.stringify(p));
      if (p.images && p.images.length) {
        packed.images = await mediaStorePackImages(p.images);
      }
      if (p.options) {
        packed.options = [];
        for (const opt of p.options) {
          const packedOpt = JSON.parse(JSON.stringify(opt));
          if (opt.values && opt.type === 'image') {
            packedOpt.values = [];
            for (const v of opt.values) {
              const packedV = JSON.parse(JSON.stringify(v));
              if (v.extra && v.extra.startsWith('data:')) {
                packedV.extra = await mediaStoreSave(v.extra);
              }
              packedOpt.values.push(packedV);
            }
          }
          packed.options.push(packedOpt);
        }
      }
      productsForLS.push(packed);
    }
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(productsForLS));
    // Delete old images not referenced by any product
    const allIds = new Set();
    productsForLS.forEach(p => {
      if (p.images) p.images.forEach(id => { if (id && id.startsWith && !id.startsWith('http')) allIds.add(id); });
      if (p.options) p.options.forEach(opt => {
        if (opt.values && opt.type === 'image') opt.values.forEach(v => { if (v.extra && v.extra.startsWith && !v.extra.startsWith('http')) allIds.add(v.extra); });
      });
    });
    // Garbage collect: delete unreferenced images from media store
    const db = await mediaOpenDB();
    const tx = db.transaction(['images'], 'readwrite');
    const store = tx.objectStore('images');
    const all = await new Promise(r => { const req = store.getAllKeys(); req.onsuccess = () => r(req.result || []); req.onerror = () => r([]); });
    for (const key of all) {
      if (!allIds.has(key)) {
        try { mediaStoreDelete(key); } catch(e) {}
      }
    }
  } catch(e) {
    alert('����� ������� �����ɡ ���� ��� ��������. ���� ��� ��� �������� �������.');
    return;
  }
  try { localStorage.setItem('mycart_admin_products_sync', Date.now().toString()); } catch(e) {}
}

function toggleMktSubMenu(e, forceOpen = false) {
  if (e) e.stopPropagation();
  const sub = document.getElementById('mktSubMenu');
  const chev = document.getElementById('mktChevron');
  if (!sub) return;
  const isOpen = sub.style.display === 'flex';
  if (isOpen && !forceOpen) {
    sub.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  } else {
    sub.style.display = 'flex';
    if (chev) chev.style.transform = 'rotate(180deg)';
  }
}

function renderProductsList() {
  var container = document.getElementById('productsList');
  if (!container) return;
  var products = loadProducts();
  var searchQ = '';
  var filtered = searchQ ? products.filter(function(p){ return p.name.toLowerCase().includes(searchQ); }) : products;

  var topBarHtml = '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    + '<div style="font-weight:900;font-size:1.1rem;color:var(--text)">����� �������� ('+filtered.length+')</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button onclick="exportProductsJSONAdmin()" class="btn-sm" style="padding:6px 14px;background:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-file-export"></i> ����� JSON</button>'
    + '<button onclick="triggerImportProductsAdmin()" class="btn-sm" style="padding:6px 14px;background:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-file-import"></i> ������� JSON</button>'
    + '<button onclick="location.hash=\'addProduct\'" class="btn-sm" style="padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-plus"></i> ����� ���� ����</button>'
    + '</div>'
    + '</div>';

  if (!filtered.length) {
    container.innerHTML = topBarHtml + '<div style="text-align:center;color:#94a3b8;padding:40px 20px;background:#fff;border-radius:12px;border:1px solid var(--border)"><i class="fa-solid fa-box-open" style="font-size:2rem;margin-bottom:8px"></i><p>�� ���� ������</p></div>';
    return;
  }

  var listHtml = '<div style="display:flex;flex-direction:column;gap:8px">' + filtered.map(function(p, i){
    const realIdx = products.indexOf(p);
    const addedDate = p.createdAt || p.dateAdded || '��� ����';
    const catStr = Array.isArray(p.categories) ? p.categories.join('� ') : (p.category || '���');
    const imgUrl = (p.images && p.images[0]) || p.image || 'https://placehold.co/50x50/eee/999?text=??';
    return '<div class="product-card-admin">'
      + '<img src="'+imgUrl+'" alt="">'
      + '<div class="product-info-admin">'
      + '<strong>'+p.name+'</strong>'
      + '<span>'+(settings.currency || '?')+(p.price||0)+'</span>'
      + '</div>'
      + '<div class="product-actions-admin">'
      + '<a class="btn-sm btn-secondary" href="index.html#product/'+p.id+'" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:5px 9px" title="مشاهدة المنتج"><i class="fa-solid fa-eye"></i></a>'
      + '<button class="btn-sm btn-secondary" onclick="editProduct('+realIdx+')"><i class="fa-solid fa-pen"></i></button>'
      + '<button class="btn-sm btn-danger" onclick="deleteProduct('+realIdx+')"><i class="fa-solid fa-trash"></i></button>'
      + '</div>'
      + '</div>';
  }).join('') + '</div>';

  container.innerHTML = topBarHtml + listHtml;
}

function exportProductsJSONAdmin() {
  var products = loadProducts();
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  var downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "products_export_" + new Date().toISOString().slice(0,10) + ".json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('?? �� ����� ���� �������� �����!', 'success');
}

function triggerImportProductsAdmin() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      try {
        var imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          var products = loadProducts();
          var count = 0;
          imported.forEach(function(p) {
            if (p.name && p.price !== undefined) {
              if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 1000);
              if (!p.createdAt) p.createdAt = new Date().toLocaleDateString('ar-EG');
              products.unshift(p);
              count++;
            }
          });
          localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
          renderProductsList();
          showToast('? �� ������� ' + count + ' ���� �����!', 'success');
        } else {
          showToast('?? ���� ��� JSON ��� �����', 'error');
        }
      } catch(err) {
        showToast('?? ��� �� ����� �����', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function deleteProduct(idx) {
  var products = loadProducts();
  if (!confirm('�� ��� ���� �� ��� ������ "' + products[idx].name + '"�')) return;
  products.splice(idx, 1);
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
  renderProductsList();
  updateStats();
}

function renderOrders() {
  var container = document.getElementById('ordersList');
  if (!container) return;
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  if (!orders.length) { 
    container.innerHTML = '<div class="empty"><i class="fa-solid fa-receipt"></i><p>�� ���� �����</p></div>'; 
    return; 
  }
  container.innerHTML = orders.slice().reverse().map(function(o){ 
    return '<div class="product-card-admin">'
      + '<div class="product-info-admin">'
      + '<strong>��� #' + String(o.id).slice(-6) + '</strong>'
      + '<span>' + (o.customer?.name || '���� ����') + '</span>'
      + '<span>' + (o.customer?.phone || '') + '</span>'
      + '<span>' + (o.customer?.city || '') + '</span>'
      + '<span>' + (settings.currency || '?') + (o.total || 0) + '</span>'
      + '</div>'
      + '<div class="product-actions-admin">'
      + '<button class="btn-sm btn-secondary" onclick="showOrderDetail(' + o.id + ')"><i class="fa-solid fa-eye"></i></button>'
      + '</div>'
      + '</div>';
  }).join('');
}

function renderRecentOrders() {
  var container = document.getElementById('recentOrders');
  if (!container) return;
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var recent = orders.slice(-5);
  if (!recent.length) { 
    container.innerHTML = '<div class="empty"><i class="fa-solid fa-receipt"></i><p>�� ���� �����</p></div>'; 
    return; 
  }
  container.innerHTML = recent.map(function(o){ 
    return '<div class="product-card-admin">'
      + '<div class="product-info-admin">'
      + '<strong>��� #' + String(o.id).slice(-6) + '</strong>'
      + '<span>' + (o.customer?.name || '���� ����') + '</span>'
      + '<span>' + (settings.currency || '?') + (o.total || 0) + '</span>'
      + '</div>'
      + '</div>';
  }).join('');
}

function showOrderDetail(id) {
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var o = orders.find(function(x){ return x.id === id; });
  if (!o) return;
  alert('������ �����:\n' +
    (o.customer?.name || '') + '\n' +
    (o.customer?.phone || '') + '\n' +
    (o.customer?.city || '') + '\n' +
    (o.customer?.address || '') + '\n' +
    JSON.stringify(o.items));
}

function updateStats() {
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var products = loadProducts();
  var totalRevenue = orders.reduce(function(sum, o){ return sum + (o.total || 0); }, 0);
  var customers = new Set(orders.map(function(o){ return o.customer?.phone; }).filter(Boolean));
  var statProducts = document.getElementById('statProducts');
  var statOrders = document.getElementById('statOrders');
  var statRevenue = document.getElementById('statRevenue');
  var statCustomers = document.getElementById('statCustomers');
  if (statProducts) statProducts.textContent = products.length;
  if (statOrders) statOrders.textContent = orders.length;
  if (statRevenue) statRevenue.textContent = (settings.currency || '?') + totalRevenue.toFixed(2);
  if (statCustomers) statCustomers.textContent = customers.size;
}

function updateCouponBadge() {
  const badge = document.getElementById('couponBadge');
  if (!badge) return;
  const n = loadCoupons().filter(c => getCouponStatus(c) === 'active').length;
  if (n > 0) { badge.style.display = 'inline-flex'; badge.textContent = n; }
  else { badge.style.display = 'none'; }
}

function adminRefreshAll() {
  updateStats();
  renderSalesChart();
  renderProductsList();
  renderCategoriesList();
  renderZones();
  renderOrders();
  renderRecentOrders();
  updateCouponBadge();
}

// ============ SPIN WHEEL ADMIN ============

function loadSpinWheelData() {
  try {
    const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    return { enabled: !!mkt.spinWin?.show, segments: mkt.spinWin?.segments || [] };
  } catch (e) { return { enabled: false, segments: [] }; }
}

function saveSpinWheelToLS(data) {
  try {
    const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    mkt.spinWin = { show: data.enabled, segments: data.segments };
    localStorage.setItem('mycart_marketing', JSON.stringify(mkt));
    return true;
  } catch (e) { return false; }
}

function renderOffersAdmin() {
  const container = document.getElementById('admin-marketing');
  if (!container) return;
  // Migrate old broken key (offers → offersSection)
  try {
    const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    let dirty = false;
    if ('offers' in mkt && typeof mkt.offers.show === 'boolean') {
      if (!mkt.offersSection) mkt.offersSection = {};
      if (!('show' in mkt.offersSection)) mkt.offersSection.show = mkt.offers.show;
      delete mkt.offers;
      dirty = true;
    } else if ('offers' in mkt) {
      delete mkt.offers;
      dirty = true;
    }
    if (dirty) localStorage.setItem('mycart_marketing', JSON.stringify(mkt));
  } catch(e) {}

  container.innerHTML =
    '<div class="admin-section-title">تخصيص أقسام الصفحة الرئيسية</div>' +
    '<div style="background:var(--card);border:1px dashed var(--accent);border-radius:14px;padding:24px;text-align:center;margin:16px 0">' +
    '<div style="font-size:2.5rem;margin-bottom:12px"><i class="fa-solid fa-pen-ruler" style="color:var(--accent)"></i></div>' +
    '<h3 style="margin:0 0 8px;font-size:1.05rem;font-weight:800">تم نقل التحكم إلى منشئ الصفحة</h3>' +
    '<p style="font-size:.82rem;color:var(--text-muted);margin:0 0 16px;max-width:400px;margin-left:auto;margin-right:auto">' +
    'يمكنك الآن ترتيب الأقسام وتفعيل/تعطيلها من <strong>منشئ الصفحة الرئيسية</strong> في تبويب التسويق.</p>' +
    '<button onclick="switchAdminTab(\'marketing\',\'seo\');document.querySelector(\'[data-tab=\\\'marketing\\\']\').click();setTimeout(function(){' +
    'var pbBtn=document.querySelector(\'.submenu-btn[onclick*=\\\'pagebuilder\\\']\');if(pbBtn)pbBtn.click();},100)" ' +
    'style="padding:10px 24px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.85rem;font-weight:700;cursor:pointer">' +
    '<i class="fa-solid fa-arrow-left"></i> فتح منشئ الصفحة</button></div>';
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

function loadSectionOrder() {
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  return (mkt.sectionOrder || ['banner','offers','flashSale','featured','newArrival','halfPrice','mostSold']).filter(function(s) { return s !== 'couponDetector'; });
}

function renderSpinWheelAdmin() {
  const data = loadSpinWheelData();
  const swEnabled = document.getElementById('swEnabled');
  if (swEnabled) swEnabled.checked = data.enabled;

  document.getElementById('swStatCount').textContent = data.segments.length;
  document.getElementById('swStatStatus').textContent = data.enabled ? '🟢 مفعلة' : '🔴 غير مفعلة';
  document.getElementById('swStatStatus').style.color = data.enabled ? '#22c55e' : '#94a3b8';
  document.getElementById('swSegCount').textContent = data.segments.length + ' قطاع';

  renderSpinSegmentsList(data.segments);
  updatePreview(data.segments);
}

let swEditSegIdx = -1;

function renderSpinSegmentsList(segs) {
  const container = document.getElementById('swSegmentsList');
  if (!container) return;
  if (!segs || !segs.length) {
    container.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--text-muted);font-size:.8rem"><i class="fa-solid fa-circle-notch" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:.3"></i> لم يتم إضافة أي قطاعات بعد<br>أضف قطاعات باستخدام النموذج أدناه</div>';
    return;
  }
  container.innerHTML = segs.map((seg, i) => {
    const typeIcon = seg.type === 'discount' ? 'fa-tag' : seg.type === 'freeship' ? 'fa-truck-fast' : 'fa-star';
    const typeLabel = seg.type === 'discount' ? `خصم ${seg.percent}%` : seg.type === 'freeship' ? 'شحن مجاني' : 'حظ سعيد';
    return `<div style="display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:10px 12px;transition:all .2s${swEditSegIdx === i ? ';outline:2px solid var(--accent);outline-offset:2px' : ''}">
      <div style="width:20px;height:20px;border-radius:50%;background:${seg.color || '#ef4444'};flex-shrink:0;border:2px solid rgba(255,255,255,.3);box-shadow:0 0 8px ${seg.color || '#ef4444'}44"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.82rem;font-weight:700;display:flex;align-items:center;gap:6px">
          <i class="fa-solid ${typeIcon}" style="font-size:.65rem;color:${seg.color || '#ef4444'}"></i>
          ${seg.label}
        </div>
        <div style="font-size:.7rem;color:var(--text-muted);margin-top:1px">${typeLabel}${seg.code ? ' — كود: ' + seg.code : ''}${seg.limit > 0 ? ' — حد: ' + seg.limit + ' مرات' : ''}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button onclick="editSpinSegment(${i})" style="background:none;border:none;color:#f59e0b;cursor:pointer;font-size:.85rem;padding:4px;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6" title="تعديل"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteSpinSegment(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.9rem;padding:4px;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`;
  }).join('');
}

function editSpinSegment(idx) {
  const data = loadSpinWheelData();
  const seg = data.segments[idx];
  if (!seg) return;
  swEditSegIdx = idx;
  document.getElementById('swNewLabel').value = seg.label;
  document.getElementById('swNewType').value = seg.type;
  document.getElementById('swNewPercent').value = seg.percent || 10;
  document.getElementById('swNewCode').value = seg.code || '';
  document.getElementById('swNewColor').value = seg.color || '#ef4444';
  document.getElementById('swNewColorVal').textContent = seg.color || '#ef4444';
  document.getElementById('swNewLimit').value = seg.limit ?? 0;
  swToggleFields();
  const addBtn = document.querySelector('#swNewLabel').closest('.admin-card')?.querySelector('button[onclick*="addSpinSegment"]');
  if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-check"></i> تحديث القطاع';
  let cancelBtn = document.getElementById('swCancelEdit');
  if (!cancelBtn) {
    const parent = addBtn?.parentElement;
    if (parent) {
      cancelBtn = document.createElement('button');
      cancelBtn.id = 'swCancelEdit';
      cancelBtn.type = 'button';
      cancelBtn.onclick = cancelEditSpinSegment;
      cancelBtn.style.cssText = 'background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 18px;cursor:pointer;font-size:.8rem;margin-right:6px';
      cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> إلغاء';
      parent.insertBefore(cancelBtn, addBtn);
    }
  }
  renderSpinSegmentsList(data.segments);
  document.getElementById('swNewLabel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEditSpinSegment() {
  swEditSegIdx = -1;
  document.getElementById('swNewLabel').value = '';
  document.getElementById('swNewCode').value = '';
  document.getElementById('swNewPercent').value = '10';
  document.getElementById('swNewColor').value = '#ef4444';
  document.getElementById('swNewColorVal').textContent = '#ef4444';
  document.getElementById('swNewLimit').value = '0';
  document.getElementById('swNewType').value = 'discount';
  swToggleFields();
  const addBtn = document.querySelector('#swNewLabel').closest('.admin-card')?.querySelector('button[onclick*="addSpinSegment"]');
  if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> إضافة قطاع';
  const cancelBtn = document.getElementById('swCancelEdit');
  if (cancelBtn) cancelBtn.remove();
  renderSpinSegmentsList(loadSpinWheelData().segments);
}

function addSpinSegment() {
  const label = document.getElementById('swNewLabel')?.value.trim();
  const type = document.getElementById('swNewType')?.value;
  const percent = parseInt(document.getElementById('swNewPercent')?.value) || 0;
  const code = document.getElementById('swNewCode')?.value.trim().toUpperCase();
  const color = document.getElementById('swNewColor')?.value || '#ef4444';
  const limit = parseInt(document.getElementById('swNewLimit')?.value) || 0;

  if (!label) { showToast('أدخل اسم الجائزة أولاً', 'error'); return; }
  if (type === 'discount' && (!percent || percent < 1)) { showToast('أدخل نسبة الخصم', 'error'); return; }
  if (type === 'discount' && !code) { showToast('أدخل كود الخصم', 'error'); return; }

  const data = loadSpinWheelData();
  const seg = { label, type, percent: type === 'discount' ? percent : 0, code: type === 'discount' ? code : (type === 'freeship' ? 'FREESHIP' : ''), color, limit };

  if (swEditSegIdx >= 0) {
    data.segments[swEditSegIdx] = seg;
    swEditSegIdx = -1;
    const addBtn = document.querySelector('#swNewLabel').closest('.admin-card')?.querySelector('button[onclick*="addSpinSegment"]');
    if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> إضافة قطاع';
    const cancelBtn = document.getElementById('swCancelEdit');
    if (cancelBtn) cancelBtn.remove();
    if (!saveSpinWheelToLS(data)) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
    renderSpinWheelAdmin();
    showToast('تم تحديث القطاع بنجاح', 'success');
    return;
  }

  data.segments.push(seg);
  if (!saveSpinWheelToLS(data)) { showToast('مساحة التخزين ممتلئة', 'error'); return; }

  document.getElementById('swNewLabel').value = '';
  document.getElementById('swNewCode').value = '';
  document.getElementById('swNewPercent').value = '10';
  document.getElementById('swNewColor').value = '#ef4444';
  document.getElementById('swNewColorVal').textContent = '#ef4444';
  document.getElementById('swNewLimit').value = '0';

  renderSpinWheelAdmin();
  showToast('تم إضافة القطاع بنجاح', 'success');
}

function updatePreview(segs) {
  const wheel = document.getElementById('swPreviewWheel');
  if (!wheel) return;
  if (!segs || !segs.length) {
    wheel.style.background = 'conic-gradient(#e2e8f0 0deg 360deg)';
    return;
  }
  const count = segs.length;
  const segDeg = 360 / count;
  const parts = segs.map((s, i) => {
    const from = Math.round(i * segDeg * 10) / 10;
    const to = Math.round((i + 1) * segDeg * 10) / 10;
    return `${s.color || '#ef4444'} ${from}deg ${to}deg`;
  });
  wheel.style.background = `conic-gradient(${parts.join(', ')})`;
}

function swToggleFields() {
  const type = document.getElementById('swNewType')?.value;
  const percentGroup = document.getElementById('swNewPercentGroup');
  const codeGroup = document.getElementById('swNewCodeGroup');
  const limitRow = document.getElementById('swNewLimitRow');
  if (percentGroup) percentGroup.style.display = type === 'discount' ? 'block' : 'none';
  if (codeGroup) codeGroup.style.display = type === 'discount' ? 'block' : 'none';
  if (limitRow) limitRow.style.display = type === 'none' ? 'none' : 'block';
}

function addSpinSegment() {
  const label = document.getElementById('swNewLabel')?.value.trim();
  const type = document.getElementById('swNewType')?.value;
  const percent = parseInt(document.getElementById('swNewPercent')?.value) || 0;
  const code = document.getElementById('swNewCode')?.value.trim().toUpperCase();
  const color = document.getElementById('swNewColor')?.value || '#ef4444';
  const limit = parseInt(document.getElementById('swNewLimit')?.value) || 0;

  if (!label) { showToast('أدخل اسم الجائزة أولاً', 'error'); return; }
  if (type === 'discount' && (!percent || percent < 1)) { showToast('أدخل نسبة الخصم', 'error'); return; }
  if (type === 'discount' && !code) { showToast('أدخل كود الخصم', 'error'); return; }

  const data = loadSpinWheelData();
  data.segments.push({
    label,
    type,
    percent: type === 'discount' ? percent : 0,
    code: type === 'discount' ? code : (type === 'freeship' ? 'FREESHIP' : ''),
    color,
    limit
  });
  if (!saveSpinWheelToLS(data)) { showToast('مساحة التخزين ممتلئة', 'error'); return; }

  document.getElementById('swNewLabel').value = '';
  document.getElementById('swNewCode').value = '';
  document.getElementById('swNewPercent').value = '10';
  document.getElementById('swNewColor').value = '#ef4444';
  document.getElementById('swNewColorVal').textContent = '#ef4444';
  document.getElementById('swNewLimit').value = '0';

  renderSpinWheelAdmin();
  showToast('تم إضافة القطاع بنجاح', 'success');
}

function deleteSpinSegment(idx) {
  if (!confirm('هل تريد حذف هذا القطاع؟')) return;
  const data = loadSpinWheelData();
  if (idx < 0 || idx >= data.segments.length) return;
  data.segments.splice(idx, 1);
  saveSpinWheelToLS(data);
  if (swEditSegIdx === idx) swEditSegIdx = -1;
  else if (swEditSegIdx > idx) swEditSegIdx--;
  renderSpinWheelAdmin();
  showToast('تم حذف القطاع', 'success');
}

function saveSpinWheel() {
  const enabled = document.getElementById('swEnabled')?.checked || false;
  const data = loadSpinWheelData();
  data.enabled = enabled;
  if (!saveSpinWheelToLS(data)) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
  renderSpinWheelAdmin();
  showToast(enabled ? 'تم تفعيل عجلة الحظ 🎡' : 'تم إيقاف عجلة الحظ', 'success');
}

function genWheelCode() {
  const prefix = 'LUCKY';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const el = document.getElementById('swNewCode');
  if (el) el.value = code;
}

// Sync color input with label
document.addEventListener('DOMContentLoaded', function() {
  const colorInput = document.getElementById('swNewColor');
  const colorLabel = document.getElementById('swNewColorVal');
  if (colorInput && colorLabel) {
    colorInput.addEventListener('input', function() {
      colorLabel.textContent = this.value;
    });
  }
});

function adminPpToggleType() {
  const t = document.getElementById('mktPpType')?.value;
  const showCode = (t === 'discount' || t === 'halfprice');
  const showPct = (t === 'discount' || t === 'sale' || t === 'halfprice');
  const showExp = (t === 'discount' || t === 'sale' || t === 'halfprice');
  ['mktPpCodeGroup','mktPpPctGroup','mktPpExpGroup'].forEach(id => {
    const el = document.getElementById(id);
    const show = id === 'mktPpCodeGroup' ? showCode : id === 'mktPpPctGroup' ? showPct : showExp;
    if (el) el.style.display = show ? 'block' : 'none';
  });
  ['mktPpBtnTextGroup','mktPpBtnLinkGroup'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = t === 'newsletter' ? 'none' : 'block';
  });
  const ce = document.getElementById('mktPpCustomExtras');
  if (ce) ce.style.display = t === 'custom' ? 'block' : 'none';
}

function mktPpUploadImage() {
  document.getElementById('mktPpFileInput')?.click();
}

function mktPpPreviewImage(url) {
  const prev = document.getElementById('mktPpImagePreview');
  if (!prev) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
    prev.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">';
    prev.style.display = 'block';
  } else { prev.style.display = 'none'; }
}

async function mktPpHandleImageUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('الصورة كبيرة جداً (الحد 5MB)', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  document.getElementById('mktPpImage').value = url;
  const prev = document.getElementById('mktPpImagePreview');
  if (prev) { prev.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">'; prev.style.display = 'block'; }
  showToast('✅ تم رفع الصورة بنجاح', 'success');
  input.value = '';
}

function adminPpTestPreview() {
  const show = document.getElementById('mktPromoPopupShow')?.checked;
  const type = document.getElementById('mktPpType')?.value || 'discount';
  const title = document.getElementById('mktPpTitle')?.value || '';
  const text = document.getElementById('mktPpText')?.value || '';
  const code = document.getElementById('mktPpCode')?.value || '';
  const pct = document.getElementById('mktPpPercent')?.value || '';
  const image = document.getElementById('mktPpImage')?.value || '';
  const bg = document.getElementById('mktPpBg')?.value || '#ffffff';
  const tc = document.getElementById('mktPpTextColor')?.value || '#0f172a';
  const ac = document.getElementById('mktPpAccent')?.value || '#ef4444';
  const bb = document.getElementById('mktPpBtnBg')?.value || '#ef4444';
  const bc = document.getElementById('mktPpBtnColor')?.value || '#ffffff';
  const btnText = document.getElementById('mktPpBtnText')?.value || '';
  const btnLink = document.getElementById('mktPpBtnLink')?.value || '';
  const sz = document.getElementById('mktPpSize')?.value || 'medium';
  const pos = document.getElementById('mktPpPos')?.value || 'center';
  const anim = document.getElementById('mktPpAnim')?.value || 'bounce';
  const customHtml = document.getElementById('mktPpCustomHtml')?.value || '';
  const customIcon = document.getElementById('mktPpCustomIcon')?.value || '';

  const existing = document.getElementById('_adminLivePreview');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_adminLivePreview';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:'+(pos==='center'?'center':pos==='top'?'flex-start':'flex-end')+';justify-content:center;padding:30px';
  overlay.onclick = function(e) { if (e.target === this) this.remove(); };

  const w = { small:'340px', medium:'440px', large:'560px', fullscreen:'90vw' }[sz] || '440px';
  const hmax = sz === 'fullscreen' ? '90vh' : 'none';

  overlay.innerHTML = `<div style="background:${bg};color:${tc};max-width:${w};${hmax!=='none'?'max-height:'+hmax:''};width:100%;border-radius:24px;padding:32px 24px;text-align:${customHtml?'initial':'center'};position:relative;box-shadow:0 25px 50px rgba(0,0,0,0.3);border-top:4px solid ${ac};animation:ppAnim 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards">
    <button onclick="this.closest('#_adminLivePreview').remove()" style="position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.06);border:none;font-size:1.1rem;color:#94a3b8;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center">✕</button>
    ${customHtml ? customHtml : `
    ${type==='sale'||type==='halfprice'?'<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);color:#ef4444;padding:6px 14px;border-radius:999px;font-size:.75rem;font-weight:800;margin-bottom:14px">⏰ 23:59:59</div>':''}
    ${image ? '<img src="'+image+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;margin-bottom:14px">' : '<div style="font-size:3rem;margin-bottom:14px"><i class="fa-solid '+(customIcon||(type==='discount'?'fa-tag':type==='announcement'?'fa-bullhorn':type==='newsletter'?'fa-envelope-open-text':type==='sale'?'fa-fire':type==='newarrival'?'fa-gem':type==='halfprice'?'fa-bolt':'fa-gift'))+'" style="color:'+ac+'"></i></div>'}
    <h3 style="font-size:1.35rem;font-weight:800;margin-bottom:8px;color:${tc}">${title||'العنوان'}</h3>
    <p style="font-size:.85rem;color:${tc}cc;line-height:1.5;margin-bottom:20px;${text?'':'display:none'}">${text}</p>
    ${pct && (type==='discount'||type==='sale'||type==='halfprice')?'<div style="font-size:2.2rem;font-weight:900;color:'+ac+';margin:6px 0 10px">-'+pct+'%</div>':''}
    ${code ? '<div style="background:#fef2f2;border:2px dashed '+ac+';padding:12px 20px;border-radius:12px;font-size:1.2rem;font-weight:800;color:'+ac+';display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;letter-spacing:1px">'+code+' <i class="fa-solid fa-copy"></i></div><span style="font-size:.7rem;color:#94a3b8">اضغط على الكود للنسخ</span>':''}
    ${type==='newsletter'?'<div style="display:flex;gap:8px;margin-top:14px;justify-content:center;flex-wrap:wrap"><input placeholder="أدخل بريدك الإلكتروني" style="flex:1;min-width:180px;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.85rem"><button style="padding:10px 20px;border-radius:10px;font-weight:700;font-size:.85rem;border:none;cursor:pointer;background:'+ac+';color:#fff">اشتراك</button></div>':''}
    ${btnText && btnLink && type!=='newsletter'?'<a href="'+btnLink+'" style="display:inline-block;margin-top:14px;padding:12px 28px;border-radius:12px;font-weight:800;font-size:.9rem;text-decoration:none;text-align:center;color:'+bc+';background:'+bb+';border:none;cursor:pointer">'+btnText+'</a>':''}
    `}
    </div><style>@keyframes ppAnim{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}</style>`;
  document.body.appendChild(overlay);
}


// ===== LOGO & BACKGROUND SETTINGS UPLOAD HELPERS =====
async function uploadSettingLogo(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 800, 600, async function(url) {
    showToast('🔄 جاري رفع الشعار...', 'info');
    const imgbbUrl = await uploadToImgbb(url);
    if (!imgbbUrl) return;
    
    const preview = document.getElementById('setLogoPreview');
    if (preview) {
      preview.src = imgbbUrl;
      preview.style.display = 'block';
    }
    const rmBtn = document.getElementById('removeLogoBtn');
    if (rmBtn) rmBtn.style.display = 'inline-block';
    
    try { localStorage.setItem('mycart_logo', imgbbUrl); } catch(e) {}
    settings.logo = imgbbUrl;
    saveSettingsToLS();
    showToast('✅ تم تغيير الشعار بنجاح', 'success');
  });
}

function removeSettingLogo() {
  localStorage.removeItem('mycart_logo');
  if (settings) delete settings.logo;
  saveSettingsToLS();
  
  const preview = document.getElementById('setLogoPreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  const rmBtn = document.getElementById('removeLogoBtn');
  if (rmBtn) rmBtn.style.display = 'none';
  
  showToast('🗑️ تم إزالة الشعار', 'success');
}

async function uploadBg(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 1920, 1080, async function(url) {
    showToast('🔄 جاري رفع الخلفية...', 'info');
    const imgbbUrl = await uploadToImgbb(url);
    if (!imgbbUrl) return;
    
    try { localStorage.setItem('mycart_header_bg', imgbbUrl); } catch(e) {}
    settings.headerBg = imgbbUrl;
    saveSettingsToLS();
    showToast('✅ تم تغيير الخلفية بنجاح', 'success');
  });
}

function removeBg() {
  localStorage.removeItem('mycart_header_bg');
  if (settings) delete settings.headerBg;
  saveSettingsToLS();
  showToast('🗑️ تم إزالة الخلفية', 'success');
}

function saveSettingsToLS() {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    localStorage.setItem('mycart_admin_settings_sync', Date.now().toString());
  } catch(e) {}
}

function populateSettings() {
  const s = settings;
  if (!s) return;
  
  const nameEl = document.getElementById('setStoreName');
  if (nameEl) nameEl.value = s.storeName || '';
  
  const taglineEl = document.getElementById('setStoreTagline');
  if (taglineEl) taglineEl.value = s.tagline || '';
  
  const modeEl = document.getElementById('setHeaderDisplayMode');
  if (modeEl) modeEl.value = s.logoDisplayMode || 'both';
  
  const wholesaleEl = document.getElementById('setWholesaleCode');
  if (wholesaleEl) wholesaleEl.value = s.wholesaleCode || 'ADMIN123';
  
  const currencyEl = document.getElementById('setCurrency');
  if (currencyEl) currencyEl.value = s.currency || '₪';
  
  const accentEl = document.getElementById('setAccent');
  if (accentEl) {
    accentEl.value = s.accentColor || '#ef4444';
    const accentVal = document.getElementById('setAccentVal');
    if (accentVal) accentVal.textContent = accentEl.value;
  }
  
  const logo = localStorage.getItem('mycart_logo') || s.logo;
  const preview = document.getElementById('setLogoPreview');
  const removeBtn = document.getElementById('removeLogoBtn');
  if (logo) {
    if (preview) {
      preview.src = logo;
      preview.style.display = 'block';
    }
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    if (removeBtn) removeBtn.style.display = 'none';
  }
}
