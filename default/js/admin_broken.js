// ===== ADMIN PANEL FUNCTIONS (Standalone admin.html) =====

function initAdmin() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  switchTab(hash);
  renderOrders();
  renderCustomers();
}

function switchTab(hash) {
  const parts = hash.split('/');
  const tab = parts[0];
  const subTab = parts[1];

  document.querySelectorAll('.tab-content').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('#sidebar nav button').forEach(function(b){ b.classList.remove('active'); });
  
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');
  const btn = document.querySelector('[data-tab="' + tab + '"]');
  if (btn) btn.classList.add('active');

  if (tab === 'marketing') {
    toggleMktSubMenu(null, true);
    document.querySelectorAll('.mkt-subtab-content').forEach(function(el) {
      el.style.display = 'none';
    });
    const noPanel = document.getElementById('mktNoPanel');
    if (noPanel) noPanel.style.display = 'none';
    const targetSubTab = subTab || 'seo';
    const subTabContent = document.getElementById('mkt-sub-' + targetSubTab);
    if (subTabContent) {
      subTabContent.style.display = 'block';
    }
    document.querySelectorAll('.submenu-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'" + targetSubTab + "'")) {
        btn.classList.add('active');
      }
    });
  } else {
    const subMenu = document.getElementById('mktSubMenu');
    const chev = document.getElementById('mktChevron');
    if (subMenu) subMenu.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  }

  if (tab === 'products') renderProducts();
  if (tab === 'orders') renderOrders();
  if (tab === 'customers') renderCustomers();
  if (tab === 'marketing') renderMarketing();

  const titles = {
    dashboard: 'الإحصائيات',
    orders: 'الطلبات',
    products: 'المنتجات',
    categories: 'التصنيفات',
    addProduct: 'إضافة منتج',
    settings: 'الإعدادات',
    appearance: 'المظهر والتخطيط',
    marketing: 'التسويق',
    subscription: 'الاشتراك'
  };
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) {
    pageTitleEl.textContent = titles[tab] || 'لوحة التحكم';
  }
}

function toggleMobileMenu() {
  document.getElementById('sidebar').classList.toggle('show');
}

// ===== SETTINGS =====
function loadSettings() {
  var s = JSON.parse(localStorage.getItem('mycart_admin_settings') || '{}');
  if (s.storeName) document.getElementById('storeNameInput') && (document.getElementById('storeNameInput').value = s.storeName);
  if (s.storeTagline) document.getElementById('storeTaglineInput') && (document.getElementById('storeTaglineInput').value = s.storeTagline);
}

function saveSettings() {
  var s = {};
  var nameInput = document.getElementById('storeNameInput');
  var tagInput = document.getElementById('storeTaglineInput');
  if (nameInput) s.storeName = nameInput.value.trim();
  if (tagInput) s.storeTagline = tagInput.value.trim();
  localStorage.setItem('mycart_admin_settings', JSON.stringify(s));
  showAlertModal('✅ تم حفظ الإعدادات');
}

// ===== PRODUCTS (Admin) =====
function exportProductsJSONAdmin() {
  var products = JSON.parse(localStorage.getItem('mycart_products') || '[]');
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  var downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "products_export_" + new Date().toISOString().slice(0,10) + ".json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showAlertModal('📥 تم تصدير كافة المنتجات بنجاح!');
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
          var products = JSON.parse(localStorage.getItem('mycart_products') || '[]');
          var count = 0;
          imported.forEach(function(p) {
            if (p.name && p.price !== undefined) {
              if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 1000);
              if (!p.createdAt) p.createdAt = new Date().toLocaleDateString('ar-EG');
              products.unshift(p);
              count++;
            }
          });
          localStorage.setItem('mycart_products', JSON.stringify(products));
          renderProducts();
          showAlertModal('✅ تم استيراد ' + count + ' منتج بنجاح!');
        } else {
          showAlertModal('⚠️ صيغة ملف JSON غير صحيحة');
        }
      } catch(err) {
        showAlertModal('⚠️ خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function renderProducts() {
  var container = document.getElementById('productsList');
  if (!container) return;
  var products = JSON.parse(localStorage.getItem('mycart_products') || '[]');
  var searchQ = (document.getElementById('adminStandaloneProdSearch')?.value || '').trim().toLowerCase();
  var filtered = searchQ ? products.filter(function(p){ return p.name.toLowerCase().includes(searchQ); }) : products;

  var topBarHtml = '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    + '<div style="font-weight:900;font-size:1.1rem;color:var(--text)">قائمة المنتجات ('+filtered.length+')</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button onclick="exportProductsJSONAdmin()" class="btn-sm" style="padding:6px 14px;background:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-file-export"></i> تصدير JSON</button>'
    + '<button onclick="triggerImportProductsAdmin()" class="btn-sm" style="padding:6px 14px;background:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-file-import"></i> استيراد JSON</button>'
    + '<button onclick="switchTab(\'addProduct\')" class="btn-sm" style="padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit"><i class="fa-solid fa-plus"></i> إضافة منتج جديد</button>'
    + '</div>'
    + '</div>'
    + '<div style="margin-bottom:14px">'
    + '<input type="text" id="adminStandaloneProdSearch" oninput="renderProducts()" value="'+searchQ+'" placeholder="🔍 بحث باسم المنتج..." style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:.85rem;box-sizing:border-box">'
    + '</div>';

  if (!filtered.length) {
    container.innerHTML = topBarHtml + '<div style="text-align:center;color:#94a3b8;padding:40px 20px;background:#fff;border-radius:12px;border:1px solid var(--border)"><i class="fa-solid fa-box-open" style="font-size:2rem;margin-bottom:8px"></i><p>لا توجد منتجات مطابقة للبحث</p></div>';
    if (searchQ) document.getElementById('adminStandaloneProdSearch')?.focus();
    return;
  }

  var listHtml = '<div style="display:flex;flex-direction:column;gap:8px">' + filtered.map(function(p, i){
    const realIdx = products.indexOf(p);
    const addedDate = p.createdAt || p.dateAdded || 'غير محدد';
    const catStr = Array.isArray(p.categories) ? p.categories.join('، ') : (p.category || 'عام');
    const imgUrl = (p.images && p.images[0]) || p.image || 'https://placehold.co/50x50/eee/999?text=📦';
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.03)">'
      + '<img src="'+imgUrl+'" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:1px solid var(--border)">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
      + '<strong style="font-size:.9rem;color:var(--text)">'+p.name+'</strong>'
      + (p.brand ? '<span style="font-size:.68rem;background:rgba(239,68,68,.1);color:var(--accent);padding:1px 6px;border-radius:4px;font-weight:700">['+p.brand+']</span>' : '')
      + (p.featured ? '<span style="font-size:.65rem;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-weight:800">⭐ مميز</span>' : '')
      + '</div>'
      + '<div style="font-size:.72rem;color:var(--text-muted);display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:4px">'
      + '<span style="font-weight:800;color:var(--text)">₪'+(p.price||0)+'</span>'
      + '<span>• التصنيف: '+catStr+'</span>'
      + '<span style="margin-right:auto;color:#64748b;font-size:.68rem"><i class="fa-solid fa-calendar-days" style="margin-left:3px;color:#94a3b8"></i> تاريخ الإضافة: <strong>'+addedDate+'</strong></span>'
      + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px">'
      + '<button onclick="editProduct('+realIdx+')" style="padding:6px 10px;font-size:.75rem;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer;font-weight:700;color:#334155"><i class="fa-solid fa-pen"></i></button>'
      + '<button onclick="deleteProductAdmin('+realIdx+')" style="padding:6px 10px;font-size:.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;cursor:pointer;font-weight:700;color:#ef4444"><i class="fa-solid fa-trash"></i></button>'
      + '</div>'
      + '</div>';
  }).join('') + '</div>';

  container.innerHTML = topBarHtml + listHtml;
  if (searchQ) document.getElementById('adminStandaloneProdSearch')?.focus();
}

function deleteProductAdmin(idx) {
  var products = JSON.parse(localStorage.getItem('mycart_products') || '[]');
  if (!confirm('هل أنت تأكد من حذف المنتج "' + products[idx].name + '"؟')) return;
  products.splice(idx, 1);
  localStorage.setItem('mycart_products', JSON.stringify(products));
  renderProducts();
  showAlertModal('🗑️ تم حذف المنتج بنجاح');
}

function editProduct(idx) {
  showAlertModal('✏️ فتح تعديل المنتج #' + idx);
}

// ===== ORDERS (Admin) =====
function renderOrders() {
  var container = document.getElementById('adminOrdersList');
  if (!container) return;
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  if (!orders.length) { container.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">لا توجد طلبات</td></tr>'; return; }
  container.innerHTML = orders.slice().reverse().map(function(o){ return '<tr onclick="showOrderDetail('+o.id+')" style="cursor:pointer"><td>#ORD-'+String(o.id).slice(-6)+'</td><td>'+(o.customer?.name||'')+'</td><td>₪'+(o.total||0)+'</td><td><span style="background:#eef7e9;color:#3b610c;padding:2px 8px;border-radius:999px;font-size:.7rem;font-weight:700">جديد</span></td><td><button onclick="event.stopPropagation();showOrderDetail('+o.id+')" class="btn-sm" style="padding:4px 10px;font-size:.72rem;background:#e2e8f0;border:none;border-radius:6px;cursor:pointer"><i class="fa-solid fa-eye"></i></button></td></tr>'; }).join('');
}

function showOrderDetail(id) {
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var o = orders.find(function(x){ return x.id === id; });
  if (!o) return;
  var itemsHtml = (o.items||[]).map(function(i){ return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:.8rem"><span>'+i.name+' x'+i.qty+'</span><span>₪'+(i.price*i.qty).toFixed(2)+'</span></div>'; }).join('');
  showAlertModal('<div style="text-align:right;font-size:.82rem;line-height:1.7"><b>👤 '+(o.customer?.name||'')+'</b><br>📱 '+(o.customer?.phone||'')+'<br>📍 '+(o.customer?.city||'')+'<br><br>'+itemsHtml+'<br><b>الإجمالي: ₪'+(o.total||0).toFixed(2)+'</b></div>');
}

// ===== CUSTOMERS (Admin) =====
function renderCustomers() {
  var container = document.getElementById('adminCustomersList');
  if (!container) return;
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var map = {};
  orders.forEach(function(o){ if (o.customer) { var k = o.customer.phone; if (!map[k]) map[k] = { name: o.customer.name, phone: o.customer.phone, orders: 0, total: 0 }; map[k].orders++; map[k].total += o.total || 0; } });
  var customers = Object.values(map);
  if (!customers.length) { container.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:24px">لا يوجد عملاء</td></tr>'; return; }
  container.innerHTML = customers.map(function(c){ return '<tr><td><strong>'+c.name+'</strong></td><td>'+c.phone+'</td><td>'+c.orders+'</td><td>₪'+c.total.toFixed(2)+'</td></tr>'; }).join('');
}

// ===== MARKETING (stubs) =====
function renderMarketing() {}
function saveMarketing() { showAlertModal('✅ تم حفظ إعدادات التسويق'); }
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
function addBanner() { showAlertModal('➕ إضافة بانر جديد'); }
function addSpinSegment() { showAlertModal('➕ إضافة قطاع للعجلة'); }

// ===== DISCOUNT CODES (stubs) =====
function addDiscountCode() { showAlertModal('➕ تمت إضافة كود خصم'); }
function addZone() { showAlertModal('➕ تمت إضافة منطقة توصيل'); }

// ===== CATEGORIES (stubs) =====
function addCategory() { showAlertModal('➕ تمت إضافة تصنيف'); }
function addOption() { showAlertModal('➕ تمت إضافة خيار'); }

// ===== APPEARANCE (stub) =====
function saveAppearance() { showAlertModal('✅ تم حفظ المظهر'); }

// ===== ORDER EDIT (stubs) =====
function openOrderEditModal(id) { showAlertModal('✏️ تعديل الطلب #' + id); }
function closeOrderEditModal() { document.getElementById('orderEditModal').style.display = 'none'; }
function saveOrderEdit() { showAlertModal('✅ تم حفظ التعديلات'); closeOrderEditModal(); }

// ===== PRODUCT PICKER (stubs) =====
function openProductPicker() { document.getElementById('productPickerModal').style.display = 'block'; }
function closeProductPicker() { document.getElementById('productPickerModal').style.display = 'none'; }
function renderPickerProducts() {}

function handleHashChangeAdmin() {
  var hash = (location.hash || '#dashboard').replace('#', '');
  if (!hash) hash = 'dashboard';
  switchTab(hash);
}

// Initialize admin
document.addEventListener('DOMContentLoaded', function(){
  if (localStorage.getItem('mycart_admin_logged') === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';
    initAdmin();
    handleHashChangeAdmin();
  }
});
window.addEventListener('hashchange', handleHashChangeAdmin);
