// =============================================================
// FAST7 — ربط المتجر بلوحة التحكم الرئيسية (panel)
//
// مصدر الحقيقة الوحيد: لوحة التحكم (سحابة الشركة).
//  - الحالة = suspended  -> ضع العلامة وانتقل لصفحة الصيانة
//  - الحالة = active     -> امسح العلامة وعد للمتجر
//
// يعمل هذا الملف على صفحتَي المتجر (index.html) والصيانة
// (maintenance.html)، ويفحص دورياً حتى نرصد التغييرات فوراً.
// =============================================================
(function () {
  var PANEL_URL = 'https://scmgwkabtybtrmxdqniz.supabase.co';  // Master (لوحة التحكم)
  var PANEL_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd3a2FidHlidHJteGRxbml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjA3NDcsImV4cCI6MjEwMTQzNjc0N30.Lwqif_ViU7XJoO_zz_wovovOroIYvqpg3m0CJaCmi5w';

  var CHECK_MS = 8000; // كل 8 ثوانٍ نتحقق من الحالة
  var done = false;

  function getStoreId() {
    var p = window.location.pathname.split('/');
    var idx = p.indexOf('stores');
    if (idx !== -1 && p[idx + 1]) return p[idx + 1];
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.storeId) return window.SUPABASE_CONFIG.storeId;
    return 'default';
  }
  var STORE_ID = getStoreId();

  function onMaintenancePage() {
    return window.location.pathname.indexOf('maintenance.html') !== -1;
  }

  function apply(result) {
    if (result.suspended) {
      // موقوف -> تأكد من العلامة وانتقل للصيانة (مرة واحدة فقط)
      localStorage.setItem('mycart_store_suspended', 'true');
      if (!onMaintenancePage()) window.location.replace('maintenance.html');
    } else {
      // نشط -> امسح العلامة وعد للمتجر (مرة واحدة فقط)
      localStorage.removeItem('mycart_store_suspended');
      if (onMaintenancePage()) window.location.replace('index.html');
    }
  }

  async function tick() {
    var isHttp = /^https?:$/.test(window.location.protocol || '');
    if (!isHttp) return;                  // file:// نتركه يعمل محلياً
    if (done) return;                     // الصفحة في مرحلة انتقال تنتهي قريباً
    try {
      var res = await fetch(PANEL_URL.replace(/\/+$/, '') + '/rest/v1/rpc/get_store_status', {
        method: 'POST',
        headers: {
          'apikey': PANEL_ANON,
          'Authorization': 'Bearer ' + PANEL_ANON,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_store: STORE_ID })
      });
      if (!res.ok) return;
      var rows = await res.json();
      if (!rows || !rows.length) return;
      apply(rows[0]);
    } catch (e) {
      // بلا إنترنت: لا نفعل شيئاً (المتجر يبقى على حاله)
    }
  }

  function start() {
    // فحص فوري عند فتح الصفحة
    tick();
    // ثم بشكل دوري لرصد تغيّر الحالة من اللوحة
    setInterval(tick, CHECK_MS);
  }

  if (window.addEventListener) {
    window.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();