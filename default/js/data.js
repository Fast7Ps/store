const DEFAULT_PRODUCTS = [];

function loadProducts() {
  try {
    const stored = localStorage.getItem('mycart_admin_products');
    if (stored !== null) { return JSON.parse(stored); }
  } catch (e) { }
  return [];
}

function saveProductsToLS() {
  try { localStorage.setItem('mycart_admin_products', JSON.stringify(products)); } catch (e) { showToast('مساحة التخزين ممتلئة، تعذر حفظ المنتجات', 'error'); }
  // Push immediately so admin changes reach the cloud right away, not on a delayed debounce
  if (typeof window.__supabaseFlushNow === 'function') {
    try { window.__supabaseFlushNow(); } catch (e) {}
  }
}

function loadAdminSettings() {
  var d = { storeName: 'متجري', tagline: 'اختر منتجك المفضل', phone: '', whatsapp: '', email: '', address: '', hours: '', lat: '', lng: '', storeImages: [], wholesaleCode: '', currency: '₪', accentColor: '#ef4444', lang: 'ar', scrolledHeader: 'both', showFlashSales: true, showStoreCard: true, social: { facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '', telegram: '', snapchat: '', website: '' } };
  try {
    const stored = localStorage.getItem('mycart_admin_settings');
    if (stored) { const parsed = JSON.parse(stored); return Object.assign({}, d, parsed, { social: Object.assign({}, d.social, parsed.social || {}) }); }
  } catch (e) { }
  return d;
}

let adminSettings = loadAdminSettings();

let CURRENCY = adminSettings.currency || '₪';

let products = loadProducts();

// Boot: will be called from store.js after all scripts load
var _bootMediaResolve = null;

async function resolveProductImages() {
  const prods = loadProducts();
  for (const p of prods) {
    if (p.images && p.images.length) {
      const resolved = [];
      for (const img of p.images) {
        const data = await mediaStoreGet(img);
        resolved.push(data || img);
      }
      p.images = resolved;
    }
    if (p.options) {
      for (const opt of p.options) {
        if (opt.type === 'image' && opt.values) {
          for (const v of opt.values) {
            if (v.extra) {
              const data = await mediaStoreGet(v.extra);
              if (data) v.extra = data;
            }
          }
        }
      }
    }
  }
  return prods;
}

let cart = JSON.parse(localStorage.getItem('mycart_cart')) || [];

let currentCat = 'الكل';

let wishlist = JSON.parse(localStorage.getItem('mycart_wishlist')) || [];

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    if (type === 'add') {
      // صعود سعيد: دو - مي - صول
      const t = ctx.createOscillator(); t.type = 'triangle';
      t.frequency.setValueAtTime(523, now); t.frequency.setValueAtTime(659, now + 0.06); t.frequency.setValueAtTime(784, now + 0.12);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      t.connect(g); g.connect(master); t.start(now); t.stop(now + 0.3);
      // نغمة تحت خفيفة
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 392;
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.2, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      o2.connect(g2); g2.connect(master); o2.start(now + 0.1); o2.stop(now + 0.25);

    } else if (type === 'remove') {
      // نزول حزين: لا - فا - ري
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(440, now); o.frequency.setValueAtTime(349, now + 0.07); o.frequency.setValueAtTime(294, now + 0.14);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.32);

    } else if (type === 'wishlist') {
      // بريق سحري: مي - صول - سي
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(659, now); o.frequency.setValueAtTime(784, now + 0.06); o.frequency.setValueAtTime(988, now + 0.12);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.35);
      // رنين عالي خفيف
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 1319;
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.15, now + 0.15); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o2.connect(g2); g2.connect(master); o2.start(now + 0.15); o2.stop(now + 0.3);

    } else if (type === 'checkout') {
      // احتفال: دو - مي - صول - دو (أوكتاف أعلى)
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator(); o.type = 'triangle';
        o.frequency.value = freq;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.4, now + i * 0.08); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        o.connect(g); g.connect(master); o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.35);
      });

    } else if (type === 'error') {
      // خطأ: نغمة منخفضة مزعجة
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(220, now); o.frequency.setValueAtTime(165, now + 0.1);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.35);

    } else if (type === 'back') {
      // رجوع: نقرة هابطة خفيفة - صول - مي
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(392, now); o.frequency.setValueAtTime(330, now + 0.05);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.22);
    }
  } catch (e) { }
}

function animateAddToCart(el) {
  try {
    if (!el) return;
    const startRect = el.getBoundingClientRect();
    const cartIcon = document.querySelector('.bottom-nav .nav-item:nth-child(3)') || document.querySelector('.nav-item[onclick*="CartSheet"]');
    if (!cartIcon) return;
    const endRect = cartIcon.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:9999;width:16px;height:16px;background:var(--accent,#ef4444);border-radius:50%;pointer-events:none;transition:all .55s cubic-bezier(.22,.61,.36,1);box-shadow:0 0 6px rgba(239,68,68,.4)';
    dot.style.left = (startRect.left + startRect.width / 2 - 8) + 'px';
    dot.style.top = (startRect.top + startRect.height / 2 - 8) + 'px';
    dot.style.transform = 'scale(.6)';
    dot.style.opacity = '1';
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.left = (endRect.left + endRect.width / 2 - 8) + 'px';
      dot.style.top = (endRect.top + endRect.height / 2 - 8) + 'px';
      dot.style.transform = 'scale(0) translateY(-20px)';
      dot.style.opacity = '.2';
    });
    setTimeout(() => dot.remove(), 600);
    // Bounce the cart icon
    if (cartIcon) { cartIcon.classList.remove('cart-bounce'); void cartIcon.offsetWidth; cartIcon.classList.add('cart-bounce'); }
  } catch (e) { }
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
  if (type === 'error') playSound('error');
}

(function loadVisuals() {
  const savedLogo = localStorage.getItem('mycart_logo');
  const logoEl = document.getElementById('storeLogo');
  if (savedLogo && logoEl) {
    logoEl.src = savedLogo;
  }
  const savedBg = localStorage.getItem('mycart_bg');
  const headerEl = document.getElementById('header');
  if (savedBg && headerEl) {
    headerEl.style.setProperty('--header-bg', `url(${savedBg})`);
    headerEl.classList.add('has-bg');
  } else if (headerEl) {
    headerEl.style.removeProperty('--header-bg');
    headerEl.classList.remove('has-bg');
  }
})();

function getProductDiscount(p) {
  const old = p.oldPrice || 0;
  const curr = p.price || 0;
  if (old > 0 && curr < old) return Math.round((old - curr) / old * 100);
  return p.discount || 0;
}

function getProductImages(p) {
  if (p.images && Array.isArray(p.images) && p.images.length) return p.images;
  if (p.image) return [p.image];
  return ['https://placehold.co/400x400/e2e8f0/64748b?text=Product'];
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  // Derive hover color (darken by 10%)
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 25);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 25);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 25);
  const hover = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  document.documentElement.style.setProperty('--accent-hover', hover);
}

function compressImage(file, maxWidth, maxHeight, callback) {
  if (!file) return;
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();
  const isSvg = fileType.includes('svg') || fileName.endsWith('.svg');

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const isPngOrWebpOrGif = isSvg || fileType.includes('png') || fileType.includes('webp') || fileType.includes('gif') ||
                               fileName.endsWith('.png') || fileName.endsWith('.webp') || fileName.endsWith('.gif');
      
      // If image is already smaller than max dimensions and is transparent (except SVG which needs conversion to PNG for ImgBB), return original dataUrl
      if (!isSvg && isPngOrWebpOrGif && img.width <= maxWidth && img.height <= maxHeight) {
        return callback(e.target.result);
      }

      const canvas = document.createElement('canvas');
      let w = img.width || maxWidth || 800;
      let h = img.height || maxHeight || 600;

      // Scale SVG or large images appropriately while preserving aspect ratio
      if (isSvg) {
        const maxDimension = 1200; // High resolution PNG for SVG
        if (w > maxDimension || h > maxDimension) {
          if (w > h) { h = Math.round((h * maxDimension) / w); w = maxDimension; }
          else { w = Math.round((w * maxDimension) / h); h = maxDimension; }
        }
      } else if (w > maxWidth || h > maxHeight) {
        if (w / h > maxWidth / maxHeight) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        } else {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Keep transparent formats as image/png (or image/webp), otherwise image/jpeg
      let format = 'image/jpeg';
      if (isPngOrWebpOrGif) {
        format = (!isSvg && fileType.includes('webp')) ? 'image/webp' : 'image/png';
      }
      const compressedUrl = canvas.toDataURL(format, 0.95);
      callback(compressedUrl);
    };
    img.onerror = function () { callback(e.target.result); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== ImgBB Integration =====
const IMGBB_API_KEY = '9f8860bb5d9f33e6e72d706a919ced84';

async function uploadToImgbb(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;

  const base64 = dataUrl.split(',')[1];
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64);
  try {
    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success && json.data && json.data.url) {
      return json.data.url;
    }
    throw new Error(json.error?.message || 'فشل الرفع إلى ImgBB');
  } catch (err) {
    console.error('ImgBB error:', err);
    if (typeof showToast === 'function') {
      showToast('فشل رفع الصورة إلى ImgBB', 'error');
    }
    return null;
  }
}