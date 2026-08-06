// ── Variant Selector Highlight ──────────────────────────────────
(function injectShakeStyle() {
  if (document.getElementById('shakeVariantsStyle')) return;
  const s = document.createElement('style');
  s.id = 'shakeVariantsStyle';
  s.textContent = '@keyframes shakeVariants{0%,100%{transform:translateX(0)}15%{transform:translateX(-7px)}30%{transform:translateX(7px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}';
  (document.head || document.documentElement).appendChild(s);
})();

function highlightVariantSelector() {
  const el = document.getElementById('variantSelector');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.outline = '2px solid var(--accent, #ef4444)';
  el.style.borderRadius = '8px';
  el.style.boxShadow = '0 0 0 6px rgba(239,68,68,0.18)';
  el.style.animation = 'shakeVariants 0.45s ease';
  setTimeout(() => {
    el.style.outline = '';
    el.style.boxShadow = '';
    el.style.animation = '';
  }, 1800);
}

function addFromDetail(el) {
  if (!currentProduct) return;
  const p = currentProduct;
  if (p.type === 'bundle' && p.bundleProducts && p.bundleProducts.length) {
    const anyOut = p.bundleProducts.some(bp => {
      const child = products.find(x => x.id === bp.id);
      return !child || (child.stock !== undefined && child.stock === 0);
    });
    if (anyOut) { showToast('بعض منتجات البكج غير متوفرة', 'error'); return; }
    p.bundleProducts.forEach(bp => {
      const child = products.find(x => x.id === bp.id);
      for (let i = 0; i < (bp.qty || 1) * detailQty; i++) addToCart(child, null, null);
    });
    animateAddToCart(el);
    playSound('add');
    showToast('تمت إضافة البكج للسلة', 'success');
    return;
  }
  if (p.stock === 0) { showToast( __('outOfStock'), 'error'); return; }
  if (p.options && p.options.length) {
    const selectedCount = Object.keys(window._selOptions || {}).length;
    if (p.optionsRequired) {
      // All options must be selected
      const missing = p.options.filter(opt => !window._selOptions[opt.name]);
      if (missing.length > 0) {
        showToast("يرجى اختيار: " + missing.map(o => o.name).join('، '), "error");
        if (typeof highlightVariantSelector === 'function') highlightVariantSelector();
        return;
      }
    } else {
      // At least one option must be selected
      if (selectedCount === 0) {
        showToast("يرجى اختيار خيار على الأقل", "error");
        if (typeof highlightVariantSelector === 'function') highlightVariantSelector();
        return;
      }
    }
    const selected = [];
    currentProduct.options.forEach(opt => {
      const sel = window._selOptions[opt.name];
      if (sel) {
        selected.push({ n: opt.name, v: sel });
      }
    });
    for (let i = 0; i < detailQty; i++) addToCart(currentProduct, null, selected);
  } else {
    for (let i = 0; i < detailQty; i++) addToCart(currentProduct, currentVariant);
  }
  animateAddToCart(el);
  playSound('add');
  var _qd = cart.find(function(x) { return x.id === currentProduct.id && !x.variant; });
  showToast( __('addedToCart') + (_qd && _qd.qty > 1 ? ' ×' + _qd.qty : ''), 'success');
  updateQuickBadge(currentProduct.id, el);
}

function updateQuickBadge(id, el) {
  var target = el;
  if (!target) {
    var card = document.querySelector('[data-id="' + id + '"]');
    if (!card) return;
    target = card.querySelector('.quick-add') || card.querySelector('.flash-add-btn') || card.querySelector('.feat-add');
  }
  if (!target) return;
  if (target.closest('.product-card')) return;
  var c = parseInt(target.dataset.quickQty || '0', 10) + 1;
  target.dataset.quickQty = String(c);
  var existing = target.querySelector('.quick-qty');
  if (existing) {
    existing.textContent = c;
  } else {
    var badge = document.createElement('span');
    badge.className = 'quick-qty';
    badge.textContent = c;
    target.style.position = 'relative';
    target.appendChild(badge);
  }
}

function quickAdd(id, el) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.stock === 0) { showToast( __('outOfStock'), 'error'); return; }
  if ((p.options && p.options.length) || (p.variants && p.variants.length)) {
    showQuickOptionModal(p);
    return;
  }
  if (p.type === 'bundle' && p.bundleProducts && p.bundleProducts.length) {
    const anyOut = p.bundleProducts.some(bp => {
      const child = products.find(x => x.id === bp.id);
      return !child || (child.stock !== undefined && child.stock === 0);
    });
    if (anyOut) { showToast('بعض منتجات البكج غير متوفرة', 'error'); return; }
    p.bundleProducts.forEach(bp => {
      const child = products.find(x => x.id === bp.id);
      for (let i = 0; i < (bp.qty || 1); i++) addToCart(child, null, null);
    });
    animateAddToCart(el); playSound('add'); showToast('تمت إضافة البكج للسلة', 'success');
    return;
  }
  addToCart(p); animateAddToCart(el); playSound('add');
  var _qi = cart.find(function(x) { return x.id === id && !x.variant; });
  showToast( __('addedToCart') + (_qi && _qi.qty > 1 ? ' ×' + _qi.qty : ''), 'success');
  updateQuickBadge(id, el);
}

function openCartSheet() {
  renderCartItems();
  renderOrders();
  // Restore tabs & footer (hidden by thank you)
  const tabs = document.querySelector('.sheet-tabs');
  if (tabs) tabs.style.display = '';
  const footer = document.getElementById('cartSummary');
  if (footer) footer.style.display = '';
  // Reset to cart items tab
  setCartTabActive('items');
  currentCheckoutStep = 0;
  document.getElementById('cartSheet').classList.add('show');
  document.body.style.overflow = 'hidden';
  // Reset to cart items tab
  setCartTabActive('items');
  currentCheckoutStep = 0;
}

function closeCartSheet() {
  document.getElementById('cartSheet').classList.remove('show');
  document.body.style.overflow = '';
}

function addToCart(p, variant, options) {
  const isOptionMode = options && options.length;
  const vLabel = isOptionMode ? options.map(o => o.v).join(' - ') : (variant ? (variant.attrs || []).map(a => a.v).filter(Boolean).join(' - ') : '');
  const vKey = vLabel;
  const existing = cart.find(item => item.id === p.id && (item.variant || '') === vKey);
  if (existing) existing.qty += 1;
  else {
    const offered = typeof calcOfferPrice === 'function' ? calcOfferPrice(p) : null;
    let basePrice = offered !== null ? offered : wPrice(p);
    let optPrice = 0;
    if (isOptionMode && p.options) {
      optPrice = options.reduce((sum, o) => {
        const opt = p.options.find(op => op.name === o.n);
        if (!opt) return sum;
        const val = opt.values.find(v => v.value === o.v);
        let optValPrice = 0;
        if (val) {
          if (isWholesale) {
            optValPrice = parseFloat(val.wholesalePrice) > 0 ? parseFloat(val.wholesalePrice) : Math.round(val.price * 0.85);
          } else {
            optValPrice = val.price;
          }
        }
        return sum + optValPrice;
      }, 0);
    }
    const variantPrice = variant && variant.price ? variant.price : 0;
    
    let finalPrice;
    if (isOptionMode) {
      if (optPrice > 0) {
        let valPrice = optPrice;
        if (offered !== null) {
          const o = typeof getProductOffer === 'function' ? getProductOffer(p) : null;
          if (o) {
            if (o.type === 'percent') valPrice = Math.round(optPrice * (1 - o.value / 100));
            else if (o.type === 'fixed') valPrice = Math.max(0, optPrice - o.value);
          }
        }
        finalPrice = valPrice;
      } else {
        finalPrice = basePrice;
      }
    } else {
      finalPrice = basePrice + variantPrice;
    }
    
    const variantImages = isOptionMode ? [] : (variant ? variant.images || [] : []);
    const firstImg = isOptionMode ? '' : (variantImages[0] || getProductImages(p)[0]);
    cart.push({
      id: p.id,
      name: p.name,
      variant: vKey,
      variantData: isOptionMode ? { attrs: options.map(o => ({ n: o.n, v: o.v })) } : (variant ? { attrs: variant.attrs, images: variant.images } : undefined),
      price: finalPrice,
      image: firstImg || getProductImages(p)[0],
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
  // Pixel tracking: AddToCart
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', { content_name: p.name, content_ids: p.sku ? [p.sku] : [p.id], content_type: 'product', value: p.price, currency: CURRENCY });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'add_to_cart', { currency: CURRENCY, value: p.price, items: [{ id: p.sku || p.id, name: p.name, price: p.price, quantity: 1 }] });
  }
}

function removeFromCart(id, variant) {
  cart = cart.filter(item => !(item.id === id && (item.variant || '') === (variant || '')));
  saveCart();
  renderCartItems();
  updateCartBadge();
  playSound('remove');
}

function changeCartQty(id, delta, variant) {
  const item = cart.find(x => x.id === id && (x.variant || '') === (variant || ''));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id, variant); return; }
  if (delta > 0) playSound('add');
  else if (delta < 0) playSound('remove');
  saveCart();
  renderCartItems();
  updateCartBadge();
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  if (!cart.length) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-bag-shopping"></i><p>${__('emptyCart')}</p></div>`;
    document.getElementById('cartSummary').style.display = 'none';
    const emptyMData = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    const emptyFreeShip = emptyMData.freeShipping?.show || false;
    const emptyContainer = document.getElementById('freeShippingProgressContainer');
    if (emptyContainer) emptyContainer.style.display = emptyFreeShip ? 'block' : 'none';
    return;
  }
  // Only show footer if on cart items tab
  if (currentCheckoutStep === 0) {
    document.getElementById('cartSummary').style.display = 'block';
    const navBtns = document.getElementById('checkoutNavBtns');
    navBtns.innerHTML = `<button class="checkout-btn" onclick="goToCheckout()"><i class="fa-solid fa-arrow-left"></i> ${__('next')}</button>`;
  }
  list.innerHTML = cart.map(item => {
    const escV = (item.variant || '').replace(/'/g, "\\'");
    return `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" onclick="closeCartSheet();openDetail(${item.id})" style="cursor:pointer" title="عرض المنتج">
      <div class="cart-item-info">
        <h4 onclick="closeCartSheet();openDetail(${item.id})" style="cursor:pointer">${item.name}${item.variant ? ` <span style="font-weight:400;color:var(--text-muted);font-size:.75rem">${variantSwatchHtml(item.variantData)}${item.variant}</span>` : ''}</h4>
        <div class="item-price">${CURRENCY}${item.price}${wBadge()}</div>
        <div class="cart-item-qty">
          <button onclick="changeCartQty(${item.id},-1,'${escV}')">-</button>
          <span>${item.qty}</span>
          <button onclick="changeCartQty(${item.id},1,'${escV}')">+</button>
        </div>
      </div>
      <div class="cart-item-remove" onclick="removeFromCart(${item.id},'${escV}')"><i class="fa-solid fa-trash-can"></i></div>
    </div>`;
  }).join('');
  const total = cart.reduce((sum, item) => sum + getVolumeDiscountedPrice(item.price, item.qty), 0);
  // Free Shipping Progress Bar calculation
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const isFreeShipActive = mData.freeShipping?.show || false;
  const goal = mData.freeShipping?.goal || mData.freeShippingGoal || 300;
  const progressText = document.getElementById('freeShippingProgressText');
  const progressGoal = document.getElementById('freeShippingGoalText');
  const progressBar = document.getElementById('freeShippingProgressBar');
  const progressContainer = document.getElementById('freeShippingProgressContainer');
  if (progressContainer) {
    if (isFreeShipActive) {
      progressContainer.style.display = 'block';
      if (progressGoal) progressGoal.textContent = `${CURRENCY}${goal}`;
      const pct = Math.min(100, (total / goal) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) {
        if (total >= goal) {
          progressText.innerHTML = __('freeShippingCongrats');
          if (progressBar) progressBar.style.background = '#10b981';
        } else {
          const remaining = goal - total;
          progressText.innerHTML = __('freeShippingRemaining').replace('{amount}', `${CURRENCY}${remaining}`);
          if (progressBar) progressBar.style.background = 'var(--accent)';
        }
      }
    } else {
      progressContainer.style.display = 'none';
    }
  }
  let discount = 0;
  let discLabelExtra = '';
  if (typeof appliedCoupon !== 'undefined' && appliedCoupon) {
    const disc = (typeof calculateDiscount === 'function') ? calculateDiscount(appliedCoupon, total) : { amount: 0, isFreeShip: false };
    discount = disc.amount || 0;
    if (appliedCoupon.type === CouponType.FIXED) discLabelExtra = ` (كوبون ${appliedCoupon.code})`;
    else if (appliedCoupon.type === CouponType.PERCENT) discLabelExtra = ` (${appliedCoupon.code} - ${appliedCoupon.value}%)`;
    else if (appliedCoupon.type === CouponType.FREESHIP) discLabelExtra = ` (${appliedCoupon.code})`;
  } else if (appliedDiscount > 0) {
    discount = Math.round(total * appliedDiscount / 100);
  }
  if (typeof appliedCoupon !== 'undefined' && appliedCoupon && appliedCoupon._fixedAmount) {
    discount = appliedCoupon._fixedAmount;
  }
  const zoneEl = document.getElementById('custZone');
  const zoneName = zoneEl ? zoneEl.value : '';
  const zones = loadDeliveryZones();
  const zone = zones.find(z => z.name === zoneName);
  let delivery = zone ? zone.price : 0;
  const isCouponFreeShip = (typeof appliedIsFreeShip !== 'undefined' && appliedIsFreeShip) || (typeof appliedCoupon !== 'undefined' && appliedCoupon && appliedCoupon.type === CouponType.FREESHIP);
  if (isCouponFreeShip) {
    delivery = 0;
  } else if (isFreeShipActive && total >= goal) {
    delivery = 0;
  }
  const final = Math.max(0, total - discount + delivery);
  const discRow = document.getElementById('discountRow');
  const discAmt = document.getElementById('cartDiscount');
  const discLbl = document.getElementById('discountRowLabel');
  if (discount > 0) {
    discRow.style.display = 'flex';
    if (discAmt) discAmt.textContent = `-${CURRENCY}${discount.toFixed(2)}`;
    if (discLbl && discLabelExtra) discLbl.textContent = `الخصم ${discLabelExtra}`;
    else if (discLbl) discLbl.textContent = 'الخصم';
  } else if (isCouponFreeShip) {
    discRow.style.display = 'flex';
    if (discAmt) discAmt.textContent = 'مجاني 🎁';
    if (discLbl) discLbl.textContent = `الشحن ${discLabelExtra || ''}`.trim();
  } else {
    discRow.style.display = 'none';
  }
  const delRow = document.getElementById('deliveryRow');
  const delAmt = document.getElementById('cartDelivery');
  const delLbl = document.getElementById('deliveryRowLabel');
  if (delivery > 0) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = `${CURRENCY}${delivery.toFixed(2)}`;
  } else if (isCouponFreeShip) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = 'مجاني 🎁';
    if (delLbl) delLbl.textContent = 'التوصيل (بفضلك الكوبون)';
  } else if (isFreeShipActive && total >= goal) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = 'مجاني 🎁';
    if (delLbl) delLbl.textContent = 'التوصيل (شحن مجاني للطلب)';
  } else {
    delRow.style.display = 'none';
  }
  const cartTotalEl = document.getElementById('cartTotal');
  if (cartTotalEl) cartTotalEl.textContent = `${CURRENCY}${final.toFixed(2)}`;
}

function updateCartBadge() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
  else badge.style.display = 'none';
  document.getElementById('cartCountTab').textContent = count;
}

function loadCustomerForm() {
  let activeCustomer = customer || {};
  if (typeof isWholesale !== 'undefined' && isWholesale) {
    try {
      const wholesaleInfo = JSON.parse(localStorage.getItem('mycart_wholesale_info'));
      if (wholesaleInfo && wholesaleInfo.phone) {
        activeCustomer = wholesaleInfo;
      }
    } catch(e) {}
  }

  if (activeCustomer.name) document.getElementById('custName').value = activeCustomer.name;
  if (activeCustomer.phone) { document.getElementById('custPhone').value = activeCustomer.phone; validatePhone(); }
  if (activeCustomer.phone2 && activeCustomer.phone2.length === 10) {
    const wrap = document.getElementById('phone2Wrap');
    const p2 = document.getElementById('custPhone2');
    const icon = document.getElementById('addPhone2Icon');
    const btn = document.getElementById('addPhone2Btn');
    if (wrap) wrap.style.display = 'block';
    if (p2) { p2.value = activeCustomer.phone2; p2.style.borderColor = '#10b981'; }
    if (icon) icon.className = 'fa-solid fa-xmark';
    if (btn) btn.style.color = '#6b7280';
  }
  if (activeCustomer.city) document.getElementById('custCity').value = activeCustomer.city;
  if (activeCustomer.address) document.getElementById('custAddress').value = activeCustomer.address;
  if (activeCustomer.addr && !activeCustomer.address) document.getElementById('custAddress').value = activeCustomer.addr;
}

function loadDeliveryZones() {
  const raw = localStorage.getItem('mycart_delivery_zones');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch(e) {}
  }
  return [ { name: 'الضفة', price: 20 }, { name: 'القدس', price: 30 }, { name: 'الداخل', price: 70 } ];
}

function saveDeliveryZones(zones) {
  try { localStorage.setItem('mycart_delivery_zones', JSON.stringify(zones)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); }
}

function getVolumeDiscountedPrice(basePrice, qty) {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!mData.volumeDiscount?.show) return basePrice * qty;

  const type = mData.volumeDiscount.type || 'percent';

  if (type === 'bogo') {
    const buy = mData.volumeDiscount.bogoBuy || 2;
    const get = mData.volumeDiscount.bogoGet || 1;
    const groupSize = buy + get;
    const freeGroups = Math.floor(qty / groupSize);
    const paidQty = qty - (freeGroups * get);
    return basePrice * paidQty;
  }

  if (type === 'fixed') {
    const disc2 = mData.volumeDiscount.disc2 || 5;
    const disc3 = mData.volumeDiscount.disc3 || 10;
    if (qty >= 3) {
      return Math.max(0, (basePrice - disc3) * qty);
    }
    if (qty >= 2) {
      return Math.max(0, (basePrice - disc2) * qty);
    }
    return basePrice * qty;
  }

  // default 'percent'
  if (qty >= 3) {
    const disc = (mData.volumeDiscount.disc3 || 10) / 100;
    return Math.round(basePrice * qty * (1 - disc));
  }
  if (qty >= 2) {
    const disc = (mData.volumeDiscount.disc2 || 5) / 100;
    return Math.round(basePrice * qty * (1 - disc));
  }
  return basePrice * qty;
}

function addToCartWithPrice(p, customPrice) {
  if ((p.options && p.options.length) || (p.variants && p.variants.length)) {
    window._customBundlePrice = customPrice;
    showQuickOptionModal(p);
    return;
  }
  let img = Array.isArray(p.images) ? p.images[0] : p.image;
  const item = {
    id: p.id,
    name: p.name,
    price: customPrice,
    image: img,
    qty: 1,
    variant: ''
  };
  const existing = cart.find(x => x.id === p.id && x.variant === '');
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push(item);
  }
  saveCart();
  renderCartItems();
  updateCartBadge();
}

// --- FAST7 QUICK OPTION/VARIANT SELECTION MODAL ---
window._selQoOptions = {};
window._currentQoProduct = null;
window._qoQty = 1;
window._selQoVariantIdx = 0;

function showQuickOptionModal(p) {
  window._currentQoProduct = p;
  window._selQoOptions = {};
  window._qoQty = 1;
  window._selQoVariantIdx = 0;
  
  let modal = document.getElementById('quickOptionModal');
  if (!modal) {
    const div = document.createElement('div');
    div.id = 'quickOptionModal';
    div.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;font-family:inherit;';
    div.innerHTML = `
      <div class="backdrop" onclick="closeQuickOptionModal()" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);transition:opacity 0.3s ease;opacity:0;"></div>
      <div class="sheet" style="position:absolute;left:0;right:0;bottom:0;max-width:540px;margin:0 auto;background:var(--card,#ffffff);border-radius:24px 24px 0 0;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);box-shadow:0 -10px 40px rgba(0,0,0,0.15);overflow:hidden;">
        <div class="sheet-grabber" style="width:40px;height:4px;background:var(--border,#e2e8f0);border-radius:2px;margin:12px auto 6px;flex-shrink:0;"></div>
        <div class="sheet-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border,rgba(0,0,0,0.06));flex-shrink:0;">
          <h3 id="qoModalTitle" style="margin:0;font-size:0.95rem;font-weight:800;color:var(--text,#1e293b);">اختر الخيارات</h3>
          <button type="button" onclick="closeQuickOptionModal()" style="border:none;background:none;font-size:1.25rem;cursor:pointer;color:var(--text-muted,#64748b);line-height:1;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="sheet-body" style="padding:20px;overflow-y:auto;flex:1;direction:rtl;text-align:right;">
          <div id="qoProductHeader" style="display:flex;gap:16px;margin-bottom:20px;border-bottom:1px dashed var(--border,rgba(0,0,0,0.06));padding-bottom:16px;">
            <img id="qoProductImg" src="" style="width:75px;height:75px;object-fit:cover;border-radius:12px;border:1px solid var(--border,rgba(0,0,0,0.05));box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;flex-direction:column;justify-content:center;min-width:0;">
              <h4 id="qoProductName" style="margin:0 0 6px;font-size:0.9rem;font-weight:800;color:var(--text,#1e293b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></h4>
              <span id="qoProductPrice" style="font-size:1.15rem;font-weight:900;color:var(--accent,#ef4444);"></span>
            </div>
          </div>
          <div id="qoOptionsContainer"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:24px;border-top:1px solid var(--border,rgba(0,0,0,0.06));padding-top:16px;">
            <span style="font-size:0.8rem;font-weight:800;color:var(--text,#1e293b);">الكمية:</span>
            <div style="display:flex;align-items:center;gap:12px;">
              <button type="button" onclick="changeQoQty(-1)" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--border,rgba(0,0,0,0.1));background:var(--bg,#f8fafc);color:var(--text,#1e293b);font-weight:800;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">-</button>
              <span id="qoQtyVal" style="font-weight:800;font-size:1.05rem;min-width:18px;text-align:center;color:var(--text,#1e293b);">1</span>
              <button type="button" onclick="changeQoQty(1)" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--border,rgba(0,0,0,0.1));background:var(--bg,#f8fafc);color:var(--text,#1e293b);font-weight:800;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">+</button>
            </div>
          </div>
          <button id="qoAddBtn" type="button" onclick="addQoToCart()" style="width:100%;margin-top:20px;padding:14px;border:none;background:var(--accent,#ef4444);color:#fff;font-weight:800;font-size:0.9rem;border-radius:14px;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.25);font-family:inherit;transition:all 0.2s;">إضافة للسلة</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modal = div;
  }
  
  document.getElementById('qoProductName').textContent = p.name;
  document.getElementById('qoProductImg').src = getProductImages(p)[0];
  document.getElementById('qoQtyVal').textContent = '1';
  
  let optsContainer = document.getElementById('qoOptionsContainer');
  optsContainer.innerHTML = '';
  
  if (p.options && p.options.length) {
    optsContainer.innerHTML = p.options.map(opt => {
      const btns = opt.values.map((v, vi) => {
        const isImgOpt = opt.type === 'image';
        const swatch = opt.type==='color' ? `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${v.extra||'#ccc'};border:1px solid var(--border,rgba(0,0,0,0.1));vertical-align:middle;margin-left:4px"></span>` : isImgOpt && v.extra ? `<img src="${v.extra}" style="width:50px;height:50px;border-radius:8px;object-fit:contain;border:1px solid var(--border,rgba(0,0,0,0.1));display:block;margin:0 auto 4px;">` : '';
        const priceLabel = '';
        const out = v.stock === 0 ? 'disabled' : '';
        const isFirst = vi === 0 && !out;
        if (isFirst) {
          window._selQoOptions[opt.name] = v.value;
        }
        const selectedStyle = isFirst ? 'padding:6px 12px;border:1.5px solid var(--accent);background:rgba(239,68,68,0.05);color:var(--accent);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;' : 'padding:6px 12px;border:1px solid var(--border,rgba(0,0,0,0.1));background:#fff;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;';
        if (isImgOpt) {
          const imgSelectedStyle = isFirst ? 'padding:6px 8px;border:1.5px solid var(--accent);background:rgba(239,68,68,0.05);color:var(--accent);border-radius:10px;font-size:0.72rem;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:68px;transition:all 0.2s;font-family:inherit;outline:none;' : 'padding:6px 8px;border:1px solid var(--border,rgba(0,0,0,0.1));background:#fff;border-radius:10px;font-size:0.72rem;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;min-width:68px;transition:all 0.2s;font-family:inherit;outline:none;';
          return `<button type="button" class="qo-variant-btn" data-opt="${opt.name}" data-val="${v.value}" onclick="selectQoOption(this,'${opt.name}','${v.value}')" ${out} style="${imgSelectedStyle}">
            ${swatch}<span style="text-align:center;line-height:1.2;">${v.value}${v.stock===0?' (نفذ)':''}</span>
          </button>`;
        }
        return `<button type="button" class="qo-variant-btn" data-opt="${opt.name}" data-val="${v.value}" onclick="selectQoOption(this,'${opt.name}','${v.value}')" ${out} style="${selectedStyle}">
          ${swatch} ${v.value}${priceLabel}${v.stock===0?' (نفذ)':''}
        </button>`;
      }).join('');
      return `<div class="qo-option-group" style="margin-bottom:14px"><div style="font-size:0.78rem;font-weight:800;margin-bottom:6px;color:var(--text,#1e293b);">${opt.name}</div><div style="display:flex;flex-wrap:wrap;gap:6px">${btns}</div></div>`;
    }).join('');
  } else if (p.variants && p.variants.length) {
    window._selQoVariantIdx = 0;
    optsContainer.innerHTML = p.variants.map((v, i) => {
      const varPrice = '';
      const disabled = v.stock === 0 ? 'disabled' : '';
      const label = (v.attrs || []).map(a => a.v).filter(Boolean).join(' - ');
      return `<button type="button" class="qo-variant-btn" data-idx="${i}" onclick="selectQoVariant(this, ${i})" ${disabled} style="padding:6px 12px;border:1px solid var(--border,rgba(0,0,0,0.1));background:#fff;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;margin-bottom:6px;width:100%;justify-content:right;">
        ${label}${varPrice}${v.stock === 0 ? ' (نفذ)' : ''}
      </button>`;
    }).join('');
    const firstBtn = optsContainer.querySelector(`.qo-variant-btn[data-idx="0"]`);
    if (firstBtn && !firstBtn.disabled) firstBtn.style.cssText = 'padding:6px 12px;border:1.5px solid var(--accent);background:rgba(239,68,68,0.05);color:var(--accent);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;margin-bottom:6px;width:100%;justify-content:right;';
  }
  
  updateQoPrice();
  
  modal.style.display = 'block';
  setTimeout(() => {
    modal.querySelector('.backdrop').style.opacity = '1';
    modal.querySelector('.sheet').style.transform = 'translateY(0)';
  }, 10);
  document.body.style.overflow = 'hidden';
}

function closeQuickOptionModal() {
  const modal = document.getElementById('quickOptionModal');
  if (modal) {
    modal.querySelector('.backdrop').style.opacity = '0';
    modal.querySelector('.sheet').style.transform = 'translateY(100%)';
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 400);
  }
}

function selectQoOption(btn, optName, val) {
  const p = window._currentQoProduct;
  const unselectedStyle = 'padding:6px 12px;border:1px solid var(--border,rgba(0,0,0,0.1));background:#fff;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;';
  const selectedStyle = 'padding:6px 12px;border:1.5px solid var(--accent);background:rgba(239,68,68,0.05);color:var(--accent);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;';
  // Toggle off if already selected and not required
  if (window._selQoOptions[optName] === val && !(p && p.optionsRequired)) {
    document.querySelectorAll(`.qo-variant-btn[data-opt="${optName}"]`).forEach(b => { b.style.cssText = unselectedStyle; });
    delete window._selQoOptions[optName];
    updateQoPrice();
    return;
  }
  document.querySelectorAll(`.qo-variant-btn[data-opt="${optName}"]`).forEach(b => { b.style.cssText = unselectedStyle; });
  btn.style.cssText = selectedStyle;
  window._selQoOptions[optName] = val;
  updateQoPrice();
}

function selectQoVariant(btn, idx) {
  document.querySelectorAll(`.qo-variant-btn`).forEach(b => {
    b.style.cssText = 'padding:6px 12px;border:1px solid var(--border,rgba(0,0,0,0.1));background:#fff;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;margin-bottom:6px;width:100%;justify-content:right;';
  });
  btn.style.cssText = 'padding:6px 12px;border:1.5px solid var(--accent);background:rgba(239,68,68,0.05);color:var(--accent);border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;font-family:inherit;outline:none;margin-bottom:6px;width:100%;justify-content:right;';
  window._selQoVariantIdx = idx;
  updateQoPrice();
}

function changeQoQty(delta) {
  let newQty = window._qoQty + delta;
  if (newQty < 1) newQty = 1;
  window._qoQty = newQty;
  document.getElementById('qoQtyVal').textContent = newQty;
}

function updateQoPrice() {
  const p = window._currentQoProduct;
  if (!p) return;
  
  let total = 0;
  if (p.options && p.options.length) {
    const totalExtra = p.options.reduce((sum, opt) => {
      const sel = window._selQoOptions[opt.name];
      const val = opt.values.find(v => v.value === sel);
      return sum + (val ? val.price : 0);
    }, 0);
    let base = totalExtra > 0 ? totalExtra : wPrice(p);
    if (base <= 0) {
      for (const opt of p.options) {
        const firstVal = opt.values[0];
        if (firstVal && firstVal.price > 0) {
          base = firstVal.price;
          break;
        }
      }
    }
    const offerPrice = calcOfferPrice(p);
    let finalBase = base;
    if (offerPrice !== null) {
      const o = getProductOffer(p);
      if (o && totalExtra > 0) {
        if (o.type === 'percent') finalBase = Math.round(totalExtra * (1 - o.value / 100));
        else if (o.type === 'fixed') finalBase = Math.max(0, totalExtra - o.value);
      } else {
        finalBase = offerPrice;
      }
    }
    total = finalBase;
  } else if (p.variants && p.variants.length) {
    const v = p.variants[window._selQoVariantIdx];
    const base = v.price ? v.price : wPrice(p);
    const offerPrice = calcOfferPrice(p);
    let finalBase = base;
    if (offerPrice !== null) {
      const o = getProductOffer(p);
      if (o && v.price) {
        if (o.type === 'percent') finalBase = Math.round(v.price * (1 - o.value / 100));
        else if (o.type === 'fixed') finalBase = Math.max(0, v.price - o.value);
      } else {
        finalBase = offerPrice;
      }
    }
    total = finalBase;
  }
  
  document.getElementById('qoProductPrice').textContent = `${CURRENCY}${total}`;
}

function addQoToCart() {
  const p = window._currentQoProduct;
  if (!p) return;
  let customBundlePrice = window._customBundlePrice;
  window._customBundlePrice = null;
  
  if (p.options && p.options.length) {
    const qoSelectedCount = Object.keys(window._selQoOptions || {}).length;
    if (p.optionsRequired) {
      const missing = p.options.filter(opt => !window._selQoOptions[opt.name]);
      if (missing.length > 0) {
        showToast("يرجى اختيار: " + missing.map(o => o.name).join('، '), "error");
        highlightQoError();
        return;
      }
    } else {
      if (qoSelectedCount === 0) {
        showToast("يرجى اختيار خيار على الأقل", "error");
        highlightQoError();
        return;
      }
    }
    const selected = [];
    let optionPrice = 0;
    p.options.forEach(opt => {
      const sel = window._selQoOptions[opt.name];
      if (sel) {
        selected.push({ n: opt.name, v: sel });
        const val = opt.values.find(v => v.value === sel);
        if (val && val.price > 0) optionPrice += val.price;
      }
    });
    if (optionPrice > 0 && customBundlePrice !== null && customBundlePrice !== undefined) {
      const marketingData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
      const discVal = marketingData.fbt?.discount || 10;
      const discType = marketingData.fbt?.discountType || 'percent';
      if (discType === 'fixed') {
        const totalOrig = window._fbtBundleItems.reduce((s, item) => s + item.price, 0);
        customBundlePrice = totalOrig > 0 ? Math.round(optionPrice - (discVal * (optionPrice / totalOrig))) : optionPrice;
      } else {
        customBundlePrice = Math.round(optionPrice * (1 - (discVal / 100)));
      }
    }
    if (customBundlePrice === null || customBundlePrice === undefined) {
      customBundlePrice = optionPrice > 0 ? optionPrice : getCardPrice(p);
    }
    for (let i = 0; i < window._qoQty; i++) {
      addToCartWithBundlePrice(p, null, selected, Math.max(0, customBundlePrice));
    }
  } else if (p.variants && p.variants.length) {
    const variant = p.variants[window._selQoVariantIdx];
    if (customBundlePrice === null || customBundlePrice === undefined) {
      customBundlePrice = variant && variant.price ? variant.price : getCardPrice(p);
    }
    for (let i = 0; i < window._qoQty; i++) {
      addToCartWithBundlePrice(p, variant, null, Math.max(0, customBundlePrice));
    }
  }
  
  closeQuickOptionModal();
  playSound('add');
  showToast(__('addedToCart'), 'success');
  if (window._bundleItemsQueue && window._bundleItemsQueue.length > 0) {
    setTimeout(function() { processNextBundleItem(); }, 300);
  }
}

function highlightQoError() {
  const qoContainer = document.getElementById('qoOptionsContainer');
  if (qoContainer) {
    qoContainer.style.outline = '2px solid var(--accent,#ef4444)';
    qoContainer.style.borderRadius = '8px';
    qoContainer.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.15)';
    qoContainer.style.animation = 'shakeVariants 0.4s ease';
    setTimeout(() => { qoContainer.style.outline=''; qoContainer.style.boxShadow=''; qoContainer.style.animation=''; }, 1800);
  }
}

function addToCartWithBundlePrice(p, variant, options, bundlePrice) {
  const isOptionMode = options && options.length;
  const vLabel = isOptionMode ? options.map(o => o.v).join(' - ') : (variant ? (variant.attrs || []).map(a => a.v).filter(Boolean).join(' - ') : '');
  const vKey = vLabel;
  const existing = cart.find(item => item.id === p.id && (item.variant || '') === vKey);
  if (existing) {
    existing.qty += 1;
  } else {
    let img = Array.isArray(p.images) ? p.images[0] : p.image;
    const variantImages = isOptionMode ? [] : (variant ? variant.images || [] : []);
    const firstImg = isOptionMode ? img : (variantImages[0] || getProductImages(p)[0]);
    cart.push({
      id: p.id,
      name: p.name,
      price: bundlePrice,
      image: firstImg || img,
      qty: 1,
      variant: vLabel,
      variantData: variant || null
    });
  }
  saveCart();
  renderCartItems();
  updateCartBadge();
}
