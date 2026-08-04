// =============================================================
// FAST7 — ربط المتجر بلوحة التحكم الرئيسية (panel)
//
// يتحقق هذا الملف من حالة المتجر لدى "سحابة الشركة" (master DB
// الخاصة بلوحة التحكم) ويحوّل المتجر لصفحة الصيانة إذا كانت
// الحالة "suspended" أو "pending".
//
// البيانات اللازمة: عنوان سحابة الشركة + مفتاح anon العام الخاص
// باللوحة (من js/config.js في مجلد اللوحة).
// =============================================================
(function () {
  // نقطة الإعداد الوحيدة — املأ عنوان سحابة اللوحة الرئيسية ومفتاحها
  var PANEL_URL = 'https://scmgwkabtybtrmxdqniz.supabase.co';  // Master (لوحة التحكم)
  var PANEL_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd3a2FidHlidHJteGRxbml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjA3NDcsImV4cCI6MjEwMTQzNjc0N30.Lwqif_ViU7XJoO_zz_wovovOroIYvqpg3m0CJaCmi5w';

  // storeId: يستخرجه من المسار إن وُجد، أو من الإعداد الافتراضي
  function getStoreId() {
    var p = window.location.pathname.split('/');
    var idx = p.indexOf('stores');
    if (idx !== -1 && p[idx + 1]) return p[idx + 1];
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.storeId) return window.SUPABASE_CONFIG.storeId;
    return 'default';
  }
  var STORE_ID = getStoreId();

  var RUN_KEY = 'mycart_panel_check_done';

  async function checkPanelStatus() {
    // لاعدم تكرار الفحص بلا فائدة، ضع علامة لنفس الجلسة
    if (sessionStorage.getItem(RUN_KEY)) return;
    sessionStorage.setItem(RUN_KEY, '1');

    // تجاهل عند الفتح محلياً (file://) أو صفحة الصيانة نفسها
    var isHttp = /^https?:$/.test(window.location.protocol || '');
    if (!isHttp) return;
    if (window.location.pathname.indexOf('maintenance.html') !== -1) return;

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
      if (!res.ok) return; // إن تعذّر الاتصال أو غاب المتجر، لا تغلق المتجر
      var rows = await res.json();
      if (!rows || !rows.length) return;

      if (rows[0].suspended) {
        localStorage.setItem('mycart_store_suspended', 'true');
        if (window.location.pathname.indexOf('maintenance.html') === -1) {
          window.location.replace('maintenance.html');
        }
      }
    } catch (e) {
      // بدون إنترنت: لا تفعل شيئاً (المتجر يبقى يعمل)
      console.warn('Panel check failed:', e);
    }
  }

  if (window.addEventListener) {
    window.addEventListener('DOMContentLoaded', checkPanelStatus);
  } else {
    checkPanelStatus();
  }
})();