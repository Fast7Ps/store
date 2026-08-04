function initPromoPopup() {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const pp = mData.promoPopup;
  if (!pp?.show) return;
  if (sessionStorage.getItem('promoPopupShown')) return;
  const delayMs = (parseInt(pp.delay) || 3) * 1000;
  setTimeout(() => {
    const modal = document.getElementById('promoPopupModal');
    if (!modal) return;
    renderPromoPopup(pp, modal);
    modal.style.display = 'flex';
    sessionStorage.setItem('promoPopupShown', '1');
  }, delayMs);
}

function renderPromoPopup(pp, modal) {
  if (!modal) modal = document.getElementById('promoPopupModal');
  if (!modal) return;
  const type = pp.type || 'discount';
  // Reset classes
  modal.className = 'promo-popup-modal';
  modal.classList.add('pp-position-' + (pp.position || 'center'));
  modal.classList.add('pp-size-' + (pp.size || 'medium'));
  modal.classList.add('pp-type-' + type);
  modal.classList.add('pp-anim-' + (pp.animation || 'bounce'));
  if (pp.bgColor) modal.querySelector('.promo-popup-content').style.background = pp.bgColor;
  if (pp.textColor) {
    modal.querySelector('.promo-popup-content h3').style.color = pp.textColor;
    modal.querySelector('.promo-popup-content p').style.color = pp.textColor + 'cc';
  }

  // Custom HTML overrides everything
  const customDiv = document.getElementById('ppCustomHtml');
  const defaultDiv = document.getElementById('ppDefaultContent');
  if (type === 'custom' && pp.customHtml) {
    if (customDiv) { customDiv.innerHTML = pp.customHtml; customDiv.style.display = 'block'; }
    if (defaultDiv) defaultDiv.style.display = 'none';
  } else {
    if (customDiv) customDiv.style.display = 'none';
    if (defaultDiv) defaultDiv.style.display = 'block';
  }

  // Title - only show if user provided one
  const titleEl = document.getElementById('promoPopupTitle');
  if (type !== 'custom' || !pp.customHtml) {
    if (pp.title) {
      titleEl.textContent = pp.title;
      titleEl.style.display = 'block';
    } else {
      const titleMap = { discount: 'عرض خاص لفترة محدودة!', announcement: 'إعلان مهم', newsletter: 'اشترك واحصل على خصم!', sale: 'تخفيضات لا تفوت!', custom: 'مرحباً بك في متجرنا!', newarrival: '🔖 وصل حديثاً!', halfprice: '💰 نصف السعر!' };
      titleEl.textContent = titleMap[type] || titleMap.discount;
      titleEl.style.display = 'block';
    }
  }
  // Text - hide if empty
  const textEl = document.getElementById('promoPopupText');
  if (type !== 'custom' || !pp.customHtml) {
    if (pp.text) {
      textEl.textContent = pp.text;
      textEl.style.display = 'block';
    } else { textEl.style.display = 'none'; }
  }
  // Image
  const imgEl = document.getElementById('promoPopupImage');
  const iconEl = document.getElementById('promoPopupIcon');
  if (pp.image && imgEl) {
    imgEl.src = pp.image; imgEl.style.display = 'block';
    if (iconEl) iconEl.style.display = 'none';
  } else { if (imgEl) imgEl.style.display = 'none'; if (iconEl) iconEl.style.display = 'block'; }
  // Icon per type (or custom icon)
  const iconMap = { discount: 'fa-tag', announcement: 'fa-bullhorn', newsletter: 'fa-envelope-open-text', sale: 'fa-fire', custom: 'fa-gift', newarrival: 'fa-gem', halfprice: 'fa-bolt' };
  const ic = iconEl?.querySelector('i');
  if (ic) ic.className = 'fa-solid ' + (pp.customIcon || iconMap[type] || 'fa-gift');
  // Discount badge
  const badge = document.getElementById('ppDiscountBadge');
  if (badge) {
    if ((type === 'discount' || type === 'sale' || type === 'halfprice') && pp.discountPercent) {
      badge.textContent = '-' + pp.discountPercent + '%';
      badge.style.display = 'block';
    } else { badge.style.display = 'none'; }
  }
  // Code box - only for discount type with code
  const codeBox = document.getElementById('promoCodeBox');
  const copyHint = document.getElementById('promoCopyHint');
  if (pp.code) {
    document.getElementById('promoPopupCode').textContent = pp.code;
    if (codeBox) codeBox.style.display = 'flex';
    if (copyHint) copyHint.style.display = 'block';
  } else { if (codeBox) codeBox.style.display = 'none'; if (copyHint) copyHint.style.display = 'none'; }
  // Accent color
  const accent = pp.accentColor || pp.color || '#ef4444';
  const contentEl = document.getElementById('promoPopupContent');
  if (contentEl) {
    contentEl.style.setProperty('--accent', accent);
    if (!pp.bgColor) contentEl.style.background = '';
  }
  // Timer badge (for type 'sale')
  const timerBadge = document.getElementById('ppTimerBadge');
  if (timerBadge) {
    if ((type === 'sale' || type === 'halfprice') && pp.expiresAt && pp.expiresAt > Date.now()) {
      const diff = pp.expiresAt - Date.now();
      const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
      timerBadge.textContent = '⏰ ' + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      timerBadge.style.display = 'inline-flex';
      clearInterval(timerBadge._int);
      timerBadge._int = setInterval(() => {
        const d = pp.expiresAt - Date.now();
        if (d <= 0) { timerBadge.textContent = '⏰ انتهى الوقت!'; clearInterval(timerBadge._int); return; }
        timerBadge.textContent = '⏰ ' + String(Math.floor(d/3600000)).padStart(2,'0') + ':' + String(Math.floor((d%3600000)/60000)).padStart(2,'0') + ':' + String(Math.floor((d%60000)/1000)).padStart(2,'0');
      }, 1000);
    } else { timerBadge.style.display = 'none'; }
  }
  // Newsletter form
  const nlForm = document.getElementById('ppNewsletterForm');
  if (nlForm) {
    if (type === 'newsletter') {
      nlForm.style.display = 'flex';
      const nlBtn = document.getElementById('ppNewsletterBtn');
      if (nlBtn) {
        nlBtn.style.background = accent;
        nlBtn.onclick = (e) => { e.preventDefault();
          const email = document.getElementById('ppNewsletterEmail')?.value.trim();
          if (email) { showToast('✅ تم الاشتراك بنجاح!', 'success'); closePromoPopup(); }
          else alert('أدخل بريدك الإلكتروني'); };
      }
    } else { nlForm.style.display = 'none'; }
  }
  // Action button - only if user provided BOTH btnText AND btnLink
  const btnEl = document.getElementById('promoPopupBtn');
  if (btnEl) {
    if (pp.btnText && pp.btnLink) {
      btnEl.textContent = pp.btnText;
      btnEl.href = pp.btnLink;
      btnEl.style.display = 'inline-block';
      btnEl.style.background = pp.btnBg || accent;
      btnEl.style.color = pp.btnColor || '#ffffff';
    } else { btnEl.style.display = 'none'; }
  }
  // Expiry countdown on code
  const timerDiv = document.getElementById('promoPopupTimer');
  if (timerDiv) {
    if (pp.code && pp.expiresAt && pp.expiresAt > Date.now()) {
      clearInterval(timerDiv._int);
      const tick = () => {
        const d = pp.expiresAt - Date.now();
        if (d <= 0) { timerDiv.textContent = 'انتهت صلاحية الكود'; clearInterval(timerDiv._int); return; }
        timerDiv.textContent = '⏰ ' + String(Math.floor(d/3600000)).padStart(2,'0') + ':' + String(Math.floor((d%3600000)/60000)).padStart(2,'0') + ':' + String(Math.floor((d%60000)/1000)).padStart(2,'0') + ' متبقي لاستخدام الكود';
      };
      tick(); timerDiv.style.display = 'block';
      timerDiv._int = setInterval(tick, 1000);
    } else { clearInterval(timerDiv._int); timerDiv.style.display = 'none'; }
  }
  // Expiry warning
  const expWarn = document.getElementById('ppExpiryWarning');
  if (expWarn) {
    if (pp.expiresAt && pp.expiresAt > Date.now()) {
      expWarn.style.display = 'block';
    } else { expWarn.style.display = 'none'; }
  }
  // Show close button
  const closeBtn = modal.querySelector('.promo-popup-close');
  if (closeBtn) closeBtn.style.display = pp.showClose !== false ? 'flex' : 'none';
  // Close on outside click
  if (pp.closeOutside !== false) {
    modal.onclick = (e) => { if (e.target === modal) closePromoPopup(); };
  } else { modal.onclick = null; }
}

function closePromoPopup() {
  const modal = document.getElementById('promoPopupModal');
  if (!modal) return;
  modal.classList.add('hide');
  setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('hide'); }, 250);
}

var _spTimer = null;
var _flashTimer = null;
var _liveViewersInterval = null;

function initSocialProof() {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!mData.socialProof?.show || !products.length) return;
  if (_spTimer) clearInterval(_spTimer);
  _spTimer = setInterval(() => showSocialProofToast(), 15000);
  setTimeout(() => showSocialProofToast(), 5000);
}

function showSocialProofToast() {
  let toast = document.getElementById('socialProofToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'socialProofToast';
    toast.className = 'social-proof-toast';
    document.body.appendChild(toast);
  }
  if (!products || !products.length) return;
  const randomProduct = products[Math.floor(Math.random() * products.length)];
  const names = ['أحمد', 'محمد', 'سارة', 'علي', 'خالد', 'فاطمة', 'نور', 'عمر', 'ريم', 'يوسف'];
  const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'دبي', 'أبوظبي', 'عمان', 'الكويت'];
  const name = names[Math.floor(Math.random() * names.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const timeAgo = Math.floor(Math.random() * 15) + 1;
  const img = Array.isArray(randomProduct.images) ? randomProduct.images[0] : randomProduct.image;

  toast.innerHTML = `
    <img src="${img}" alt="${randomProduct.name}">
    <div>
      <strong>${name} من ${city}</strong>
      <span>قام بشراء ${randomProduct.name}</span>
      <small>قبل ${timeAgo} دقيقة</small>
    </div>
  `;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

function loadProductReviews(productId) {
  const allReviews = JSON.parse(localStorage.getItem('mycart_reviews') || '{}');
  const reviews = allReviews[productId] || [];
  const listEl = document.getElementById('reviewsList');
  const countEl = document.getElementById('reviewsCount');
  const avgEl = document.getElementById('ratingAvg');
  const starsEl = document.getElementById('ratingStars');
  if (!listEl) return;
  countEl.textContent = reviews.length;
  if (reviews.length) {
    const avg = (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1);
    avgEl.textContent = avg;
    starsEl.textContent = '⭐'.repeat(Math.round(avg));
    listEl.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-author">${r.name}</span>
          <span class="review-stars">${'⭐'.repeat(r.stars)}</span>
        </div>
        <div class="review-text">${r.comment}</div>
      </div>
    `).join('');
  } else {
    avgEl.textContent = '-';
    starsEl.textContent = '☆☆☆☆☆';
    listEl.innerHTML = '<p style="font-size:.8rem;color:var(--text-muted);text-align:center;padding:10px">لا توجد تقييمات بعد، كن أول من يقيّم!</p>';
  }
}

function renderWheelLabels(wheel, rawSegs) {
  if (!wheel) return;
  const count = rawSegs.length;
  const segDeg = 360 / count;

  // Rebuild conic-gradient
  const gradParts = rawSegs.map((s, i) => {
    const from = i * segDeg;
    const to = from + segDeg;
    return `${s.color || '#ef4444'} ${from}deg ${to}deg`;
  });
  wheel.style.background = `conic-gradient(${gradParts.join(', ')})`;

  // Remove all old labels (both initial HTML spans and dynamic wheel-labels)
  wheel.querySelectorAll('span').forEach(el => el.remove());

  rawSegs.forEach((s, i) => {
    const midAngle = i * segDeg + segDeg / 2;
    const span = document.createElement('span');
    span.className = 'wheel-label';
    span.textContent = s.label;
    span.style.cssText = `position:absolute;top:18px;left:70px;width:120px;text-align:center;transform:rotate(${midAngle}deg);transform-origin:50% 112px;font-weight:800;color:#fff;font-size:0.72rem;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.5);pointer-events:none;user-select:none;`;
    wheel.appendChild(span);
  });
}

function initSpinWin() {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!mData.spinWin?.show) return;
  if (sessionStorage.getItem('spinWinShown')) return;
  setTimeout(() => {
    const modal = document.getElementById('spinWinModal');
    const wheel = document.getElementById('luckyWheel');
    if (wheel) {
      const rawSegs = mData.spinWin?.segments?.length
        ? mData.spinWin.segments
        : [
            { label: 'خصم 5%', type: 'discount', percent: 5, code: 'LUCKY5', color: '#ff5e62' },
            { label: 'خصم 10%', type: 'discount', percent: 10, code: 'LUCKY10', color: '#ff9966' },
            { label: 'حظ سعيد', type: 'none', percent: 0, code: '', color: '#94a3b8' },
            { label: 'خصم 15%', type: 'discount', percent: 15, code: 'LUCKY15', color: '#ff5e62' },
            { label: 'شحن مجاني', type: 'freeship', percent: 0, code: 'FREESHIP', color: '#38ef7d' }
          ];
      renderWheelLabels(wheel, rawSegs);
    }
    if (modal) modal.style.display = 'flex';
  }, 6000);
}

function closeSpinWin() {
  const modal = document.getElementById('spinWinModal');
  if (modal) modal.style.display = 'none';
  sessionStorage.setItem('spinWinShown', '1');
}

var _wheelSpinning = false;
function spinWheel() {
  if (_wheelSpinning) return;
  _wheelSpinning = true;
  const wheel = document.getElementById('luckyWheel');
  const btn = document.getElementById('spinBtn');
  const resultDiv = document.getElementById('spinResult');
  if (!wheel || !btn) return;
  btn.disabled = true;

  // Load segments from marketing data (fall back to defaults)
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const rawSegs = mData.spinWin?.segments?.length
    ? mData.spinWin.segments
    : [
        { label: 'خصم 5%', type: 'discount', percent: 5, code: 'LUCKY5', color: '#ff5e62' },
        { label: 'خصم 10%', type: 'discount', percent: 10, code: 'LUCKY10', color: '#ff9966' },
        { label: 'حظ سعيد', type: 'none', percent: 0, code: '', color: '#94a3b8' },
        { label: 'خصم 15%', type: 'discount', percent: 15, code: 'LUCKY15', color: '#ff5e62' },
        { label: 'شحن مجاني', type: 'freeship', percent: 0, code: 'FREESHIP', color: '#38ef7d' }
      ];

  const count = rawSegs.length;
  const segDeg = 360 / count;

  // Rebuild conic-gradient and text labels dynamically
  renderWheelLabels(wheel, rawSegs);

  // Pick a random winner
  const chosenIndex = Math.floor(Math.random() * count);
  const chosen = rawSegs[chosenIndex];
  const chosenMidDeg = chosenIndex * segDeg + segDeg / 2;

  // Spin: 5 full rotations + align chosen segment to top pointer
  const totalDeg = (360 * 5) + (360 - chosenMidDeg);
  wheel.style.transform = `rotate(${totalDeg}deg)`;

  setTimeout(() => {
    _wheelSpinning = false;
    btn.disabled = false;
    if (resultDiv) {
      resultDiv.style.display = 'block';
      if (chosen.type === 'discount' && chosen.percent > 0 && chosen.code) {
        let timerHtml = '';
        const expiresAt = chosen.expiresAt || 0;
        if (expiresAt && expiresAt > 0) {
          const diff = expiresAt - Date.now();
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timerHtml = `<br><span style="font-size:.8rem;color:#d97706;font-weight:700">⚠ ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} متبقي لاستخدام الكود (استخدمها أو اخسرها!)</span>`;
          } else {
            timerHtml = `<br><span style="font-size:.8rem;color:#ef4444;font-weight:700">انتهت صلاحية هذا الكود</span>`;
          }
        }
        resultDiv.innerHTML = `🎉 مبروك! فزت بـ ${chosen.label}<br>كود الخصم: <strong style="font-size:1.2rem;letter-spacing:1px">${chosen.code}</strong> (تم تطبيقه تلقائياً)${timerHtml}`;
        const nowTs = Date.now();
        const wheelCpn = typeof addCoupon === 'function' ? addCoupon({
          code: chosen.code,
          type: CouponType.PERCENT,
          value: chosen.percent,
          description: 'جائزة العجلة - استخدمها أو اخسرها!',
          startDate: nowTs,
          endDate: chosen.expiresAt || 0,
          limit: chosen.limit || 0,
          perUserLimit: chosen.perUserLimit || 1,
          minOrder: chosen.minOrder || 0
        }) : null;
        if (!wheelCpn && typeof findCouponByCode === 'function') { const ex = findCouponByCode(chosen.code); if (ex && !ex.active) toggleCouponActive(ex.id, true); }
        navigator.clipboard.writeText(chosen.code).catch(() => {});
        if (typeof applyDiscountCode === 'function') {
          const discInp = document.getElementById('discountCode');
          if (discInp) { discInp.value = chosen.code; applyDiscountCode(); }
        } else {
          appliedDiscount = chosen.percent;
          const discInput = document.getElementById('discountCode');
          if (discInput) discInput.value = chosen.code;
          const discMsg = document.getElementById('discountMsg');
          if (discMsg) { discMsg.textContent = `✅ تم تطبيق الخصم ${chosen.percent}%`; discMsg.style.color = '#16a34a'; }
          renderCartItems();
        }
      } else if (chosen.type === 'freeship') {
        let freeCode = chosen.code || ('FREESHIP' + String(Date.now()).slice(-4));
        resultDiv.innerHTML = `🎉 مبروك! فزت بـ ${chosen.label}!<br>كود الشحن المجاني: <strong style="font-size:1.2rem;letter-spacing:1px">${freeCode}</strong> (تم تطبيقه تلقائياً وينتهي خلال 24 ساعة)`;
        const nowTs2 = Date.now();
        if (typeof addCoupon === 'function') {
          addCoupon({
            code: freeCode,
            type: CouponType.FREESHIP,
            value: 0,
            description: 'جائزة العجلة: شحن مجاني (استخدمها أو اخسرها خلال 24 ساعة!)',
            startDate: nowTs2,
            endDate: nowTs2 + 24 * 3600 * 1000,
            limit: 0,
            perUserLimit: 1,
            minOrder: 0
          });
        }
        navigator.clipboard.writeText(freeCode).catch(() => {});
        if (typeof applyDiscountCode === 'function') {
          const discInp2 = document.getElementById('discountCode');
          if (discInp2) { discInp2.value = freeCode; applyDiscountCode(); }
        } else {
          sessionStorage.setItem('free_delivery_win', '1');
          renderCartItems();
        }
      } else {
        resultDiv.textContent = `🤞 ${chosen.label}! شكراً لمشاركتك.`;
      }
    }
    setTimeout(closeSpinWin, 4500);
  }, 4000);
}

function initFlashSales() {
  const container = document.getElementById('flashSaleSection');
  const scroll = document.getElementById('flashSaleScroll');
  if (!container || !scroll || !products.length) return;
  
  // Check if flash sales is enabled in marketing settings
  const marketing = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!marketing.flashSales?.show) {
    container.style.display = 'none';
    return;
  }
  
  // Flash sale products: products with discount >= 20%
  const flashProducts = products.filter(p => (p.discount || 0) >= 20);
  if (!flashProducts.length) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  scroll.innerHTML = flashProducts.map(p => {
    const img = Array.isArray(p.images) ? p.images[0] : p.image;
    // simulated remaining inventory
    const progress = Math.max(10, Math.round((p.id % 7 + 3) * 10)); // e.g. 30%-90%
    return `<div class="product-card" onclick="openDetail(${p.id})" style="flex:0 0 160px; margin-bottom:0">
      <div class="product-badge-tag" style="background:#ef4444; color:#fff">خصم ${p.discount}%</div>
      <img src="${img}" style="height:110px; object-fit:cover; width:100%">
      <h4 style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 6px">${p.name}</h4>
      <div class="product-price" style="font-size:0.8rem; padding:0 6px">${CURRENCY}${p.price}</div>
      <div style="padding:0 6px 6px">
        <div style="display:flex; justify-content:space-between; font-size:0.55rem; color:var(--text-muted); margin-bottom:2px">
          <span>مباع: ${progress}%</span>
          <span>متبقي: ${100 - progress}%</span>
        </div>
        <div style="background:#f1f5f9; height:4px; border-radius:2px; overflow:hidden">
          <div style="background:#ef4444; height:100%; width:${progress}%"></div>
        </div>
      </div>
    </div>`;
  }).join('');
  
  if (_flashTimer) clearInterval(_flashTimer);
  _flashTimer = setInterval(updateFlashTimer, 1000);
}

function updateFlashTimer() {
  const timerEl = document.getElementById('flashSaleTimer');
  if (!timerEl) return;
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = endOfDay - now;
  if (diff <= 0) {
    timerEl.textContent = '00:00:00';
    return;
  }
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  timerEl.textContent = `${h}:${m}:${s}`;
}

function initLiveViewers(enabled) {
  const container = document.getElementById('liveViewersContainer');
  const textEl = document.getElementById('liveViewersText');
  if (!container) return;
  clearInterval(_liveViewersInterval);
  if (!enabled) { container.style.display = 'none'; return; }
  // Bind to openDetail so it shows only when a product is open
  window._liveViewersEnabled = true;
}

function startLiveViewersTicker(productName) {
  const container = document.getElementById('liveViewersContainer');
  const textEl = document.getElementById('liveViewersText');
  if (!container || !textEl || !window._liveViewersEnabled) return;
  clearInterval(_liveViewersInterval);
  const base = Math.floor(Math.random() * 15) + 8; // 8-22
  let count = base;
  textEl.textContent = `🔥 يشاهد هذا المنتج ${count} شخصاً الآن!`;
  container.style.display = 'flex';
  _liveViewersInterval = setInterval(() => {
    const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    count = Math.max(3, Math.min(30, count + delta));
    textEl.textContent = `🔥 يشاهد هذا المنتج ${count} شخصاً الآن!`;
  }, 5000);
}

function stopLiveViewersTicker() {
  clearInterval(_liveViewersInterval);
  const container = document.getElementById('liveViewersContainer');
  if (container) container.style.display = 'none';
}

function initWaChatWidget(enabled, greeting, waNumber) {
  const widget = document.getElementById('waChatWidget');
  if (!widget) return;
  if (!enabled) { widget.style.display = 'none'; return; }
  widget.style.display = 'block';
  // Set WhatsApp link
  const cleanNum = (waNumber || '').replace(/\D/g, '');
  const linkEl = document.getElementById('waChatLink');
  if (linkEl && cleanNum) {
    const greetMsg = greeting || 'أهلاً! أحتاج لمساعدة في المتجر.';
    linkEl.href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(greetMsg)}`;
  }
}

function toggleWaChatBox() {
  const box = document.getElementById('waChatBox');
  if (!box) return;
  const isOpen = box.style.display === 'flex' || box.style.display === 'block';
  box.style.display = isOpen ? 'none' : 'flex';
  box.style.flexDirection = 'column';
}