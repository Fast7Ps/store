let WHOLESALE_CODE = localStorage.getItem('mycart_wholesale_code') || adminSettings.wholesaleCode || '';

// The per-store admin code is stored ONLY at the company server and verified
// via verifyAdminCode below. No local/legacy code exists anymore.
const ADMIN_STORE_ID = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.storeId) || 'default';

// Master (company) panel connection details — used solely to verify the admin code.
// The code itself is never stored in these scripts; the server returns yes/no only.
var _panelUrl = 'https://scmgwkabtybtrmxdqniz.supabase.co';
var _panelAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbWd3a2FidHlidHJteGRxbml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjA3NDcsImV4cCI6MjEwMTQzNjc0N30.Lwqif_ViU7XJoO_zz_wovovOroIYvqpg3m0CJaCmi5w';

// Returns a Promise<boolean>: verify the given code against the company's server.
// No local fallback exists — the company code is the only valid one.
function verifyAdminCode(code) {
  return fetch(_panelUrl.replace(/\/+$/, '') + '/rest/v1/rpc/verify_store_admin', {
    method: 'POST',
    headers: {
      'apikey': _panelAnon,
      'Authorization': 'Bearer ' + _panelAnon,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_store: ADMIN_STORE_ID, p_code: code })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    })
    .then(function (val) {
      // Server returns a boolean (or "true"/"false" string)
      return val === true || val === 'true' || val === 1;
    })
    .catch(function () {
      // Server unreachable -> reject the login (no offline backdoor).
      return false;
    });
}

let adminEditingId = null;

let orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];

let customer = JSON.parse(localStorage.getItem('mycart_customer')) || {};

let sharedLocation = localStorage.getItem('mycart_share_location') || '';

let isWholesale = localStorage.getItem('mycart_wholesale') === 'true';

// ===== TRANSLATIONS =====
const LANG = (loadAdminSettings && loadAdminSettings().lang) || 'ar';
const _t = {
  ar: {
    home:'الرئيسية',products:'المنتجات',cart:'السلة',wishlist:'المفضلة',orders:'طلباتي',admin:'الإدارة',
    search:'بحث...',categories:'التصنيفات',brands:'الماركات',all:'الكل',features:'الميزات',specs:'المواصفات',
    price:'السعر',quantity:'الكمية',addToCart:'أضف للسلة',buyNow:'اشتر الآن',total:'المجموع',
    checkout:'إتمام الطلب',name:'الاسم',phone:'رقم الجوال',address:'العنوان',notes:'ملاحظات',
    submitOrder:'إرسال الطلب',    orderConfirmed:'تم تأكيد الطلب',close:'إغلاق',soldBy:'بواسطة',
    promoBanner:'عرض خاص',flashSale:'تخفيضات سريعة',offer:'عرض',freeShipping:'شحن مجاني',
    discountCode:'كود الخصم',apply:'تطبيق',remove:'إزالة',emptyCart:'السلة فارغة',
    startShopping:'ابدأ التسوق',suggestions:'اقتراحات',featured:'منتجات مميزة',
    wholesaleMode:'وضع الجملة',retailMode:'وضع التجزئة',productsCount:'منتج',
    offerEndsIn:'ينتهي العرض خلال',days:'أيام',hours:'ساعات',mins:'دقائق',secs:'ثواني',
    viewAll:'عرض الكل',quickAdd:'إضافة سريعة',sale:'تخفيض',newProduct:'جديد',outOfStock:'نفذ من المخزون',
    share:'مشاركة',copyLink:'نسخ الرابط',copied:'تم النسخ',noProducts:'لا توجد منتجات',
    clearFilters:'مسح الفلاتر',filter:'تصفية',sort:'ترتيب',sortBy:'ترتيب حسب',
    newest:'الأحدث',oldest:'الأقدم',priceLow:'السعر: من الأقل',priceHigh:'السعر: من الأعلى',
    nameAsc:'الاسم: أ-ي',nameDesc:'الاسم: ي-أ',discount:'خصم',loading:'جارٍ التحميل...',
    freeShippingBanner:'شحن مجاني للطلبات فوق',
    featured_products:'منتجات مميزة',special_offers:'عروض خاصة',
    offers_section_title:'عروض خاصة',offers_section_desc:'استفد من أقوى العروض والتخفيضات!',
    subscribe:'اشتراك',subscribed:'تم الاشتراك',emailPlaceholder:'بريدك الإلكتروني',
    product_details:'تفاصيل المنتج',reviews:'التقييمات',related:'منتجات مشابهة',
    no_reviews:'لا توجد تقييمات بعد',add_review:'أضف تقييماً',your_rating:'تقييمك',
    your_review:'مراجعتك',submit_review:'إرسال التقييم',review_added:'تمت إضافة التقييم',
    lang_switch:'English',
    tab_home:'الرئيسية',tab_products:'المنتجات',tab_cart:'السلة',tab_wishlist:'المفضلة',tab_orders:'طلباتي',
    store:'المتجر',myCart:'سلتي',login:'دخول',searchLabel:'بحث',
    addToCartShort:'إضافة للسلة',addToCart:'أضف للسلة',buyNow:'اشتر الآن',shareProduct:'مشاركة المنتج',
    clearFilters:'مسح الفلاتر',filter:'تصفية',sort:'ترتيب',sortBy:'ترتيب حسب',
    newest:'الأحدث',oldest:'الأقدم',priceLow:'السعر: من الأقل',priceHigh:'السعر: من الأعلى',
    nameAsc:'الاسم: أ-ي',nameDesc:'الاسم: ي-أ',discount:'خصم',loading:'جارٍ التحميل...',
    freeShippingBanner:'شحن مجاني للطلبات فوق',
    featured_products:'منتجات مميزة',special_offers:'عروض خاصة',
    offers_section_title:'عروض خاصة',offers_section_desc:'استفد من أقوى العروض والتخفيضات!',
    subscribe:'اشتراك',subscribed:'تم الاشتراك',emailPlaceholder:'بريدك الإلكتروني',
    product_details:'تفاصيل المنتج',reviews:'التقييمات',related:'منتجات مشابهة',
    no_reviews:'لا توجد تقييمات بعد',add_review:'أضف تقييماً',your_rating:'تقييمك',
    your_review:'مراجعتك',submit_review:'إرسال التقييم',review_added:'تمت إضافة التقييم',
    lang_switch:'English',
    checkout:'إتمام الطلب',name:'الاسم',phone:'رقم الجوال',address:'العنوان',notes:'ملاحظات',
    submitOrder:'إرسال الطلب',orderConfirmed:'تم تأكيد الطلب',close:'إغلاق',
    total:'المجموع',quantity:'الكمية',price:'السعر',emptyCart:'السلة فارغة',
    startShopping:'ابدأ التسوق',suggestions:'اقتراحات',featured:'منتجات مميزة',
    wholesaleMode:'وضع الجملة',retailMode:'وضع التجزئة',productsCount:'منتج',
    all:'الكل',viewAll:'عرض الكل',apply:'تطبيق',remove:'إزالة',
    addedToCart:'تمت الإضافة للسلة',waOrder:'طلب مباشر عبر واتساب',
    next:'التالي',ordersHistory:'السجل',customerData:'البيانات',
    paymentDelivery:'الدفع والتوصيل',noOrdersYet:'لا يوجد طلبات سابقة بعد',
    features:'أبرز الميزات',until:'حتى',bogoTitle:'عرض خاص لفترة محدودة:',
    bogoText:'اشترِ {buy} واحصل على {get} مجاناً!',
    buy2:'اشترِ قطعتين (2)',buy3plus:'اشترِ 3 قطع فأكثر',
    discountVal:'خصم {val}',
    freeShippingCongrats:'مبروك! حصلت على شحن مجاني للطلب',
    freeShippingRemaining:'أضف بقيمة <strong>{amount}</strong> إضافية للشحن المجاني',
    removedFromWishlist:'تمت الإزالة من المفضلة',
    addedToWishlist:'أضيف للمفضلة!',
    allBrands:'كل الماركات',wishlistEmpty:'المفضلة فارغة',
    wishlistHint:'أضف منتجات إلى المفضلة بالضغط على أيقونة القلب',
    noZones:'لا توجد مناطق توصيل محددة',
    zonePlaceholder:'اختر منطقة التوصيل',
    zoneStatusLocating:'جاري تحديد موقعك...',
    zoneStatusFail:'تعذر الحصول على الموقع',
    zoneStatusUnsupported:'المتصفح لا يدعم تحديد الموقع',
    zoneStatusTap:'اضغط لتحديد موقعك تلقائياً',
    codLabel:'الدفع عند الاستلام (COD)',
    codDesc:'ببساطة نقوم بإيصال المنتج وتدفع عند الاستلام',
    onlineLabel:'البطاقة الائتمانية',
    onlineSoon:'(قريباً)',
    subtotal:'المجموع الفرعي',
    grandTotal:'الإجمالي النهائي',
    orderPlaced:'تم استلام طلبك بنجاح!',
    orderPlacedDesc:'سيتم تجهيز طلبك وشحنه في أقرب وقت ممكن.',
    orderNumber:'رقم الطلب',
    totalAmount:'المبلغ الإجمالي',
    contactWa:'تواصل عبر الواتساب',
    backToShopping:'العودة للتسوق',
    trackOrders:'تتبع طلباتي',
    statusPending:'قيد التجهيز',
    statusShipped:'تم الشحن',
    statusCompleted:'مكـتمل',
    statusReturned:'مرتجع',
    statusCancelled:'ملغي',
    newOrder:'جديد',
    customerInfo:'معلومات العميل',city:'المدينة',
    deliveryZone:'منطقة التوصيل',customerNote:'ملاحظة العميل',
    products:'المنتجات',delivery:'التوصيل',
    print:'طباعة',inquiry:'استفسار',
    printInvoice:'طباعة الفاتورة',waInquiry:'استفسار واتساب',
    order:'طلب',orderedProducts:'المنتجات المطلوبة',
    backToOrders:'العودة لسجل طلباتي',
    productsShowing:'المنتجات المعروضة',
    filtersAndSort:'الفلاتر والترتيب',
    priceRange:'نطاق السعر',
    sortProducts:'ترتيب المنتجات',
    volumeDiscount:'خصم الكميات التراكمي',
    youMayAlsoLike:'قد يعجبك أيضاً',
    addReviewBtn:'كتابة تقييم جديد',
    submitReviewBtn:'إرسال التقييم',
    reviewLabel:'التقييم',
    commentLabel:'التعليق',
    sortDefault:'الترتيب الافتراضي',
    sortPriceAsc:'السعر: الأقل إلى الأعلى',
    sortPriceDesc:'السعر: الأعلى إلى الأقل',
    sortDiscount:'الأكثر خصماً',
    sortNameAsc:'الاسم: أ - ي',
    inStockOnly:'متوفر في المخزون فقط',
    resetFilters:'إعادة تعيين',
    storeName:'متجري',
    tagline:'اختر منتجك المفضل',
    orderDetails:'تفاصيل الطلب',
    promoTitle:'عرض خاص لفترة محدودة!',
    promoText:'استخدم كود الخصم التالي عند إتمام الطلب للحصول على خصم إضافي:',
    promoCopyHint:'اضغط على الكود للنسخ سريعاً',
    wholesaleLogin:'دخول تجار الجملة',
    wholesaleDesc:'ادخل الكود للوصول لأسعار الجملة',
    enterCode:'إدخال الكود',
    browseAsGuest:'تصفح كضيف',
    invalidCode:'الكود غير صالح لهذا المتجر',
    poweredBy:'مزود بواسطة',
    allRights:'جميع الحقوق محفوظة.',
    freeShippingDefault:'أضف منتجات للحصول على شحن مجاني',
    liveViewers:'يشاهد هذا المنتج 15 شخصاً الآن!',
    hurryOffer:'عجل! ينتهي العرض خلال:',
    customerReviews:'تقييمات العملاء',
    basedOnLocal:'بناءً على التقييمات محلياً',
    bundleTitle:'حزمة اشترِ معاً ووفر (خصم 10% إضافي)',
    bundlePrice:'السعر للحزمة:',
    addBundle:'إضافة الحزمة للسلة',
    merchantLogin:'دخول التجار',
    merchantDesc:'ادخل كود التاجر للوصول لأسعار الجملة',
    merchantBtn:'دخول',
    merchantRegister:'تسجيل',
    merchantLoggedIn:'أنت مسجل كتاجر جملة',
    merchantCompleteData:'يرجى إكمال البيانات:',
    orderInfo:'معلومات الطلب',
    secondPhone:'رقم ثانٍ',
    deliveryZoneLabel:'منطقة التوصيل',
    zonePlaceholder:'اختر منطقة التوصيل',
    shareLocation:'مشاركة موقعي الحالي',viewMap:'عرض الخريطة',
    locationTap:'اضغط لتحديد موقعك تلقائياً',
    noteLabel:'ملاحظة (اختياري)',
    paymentDelivery:'الدفع والتوصيل',
    discountCodeLabel:'كود الخصم',
    applyBtn:'تطبيق',
    paymentMethod:'اختر طريقة الدفع:',
    cod:'الدفع عند الاستلام (COD)',
    codDesc:'ببساطة نقوم بإيصال المنتج لغاية منزلك وتقوم بدفع الثمن لموظف التوصيل.',
    creditCard:'البطاقة الائتمانية',
    comingSoon:'(قريباً)',
    subtotalLabel:'المجموع:',
    deliveryLabel:'التوصيل:',
    grandTotalLabel:'الإجمالي النهائي:',
    discountLabel:'الخصم:',
    cartTotalLabel:'الإجمالي:',
    nextBtn:'التالي',
    wishlistHeading:'المفضلة',
    cartTab:'السلة',
    historyTab:'السجل',
    pickerTitle:'اختر منتج للإضافة',
    liveSupport:'الدعم الفني المباشر',
    liveSupportDesc:'متصل الآن ومستعد لمساعدتك',
    waWelcome:'أهلاً بك! كيف يمكنني مساعدتك اليوم؟ يمكنك مراسلتي مباشرة عبر واتساب',
    startChat:'بدء المحادثة الآن',
    qrShare:'مشاركة بمسح QR',
    qrDesc:'امسح الكود بكاميرا هاتفك لفتح صفحة المنتج',
    qrDownload:'تنزيل QR كصورة',
    qrHint:'مثالي للطباعة أو وضعه على وسائل التواصل الاجتماعي',
    wheelTitle:'عجلة الحظ السعيدة!',
    wheelDesc:'أدر العجلة الآن واحصل على جائزتك القيمة أو كوبون خصم فوري!',
    wheelSpin:'ابدأ',
    wheel5:'5% خصم',
    wheel10:'10% خصم',
    wheelLucky:'حظ سعيد',
    wheel15:'15% خصم',
    wheelFree:'شحن مجاني',
    orderBtn:'طلب #',
    searchPlaceholder:'ابحث عن منتج...',
    payment:'الدفع',
  },
  en: {
    home:'Home',products:'Products',cart:'Cart',wishlist:'Wishlist',orders:'My Orders',admin:'Admin',
    search:'Search...',categories:'Categories',brands:'Brands',all:'All',features:'Features',specs:'Specs',
    price:'Price',quantity:'Qty',addToCart:'Add to Cart',buyNow:'Buy Now',total:'Total',
    checkout:'Checkout',name:'Name',phone:'Phone',address:'Address',notes:'Notes',
    submitOrder:'Submit Order',orderConfirmed:'Order Confirmed',close:'Close',soldBy:'by',
    promoBanner:'Special Offer',flashSale:'Flash Sale',offer:'Offer',freeShipping:'Free Shipping',
    discountCode:'Discount Code',apply:'Apply',remove:'Remove',emptyCart:'Cart is Empty',
    startShopping:'Start Shopping',suggestions:'Suggestions',featured:'Featured Products',
    wholesaleMode:'Wholesale Mode',retailMode:'Retail Mode',productsCount:'Products',
    offerEndsIn:'Offer ends in',days:'Days',hours:'Hrs',mins:'Min',secs:'Sec',
    viewAll:'View All',quickAdd:'Quick Add',sale:'Sale',newProduct:'New',outOfStock:'Out of Stock',
    share:'Share',copyLink:'Copy Link',copied:'Copied!',noProducts:'No products found',
    clearFilters:'Clear Filters',filter:'Filter',sort:'Sort',sortBy:'Sort by',
    newest:'Newest',oldest:'Oldest',priceLow:'Price: Low',priceHigh:'Price: High',
    nameAsc:'Name: A-Z',nameDesc:'Name: Z-A',discount:'Discount',loading:'Loading...',
    freeShippingBanner:'Free shipping on orders over',
    featured_products:'Featured Products',special_offers:'Special Offers',
    offers_section_title:'Special Offers',offers_section_desc:'Grab the best deals and discounts!',
    subscribe:'Subscribe',subscribed:'Subscribed',emailPlaceholder:'Your email',
    product_details:'Product Details',reviews:'Reviews',related:'Related Products',
    no_reviews:'No reviews yet',add_review:'Add a Review',your_rating:'Your Rating',
    your_review:'Your Review',submit_review:'Submit Review',review_added:'Review added',
    lang_switch:'العربية',
    tab_home:'Home',tab_products:'Products',tab_cart:'Cart',tab_wishlist:'Wishlist',tab_orders:'My Orders',
    store:'Store',myCart:'My Cart',login:'Login',searchLabel:'Search',
    addToCartShort:'Add to Cart',shareProduct:'Share Product',
    addedToCart:'✓ Added to Cart',waOrder:'Quick WhatsApp Order',
    next:'Next',ordersHistory:'History',customerData:'Your Data',
    paymentDelivery:'Payment & Delivery',noOrdersYet:'No previous orders yet',
    features:'Key Features',until:'until',bogoTitle:'Limited Time Offer:',
    bogoText:'Buy {buy} Get {get} Free!',
    buy2:'Buy 2 Pieces',buy3plus:'Buy 3+ Pieces',
    discountVal:'Discount {val}',
    freeShippingCongrats:'Congrats! You get free shipping!',
    freeShippingRemaining:'Add <strong>{amount}</strong> more for free shipping',
    removedFromWishlist:'Removed from wishlist',
    addedToWishlist:'Added to wishlist!',
    allBrands:'All Brands',wishlistEmpty:'Wishlist is empty',
    wishlistHint:'Add products by tapping the heart icon',
    noZones:'No delivery zones configured',
    zonePlaceholder:'Select delivery zone',
    zoneStatusLocating:'Locating your position...',
    zoneStatusFail:'Could not get location',
    zoneStatusUnsupported:'Browser does not support geolocation',
    zoneStatusTap:'Tap to auto-detect your location',
    codLabel:'Cash on Delivery (COD)',
    codDesc:'We deliver the product and you pay on arrival',
    onlineLabel:'Credit Card',
    onlineSoon:'(Coming Soon)',
    subtotal:'Subtotal',
    grandTotal:'Grand Total',
    orderPlaced:'Your order has been placed!',
    orderPlacedDesc:'We will process and ship your order as soon as possible.',
    orderNumber:'Order Number',
    totalAmount:'Total Amount',
    contactWa:'Contact via WhatsApp',
    backToShopping:'Back to Shopping',
    trackOrders:'Track My Orders',
    statusPending:'Pending',
    statusShipped:'Shipped',
    statusCompleted:'Completed',
    statusReturned:'Returned',
    statusCancelled:'Cancelled',
    newOrder:'New',
    customerInfo:'Customer Info',city:'City',
    deliveryZone:'Delivery Zone',customerNote:'Customer Note',
    products:'Products',delivery:'Delivery',
    print:'Print',inquiry:'Inquiry',
    printInvoice:'Print Invoice',waInquiry:'WhatsApp Inquiry',
    order:'Order',orderedProducts:'Ordered Products',
    backToOrders:'Back to My Orders',
    productsShowing:'Products Shown',
    filtersAndSort:'Filters & Sort',
    priceRange:'Price Range',
    sortProducts:'Sort Products',
    volumeDiscount:'Volume Discount',
    youMayAlsoLike:'You May Also Like',
    addReviewBtn:'Write a Review',
    submitReviewBtn:'Submit Review',
    reviewLabel:'Rating',
    commentLabel:'Comment',
    sortDefault:'Default Order',
    sortPriceAsc:'Price: Low to High',
    sortPriceDesc:'Price: High to Low',
    sortDiscount:'Biggest Discount',
    sortNameAsc:'Name: A-Z',
    inStockOnly:'In Stock Only',
    resetFilters:'Reset Filters',
    storeName:'My Store',
    tagline:'Pick your favorite product',
    orderDetails:'Order Details',
    promoTitle:'Limited Time Offer!',
    promoText:'Use the discount code below at checkout for an extra discount:',
    promoCopyHint:'Tap the code to copy',
    wholesaleLogin:'Wholesale Login',
    wholesaleDesc:'Enter the code to access wholesale prices',
    enterCode:'Enter Code',
    browseAsGuest:'Browse as Guest',
    invalidCode:'Code is invalid for this store',
    poweredBy:'Powered by',
    allRights:'All rights reserved.',
    freeShippingDefault:'Add products to get free shipping',
    liveViewers:'15 people are viewing this product!',
    hurryOffer:'Hurry! Offer ends in:',
    customerReviews:'Customer Reviews',
    basedOnLocal:'Based on local reviews',
    bundleTitle:'Buy Together & Save (10% extra discount)',
    bundlePrice:'Bundle Price:',
    addBundle:'Add Bundle to Cart',
    merchantLogin:'Merchant Login',
    merchantDesc:'Enter merchant code for wholesale prices',
    merchantBtn:'Login',
    merchantRegister:'Register',
    merchantLoggedIn:'You are registered as a wholesale merchant',
    merchantCompleteData:'Please complete your data:',
    orderInfo:'Order Info',
    secondPhone:'Second Phone',
    deliveryZoneLabel:'Delivery Zone',
    zonePlaceholder:'Select delivery zone',
    shareLocation:'Share My Location',viewMap:'View Map',
    locationTap:'Tap to auto-detect your location',
    noteLabel:'Note (Optional)',
    discountCodeLabel:'Discount Code',
    applyBtn:'Apply',
    paymentMethod:'Choose payment method:',
    cod:'Cash on Delivery (COD)',
    codDesc:'We deliver the product to your door and you pay the delivery person.',
    creditCard:'Credit Card',
    comingSoon:'(Coming Soon)',
    subtotalLabel:'Subtotal:',
    deliveryLabel:'Delivery:',
    grandTotalLabel:'Grand Total:',
    discountLabel:'Discount:',
    cartTotalLabel:'Total:',
    nextBtn:'Next',
    wishlistHeading:'Wishlist',
    cartTab:'Cart',
    historyTab:'History',
    pickerTitle:'Select a product to add',
    liveSupport:'Live Support',
    liveSupportDesc:'Online and ready to help',
    waWelcome:'Hello! How can I help you today? You can message me directly on WhatsApp',
    startChat:'Start Chat Now',
    qrShare:'Share via QR Scan',
    qrDesc:'Scan the code with your phone camera to open the product page',
    qrDownload:'Download QR as Image',
    qrHint:'Perfect for printing or sharing on social media',
    wheelTitle:'Lucky Spin Wheel!',
    wheelDesc:'Spin the wheel now and get your valuable prize or instant discount coupon!',
    wheelSpin:'Spin',
    wheel5:'5% Off',
    wheel10:'10% Off',
    wheelLucky:'Good Luck',
    wheel15:'15% Off',
    wheelFree:'Free Shipping',
    orderBtn:'Order #',
    searchPlaceholder:'Search for a product...',
    payment:'Payment',
  }
};
function __(key){return _t[LANG]&&_t[LANG][key]!==undefined?_t[LANG][key]:_t['ar'][key]||key}
function getCurrentLang(){return LANG}
function toggleLang(){const s=loadAdminSettings();s.lang=s.lang==='ar'?'en':'ar';try{localStorage.setItem('mycart_admin_settings',JSON.stringify(s))}catch(e){}location.reload()}
function applyLanguage(){const l=LANG;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';const btn=document.getElementById('langToggleBtn');if(btn){btn.textContent=l==='ar'?'EN':'ع';btn.title=l==='ar'?__('lang_switch'):__('lang_switch')}document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(k)el.textContent=__(k)});document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const k=el.getAttribute('data-i18n-placeholder');if(k)el.placeholder=__(k)})}

function variantSwatchHtml(vd) {
  if (!vd || !vd.attrs) return '';
  return vd.attrs.map(a => {
    if (a.t === 'color') return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${a.c||'#ccc'};border:1px solid var(--border);vertical-align:middle;margin:0 1px" title="${a.n}: ${a.v}"></span>`;
    if (a.t === 'image' && a.i) return `<img src="${a.i}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid var(--border);vertical-align:middle;margin:0 1px" title="${a.n}: ${a.v}">`;
    return '';
  }).join('');
}

let currentProduct = null;

let currentVariant = null;

let currentDetailImg = 0;

let detailQty = 1;

let appliedDiscount = 0; // percentage

function saveWishlist() { try { localStorage.setItem('mycart_wishlist', JSON.stringify(wishlist)); } catch(e) {} }

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (!badge) return;
  if (wishlist.length > 0) { badge.style.display = 'flex'; badge.textContent = wishlist.length; }
  else badge.style.display = 'none';
}

function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) { wishlist.splice(idx, 1); playSound('remove'); showToast( __('removedFromWishlist'), 'info'); }
  else { wishlist.push(id); playSound('wishlist'); showToast( __('addedToWishlist'), 'success'); }
  saveWishlist();
  updateWishlistBadge();
  // Update heart icons on product cards
  document.querySelectorAll(`.wishlist-btn[data-id="${id}"]`).forEach(b => b.classList.toggle('active'));
  // If sheet is open, re-render it
  if (document.getElementById('wishlistSheet').classList.contains('show')) renderWishlist();
}

// ===== SOUNDS =====

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Resume AudioContext on first user tap (required by mobile browsers)

document.addEventListener('pointerdown', () => {
  try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e) {}
}, { once: true });

// ===== FLY TO CART ANIMATION =====

function storeLogoDefault() {
  return 'https://i.ibb.co/PGQvXNTX/40c223bcc32d.webp';
}

function storeLogoFallback() {
  const n = (adminSettings && adminSettings.storeName) || 'م';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#ef4444"/><text x="32" y="44" font-size="40" text-anchor="middle" fill="#fff" font-weight="bold">' + n.charAt(0) + '</text></svg>');
}

async function init() {
  try { products = await resolveProductImages(); } catch(e) { console.warn('Media boot resolve failed:', e); }
  adminSettings = loadAdminSettings();
applyStoreCardVisibility();
  applyLanguage();
  // Restore admin nav button if previously logged in (without auto-opening panel)
  const nameEl = document.getElementById('storeName');
  const tagEl = document.getElementById('storeTagline');
  const logoEl = document.getElementById('storeLogo');
  applyScrolledHeaderMode(document.getElementById('header'));
  
  if (nameEl) nameEl.textContent = adminSettings.storeName || 'متجري';
  document.title = adminSettings.storeName || 'متجري';

  // Favicon dynamic load
  const savedLogoForFav = localStorage.getItem('mycart_logo') || adminSettings.logo;
  const savedFavicon = localStorage.getItem('mycart_favicon') || adminSettings.favicon || savedLogoForFav;
  if (savedFavicon) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = savedFavicon;
  }
  if (tagEl) tagEl.textContent = adminSettings.tagline || 'اختر منتجك المفضل';
  
  const displayMode = adminSettings.logoDisplayMode || 'both';
  const savedLogo = localStorage.getItem('mycart_logo') || adminSettings.logo;
  const logoDefault = storeLogoDefault();

  if (displayMode === 'logo_only') {
    if (logoEl) { logoEl.style.display = 'block'; logoEl.src = savedLogo || logoDefault; }
    if (nameEl) nameEl.style.display = 'none';
    if (tagEl) tagEl.style.display = 'none';
  } else if (displayMode === 'text_only') {
    if (logoEl) logoEl.style.display = 'none';
    if (nameEl) nameEl.style.display = 'block';
    if (tagEl) tagEl.style.display = 'block';
  } else if (displayMode === 'none') {
    if (logoEl) logoEl.style.display = 'none';
    if (nameEl) nameEl.style.display = 'none';
    if (tagEl) tagEl.style.display = 'none';
  } else {
    // default: 'both'
    if (logoEl) { logoEl.style.display = 'block'; logoEl.src = savedLogo || logoDefault; }
    if (nameEl) nameEl.style.display = 'block';
    if (tagEl) tagEl.style.display = 'block';
  }
  if (logoEl) {
    logoEl.onerror = function() {
      this.onerror = null;
      this.src = storeLogoFallback();
    };
  }

  applyAccentColor(adminSettings.accentColor || '#ef4444');
  const yr = document.getElementById('footerYear');
  if (yr) yr.textContent = new Date().getFullYear();
  loadAppearance();
  initFlashSales();
  if (typeof applySectionOverrides === 'function') applySectionOverrides();
  renderCategories();
  setTimeout(triggerScrollHint, 500);
  renderProducts(products);
  renderCartItems();
  updateCartBadge();
  updateWishlistBadge();
  if (isWholesale) applyWholesale();
  loadCustomerForm();
  handleRoute();
  applyMarketing();
  initPromoPopup();
  initSocialProof();
  // Reorder homepage sections according to admin settings
  reorderHomeSections();
  // Check for unread agency notifications on page load
  checkAdminNewOrders();
}

function loadSectionOrder() {
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  return (mkt.sectionOrder || ['banner', 'offers', 'flashSale', 'featured', 'newArrival', 'halfPrice', 'mostSold']).filter(function(s) { return s !== 'couponDetector'; });
}

function isSectionEnabled(key) {
  const order = loadSectionOrder();
  if (!order.includes(key)) return false;
  
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const showKey = key === 'flashSale' ? 'flashSales' : key === 'offers' ? 'offersSection' : key;
  if (mkt[showKey] && mkt[showKey].show === false) {
    return false;
  }
  return true;
}

function renderCustomSections() {
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const sections = mkt.customSections || [];
  const homePage = document.getElementById('homePage');
  if (!homePage) return;
  document.querySelectorAll('.pb-custom-section').forEach(function(el) { el.remove(); });
  // Hide custom sections when filtering by category or brand
  if (currentCat !== 'الكل' || currentBrand) return;
  
  sections.forEach(function(sec, idx) {
    if (sec._visible === false) return;
    var el = document.createElement('div');
    el.className = 'pb-custom-section';
    el.id = 'pbCustom_' + idx;
    el.dataset.pbIndex = idx;
    
    if (sec.type === 'hero') {
      var h = sec.height || 400;
      var bg = sec.bgImage ? 'url(' + sec.bgImage + ') center/cover no-repeat' : (sec.bgColor || '#1e293b');
      var overlay = sec.overlay !== false ? 'linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),' : '';
      el.style.cssText = 'position:relative;width:100%;max-width:1200px;margin:0 auto;box-sizing:border-box;overflow:hidden';
      el.innerHTML = '<div style="background:' + overlay + bg + ';min-height:' + h + 'px;display:flex;align-items:center;justify-content:center;padding:40px 20px;position:relative">' +
        '<div style="max-width:800px;text-align:center;color:' + (sec.textColor || '#ffffff') + '">' +
        (sec.title ? '<h1 style="font-size:2.2rem;font-weight:900;margin:0 0 10px;line-height:1.3">' + sec.title + '</h1>' : '') +
        (sec.subtitle ? '<p style="font-size:1.15rem;margin:0 0 8px;opacity:.9">' + sec.subtitle + '</p>' : '') +
        (sec.content ? '<p style="font-size:.95rem;margin:0 0 20px;opacity:.75;line-height:1.7">' + sec.content + '</p>' : '') +
        ((sec.btnText && sec.btnLink) ? '<a href="' + sec.btnLink + '" style="display:inline-block;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:800;font-size:.9rem;' +
          (sec.btnStyle === 'outline' ? 'border:2px solid #fff;color:#fff;background:transparent' : sec.btnStyle === 'underline' ? 'border-bottom:2px solid #fff;padding:8px 4px;border-radius:0;color:#fff;background:transparent' : 'background:' + (sec.accentColor || '#ef4444') + ';color:#fff') + '">' + sec.btnText + ' <i class="fa-solid fa-arrow-left"></i></a>' : '') +
        '</div></div>';
    } else if (sec.type === 'banner') {
      var br = sec.borderRadius || 12;
      el.style.cssText = 'padding:10px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      var imgHtml = sec.image ? '<img src="' + sec.image + '" alt="' + (sec.alt || sec.title || '') + '" style="width:100%;max-height:350px;object-fit:cover;border-radius:' + br + 'px;display:block;box-shadow:0 4px 20px rgba(0,0,0,.08);transition:transform .3s">' : '';
      if (sec.link) {
        el.innerHTML = '<a href="' + sec.link + '" target="_blank" style="display:block;text-decoration:none">' + imgHtml + '</a>';
      } else {
        el.innerHTML = imgHtml;
      }
    } else if (sec.type === 'text') {
      var align = sec.textAlign || 'center';
      var sizeScale = sec.textSize === 'lg' ? '1.15' : sec.textSize === 'sm' ? '0.9' : '1';
      var filterToolbar = document.getElementById('filterToolbar') || document.getElementById('productsGrid');
      if (filterToolbar) { var rect = filterToolbar.getBoundingClientRect ? null : null; }
      el.style.cssText = 'padding:40px 16px;background:' + (sec.bg || '#ffffff') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      el.innerHTML = '<div style="max-width:900px;margin:0 auto;text-align:' + align + ';font-size:' + sizeScale + 'rem">' +
        (sec.title ? '<h2 style="font-size:1.7rem;font-weight:800;margin:0 0 14px">' + sec.title + '</h2>' : '') +
        (sec.content ? '<div style="line-height:1.9;color:var(--text)">' + sec.content + '</div>' : '') +
        '</div>';
    } else if (sec.type === 'spacer') {
      var h = parseInt(sec.height) || 20;
      el.style.cssText = 'height:' + h + 'px;background:transparent;margin:0;max-width:1200px;width:100%;box-sizing:border-box;';
      el.innerHTML = '';
    } else if (sec.type === 'divider') {
      var t = sec.thickness || 2;
      var lc = sec.lineColor || '#e2e8f0';
      var ls = sec.lineStyle || 'solid';
      el.style.cssText = 'padding:20px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:16px';
      if (sec.text) {
        el.innerHTML = '<span style="flex:1;height:' + t + 'px;background:' + lc + ';border-radius:2px"></span>' +
          '<span style="font-size:.85rem;font-weight:700;color:' + lc + ';white-space:nowrap">' + sec.text + '</span>' +
          '<span style="flex:1;height:' + t + 'px;background:' + lc + ';border-radius:2px"></span>';
      } else {
        el.innerHTML = '<span style="flex:1;height:' + t + 'px;background:' + lc + ';border-radius:2px"></span>';
      }
    } else if (sec.type === 'gallery') {
      var images = sec.images || [];
      var layout = sec.layout || 'grid';
      var cols = parseInt(sec.columns) || 3;
      var gap = sec.gap || 10;
      var lightbox = sec.lightbox !== false;
      var aspectRatio = sec.aspectRatio && sec.aspectRatio !== 'free' ? sec.aspectRatio : null;
      var imgH = sec.imageHeight ? parseInt(sec.imageHeight) : (aspectRatio ? null : 150);
      var autoPlay = sec.autoPlay === true;
      var interval = (parseInt(sec.interval) || 3) * 1000;
      var perView = layout === 'carousel' ? Math.min(cols, images.length || 1) : 1;
      el.style.cssText = 'padding:20px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';

      var html = '';
      if (layout === 'slider') {
        var sid = 'gs_' + (sec._idx || Math.random().toString(36).slice(2,8));
        var sliderRatio = aspectRatio || '16/9';
        var itemsHtml = images.map(function(img, i) {
          var src = img.src || '';
          var caption = img.caption || '';
          var capHtml = caption ? '<div style="position:absolute;bottom:0;left:0;right:0;padding:8px 12px;background:linear-gradient(transparent,rgba(0,0,0,.45));color:#fff;font-size:.7rem;font-weight:500;text-align:center">' + caption + '</div>' : '';
          if (lightbox) return '<div class="gs-slide" onclick="openLightbox(\'' + src.replace(/'/g,"\\'") + '\')"><img src="' + src + '">' + capHtml + '</div>';
          if (img.link) return '<a href="' + img.link + '" target="_blank" class="gs-slide"><img src="' + src + '">' + capHtml + '</a>';
          return '<div class="gs-slide"><img src="' + src + '">' + capHtml + '</div>';
        }).join('');
        var dotsHtml = images.length > 1 ? '<div class="gs-dots" style="display:flex;gap:5px;justify-content:center;margin-top:8px">' + images.map(function(_, i) {
          return '<div data-idx="' + i + '" class="gs-dot" style="width:6px;height:6px;border-radius:50%;background:' + (i === 0 ? 'var(--accent)' : 'var(--border)') + ';cursor:pointer;transition:background .2s"></div>';
        }).join('') + '</div>' : '';
        html = '<div class="gs-wrap" id="' + sid + '" style="position:relative;border-radius:12px;overflow:hidden;background:#000">' +
          '<div class="gs-track" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-behavior:smooth"' +
          (autoPlay ? ' data-ap="' + interval + '"' : '') + '>' + itemsHtml + '</div>' +
          '<button class="gs-nav gs-next" onclick="var t=this.parentElement.querySelector(\'.gs-track\');var m=t.scrollWidth-t.clientWidth;if(t.scrollLeft>=m-1){t.scrollTo({left:0,behavior:\'smooth\'});return;}t.scrollBy({left:-t.clientWidth,behavior:\'smooth\'})"><i class="fa-solid fa-chevron-right"></i></button>' +
          '<button class="gs-nav gs-prev" onclick="var t=this.parentElement.querySelector(\'.gs-track\');var m=t.scrollWidth-t.clientWidth;if(t.scrollLeft<=1){t.scrollTo({left:m,behavior:\'smooth\'});return;}t.scrollBy({left:t.clientWidth,behavior:\'smooth\'})"><i class="fa-solid fa-chevron-left"></i></button>' +
          '<div class="gs-counter" style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.45);color:#fff;font-size:.6rem;font-weight:600;padding:2px 8px;border-radius:10px;z-index:2">1/' + images.length + '</div>' +
          dotsHtml + '</div>';
        html += '<style>#' + sid + ' .gs-track::-webkit-scrollbar{display:none}#' + sid + ' .gs-slide{min-width:100%;scroll-snap-align:start;position:relative;aspect-ratio:' + sliderRatio + '}#' + sid + ' .gs-slide img{width:100%;height:100%;display:block;object-fit:cover}#' + sid + ' .gs-nav{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,.3);color:#fff;cursor:pointer;font-size:.65rem;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:2;opacity:0}#' + sid + '.gs-wrap:hover .gs-nav{opacity:1}#' + sid + ' .gs-nav:hover{background:rgba(0,0,0,.55)}#' + sid + ' .gs-next{right:8px}#' + sid + ' .gs-prev{left:8px}</style>';
      } else if (layout === 'carousel') {
        var sid2 = 'gc_' + (sec._idx || Math.random().toString(36).slice(2,8));
        var itemsHtml2 = images.map(function(img, i) {
          var src = img.src || '';
          var caption = img.caption || '';
          var imgStyle = 'width:100%;display:block;object-fit:cover;border-radius:10px';
          if (aspectRatio) imgStyle += ';aspect-ratio:' + aspectRatio;
          else if (imgH) imgStyle += ';height:' + imgH + 'px';
          else imgStyle += ';height:150px';
          var capHtml = caption ? '<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,.45));color:#fff;font-size:.65rem;font-weight:500;border-radius:0 0 10px 10px">' + caption + '</div>' : '';
          var cardS = 'position:relative;overflow:hidden;border-radius:10px;flex-shrink:0;width:calc(100%/' + perView + ' - ' + gap + 'px);cursor:pointer;border:1px solid var(--border);background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,.05);line-height:0';
          if (lightbox) return '<div style="' + cardS + '" onclick="openLightbox(\'' + src.replace(/'/g,"\\'") + '\')"><img src="' + src + '" style="' + imgStyle + '">' + capHtml + '</div>';
          if (img.link) return '<a href="' + img.link + '" target="_blank" style="display:block;' + cardS + '"><img src="' + src + '" style="' + imgStyle + '">' + capHtml + '</a>';
          return '<div style="' + cardS + '"><img src="' + src + '" style="' + imgStyle + '">' + capHtml + '</div>';
        }).join('');
        html = '<div id="' + sid2 + '" style="overflow:hidden;border-radius:12px;border:1px solid var(--border);background:var(--card)"><div style="display:flex;gap:' + gap + 'px;padding:' + Math.round(gap/2) + 'px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none"' +
          (autoPlay ? ' data-ap="' + interval + '"' : '') + '>' + itemsHtml2 + '</div></div>';
        html += '<style>#' + sid2 + ' > div::-webkit-scrollbar{display:none}</style>';
      } else {
        function galleryCard(img, idx) {
          var src = img.src || '';
          var caption = img.caption || '';
          var cardRadius = 12;
          var imgStyle = 'width:100%;display:block;object-fit:cover;border-radius:' + (cardRadius - 2) + 'px;transition:transform .3s ease';
          if (aspectRatio) imgStyle += ';aspect-ratio:' + aspectRatio;
          else if (imgH) imgStyle += ';height:' + imgH + 'px';
          else imgStyle += ';height:150px';
          var zoomin = ' onmouseenter="this.querySelector(\'img\').style.transform=\'scale(1.08)\'" onmouseleave="this.querySelector(\'img\').style.transform=\'scale(1)\'"';
          var cap = caption ? '<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,.5));color:#fff;font-size:.7rem;font-weight:500;border-radius:0 0 ' + cardRadius + 'px ' + cardRadius + 'px">' + caption + '</div>' : '';
          var cardStyle = 'position:relative;overflow:hidden;border-radius:' + cardRadius + 'px;background:var(--card);border:1px solid var(--border);flex-shrink:0;line-height:0;box-shadow:0 1px 4px rgba(0,0,0,.06)';
          if (lightbox) return '<div style="' + cardStyle + '"' + zoomin + ' onclick="openLightbox(\'' + src.replace(/'/g,"\\'") + '\')"><img src="' + src + '" alt="' + caption + '" style="' + imgStyle + '">' + cap + '</div>';
          if (img.link) return '<a href="' + img.link + '" target="_blank" style="display:block;position:relative;overflow:hidden;border-radius:' + cardRadius + 'px;background:var(--card);border:1px solid var(--border);flex-shrink:0;line-height:0;box-shadow:0 1px 4px rgba(0,0,0,.06)"' + zoomin + '><img src="' + src + '" alt="' + caption + '" style="' + imgStyle + '">' + cap + '</a>';
          return '<div style="' + cardStyle + '"' + zoomin + '><img src="' + src + '" alt="' + caption + '" style="' + imgStyle + '">' + cap + '</div>';
        }
        if (layout === 'grid') {
          html = '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' +
            images.map(function(img, i) { return galleryCard(img, i); }).join('') + '</div>';
        } else {
          var half = Math.ceil(images.length / 2);
          var col1 = '', col2 = '';
          images.slice(0, half).forEach(function(img, i) {
            var h = (i % 3 === 0) ? '150px' : '110px';
            col1 += galleryCard(img, i).replace('line-height:0', 'line-height:0;height:' + h);
          });
          images.slice(half).forEach(function(img, i) {
            var h = (i % 2 === 0) ? '110px' : '140px';
            col2 += galleryCard(img, i + half).replace('line-height:0', 'line-height:0;height:' + h);
          });
          html = '<div style="display:flex;gap:' + gap + 'px"><div style="flex:1;display:flex;flex-direction:column;gap:' + gap + 'px">' + col1 + '</div><div style="flex:1;display:flex;flex-direction:column;gap:' + gap + 'px">' + col2 + '</div></div>';
        }
      }
      el.innerHTML = html;
    } else if (sec.type === 'video') {
      var url = sec.url || '';
      var autoplay = sec.autoplay ? '1' : '0';
      var muted = sec.muted ? '1' : '0';
      var controls = sec.controls !== false ? '1' : '0';
      var loop = sec.loop ? '1' : '0';
      var ratio = sec.ratio || '56.25';
      var embedUrl = '';
      if (url.indexOf('youtube.com/watch') !== -1 || url.indexOf('youtu.be') !== -1) {
        var vId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (vId) embedUrl = 'https://www.youtube.com/embed/' + vId[1] + '?autoplay=' + autoplay + '&mute=' + muted + '&controls=' + controls + '&loop=' + loop;
      } else if (url.indexOf('vimeo.com') !== -1) {
        var vimId = url.match(/vimeo\.com\/(\d+)/);
        if (vimId) embedUrl = 'https://player.vimeo.com/video/' + vimId[1] + '?autoplay=' + autoplay + '&muted=' + muted + '&loop=' + loop;
      }
      el.style.cssText = 'padding:20px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      if (embedUrl) {
        el.innerHTML = '<div style="position:relative;padding-bottom:' + ratio + '%;height:0;overflow:hidden;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1);background:#000">' +
          '<iframe src="' + embedUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allow="autoplay;fullscreen" allowfullscreen></iframe></div>';
      } else if (url) {
        el.innerHTML = '<video src="' + url + '" style="width:100%;border-radius:12px" ' + (sec.controls !== false ? 'controls' : '') + ' ' + (sec.autoplay ? 'autoplay' : '') + ' ' + (sec.muted ? 'muted' : '') + ' ' + (sec.loop ? 'loop' : '') + '></video>';
      }
    } else if (sec.type === 'countdown') {
      var endDate = sec.endDate || '';
      var countdownId = 'pbCountdown_' + idx;
      // Calculate end time
      var endTime = 0;
      if (sec.timerType === 'duration' && sec.duration) {
        endTime = Date.now() + sec.duration * 3600000;
      } else if (endDate) {
        endTime = new Date(endDate).getTime();
      }
      var isImageBg = sec.bgType === 'image' && sec.bgImage;
      var textCol = sec.textColor || '#fff';
      var accentCol = sec.accentColor || '#ef4444';
      var overlayStyle = isImageBg ? 'linear-gradient(rgba(0,0,0,'+(sec.overlay?'.65':'.15')+'),rgba(0,0,0,'+(sec.overlay?'.65':'.15')+')),' : '';
      var bgCss = isImageBg ? overlayStyle + 'url(' + sec.bgImage + ') center/cover no-repeat' : sec.bgType === 'transparent' ? 'transparent' : (sec.bgColor || '#0f172a');
      var layoutStyle = sec.layout === 'column' ? 'flex-direction:column;align-items:center' : sec.layout === 'grid' ? 'display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:300px;margin:0 auto' : 'display:flex;justify-content:center;gap:16px;flex-wrap:wrap';
      var unitStyle = sec.layout === 'grid' ? 'min-width:auto;padding:16px 12px' : sec.layout === 'column' ? 'min-width:140px;padding:16px 24px' : 'min-width:80px;padding:14px 20px';
      el.style.cssText = 'padding:50px 16px;background:' + bgCss + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;text-align:center';
      el.innerHTML = (sec.title ? '<h3 style="color:' + textCol + ';font-size:1.4rem;font-weight:800;margin:0 0 20px">' + sec.title + '</h3>' : '') +
        '<div id="' + countdownId + '" style="direction:ltr;' + layoutStyle + '">' +
        (sec.showDays !== false ? '<div class="pb-countdown-unit" style="' + unitStyle + ';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:14px;text-align:center;' + animStyle + '"><div class="pb-countdown-val" data-unit="days" style="font-size:2rem;font-weight:900;color:' + accentCol + ';line-height:1;' + animStyle + '">00</div><div style="font-size:.7rem;color:' + textCol + ';opacity:.6;margin-top:4px;font-weight:600">يوم</div></div>' : '') +
        (sec.showHours !== false ? '<div class="pb-countdown-unit" style="' + unitStyle + ';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:14px;text-align:center;' + animStyle + '"><div class="pb-countdown-val" data-unit="hours" style="font-size:2rem;font-weight:900;color:' + accentCol + ';line-height:1;' + animStyle + '">00</div><div style="font-size:.7rem;color:' + textCol + ';opacity:.6;margin-top:4px;font-weight:600">ساعة</div></div>' : '') +
        (sec.showMinutes !== false ? '<div class="pb-countdown-unit" style="' + unitStyle + ';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:14px;text-align:center;' + animStyle + '"><div class="pb-countdown-val" data-unit="minutes" style="font-size:2rem;font-weight:900;color:' + accentCol + ';line-height:1;' + animStyle + '">00</div><div style="font-size:.7rem;color:' + textCol + ';opacity:.6;margin-top:4px;font-weight:600">دقيقة</div></div>' : '') +
        (sec.showSeconds !== false ? '<div class="pb-countdown-unit" style="' + unitStyle + ';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:14px;text-align:center;' + animStyle + '"><div class="pb-countdown-val" data-unit="seconds" style="font-size:2rem;font-weight:900;color:' + accentCol + ';line-height:1;' + animStyle + '">00</div><div style="font-size:.7rem;color:' + textCol + ';opacity:.6;margin-top:4px;font-weight:600">ثانية</div></div>' : '') +
        '</div>' +
        (sec.message ? '<p style="color:' + textCol + ';font-size:.9rem;margin:16px 0 0;opacity:.8">' + sec.message + '</p>' : '');
      if (sec.bgType === 'image' && sec.bgImage) el.innerHTML += '</div>';
      // Start countdown
      if (endTime) {
        (function(targetId, endTm, accent) {
          var timer = setInterval(function() {
            var diff = endTm - Date.now();
            if (diff <= 0) {
              clearInterval(timer);
              var c = document.getElementById(targetId);
              if (c) { c.innerHTML = '<div style="color:' + accent + ';font-size:1.2rem;font-weight:700">' + (sec.message || 'انتهى العرض!') + '</div>'; }
              return;
            }
            var days = Math.floor(diff / 86400000);
            var hours = Math.floor((diff % 86400000) / 3600000);
            var minutes = Math.floor((diff % 3600000) / 60000);
            var seconds = Math.floor((diff % 60000) / 1000);
            var pad = function(n) { return n < 10 ? '0' + n : n; };
            var container = document.getElementById(targetId);
            if (!container) { clearInterval(timer); return; }
            container.querySelectorAll('.pb-countdown-val').forEach(function(v) {
              if (v.dataset.unit === 'days') v.textContent = pad(days);
              else if (v.dataset.unit === 'hours') v.textContent = pad(hours);
              else if (v.dataset.unit === 'minutes') v.textContent = pad(minutes);
              else if (v.dataset.unit === 'seconds') v.textContent = pad(seconds);
            });
          }, 1000);
        })(countdownId, endTime, accentCol);
      }
    } else if (sec.type === 'testimonials') {
      var items = sec.items || [];
      el.style.cssText = 'padding:50px 16px;background:' + (sec.bg || '#f8fafc') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      var tHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">';
      items.forEach(function(item) {
        var stars = '';
        var rating = parseInt(item.rating) || 0;
        for (var i = 0; i < 5; i++) { stars += i < rating ? '<i class="fa-solid fa-star" style="color:#f59e0b;font-size:.7rem"></i>' : '<i class="fa-regular fa-star" style="color:#d1d5db;font-size:.7rem"></i>'; }
        tHtml += '<div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.05);text-align:center">' +
          (item.avatar ? '<img src="' + item.avatar + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;border:3px solid var(--border)">' : '<div style="width:50px;height:50px;border-radius:50%;background:#e2e8f0;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#94a3b8"><i class="fa-solid fa-user"></i></div>') +
          (item.text ? '<p style="font-size:.82rem;line-height:1.7;color:var(--text);margin:0 0 12px;font-style:italic">" ' + item.text + ' "</p>' : '') +
          '<div style="font-size:.65rem;margin-bottom:6px">' + stars + '</div>' +
          (item.name ? '<div style="font-size:.85rem;font-weight:800">' + item.name + '</div>' : '') +
          (item.role ? '<div style="font-size:.7rem;color:var(--text-muted)">' + item.role + '</div>' : '') +
          '</div>';
      });
      tHtml += '</div>';
      el.innerHTML = tHtml;
    } else if (sec.type === 'features') {
      var items = sec.items || [];
      var cols = parseInt(sec.columns) || 3;
      var fBg = sec.bg || '#ffffff';
      var ic = sec.iconColor || '#ef4444';
      var sb = sec.showBorder !== false;
      el.style.cssText = 'padding:50px 16px;background:' + fBg + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      var fHtml = '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:24px">';
      items.forEach(function(item) {
        var icon = item.icon || 'fa-star';
        var isFa = icon.indexOf('fa-') === 0;
        fHtml += '<div style="text-align:center;padding:28px 16px;' + (sb ? 'border:1px solid var(--border);' : '') + 'border-radius:14px;background:#fff;transition:transform .25s,box-shadow .25s">' +
          '<div style="font-size:2rem;margin-bottom:10px;color:' + ic + '">' + (isFa ? '<i class="fa-solid ' + icon + '"></i>' : icon) + '</div>' +
          (item.title ? '<h4 style="font-size:1rem;font-weight:800;margin:0 0 6px">' + item.title + '</h4>' : '') +
          (item.desc ? '<p style="font-size:.78rem;line-height:1.7;color:var(--text-muted);margin:0">' + item.desc + '</p>' : '') +
          '</div>';
      });
      fHtml += '</div>';
      el.innerHTML = fHtml;
    } else if (sec.type === 'newsletter') {
      var nsId = 'pbNewsletter_' + idx;
      el.style.cssText = 'padding:50px 16px;background:' + (sec.bg || '#f1f5f9') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;text-align:center';
      el.innerHTML = '<div style="max-width:500px;margin:0 auto">' +
        (sec.icon ? '<div style="font-size:3rem;margin-bottom:10px">' + sec.icon + '</div>' : '') +
        (sec.title ? '<h3 style="font-size:1.3rem;font-weight:800;margin:0 0 6px">' + sec.title + '</h3>' : '') +
        (sec.subtitle ? '<p style="font-size:.85rem;color:var(--text-muted);margin:0 0 20px">' + sec.subtitle + '</p>' : '') +
        '<div style="display:flex;gap:8px;max-width:420px;margin:0 auto;direction:ltr">' +
        '<input type="email" id="' + nsId + '" placeholder="' + (sec.placeholder || 'بريدك الإلكتروني') + '" style="flex:1;padding:12px 16px;border:2px solid var(--border);border-radius:12px;font-family:inherit;font-size:.85rem;outline:none;text-align:right">' +
        '<button onclick="var e=document.getElementById(\'' + nsId + '\');if(e.value&&e.value.includes(\'@\')){showToast(\'✅ تم الاشتراك بنجاح\',\'success\');e.value=\'\'}else{showToast(\'❌ الرجاء إدخال بريد صحيح\',\'error\')}" style="padding:12px 24px;border:none;border-radius:12px;background:' + (sec.accentColor || '#ef4444') + ';color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem;white-space:nowrap">' + (sec.btnText || 'اشتراك') + '</button></div></div>';
    } else if (sec.type === 'products') {
      // Render immediately (no spinner, no setTimeout) - same structure as offersScroll
      (function(secData, el) {
        var bgCss = secData.bgImage ? 'linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.05)),url(' + secData.bgImage + ') center/cover no-repeat' : (secData.bgColor || 'var(--card)');
        el.classList.add('pb-products-section');
        el.style.cssText = 'background:' + bgCss + ';margin:0 16px 24px;box-sizing:border-box;';
        var all = (typeof products !== 'undefined' && products.length) ? products : ((typeof loadProducts === 'function') ? loadProducts() : []);
        var filtered = [];
        if (secData.mode === 'featured') {
          filtered = all.filter(function(p) { return p.featured; });
        } else if (secData.mode === 'ids' && secData.productIds) {
          var ids = secData.productIds.split(',').map(function(i) { return parseInt(i.trim()); }).filter(function(i) { return !isNaN(i); });
          filtered = all.filter(function(p) { return ids.indexOf(p.id) !== -1; });
        } else if (secData.mode === 'category' && secData.category) {
          var cat = secData.category.trim();
          filtered = all.filter(function(p) { return p.category === cat || (Array.isArray(p.categories) && p.categories.indexOf(cat) !== -1); });
        } else {
          filtered = all.slice();
        }
        if (secData.sortBy === 'newest') filtered.sort(function(a,b) { return (b.id||0) - (a.id||0); });
        else if (secData.sortBy === 'cheapest') filtered.sort(function(a,b) { return (a.price||0) - (b.price||0); });
        else if (secData.sortBy === 'expensive') filtered.sort(function(a,b) { return (b.price||0) - (a.price||0); });
        else if (secData.sortBy === 'bestselling') filtered.sort(function(a,b) { return (b.soldCount||0) - (a.soldCount||0); });
        var limit = secData.limit || 8;
        filtered = filtered.slice(0, limit);
        if (filtered.length === 0) { el.innerHTML = ''; return; }
        var titleHtml = secData.title ? '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 16px 10px"><span style="font-weight:800;font-size:1rem;color:' + (secData.textColor || 'var(--text)') + '">' + secData.title + '</span></div>' : '';
        if (secData.layout === 'carousel' || !secData.layout || secData.layout === '') {
          var scrollId = 'pbCS_' + el.id;
          var cardsHtml = filtered.map(function(p) {
            var img = getProductImages ? getProductImages(p)[0] : ((p.images && p.images[0]) || p.image || '');
            var offered = typeof calcOfferPrice === 'function' ? calcOfferPrice(p) : null;
            var finalPrice = offered !== null ? offered : (wPrice(p));
            var hasDiscount = (offered !== null) || (p.oldPrice && p.oldPrice > p.price);
            var displayOldPrice = offered !== null ? p.price : p.oldPrice;
            var oldPriceHtml = (hasDiscount && secData.showPrice !== false) ? '<span style="font-size:.7rem;text-decoration:line-through;color:var(--text-muted)">' + CURRENCY + (displayOldPrice || 0) + '</span>' : '';
            var discountPercent = offered !== null ? Math.round(((p.price - offered)/p.price)*100) : (p.oldPrice ? Math.round(((p.oldPrice - p.price)/p.oldPrice)*100) : 0);
            var badge = (hasDiscount && discountPercent > 0) ? '<span class="na-badge"><i class="fa-solid fa-tag"></i> -' + discountPercent + '%</span>' : '<span class="na-badge">🔖 جديد</span>';
            return '<div class="mini-card" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
              badge +
              '<div class="feat-img"><img src="' + img + '" alt="' + (p.name||'') + '" loading="lazy"></div>' +
              _cardMiniNavHtml(p) +
              '<div class="feat-body">' +
              '<h4>' + (p.name||'') + '</h4>' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
              (secData.showPrice !== false ? '<span class="feat-price">' + CURRENCY + finalPrice + '</span>' + wBadge() : '') +
              oldPriceHtml +
              '</div>' +
              (secData.showAddToCart !== false ? '<button class="feat-add" onclick="event.stopPropagation();quickAdd(' + p.id + ', this)"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-plus') + '"></i> ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd')) + '</button>' : '') +
              '</div>' +
              '</div>';
          }).join('');
          var secTitle = secData.title || 'منتوجات';
          var pbIcon = secData.icon || 'fa-bag-shopping';
          var pbIconHtml = pbIcon.indexOf('fa-') === 0 ? '<i class="fa-solid ' + pbIcon + '" style="color:#f59e0b"></i>' : '<span style="font-size:1.15rem;color:#f59e0b">' + pbIcon + '</span>';
          var headerHtml = '<div class="flash-section-header">' +
            '<h3>' + pbIconHtml + ' <span>' + secTitle + '</span></h3>' +
            '<div class="section-arrow-btns">' +
            '<button type="button" class="section-arrow-btn" onclick="scrollSection(\'' + scrollId + '\', \'prev\')" title="السابق"><i class="fa-solid fa-chevron-right"></i></button>' +
            '<button type="button" class="section-arrow-btn" onclick="scrollSection(\'' + scrollId + '\', \'next\')" title="التالي"><i class="fa-solid fa-chevron-left"></i></button>' +
            '</div>' +
            '</div>';
          el.innerHTML = headerHtml + '<div class="section-wrap"><div id="' + scrollId + '" class="section-scroll">' + cardsHtml + '</div></div>';
        } else {
          // Grid layout
          var cardsHtml = filtered.map(function(p) {
            return typeof _productCardHtml === 'function' ? _productCardHtml(p) : '';
          }).join('');
          el.innerHTML = titleHtml + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;padding:0 16px 16px;">' + cardsHtml + '</div>';
        }
      })(sec, el);
    } else if (sec.type === 'categories') {
      // Build category list from source
      var items = [];
      if (sec.mode === 'auto') {
        var stored = localStorage.getItem('mycart_categories');
        var siteCats = [];
        if (stored) { try { siteCats = JSON.parse(stored); } catch(e) {} }
        var all = getFilteredProducts ? getFilteredProducts() : (window._allProducts || []);
        var filterNames = sec.categoryNames ? sec.categoryNames.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
        var brandNames = sec.includeBrands ? sec.includeBrands.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
        siteCats.forEach(function(sc) {
          if (sc.isBrand && brandNames.indexOf(sc.name) === -1) return;
          if (filterNames.length && filterNames.indexOf(sc.name) === -1) return;
          var cnt = all.filter(function(p) { return p.category === sc.name || (Array.isArray(p.categories) && p.categories.indexOf(sc.name) !== -1); }).length;
          var link = sc.link;
          if (!link) link = sc.isBrand ? 'javascript:filterBrand(\'' + sc.name.replace(/'/g,"\\'") + '\')' : 'javascript:filterCategory(\'' + sc.name.replace(/'/g,"\\'") + '\')';
          items.push({ name: sc.name, image: sc.image || '', count: cnt || '', link: link });
        });
        if (!items.length) {
          // fallback: get all unique categories from products
          var allCats = [...new Set(all.flatMap(function(p) { return p.categories && p.categories.length ? p.categories : (p.category ? [p.category] : []); }))];
          allCats.forEach(function(cn) {
            if (filterNames.length && filterNames.indexOf(cn) === -1) return;
            var cnt = all.filter(function(p) { return p.category === cn || (Array.isArray(p.categories) && p.categories.indexOf(cn) !== -1); }).length;
            items.push({ name: cn, image: '', count: cnt || '', link: 'javascript:filterCategory(\'' + cn.replace(/'/g,"\\'") + '\')' });
          });
        }
      } else {
        items = sec.items || [];
      }
      var carsPerView = sec.layout === 'carousel' ? (parseInt(sec.cardsPerView) || 4) : 4;
      if (sec.layout === 'carousel' && window.innerWidth < 640) {
        carsPerView = parseInt(sec.mobileCards) || Math.min(carsPerView, 2);
      }
      var gap = sec.gap != null ? sec.gap : 12;
      var cardR = (sec.cardRadius != null ? sec.cardRadius : 12) + 'px';
      var imgH = (sec.imageHeight || 100) + 'px';
      var isCompact = sec.compact;
      var shadowMap = { none:'0 0 0 transparent', sm:'0 1px 3px rgba(0,0,0,.08)', md:'0 4px 12px rgba(0,0,0,.1)', lg:'0 8px 25px rgba(0,0,0,.15)' };
      var cardShadow = shadowMap[sec.cardShadow] || shadowMap.sm;
      var bgCss = sec.bgImage ? 'linear-gradient(rgba(0,0,0,.03),rgba(0,0,0,.03)),url(' + sec.bgImage + ') center/cover no-repeat' : (sec.bgColor || 'transparent');
      var tCol = sec.textColor || 'var(--text)';
      el.style.cssText = 'padding:30px 16px;background:' + bgCss + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      var cHtml = (sec.title ? '<h3 style="color:' + tCol + ';font-size:1.2rem;font-weight:800;margin:0 0 18px;text-align:center">' + sec.title + '</h3>' : '');
      if (sec.layout === 'carousel') {
        cHtml += '<div style="display:flex;gap:' + gap + 'px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 0;-webkit-overflow-scrolling:touch;scrollbar-width:none">';
        items.forEach(function(cat) {
          cHtml += (cat.link ? '<a href="' + cat.link + '"' : '<div') + ' style="flex:0 0 calc(' + (100/carsPerView) + '% - ' + gap + 'px);min-width:' + (isCompact?'100':'160') + 'px;scroll-snap-align:start;display:block;text-decoration:none;color:' + tCol + ';background:#fff;border-radius:' + cardR + ';overflow:hidden;transition:transform .2s,box-shadow .2s;border:1px solid var(--border);text-align:center;cursor:pointer;box-shadow:' + cardShadow + '">' +
            (cat.image ? '<img src="' + cat.image + '" alt="' + (cat.name||'') + '" style="width:100%;height:' + imgH + ';object-fit:cover;display:block">' : '<div style="height:' + imgH + ';display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-size:2rem;color:#94a3b8"><i class="fa-solid fa-folder-open"></i></div>') +
            '<div style="padding:' + (isCompact?'8px':'12px') + '">' +
            (sec.showNames !== false ? '<div style="font-weight:' + (isCompact?'600':'800') + ';font-size:' + (isCompact?'.75rem':'.85rem') + '">' + (cat.name||'') + '</div>' : '') +
            (sec.showCount !== false && cat.count ? '<div style="font-size:.65rem;color:' + tCol + ';opacity:.6;margin-top:2px">' + cat.count + ' منتج</div>' : '') + '</div>' +
            (cat.link ? '</a>' : '</div>');
        });
        cHtml += '</div>';
      } else if (sec.layout === 'list') {
        cHtml += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:' + gap + 'px">';
        items.forEach(function(cat) {
          cHtml += (cat.link ? '<a href="' + cat.link + '"' : '<div') + ' style="display:flex;align-items:center;gap:8px;text-decoration:none;color:' + tCol + ';background:#fff;border-radius:' + cardR + ';padding:' + (isCompact?'6px 12px':'10px 16px') + ';border:1px solid var(--border);transition:all .2s;cursor:pointer;box-shadow:' + cardShadow + '">' +
            (cat.image ? '<img src="' + cat.image + '" alt="' + (cat.name||'') + '" style="width:' + (isCompact?'24':'36') + 'px;height:' + (isCompact?'24':'36') + 'px;border-radius:50%;object-fit:cover;flex-shrink:0">' : '<span style="font-size:' + (isCompact?'1rem':'1.3rem') + ';color:#94a3b8"><i class="fa-solid fa-folder"></i></span>') +
            (sec.showNames !== false ? '<span style="font-weight:' + (isCompact?'600':'700') + ';font-size:' + (isCompact?'.75rem':'.85rem') + '">' + (cat.name||'') + '</span>' : '') +
            (sec.showCount !== false && cat.count ? '<span style="font-size:.65rem;color:' + tCol + ';opacity:.6">(' + cat.count + ')</span>' : '') +
            (cat.link ? '</a>' : '</div>');
        });
        cHtml += '</div>';
      } else {
        cHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(' + (sec.minCardWidth||140) + 'px, 1fr));gap:' + gap + 'px">';
        items.forEach(function(cat) {
          cHtml += (cat.link ? '<a href="' + cat.link + '"' : '<div') + ' style="display:block;text-decoration:none;color:' + tCol + ';background:#fff;border-radius:' + cardR + ';overflow:hidden;transition:transform .2s,box-shadow .2s;border:1px solid var(--border);text-align:center;cursor:pointer;box-shadow:' + cardShadow + '">' +
            (cat.image ? '<img src="' + cat.image + '" alt="' + (cat.name||'') + '" style="width:100%;height:' + imgH + ';object-fit:cover;display:block">' : '<div style="height:' + imgH + ';display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-size:' + (isCompact?'1.5rem':'2rem') + ';color:#94a3b8"><i class="fa-solid fa-folder-open"></i></div>') +
            '<div style="padding:' + (isCompact?'8px':'12px') + '">' +
            (sec.showNames !== false ? '<div style="font-weight:' + (isCompact?'600':'800') + ';font-size:' + (isCompact?'.75rem':'.85rem') + '">' + (cat.name||'') + '</div>' : '') +
            (sec.showCount !== false && cat.count ? '<div style="font-size:.65rem;color:' + tCol + ';opacity:.6;margin-top:2px">' + cat.count + ' منتج</div>' : '') + '</div>' +
            (cat.link ? '</a>' : '</div>');
        });
        cHtml += '</div>';
      }
      el.innerHTML = cHtml;
    } else if (sec.type === 'faq') {
      var items = sec.items || [];
      var openFirst = sec.openFirst !== false;
      el.style.cssText = 'padding:40px 16px;background:' + (sec.bg || '#ffffff') + ';margin:0 auto;max-width:900px;width:100%;box-sizing:border-box;';
      var faqHtml = '<div style="display:flex;flex-direction:column;gap:8px">';
      items.forEach(function(item, fi) {
        var isOpen = fi === 0 && openFirst;
        faqHtml += '<div class="pb-faq-item" style="border:1px solid var(--border);border-radius:12px;overflow:hidden">' +
          '<div onclick="var c=this.nextElementSibling;var icon=this.querySelector(\'.faq-icon\');if(c.style.display===\'block\'){c.style.display=\'none\';if(icon)icon.className=\'faq-icon fa-solid fa-plus\';this.style.background=\'transparent\'}else{c.style.display=\'block\';if(icon)icon.className=\'faq-icon fa-solid fa-minus\';this.style.background=\'#f8fafc\'}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;font-weight:700;font-size:.9rem;' + (isOpen ? 'background:#f8fafc' : '') + ';transition:background .2s">' +
          '<i class="faq-icon fa-solid ' + (isOpen ? 'fa-minus' : 'fa-plus') + '" style="color:var(--accent);font-size:.8rem;flex-shrink:0"></i>' +
          '<span style="flex:1">' + (item.q||'') + '</span></div>' +
          '<div style="display:' + (isOpen ? 'block' : 'none') + ';padding:14px 16px 16px 44px;font-size:.84rem;line-height:1.8;color:var(--text-muted);border-top:1px solid var(--border)">' + (item.a||'') + '</div></div>';
      });
      faqHtml += '</div>';
      el.innerHTML = faqHtml;
    } else if (sec.type === 'contact') {
      el.style.cssText = 'padding:40px 16px;background:' + (sec.bg || '#ffffff') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      var contactHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;max-width:900px;margin:0 auto">' +
        '<div>' + (sec.title ? '<h3 style="font-size:1.2rem;font-weight:800;margin:0 0 16px">' + sec.title + '</h3>' : '') +
        '<div style="display:flex;flex-direction:column;gap:12px">';
      if (sec.address) contactHtml += '<div style="display:flex;align-items:center;gap:10px;font-size:.85rem"><span style="color:var(--accent);font-size:1.1rem"><i class="fa-solid fa-location-dot"></i></span><span>' + sec.address + '</span></div>';
      if (sec.phone) contactHtml += '<div style="display:flex;align-items:center;gap:10px;font-size:.85rem"><span style="color:var(--accent);font-size:1.1rem"><i class="fa-solid fa-phone"></i></span><span dir="ltr">' + sec.phone + '</span></div>';
      if (sec.email) contactHtml += '<div style="display:flex;align-items:center;gap:10px;font-size:.85rem"><span style="color:var(--accent);font-size:1.1rem"><i class="fa-solid fa-envelope"></i></span><span dir="ltr">' + sec.email + '</span></div>';
      if (sec.whatsapp) contactHtml += '<div style="display:flex;align-items:center;gap:10px;font-size:.85rem"><span style="color:#25D366;font-size:1.1rem"><i class="fa-brands fa-whatsapp"></i></span><span dir="ltr">' + sec.whatsapp + '</span></div>';
      contactHtml += '</div></div>';
      if (sec.mapEmbed) {
        contactHtml += '<div style="border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">' + sec.mapEmbed + '</div>';
      }
      contactHtml += '</div>';
      el.innerHTML = contactHtml;
    } else if (sec.type === 'social') {
      var items = sec.items || [];
      var size = sec.size || 'md';
      var style = sec.style || 'rounded';
      var sizeMap = { sm: '36px', md: '46px', lg: '56px' };
      var iconSizeMap = { sm: '.85rem', md: '1.1rem', lg: '1.4rem' };
      var s = sizeMap[size] || '46px';
      var isz = iconSizeMap[size] || '1.1rem';
      var br = style === 'circle' ? '50%' : style === 'square' ? '8px' : '14px';
      var platformColors = {
        facebook: '#1877F2', twitter: '#1DA1F2', instagram: '#E4405F', youtube: '#FF0000',
        tiktok: '#000000', snapchat: '#FFFC00', whatsapp: '#25D366', telegram: '#0088CC',
        linkedin: '#0A66C2', pinterest: '#BD081C'
      };
      el.style.cssText = 'padding:30px 16px;background:' + (sec.bg || 'transparent') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;text-align:center';
      var sHtml = '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">';
      items.forEach(function(link) {
        var color = platformColors[link.platform] || '#64748b';
        var icon = link.icon || '';
        if (!icon) {
          var iconMap = { facebook:'fa-facebook-f', twitter:'fa-x-twitter', instagram:'fa-instagram', youtube:'fa-youtube', tiktok:'fa-tiktok', snapchat:'fa-snapchat-ghost', whatsapp:'fa-whatsapp', telegram:'fa-telegram-plane', linkedin:'fa-linkedin-in', pinterest:'fa-pinterest-p' };
          icon = iconMap[link.platform] || 'fa-globe';
        }
        sHtml += '<a href="' + (link.url||'#') + '" target="_blank" style="display:flex;align-items:center;justify-content:center;width:' + s + ';height:' + s + ';border-radius:' + br + ';background:' + color + ';color:#fff;text-decoration:none;transition:transform .2s,box-shadow .2s;font-size:' + isz + '" title="' + link.platform + '"><i class="fa-brands ' + icon + '"></i></a>';
      });
      sHtml += '</div>';
      el.innerHTML = sHtml;
    } else if (sec.type === 'html') {
      el.style.cssText = 'padding:10px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      if (sec.height) { el.style.height = sec.height + 'px'; el.style.overflow = 'auto'; }
      el.innerHTML = sec.code || '';
    } else if (sec.type === 'logos') {
      var images = sec.images || [];
      var speedMap2 = { slow: 40, medium: 22, fast: 10 };
      var durBase = speedMap2[sec.speed] || 22;
      var hL = sec.height || 60;
      var logBg = sec.bg || '#ffffff';
      var grayscale = sec.grayscale !== false;
      var linkMode = sec.linkMode || 'none';
      if (!images.length) images = [];
      if (!document.getElementById('pbLogoScrollStyle')) {
        var sL = document.createElement('style');
        sL.id = 'pbLogoScrollStyle';
        sL.textContent = [
          '@keyframes pbLogosScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
          '',
          '.pb-logo-card{flex-shrink:0;display:flex;align-items:center;justify-content:center;',
            'margin:0 8px;',
            'transition:all .3s;}',
          '.pb-logo-card .pb-logo-img{transition:all .35s;border-radius:10px;}',
          '.pb-logo-card:hover .pb-logo-img{filter:none!important;opacity:1!important;transform:scale(1.06);}'
        ].join('');
        document.head.appendChild(sL);
      }
      function logoLinkWrap3(lHtml, img) {
        if (linkMode === 'custom' && img.link) {
          return '<a href="' + img.link + '" target="_blank" style="text-decoration:none;display:contents">' + lHtml + '</a>';
        }
        return lHtml;
      }
      var imgFilterVal = grayscale ? 'grayscale(1)' : 'none';
      var imgOpacityVal = grayscale ? '0.65' : '1';
      var oneCopy = images.map(function(img) {
        var imgH = Math.max(40, hL - 8);
        var inner = img.src
          ? '<img src="' + img.src + '" alt="' + (img.name || '') + '" class="pb-logo-img"'
            + ' style="max-height:' + imgH + 'px;max-width:160px;object-fit:contain;display:block;'
            + 'filter:' + imgFilterVal + ';opacity:' + imgOpacityVal + ';">'
          : '<span style="font-size:.72rem;font-weight:700;color:#94a3b8">' + (img.name || '') + '</span>';
        var card = '<div class="pb-logo-card" style="height:' + hL + 'px;">' + inner + '</div>';
        return logoLinkWrap3(card, img);
      }).join('');
      var estCopyPx = Math.max(170, (images.length || 1) * 170);
      var halfCount = Math.max(3, Math.ceil(2000 / estCopyPx));
      var halfHtml = '';
      for (var hc = 0; hc < halfCount; hc++) halfHtml += oneCopy;
      var probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;display:flex;';
      probe.innerHTML = halfHtml;
      document.body.appendChild(probe);
      var halfW = probe.offsetWidth || 100;
      document.body.removeChild(probe);
      var vw = window.innerWidth || document.documentElement.clientWidth || 1200;
      var needHalves = Math.max(2, Math.ceil((vw + 100) / halfW));
      if (needHalves % 2) needHalves++;
      var durL = durBase * (needHalves / 2);
      var allLogos = '';
      for (var hi = 0; hi < needHalves; hi++) allLogos += halfHtml;
      el.style.cssText = 'margin:0 16px 24px;background:' + logBg + ';border-radius:var(--card-radius,16px);'
        + 'box-shadow:0 4px 20px rgba(0,0,0,.04);'
        + 'padding:20px 0;box-sizing:border-box;overflow:hidden;';
      var titleHtml = sec.title
        ? '<div style="text-align:center;font-size:1rem;font-weight:800;color:var(--text);'
          + 'padding:0 20px 14px;margin-bottom:4px;border-bottom:1px solid var(--border,rgba(0,0,0,.06));">'
          + sec.title + '</div>'
        : '';
      el.innerHTML = titleHtml
        + '<div style="overflow:hidden;padding:4px 0;display:flex;align-items:center;justify-content:flex-end;'
          + 'mask-image:linear-gradient(to right,rgba(0,0,0,0) 0%,rgba(0,0,0,1) 8%,rgba(0,0,0,1) 92%,rgba(0,0,0,0) 100%);'
          + '-webkit-mask-image:linear-gradient(to right,rgba(0,0,0,0) 0%,rgba(0,0,0,1) 8%,rgba(0,0,0,1) 92%,rgba(0,0,0,0) 100%)">'
        + '<div class="pb-logos-track" style="display:flex;align-items:center;width:max-content;'
          + 'animation:pbLogosScroll ' + durL + 's linear infinite;">' + allLogos + '</div></div>';
    } else if (sec.type === 'breaking') {
      var bkText = sec.text || sec.title || '';
      var bkBg = sec.bgColor || '#1a5579';
      var bkBorder = sec.borderColor || sec.bgColor || '#1a5579';
      var bkFg = sec.textColor || '#ffffff';
      var bkLink = String(sec.link || '').trim();
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
      var bkBoxStyle = 'text-align:center;background-color:' + bkBg + ';border:4px solid ' + bkBorder + ';box-shadow:' + bkShadow + ';border-radius:12px;padding:12px 16px;color:' + bkFg + ';';
      if (bkDeco === 'wave') {
        var bkWaveSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='20'><path d='M0 10 Q20 0 40 10 Q60 20 80 10' fill='none' stroke='" + bkFg + "55' stroke-width='1.5'/></svg>";
        var bkWaveEnc = encodeURIComponent(bkWaveSvg).replace(/'/g, '%27');
        bkBoxStyle += 'background-image:url(\'data:image/svg+xml,' + bkWaveEnc + '\');background-repeat:repeat;';
      }
      var bkInner = bkAnim === 'marquee' ? '<span class="pb-bn-mq" style="color:inherit;font-weight:700">' + bkText + '</span>' : '<span style="color:inherit;font-weight:700">' + bkText + '</span>';
      var bkBox = '<div class="breaking-text' + bkAnimClass + bkDecoClass + '" style="' + bkBoxStyle + '">' + bkInner + '</div>';
      var bkOuter = '<div class="breaking">' + (bkLink ? '<a href="' + bkLink + '" style="text-decoration:none;display:block">' + bkBox + '</a>' : bkBox) + '</div>';
      el.style.cssText = 'padding:16px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      el.innerHTML = bkOuter;
    } else if (sec.type === 'note' || sec.type === 'alert') {
      var ntIcon = sec.icon || (sec.type === 'alert' ? '⚠️' : '📝');
      var ntBg = sec.bgColor || (sec.type === 'alert' ? '#fef3c7' : '#eff6ff');
      var ntAcc = sec.accentColor || (sec.type === 'alert' ? '#f59e0b' : '#3b82f6');
      var ntFg = sec.textColor || (sec.type === 'alert' ? '#92400e' : '#1e293b');
      el.style.cssText = 'padding:16px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
      el.innerHTML = '<div style="background:'+ntBg+';border-right:4px solid '+ntAcc+';border-radius:12px;padding:16px 18px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 2px 8px rgba(0,0,0,.05)">'
        + (ntIcon ? '<span style="flex-shrink:0;width:34px;height:34px;border-radius:10px;background:'+ntAcc+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:1rem">'+ntIcon+'</span>' : '')
        + '<div style="flex:1;min-width:0">'
        + (sec.title ? '<div style="font-size:.95rem;font-weight:800;color:'+ntFg+';margin-bottom:4px">'+sec.title+'</div>' : '')
        + (sec.text ? '<div style="font-size:.85rem;line-height:1.8;color:'+ntFg+';opacity:.95">'+sec.text+'</div>' : '')
        + '</div></div>';
    } else if (sec.type === 'banner' || sec.type === 'text' || sec.type === 'spacer') {
      // Legacy support for old naming
      if (sec.type === 'text') {
        el.style.cssText = 'padding:30px 16px;background:' + (sec.bg || '#ffffff') + ';margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
        el.innerHTML = '<div style="max-width:900px;margin:0 auto;text-align:center">' +
          (sec.title ? '<h2 style="font-size:1.6rem;font-weight:800;margin:0 0 12px">' + sec.title + '</h2>' : '') +
          (sec.content ? '<div style="font-size:1rem;line-height:1.8;color:var(--text)">' + sec.content + '</div>' : '') +
          '</div>';
      } else if (sec.type === 'banner') {
        el.style.cssText = 'padding:10px 16px;margin:0 auto;max-width:1200px;width:100%;box-sizing:border-box;';
        var imgHtml = sec.image ? '<img src="' + sec.image + '" alt="' + (sec.title||'') + '" style="width:100%;max-height:300px;object-fit:cover;border-radius:12px;display:block;box-shadow:0 4px 16px rgba(0,0,0,.08)">' : '';
        if (sec.link) {
          el.innerHTML = '<a href="' + sec.link + '" target="_blank" style="display:block;text-decoration:none">' + imgHtml + '</a>';
        } else {
          el.innerHTML = imgHtml;
        }
      } else if (sec.type === 'spacer') {
        var h = parseInt(sec.height || sec.content) || 20;
        el.style.cssText = 'height:' + h + 'px;background:' + (sec.bg || 'transparent') + ';margin:0;max-width:1200px;width:100%;box-sizing:border-box;';
        el.innerHTML = '';
      }
    }
    homePage.insertBefore(el, document.getElementById('filterToolbar') || document.getElementById('productsGrid'));
  });
  setTimeout(startGalleryAutoPlay, 0);
}

function startGalleryAutoPlay() {
  document.querySelectorAll('.gs-wrap').forEach(function(wrap) {
    var track = wrap.querySelector('.gs-track');
    if (!track) return;
    var dots = wrap.querySelectorAll('.gs-dot');
    var counter = wrap.querySelector('.gs-counter');
    var n = dots.length || 1;
    function updateDots() {
      var cur = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach(function(d, j) { d.style.background = j === cur ? 'var(--accent)' : 'var(--border)'; });
      if (counter) counter.textContent = (cur + 1) + '/' + n;
    }
    track.addEventListener('scroll', updateDots);
    dots.forEach(function(d) {
      d.addEventListener('click', function() { track.scrollTo({ left: track.clientWidth * parseInt(d.dataset.idx), behavior: 'smooth' }); });
    });
    var ap = track.getAttribute('data-ap');
    if (ap) {
      var interval = parseInt(ap) || 3000;
      var timer;
      function go() {
        timer = setInterval(function() {
          var cur = Math.round(track.scrollLeft / track.clientWidth);
          track.scrollTo({ left: cur >= n - 1 ? 0 : (cur + 1) * track.clientWidth, behavior: 'smooth' });
        }, interval);
      }
      go();
      wrap.addEventListener('mouseenter', function() { clearInterval(timer); });
      wrap.addEventListener('mouseleave', go);
    }
  });
  document.querySelectorAll('[data-ap]').forEach(function(track) {
    if (track.closest('.gs-wrap')) return;
    var interval = parseInt(track.getAttribute('data-ap')) || 3000;
    var timer;
    function go() {
      timer = setInterval(function() {
        var max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft <= 1) { track.scrollTo({ left: max, behavior: 'smooth' }); }
        else { track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }); }
      }, interval);
    }
    go();
    track.addEventListener('mouseenter', function() { clearInterval(timer); });
    track.addEventListener('mouseleave', go);
  });
}

function openLightbox(src) {
  var existing = document.getElementById('pbLightbox');
  if (existing) existing.remove();
  var lb = document.createElement('div');
  lb.id = 'pbLightbox';
  lb.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  lb.innerHTML = '<img src="' + src + '" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain">' +
    '<button onclick="document.getElementById(\'pbLightbox\').remove()" style="position:absolute;top:20px;left:20px;background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center">&times;</button>';
  lb.addEventListener('click', function(e) { if (e.target === lb) lb.remove(); });
  document.addEventListener('keydown', function pbKey(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', pbKey); } });
  document.body.appendChild(lb);
}

function reorderHomeSections() {
  const homePage = document.getElementById('homePage');
  if (!homePage) return;
  const order = loadSectionOrder();
  const sectionMap = {
    banner: 'bannerSlider',
    offers: 'offersSection',
    flashSale: 'flashSaleSection',
    featured: 'featuredSection',
    newArrival: 'newArrivalSection',
    halfPrice: 'halfPriceSection',
    mostSold: 'mostSoldSection',
    couponDetector: 'couponDetectorWidget'
  };
  // Find anchor: insert reorderable sections just before the filter toolbar
  const anchor = document.getElementById('filterToolbar') || document.getElementById('productsGrid');
  if (!anchor) return;
  
  // Render custom sections only if they haven't been built yet (avoid spinner loop)
  var existingCustom = document.querySelectorAll('.pb-custom-section');
  if (existingCustom.length === 0) {
    renderCustomSections();
  }
  
  // Collect reorderable elements in the specified order
  const mktData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const custSecs = mktData.customSections || [];
  const elements = [];
  order.forEach(key => {
    if (key.startsWith('_custom_')) {
      var ci = custSecs.findIndex(function(s) { return s._id === key; });
      var cel = ci >= 0 ? document.getElementById('pbCustom_' + ci) : null;
      if (cel && cel.parentNode === homePage) elements.push(cel);
      return;
    }
    const id = sectionMap[key];
    if (!id) return;
    const secEl = document.getElementById(id);
    if (secEl && secEl.parentNode === homePage) elements.push(secEl);
  });
  // Insert them before the anchor (products grid / filter toolbar)
  elements.forEach(el => {
    if (el.nextElementSibling !== anchor) {
      homePage.insertBefore(el, anchor);
    }
  });
  // Safeguard: Hide homepage sections if a category or brand filter is active
  if (currentCat !== 'الكل' || currentBrand) {
    const hideSectionsIds = ['bannerSlider', 'featuredSection', 'newArrivalSection', 'halfPriceSection', 'mostSoldSection', 'offersSection', 'flashSaleSection'];
    hideSectionsIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.pb-custom-section').forEach(function(el) {
      el.style.display = 'none';
    });
  }
}

function applyMarketing() {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  
  // Announcement Bar
  const announce = data.announce || { show: true, text: '✨ أهلاً بكم في متجرنا! تسوق الآن واستمتع بأفضل العروض ✨' };
  const annBar = document.getElementById('announcementBar');
  if (annBar) {
    const showAnnounce = announce.show !== false;
    const announceText = announce.text || '✨ أهلاً بكم في متجرنا! تسوق الآن واستمتع بأفضل العروض ✨';
    if (showAnnounce && announceText) {
      const texts = announceText.split('\n').map(t=>t.trim()).filter(t=>t);
                              let aType = 'marquee', aDir = 'rtl', aSpeed = 'medium';
      if (announce.animation) {
        if (typeof announce.animation === 'string') {
          aType = announce.animation;
        } else {
          aType = announce.animation.type || 'marquee';
          aDir = announce.animation.direction || 'rtl';
          aSpeed = announce.animation.speed || 'medium';
        }
      }

      const spdMap = {
        slow: 90,
        medium: 65,
        fast: 45
      };

      const isStatic = aType === 'static';
      const isPulse  = aType === 'pulse';
      const isRotate = aType === 'rotate';

      if (window._announceInterval) {
        clearInterval(window._announceInterval);
        window._announceInterval = null;
      }

      if (isRotate && texts.length > 1) {
        const riMap = { slow: 5, medium: 3.5, fast: 2 };
        const fadeAnim = aDir === 'down' ? 'annFadeUp' : 'annFadeDown';
        const fadeY    = aDir === 'down' ? '10px' : '-10px';
        let idx = 0;
        annBar.innerHTML = `<div class="announcement-ticker" style="animation:${fadeAnim} .4s ease">${texts[0]}</div>`;
        window._announceInterval = setInterval(() => {
          idx = (idx + 1) % texts.length;
          const el = annBar.querySelector('.announcement-ticker');
          if (el) {
            el.style.opacity = '0';
            el.style.transform = `translateY(${fadeY})`;
            setTimeout(() => {
              el.textContent = texts[idx];
              el.style.opacity = '';
              el.style.transform = '';
              el.style.animation = 'none';
              void el.offsetHeight;
              el.style.animation = `${fadeAnim} .4s ease`;
            }, 300);
          }
        }, riMap[aSpeed] * 1000);
      } else if (isStatic || isPulse) {
        const sep = '  ◇  ';
        const displayText = texts.join(sep);
        const pulseStyle = isPulse ? 'animation:annPulse 2s ease-in-out infinite' : '';
        annBar.innerHTML = `<div class="announcement-ticker ${isPulse ? 'pulse' : 'static'}" style="text-align:center;width:100%;${pulseStyle}">${displayText}</div>`;
      } else if (aType === 'slide') {
        const sep = '  ◇  ';
        const slideDur = { slow: 10, medium: 7, fast: 4 }[aSpeed] || 7;
        const animName = aDir === 'ltr' ? 'slide-ltr' : 'slide-rtl';
        annBar.innerHTML = `<div class="announcement-ticker" style="--anim:${animName};--dur:${slideDur}s">${texts.join(sep)}</div>`;
      } else if (isRotate) {
        const sep = '  ◇  ';
        const displayText = texts.join(sep);
        annBar.innerHTML = `<div class="announcement-ticker static" style="text-align:center;width:100%">${displayText}</div>`;
      } else {
        /* ── seamless marquee ── */
        const dur   = spdMap[aSpeed];
        const items = texts.map(t => `<span>${t}</span><i>◆</i>`).join('');
        const reps  = texts.length === 1 ? 30 : 20;
        const track = items.repeat(reps);
        annBar.innerHTML = `
          <div class="announcement-wrapper" style="animation:moveTextSeamless ${dur}s linear infinite;">
            <div class="announcement-content">${track}</div>
            <div class="announcement-content">${track}</div>
          </div>`;
      }

      annBar.style.setProperty('--ann-bg', announce.bg || '#ef4444');
      annBar.style.backgroundColor = announce.bg || '#ef4444';
      annBar.style.color = announce.color || '#ffffff';
      annBar.style.display = 'flex';
      if (isStatic || isRotate) annBar.style.justifyContent = 'center'; else if (aType === 'marquee') annBar.style.justifyContent = 'flex-end'; else annBar.style.justifyContent = '';
    } else {
      annBar.style.display = 'none';
    }
  }

  // Seasonal Effects
  const se = data.seasonalEffect || {};
  const existingOverlay = document.getElementById('seasonalOverlay');
  if (existingOverlay) existingOverlay.remove();
  document.querySelectorAll('.ramadan-deco').forEach(el => el.remove());
  if (se.enabled && se.type) {
    const overlay = document.createElement('div');
    overlay.id = 'seasonalOverlay';
    const count = se.type === 'ramadan' ? 0 : 35;
    if (se.type === 'ramadan') {
      const d1 = document.createElement('div'); d1.className = 'ramadan-deco'; d1.textContent = '🏮'; document.body.appendChild(d1);
      const d2 = document.createElement('div'); d2.className = 'ramadan-deco'; d2.textContent = '⭐'; document.body.appendChild(d2);
    }
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      const clsMap = { snow: 'fall-snow', confetti: 'fall-confetti', hearts: 'float-heart', leaves: 'fall-leaf', ramadan: 'fall-star', chillat: 'fall-chillat', valentine: 'fall-valentine', graduation: 'rise-graduation', eid: 'fall-eid', christmas: 'fall-christmas', newyear: 'fall-newyear', halloween: 'float-halloween' };
      p.className = clsMap[se.type] || 'fall-snow';
      const emojis = { confetti: ['🎉','🎊','✨','🌟','🎀'], hearts: ['❤️','💕','💗','💖','💜'], leaves: ['🍂','🍁','🌿','🍃'], ramadan: ['✨','🌟','⭐'], chillat: ['🎵','🎶','💃','🎤','🥳'], valentine: ['💖','💗','🌹','💘','💕'], graduation: ['🎓','📜','🎉','⭐','📚'], eid: ['🐏','🌙','✨','🕌','🐑'], christmas: ['🎄','⛄','🎅','🦌','🎁'], newyear: ['🎆','🎇','🥂','✨','🎉'], halloween: ['🎃','👻','🕸️','🦇','💀'] };
      p.textContent = se.type === 'snow' ? '' : (emojis[se.type] ? emojis[se.type][i % emojis[se.type].length] : '•');
      const size = se.type === 'snow' ? 3 + Math.random() * 5 : 8 + Math.random() * 14;
      const left = Math.random() * 100;
      const delay = Math.random() * (se.type === 'hearts' ? 8 : 12);
      const dur = se.type === 'hearts' ? 3 + Math.random() * 4 : 4 + Math.random() * 8;
      p.style.cssText = `left:${left}%;font-size:${size}px;animation-delay:${delay}s;animation-duration:${dur}s;${se.type==='snow'?`width:${size}px;height:${size}px;background:rgba(255,255,255,.8);border-radius:50%;box-shadow:0 0 ${size}px rgba(255,255,255,.4)`:'color:rgba(255,255,255,.8)'}`;
      overlay.appendChild(p);
    }
    document.body.appendChild(overlay);
  }

  // Banners
  const slider = document.getElementById('bannerSlider');
  if (slider) {
    const banners = (data.banners || []).filter(b => b.active !== false);
    if (banners.length) {
      const settings = loadBannerSettings();
      const styleType = settings.sliderStyle || 'default';
      slider.innerHTML = banners.map(b => {
        let captionHtml = '';
        if (b.title || b.btnText) {
          if (styleType === 'glass') {
            captionHtml = `
              <div class="banner-caption-glass" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:16px 24px;background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.25);border-radius:16px;color:#fff;text-align:center;max-width:85%;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:2">
                ${b.title ? `<span class="banner-caption-text" style="font-size:1.15rem;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,0.6);line-height:1.3">${b.title}</span>` : ''}
                ${b.btnText ? `<span class="banner-btn-caption" style="padding:6px 20px;background:#fff;color:#000;border-radius:30px;font-size:.78rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.15)">${b.btnText}</span>` : ''}
              </div>`;
          } else if (styleType === 'split') {
            captionHtml = `
              <div class="banner-caption-split" style="position:absolute;bottom:16px;right:16px;max-width:300px;padding:14px;background:rgba(0,0,0,0.75);border-radius:12px;color:#fff;display:flex;flex-direction:column;gap:8px;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,0.3)">
                ${b.title ? `<span class="banner-caption-text" style="font-size:0.85rem;font-weight:700;line-height:1.4">${b.title}</span>` : ''}
                ${b.btnText ? `<span class="banner-btn-caption" style="align-self:flex-start;padding:5px 15px;background:var(--accent);color:#fff;border-radius:6px;font-size:.75rem;font-weight:700;white-space:nowrap">${b.btnText}</span>` : ''}
              </div>`;
          } else if (styleType === 'hero') {
            captionHtml = `
              <div class="banner-caption-hero" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${b.overlay !== false ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)' : 'transparent'};padding:20px;gap:14px;z-index:2">
                ${b.title ? `<span class="banner-caption-text" style="font-size:clamp(1.1rem,3vw,1.9rem);font-weight:900;color:#fff;text-shadow:0 3px 12px rgba(0,0,0,0.6);line-height:1.3">${b.title}</span>` : ''}
                ${b.btnText ? `<span class="banner-btn-caption" style="padding:9px 28px;background:#fff;color:#0f172a;border-radius:30px;font-size:.85rem;font-weight:900;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,0.35)">${b.btnText}</span>` : ''}
              </div>`;
          } else if (styleType === 'minimal') {
            captionHtml = `
              ${b.title ? `<div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.6);color:#fff;padding:6px 14px;border-radius:30px;font-size:0.75rem;font-weight:700;z-index:2">${b.title}</div>` : ''}
              ${b.btnText ? `<div style="position:absolute;bottom:16px;left:16px;z-index:2"><span class="banner-btn-caption" style="padding:7px 22px;background:var(--accent);color:#fff;border-radius:30px;font-size:.8rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.25)">${b.btnText}</span></div>` : ''}`;
          } else {
            captionHtml = `
              <div class="banner-caption">
                ${b.title ? `<span class="banner-caption-text">${b.title}</span>` : ''}
                ${b.btnText ? `<span class="banner-btn-caption">${b.btnText}</span>` : ''}
              </div>`;
          }
        }
                let bannerClick = '';
        if (b.link) {
          if (b.link.startsWith('javascript:')) {
            bannerClick = `onclick="event.stopPropagation(); ${b.link.replace('javascript:', '')}"`;
          } else {
            bannerClick = `onclick="window.open('${b.link.replace(/'/g,"\\'")}', '_blank')"`;
          }
        }
        
        let miniCardHtml = '';
        if (b.showMiniCard && b.link && b.link.includes('openDetail(')) {
          const prodIdMatch = b.link.match(/openDetail\((\d+)\)/);
          if (prodIdMatch) {
            const prodId = parseInt(prodIdMatch[1]);
            const prod = (typeof products !== 'undefined' ? products : []).find(p => p.id === prodId);
            if (prod) {
              const finalPrice = wPrice(prod);
              const discount = getProductDiscount(prod);
              miniCardHtml = `
                <div class="banner-mini-product-card" onclick="event.stopPropagation(); openDetail(${prod.id})" style="position:absolute;bottom:16px;left:16px;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.3);z-index:3;transition:all 0.2s;max-width:210px;cursor:pointer">
                  <img src="${getProductImages(prod)[0]}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0">
                  <div style="display:flex;flex-direction:column;min-width:0;text-align:right">
                    <span style="font-size:0.75rem;font-weight:800;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${prod.name}</span>
                    <div style="display:flex;align-items:center;gap:4px">
                      <span style="font-size:0.75rem;font-weight:900;color:var(--accent)">${CURRENCY}${finalPrice}</span>
                      ${discount ? `<span style="font-size:0.6rem;color:#64748b;text-decoration:line-through">${CURRENCY}${prod.oldPrice}</span>` : ''}
                    </div>
                  </div>
                  <div onclick="event.stopPropagation(); quickAdd(${prod.id}, this)" style="background:var(--accent);color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.1);margin-right:auto"><i class="fa-solid fa-plus"></i></div>
                </div>`;
            }
          }
        }
        
        let badgeHtml = '';
        if (b.badgeText) {
          if (!document.getElementById('banner-badge-styles')) {
            const style = document.createElement('style');
            style.id = 'banner-badge-styles';
            style.innerHTML = `
              @keyframes badgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
              @keyframes badgeGlow { 0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.15); } 50% { box-shadow: 0 0 15px var(--accent, #ef4444), 0 4px 15px rgba(0,0,0,0.25); } }
              @keyframes badgeFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
              .banner-badge-pulse { animation: badgePulse 2s infinite ease-in-out; }
              .banner-badge-glow { animation: badgeGlow 1.5s infinite ease-in-out; }
              .banner-badge-float { animation: badgeFloat 2.5s infinite ease-in-out; }
            `;
            document.head.appendChild(style);
          }
          const animClass = b.badgeAnim && b.badgeAnim !== 'none' ? `banner-badge-${b.badgeAnim}` : '';
          badgeHtml = `<span class="banner-badge ${animClass}" style="position:absolute;top:0;right:20px;background:${b.badgeColor || 'var(--accent)'};color:#fff;font-size:0.65rem;font-weight:800;padding:8px 8px 14px 8px;z-index:2;box-shadow:0 4px 10px rgba(0,0,0,0.15);clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);text-align:center;min-width:36px;display:inline-block;direction:rtl">${b.badgeText}</span>`;
        }
        
        const objFit = settings.objectFit || 'cover';
        return `
          <div class="banner-slide" style="position:relative;cursor:${b.link?'pointer':'default'}" ${bannerClick}>
            <img src="${b.image}" alt="${b.title||''}" loading="lazy" style="object-fit:${objFit}">
            ${badgeHtml}
            ${captionHtml}
            ${miniCardHtml}
          </div>`;
      }).join('');
      slider.style.display = '';
      ensureBannerCounter();
      setTimeout(startBannerAutoScroll, 200);
    } else {
      slider.innerHTML = '';
      slider.style.display = 'none';
      stopBannerAutoScroll();
    }
  }
  // Social links
  const soc = data.social || {};
  const fbBtn = document.getElementById('fbBtn');
  if (fbBtn) {
    if (soc.facebook) { fbBtn.href = soc.facebook; fbBtn.style.display = ''; }
    else { fbBtn.style.display = 'none'; }
  }
  const waBtn = document.getElementById('waBtn');
  if (waBtn) {
    if (soc.whatsapp) { waBtn.href = soc.whatsapp; waBtn.style.display = ''; }
    else { waBtn.style.display = 'none'; }
  }
  const igBtn = document.getElementById('igBtn');
  if (igBtn) {
    if (soc.instagram) { igBtn.href = soc.instagram; igBtn.style.display = ''; }
    else { igBtn.style.display = 'none'; }
  }
  const ttBtn = document.getElementById('ttBtn');
  if (ttBtn) {
    if (soc.tiktok) { ttBtn.href = soc.tiktok; ttBtn.style.display = ''; }
    else { ttBtn.style.display = 'none'; }
  }
  const xBtn = document.getElementById('xBtn');
  if (xBtn) {
    if (soc.twitter) { xBtn.href = soc.twitter; xBtn.style.display = ''; }
    else { xBtn.style.display = 'none'; }
  }
  // SEO
  const seo = data.seo || {};
  if (seo.title) document.title = seo.title;
  if (seo.description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = seo.description;
  }
  if (seo.keywords) {
    let meta = document.querySelector('meta[name="keywords"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'keywords'; document.head.appendChild(meta); }
    meta.content = seo.keywords;
  }
  // Tracking codes
  const tr = data.tracking || {};
  if (tr.gaId) {
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${tr.gaId}`;
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', tr.gaId);
  }
  if (tr.fbPixel) {
    const s = document.createElement('script');
    s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${tr.fbPixel}');fbq('track','PageView');`;
    document.head.appendChild(s);
  }
  if (tr.ttPixel) {
    const s = document.createElement('script');
    s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{},ttq._partner=ttq._partner||"UAPJS";var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a)};ttq.load('${tr.ttPixel}');ttq.page();}(window,document,'ttq');`;
    document.head.appendChild(s);
  }
  if (tr.snapPixel) {
    const s = document.createElement('script');
    s.innerHTML = `!function(e,t,n){e.snaptr=n||[],n.load=function(){n.push("load")},n.page=function(){n.push("page")},n.track=function(t,i){n.push("track",t,i)},n.identify=function(i){n.push("identify",i)},n.pixelId=e;var a=document.createElement("script");a.async=!0,a.src="https://sc-static.net/scevent.min.js";var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)}('${tr.snapPixel}',window,document,window.snaptr||[]);snaptr('init','${tr.snapPixel}');snaptr('track','PAGE_VIEW');`;
    document.head.appendChild(s);
  }
  if (tr.twPixel) {
    const s = document.createElement('script');
    s.innerHTML = `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('init','${tr.twPixel}');twq('track','PageView');`;
    document.head.appendChild(s);
  }
  if (tr.pintPixel) {
    const s = document.createElement('script');
    s.innerHTML = `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${tr.pintPixel}');pintrk('page');`;
    document.head.appendChild(s);
  }
  if (tr.headerScript) {
    const s = document.createElement('script');
    s.innerHTML = tr.headerScript;
    document.head.appendChild(s);
  }
  if (tr.footerScript) {
    const s = document.createElement('script');
    s.innerHTML = tr.footerScript;
    document.body.appendChild(s);
  }

  // Live Viewers Counter
  const liveV = data.liveViewers || {};
  initLiveViewers(liveV.show || false);

  // WhatsApp Floating Chat Widget
  const waChat = data.waChat || {};
  initWaChatWidget(waChat.show || false, waChat.greeting || '', data.social?.whatsapp || '');
}

function getProductCats(p) {
  if (p.categories && Array.isArray(p.categories) && p.categories.length) return p.categories;
  if (p.category) return [p.category];
  return ['أخرى'];
}

function renderCategories() {
  const stored = localStorage.getItem('mycart_categories');
  let catMap = {}, brandCats = [], customCatNames = [];
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      parsed.forEach(c => {
        if (c.isBrand) {
          brandCats.push(c.name);
        } else {
          catMap[c.name] = c.image;
          customCatNames.push(c.name);
        }
      });
    } catch(e) {}
  }
  const allProductCats = products.flatMap(p => getProductCats(p));
  const combinedCats = [...new Set([...customCatNames, ...allProductCats])].filter(c => c && !brandCats.includes(c));
  const cats = ['الكل', ...combinedCats];

  document.getElementById('catFilters').innerHTML = cats.map(c =>
    `<button class="${c === currentCat ? 'active' : ''}" onclick="filterCategory('${c}')">${c === 'الكل' ? '' : catMap[c] ? `<img src="${catMap[c]}" onerror="this.remove()">` : ''}${c === 'الكل' ? __('all') : c}</button>`
  ).join('');
  renderBrands(brandCats);
}

let currentBrand = '';

function renderBrands(brandCats) {
  const brands = [...new Set([...brandCats, ...products.filter(p => p.brand).map(p => p.brand)])];
  const el = document.getElementById('brandFilters');
  if (!el) return;
  if (!brands.length) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = `<button class="${!currentBrand ? 'active' : ''}" onclick="filterBrand('')"><i class="fa-solid fa-layer-group"></i> ${__('allBrands')}</button>` +
    brands.map(b => `<button class="${currentBrand === b ? 'active' : ''}" onclick="filterBrand('${b}')"><i class="fa-solid fa-award"></i> ${b}</button>`).join('');
}

function cleanHomeHash() {
  if (window.location.hash || location.search) {
    try {
      history.replaceState(null, document.title, window.location.pathname);
    } catch(e) {
      location.hash = '';
    }
  }
}

function filterCategory(cat, updateHash = true) {
  currentCat = cat;
  if (cat === 'الكل') { currentBrand = ''; renderBrands([]); }
  if (updateHash) {
    if (cat !== 'الكل') location.hash = '#category/' + encodeURIComponent(cat);
    else cleanHomeHash();
  }
  document.querySelectorAll('.cat-filters button').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().includes(cat) || (cat === 'الكل' && b.textContent.trim().includes(__('all'))));
  });
  
  const filterBar = document.getElementById('advFilterBar');
  if (filterBar) {
    if (cat !== 'الكل') {
      filterBar.style.display = 'block';
      initFilterRange();
    } else {
      filterBar.style.display = 'none';
      resetAdvFilter();
    }
  }

  // Hide sections when filtering specific category or brand
  const hideSectionsIds = ['bannerSlider', 'featuredSection', 'newArrivalSection', 'halfPriceSection', 'mostSoldSection', 'offersSection', 'flashSaleSection'];
  const show = cat === 'الكل' && !currentBrand;
  hideSectionsIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  });
  // Hide custom sections
  document.querySelectorAll('.pb-custom-section').forEach(function(el) {
    el.style.display = show ? '' : 'none';
  });

  renderProducts(getFilteredProducts());

  // Reinitialize flash sales and custom sections when showing all
  if (cat === 'الكل' && !currentBrand) {
    initFlashSales();
    reorderHomeSections();
  }

  // Smooth scroll to products section
  const gridEl = document.getElementById('productsSection') || document.getElementById('productsGrid');
  if (gridEl && cat !== 'الكل' && updateHash) {
    gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function filterBrand(brand, updateHash = true) {
  currentBrand = brand;
  if (!brand) { currentCat = 'الكل'; renderCategories(); }
  if (updateHash) {
    if (brand) location.hash = '#brand/' + encodeURIComponent(brand);
    else cleanHomeHash();
  }
  document.querySelectorAll('#brandFilters button').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === brand || (!brand && b.textContent.trim() === __('allBrands')));
  });

  const show = !brand && currentCat === 'الكل';
  const hideSectionsIds = ['bannerSlider', 'featuredSection', 'newArrivalSection', 'halfPriceSection', 'mostSoldSection', 'offersSection', 'flashSaleSection'];
  hideSectionsIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  });
  document.querySelectorAll('.pb-custom-section').forEach(function(el) {
    el.style.display = show ? '' : 'none';
  });

  renderProducts(getFilteredProducts());

  // Reinitialize flash sales and custom sections when showing all
  if (!brand && currentCat === 'الكل') {
    initFlashSales();
    reorderHomeSections();
  }

  const gridEl = document.getElementById('productsSection') || document.getElementById('productsGrid');
  if (gridEl && brand && updateHash) {
    gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleAdvFilter() {
  const bar = document.getElementById('advFilterBar');
  if (!bar) return;
  if (bar.style.display === 'none' || !bar.style.display) {
    bar.style.display = 'block';
    initFilterRange();
  } else {
    bar.style.display = 'none';
  }
}

function resetAllFilters() {
  currentCat = 'الكل';
  currentBrand = '';
  const filterBar = document.getElementById('advFilterBar');
  if (filterBar) filterBar.style.display = 'none';
  resetAdvFilter();
  renderCategories();
  renderProducts(getFilteredProducts());
  initFlashSales();
  reorderHomeSections();
}

let _sectionFilter = null;
const _sectionFilterLabels = { newArrival: '🔖 وصل حديثاً', halfPrice: '💰 نصف السعر', featured: '💎 منتجات مميزة', flashSale: '⚡ تخفيضات سريعة', mostSold: '🔥 الأكثر مبيعاً' };

function getFilteredProducts() {
  let list = products;
  if (currentCat !== 'الكل') list = list.filter(p => getProductCats(p).includes(currentCat));
  if (currentBrand) list = list.filter(p => p.brand === currentBrand || getProductCats(p).includes(currentBrand));
  if (_sectionFilter === 'newArrival') list = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
  else if (_sectionFilter === 'halfPrice') list = list.filter(p => p.oldPrice && p.price <= p.oldPrice * 0.5);
  else if (_sectionFilter === 'flashSale') list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
  else if (_sectionFilter === 'featured') list = list.filter(p => p.featured);
  else if (_sectionFilter === 'mostSold') list = [...list].sort((a,b) => (b.soldCount||0) - (a.soldCount||0));
  else if (_sectionFilter === 'offers') {
    const allOffers = loadOffers();
    const now = new Date();
    const activeOffers = allOffers.filter(function(o) {
      if (!o.active) return false;
      if (o.endDate) { var end = new Date(o.endDate); end.setHours(23,59,59,999); if (now > end) return false; }
      return true;
    });
    var offerProductIds = new Set();
    activeOffers.forEach(function(o) {
      if (o.applyTo === 'all') { products.forEach(function(p) { offerProductIds.add(p.id); }); }
      else if (o.applyTo === 'specific' && o.productIds) { o.productIds.forEach(function(id) { offerProductIds.add(id); }); }
    });
    list = list.filter(function(p) { return offerProductIds.has(p.id); });
  }
  return list;
}

let _allFilteredProducts = [];
let _productPage = 0;
const _productPageSize = 20;
let _loadingMore = false;
function _cardImgNav() {
  if (window.__appearanceData && typeof window.__appearanceData.cardImgNav !== 'undefined') return window.__appearanceData.cardImgNav;
  try {
    const d = JSON.parse(localStorage.getItem('mycart_appearance'));
    if (d && typeof d.cardImgNav !== 'undefined') return d.cardImgNav;
  } catch(e) {}
  return 'dots';
}

function _productCardHtml(p) {
  const _isOut = p.stock === 0;
  const _imgs = getProductImages(p);
  const _hasOpts = (p.options && p.options.length) || (p.variants && p.variants.length);
  let _navHtml = '';
  if (_hasOpts) {
    _navHtml = _cardOptsHtml(p);
  } else {
    const _nav = _imgs.length > 1 ? _cardImgNav() : 'none';
    if (_nav === 'dots') {
      _navHtml = '<div class="product-card-dots" onclick="event.stopPropagation()">' + _imgs.map(function(_i, i) { return '<button class="product-card-dot' + (i === 0 ? ' active' : '') + '" onclick="cardSetImg(' + p.id + ',' + i + ',this)"></button>'; }).join('') + '</div>';
    } else if (_nav === 'thumbs') {
      _navHtml = '<div class="product-card-thumbs" onclick="event.stopPropagation()">' + _imgs.map(function(_i, i) { return '<button class="product-card-thumb' + (i === 0 ? ' active' : '') + '" onclick="cardSetImg(' + p.id + ',' + i + ',this)"><img src="' + _i + '" alt=""></button>'; }).join('') + '</div>';
    }
  }
  return `<div class="product-card${_isOut ? ' out-of-stock' : ''}" data-id="${p.id}" onclick="openDetail(${p.id})">
      ${p.badge ? `<span class="product-badge-tag">${p.badge}</span>` : ''}
      ${getProductDiscount(p) ? `<span class="discount-badge">-${getProductDiscount(p)}%</span>` : ''}
      ${(()=>{const o=getProductOffer(p);return o?`<span style="position:absolute;top:68px;right:8px;z-index:3;background:#f59e0b;color:#fff;font-size:.6rem;font-weight:800;padding:2px 7px;border-radius:4px;white-space:nowrap">${o.badge||o.name}</span>`:''})()}
      <div class="product-card-img-wrap" data-swipe="${p.id}">
        <img src="${_imgs[0]}" alt="${p.name}" loading="lazy" data-card-img="${p.id}">
        ${_isOut ? '<div class="out-of-stock-overlay"><span>نفذ<br><small>انتهت الكمية</small></span></div>' : ''}
      </div>
      ${_navHtml}
      <button class="wishlist-btn ${wishlist.includes(p.id) ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation();toggleWishlist(${p.id})"><i class="fa-solid fa-heart"></i></button>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="price">${(()=>{const _op=calcOfferPrice(p);if(_op!==null)return `${CURRENCY}${_op} <span class="old-price">${CURRENCY}${wPrice(p)}</span>`;const _bp=wPrice(p);return `${CURRENCY}${_bp}${p.oldPrice?` <span class="old-price">${CURRENCY}${p.oldPrice}</span>`:''}`;})()}${wBadge()}</div>
        ${p.brand ? `<div class="product-brand"><i class="fa-solid fa-award"></i> ${p.brand}</div>` : ''}
      </div>
      <div class="quick-add" onclick="event.stopPropagation();${_isOut ? '' : 'quickAdd(' + p.id + ',this)'}" style="${_isOut ? 'opacity:.3;pointer-events:none' : ''}"><i class="fa-solid ${((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-shopping'}"></i></div>
    </div>`;
}
function _cardImagesFor(id) {
  const p = products.find(x => x.id === id);
  return p ? getProductImages(p) : [];
}
function _cardOptsHtml(p) {
  if (p.options && p.options.length) {
    const imgOpts = p.options.filter(function(opt) { return opt.type === 'image'; });
    if (!imgOpts.length) return '';
    return imgOpts.map(function(opt) {
      const vals = opt.values.map(function(v, vi) {
        const out = v && v.stock === 0;
        const act = !out && v === opt.values[0] ? ' active' : '';
        const click = out ? '' : 'onclick="cardSelectOption(' + p.id + ',this)"';
        const oo = out ? ' disabled' : '';
        if (opt.type === 'image' && v.extra) return '<button class="product-card-thumb' + act + oo + '" data-opt="' + opt.name + '" data-val="' + v.value + '" ' + click + ' title="' + v.value + (out ? ' - نفذ' : '') + '"><img src="' + v.extra + '" alt="' + v.value + '">' + (out ? '<span class="pco-out">نفذ</span>' : '') + '</button>';
        return '<button class="product-card-chip' + act + oo + '" data-opt="' + opt.name + '" data-val="' + v.value + '" ' + click + '>' + v.value + (out ? ' <span class="cchip-out">نفذ</span>' : '') + '</button>';
      }).join('');
      return '<div class="product-card-opts">' + (imgOpts.length > 1 ? '<span class="product-card-opt-label">' + opt.name + '</span>' : '') + '<div class="product-card-thumbs" onclick="event.stopPropagation()">' + vals + '</div></div>';
    }).join('');
  }
  if (p.variants && p.variants.length) {
    const withImg = p.variants.filter(function(v) { return (v.attrs || []).some(function(a) { return a.t === 'image' && a.i; }); });
    if (!withImg.length) return '';
    return '<div class="product-card-thumbs" onclick="event.stopPropagation()">' + withImg.map(function(v, i) {
      const imgA = (v.attrs || []).find(function(a) { return a.t === 'image' && a.i; });
      const label = (v.attrs || []).map(function(a) { return a.v; }).filter(Boolean).join(' - ') || ('خيار ' + (i + 1));
      const out = v && v.stock === 0;
      const act = !out && i === 0 ? ' active' : '';
      const click = out ? '' : 'onclick="cardSelectVariant(' + p.id + ',' + i + ',this)"';
      const oo = out ? ' disabled' : '';
      return '<button class="product-card-thumb' + act + oo + '" data-idx="' + i + '" ' + click + ' title="' + label + (out ? ' - نفذ' : '') + '"><img src="' + imgA.i + '" alt="' + label + '">' + (out ? '<span class="cpo-out">نفذ</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  return '';
}
function _cardMiniNavHtml(p) {
  var _imgs = getProductImages(p);
  var _hasOpts = (p.options && p.options.length) || (p.variants && p.variants.length);
  if (_hasOpts) return _cardOptsHtml(p);
  if (_imgs.length < 2) return '';
  var _nav = _cardImgNav();
  if (_nav === 'none') return '';
  if (_nav === 'thumbs') return '<div class="product-card-thumbs" onclick="event.stopPropagation()">' + _imgs.map(function(_i, i) { return '<button class="product-card-thumb' + (i === 0 ? ' active' : '') + '" onclick="cardSetImg(' + p.id + ',' + i + ',this)"><img src="' + _i + '" alt=""></button>'; }).join('') + '</div>';
  return '<div class="product-card-dots" onclick="event.stopPropagation()">' + _imgs.map(function(_i, i) { return '<button class="product-card-dot' + (i === 0 ? ' active' : '') + '" onclick="cardSetImg(' + p.id + ',' + i + ',this)"></button>'; }).join('') + '</div>';
}
function cardSelectOption(id, btn) {
  const card = btn.closest('.product-card, .mini-card, .flash-card');
  const p = products.find(x => x.id === id);
  if (!card || !p) return;
  window._selOptions = window._selOptions || {};
  window._selOptions[btn.dataset.opt] = btn.dataset.val;
  card.querySelectorAll('[data-opt="' + btn.dataset.opt + '"]').forEach(function(b) { b.classList.toggle('active', b === btn); });
  const opt = p.options.find(o => o.name === btn.dataset.opt);
  const v = opt && opt.values.find(x => x.value === btn.dataset.val);
  const img = card.querySelector('.product-card-img-wrap img, .feat-img img, .flash-card-img img, img');
  if (img && v && v.extra && (opt.type === 'image' || opt.type === 'color')) { img.style.opacity = '0'; img.src = v.extra; setTimeout(function(){ img.style.opacity = '1'; }, 60); }
}
function cardSelectVariant(id, idx, btn) {
  const card = btn.closest('.product-card, .mini-card, .flash-card');
  const p = products.find(x => x.id === id);
  if (!card || !p) return;
  card.querySelectorAll('.product-card-thumbs button').forEach(function(b) { b.classList.toggle('active', b === btn); });
  const v = p.variants[idx];
  const img = card.querySelector('.product-card-img-wrap img, .feat-img img, .flash-card-img img, img');
  if (img && v && v.images && v.images[0]) { img.style.opacity = '0'; img.src = v.images[0]; setTimeout(function(){ img.style.opacity = '1'; }, 60); }
}
function cardSetImg(id, idx, btn) {
  const card = btn ? btn.closest('.product-card, .mini-card, .flash-card') : document.querySelector('.product-card[data-id="' + id + '"], .mini-card[data-id="' + id + '"], .flash-card[data-id="' + id + '"]');
  if (!card) return;
  const imgs = _cardImagesFor(id);
  if (!imgs.length) return;
  idx = (idx + imgs.length) % imgs.length;
  const img = card.querySelector('.product-card-img-wrap img, .feat-img img, .flash-card-img img, img');
  if (img && imgs[idx]) { img.style.opacity = '0'; img.src = imgs[idx]; setTimeout(function(){ img.style.opacity = '1'; }, 60); card.dataset.cur = idx; }
  card.querySelectorAll('.product-card-dot').forEach(function(d, i) { d.classList.toggle('active', i === idx); });
}
function cardSwipeImg(id, dir, wrap) {
  const card = wrap ? wrap.closest('.product-card') : null;
  if (!card) return;
  if (!card.querySelector('.product-card-dots')) return;
  const imgs = _cardImagesFor(id);
  if (imgs.length < 2) return;
  const cur = parseInt(card.dataset.cur || '0', 10);
  const next = (cur + dir + imgs.length) % imgs.length;
  cardSetImg(id, next, card.querySelector('.product-card-dot'));
}
document.addEventListener('touchstart', function(e) {
  const w = e.target.closest('[data-swipe]');
  if (!w) return;
  const t = e.touches[0];
  w.__sx = t.clientX; w.__sy = t.clientY; w.__dx = 0; w.__dy = 0; w.__swiping = true;
  w.__strip = !!(e.target.closest('.product-card-thumbs'));
}, { passive: true });
document.addEventListener('touchmove', function(e) {
  const w = e.target.closest('[data-swipe]');
  if (!w || !w.__swiping || w.__strip) return;
  const t = e.touches[0];
  w.__dx = t.clientX - (w.__sx || 0);
  w.__dy = t.clientY - (w.__sy || 0);
  if (Math.abs(w.__dx) > Math.abs(w.__dy) && Math.abs(w.__dx) > 8) e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', function(e) {
  const w = e.target.closest('[data-swipe]');
  if (!w || !w.__swiping) return;
  w.__swiping = false;
  const dx = w.__dx || 0, dy = w.__dy || 0;
  if (!w.__strip && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    cardSwipeImg(parseInt(w.getAttribute('data-swipe'), 10), dx < 0 ? 1 : -1, w);
  }
  w.__dx = 0; w.__dy = 0; w.__strip = false;
}, { passive: true });
function _loadMoreProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (_loadingMore) return;
  _loadingMore = true;
  const start = _productPage * _productPageSize;
  const end = Math.min(start + _productPageSize, _allFilteredProducts.length);
  if (start >= _allFilteredProducts.length) { _loadingMore = false; _checkScrollLoad(); return; }
  let html = '';
  for (let i = start; i < end; i++) html += _productCardHtml(_allFilteredProducts[i]);
  grid.insertAdjacentHTML('beforeend', html);
  _productPage++;
  _loadingMore = false;
  _checkScrollLoad();
}
function _checkScrollLoad() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const loaded = grid.children.length;
  if (loaded >= _allFilteredProducts.length) return;
  const rect = grid.getBoundingClientRect();
  if (rect.bottom < window.innerHeight + 400) _loadMoreProducts();
}
window.addEventListener('scroll', function(){ _checkScrollLoad(); }, {passive:true});
window.addEventListener('resize', function(){ _checkScrollLoad(); }, {passive:true});

function renderProducts(list) {
  _allFilteredProducts = list;
  _productPage = 0;
  document.getElementById('productsGrid').innerHTML = '';
  const countEl = document.getElementById('filterCount');
  if (countEl) countEl.textContent = list.length;

  const badgesEl = document.getElementById('activeFilterBadges');
  if (badgesEl) {
    let badges = [];
    if (currentCat !== 'الكل') {
      badges.push(`<span class="active-badge" onclick="filterCategory('الكل')">${__('categories')}: ${currentCat} <i class="fa-solid fa-xmark"></i></span>`);
    }
    if (currentBrand) {
      badges.push(`<span class="active-badge" onclick="filterBrand('')">الماركة: ${currentBrand} <i class="fa-solid fa-xmark"></i></span>`);
    }
    if (badges.length) {
      badges.push(`<button class="clear-all-filters-btn" onclick="resetAllFilters()"><i class="fa-solid fa-rotate-left"></i> ${__('clearFilters')}</button>`);
      badgesEl.innerHTML = badges.join('');
      badgesEl.style.display = 'flex';
    } else {
      badgesEl.style.display = 'none';
    }
  }
  _loadMoreProducts();
  const showFeaturedSection = (currentCat === 'الكل' && !currentBrand);
  // Offers section — products with active offers
  const allOffers = loadOffers();
  const now = new Date();
  const activeOffers = allOffers.filter(o => {
    if (!o.active) return false;
    if (o.endDate) { const end = new Date(o.endDate); end.setHours(23,59,59,999); if (now > end) return false; }
    return true;
  });
  const offerProductIds = new Set();
  activeOffers.forEach(o => {
    if (o.applyTo === 'all') { products.forEach(p => offerProductIds.add(p.id)); }
    else if (o.applyTo === 'specific' && o.productIds) { o.productIds.forEach(id => offerProductIds.add(id)); }
  });
  const offerProducts = products.filter(p => offerProductIds.has(p.id));
  const offSection = document.getElementById('offersSection');
  const offScroll = document.getElementById('offersScroll');
  const offersMkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const offersEnabled = isSectionEnabled('offers');
  if (offerProducts.length && showFeaturedSection && offersEnabled) {
    if (offSection) offSection.style.display = 'block';
    if (offScroll) {
      offScroll.innerHTML = offerProducts.map(p => {
        const o = getProductOffer(p);
        return `<div class="mini-card" data-id="${p.id}" onclick="openDetail(${p.id})">
          <span class="offers-badge"><i class="fa-solid fa-gift"></i> ${o?o.badge||o.name:''}</span>
          <img src="${getProductImages(p)[0]}" alt="${p.name}" loading="lazy">
          ${_cardMiniNavHtml(p)}
          <div class="info"><h4>${p.name}</h4><div class="p">${(()=>{const _op=calcOfferPrice(p);if(_op!==null)return `${CURRENCY}${_op} <span style="text-decoration:line-through;opacity:.7;font-size:.7rem">${CURRENCY}${wPrice(p)}</span>`;const _bp=wPrice(p);return `${CURRENCY}${_bp}`;})()}${wBadge()}</div></div>
          <div class="feat-add" onclick="event.stopPropagation();quickAdd(${p.id}, this)"><i class="fa-solid ${((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-shopping'}"></i></div>
        </div>`;
      }).join('');
      addSectionArrows('offersScroll');
      startOffersAutoScroll();
    }
  } else {
    if (offSection) offSection.style.display = 'none';
    stopOffersAutoScroll();
  }

  // Featured section (only show when on 'الكل' category and no brand filter is active)
  const featured = products.filter(p => p.featured);
  const featSection = document.getElementById('featuredSection');
  const featScroll = document.getElementById('featuredScroll');

  if (featured.length && showFeaturedSection && isSectionEnabled('featured')) {
    if (featSection) featSection.style.display = 'block';
    if (featScroll) {
      featScroll.innerHTML = featured.map(p => {
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;
        const finalPrice = wPrice(p);
        const oldPriceHtml = hasDiscount ? '<span style="font-size:.72rem;text-decoration:line-through;color:var(--text-muted);opacity:.65">' + CURRENCY + (p.oldPrice || 0).toFixed(2) + '</span>' : '';
        return '<div class="mini-card" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
          '<span class="feat-badge"><i class="fa-solid fa-star"></i> مميز</span>' +
          '<div class="feat-img"><img src="' + getProductImages(p)[0] + '" alt="' + p.name + '" loading="lazy"></div>' +
          _cardMiniNavHtml(p) +
          '<div class="feat-body">' +
            '<h4>' + p.name + '</h4>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
              '<span class="feat-price">' + CURRENCY + finalPrice + '</span>' + wBadge() +
              oldPriceHtml +
            '</div>' +
            '<button class="feat-add" onclick="event.stopPropagation();quickAdd(' + p.id + ', this)"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-plus') + '"></i> ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd')) + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    addSectionArrows('featuredScroll');
    setTimeout(startFeatAutoScroll, 300);
  } else {
    if (featSection) featSection.style.display = 'none';
    stopFeatAutoScroll();
  }

  // New Arrival section
  const naMkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const naSection = document.getElementById('newArrivalSection');
  const naScroll = document.getElementById('newArrivalScroll');
  if (naSection && naScroll) {
    if (isSectionEnabled('newArrival') && showFeaturedSection) {
      const arrivals = [...(products || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 12);
      if (arrivals.length) {
        naSection.style.display = 'block';
        naScroll.innerHTML = arrivals.map(p => {
          const finalPrice = wPrice(p);
          const hasDiscount = p.oldPrice && p.oldPrice > p.price;
          const oldHtml = hasDiscount ? '<span style="font-size:.7rem;text-decoration:line-through;color:var(--text-muted)">' + CURRENCY + (p.oldPrice || 0).toFixed(2) + '</span>' : '';
          return '<div class="mini-card na-card" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
            '<span class="na-badge">🔖 جديد</span>' +
            '<div class="feat-img"><img src="' + getProductImages(p)[0] + '" alt="' + p.name + '" loading="lazy"></div>' +
            '<div class="feat-body">' +
            '<h4>' + p.name + '</h4>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span class="feat-price">' + CURRENCY + finalPrice + '</span>' + wBadge() +
            oldHtml +
            '</div>' +
            '<button class="feat-add" onclick="event.stopPropagation();quickAdd(' + p.id + ', this)"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-plus') + '"></i> ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd')) + '</button>' +
            '</div>' +
            '</div>';
        }).join('');
        addSectionArrows('newArrivalScroll');
        setTimeout(startNewArrivalAutoScroll, 300);
      } else { naSection.style.display = 'none'; }
    } else { naSection.style.display = 'none'; }
  }

  // Half Price section
  const hpMkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const hpSection = document.getElementById('halfPriceSection');
  const hpScroll = document.getElementById('halfPriceScroll');
  const hpIntro = document.getElementById('hpIntroCard');
  if (hpSection && hpScroll) {
    if (isSectionEnabled('halfPrice') && showFeaturedSection) {
      const halves = (products || []).filter(p => p.oldPrice && p.price <= p.oldPrice * 0.5 && p.stock !== 0).slice(0, 12);
      if (halves.length) {
        hpSection.style.display = 'block';
        if (hpIntro) hpIntro.style.display = 'flex';
        hpScroll.innerHTML = halves.map(p => {
          const finalPrice = wPrice(p);
          const discPct = Math.round((1 - p.price / p.oldPrice) * 100);
          return '<div class="mini-card hp-card" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
            '<span class="hp-badge">-' + discPct + '%</span>' +
            '<div class="feat-img"><img src="' + getProductImages(p)[0] + '" alt="' + p.name + '" loading="lazy"></div>' +
            '<div class="feat-body">' +
            '<h4>' + p.name + '</h4>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span class="feat-price">' + CURRENCY + finalPrice + '</span>' + wBadge() +
            '<span style="font-size:.7rem;text-decoration:line-through;color:var(--text-muted)">' + CURRENCY + (p.oldPrice || 0).toFixed(2) + '</span>' +
            '</div>' +
            '<button class="feat-add" onclick="event.stopPropagation();quickAdd(' + p.id + ', this)"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-plus') + '"></i> ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd')) + '</button>' +
            '</div>' +
            '</div>';
        }).join('');
        startHpAutoScroll();
        addSectionArrows('halfPriceScroll');
      } else { hpSection.style.display = 'none'; stopHpAutoScroll(); }
    } else { hpSection.style.display = 'none'; stopHpAutoScroll(); }
  }

  // Most Sold section
  const msMkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const msSection = document.getElementById('mostSoldSection');
  const msScroll = document.getElementById('mostSoldScroll');
  if (msSection && msScroll) {
    if (isSectionEnabled('mostSold') && showFeaturedSection) {
      const mostSold = [...(products || [])].filter(p => (p.soldCount || 0) > 0).sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 12);
      if (mostSold.length) {
        msSection.style.display = 'block';
        msScroll.innerHTML = mostSold.map(p => {
          const finalPrice = wPrice(p);
          const hasDiscount = p.oldPrice && p.oldPrice > p.price;
          const oldPriceHtml = hasDiscount ? '<span style="font-size:.7rem;text-decoration:line-through;color:var(--text-muted)">' + CURRENCY + (p.oldPrice || 0).toFixed(2) + '</span>' : '';
          return '<div class="mini-card" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
            '<span class="feat-badge"><i class="fa-solid fa-fire"></i> ' + (p.soldCount || 0) + '</span>' +
            '<div class="feat-img"><img src="' + getProductImages(p)[0] + '" alt="' + p.name + '" loading="lazy"></div>' +
            _cardMiniNavHtml(p) +
            '<div class="feat-body">' +
            '<h4>' + p.name + '</h4>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span class="feat-price">' + CURRENCY + finalPrice + '</span>' + wBadge() +
            oldPriceHtml +
            '</div>' +
            '<button class="feat-add" onclick="event.stopPropagation();quickAdd(' + p.id + ', this)"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-plus') + '"></i> ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd')) + '</button>' +
            '</div>' +
            '</div>';
        }).join('');
        addSectionArrows('mostSoldScroll');
      } else { msSection.style.display = 'none'; }
    } else { msSection.style.display = 'none'; }
  }
}

function autoScrollStep(scroll, cards) {
  var isRtl = document.documentElement.dir === 'rtl';
  var scrollRect = scroll.getBoundingClientRect();
  var lastCard = cards[cards.length - 1];
  var lastRect = lastCard.getBoundingClientRect();
  var atEnd = isRtl ? Math.abs(lastRect.left - scrollRect.left) < 10 : Math.abs(lastRect.right - scrollRect.right) < 10;
  if (atEnd) {
    scroll.scrollBy({ left: -scroll.scrollLeft, behavior: 'smooth' });
    return;
  }
  var step = cards[0].offsetWidth + 10;
  scroll.scrollBy({ left: isRtl ? -step : step, behavior: 'smooth' });
}

let featScrollInterval = null;

function startFeatAutoScroll() {
  stopFeatAutoScroll();
  const scroll = document.getElementById('featuredScroll');
  if (!scroll || scroll.children.length < 2) return;
  let userStopped = false;
  scroll.addEventListener('touchstart', () => { userStopped = true; stopFeatAutoScroll(); }, { once: true });
  const cards = scroll.children;
  featScrollInterval = setInterval(() => {
    if (userStopped || !cards.length) return;
    autoScrollStep(scroll, cards);
  }, 2500);
}

function stopFeatAutoScroll() {
  if (featScrollInterval) { clearInterval(featScrollInterval); featScrollInterval = null; }
}

function viewAllSection(type) {
  _sectionFilter = type;
  history.pushState(null, '', '?section=' + encodeURIComponent(type));
  document.body.classList.add('section-filter-active');
  filterCategory('الكل', false);
  const gridEl = document.getElementById('productsSection') || document.getElementById('productsGrid');
  if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearSectionFilter() {
  _sectionFilter = null;
  document.body.classList.remove('section-filter-active');
  cleanHomeHash();
  if (location.search) {
    history.replaceState(null, '', location.pathname);
  }
  renderProducts(getFilteredProducts());
}

function scrollSection(containerId, dir) {
  const scroll = document.getElementById(containerId);
  if (!scroll) return;
  // Stop auto-scroll when manually scrolling
  if (containerId === 'flashSaleScroll') stopFlashAutoScroll();
  else if (containerId === 'halfPriceScroll') stopHpAutoScroll();
  else if (containerId === 'featuredScroll') stopFeatAutoScroll();
  else if (containerId === 'newArrivalScroll') stopNewArrivalAutoScroll();
  const isRtl = document.documentElement.dir === 'rtl';
  const step = scroll.querySelector('.mini-card, .flash-card, .hp-intro-card, .fs-intro-card, .fs-viewall-card');
  const stepSize = step ? step.offsetWidth + 10 : 160;
  // Check if first/last card is fully visible using bounding rect
  const scrollRect = scroll.getBoundingClientRect();
  const cards = scroll.querySelectorAll('.mini-card, .flash-card, .hp-intro-card, .fs-intro-card, .fs-viewall-card');
  const firstCard = cards[0];
  const lastCard = cards[cards.length - 1];
  if (firstCard && lastCard) {
    const firstRect = firstCard.getBoundingClientRect();
    const lastRect = lastCard.getBoundingClientRect();
    const atStart = isRtl ? Math.abs(firstRect.right - scrollRect.right) < 5 : Math.abs(firstRect.left - scrollRect.left) < 5;
    const atEnd = isRtl ? Math.abs(lastRect.left - scrollRect.left) < 5 : Math.abs(lastRect.right - scrollRect.right) < 5;
    if (dir === 'next' && atEnd) {
      firstCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      return;
    }
    if (dir === 'prev' && atStart) {
      lastCard.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
      return;
    }
  }
  const scrollAmount = isRtl ? (dir === 'next' ? -stepSize : stepSize) : (dir === 'next' ? stepSize : -stepSize);
  scroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

function addSectionArrows(containerId) {
  const scroll = document.getElementById(containerId);
  if (!scroll || scroll.classList.contains('has-arrows')) return;
  scroll.classList.add('has-arrows');
  const parent = scroll.parentNode;
  if (!parent || parent.querySelector('.sec-arrow')) return;
  // Skip if section already has header arrows (section-arrow-btns)
  const sectionRoot = scroll.closest('[id$="Section"], [id^="pbCustom_"]');
  if (sectionRoot && sectionRoot.querySelector('.section-arrow-btns')) return;
  const prev = document.createElement('button');
  prev.className = 'sec-arrow sec-arrow-prev';
  prev.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  const next = document.createElement('button');
  next.className = 'sec-arrow sec-arrow-next';
  next.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  const stepFn = () => {
    const card = scroll.querySelector('.mini-card, .flash-card, .hp-intro-card, .fs-intro-card');
    return card ? card.offsetWidth + 10 : 160;
  };
  const isRtl = document.documentElement.dir === 'rtl';
  const maxScroll = () => scroll.scrollWidth - scroll.clientWidth;
  const stopAuto = () => {
    if (containerId === 'flashSaleScroll') stopFlashAutoScroll();
    else if (containerId === 'halfPriceScroll') stopHpAutoScroll();
    else if (containerId === 'featuredScroll') stopFeatAutoScroll();
    else if (containerId === 'newArrivalScroll') stopNewArrivalAutoScroll();
    else if (containerId === 'offersScroll') stopOffersAutoScroll();
  };
  prev.onclick = () => {
    stopAuto();
    const m = maxScroll();
    const nextLeft = scroll.scrollLeft + (isRtl ? stepFn() : -stepFn());
    if (isRtl ? nextLeft > 0 : nextLeft < 0) {
      scroll.scrollTo({ left: isRtl ? -m : m, behavior: 'smooth' });
    } else {
      scroll.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }
  };
  next.onclick = () => {
    stopAuto();
    const m = maxScroll();
    const nextLeft = scroll.scrollLeft + (isRtl ? -stepFn() : stepFn());
    if (isRtl ? nextLeft < -m : nextLeft > m) {
      scroll.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scroll.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }
  };
  parent.appendChild(prev);
  parent.appendChild(next);
}

let naScrollInterval = null;
function startNewArrivalAutoScroll() {
  stopNewArrivalAutoScroll();
  const scroll = document.getElementById('newArrivalScroll');
  if (!scroll || scroll.children.length < 2) return;
  let stopped = false;
  const stop = () => { stopped = true; stopNewArrivalAutoScroll(); };
  scroll.addEventListener('touchstart', stop, { once: true });
  scroll.addEventListener('mousedown', stop, { once: true });
  const cards = scroll.children;
  naScrollInterval = setInterval(() => {
    if (stopped || !cards.length) return;
    autoScrollStep(scroll, cards);
  }, 3000);
}
function stopNewArrivalAutoScroll() {
  if (naScrollInterval) { clearInterval(naScrollInterval); naScrollInterval = null; }
}

let hpScrollInterval = null;
function startHpAutoScroll() {
  stopHpAutoScroll();
  const scroll = document.getElementById('halfPriceScroll');
  if (!scroll || scroll.children.length < 2) return;
  let stopped = false;
  const stop = () => { stopped = true; stopHpAutoScroll(); };
  scroll.addEventListener('touchstart', stop, { once: true });
  scroll.addEventListener('mousedown', stop, { once: true });
  const cards = scroll.children;
  hpScrollInterval = setInterval(() => {
    if (stopped || !cards.length) return;
    autoScrollStep(scroll, cards);
  }, 3000);
}
function stopHpAutoScroll() {
  if (hpScrollInterval) { clearInterval(hpScrollInterval); hpScrollInterval = null; }
}

let flashScrollInterval = null;
function startFlashAutoScroll() {
  stopFlashAutoScroll();
  const scroll = document.getElementById('flashSaleScroll');
  if (!scroll || scroll.children.length < 2) return;
  let stopped = false;
  const stop = () => { stopped = true; stopFlashAutoScroll(); };
  scroll.addEventListener('touchstart', stop, { once: true });
  scroll.addEventListener('mousedown', stop, { once: true });
  const cards = scroll.children;
  flashScrollInterval = setInterval(() => {
    if (stopped || !cards.length) return;
    autoScrollStep(scroll, cards);
  }, 3000);
}
function stopFlashAutoScroll() {
  if (flashScrollInterval) { clearInterval(flashScrollInterval); flashScrollInterval = null; }
}

let offersScrollInterval = null;
function startOffersAutoScroll() {
  stopOffersAutoScroll();
  const scroll = document.getElementById('offersScroll');
  if (!scroll || scroll.children.length < 2) return;
  let stopped = false;
  const stop = () => { stopped = true; stopOffersAutoScroll(); };
  scroll.addEventListener('touchstart', stop, { once: true });
  const cards = scroll.children;
  offersScrollInterval = setInterval(() => {
    if (stopped || !cards.length) return;
    autoScrollStep(scroll, cards);
  }, 3000);
}
function stopOffersAutoScroll() {
  if (offersScrollInterval) { clearInterval(offersScrollInterval); offersScrollInterval = null; }
}

let bannerScrollInterval = null;

function loadBannerSettings() {
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  let settings = null;
  const saved = localStorage.getItem('mycart_banner_settings');
  if (saved) {
    try {
      settings = JSON.parse(saved);
      if (!settings || typeof settings.layout === 'undefined') settings = null;
    } catch(e) { settings = null; }
  }
  if (!settings) {
    settings = mkt.bannerSettings || {};
  }
  if (!settings) settings = {};
  settings.layout = settings.layout || 'slider';
  settings.sliderStyle = settings.sliderStyle || 'default';
  settings.sliderEffect = settings.sliderEffect || 'slide';
  settings.heroStyle = settings.heroStyle || 'only';
  settings.sliderCounter = settings.sliderCounter || 'show';
  settings.autoplay = settings.autoplay !== false;
  settings.interval = settings.interval || 4000;
  settings.aspectRatio = settings.aspectRatio || '2/1';
  settings.borderRadius = settings.borderRadius || '14px';
  return settings;
}

function ensureBannerCounter() {
  const slider = document.getElementById('bannerSlider');
  const wrap = document.getElementById('bannerSliderWrap') || slider;
  if (!wrap) return;
  const settings = loadBannerSettings();
  const total = slider.children.length;
  let counter = document.getElementById('bannerCounter');
  const shouldShow = settings.sliderCounter !== 'hide' && total > 1 && (settings.layout === 'slider' || settings.layout === 'peek');
  if (!shouldShow) {
    if (counter && counter.parentNode) counter.parentNode.removeChild(counter);
    return;
  }
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'bannerCounter';
    counter.style.cssText = 'position:absolute;z-index:8;top:14px;left:14px;background:rgba(15,23,42,0.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font-size:0.8rem;font-weight:800;padding:5px 13px;border-radius:30px;direction:ltr;line-height:1;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,0.3);letter-spacing:.3px';
    wrap.appendChild(counter);
  }
  const cur = Math.round(slider.scrollLeft / Math.max(1, slider.children[0].offsetWidth)) ;
  updateBannerCounter(Math.min(cur, total - 1), total);
}
function updateBannerCounter(idx, total) {
  const counter = document.getElementById('bannerCounter');
  if (counter && total > 0) counter.textContent = (idx + 1) + ' / ' + total;
}

function startBannerAutoScroll() {
  stopBannerAutoScroll();
  const slider = document.getElementById('bannerSlider');
  if (!slider || !slider.children.length) return;
  slider.removeAttribute('data-layout');

  if (currentCat !== 'الكل' || currentBrand) {
    slider.style.display = 'none';
    return;
  }

  const settings = loadBannerSettings();

  // Apply layout style dynamically
  if (settings.layout === 'grid') {
    slider.style.display = 'grid';
    slider.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    slider.style.gap = '16px';
    slider.style.padding = '16px';
    slider.style.overflowX = 'visible';
    slider.style.scrollSnapType = 'none';
    slider.querySelectorAll('.banner-slide').forEach(slide => {
      slide.style.flex = '1 1 280px';
      slide.style.width = '100%';
      slide.style.minWidth = '';
      slide.style.scrollSnapAlign = 'none';
      if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
      if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
    });
    return;
  } else if (settings.layout === 'stack') {
    slider.style.display = 'flex';
    slider.style.flexDirection = 'column';
    slider.style.gap = '16px';
    slider.style.padding = '16px';
    slider.style.overflowX = 'visible';
    slider.style.scrollSnapType = 'none';
    slider.querySelectorAll('.banner-slide').forEach(slide => {
      slide.style.flex = 'none';
      slide.style.width = '100%';
      slide.style.minWidth = '';
      slide.style.scrollSnapAlign = 'none';
      if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
      if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
    });
    return;
  } else if (settings.layout === 'hero') {
    if (settings.heroStyle === 'only') {
      slider.style.display = 'block';
      slider.style.padding = '16px';
      slider.style.overflowX = 'visible';
      slider.style.scrollSnapType = 'none';
      slider.querySelectorAll('.banner-slide').forEach((slide, index) => {
        if (index === 0) {
          slide.style.display = '';
          slide.style.flex = '0 0 100%';
          slide.style.width = '100%';
          slide.style.minWidth = '100%';
        } else {
          slide.style.display = 'none';
        }
        slide.style.scrollSnapAlign = 'none';
        if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
        if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
      });
    } else if (settings.heroStyle === 'side') {
      slider.style.display = 'grid';
      slider.style.gridTemplateColumns = '2fr 1fr';
      slider.style.alignItems = 'stretch';
      slider.style.gap = '16px';
      slider.style.padding = '16px';
      slider.style.overflowX = 'visible';
      slider.style.scrollSnapType = 'none';
      slider.querySelectorAll('.banner-slide').forEach((slide, index) => {
        if (index === 0) {
          slide.style.flex = '';
          slide.style.width = '';
          slide.style.minWidth = '';
        } else {
          slide.style.flex = '';
          slide.style.width = '';
          slide.style.minWidth = '';
        }
        slide.style.scrollSnapAlign = 'none';
        if (index !== 0 && settings.aspectRatio) {
          const parts = settings.aspectRatio.split('/');
          if (parts.length === 2 && parseFloat(parts[0])) {
            slide.style.aspectRatio = (parseFloat(parts[0]) / 2) + '/' + parts[1];
          } else {
            slide.style.aspectRatio = settings.aspectRatio;
          }
        } else if (settings.aspectRatio) {
          slide.style.aspectRatio = settings.aspectRatio;
        }
        if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
      });
    } else {
      slider.style.display = 'flex';
      slider.style.flexDirection = 'row';
      slider.style.flexWrap = 'wrap';
      slider.style.justifyContent = 'flex-start';
      slider.style.columnGap = '16px';
      slider.style.rowGap = '16px';
      slider.style.padding = '16px';
      slider.style.overflowX = 'visible';
      slider.style.scrollSnapType = 'none';
      slider.querySelectorAll('.banner-slide').forEach((slide, index) => {
        if (index === 0) {
          slide.style.flex = '0 0 100%';
          slide.style.width = '100%';
          slide.style.minWidth = '100%';
        } else {
          slide.style.flex = '1 1 calc(33.333% - 11px)';
          slide.style.minWidth = '160px';
          slide.style.width = '';
        }
        slide.style.scrollSnapAlign = 'none';
        if (index !== 0) slide.style.aspectRatio = '2/1';
        else if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
        if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
      });
    }
    return;
  } else if (settings.layout === 'peek') {
    slider.style.display = 'flex';
    slider.style.flexDirection = 'row';
    slider.style.flexWrap = 'nowrap';
    slider.style.justifyContent = 'flex-start';
    slider.style.gridTemplateColumns = '';
    slider.style.gap = '12px';
    slider.style.padding = '12px 24px';
    slider.style.overflowX = 'auto';
    slider.style.scrollSnapType = 'x mandatory';
    slider.querySelectorAll('.banner-slide').forEach(slide => {
      slide.style.flex = '0 0 75%';
      slide.style.width = '75%';
      slide.style.minWidth = '75%';
      slide.style.scrollSnapAlign = 'center';
      if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
      if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
    });
  } else if (settings.layout === 'premium') {
    // Premium global layout: main + 2 side cards
    slider.setAttribute('data-layout', 'premium');
    slider.style.display = 'grid';
    slider.style.gridTemplateColumns = '2fr 1fr';
    slider.style.gap = '12px';
    slider.style.padding = '16px';
    slider.style.overflowX = 'visible';
    slider.style.scrollSnapType = 'none';
    slider.querySelectorAll('.banner-slide').forEach((slide, index) => {
      if (index === 0) {
        slide.style.flex = '';
        slide.style.width = '';
        slide.style.minWidth = '';
        slide.style.gridRow = '1 / 3';
      } else if (index <= 2) {
        slide.style.flex = '';
        slide.style.width = '';
        slide.style.minWidth = '';
      } else {
        slide.style.display = 'none';
      }
      slide.style.scrollSnapAlign = 'none';
      if (index !== 0 && settings.aspectRatio) {
        const parts = settings.aspectRatio.split('/');
        if (parts.length === 2 && parseFloat(parts[0])) {
          slide.style.aspectRatio = (parseFloat(parts[0]) / 2) + '/' + parts[1];
        } else {
          slide.style.aspectRatio = settings.aspectRatio;
        }
      } else if (settings.aspectRatio) {
        slide.style.aspectRatio = settings.aspectRatio;
      }
      if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
      // Parallax shadow effect
      if (index === 0) {
        slide.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
        slide.style.zIndex = '2';
      } else {
        slide.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        slide.style.zIndex = '1';
      }
    });
    return;
  } else {
      // default/slider
      const isFade = settings.sliderEffect === 'fade' || settings.sliderEffect === 'zoom' || settings.sliderEffect === 'flip' || settings.sliderEffect === 'morph' || settings.sliderEffect === 'blur' || settings.sliderEffect === 'parallax';
      const sliderStyle = settings.sliderStyle || 'default';
      if (isFade) {
        slider.style.display = 'block';
        slider.style.position = 'relative';
        slider.style.overflowX = 'visible';
        slider.style.scrollSnapType = 'none';
        slider.style.padding = '0';
      slider.querySelectorAll('.banner-slide').forEach((slide, index) => {
        slide.style.margin = '0';
        slide.style.flex = 'none';
        if (index === 0) {
          slide.style.position = 'relative';
        } else {
          slide.style.position = 'absolute';
          slide.style.top = '0';
          slide.style.left = '0';
          slide.style.height = '100%';
        }
        slide.style.width = '100%';
        slide.style.minWidth = '100%';
        slide.style.scrollSnapAlign = 'none';
        slide.style.pointerEvents = index === 0 ? 'auto' : 'none';
        slide.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s cubic-bezier(.4,0,.2,1), filter 0.8s ease-in-out';
        
        if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
        if (settings.borderRadius) slide.style.borderRadius = settings.borderRadius;
        
        if (index === 0) {
          slide.style.opacity = '1';
          slide.style.zIndex = '2';
          slide.style.transform = 'scale(1)';
          slide.style.filter = 'none';
        } else {
          slide.style.opacity = '0';
          slide.style.zIndex = '1';
          if (settings.sliderEffect === 'zoom') slide.style.transform = 'scale(1.05)';
          else if (settings.sliderEffect === 'flip') slide.style.transform = 'perspective(800px) rotateY(90deg)';
          else if (settings.sliderEffect === 'morph') { slide.style.transform = 'scale(0.8) rotate(-5deg)'; slide.style.filter = 'blur(4px)'; }
          else if (settings.sliderEffect === 'blur') { slide.style.filter = 'blur(12px)'; slide.style.transform = 'scale(1)'; }
          else if (settings.sliderEffect === 'parallax') { slide.style.transform = 'translateX(30%) scale(1.05)'; slide.style.opacity = '0.4'; }
          else slide.style.transform = 'translateX(100%)';
        }
      });
    } else {
      slider.style.display = 'flex';
      slider.style.flexDirection = 'row';
      slider.style.flexWrap = 'nowrap';
      slider.style.justifyContent = 'flex-start';
      slider.style.gridTemplateColumns = '';
      slider.style.position = 'relative';
      slider.style.overflowX = 'auto';
      slider.style.scrollSnapType = 'x mandatory';
      slider.querySelectorAll('.banner-slide').forEach(slide => {
        if (sliderStyle === 'cards') {
          slider.style.gap = '16px';
          slider.style.padding = '16px';
          slide.style.flex = '0 0 calc(78% - 16px)';
          slide.style.width = 'calc(78% - 16px)';
          slide.style.minWidth = 'calc(78% - 16px)';
          slide.style.scrollSnapAlign = 'center';
          slide.style.borderRadius = (settings.borderRadius || '14px') + ' 14px 14px ' + (settings.borderRadius || '14px');
        } else if (sliderStyle === 'full') {
          slider.style.gap = '12px';
          slider.style.padding = '12px 16px';
          slide.style.flex = '0 0 100%';
          slide.style.width = '100%';
          slide.style.minWidth = '100%';
          slide.style.scrollSnapAlign = 'start';
          slide.style.borderRadius = settings.borderRadius || '14px';
        } else if (sliderStyle === 'preview') {
          slider.style.gap = '12px';
          slider.style.padding = '12px 24px';
          slide.style.flex = '0 0 65%';
          slide.style.width = '65%';
          slide.style.minWidth = '65%';
          slide.style.scrollSnapAlign = 'center';
          slide.style.borderRadius = settings.borderRadius || '14px';
        } else if (sliderStyle === 'grid') {
          slider.style.gap = '10px';
          slider.style.padding = '12px 16px';
          slide.style.flex = '0 0 48%';
          slide.style.width = '48%';
          slide.style.minWidth = '48%';
          slide.style.scrollSnapAlign = 'start';
          slide.style.borderRadius = settings.borderRadius || '10px';
        } else {
          slider.style.gap = '12px';
          slider.style.padding = '12px 16px';
          slide.style.flex = '0 0 calc(100% - 32px)';
          slide.style.width = 'calc(100% - 32px)';
          slide.style.minWidth = 'calc(100% - 32px)';
          slide.style.scrollSnapAlign = 'start';
        }
        slide.style.position = 'relative';
        slide.style.opacity = '';
        slide.style.zIndex = '';
        slide.style.transform = '';
        slide.style.transition = '';
        slide.style.pointerEvents = '';
        if (settings.aspectRatio) slide.style.aspectRatio = settings.aspectRatio;
      });
    }
  }

  slider.addEventListener('scroll', function() {
    let best = 0, bestOff = Infinity;
    for (let i = 0; i < slider.children.length; i++) {
      const child = slider.children[i];
      const off = Math.abs(child.offsetLeft - slider.scrollLeft);
      if (off < bestOff) { bestOff = off; best = i; }
    }
    if (typeof programmaticUntil !== 'undefined' && programmaticUntil && Date.now() < programmaticUntil) return;
    updateBannerCounter(best, slider.children.length);
  }, { passive: true });

  if (!settings.autoplay || slider.children.length < 2) return;

  if (!settings.autoplay || slider.children.length < 2) return;

  let idx = 0;
  let userStopped = false;
  let programmaticUntil = 0;

  slider.addEventListener('touchstart', () => { userStopped = true; stopBannerAutoScroll(); }, { passive: true, once: true });

  bannerScrollInterval = setInterval(() => {
    if (userStopped || !slider.children.length) return;
    idx = (idx + 1) % slider.children.length;
    programmaticUntil = Date.now() + (settings.interval || 4000);
    updateBannerCounter(idx, slider.children.length);
    
    const isFade = settings.layout === 'slider' && (settings.sliderEffect === 'fade' || settings.sliderEffect === 'zoom' || settings.sliderEffect === 'flip' || settings.sliderEffect === 'morph' || settings.sliderEffect === 'blur' || settings.sliderEffect === 'parallax');
    if (isFade) {
      const slides = slider.querySelectorAll('.banner-slide');
      slides.forEach((slide, index) => {
        if (index === idx) {
          slide.style.opacity = '1';
          slide.style.zIndex = '2';
          slide.style.pointerEvents = 'auto';
          slide.style.transform = 'scale(1)';
          slide.style.filter = 'none';
        } else {
          slide.style.opacity = '0';
          slide.style.zIndex = '1';
          slide.style.pointerEvents = 'none';
          if (settings.sliderEffect === 'zoom') slide.style.transform = 'scale(1.05)';
          else if (settings.sliderEffect === 'flip') slide.style.transform = 'perspective(800px) rotateY(90deg)';
          else if (settings.sliderEffect === 'morph') { slide.style.transform = 'scale(0.8) rotate(-5deg)'; slide.style.filter = 'blur(4px)'; }
          else if (settings.sliderEffect === 'blur') { slide.style.filter = 'blur(12px)'; slide.style.transform = 'scale(1)'; }
          else if (settings.sliderEffect === 'parallax') { slide.style.transform = 'translateX(' + ((index < idx ? -30 : 30)) + '%) scale(1.05)'; slide.style.opacity = '0.4'; }
          else slide.style.transform = 'translateX(' + ((index < idx ? -100 : 100)) + '%)';
        }
      });
    } else {
      const slide = slider.children[idx];
      if (slide) {
        slider.scrollTo({
          left: slide.offsetLeft,
          behavior: 'smooth'
        });
      }
    }
  }, settings.interval || 4000);
}

function stopBannerAutoScroll() {
  if (bannerScrollInterval) {
    clearInterval(bannerScrollInterval);
    bannerScrollInterval = null;
  }
}

function renderWishlist() {
  const items = products.filter(p => wishlist.includes(p.id));
  const container = document.getElementById('wishlistItems');
  if (!items.length) {
    container.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-heart" style="font-size:2.5rem;display:block;margin-bottom:12px;opacity:.3"></i><p>${__('wishlistEmpty')}</p><p style="font-size:.8rem;margin-top:4px">${__('wishlistHint')}</p></div>`;
    return;
  }
  container.innerHTML = items.map(p => `
    <div class="cart-item" onclick="openDetail(${p.id});closeWishlistSheet()">
      <img src="${getProductImages(p)[0]}" alt="${p.name}" loading="lazy">
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <div class="cart-item-price">${CURRENCY}${wPrice(p)}${wBadge()}</div>
      </div>
      <div class="wishlist-actions">
        <button class="qty-btn qty-btn-cart" onclick="event.stopPropagation();quickAdd(${p.id})"><i class="fa-solid fa-cart-plus"></i></button>
        <button class="qty-btn" style="color:#ef4444" onclick="event.stopPropagation();toggleWishlist(${p.id});renderWishlist()"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function openWishlistSheet() {
  renderWishlist();
  document.getElementById('wishlistSheet').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeWishlistSheet() {
  document.getElementById('wishlistSheet').classList.remove('show');
  document.body.style.overflow = '';
}

function toggleSearch() {
  const bar = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');
  if (bar.style.display === 'none' || !bar.style.display) {
    bar.style.display = 'block';
    bar.style.animation = 'none';
    void bar.offsetHeight;
    bar.style.animation = 'fadeIn .25s ease';
    setTimeout(() => input.focus(), 100);
  } else {
    bar.style.display = 'none';
    input.value = '';
    input.dispatchEvent(new Event('input'));
  }
}

var _searchTimer;
document.getElementById('searchInput').addEventListener('input', function() {
  clearTimeout(_searchTimer);
  var input = this;
  _searchTimer = setTimeout(function() {
    const q = input.value.trim().toLowerCase();
    if (!q) return renderProducts(getFilteredProducts());
    renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
  }, 200);
});

function openDetail(id, fromRoute) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  detailQty = 1;
  currentVariant = null;
  currentDetailImg = 0;
  // Pixel tracking: ViewContent
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', { content_name: p.name, content_category: Array.isArray(p.category) ? p.category.join(',') : p.category, content_ids: p.sku ? [p.sku] : [p.id], content_type: 'product', value: p.price, currency: CURRENCY });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', { currency: CURRENCY, value: p.price, items: [{ id: p.sku || p.id, name: p.name, category: Array.isArray(p.category) ? p.category.join(',') : p.category, price: p.price, quantity: 1 }] });
  }
  document.getElementById('detailQty').textContent = '1';
  document.getElementById('detailImage').src = getProductImages(p)[0];
  // Thumbnails — handled in updateDetailThumbs
  updateDetailThumbs(p);
  document.getElementById('detailName').textContent = p.name;
  var badgeEl = document.getElementById('detailBadge');
  if (badgeEl) {
    if (p.badge) {
      badgeEl.textContent = p.badge;
      badgeEl.style.display = 'block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
  document.getElementById('detailBrand').innerHTML = p.brand ? `<i class="fa-solid fa-award"></i> ${p.brand} <span style="font-size:.7rem;font-weight:400;margin-right:4px">› ${__('viewAll')}</span>` : '';
  document.getElementById('detailBrand').style.display = p.brand ? 'inline-flex' : 'none';
  document.getElementById('detailBrand').onclick = p.brand ? function(){ filterBrand(p.brand); } : null;
  // Stock indicator
  const stockEl = document.getElementById('detailStock') || (() => {
    const el = document.createElement('div'); el.id = 'detailStock'; el.style.cssText = 'font-size:.75rem;font-weight:700;margin-top:4px';
    document.getElementById('detailBrand').after(el); return el;
  })();
  if (p.stock !== undefined && p.stock >= 0) {
    stockEl.style.display = 'flex';
    stockEl.style.alignItems = 'center';
    stockEl.style.gap = '6px';
    if (p.stock === 0) {
      stockEl.innerHTML = '<span style="background:#ef4444;color:#fff;padding:2px 10px;border-radius:999px;font-size:.7rem">نفذ من المخزون</span>';
    } else if (p.stock <= 5) {
      stockEl.innerHTML = `<span style="color:#f59e0b"><i class="fa-solid fa-circle"></i> متبقي ${p.stock} قطع فقط</span>`;
    } else {
      stockEl.innerHTML = `<span style="color:#10b981"><i class="fa-solid fa-circle"></i> متوفر</span>`;
    }
  } else {
    stockEl.style.display = 'none';
  }
  // Update add-to-cart button & qty controls
  const addBtn = document.querySelector('.add-to-cart-btn');
  const qtyBtns = document.querySelectorAll('.qty-row button');
  if (addBtn) {
    if (p.stock === 0) {
      addBtn.textContent = 'نفذ';
      addBtn.disabled = true;
      addBtn.style.opacity = '.5';
      addBtn.style.cursor = 'not-allowed';
      addBtn.style.background = '#94a3b8';
    } else {
      addBtn.textContent = __('addToCartShort');
      addBtn.disabled = false;
      addBtn.style.opacity = '';
      addBtn.style.cursor = '';
      addBtn.style.background = '';
    }
  }
  qtyBtns.forEach(btn => { btn.disabled = p.stock === 0; btn.style.opacity = p.stock === 0 ? '.3' : ''; btn.style.pointerEvents = p.stock === 0 ? 'none' : ''; });
  const prodOffer = getProductOffer(p);
  const offerPrice = calcOfferPrice(p);
  if (offerPrice !== null) {
    const baseP = wPrice(p);
    document.getElementById('detailPrice').innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:1.5rem;font-weight:900;color:var(--accent)">${CURRENCY}${offerPrice}${wBadge()}</span>
      <span style="font-size:.95rem;text-decoration:line-through;color:#94a3b8;font-weight:500">${CURRENCY}${baseP}</span>
      ${getProductDiscount(p) ? `<span style="font-size:.7rem;font-weight:800;background:#ef4444;color:#fff;padding:3px 10px;border-radius:999px;line-height:1">-${getProductDiscount(p)}%</span>` : ''}
      <span style="font-size:.7rem;font-weight:800;background:#f59e0b;color:#fff;padding:3px 10px;border-radius:999px;line-height:1"><i class="fa-solid fa-gift"></i> ${prodOffer.badge||prodOffer.name}</span>
    </div>`;
  } else if (p.oldPrice) {
    document.getElementById('detailPrice').innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:1.5rem;font-weight:900;color:var(--accent)">${CURRENCY}${wPrice(p)}${wBadge()}</span>
      <span style="font-size:.95rem;text-decoration:line-through;color:#94a3b8;font-weight:500">${CURRENCY}${p.oldPrice}</span>
      ${getProductDiscount(p) ? `<span style="font-size:.7rem;font-weight:800;background:#ef4444;color:#fff;padding:3px 10px;border-radius:999px;line-height:1">-${getProductDiscount(p)}%</span>` : ''}
    </div>`;
  } else {
    document.getElementById('detailPrice').innerHTML = `<span style="font-size:1.5rem;font-weight:900;color:var(--accent)">${CURRENCY}${wPrice(p)}${wBadge()}</span>`;
  }
  const offerBanner = document.getElementById('offerBanner');
  if (offerBanner) {
    if (prodOffer) {
      offerBanner.style.display = 'flex';
      const discLabel = prodOffer.type==='percent' ? prodOffer.value+'%' : CURRENCY+prodOffer.value;
      const discTag = `<span style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:.65rem;font-weight:800;padding:2px 10px;border-radius:999px;white-space:nowrap">-${discLabel}</span>`;
      offerBanner.innerHTML = `<span style="font-size:1rem"><i class="fa-solid fa-gift"></i></span> <strong style="font-size:.85rem">${prodOffer.badge||prodOffer.name}</strong> ${discTag}${prodOffer.endDate?` <span style="font-size:.7rem;color:#78716c"><i class="fa-solid fa-hourglass-half"></i> حتى ${prodOffer.endDate}</span>`:''}`;
    } else {
      offerBanner.style.display = 'none';
    }
  }
  const descEl = document.getElementById('productDescription');
  if (descEl) {
    if (p.description) { descEl.style.display = 'block'; descEl.innerHTML = `<h4><i class="fa-solid fa-align-left"></i> الوصف</h4><p>${p.description}</p>`; }
    else descEl.style.display = 'none';
  }
  document.getElementById('featuresList').innerHTML = `<h4>${__('features')}:</h4><ul>${p.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}</ul>`;
  document.getElementById('specsBody').innerHTML = p.specs.map(s => `<tr><td>${s[0]}</td><td>${s[1]}</td></tr>`).join('');

  // Render product note
  const noteContainer = document.getElementById('productNoteContainer');
  const noteText = document.getElementById('productNoteText');
  if (noteContainer && noteText) {
    if (p.note) {
      noteContainer.style.display = 'flex';
      noteText.textContent = p.note;
    } else {
      noteContainer.style.display = 'none';
      noteText.textContent = '';
    }
  }

  // Bundle Products Display
  const bundleSection = document.getElementById('bundleProductsSection');
  if (bundleSection) {
    if (p.type === 'bundle' && p.bundleProducts && p.bundleProducts.length) {
      bundleSection.style.display = 'block';
      let sumOrig = 0;
      const itemsHtml = p.bundleProducts.map((bp, idx) => {
        const item = products.find(pr => pr.id === bp.id) || bp;
        const isOut = item.stock === 0;
        const price = item.price || 0;
        const qty = bp.qty || 1;
        sumOrig += price * qty;
        const img = (item.images && item.images[0]) || item.image || 'https://placehold.co/60x60/e2e8f0/64748b?text=N';
        return `
          <div style="display:flex;flex-direction:column;align-items:center;width:75px;position:relative;cursor:pointer" onclick="openDetail(${item.id})">
            <div style="position:relative;width:58px;height:58px;border-radius:12px;background:#fff;padding:3px;border:1.5px solid #fde68a;box-shadow:0 3px 8px rgba(217,119,6,0.12)">
              <img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:9px;${isOut ? 'filter:grayscale(1);opacity:.4' : ''}">
              ${qty > 1 ? `<span style="position:absolute;top:-6px;right:-6px;background:#d97706;color:#fff;font-size:.65rem;font-weight:800;padding:1px 6px;border-radius:999px;box-shadow:0 2px 4px rgba(0,0,0,0.15)">x${qty}</span>` : ''}
              ${isOut ? '<span style="position:absolute;inset:0;background:rgba(239,68,68,.85);color:#fff;font-size:.55rem;font-weight:900;display:flex;align-items:center;justify-content:center;border-radius:9px">نفذ</span>' : ''}
            </div>
            <p style="font-size:.7rem;font-weight:700;margin:6px 0 2px;color:#78350f;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name || bp.name}</p>
            <span style="font-size:.65rem;font-weight:800;color:var(--accent)">${CURRENCY}${price}</span>
          </div>`;
      }).join('<div style="font-size:1.1rem;font-weight:900;color:#d97706;padding:0 2px;margin-top:-14px">+</div>');

      let bHtml = '<div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1.5px solid #f59e0b;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 4px 15px rgba(245,158,11,0.12)">';
      bHtml += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px dashed #fde68a;padding-bottom:8px">';
      bHtml += '<h4 style="font-size:.85rem;font-weight:800;color:#92400e;margin:0;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-boxes-stacked" style="color:#d97706"></i> محتويات البكج المجمع:</h4>';
      bHtml += `<span style="font-size:.7rem;font-weight:800;background:rgba(217,119,6,0.15);color:#92400e;padding:3px 10px;border-radius:999px">${p.bundleProducts.length} منتجات</span>`;
      bHtml += '</div>';
      bHtml += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:6px 0">';
      bHtml += itemsHtml;
      bHtml += '</div>';
      if (sumOrig > p.price) {
        const savings = sumOrig - p.price;
        bHtml += `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #fde68a;display:flex;align-items:center;justify-content:space-between;font-size:.72rem">
          <span style="color:#78350f;font-weight:600">القيمة الأصلية للمكونات: <span style="text-decoration:line-through;color:#94a3b8">${CURRENCY}${sumOrig}</span></span>
          <span style="background:#10b981;color:#fff;font-weight:800;padding:2px 8px;border-radius:6px;font-size:.68rem">وفرت ${CURRENCY}${savings} مع هذا البكج!</span>
        </div>`;
      }
      bHtml += '</div>';
      bundleSection.innerHTML = bHtml;
    } else {
      bundleSection.innerHTML = '';
      bundleSection.style.display = 'none';
    }
  }
  
  // Marketing Features
  const marketingData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const cdownEl = document.getElementById('promoCountdown');
  if (cdownEl) {
    if (marketingData.countdown?.show && p.countdown?.show !== false) {
      cdownEl.style.display = 'flex';
      startPromoCountdown(p.countdown?.duration || marketingData.countdown.duration || 180);
    } else {
      cdownEl.style.display = 'none';
    }
  }

  // Live Viewers Counter — start ticker when product opens
  var lvContainer = document.getElementById('liveViewersContainer');
  if (p.liveViewers?.show !== false) {
    startLiveViewersTicker(p.name);
  } else if (lvContainer) {
    lvContainer.style.display = 'none';
  }

  const shareSection = document.getElementById('shareProductSection');
  if (shareSection) {
    if (!marketingData.share || marketingData.share.show !== false) {
      shareSection.style.display = 'flex';
      const prodUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}#product/${p.id}`);
      const prodText = encodeURIComponent(`شاهد هذا المنتج الرائع: ${p.name}`);
      document.getElementById('shareWa').href = `https://wa.me/?text=${prodText}%20${prodUrl}`;
      document.getElementById('shareFb').href = `https://www.facebook.com/sharer/sharer.php?u=${prodUrl}`;
    } else {
      shareSection.style.display = 'none';
    }
  }
  const quickWaBtn = document.getElementById('quickWaBtn');
  if (quickWaBtn) {
    if (marketingData.waCheckout?.show) {
      quickWaBtn.style.display = 'flex';
    } else {
      quickWaBtn.style.display = 'none';
    }
  }
  // Volume Discount
  const volSection = document.getElementById('volumeDiscountSection');
  if (volSection) {
    const prodVolShow = p.volumeDiscount?.show;
    const globalVolShow = marketingData.volumeDiscount?.show;
    if (prodVolShow || (prodVolShow === undefined && globalVolShow)) {
      volSection.style.display = 'block';
      const type = marketingData.volumeDiscount.type || 'percent';
      const gridContainer = volSection.querySelector('.volume-grid');
      
      if (type === 'bogo') {
        const buy = marketingData.volumeDiscount.bogoBuy || 2;
        const get = marketingData.volumeDiscount.bogoGet || 1;
        if (gridContainer) {
          gridContainer.innerHTML = `
            <div class="volume-item" style="grid-column: 1 / -1; justify-content: center;">
              <span>${__('bogoTitle')}</span>
              <strong>${__('bogoText').replace('{buy}',buy).replace('{get}',get)}</strong>
            </div>`;
        }
      } else {
        const d2 = marketingData.volumeDiscount.disc2 || 5;
        const d3 = marketingData.volumeDiscount.disc3 || 10;
        const suffix = type === 'fixed' ? ` ${CURRENCY}` : '%';
        if (gridContainer) {
          gridContainer.innerHTML = `
            <div class="volume-item">
              <span>${__('buy2')}</span>
              <strong>${__('discountVal').replace('{val}',d2+suffix)}</strong>
            </div>
            <div class="volume-item">
              <span>${__('buy3plus')}</span>
              <strong>${__('discountVal').replace('{val}',d3+suffix)}</strong>
            </div>`;
        }
      }
    } else {
      volSection.style.display = 'none';
    }
  }
  // Customer Reviews
  const revSection = document.getElementById('reviewsSection');
  if (revSection) {
    if (marketingData.reviews?.show) {
      revSection.style.display = 'block';
      loadProductReviews(p.id);
    } else {
      revSection.style.display = 'none';
    }
  }
  // Frequently Bought Together (FBT)
  const fbtSection = document.getElementById('frequentlyBoughtSection');
  if (fbtSection) {
    let bundleIds = (p.fbtProductIds && p.fbtProductIds.length ? p.fbtProductIds : marketingData.fbt?.productIds || []).map(Number).filter(id => id && id !== p.id);
    let bundleProducts = bundleIds.map(id => products.find(pr => pr.id === id)).filter(Boolean);
    if (!bundleProducts.length && products.length > 1) {
      const pCats = getProductCats(p);
      let fallback = products.find(x => x.id !== p.id && getProductCats(x).some(c => pCats.includes(c)));
      if (!fallback) fallback = products.find(x => x.id !== p.id);
      if (fallback) bundleProducts = [fallback];
    }
    const fbtEnabled = p.fbtShow !== undefined ? p.fbtShow : (marketingData.fbt?.show !== false);
    if (bundleProducts.length && fbtEnabled) {
      fbtSection.style.display = 'block';
      let allItems = [p, ...bundleProducts].slice(0, 5);
      let totalOrig = 0;
      let anyOut = false;
const discVal = marketingData.fbt?.discount || 10;
       const discType = marketingData.fbt?.discountType || 'percent';
      const prodHtml = allItems.map((item, idx) => {
        const isOut = item.stock === 0;
        if (isOut) anyOut = true;
        totalOrig += item.price;
        const imgSrc = Array.isArray(item.images) ? item.images[0] : item.image || 'https://placehold.co/50x50/e2e8f0/64748b?text=N';
        return '<div style="text-align:center;width:70px;cursor:pointer" onclick="openDetail(' + item.id + ')">' +
          '<div style="position:relative;display:inline-block">' +
            '<img src="' + imgSrc + '" style="width:46px;height:46px;border-radius:8px;object-fit:contain;border:1px solid var(--border)' + (isOut ? ';opacity:.4' : '') + '">' +
            (isOut ? '<div class="fbt-out-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;border-radius:8px"><span style="color:#fff;font-size:.55rem;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.4)">نفذ</span></div>' : '') +
          '</div>' +
          '<p style="font-size:.55rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;color:var(--text)">' + item.name + '</p>' +
        '</div>';
      }).join('<span style="font-size:1rem;font-weight:800;color:var(--text-muted)">+</span>');
      
      let discountedSum = totalOrig;
      if (discType === 'fixed') {
        discountedSum = Math.max(0, totalOrig - discVal);
      } else {
        discountedSum = Math.round(totalOrig * (1 - (discVal / 100)));
      }
      fbtSection.innerHTML =
        '<h3 style="font-size:0.85rem;font-weight:800;margin-bottom:12px;color:var(--text)"><i class="fa-solid fa-layer-group"></i> ' + __('bundleTitle') + '</h3>' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">' + prodHtml + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px">' +
          '<button id="fbtBundleBtn" style="padding:7px 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-weight:700;font-size:.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit"' + (anyOut ? ' class="fbt-btn-disabled"' : '') + '>' +
            '<i class="fa-solid fa-cart-plus"></i> <span id="fbtBundleLabel">' + (anyOut ? '\u0646\u0641\u0630' : __('addBundle')) + '</span>' +
          '</button>' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<span id="fbtBundlePrice" style="font-size:.9rem;font-weight:900;color:var(--accent)">' + CURRENCY + discountedSum + '</span>' +
            '<span id="fbtOldBundlePrice" style="font-size:.7rem;text-decoration:line-through;color:var(--text-muted)">' + CURRENCY + totalOrig + '</span>' +
          '</div>' +
        '</div>';
      window._fbtBundleItems = allItems;
      window._fbtBundleTotal = totalOrig;
      const fbtBtn = document.getElementById('fbtBundleBtn');
      if (fbtBtn) {
        if (anyOut) { fbtBtn.classList.add('fbt-btn-disabled'); fbtBtn.onclick = function() { showToast(__('outOfStock'), 'error'); }; }
        else { fbtBtn.onclick = function() { addBundleToCart(); }; }
      }
    } else {
      fbtSection.style.display = 'none';
      window._fbtBundleItems = null;
    }
  }
  // Options / Variants
  const variantsEl = document.getElementById('variantSelector');
  // Reset selected options
  window._selOptions = {};
  if (p.options && p.options.length) {
    variantsEl.style.display = 'block';
    variantsEl.innerHTML = p.options.map(opt => {
      const isImg = opt.type === 'image';
      const btns = opt.values.map(v => {
        const swatch = opt.type==='color' ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${v.extra||'#ccc'};border:1px solid var(--border);vertical-align:middle;margin-left:4px"></span>` : isImg && v.extra ? `<img src="${v.extra}" style="width:52px;height:52px;border-radius:8px;object-fit:contain;border:1px solid var(--border);display:block;margin:0 auto 4px;">` : '';
        const priceLabel = '';
        const out = v.stock === 0 ? 'disabled' : '';
        if (isImg) {
          return `<button class="variant-btn" data-opt="${opt.name}" data-val="${v.value}" onclick="selectOption(this,'${opt.name}','${v.value}')" ${out} style="display:flex;flex-direction:column;align-items:center;padding:6px 8px;min-width:64px;">
            ${swatch}<span style="font-size:.7rem;font-weight:700;text-align:center;line-height:1.2;margin-top:2px;">${v.value}${v.stock===0?' (نفذ)':''}</span>
          </button>`;
        }
        return `<button class="variant-btn" data-opt="${opt.name}" data-val="${v.value}" onclick="selectOption(this,'${opt.name}','${v.value}')" ${out}>
          ${swatch} ${v.value}${priceLabel}${v.stock===0?' (نفذ)':''}
        </button>`;
      }).join('');
      return `<div class="option-group" style="margin-bottom:8px"><div style="font-size:.8rem;font-weight:700;margin-bottom:4px">${opt.name}</div><div style="display:flex;flex-wrap:wrap;gap:4px">${btns}</div></div>`;
    }).join('');
    // Do not pre-select options, let user choose freely
    updateOptionPrice(p);
    // Option images: use first option's image if avail
    const firstOptVal = p.options[0] && p.options[0].values[0];
    if (firstOptVal && firstOptVal.extra && (p.options[0].type==='image'||p.options[0].type==='color')) {
      document.getElementById('detailImage').src = firstOptVal.extra;
    } else {
      document.getElementById('detailImage').src = getProductImages(p)[0];
    }
    updateDetailThumbs(p);
    window._detailImgs = getProductImages(p);
    currentDetailImg = 0;
    startDetailSlideshow();
    currentVariant = null;
  } else if (p.variants && p.variants.length) {
    variantsEl.style.display = 'flex';
    variantsEl.innerHTML = p.variants.map((v, i) => {
      const varPrice = '';
      const disabled = v.stock === 0 ? 'disabled' : '';
      const label = (v.attrs || []).map(a => a.v).filter(Boolean).join(' - ');
      const swatchHtml = (v.attrs || []).map(a => {
        if (a.t === 'color') return `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${a.c||'#ccc'};border:1px solid var(--border);vertical-align:middle;margin-left:2px" title="${a.n}: ${a.v}"></span>`;
        if (a.t === 'image' && a.i) return `<img src="${a.i}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;border:1px solid var(--border);vertical-align:middle;margin-left:2px" title="${a.n}: ${a.v}">`;
        return '';
      }).join('');
      return `<button class="variant-btn ${i === 0 ? 'selected' : ''}" data-idx="${i}" onclick="selectVariant(${i}, this)" ${disabled}>
        ${swatchHtml} ${label}${varPrice}${v.stock === 0 ? ' (نفذ)' : ''}
      </button>`;
    }).join('');
    currentVariant = p.variants[0];
    const firstImg = p.variants[0].images && p.variants[0].images[0] ? p.variants[0].images[0] : getProductImages(p)[0];
    document.getElementById('detailImage').src = firstImg;
    updateDetailThumbs(p);
  } else {
    variantsEl.style.display = 'none';
    variantsEl.innerHTML = '';
    currentVariant = null;
    document.getElementById('detailImage').src = getProductImages(p)[0];
    updateDetailThumbs(p);
  }
  // Update price when options selected
  function updateOptionPrice(prod) {
    if (!prod.options) return;
    const totalExtra = prod.options.reduce((sum, opt) => {
      const sel = window._selOptions[opt.name];
      const val = opt.values.find(v => v.value === sel);
      let optValPrice = 0;
      if (val) {
        if (isWholesale) {
          optValPrice = parseFloat(val.wholesalePrice) > 0 ? parseFloat(val.wholesalePrice) : Math.round(val.price * (1 - ((adminSettings && adminSettings.wholesaleDiscount) || 15) / 100));
        } else {
          optValPrice = val.price;
        }
      }
      return sum + optValPrice;
    }, 0);
    const base = totalExtra > 0 ? totalExtra : wPrice(prod);
    const offerPrice = calcOfferPrice(prod);
    let finalBase = base;
    if (offerPrice !== null) {
      const o = getProductOffer(prod);
      if (o && totalExtra > 0) {
        if (o.type === 'percent') finalBase = Math.round(totalExtra * (1 - o.value / 100));
        else if (o.type === 'fixed') finalBase = Math.max(0, totalExtra - o.value);
      } else {
        finalBase = offerPrice;
      }
    }
    const total = finalBase;
    const opOffer = getProductOffer(prod);
    let html = `<span style="font-size:1.2rem">${CURRENCY}${total}${wBadge()}</span>`;
    if (offerPrice !== null) {
      html += `<span style="font-size:.85rem;text-decoration:line-through;color:var(--text-muted);margin-right:8px">${CURRENCY}${base}</span>`;
      html += `<span style="font-size:.65rem;font-weight:800;background:#f59e0b;color:#fff;padding:2px 8px;border-radius:999px;line-height:1;margin-right:4px;display:inline-block"><i class="fa-solid fa-gift"></i> ${opOffer.badge||opOffer.name}</span>`;
    } else if (prod.oldPrice) {
      html += `<span style="font-size:.85rem;text-decoration:line-through;color:var(--text-muted);margin-right:8px">${CURRENCY}${prod.oldPrice}</span>`;
      if (getProductDiscount(prod)) html += `<span class="discount-badge" style="position:static;display:inline-block;margin-right:6px;font-size:.7rem">-${getProductDiscount(prod)}%</span>`;
    }
    document.getElementById('detailPrice').innerHTML = html;
  }
  window.updateOptionPrice = updateOptionPrice;
  // Related products — also match any category
  const related = products.filter(x => getProductCats(x).some(c => getProductCats(p).includes(c)) && x.id !== p.id).slice(0, 6);
  const relSection = document.getElementById('relatedSection');
  if (related.length) {
    relSection.style.display = 'block';
    document.getElementById('relatedScroll').innerHTML = related.map(r => {
      const _out = r.stock !== undefined && r.stock <= 0;
      const _hasOpts = (r.options && r.options.length) || (r.variants && r.variants.length);
      return `<div class="mini-card" data-id="${r.id}" onclick="openDetail(${r.id})">
        <div class="feat-img"><img src="${getProductImages(r)[0]}" alt="${r.name}" loading="lazy"></div>
        ${_cardMiniNavHtml(r)}
        <div class="feat-body"><h4>${r.name}</h4><div class="feat-price">${CURRENCY}${wPrice(r)}${wBadge()}</div></div>
        <div class="feat-add" onclick="event.stopPropagation();${_out ? '' : 'quickAdd(' + r.id + ',this)'}" style="${_out ? 'opacity:.3;pointer-events:none' : ''}"><i class="fa-solid ${_hasOpts ? 'fa-plus' : 'fa-cart-shopping'}"></i> ${_out ? 'نفذ' : (_hasOpts ? 'خيارات' : __('quickAdd'))}</div>
      </div>`;
    }).join('');
  } else relSection.style.display = 'none';

  // Brand products section
  const brandSection = document.getElementById('brandSection');
  const brandScroll = document.getElementById('brandScroll');
  if (p.brand) {
    const brandProducts = products.filter(x => x.brand === p.brand && x.id !== p.id).slice(0, 6);
    if (brandProducts.length) {
      brandSection.style.display = 'block';
      document.getElementById('brandSectionTitle').textContent = `منتجات ${p.brand}`;
      brandScroll.innerHTML = brandProducts.map(r => {
        const _out = r.stock !== undefined && r.stock <= 0;
        const _hasOpts = (r.options && r.options.length) || (r.variants && r.variants.length);
        return `<div class="mini-card" data-id="${r.id}" onclick="openDetail(${r.id})">
          <div class="feat-img"><img src="${getProductImages(r)[0]}" alt="${r.name}" loading="lazy"></div>
          ${_cardMiniNavHtml(r)}
          <div class="feat-body"><h4>${r.name}</h4><div class="feat-price">${CURRENCY}${wPrice(r)}${wBadge()}</div></div>
          <div class="feat-add" onclick="event.stopPropagation();${_out ? '' : 'quickAdd(' + r.id + ',this)'}" style="${_out ? 'opacity:.3;pointer-events:none' : ''}"><i class="fa-solid ${_hasOpts ? 'fa-plus' : 'fa-cart-shopping'}"></i> ${_out ? 'نفذ' : (_hasOpts ? 'خيارات' : __('quickAdd'))}</div>
        </div>`;
      }).join('');
    } else brandSection.style.display = 'none';
  } else brandSection.style.display = 'none';
  showPage('detailPage');
  if (!fromRoute) location.hash = `#product/${id}`;
  startRelatedAutoScroll();
}

let _relatedAutoTimers = [];
function _getRelatedStep() {
  if (window.innerWidth <= 480) return 2;
  if (window.innerWidth <= 820) return 3;
  return 5;
}
function _getMaxScroll(vp, sc) {
  return Math.max(0, sc.scrollWidth - vp.clientWidth);
}
function startRelatedAutoScroll() {
  _relatedAutoTimers.forEach(t => clearInterval(t));
  _relatedAutoTimers = [];
  setTimeout(() => {
    document.querySelectorAll('.related-viewport').forEach(vp => {
      const sc = vp.querySelector('.related-scroll');
      if (!sc || sc.children.length <= 2) return;
      let dir = 1;
      let offset = 0;
      sc.style.transform = 'translateX(0)';
      const t = setInterval(() => {
        if (vp.matches(':hover')) return;
        const step = _getRelatedStep();
        const cardW = sc.children[0].offsetWidth + 12;
        const mx = _getMaxScroll(vp, sc);
        if (mx <= 0) return;
        offset += dir * step * cardW;
        if (offset >= mx) { offset = mx; dir = -1; }
        else if (offset <= 0) { offset = 0; dir = 1; }
        sc.style.transform = `translateX(${offset}px)`;
      }, 3000);
      _relatedAutoTimers.push(t);
    });
  }, 300);
}

function relScroll(btn, dir) {
  const section = btn.closest('.related-section');
  const vp = section.querySelector('.related-viewport');
  const sc = vp.querySelector('.related-scroll');
  const step = _getRelatedStep();
  const cardW = sc.children[0].offsetWidth + 12;
  const mx = _getMaxScroll(vp, sc);
  let cur = parseInt(sc.style.transform.replace(/[^0-9-]/g,'')) || 0;
  cur += dir * step * cardW;
  cur = Math.max(0, Math.min(cur, mx));
  sc.style.transform = `translateX(${cur}px)`;
}

function selectOption(btn, optName, val) {
  // If already selected and not required, deselect (toggle off)
  if (btn.classList.contains('selected') && !(currentProduct && currentProduct.optionsRequired)) {
    btn.classList.remove('selected');
    delete window._selOptions[optName];
    if (window.updateOptionPrice) window.updateOptionPrice(currentProduct);
    return;
  }
  document.querySelectorAll(`.variant-btn[data-opt="${optName}"]`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._selOptions[optName] = val;
  if (window.updateOptionPrice) window.updateOptionPrice(currentProduct);
}

function selectVariant(idx, el) {
  document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  currentVariant = currentProduct.variants[idx];
  if (currentVariant && currentVariant.images && currentVariant.images.length) {
    document.getElementById('detailImage').src = currentVariant.images[0];
  } else {
    document.getElementById('detailImage').src = getProductImages(currentProduct)[0];
  }
  updateDetailThumbs(currentProduct);
  currentDetailImg = 0;
}

function updateDetailThumbs(p) {
  const thumbs = document.getElementById('detailThumbs');
  let imgs;
  if (currentVariant && currentVariant.images && currentVariant.images.length) {
    imgs = currentVariant.images;
  } else {
    imgs = getProductImages(p);
  }
  
  const prevBtn = document.getElementById('prevDetailImgBtn');
  const nextBtn = document.getElementById('nextDetailImgBtn');
  if (prevBtn && nextBtn) {
    if (imgs && imgs.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }

  if (imgs && imgs.length > 1 && imgs[0]) {
    thumbs.style.display = 'flex';
    thumbs.innerHTML = imgs.map((img, i) =>
      `<img src="${img}" class="${i === 0 ? 'active' : ''}" onclick="switchDetailImg(${i}, this)" loading="lazy">`
    ).join('');
  } else {
    thumbs.style.display = 'none';
    thumbs.innerHTML = '';
  }
}

function changeDetailQty(delta) { detailQty = Math.max(1, detailQty + delta); document.getElementById('detailQty').textContent = detailQty; }

function switchDetailImg(idx, el) {
  stopDetailSlideshow();
  currentDetailImg = idx;
  let imgs;
  if (currentVariant && currentVariant.images && currentVariant.images.length) {
    imgs = currentVariant.images;
  } else {
    imgs = getProductImages(currentProduct);
  }
  if (imgs && imgs[idx]) {
    document.getElementById('detailImage').src = imgs[idx];
  } else if (imgs && imgs[0]) {
    document.getElementById('detailImage').src = imgs[0];
  }
  
  document.querySelectorAll('#detailThumbs img').forEach((thumb, i) => {
    if (i === idx) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

function navigateDetailImg(dir) {
  stopDetailSlideshow();
  let imgs;
  if (currentVariant && currentVariant.images && currentVariant.images.length) {
    imgs = currentVariant.images;
  } else {
    imgs = getProductImages(currentProduct);
  }
  if (!imgs || imgs.length <= 1) return;
  
  let newIdx = currentDetailImg + dir;
  if (newIdx < 0) {
    newIdx = imgs.length - 1;
  } else if (newIdx >= imgs.length) {
    newIdx = 0;
  }
  
  const thumbs = document.querySelectorAll('#detailThumbs img');
  switchDetailImg(newIdx, thumbs[newIdx]);
}

// ===== MULTI-STEP CHECKOUT =====

let currentCheckoutStep = 0; // 0 = cart items, 1 = step1 (info), 2 = step2 (delivery), 3 = step3 (review)

function setCartTabActive(tab) {
  document.querySelectorAll('.sheet-tabs button').forEach(b => b.classList.remove('active'));
  const buttons = document.querySelectorAll('.sheet-tabs button');
  const views = ['cartItems','cartCheckout','cartHistory'];
  document.querySelectorAll('.sheet-view').forEach(v => v.classList.remove('active'));

  if (tab === 'items') {
    buttons[0].classList.add('active');
    document.getElementById('cartItems').classList.add('active');
    document.getElementById('cartSheetTitle').textContent = __('myCart');
    updateFooterForStep(0);
  } else if (tab === 'checkout') {
    document.getElementById('cartCheckout').classList.add('active');
    updateFooterForStep(currentCheckoutStep);
  } else if (tab === 'history') {
    buttons[1].classList.add('active');
    document.getElementById('cartHistory').classList.add('active');
    document.getElementById('cartSheetTitle').textContent = __('ordersHistory');
    document.getElementById('cartSummary').style.display = 'none';
  }
}

function switchCartTab(tab, btn) {
  if (tab === 'items') {
    currentCheckoutStep = 0;
    setCartTabActive('items');
    renderCartItems();
  } else if (tab === 'history') {
    setCartTabActive('history');
    renderOrders();
  }
}

function updateFooterForStep(step) {
  const footer = document.getElementById('cartSummary');
  const navBtns = document.getElementById('checkoutNavBtns');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (step === 0) {
    // Cart items tab footer
    if (cart.length) {
      footer.style.display = 'block';
      navBtns.innerHTML = `<button class="checkout-btn" id="checkoutBtn" ${!cart.length ? 'disabled' : ''} onclick="goToCheckout()"><i class="fa-solid fa-arrow-left"></i> ${__('next')}</button>`;
    } else {
      footer.style.display = 'none';
    }
  } else if (step === 1) {
    footer.style.display = 'block';
    document.getElementById('cartSheetTitle').textContent = __('customerData');
    populateZones();
    navBtns.innerHTML = `
      <button class="back-btn" onclick="goCheckoutBack()"><i class="fa-solid fa-arrow-right"></i></button>
      <button class="checkout-btn" onclick="checkoutStep1Next()">${__('next')} <i class="fa-solid fa-arrow-left"></i></button>`;
  } else if (step === 2) {
    footer.style.display = 'block';
    document.getElementById('cartSheetTitle').textContent = __('paymentDelivery');
    renderStep2Summary();
    navBtns.innerHTML = `
      <button class="back-btn" onclick="goCheckoutBack()"><i class="fa-solid fa-arrow-right"></i></button>
      <button class="checkout-btn" onclick="checkout()" style="background:linear-gradient(135deg,#10b981,#059669)"><i class="fa-solid fa-check"></i> ${__('checkout')}</button>`;
  }
}

function renderStep2Summary() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = appliedDiscount > 0 ? Math.round(total * appliedDiscount / 100) : 0;
  const zoneEl = document.getElementById('custZone');
  const zoneName = zoneEl ? zoneEl.value : '';
  const zones = loadDeliveryZones();
  const zone = zones.find(z => z.name === zoneName);
  const delivery = zone ? zone.price : 0;
  const final = total - discount + delivery;
  document.getElementById('step2Subtotal').textContent = `${CURRENCY}${total.toFixed(2)}`;
  document.getElementById('step2Delivery').textContent = delivery > 0 ? `${CURRENCY}${delivery.toFixed(2)}` : `${CURRENCY}0.00`;
  document.getElementById('step2Total').textContent = `${CURRENCY}${final.toFixed(2)}`;
}

function updateStepIndicator(step) {
  for (let i = 1; i <= 2; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    const line = document.getElementById(`stepLine${i}`);
    if (el) el.classList.remove('active','done');
    if (line) line.classList.remove('done');
    if (i < step) { if (el) el.classList.add('done'); if (line) line.classList.add('done'); }
    else if (i === step) if (el) el.classList.add('active');
  }
}

function goToCheckout() {
  if (!cart.length) { showToast( __('emptyCart'), 'error'); return; }
  currentCheckoutStep = 1;
  setCartTabActive('checkout');
  document.querySelectorAll('.checkout-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('checkoutStep1').classList.add('active');
  updateStepIndicator(1);
  updateFooterForStep(1);
  loadCustomerForm();
  if (typeof playSound === 'function') playSound('wishlist');
}

function validatePhone() {
  const phone = document.getElementById('custPhone').value.trim();
  const hint = document.getElementById('phoneHint');
  const input = document.getElementById('custPhone');
  if (!hint || !input) return;
  if (phone.length === 0) {
    hint.style.display = 'none';
    input.style.borderColor = 'var(--border)';
  } else if (phone.length < 10) {
    hint.style.display = 'block';
    hint.textContent = 'يرجى إدخال 10 أرقام (مثلاً: 059xxxxxxx)';
    input.style.borderColor = '#ef4444';
  } else {
    hint.style.display = 'none';
    input.style.borderColor = '#10b981';
  }
}

function togglePhone2() {
  const wrap = document.getElementById('phone2Wrap');
  const icon = document.getElementById('addPhone2Icon');
  const btn = document.getElementById('addPhone2Btn');
  const isOpen = wrap.style.display !== 'none';
  if (isOpen) {
    wrap.style.display = 'none';
    icon.className = 'fa-solid fa-plus';
    btn.style.color = 'var(--accent)';
    // Clear second phone if hidden
    const p2 = document.getElementById('custPhone2');
    if (p2) { p2.value = ''; p2.style.borderColor = 'var(--border)'; }
    const h2 = document.getElementById('phoneHint2');
    if (h2) h2.style.display = 'none';
  } else {
    wrap.style.display = 'block';
    icon.className = 'fa-solid fa-xmark';
    btn.style.color = '#6b7280';
    setTimeout(() => document.getElementById('custPhone2').focus(), 100);
  }
}

function validatePhone2() {
  const phone = document.getElementById('custPhone2').value.trim();
  const hint = document.getElementById('phoneHint2');
  const input = document.getElementById('custPhone2');
  if (!hint || !input) return;
  if (phone.length === 0) {
    hint.style.display = 'none';
    input.style.borderColor = 'var(--border)';
  } else if (phone.length < 10) {
    hint.style.display = 'block';
    hint.textContent = 'يرجى إدخال 10 أرقام (مثلاً: 059xxxxxxx)';
    input.style.borderColor = '#ef4444';
  } else {
    hint.style.display = 'none';
    input.style.borderColor = '#10b981';
  }
}

function clearFieldError(hintId, inputId) {
  const hint = document.getElementById(hintId);
  if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
  const inp = document.getElementById(inputId);
  if (inp) inp.style.borderColor = 'var(--border)';
}

function checkoutStep1Next() {
  // Clear all previous errors
  ['custName','custPhone','custCity'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.style.borderColor = 'var(--border)';
  });
  ['nameHint','phoneHint','cityHint'].forEach(id => {
    const h = document.getElementById(id);
    if (h) { h.style.display = 'none'; h.textContent = ''; }
  });
  const h2 = document.getElementById('phoneHint2');
  if (h2) { h2.style.display = 'none'; h2.textContent = ''; }
  const p2 = document.getElementById('custPhone2');
  if (p2) p2.style.borderColor = 'var(--border)';

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const city = document.getElementById('custCity').value.trim();
  const hint = document.getElementById('phoneHint');
  const phoneInput = document.getElementById('custPhone');
  const phone2El = document.getElementById('custPhone2');
  const phone2 = phone2El ? phone2El.value.trim() : '';
  let valid = true;

  if (!name) {
    document.getElementById('nameHint').textContent = 'يرجى إدخال الاسم';
    document.getElementById('nameHint').style.display = 'block';
    document.getElementById('custName').style.borderColor = '#ef4444';
    valid = false;
  }
  if (!phone) {
    if (hint) { hint.textContent = 'يرجى إدخال رقم الموبايل'; hint.style.display = 'block'; }
    if (phoneInput) phoneInput.style.borderColor = '#ef4444';
    valid = false;
  } else if (phone.length !== 10) {
    if (hint) { hint.textContent = 'يرجى إدخال 10 أرقام (مثلاً: 059xxxxxxx)'; hint.style.display = 'block'; }
    if (phoneInput) phoneInput.style.borderColor = '#ef4444';
    valid = false;
  }
  if (phone2 && phone2.length !== 10) {
    const h2 = document.getElementById('phoneHint2');
    if (h2) { h2.textContent = 'يرجى إدخال 10 أرقام (مثلاً: 059xxxxxxx)'; h2.style.display = 'block'; }
    if (phone2El) phone2El.style.borderColor = '#ef4444';
    valid = false;
  }
  if (!city) {
    document.getElementById('cityHint').textContent = 'يرجى إدخال المدينة';
    document.getElementById('cityHint').style.display = 'block';
    document.getElementById('custCity').style.borderColor = '#ef4444';
    valid = false;
  }
  if (!valid) return;
  currentCheckoutStep = 2;
  document.querySelectorAll('.checkout-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('checkoutStep2').classList.add('active');
  updateStepIndicator(2);
  updateFooterForStep(2);
  if (typeof playSound === 'function') playSound('wishlist');
}

function goCheckoutBack() {
  if (typeof playSound === 'function') playSound('remove');
  if (currentCheckoutStep <= 1) {
    currentCheckoutStep = 0;
    setCartTabActive('items');
    renderCartItems();
    return;
  }
  currentCheckoutStep--;
  document.querySelectorAll('.checkout-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`checkoutStep${currentCheckoutStep}`).classList.add('active');
  updateStepIndicator(currentCheckoutStep);
  updateFooterForStep(currentCheckoutStep);
}

function goToDetails() { goToCheckout(); }

function checkout() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const city = document.getElementById('custCity').value.trim();
  if (!name || !phone || !city) { showToast('يرجى إكمال البيانات', 'error'); return; }
  if (!cart.length) { showToast( __('emptyCart'), 'error'); return; }
  const phone2El = document.getElementById('custPhone2');
  const phone2Wrap = document.getElementById('phone2Wrap');
  const phone2 = (phone2El && phone2Wrap && phone2Wrap.style.display !== 'none') ? phone2El.value.trim() : '';
  const zoneEl = document.getElementById('custZone');
  let zoneName = zoneEl ? zoneEl.value : '';
  const zones = loadDeliveryZones();
  let zone = zones.find(z => z.name === zoneName);
  // Auto-select first zone if none selected
  if (!zone && zones.length) {
    zoneEl.value = zones[0].name;
    zoneName = zones[0].name;
    zone = zones[0];
  }
  const delivery = zone ? zone.price : 0;
  const note = document.getElementById('cartNote') ? document.getElementById('cartNote').value.trim() : '';
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  const payment = paymentMethod ? paymentMethod.value : 'cod';
  customer = { name, phone, phone2, city, address: document.getElementById('custAddress').value.trim(), zone: zoneName };
  if (sharedLocation) customer.location = sharedLocation;
  try { localStorage.setItem('mycart_customer', JSON.stringify(customer)); } catch(e) {}
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = appliedDiscount > 0 ? Math.round(subtotal * appliedDiscount / 100) : 0;
  const total = subtotal - discount + delivery;
  const order = { id: Date.now(), date: new Date().toLocaleString('ar-SA'), items: [...cart], subtotal, discount, delivery, deliveryZone: zoneName, total, wholesale: isWholesale, customer: {...customer}, payment };
  if (note) order.note = note;
  if (appliedDiscount > 0) order.discountCode = document.getElementById('discountCode').value.trim().toUpperCase();
  try {
    const existingOrders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
    orders = existingOrders;
  } catch(e) {}
  orders.unshift(order);
  try { localStorage.setItem('mycart_orders', JSON.stringify(orders)); } catch(e) {}
  try {
    const currentPlan = localStorage.getItem('mycart_subscription_plan') || 'free';
    if (currentPlan === 'free') {
      const freeCnt = parseInt(localStorage.getItem('mycart_free_orders_count') || '0', 10);
      localStorage.setItem('mycart_free_orders_count', String(freeCnt + 1));
    }
  } catch(e) {}
  cart = [];
  appliedDiscount = 0;
  document.getElementById('discountCode').value = '';
  document.getElementById('discountMsg').textContent = '';
  document.getElementById('cartNote').value = '';
  saveCart();
  renderCartItems();
  updateCartBadge();
  playSound('checkout');
  // Pixel tracking: Purchase
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', { value: total, currency: CURRENCY, content_ids: order.items.map(i => i.sku || i.id), content_type: 'product' });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'purchase', { currency: CURRENCY, value: total, transaction_id: order.id, items: order.items.map(i => ({ id: i.sku || i.id, name: i.name, price: i.price, quantity: i.qty })) });
  }
  // Notify store owner via WhatsApp
  sendOwnerWhatsAppNotification(order);
  renderThankYouInCart(order);
}

// ===== THANK YOU INSIDE CART SHEET =====

function renderThankYouInCart(order) {
  document.getElementById('thankYouContent').innerHTML = `
    <div class="ty-confetti-container" id="tyConfettiContainer"></div>
    <div class="ty-checkout">
      <div class="ty-checkout-icon"><i class="fa-solid fa-check"></i></div>
      <h3 style="font-size:1.1rem">${__('orderPlaced')}</h3>
      <p style="font-size:.78rem;line-height:1.5;padding:0 8px">${__('orderPlacedDesc')}</p>
    </div>
    <div class="ty-info-card">
      <div class="ty-info-row"><span>${__('orderNumber')}</span><span dir="ltr" style="font-weight:700;font-size:.9rem">ORD-${String(order.id).slice(-6)}</span></div>
      <div class="ty-info-row"><span>${__('totalAmount')}</span><span style="font-weight:900;color:var(--accent);font-size:1rem">${CURRENCY}${order.total.toFixed(2)}</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
      <a href="https://wa.me/?text=${encodeURIComponent('📦 استفسار عن الطلب #ORD-' + String(order.id).slice(-6) + '\n\n👤 ' + order.customer.name + '\n📱 ' + order.customer.phone)}" target="_blank" style="width:100%;padding:13px;border:none;border-radius:12px;background:#25D366;color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none"><i class="fa-brands fa-whatsapp" style="font-size:1.15rem"></i> ${__('contactWa')}</a>
      <div style="display:flex;gap:8px">
        <button onclick="closeCartSheet()" style="flex:1;padding:13px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fa-solid fa-store"></i> ${__('backToShopping')}</button>
        <button onclick="closeCartSheet();setTimeout(function(){openCartSheet();switchCartTab('history')},300)" style="flex:1;padding:13px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fa-solid fa-box"></i> ${__('trackOrders')}</button>
      </div>
    </div>
  `;
  // Show thank you view, hide checkout view and footer
  document.querySelectorAll('.sheet-view').forEach(v => v.classList.remove('active'));
  document.getElementById('cartThankYou').classList.add('active');
  // Hide tabs & footer
  const tabs = document.querySelector('.sheet-tabs');
  if (tabs) tabs.style.display = 'none';
  const footer = document.getElementById('cartSummary');
  if (footer) footer.style.display = 'none';
  // Celebratory effects
  spawnTyConfetti();
  setTimeout(spawnTySparkles, 300);
}

function spawnTyConfetti() {
  const container = document.getElementById('tyConfettiContainer');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'ty-confetti-piece';
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 2 + Math.random() * 2;
    const size = 4 + Math.random() * 6;
    piece.style.cssText = 'left:' + left + '%;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';animation-duration:' + duration + 's;animation-delay:' + delay + 's';
    container.appendChild(piece);
  }
}

function spawnTySparkles() {
  const container = document.getElementById('thankYouContent');
  if (!container) return;
  const emojis = ['✨','🎉','🎊','💫','⭐','🌟'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'ty-sparkle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (10 + Math.random() * 50) + '%';
    el.style.animationDelay = (Math.random() * 1.5) + 's';
    container.appendChild(el);
    setTimeout(function(e) { e.remove(); }, 3000, el);
  }
}

// ===== CART UTILITY FUNCTIONS =====

function populateZones() {
  const sel = document.getElementById('custZone');
  const grid = document.getElementById('zoneCardsGrid');
  if (!sel) return;
  const zones = loadDeliveryZones();

  // Rebuild hidden select
  const current = sel.value;
  sel.innerHTML = '<option value="">اختر منطقة التوصيل</option>';
  zones.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.name;
    opt.textContent = `${z.name} — ${CURRENCY}${z.price}`;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;

  // Render cards
  if (!grid) return;
  if (!zones.length) {
    grid.innerHTML = `<div class="zone-no-zones"><i class="fa-solid fa-map-location-dot" style="font-size:1.4rem;display:block;margin-bottom:6px;opacity:.4"></i>${__('noZones')}</div>`;
    return;
  }
  // Auto-select first zone if none selected
  if (!zones.find(z => z.name === current) && zones.length) {
    sel.value = zones[0].name;
  }
  grid.innerHTML = zones.map(z => `
    <div class="zone-card ${sel.value === z.name ? 'selected' : ''}" onclick="selectZoneCard('${z.name}', this)">
      <div class="zone-card-icon"><i class="fa-solid fa-truck"></i></div>
      <div class="zone-card-name">${z.name}</div>
      ${z.price === 0
        ? '<div class="zone-card-free">مجاني <i class="fa-solid fa-gift"></i></div>'
        : `<div class="zone-card-price">${CURRENCY}${z.price}</div>`}
    </div>
  `).join('');
}

function selectZoneCard(zoneName, el) {
  // Update all cards
  document.querySelectorAll('.zone-card').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
  // Update hidden select
  const sel = document.getElementById('custZone');
  if (sel) {
    sel.value = zoneName;
    sel.dispatchEvent(new Event('change'));
  }
  renderCartItems();
  renderStep2Summary();
}

function toggleLocationShare() {
  const card = document.getElementById('locationToggleCard');
  const cb = document.getElementById('sendLocation');
  const statusEl = document.getElementById('locationStatus');
  const isActive = card.classList.contains('active');

  if (!isActive) {
    // Try to get location
    if (navigator.geolocation) {
      if (statusEl) statusEl.textContent = 'جاري تحديد موقعك...';
      navigator.geolocation.getCurrentPosition(
        pos => {
          card.classList.add('active');
          if (cb) cb.checked = true;
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          sharedLocation = `${lat}, ${lng}`;
          try { localStorage.setItem('mycart_share_location', sharedLocation); } catch(e) {}
          if (statusEl) statusEl.textContent = `${lat}, ${lng}`;
        },
        () => {
          if (statusEl) statusEl.textContent = 'تعذر الحصول على الموقع';
          card.classList.remove('active');
          if (cb) cb.checked = false;
        }
      );
    } else {
      if (statusEl) statusEl.textContent = 'المتصفح لا يدعم تحديد الموقع';
    }
  } else {
    card.classList.remove('active');
    if (cb) cb.checked = false;
    sharedLocation = '';
    try { localStorage.setItem('mycart_share_location', ''); } catch(e) {}
    if (statusEl) statusEl.textContent = 'اضغط لتحديد موقعك تلقائياً';
  }
}

function saveCart() {
  try { localStorage.setItem('mycart_cart', JSON.stringify(cart)); } catch(e) {}
  document.getElementById('cartCountTab').textContent = cart.reduce((a, b) => a + b.qty, 0);
  updateCartFloatBar();
}

function updateCartFloatBar() {
  var bar = document.getElementById('cartFloatBar');
  if (!bar) return;
  var totalQty = cart.reduce(function(a, b) { return a + b.qty; }, 0);
  if (totalQty === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  document.getElementById('cartFloatText').textContent = totalQty + ' منتج' + (totalQty > 1 ? 'ات' : '') + ' في سلتك';
  var total = cart.reduce(function(a, b) { return a + b.price * b.qty; }, 0);
  var discount = typeof appliedDiscount !== 'undefined' && appliedDiscount > 0 ? total * (appliedDiscount / 100) : 0;
  document.getElementById('cartFloatTotal').textContent = CURRENCY + (total - discount).toFixed(2);
}

function applyDiscountCode() {
  const code = document.getElementById('discountCode').value.trim().toUpperCase();
  const msg = document.getElementById('discountMsg');
  if (!code) { msg.textContent = ''; msg.style.color = ''; appliedDiscount = 0; renderCartItems(); return; }
  const stored = localStorage.getItem('mycart_discount_codes');
  let codes = [];
  if (stored) { try { codes = JSON.parse(stored); } catch(e) {} }
  const found = codes.find(c => c.code === code);
  if (found) {
    // Check usage limit
    if (found.limit && found.limit > 0 && (found.uses || 0) >= found.limit) {
      appliedDiscount = 0;
      msg.textContent = 'تم استنفاذ استخدامات هذا الكود';
      msg.style.color = '#ef4444';
      renderCartItems();
      return;
    }
    // Check min order
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (found.minOrder && subtotal < found.minOrder) {
      appliedDiscount = 0;
      msg.textContent = `الحد الأدنى للطلب لاستخدام هذا الكود هو ${CURRENCY}${found.minOrder}`;
      msg.style.color = '#ef4444';
      renderCartItems();
      return;
    }
    appliedDiscount = found.percent;
    msg.textContent = `تم تطبيق الخصم ${found.percent}%`;
    msg.style.color = '#16a34a';
    // Track usage
    found.uses = (found.uses || 0) + 1;
    try { localStorage.setItem('mycart_discount_codes', JSON.stringify(codes)); } catch(e) {}
    renderCartItems();
  } else {
    appliedDiscount = 0;
    msg.textContent = 'كود خصم غير صالح';
    msg.style.color = '#ef4444';
    renderCartItems();
  }
}

function renderOrders() {
  const list = document.getElementById('orderHistoryList');
  let visibleOrders = orders;
  let myPhone = '', myName = '';
  if (isWholesale) {
    let wi = {};
    try { wi = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
    myPhone = String(wi.phone || '').replace(/[^0-9]/g, '');
    myName = String(wi.name || '').trim();
  } else {
    let cu = {};
    try { cu = JSON.parse(localStorage.getItem('mycart_customer') || '{}'); } catch(e) {}
    myPhone = String(cu.phone || '').replace(/[^0-9]/g, '');
    myName = String(cu.name || '').trim();
  }
  if (myPhone || myName) {
    visibleOrders = orders.filter(o => {
      if (!o.customer) return false;
      const cp = String(o.customer.phone || '').replace(/[^0-9]/g, '');
      if (myPhone) return cp === myPhone;
      const cn = String(o.customer.name || '').trim();
      return myName && cn === myName;
    });
  } else {
    visibleOrders = [];
  }
  if (!visibleOrders.length) {
    list.innerHTML = `<div class="empty-state" style="text-align:center;padding:30px 10px;color:var(--text-muted)"><i class="fa-solid fa-receipt" style="font-size:2.5rem;margin-bottom:10px;color:var(--border)"></i><p style="font-weight:700">${__('noOrdersYet')}</p></div>`;
    return;
  }

  const ORDER_STATUS_MAP = {
    pending: { label: __('statusPending'), bg: '#fef3c7', text: '#92400e', icon: 'fa-box-open' },
    processing: { label: __('statusPending'), bg: '#dbeafe', text: '#1e40af', icon: 'fa-gears' },
    shipped: { label: __('statusShipped'), bg: '#ede9fe', text: '#5b21b6', icon: 'fa-truck-fast' },
    completed: { label: __('statusCompleted'), bg: '#dcfce7', text: '#166534', icon: 'fa-circle-check' },
    done: { label: __('statusCompleted'), bg: '#dcfce7', text: '#166534', icon: 'fa-circle-check' },
    returned: { label: __('statusReturned'), bg: '#fee2e2', text: '#991b1b', icon: 'fa-rotate-left' },
    cancelled: { label: __('statusCancelled'), bg: '#f1f5f9', text: '#334155', icon: 'fa-ban' }
  };

  const sortedOrders = visibleOrders.slice().sort((a, b) => (b.id || 0) - (a.id || 0));

  const ORDERS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedOrders.length / ORDERS_PER_PAGE);
  if (!window._ordersHistoryPage) window._ordersHistoryPage = 1;
  if (window._ordersHistoryPage > totalPages) window._ordersHistoryPage = totalPages || 1;
  const startIdx = (window._ordersHistoryPage - 1) * ORDERS_PER_PAGE;
  const pageOrders = sortedOrders.slice(startIdx, startIdx + ORDERS_PER_PAGE);

  let paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:16px 0 8px;flex-wrap:wrap">';
    paginationHtml += `<button onclick="window._ordersHistoryPage=1;renderOrders()" ${window._ordersHistoryPage===1?'disabled':''} style="background:${window._ordersHistoryPage===1?'#f1f5f9':'var(--accent)'};color:${window._ordersHistoryPage===1?'#94a3b8':'#fff'};border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:${window._ordersHistoryPage===1?'default':'pointer'};font-family:inherit" title="الأولى"><i class="fa-solid fa-angles-right"></i></button>`;
    paginationHtml += `<button onclick="window._ordersHistoryPage=Math.max(1,window._ordersHistoryPage-1);renderOrders()" ${window._ordersHistoryPage===1?'disabled':''} style="background:${window._ordersHistoryPage===1?'#f1f5f9':'var(--accent)'};color:${window._ordersHistoryPage===1?'#94a3b8':'#fff'};border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:${window._ordersHistoryPage===1?'default':'pointer'};font-family:inherit;display:inline-flex;align-items:center;gap:4px"><i class="fa-solid fa-chevron-right"></i> السابق</button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7 && p > 3 && p < totalPages - 1 && Math.abs(p - window._ordersHistoryPage) > 1) {
        if (p === 4 || p === totalPages - 2) paginationHtml += '<span style="color:#94a3b8;font-size:.8rem">...</span>';
        continue;
      }
      paginationHtml += `<button onclick="window._ordersHistoryPage=${p};renderOrders()" style="background:${p===window._ordersHistoryPage?'var(--accent)':'#f1f5f9'};color:${p===window._ordersHistoryPage?'#fff':'#475569'};border:none;width:34px;height:34px;border-radius:8px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">${p}</button>`;
    }
    paginationHtml += `<button onclick="window._ordersHistoryPage=Math.min(${totalPages},window._ordersHistoryPage+1);renderOrders()" ${window._ordersHistoryPage===totalPages?'disabled':''} style="background:${window._ordersHistoryPage===totalPages?'#f1f5f9':'var(--accent)'};color:${window._ordersHistoryPage===totalPages?'#94a3b8':'#fff'};border:none;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:${window._ordersHistoryPage===totalPages?'default':'pointer'};font-family:inherit;display:inline-flex;align-items:center;gap:4px">التالي <i class="fa-solid fa-chevron-left"></i></button>`;
    paginationHtml += `<button onclick="window._ordersHistoryPage=${totalPages};renderOrders()" ${window._ordersHistoryPage===totalPages?'disabled':''} style="background:${window._ordersHistoryPage===totalPages?'#f1f5f9':'var(--accent)'};color:${window._ordersHistoryPage===totalPages?'#94a3b8':'#fff'};border:none;padding:6px 8px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:${window._ordersHistoryPage===totalPages?'default':'pointer'};font-family:inherit" title="الأخيرة"><i class="fa-solid fa-angles-left"></i></button>`;
    paginationHtml += '</div>';
    paginationHtml += `<div style="text-align:center;font-size:.72rem;color:var(--text-muted);margin-bottom:12px">صفحة ${window._ordersHistoryPage} من ${totalPages} — إجمالي ${sortedOrders.length} عنصر</div>`;
  }

  list.innerHTML = pageOrders.map(o => {
    const rawSt = o._status || o.status || 'pending';
    const stInfo = ORDER_STATUS_MAP[rawSt] || ORDER_STATUS_MAP.pending;
    const itemsCount = o.items ? o.items.reduce((s, i) => s + i.qty, 0) : 0;
    const isWOrder = isWholesaleOrder(o);

    return `
    <div class="order-card-customer" onclick="showOrderDetail(${o.id})" style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:12px 14px;margin-bottom:12px;cursor:pointer;position:relative;transition:all .2s ease;box-shadow:0 2px 8px rgba(0,0,0,.03)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--border)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="background:var(--accent);color:#fff;padding:3px 9px;border-radius:6px;font-weight:900;font-size:.78rem">#${String(o.id).slice(-6)}</span>
          <span style="font-size:.75rem;color:var(--text-muted);font-weight:600"><i class="fa-regular fa-calendar" style="margin-left:2px"></i> ${o.date || ''}</span>
        </div>
        <span style="background:${stInfo.bg};color:${stInfo.text};padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:800;display:inline-flex;align-items:center;gap:4px">
          <i class="fa-solid ${stInfo.icon}"></i> ${stInfo.label}
        </span>
      </div>

      <div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        <i class="fa-solid fa-box-open" style="color:var(--accent);margin-left:4px"></i> ${o.items.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty}`).join(' | ')}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px">
        <div style="font-size:.74rem;color:var(--text-muted);font-weight:600">عدد المنتجات: <strong style="color:var(--text)">${itemsCount}</strong></div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:1rem;font-weight:900;color:var(--accent)">${CURRENCY}${o.total.toFixed(2)}</span>${isWOrder ? wBadge() : ''}
          ${o.discount ? `<span style="font-size:.65rem;color:#16a34a;background:#dcfce7;padding:1px 6px;border-radius:4px;font-weight:800">(-${o.discount}%)</span>` : ''}
          <i class="fa-solid fa-chevron-left" style="font-size:.75rem;color:var(--text-muted);margin-right:4px"></i>
        </div>
      </div>
    </div>`;
  }).join('') + paginationHtml;
}

function showOrderDetail(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const list = document.getElementById('orderHistoryList');
  if (!list) return;
  
  const currency = CURRENCY;
  const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = o.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (o.delivery || 0);

  list.innerHTML = `
    <div style="margin-bottom:12px">
      <button onclick="renderOrders()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.82rem;font-family:inherit;display:flex;align-items:center;gap:6px;font-weight:700"><i class="fa-solid fa-arrow-right"></i> ${__('backToOrders')}</button>
    </div>

    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        <span style="background:var(--accent);color:#fff;padding:3px 10px;border-radius:6px;font-weight:900;font-size:.85rem">#${String(o.id).slice(-6)}</span>
        <span style="color:var(--text-muted);font-size:.78rem"><i class="fa-regular fa-calendar"></i> ${o.date}</span>
      </div>

      <div style="font-size:.8rem;font-weight:800;color:var(--text);margin-bottom:8px"><i class="fa-solid fa-box-open" style="color:var(--accent)"></i> ${__('orderedProducts')}:</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        ${o.items.map(item => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--card);border-radius:8px;border:1px solid var(--border)">
            <img src="${item.image || 'https://placehold.co/40x40/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}${item.variant ? ` (${item.variant})` : ''}</div>
              <div style="font-size:.72rem;color:var(--text-muted)">${currency}${item.price} × ${item.qty}</div>
            </div>
            <div style="font-weight:800;font-size:.85rem;color:var(--accent);flex-shrink:0">${currency}${(item.price * item.qty).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <div style="background:var(--card);border-radius:8px;padding:10px;font-size:.8rem;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;padding:2px 0"><span>${__('subtotal')}:</span><strong>${currency}${subtotal.toFixed(2)}</strong></div>
        ${disc > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0;color:#16a34a"><span>${__('discount')} (${disc}%):</span><strong>-${currency}${discAmt.toFixed(2)}</strong></div>` : ''}
        ${o.delivery ? `<div style="display:flex;justify-content:space-between;padding:2px 0"><span>${__('delivery')}:</span><strong>${currency}${o.delivery.toFixed(2)}</strong></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:900;padding-top:6px;border-top:1px solid var(--border);margin-top:4px;color:var(--accent)">
          <span>${__('total')}:</span>
          <span>${currency}${total.toFixed(2)}</span>${isWholesaleOrder(o) ? wBadge() : ''}
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-top:12px">
        <button onclick="printOrderData(orders.find(x => x.id === ${o.id}), CURRENCY)" style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-solid fa-print"></i> ${__('printInvoice')}</button>
        <button onclick="inquiryOrder(${o.id})" style="flex:1;padding:8px;border:none;border-radius:8px;background:#25D366;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-brands fa-whatsapp"></i> ${__('waInquiry')}</button>
      </div>
    </div>
  `;
}

function renderOrderPage(id) {
  const o = orders.find(x => x.id === id);
  if (!o) { location.hash = '#home'; return; }
  document.getElementById('orderPageTitle').textContent = `${__('order')} #${String(o.id).slice(-6)}`;
  document.getElementById('orderPageBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      <span style="background:#ef4444;color:#fff;padding:4px 12px;border-radius:6px;font-weight:800;font-size:.9rem">#${String(o.id).slice(-6)}</span>
      <span style="color:var(--text-muted);font-size:.85rem"><i class="fa-regular fa-calendar"></i> ${o.date}</span>
      <span style="margin-right:auto;padding:4px 12px;border-radius:999px;font-size:.75rem;font-weight:700;background:${o._status === 'done' ? '#dcfce7' : '#fef3c7'};color:${o._status === 'done' ? '#166534' : '#92400e'}">${o._status === 'done' ? __('statusCompleted') : __('newOrder')}</span>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:16px">
      <h4 style="font-size:.85rem;font-weight:700;margin-bottom:10px"><i class="fa-solid fa-user"></i> ${__('customerInfo')}</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.85rem" class="order-meta-grid">
        <div><span style="color:var(--text-muted)">${__('name')}</span><br><strong id="opName" style="word-break:break-word">${o.customer?.name || '—'}</strong> ${o.customer?.name ? `<button onclick="copyText(document.getElementById('opName').textContent,'${__('name')}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem;margin-right:4px"><i class="fa-regular fa-copy"></i></button>` : ''}</div>
        <div><span style="color:var(--text-muted)">${__('phone')}</span><br><strong dir="ltr" style="display:inline-block;word-break:break-word" id="opPhone">${o.customer?.phone || '—'}</strong> ${o.customer?.phone ? `<button onclick="copyText(document.getElementById('opPhone').textContent,'${__('phone')}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem"><i class="fa-regular fa-copy"></i></button>` : ''}</div>
        <div><span style="color:var(--text-muted)">${__('city')}</span><br><strong id="opCity" style="word-break:break-word">${o.customer?.city || '—'}</strong> ${o.customer?.city ? `<button onclick="copyText(document.getElementById('opCity').textContent,'${__('city')}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem"><i class="fa-regular fa-copy"></i></button>` : ''}</div>
        <div><span style="color:var(--text-muted)">${__('address')}</span><br><strong id="opAddr" style="word-break:break-word">${o.customer?.address || '—'}</strong> ${o.customer?.address ? `<button onclick="copyText(document.getElementById('opAddr').textContent,'${__('address')}')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem"><i class="fa-regular fa-copy"></i></button>` : ''}</div>
        ${o.deliveryZone ? `<div><span style="color:var(--text-muted)">${__('deliveryZone')}</span><br><strong style="word-break:break-word">${o.deliveryZone}</strong></div>` : ''}
        ${o.customer?.location ? `<div><span style="color:var(--text-muted)">${__('shareLocation')}</span><br><strong dir="ltr" style="display:inline-block;word-break:break-all">${o.customer.location}</strong> <a href="https://www.google.com/maps?q=${encodeURIComponent(o.customer.location)}" target="_blank" style="color:var(--accent);font-size:.75rem"><i class="fa-solid fa-map-location-dot"></i> ${__('viewMap')}</a></div>` : ''}
      </div>
      ${o.note ? `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)"><span style="color:var(--text-muted);font-size:.8rem">${__('customerNote')}</span><p style="font-size:.85rem;font-weight:600;margin-top:4px">${o.note}</p></div>` : ''}
    </div>
    <h4 style="font-size:.85rem;font-weight:700;margin-bottom:10px"><i class="fa-solid fa-box"></i> ${__('products')}</h4>
    <div style="margin-bottom:16px">
      ${o.items.map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:8px;margin-bottom:4px">
          <img src="${item.image || 'https://placehold.co/40x40/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#e2e8f0">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:.85rem">${item.name}${item.variant ? ` <span style="font-weight:400;color:var(--text-muted);font-size:.75rem">${variantSwatchHtml(item.variantData)}${item.variant}</span>` : ''}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">${CURRENCY}${item.price} × ${item.qty}</div>
          </div>
          <div style="font-weight:800;font-size:.9rem;color:var(--accent);flex-shrink:0">${CURRENCY}${(item.price * item.qty).toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span>${__('subtotal')}</span><span>${CURRENCY}${o.subtotal?.toFixed(2) || ''}</span></div>
      ${o.discount ? `<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0;color:#16a34a"><span>${__('discount')} (${o.discount}%)</span><span>-${CURRENCY}${((o.subtotal || 0) - (o.total - (o.delivery || 0))).toFixed(2)}</span></div>` : ''}
      ${o.delivery ? `<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:3px 0"><span>${__('delivery')} ${o.deliveryZone ? `(${o.deliveryZone})` : ''}</span><span>${CURRENCY}${o.delivery.toFixed(2)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;padding:6px 0 0;border-top:1px solid var(--border);margin-top:4px;color:var(--accent)"><span>${__('total')}</span><span>${CURRENCY}${(o.total || 0).toFixed(2)}</span></div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="printOrderData(orders.find(x => x.id === ${o.id}), CURRENCY)" style="flex:1;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:.9rem;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fa-solid fa-print"></i> ${__('print')}</button>
      <button onclick="inquiryOrder(${o.id})" style="flex:1;padding:12px;border:none;border-radius:10px;background:#25D366;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:.9rem;display:flex;align-items:center;justify-content:center;gap:8px"><i class="fa-brands fa-whatsapp" style="font-size:1.1rem"></i> ${__('inquiry')}</button>
    </div>
  `;
  showPage('orderPage');
}

function inquiryOrder(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const msg = encodeURIComponent(`📦 استفسار عن الطلب #${String(o.id).slice(-6)}\n\n👤 ${o.customer.name}\n📱 ${o.customer.phone}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function wholesaleOf(p) {
  if (!p) return 0;
  const wp = parseFloat(p.wholesalePrice);
  if (wp > 0) return wp;
  const disc = (adminSettings && adminSettings.wholesaleDiscount) || 15;
  return Math.round(p.price * (1 - disc / 100));
}

function wPrice(p) {
  if (isWholesale) return wholesaleOf(p);
  return p ? p.price : 0;
}

function wBadge() {
  return isWholesale ? ' <span style="direction:rtl;unicode-bidi:embed;font-size:.62rem;font-weight:800;background:#f59e0b;color:#fff;padding:2px 6px;border-radius:6px;vertical-align:middle;letter-spacing:0">جملة</span>' : '';
}

function isWholesaleOrder(o) {
  if (!o) return false;
  if (o.wholesale === true) return true;
  if (!isWholesale) return false;
  let _wi = {};
  try { _wi = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
  const wp = String(_wi.phone || '').replace(/[^0-9]/g, '');
  return !!wp && String((o.customer && o.customer.phone) || '').replace(/[^0-9]/g, '') === wp;
}

function applyWholesale() {
  renderProducts(getFilteredProducts());
  if (typeof initFlashSales === 'function') initFlashSales();
  if (typeof renderWishlist === 'function') renderWishlist();
  if (typeof renderOrders === 'function') renderOrders();
  if (currentProduct) {
    const p = products.find(x => x.id === currentProduct.id);
    if (p) document.getElementById('detailPrice').innerHTML = `<span>${CURRENCY}${wholesaleOf(p)}${wBadge()}</span>`;
  }
  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (p) item.price = wholesaleOf(p);
  });
  saveCart();
  renderCartItems();
}

// Use event delegation for sendLocation since it's inside a dynamically shown panel

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'sendLocation') {
    if (e.target.checked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { const el = document.getElementById('locationStatus'); const v = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`; sharedLocation = v; if(el) el.textContent = v; try{localStorage.setItem('mycart_share_location', v);}catch(e){} },
        () => { const el = document.getElementById('locationStatus'); if(el) el.textContent = 'تعذر الحصول على الموقع'; }
      );
    } else { const el = document.getElementById('locationStatus'); if(el) el.textContent = ''; sharedLocation = ''; try{localStorage.setItem('mycart_share_location', '');}catch(e){} }
  }
});

function closeModal() { document.getElementById('backdropModal').classList.remove('show'); }

function openImageViewer(src) { document.getElementById('viewerImage').src = src; document.getElementById('image-viewer').classList.add('show'); }

function closeImageViewer() { document.getElementById('image-viewer').classList.remove('show'); }

function showPage(pageId) {
  if (pageId !== 'detailPage') {
    if (typeof stopDetailSlideshow === 'function') stopDetailSlideshow();
    _relatedAutoTimers.forEach(t => clearInterval(t));
    _relatedAutoTimers = [];
  }
  window.scrollTo(0, 0);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (pageId === 'homePage') {
    const firstNav = document.querySelector('.nav-item');
    if (firstNav) firstNav.classList.add('active');
  } else if (pageId === 'categoriesPage') {
    const catNav = document.querySelector('.nav-item[onclick*="#categories"]');
    if (catNav) catNav.classList.add('active');
  }
  if (typeof updateHeaderShrink === 'function') updateHeaderShrink();
}

function goHome() {
  cleanHomeHash();
  showPage('homePage');
  if (currentCat !== 'الكل' || currentBrand) filterCategory('الكل', false);
  document.body.classList.remove('section-filter-active');
  _sectionFilter = '';
  setTimeout(startFeatAutoScroll, 300);
}

function handleRoute() {
  const hash = location.hash;
  const params = new URLSearchParams(location.search);
  const urlSection = params.get('section');
  if (hash.startsWith('#product/')) {
    const id = parseInt(hash.split('/')[1]);
    if (id) { stopFeatAutoScroll(); openDetail(id, true); }
  } else if (hash.startsWith('#order/')) {
    const id = parseInt(hash.split('/')[1]);
    if (id) { stopFeatAutoScroll(); renderOrderPage(id); }
  } else if (hash === '#categories') {
    stopLiveViewersTicker();
    showPage('categoriesPage');
    renderCategoriesPage();
  } else if (hash === '#categories') {
    stopLiveViewersTicker();
    showPage('categoriesPage');
    renderCategoriesPage();
    switchCategoryTab('categories');
  } else if (hash.startsWith('#category/')) {
    const catName = decodeURIComponent(hash.split('/')[1]);
    if (catName) {
      stopLiveViewersTicker();
      showPage('homePage');
      filterCategory(catName, false);
    }
  } else if (hash.startsWith('#brand/')) {
    const brandName = decodeURIComponent(hash.split('/')[1]);
    if (brandName) {
      stopLiveViewersTicker();
      showPage('homePage');
      filterBrand(brandName, false);
    }
  } else if (urlSection) {
    stopLiveViewersTicker();
    showPage('homePage');
    _sectionFilter = urlSection;
    document.body.classList.add('section-filter-active');
    filterCategory('الكل', false);
  } else {
    stopLiveViewersTicker(); // hide counter when leaving detail
    showPage('homePage');
    if (_sectionFilter) {
      document.body.classList.add('section-filter-active');
    }
    if (currentCat !== 'الكل' || currentBrand) {
      filterCategory('الكل', false);
    }
    cleanHomeHash();
    setTimeout(startFeatAutoScroll, 300);
  }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('popstate', function() {
  const params = new URLSearchParams(location.search);
  const section = params.get('section');
  if (section) {
    _sectionFilter = section;
    document.body.classList.add('section-filter-active');
    filterCategory('الكل', false);
  } else if (_sectionFilter) {
    clearSectionFilter();
  }
});

function showLogin() {
  // If already admin logged in, open admin panel directly
  if (localStorage.getItem('mycart_admin_logged') === 'true') {
    openAdmin();
    return;
  }
  const joinF = document.getElementById('joinForm');
  if (joinF) joinF.style.display = 'none';
  const aca = document.getElementById('adminCodeArea');
  if (aca) aca.style.display = 'block';
  document.getElementById('login-overlay').classList.add('show');
  document.getElementById('loginCode').value = '';
  document.getElementById('loginError').style.display = 'none';
}

function closeLogin() { document.getElementById('login-overlay').classList.remove('show'); }

function refreshLoginNavItem() {
  const loginItem = document.getElementById('loginNavItem');
  if (!loginItem) return;
  if (localStorage.getItem('mycart_admin_logged') === 'true') {
    loginItem.innerHTML = '<i class="fa-solid fa-sliders"></i><span>لوحة تحكم</span>';
    loginItem.onclick = function() { openAdmin(); };
  } else if (localStorage.getItem('mycart_wholesale') === 'true') {
    loginItem.innerHTML = '<i class="fa-solid fa-crown" style="color:#f59e0b"></i><span>معلوماتي</span>';
    loginItem.onclick = function() { showTraderInfo(); };
  } else {
    loginItem.innerHTML = '<i class="fa-solid fa-user"></i><span>' + __('login') + '</span>';
    loginItem.onclick = function() { showLogin(); };
  }
}

function showTraderInfo() {
  openCartSheet();
  document.querySelectorAll('.sheet-tabs button').forEach(b => b.classList.remove('active'));
  const tabs = document.querySelectorAll('.sheet-tabs button');
  if (tabs[2]) tabs[2].classList.add('active');
  document.querySelectorAll('.sheet-view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('cartTraderInfo');
  if (view) view.classList.add('active');
  document.getElementById('cartSheetTitle').textContent = 'معلوماتي';
  const footer = document.getElementById('cartSummary');
  if (footer) footer.style.display = 'none';
  renderTraderInfoView();
}

function renderTraderInfoView() {
  const view = document.getElementById('cartTraderInfo');
  if (!view) return;
  let info = {};
  try { info = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
  let d = info.date ? new Date(info.date) : null;
  var dateStr = d && !isNaN(d) ? d.toLocaleDateString('ar') : '';
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]'); } catch(e) {}
  var myPhone = String(info.phone || '').trim();
  var myName = String(info.name || '').trim();
  var orderCount = orders.filter(function(o) {
    if (!o.customer) return false;
    var cp = String(o.customer.phone || '').replace(/[^0-9]/g, '');
    var myP = myPhone.replace(/[^0-9]/g, '');
    if (myP) return cp === myP;
    var cn = String(o.customer.name || '').trim();
    return myName && cn === myName;
  }).length;
  var row = function(label, val) {
    if (val === undefined || val === null || val === '') return '';
    return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:.82rem"><span style="color:var(--text-muted);font-weight:700;flex-shrink:0">' + label + '</span><span style="font-weight:700;text-align:left;word-break:break-word">' + val + '</span></div>';
  };
  view.innerHTML =
    '<div style="padding:16px">' +
      '<div style="text-align:center;padding:14px 0 16px;background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:12px">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:rgba(245,158,11,.15);color:#f59e0b;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:1.6rem"><i class="fa-solid fa-crown"></i></div>' +
        '<div style="font-weight:800;font-size:1.05rem">' + (info.name || 'تاجر جملة') + '</div>' +
        '<div style="font-size:.75rem;color:#f59e0b;font-weight:700;margin-top:2px"><i class="fa-solid fa-tags"></i> تاجر جملة</div>' +
      '</div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:2px 14px;margin-bottom:12px">' +
        row('الاسم', info.name) +
        row('الهاتف', info.phone ? '<a href="tel:' + info.phone + '" style="color:#10b981;text-decoration:none;direction:ltr;display:inline-block"><i class="fa-solid fa-phone"></i> ' + info.phone + '</a>' : '') +
        row('عدد الطلبات', orderCount + ' <button onclick="showTraderOrders()" style="padding:4px 10px;border:1px solid rgba(59,130,246,.4);border-radius:8px;background:rgba(59,130,246,.08);color:#3b82f6;font-weight:700;cursor:pointer;font-family:inherit;font-size:.72rem"><i class="fa-solid fa-receipt"></i> عرض السجل</button>') +
        row('كود الدخول', info.code ? '<button onclick="openTraderCodePopup()" style="padding:5px 12px;border:1px solid rgba(16,185,129,.4);border-radius:8px;background:rgba(16,185,129,.08);color:#10b981;font-weight:700;cursor:pointer;font-family:inherit;font-size:.72rem"><i class="fa-solid fa-eye"></i> إظهار كود الدخول</button>' : '') +
        row('المدينة', info.city) +
        row('العنوان', info.addr) +
        row('ملاحظة', info.note) +
        row('تاريخ الانضمام', dateStr) +
      '</div>' +
      '<button onclick="logoutWholesale()" style="width:100%;padding:12px;border:none;border-radius:12px;background:#fef2f2;color:#ef4444;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem"><i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج</button>' +
    '</div>';
}

function openTraderCodePopup() {
  let info = {};
  try { info = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
  document.getElementById('modalTitle').textContent = 'كود الدخول';
  document.getElementById('modalBody').innerHTML =
    '<div style="text-align:center">' +
      '<p style="font-size:.8rem;color:var(--text-muted,#64748b);margin:0 0 12px">أدخل كلمة كشف الكود لإظهار كود الدخول</p>' +
      '<input type="password" id="traderRevealPopupInput" placeholder="كلمة كشف الكود" style="width:100%;padding:12px;border:1.5px solid var(--border,#e2e8f0);border-radius:12px;font-family:inherit;font-size:.9rem;text-align:center;margin-bottom:10px;box-sizing:border-box">' +
      '<button onclick="verifyTraderReveal()" style="width:100%;padding:12px;border:none;border-radius:12px;background:#10b981;color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem"><i class="fa-solid fa-eye"></i> إظهار كود الدخول</button>' +
    '</div>';
  document.getElementById('backdropModal').classList.add('show');
}

function verifyTraderReveal() {
  let info = {};
  try { info = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
  const input = document.getElementById('traderRevealPopupInput');
  const word = input ? input.value.trim() : '';
  if (!info.reveal || word.toLowerCase() !== String(info.reveal).toLowerCase()) {
    showToast('كلمة كشف الكود غير صحيحة', 'error');
    return;
  }
  document.getElementById('modalBody').innerHTML =
    '<div style="text-align:center;padding:6px 0">' +
      '<div style="font-size:.75rem;color:var(--text-muted,#64748b);margin-bottom:10px">كود دخول التاجر</div>' +
      '<div style="direction:ltr;font-size:1.7rem;font-weight:900;color:#10b981;letter-spacing:5px;margin-bottom:14px">' + (info.code || '') + '</div>' +
      '<button onclick="copyTraderCode()" style="width:100%;padding:12px;border:none;border-radius:12px;background:#10b981;color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem"><i class="fa-solid fa-copy"></i> نسخ الكود</button>' +
    '</div>';
}

function copyTraderCode() {
  let info = {};
  try { info = JSON.parse(localStorage.getItem('mycart_wholesale_info') || '{}'); } catch(e) {}
  if (!info.code) return;
  try {
    navigator.clipboard.writeText(info.code);
    showToast('تم نسخ كود الدخول', 'success');
  } catch(e) { showToast('كود الدخول: ' + info.code, 'info'); }
}

function showTraderOrders() {
  switchCartTab('history');
}

function logoutWholesale() {
  isWholesale = false;
  localStorage.removeItem('mycart_wholesale');
  localStorage.removeItem('mycart_wholesale_info');
  document.getElementById('wholesaleBadge').style.display = 'none';
  applyWholesale();
  closeCartSheet();
  refreshLoginNavItem();
  showToast('تم تسجيل الخروج', 'info');
}

function submitLogin() {
  const code = document.getElementById('loginCode').value.trim();
  if (!code) { document.getElementById('loginError').style.display = 'block'; return; }

  // First, check the admin panel code (verified server-side for security).
  // This is async; we show a small loading state if available.
  var loginBtn = document.querySelector('.login-btn');
  var prevText = loginBtn ? loginBtn.textContent : '';
  if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = '...'; }

  verifyAdminCode(code).then(function (isAdmin) {
    if (isAdmin) {
      closeLogin();
      openAdmin();
      return;
    }

    // Otherwise fall through to wholesale trader code check.
    let reqs = [];
    try { reqs = JSON.parse(localStorage.getItem('mycart_join_requests') || '[]'); } catch(e) {}
    const approved = reqs.find(function(r) { return r.status === 'approved' && r.code && String(r.code).toLowerCase() === code.toLowerCase(); });
    if (approved) {
      isWholesale = true;
      try { localStorage.setItem('mycart_wholesale', 'true'); } catch(e) {}
      try { localStorage.setItem('mycart_wholesale_info', JSON.stringify({ name: approved.name, phone: approved.phone, city: approved.city, addr: approved.addr, note: approved.note, date: approved.date, code: approved.code, reveal: approved.reveal })); } catch(e) {}
      applyWholesale();
      document.getElementById('wholesaleBadge').style.display = 'inline-block';
      closeLogin();
      refreshLoginNavItem();
      showToast('تم تسجيل الدخول كتاجر جملة', 'success');
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  }).catch(function () {
    // Fallback error state (shouldn't happen since verifyAdminCode catches internally)
    document.getElementById('loginError').style.display = 'block';
  }).finally(function () {
    if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = prevText; }
  });
}

function toggleAdminCode() {
  const aca = document.getElementById('adminCodeArea');
  if (aca) aca.style.display = aca.style.display === 'none' ? 'block' : 'none';
}

function toggleJoinForm() {
  const f = document.getElementById('joinForm');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function submitJoinRequest() {
  const name = document.getElementById('joinName').value.trim();
  const phone = document.getElementById('joinPhone').value.trim();
  const city = document.getElementById('joinCity').value.trim();
  const addr = document.getElementById('joinAddr').value.trim();
  const note = document.getElementById('joinNote').value.trim();
  if (!name || !phone || !city) {
    showToast('يرجى تعبئة الاسم والهاتف والمدينة', 'error');
    return;
  }
  let reqs = [];
  try { reqs = JSON.parse(localStorage.getItem('mycart_join_requests') || '[]'); } catch(e) {}
  reqs.push({
    id: Date.now(),
    name: name,
    phone: phone,
    city: city,
    addr: addr,
    note: note,
    date: new Date().toISOString(),
    status: 'new'
  });
  try { localStorage.setItem('mycart_join_requests', JSON.stringify(reqs)); } catch(e) {}

  ['joinName','joinPhone','joinCity','joinAddr','joinNote'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  showToast('تم إرسال طلبك، ستصلك كود الدخول بعد الموافقة', 'success');
  closeLogin();
}

document.getElementById('fbBtn').addEventListener('click', e => { e.preventDefault(); showToast('شارك المتجر على فيسبوك', 'info'); });

document.getElementById('waBtn').addEventListener('click', e => {
  e.preventDefault();
  window.open(`https://wa.me/?text=${encodeURIComponent('🛍 تسوق من متجري!\n')}`, '_blank');
});

document.getElementById('backdropModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

document.getElementById('image-viewer').addEventListener('click', function(e) { if (e.target === this) closeImageViewer(); });

// ===== ADMIN PANEL =====

function adminLogout() {
  localStorage.removeItem('mycart_admin_logged');
  isWholesale = false;
  localStorage.removeItem('mycart_wholesale');
  document.getElementById('wholesaleBadge').style.display = 'none';
  applyWholesale();
  closeAdmin();
  // Restore nav button
  refreshLoginNavItem();
  showToast('تم تسجيل الخروج', 'info');
}

function toggleAdminMktSubMenu(e, forceOpen = false) {
  if (e) e.stopPropagation();
  const sub = document.getElementById('adminMktSubMenu');
  const chev = document.getElementById('adminMktChevron');
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

function adminToggleOrder(idx) {
  const o = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!o[idx]) return;
  o[idx]._status = o[idx]._status === 'done' ? 'pending' : 'done';
  try { localStorage.setItem('mycart_orders', JSON.stringify(o)); } catch(e) {}
  adminRefreshAll();
}

function adminToggleProdSelect() {
  const btn = document.getElementById('adminDelSelectedBtn');
  const checked = document.querySelectorAll('.admin-prod-cb:checked').length;
  btn.style.display = checked ? 'inline-flex' : 'none';
  btn.textContent = checked ? `حذف (${checked})` : '';
}

function adminToggleSelectAll() {
  const checked = document.getElementById('adminSelectAllCb').checked;
  document.querySelectorAll('.admin-prod-cb').forEach(cb => cb.checked = checked);
  adminToggleProdSelect();
}

// ===== CATEGORIES MANAGEMENT =====

function adminUploadCatImage() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('الصورة كبيرة جداً', 'error'); return; }
    const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    showToast('جاري رفع الصورة...', 'info');
    const url = await uploadToImgbb(dataUrl);
    if (!url) return;
    document.getElementById('acImage').value = url;
    document.getElementById('acPreview').src = url;
    document.getElementById('acPreview').style.display = 'block';
  };
  input.click();
}

function adminEditProduct(idx) {
  const p = products[idx];
  if (!p) return;
  adminEditingId = idx;
  document.getElementById('adminPageTitle').textContent = 'تعديل منتج';
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('admin-addProduct').classList.add('active');
  document.querySelectorAll('.admin-sidebar button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-sidebar button')[3].classList.add('active');
  adminLoadForm(p);
}

function adminLoadForm(p) {
  const prod = p || {};
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
  const prodCats = getProductCats(prod);
  const filteredCats = cats.filter(c => !c.isBrand);
  const catCheckboxes = filteredCats.length ? filteredCats.map(c =>
    `<label class="cat-check-label"><input type="checkbox" class="apCatCb" value="${c.name}" ${prodCats.includes(c.name) ? 'checked' : ''}> ${c.name}</label>`
  ).join('') : '<div style="color:var(--text-muted);font-size:.8rem">لا توجد تصنيفات. أضف تصنيفات أولاً.</div>';
  const variants = prod.variants || [];
  document.getElementById('admin-addProduct').innerHTML = `
    <div class="admin-section-title">${adminEditingId !== null ? 'تعديل المنتج' : 'إضافة منتج جديد'}</div>
    <form onsubmit="adminSaveProduct(event)">
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted)"><i class="fa-solid fa-circle-info"></i> المعلومات الأساسية</div>
        <div class="admin-grid">
          <div class="admin-form-group" style="grid-column:1/-1"><label>اسم المنتج *</label><input type="text" id="apName" value="${prod.name || ''}" required></div>
          <div class="admin-form-group"><label>السعر *</label><input type="number" id="apPrice" step="0.01" value="${prod.price || ''}" required></div>
          <div class="admin-form-group"><label>سعر الجملة <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'هذا السعر يظهر فقط لتجار الجملة المسجلين. إذا تُرك فارغاً يُحسب تلقائياً كخصم من السعر. يمكنك تعديل النسبة من إعدادات المتجر.')"></i></label><input type="number" id="apWholesalePrice" step="0.01" value="${prod.wholesalePrice || ''}"></div>
          <div class="admin-form-group"><label>السعر القديم</label><input type="number" id="apOldPrice" step="0.01" value="${prod.oldPrice || ''}"></div>
          <div class="admin-form-group"><label>SKU <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'رقم تعريف المنتج (Stock Keeping Unit). يُستخدم في الفواتير والتتبع وإعلانات فيسبوك.')"></i></label><input type="text" id="apSku" placeholder="مثال: IPHONE-16-BLK" value="${prod.sku || ''}"></div>
          <div class="admin-form-group"><label>الكمية المتاحة <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'عدد القطع المتاحة في المخزون. 0 = نفذ من المخزون.')"></i></label>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="number" id="apStock" min="0" value="${prod.stock !== undefined ? prod.stock : ''}" placeholder="0 = نفذ" style="flex:1" ${prod.stock === undefined ? 'disabled' : ''}>
              <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:600;white-space:nowrap;cursor:pointer;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg)">
                <input type="checkbox" id="apUnlimitedStock" onchange="document.getElementById('apStock').disabled=this.checked;if(this.checked)document.getElementById('apStock').value=''" ${prod.stock === undefined ? 'checked' : ''}> لا محدود
              </label>
            </div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted)"><i class="fa-solid fa-tags"></i> التصنيف والعلامة التجارية</div>
        <div class="admin-grid">
          <div class="admin-form-group"><label>التصنيفات</label>
            <input type="text" id="apCatSearch" placeholder="بحث عن تصنيف..." oninput="adminFilterCats()" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;margin-bottom:6px;box-sizing:border-box">
            <div id="apCatList" style="max-height:120px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:3px">${catCheckboxes}</div>
          </div>
          <div class="admin-form-group"><label style="color:#b45309;font-weight:800"><i class="fa-solid fa-award" style="color:#f59e0b"></i> العلامة التجارية</label>
            <input type="text" id="apBrandSearch" placeholder="بحث عن علامة تجارية..." oninput="adminFilterBrands()" style="width:100%;padding:8px;border:1.5px solid #fde68a;border-radius:6px;font-family:inherit;font-size:.8rem;margin-bottom:6px;box-sizing:border-box;background:#fffbeb">
            <div id="apBrandList" style="max-height:110px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px"></div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted)"><i class="fa-solid fa-image"></i> صور المنتج</div>
        <div class="admin-form-group" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadImg()" style="white-space:nowrap"><i class="fa-solid fa-upload"></i> اختر صور</button>
          <input type="text" id="apImageUrl" placeholder="أو أدخل رابط الصورة" style="flex:1;min-width:140px;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem">
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="addImageByUrl()" style="padding:8px 14px;white-space:nowrap"><i class="fa-solid fa-link"></i> إضافة</button>
          <div id="apImageList" style="flex:1 1 100%;display:flex;flex-wrap:wrap;gap:8px"></div>
        </div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted)"><i class="fa-solid fa-megaphone"></i> إعدادات التسويق</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <label style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);font-size:.82rem"><input type="checkbox" id="apFeatured" style="width:16px;height:16px" ${prod.featured ? 'checked' : ''}> <i class="fa-solid fa-star"></i> منتج مميز</label>
          <label style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);font-size:.82rem" title="يعرض عداد تنازلي في صفحة المنتج يحفز الزبون على الشراء"><input type="checkbox" id="apCountdown" style="width:16px;height:16px" ${prod.countdown?.show !== false ? 'checked' : ''} onchange="document.getElementById('apCountdownDurationWrap').style.display=this.checked?'inline-flex':'none'"> <i class="fa-solid fa-hourglass-half"></i> عداد تنازلي</label>
          <label id="apCountdownDurationWrap" style="display:${prod.countdown?.show !== false ? 'inline-flex' : 'none'};align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg);font-size:.82rem;font-weight:600;color:var(--text-muted)" title="المدة الزمنية التي سيعدّها العداد بالدقائق">المدة:
            <input type="number" id="apCountdownDuration" min="1" max="1440" value="${prod.countdown?.duration || 180}" style="width:55px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.78rem;text-align:center"> دقيقة
          </label>
          <label style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);font-size:.82rem" title="يعرض عدد المشاهدين الحاليين للمنتج بشكل عشوائي لخلق انطباع بالإقبال"><input type="checkbox" id="apLiveViewers" style="width:16px;height:16px" ${prod.liveViewers?.show !== false ? 'checked' : ''}> <i class="fa-solid fa-fire"></i> مشاهدون مباشرون</label>
          <label style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);font-size:.82rem"><input type="checkbox" id="apVolDisc" style="width:16px;height:16px" ${prod.volumeDiscount?.show ? 'checked' : ''}> <i class="fa-solid fa-tag"></i> خصم الكميات <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="event.stopPropagation();showTooltipExample(this, 'إذا فُعل، المنتج رح يطبق عليه نظام خصم الكميات اللي ضبطته في إعدادات التسويق. مثال: شراء 2 = خصم 5%، شراء 3+ = خصم 10%.')"></i></label>
          <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg);font-size:.82rem;color:var(--text-muted)"><i class="fa-solid fa-tag"></i> شارة ترويجية: <input type="text" id="apBadge" placeholder="الأكثر مبيعاً، جديد..." value="${prod.badge || ''}" style="width:120px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.78rem"></div>
        </div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:.8rem;font-weight:700;color:var(--text-muted)"><i class="fa-solid fa-box"></i> حزمة "اشترِ معاً ووفر"</div>
          <label style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--border);border-radius:6px;cursor:pointer;background:var(--bg);font-size:.75rem"><input type="checkbox" id="apFbtShow" style="width:14px;height:14px" ${prod.fbtShow !== false ? 'checked' : ''} onchange="document.getElementById('apFbtWrap').style.display=this.checked?'block':'none'"> تفعيل</label>
        </div>
        <div id="apFbtWrap" style="display:${prod.fbtShow !== false ? 'block' : 'none'}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:.75rem;font-weight:700;color:var(--text-muted)">المنتجات المكملة</div>
            <div style="font-size:.7rem;color:var(--text-muted);background:var(--bg);padding:2px 10px;border-radius:10px;font-weight:700" id="apFbtCount">${(prod.fbtProductIds || []).length} / 4</div>
          </div>
          <div id="apFbtProducts" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${(prod.fbtProductIds || []).map(id => { const pr = products.find(p => p.id === id); return pr ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--accent);border-radius:8px;font-size:.75rem;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.1)"><img src="${Array.isArray(pr.images) ? pr.images[0] : pr.image || 'https://placehold.co/24x24/e2e8f0/64748b?text=N'}" style="width:20px;height:20px;border-radius:4px;object-fit:cover">${pr.name} <i class="fa-solid fa-xmark" style="cursor:pointer;color:rgba(255,255,255,.7);font-size:.8rem" onclick="removeApFbtProduct(${id})"></i></span>` : ''; }).join('')}</div>
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openApFbtPicker()"><i class="fa-solid fa-plus"></i> اختيار منتجات للحزمة</button>
          <input type="hidden" id="apFbtProductIds" value="${(prod.fbtProductIds || []).join(',')}">
        </div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted)"><i class="fa-solid fa-list"></i> التفاصيل</div>
        <div class="admin-form-group" style="margin-bottom:10px"><label>الوصف <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'مثال: جوال آيفون 16 بشاشة 6.9 بوصة ومعالج A18 Pro، مثالي للمحترفين وعشاق التصوير.')"></i></label><textarea id="apDescription" rows="3" placeholder="اكتب وصف مختصر للمنتج..." style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;resize:vertical;box-sizing:border-box">${prod.description || ''}</textarea></div>
        <div class="admin-form-group" style="margin-bottom:10px"><label>ملاحظة خاصة بالمنتج (تظهر بشكل بارز في صفحة المنتج)</label><input type="text" id="apNote" placeholder="مثال: التوصيل مجاني لفترة محدودة، أو ضمان سنتين" value="${prod.note || ''}" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;box-sizing:border-box"></div>
        <div class="admin-form-group" style="margin-bottom:10px"><label>الميزات <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'مثال:\\nشاشة 6.9 بوصة\\nمعالج A18 Pro\\nكاميرا 48MP')"></i></label><textarea id="apFeatures" rows="2" placeholder="كل سطر = ميزة" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;resize:vertical;box-sizing:border-box">${(prod.features || []).join('\n')}</textarea></div>
        <div class="admin-form-group" style="margin-bottom:10px"><label>المواصفات <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'مثال:\\nالمعالج : A18 Pro\\nالرام : 8GB\\nالشاشة : 6.9 بوصة')"></i></label><textarea id="apSpecs" rows="2" placeholder="كل سطر: الاسم : القيمة" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;resize:vertical;box-sizing:border-box">${(prod.specs || []).map(s => `${s[0]} : ${s[1]}`).join('\n')}</textarea></div>
      </div>
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card-bg)">
        <div style="font-size:.8rem;font-weight:700;margin-bottom:10px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span><i class="fa-solid fa-layer-group"></i> الخيارات (لون، مقاس، ...)</span>
          <label style="display:flex;align-items:center;gap:4px;font-size:0.7rem;font-weight:600;cursor:pointer;user-select:none;">
            <input type="checkbox" id="apOptionsRequired" ${prod.optionsRequired ? 'checked' : ''}> اختيار الخيارات إجباري للشراء
          </label>
        </div>
        <div id="apOptions">
          ${(prod.options || []).map((opt, oi) => `
            <div class="option-card">
              <div class="option-header">
                <input type="text" class="optName" placeholder="اسم الخيار" value="${opt.name}">
                <select class="optType" onchange="optTypeChange(this)">
                  <option value="text" ${opt.type==='text'?'selected':''}><i class="fa-solid fa-palette"></i> نص</option>
                  <option value="color" ${opt.type==='color'?'selected':''}><i class="fa-solid fa-palette"></i> لون</option>
                  <option value="image" ${opt.type==='image'?'selected':''}><i class="fa-solid fa-image"></i> صورة</option>
                </select>
                <button type="button" onclick="adminRemoveOption(this)"><i class="fa-solid fa-trash-can"></i></button>
              </div>
              <div class="optValues">
                <div class="opt-label-row"><span class="lbl-choice">الاختيار</span><span class="lbl-price">السعر</span><span class="lbl-wholesale" style="width:72px;text-align:center;">الجملة</span><span class="lbl-extra"></span><span class="lbl-stock">المخزون</span><span class="lbl-spacer"></span></div>
                ${(opt.values || []).map(v => `
                <div class="opt-value">
                  <input type="text" class="optV" placeholder="اختيار" value="${v.value}">
                  <label>السعر<input type="number" class="optPrice" step="0.01" value="${v.price||0}"></label>
                  <label>جملة <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:pointer;font-size:.75rem;margin-right:2px;" onclick="showTooltipExample(this, 'هذا السعر يظهر فقط للزبائن المسجلين كتجار جملة في متجرك')" title="توضيح"></i><input type="number" class="optWholesalePrice" step="0.01" value="${v.wholesalePrice||0}"></label>
                  ${opt.type==='color'?`<input type="color" class="optExtra" value="${v.extra||'#000000'}">`:opt.type==='image'?`<img class="optExtra" src="${v.extra||''}" onclick="showOptImgChooser(this)"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="">`}
                  <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value="${v.stock||''}"></label>
                  <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>`).join('')}
                <button type="button" onclick="adminAddOptValue(this)" style="padding:4px 10px;border:1px dashed var(--border);border-radius:6px;background:none;cursor:pointer;color:var(--text-muted);font-size:.7rem;font-family:inherit;margin-top:2px"><i class="fa-solid fa-plus"></i> إضافة اختيار</button>
              </div>
            </div>
          `).join('')}
        </div>
        <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminAddOption()" style="margin-top:4px"><i class="fa-solid fa-plus"></i> إضافة خيار جديد</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button type="submit" class="admin-btn admin-btn-primary">${adminEditingId !== null ? 'تحديث' : 'حفظ'}</button>
        <button type="button" class="admin-btn admin-btn-secondary" onclick="adminResetForm()">إعادة تعيين</button>
      </div>
    </form>
  `;
  adminRenderImageList(getProductImages(prod));
  adminInitBrandList(prod);
}

function adminInitBrandList(prod) {
  const container = document.getElementById('apBrandList');
  if (!container) return;
  try {
    const cats = JSON.parse(localStorage.getItem('mycart_categories') || '[]');
    const brandCats = cats.filter(c => c.isBrand);
    const selected = prod.brand || '';
    container.innerHTML = '<label class="brand-pill" onclick="adminSelectBrand(this,\'\')" style="cursor:pointer' + (selected === '' ? '' : '') + '">بدون</label>' +
      brandCats.map(c => `<label class="brand-pill${selected === c.name ? ' selected' : ''}" onclick="adminSelectBrand(this,'${c.name}')" style="cursor:pointer">${c.name}</label>`).join('');
    // Set internal value on the initially selected label
    container.querySelectorAll('.cat-check-label').forEach(l => {
      if (l.style.background.includes('var(--accent)')) l._brandVal = l.textContent.trim() === 'بدون' ? '' : l.textContent.trim();
    });
  } catch(e) { container.innerHTML = ''; }
}

function adminSelectBrand(el, name) {
  document.querySelectorAll('#apBrandList .brand-pill').forEach(l => { l.classList.remove('selected'); l._brandVal = undefined; });
  el.classList.add('selected');
  el._brandVal = name;
}

function showTooltipExample(el, msg) {
  const tip = document.createElement('div');
  tip.className = 'tooltip-example';
  tip.textContent = msg;
  const rect = el.getBoundingClientRect();
  tip.style.cssText = `position:fixed;z-index:99999;background:#1e293b;color:#fff;font-size:.75rem;padding:10px 14px;border-radius:8px;max-width:280px;white-space:pre-wrap;line-height:1.5;box-shadow:0 8px 30px rgba(0,0,0,.25);top:${rect.bottom + 8}px;left:${Math.min(rect.left, window.innerWidth - 300)}px;font-family:inherit;direction:ltr;text-align:left`;
  document.body.appendChild(tip);
  setTimeout(() => { tip.style.opacity = '0'; tip.style.transition = 'opacity .25s'; setTimeout(() => tip.remove(), 250); }, 3500);
  const close = () => { tip.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 10);
}

function adminFilterCats() {
  const q = document.getElementById('apCatSearch').value.trim().toLowerCase();
  document.querySelectorAll('#apCatList .cat-check-label').forEach(l => {
    l.style.display = l.textContent.trim().toLowerCase().includes(q) ? '' : 'none';
  });
}

function adminGetSelectedBrand() {
  const sel = document.querySelector('#apBrandList .brand-pill.selected');
  return sel ? (sel._brandVal !== undefined ? sel._brandVal : '') : '';
}

function adminFilterBrands() {
  const q = document.getElementById('apBrandSearch').value.trim().toLowerCase();
  document.querySelectorAll('#apBrandList .brand-pill').forEach(l => {
    l.style.display = l.textContent.trim().toLowerCase().includes(q) ? '' : 'none';
  });
}

function adminGetImages() {
  const imgs = [];
  document.querySelectorAll('#apImageList img').forEach(img => imgs.push(img.src));
  return imgs;
}

function adminSetPrimaryImg(idx) {
  const imgs = adminGetImages();
  if (idx < 0 || idx >= imgs.length || idx === 0) return;
  const item = imgs.splice(idx, 1)[0];
  imgs.unshift(item);
  adminRenderImageList(imgs);
}

function adminMoveImg(idx, dir) {
  const imgs = adminGetImages();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= imgs.length) return;
  [imgs[idx], imgs[newIdx]] = [imgs[newIdx], imgs[idx]];
  adminRenderImageList(imgs);
}

function adminRemoveImg(idx) {
  const imgs = adminGetImages();
  imgs.splice(idx, 1);
  adminRenderImageList(imgs);
}

function adminRemoveOption(btn) { btn.closest('.option-card').remove(); }

function optTypeChange(sel) {
  const card = sel.closest('.option-card');
  const type = sel.value;
  card.querySelectorAll('.opt-value').forEach(el => {
    const v = el.querySelector('.optV').value;
    const price = el.querySelector('.optPrice').value;
    const stock = el.querySelector('.optStock').value;
    const oldExtra = el.querySelector('.optExtra');
    const oldVal = oldExtra ? (oldExtra.type==='color'?oldExtra.value:oldExtra.src) : '';
    el.innerHTML = `<input type="text" class="optV" placeholder="اختيار" value="${v}">
      <label>السعر<input type="number" class="optPrice" step="0.01" value="${price}"></label>
      ${type==='color'?`<input type="color" class="optExtra" value="${oldVal||'#000000'}">`:type==='image'?`<img class="optExtra" src="${oldVal||''}" onclick="showOptImgChooser(this)"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="${oldVal}">`}
      <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value="${stock}"></label>
      <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  });
}

async function optImgUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  const img = input.parentElement.querySelector('.optExtra');
  if (img) img.src = url;
}

function adminPickVariantImgs(btn) {
  const row = btn.closest('.vc-row') || btn.closest('.variant-card');
  const available = adminGetImages();
  if (!available.length) { showToast('لا توجد صور للمنتج. ارفع صور أولاً.', 'error'); return; }
  const current = (row.querySelector('.vImages').value ? row.querySelector('.vImages').value.split('|||') : []);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--card);border-radius:14px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto';
  box.innerHTML = `<h3 style="margin:0 0 12px;font-size:1rem">اختر صوراً للمتغير</h3><div id="vPickerGrid" style="display:flex;flex-wrap:wrap;gap:8px">${available.map((img, i) => `<img src="${img}" data-idx="${i}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;cursor:pointer;border:3px solid ${current.includes(img) ? 'var(--accent)' : 'var(--border)'}">`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px"><button class="admin-btn admin-btn-primary" id="vPickerConfirm">تأكيد</button><button class="admin-btn admin-btn-secondary" id="vPickerCancel">إلغاء</button></div>`;
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
    count.textContent = selected.length ? selected.length + ' ص' : '';
    const thumbs = row.querySelector('.vImgThumbs');
    if (thumbs) thumbs.innerHTML = selected.slice(0,3).map(s => `<img src="${s}" style="width:18px;height:18px;border-radius:3px;object-fit:cover;border:1px solid var(--border)">`).join('');
    document.body.removeChild(overlay);
  };
  box.querySelector('#vPickerCancel').onclick = function() { document.body.removeChild(overlay); };
}

function addImageByUrl() {
  const input = document.getElementById('apImageUrl') || document.getElementById('pImageUrl');
  if (!input) return;
  const url = input.value.trim();
  if (!url) { showToast('أدخل رابط الصورة أولاً', 'error'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { showToast('الرابط غير صالح', 'error'); return; }
  const imgs = adminGetImages().filter(img => !img.includes('placehold.co'));
  imgs.push(url);
  adminRenderImageList(imgs);
  input.value = '';
  showToast('تم إضافة الصورة من الرابط', 'success');
}

async function adminUploadImg() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
  input.onchange = async function(e) {
    const files = [...e.target.files];
    if (!files.length) return;
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) showToast('بعض الصور كبيرة جداً (الحد 5MB) وتم تخطيها', 'error');
    if (!valid.length) return;
    const currentImgs = adminGetImages().filter(img => !img.includes('placehold.co'));
    showToast('جاري رفع الصور إلى ImgBB...', 'info');
    for (const file of valid) {
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
      const url = await uploadToImgbb(dataUrl);
      if (!url) continue;
      currentImgs.push(url);
    }
    adminRenderImageList(currentImgs);
  };
  input.click();
}

function limitFbtCb(el, max) {
  if (!el.checked) return;
  const checked = document.querySelectorAll('.apFbtCb:checked').length;
  if (checked > max) el.checked = false;
}
function filterApFbtProducts() {
  const q = document.getElementById('apFbtSearch').value.trim().toLowerCase();
  document.querySelectorAll('#apFbtPickerList .apFbtItem').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
}
function openApFbtPicker() {
  const list = products || [];
  const current = document.getElementById('apFbtProductIds').value ? document.getElementById('apFbtProductIds').value.split(',').map(Number) : [];
  const remaining = 4 - current.length;
  const countSaved = current.length;
  let html = '<div style="display:flex;flex-direction:column;min-height:250px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border-radius:12px;margin-bottom:14px;border:1px solid #e2e8f0;flex-shrink:0">';
  html += '<span style="font-size:.75rem;font-weight:600;color:#64748b"><i class="fa-solid fa-cube" style="margin-left:4px"></i>الحد الأقصى</span>';
  html += '<span id="apFbtLiveCount" style="font-size:.85rem;font-weight:800;color:#0f172a;background:#e2e8f0;padding:3px 16px;border-radius:20px">' + countSaved + ' / 4</span>';
  html += '</div>';
  html += '<div style="margin-bottom:12px;position:relative;flex-shrink:0">';
  html += '<i class="fa-solid fa-magnifying-glass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.75rem"></i>';
  html += '<input type="text" id="apFbtSearch" placeholder="ابحث عن منتج..." oninput="filterApFbtProducts()" style="width:100%;padding:10px 14px 10px 32px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.8rem;outline:none;box-sizing:border-box;background:#fff" autocomplete="off">';
  html += '</div>';
  html += '<div style="flex:1;overflow-y:auto;min-height:0" id="apFbtScrollWrap">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:2px 0" id="apFbtPickerList">';
  list.forEach(p => {
    const added = current.includes(p.id);
    html += '<label class="apFbtItem" data-id="' + p.id + '" data-name="' + p.name.replace(/"/g,'&quot;') + '" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1.5px solid ' + (added ? 'var(--accent)' : '#e2e8f0') + ';border-radius:12px;cursor:pointer;background:' + (added ? 'linear-gradient(135deg,var(--accent),var(--accent-hover))' : '#fff') + ';transition:all .2s;box-shadow:' + (added ? '0 4px 12px rgba(0,0,0,.1)' : '0 1px 2px rgba(0,0,0,.04)') + '">' +
      '<div style="width:22px;display:flex;align-items:center;justify-content:center">' +
      '<input type="checkbox" class="apFbtCb" value="' + p.id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer"' + (added ? ' checked disabled' : ' onchange="toggleApFbtCard(this,' + countSaved + ')"') + '>' +
      '</div>' +
      '<img src="' + (Array.isArray(p.images) ? p.images[0] : p.image || 'https://placehold.co/46x46/e2e8f0/64748b?text=N') + '" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:2px solid ' + (added ? 'rgba(255,255,255,.25)' : '#f1f5f9') + ';flex-shrink:0">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:.82rem;font-weight:700;color:' + (added ? '#fff' : '#0f172a') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</div>' +
      '<div style="font-size:.7rem;color:' + (added ? 'rgba(255,255,255,.75)' : '#94a3b8') + ';margin-top:2px">' + CURRENCY + p.price + (added ? ' <span style="font-weight:600">✓ مضاف</span>' : '') + '</div>' +
      '</div>' +
    '</label>';
  });
  if (!list.length) html += '<div style="font-size:.8rem;color:#94a3b8;padding:30px 10px;text-align:center">لا توجد منتجات.</div>';
  html += '</div>';
  html += '</div>';
  html += '<div style="flex-shrink:0;padding-top:10px;background:var(--card);position:sticky;bottom:0">';
  html += '<button onclick="addSelectedApFbt()" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.15);transition:opacity .15s" id="apFbtAddBtn">إضافة المنتجات المختارة</button>';
  html += '<button onclick="closeModal()" style="width:100%;padding:10px;margin-top:6px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-weight:600;cursor:pointer;font-family:inherit;font-size:.8rem;transition:all .15s">إلغاء</button>';
  html += '</div>';
  html += '</div>';
  document.getElementById('modalTitle').textContent = 'اختيار منتجات للحزمة';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('backdropModal').classList.add('show');
}
function toggleApFbtCard(el, saved) {
  if (el.checked) {
    const checked = document.querySelectorAll('#apFbtPickerList .apFbtCb:checked:not(:disabled)').length;
    if (checked > (4 - saved)) {
      el.checked = false;
      const label = el.closest('.apFbtItem');
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
  const label = el.closest('.apFbtItem');
  const checked = document.querySelectorAll('#apFbtPickerList .apFbtCb:checked:not(:disabled)').length;
  const total = saved + checked;
  const counter = document.getElementById('apFbtLiveCount');
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
function addSelectedApFbt() {
  const input = document.getElementById('apFbtProductIds');
  const current = input.value ? input.value.split(',').map(Number) : [];
  const selected = [...document.querySelectorAll('.apFbtCb:checked')].map(cb => parseInt(cb.value));
  const remaining = 4 - current.length;
  const toAdd = selected.slice(0, remaining).filter(id => !current.includes(id));
  if (!toAdd.length) { closeModal(); return; }
  current.push(...toAdd);
  input.value = current.join(',');
  closeModal();
  refreshApFbtProductTags();
}
function removeApFbtProduct(id) {
  const input = document.getElementById('apFbtProductIds');
  const current = input.value ? input.value.split(',').map(Number) : [];
  input.value = current.filter(x => x !== id).join(',');
  refreshApFbtProductTags();
}
function refreshApFbtProductTags() {
  const container = document.getElementById('apFbtProducts');
  if (!container) return;
  const input = document.getElementById('apFbtProductIds');
  const ids = input.value ? input.value.split(',').map(Number) : [];
  container.innerHTML = ids.map(id => {
    const pr = products.find(p => p.id === id);
    return pr ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--accent);border-radius:8px;font-size:.75rem;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.1)"><img src="' + (Array.isArray(pr.images) ? pr.images[0] : pr.image || 'https://placehold.co/24x24/e2e8f0/64748b?text=N') + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover">' + pr.name + ' <i class="fa-solid fa-xmark" style="cursor:pointer;color:rgba(255,255,255,.7);font-size:.8rem" onclick="removeApFbtProduct(' + id + ')"></i></span>' : '';
  }).join('');
  const counter = document.getElementById('apFbtCount');
  if (counter) counter.textContent = ids.length + ' / 4';
}
async function adminSaveProduct(e) {
  e.preventDefault();
  const name = document.getElementById('apName').value.trim();
  const price = parseFloat(document.getElementById('apPrice').value);
  if (!name || !price) { alert('يرجى تعبئة الاسم والسعر'); return; }
  const wholesalePrice = parseFloat(document.getElementById('apWholesalePrice').value) || 0;
  const note = document.getElementById('apNote').value.trim();
  const description = document.getElementById('apDescription').value.trim();
  const features = document.getElementById('apFeatures').value.split('\n').map(s => s.trim()).filter(Boolean);
  const specsRaw = document.getElementById('apSpecs').value.split('\n').map(s => s.trim()).filter(Boolean);
  const specs = specsRaw.map(s => {
    const i = s.indexOf(' : '); if (i > 0) return [s.slice(0,i).trim(), s.slice(i+3).trim()];
    const j = s.indexOf(':'); if (j > 0) return [s.slice(0,j).trim(), s.slice(j+1).trim()];
    return [s, ''];
  });
  const categories = [...document.querySelectorAll('.apCatCb:checked')].map(cb => cb.value);
  const options = [...document.querySelectorAll('#apOptions .option-card')].map(card => {
    const name = card.querySelector('.optName').value.trim();
    if (!name) return null;
    const type = card.querySelector('.optType').value;
    const values = [...card.querySelectorAll('.opt-value')].map(el => ({
      value: el.querySelector('.optV').value.trim(),
      price: parseFloat(el.querySelector('.optPrice').value) || 0,
      wholesalePrice: parseFloat(el.querySelector('.optWholesalePrice') ? el.querySelector('.optWholesalePrice').value : 0) || 0,
      stock: parseInt(el.querySelector('.optStock').value) || 0,
      extra: type==='color' ? (el.querySelector('.optExtra')||{}).value || '#000000' : type==='image' ? (el.querySelector('.optExtra')||{}).src || '' : ''
    })).filter(x => x.value);
    return values.length ? { name, type, values } : null;
  }).filter(Boolean);
  const existingDate = adminEditingId !== null ? (products[adminEditingId].createdAt || products[adminEditingId].dateAdded) : null;
  const product = {
    sku: document.getElementById('apSku').value.trim(),
    stock: document.getElementById('apUnlimitedStock').checked ? undefined : (parseInt(document.getElementById('apStock').value) || 0),
    id: adminEditingId !== null ? products[adminEditingId].id : Date.now(),
    name,
    price,
    wholesalePrice,
    oldPrice: parseFloat(document.getElementById('apOldPrice').value) || 0,
    categories: categories.length ? categories : ['أخرى'],
    images: (() => { const imgs = adminGetImages().filter(img => !img.includes('placehold.co')); return imgs.length ? imgs : ['https://placehold.co/400x400/e2e8f0/64748b?text=Product']; })(),
    optionsRequired: document.getElementById('apOptionsRequired') ? document.getElementById('apOptionsRequired').checked : false,
    brand: adminGetSelectedBrand(),
    note,
    description, featured: document.getElementById('apFeatured').checked,
    badge: document.getElementById('apBadge').value.trim(),
    countdown: { show: document.getElementById('apCountdown').checked, duration: parseInt(document.getElementById('apCountdownDuration').value) || 180 },
    liveViewers: { show: document.getElementById('apLiveViewers').checked },
    volumeDiscount: document.getElementById('apVolDisc').checked ? { show: true } : undefined,
    features, specs,
    options: options.length ? options : undefined,
    createdAt: existingDate || new Date().toLocaleDateString('ar-EG'),
    fbtProductIds: document.getElementById('apFbtProductIds').value ? document.getElementById('apFbtProductIds').value.split(',').map(Number).filter(Boolean) : [],
    fbtShow: document.getElementById('apFbtShow').checked
  };
  if (adminEditingId !== null) products[adminEditingId] = product;
  else products.unshift(product);
  await saveProductsToLS();
  adminEditingId = null;
  adminRefreshAll();
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  switchAdminTab('products');
  document.querySelectorAll('.admin-sidebar button')[2].classList.add('active');
  adminShowProductSaveSuccessModal(product);
}

function adminShowProductSaveSuccessModal(product) {
  const overlay = document.createElement('div');
  overlay.id = 'adminProductSaveSuccessModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px';
  const box = document.createElement('div');
  box.style.cssText = 'background:var(--card,#ffffff);border-radius:16px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:24px;text-align:center;position:relative;font-family:inherit';
  box.innerHTML = `
    <div style="width:60px;height:60px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.8rem;color:#10b981">
      <i class="fa-solid fa-circle-check"></i>
    </div>
    <h3 style="margin:0 0 8px;font-size:1.1rem;font-weight:800;color:var(--text)">تم حفظ المنتج بنجاح!</h3>
    <p style="margin:0 0 20px;font-size:0.85rem;color:var(--text-muted)">يمكنك معاينة المنتج مباشرة في المتجر.</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <a href="#product/${product.id}" id="btnPreviewProdStore" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;background:var(--accent);color:#fff;border-radius:10px;font-weight:700;font-size:0.85rem;text-decoration:none">
        <i class="fa-solid fa-eye"></i> معاينة المنتج في المتجر
      </a>
      <button id="btnDismissStoreModal" style="padding:10px;background:none;border:1.5px solid var(--border);color:var(--text);border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit">
        حسناً
      </button>
    </div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelector('#btnPreviewProdStore').onclick = function() {
    overlay.remove();
    location.hash = `#product/${product.id}`;
    if (typeof handleRoute === 'function') handleRoute();
  };
  box.querySelector('#btnDismissStoreModal').onclick = function() {
    overlay.remove();
  };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

// ===== DELIVERY ZONES =====

var _adminZoneEditIdx = -1;

function renderAdminZones() {
  const zones = loadDeliveryZones();
  if (!zones.length) return '<p style="font-size:.8rem;color:var(--text-muted)">لا يوجد مناطق توصيل</p>';
  return zones.map((z, idx) => {
    if (_adminZoneEditIdx === idx) {
      return '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:.8rem">' +
        '<input type="text" id="zoneEditName" value="' + escHtml(z.name) + '" style="flex:1;padding:6px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem;min-width:0">' +
        '<input type="number" id="zoneEditPrice" value="' + z.price + '" min="0" step="0.5" style="width:70px;padding:6px;border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:.8rem">' +
        '<button onclick="adminSaveZone(' + idx + ')" style="background:none;border:none;color:#10b981;cursor:pointer;font-size:.9rem" title="حفظ"><i class="fa-solid fa-check"></i></button>' +
        '<button onclick="adminCancelZoneEdit()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.85rem" title="إلغاء"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>';
    }
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:.8rem"><span><strong>' + z.name + '</strong> — ' + CURRENCY + z.price + '</span><span style="display:flex;gap:4px">' +
      '<button onclick="adminEditZone(' + idx + ')" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.85rem"><i class="fa-solid fa-pen"></i></button>' +
      '<button onclick="adminDeleteZone(' + idx + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem"><i class="fa-solid fa-xmark"></i></button>' +
      '</span></div>';
  }).join('');
}

function adminEditZone(idx) {
  _adminZoneEditIdx = idx;
  const el = document.getElementById('adminZonesList');
  if (el) el.innerHTML = renderAdminZones();
}

function adminCancelZoneEdit() {
  _adminZoneEditIdx = -1;
  const el = document.getElementById('adminZonesList');
  if (el) el.innerHTML = renderAdminZones();
}

function adminSaveZone(idx) {
  const zones = loadDeliveryZones();
  if (idx < 0 || idx >= zones.length) return;
  const nameEl = document.getElementById('zoneEditName');
  const priceEl = document.getElementById('zoneEditPrice');
  if (!nameEl || !priceEl) return;
  const name = nameEl.value.trim();
  const price = parseFloat(priceEl.value);
  if (!name || isNaN(price) || price < 0) { showToast('أدخل اسم المنطقة والسعر', 'error'); return; }
  zones[idx] = { name: name, price: price };
  saveDeliveryZones(zones);
  _adminZoneEditIdx = -1;
  const el = document.getElementById('adminZonesList');
  if (el) el.innerHTML = renderAdminZones();
  showToast('تم تعديل منطقة التوصيل', 'success');
}

// ===== ADMIN APPEARANCE =====

/* ============ APPEARANCE / THEME CUSTOMIZER ============ */

const APPEARANCE_FIELDS = [

  {id:'appAccent',key:'accentColor',type:'color'},

  {id:'appAccentHover',key:'accentHover',type:'color'},

  {id:'appBgColor',key:'bgColor',type:'color'},

  {id:'appCardColor',key:'cardColor',type:'color'},

  {id:'appTextColor',key:'textColor',type:'color'},

  {id:'appTextMuted',key:'textMuted',type:'color'},

  {id:'appBorderColor',key:'borderColor',type:'color'},

  {id:'appPriceColor',key:'priceColor',type:'color'},

  {id:'appSaleColor',key:'saleColor',type:'color'},

  {id:'appSuccessColor',key:'successColor',type:'color'},

  {id:'appDarkMode',key:'darkMode',type:'checkbox'},

  {id:'appFontHeading',key:'fontHeading',type:'select'},

  {id:'appFontBody',key:'fontBody',type:'select'},

  {id:'appFontSize',key:'fontSize',type:'range'},

  {id:'appHeadingScale',key:'headingScale',type:'range',scale:0.01},

  {id:'appFontWeight',key:'fontWeight',type:'select'},

  {id:'appLineHeight',key:'lineHeight',type:'range',scale:0.1},

  {id:'appShowBanners',key:'showBanners',type:'checkbox'},

  {id:'appShowFlashSales',key:'showFlashSales',type:'checkbox'},

  {id:'appShowFeatured',key:'showFeatured',type:'checkbox'},

  {id:'appShowCategories',key:'showCategories',type:'checkbox'},

  {id:'appShowBrands',key:'showBrands',type:'checkbox'},

  {id:'appGridColsDesktop',key:'gridColsDesktop',type:'range'},

  {id:'appGridColsTablet',key:'gridColsTablet',type:'range'},

  {id:'appGridColsMobile',key:'gridColsMobile',type:'range'},

  {id:'appGridGap',key:'gridGap',type:'range'},

  {id:'appImgRatio',key:'imgRatio',type:'select'},

  {id:'appImgRadius',key:'imgRadius',type:'range'},

  {id:'appImgHoverZoom',key:'imgHoverZoom',type:'checkbox'},

  {id:'appImgLazyLoad',key:'imgLazyLoad',type:'checkbox'},

  {id:'appCardRadius',key:'cardRadius',type:'range'},

  {id:'appBtnRadius',key:'btnRadius',type:'range'},

  {id:'appCardStyle',key:'cardStyle',type:'select'},

  {id:'appBtnStyle',key:'btnStyle',type:'select'},

  {id:'appCardImgNav',key:'cardImgNav',type:'select'},

  {id:'appShadows',key:'shadows',type:'checkbox'},

  {id:'appShadowIntensity',key:'shadowIntensity',type:'range',scale:0.01},

  {id:'appStickyHeader',key:'stickyHeader',type:'checkbox'},

  {id:'appShowSearch',key:'showSearch',type:'checkbox'},

  {id:'appShowWishlist',key:'showWishlist',type:'checkbox'},

  {id:'appHeaderFrom',key:'headerFrom',type:'color'},

  {id:'appHeaderTo',key:'headerTo',type:'color'},

  {id:'appHeaderText',key:'headerText',type:'color'},

  {id:'appHeaderPadding',key:'headerPadding',type:'range'},

  {id:'appNavStyle',key:'navStyle',type:'select'},

  {id:'appShowCartCount',key:'showCartCount',type:'checkbox'},

  {id:'appShowNavLabels',key:'showNavLabels',type:'checkbox'},

  {id:'appNavBg',key:'navBg',type:'color'},

  {id:'appNavActive',key:'navActive',type:'color'},

  {id:'appShowBrand',key:'showBrand',type:'checkbox'},

  {id:'appShowOldPrice',key:'showOldPrice',type:'checkbox'},

  {id:'appShowDiscountBadge',key:'showDiscountBadge',type:'checkbox'},

  {id:'appShowQuickAdd',key:'showQuickAdd',type:'checkbox'},

  {id:'appPagePadding',key:'pagePadding',type:'range'},

  {id:'appSectionGap',key:'sectionGap',type:'range'}

];

const THEME_PRESETS = {
  // New Premium Themes
  rosegold: { name: 'مجوهرات روز غولد', sub: 'ثيم ذهبي ووردي فاخر للمجوهرات الراقية', accentColor: '#d4af37', accentHover: '#c5a028', bgColor: '#faf6f0', cardColor: '#ffffff', textColor: '#3c2f2f', textMuted: '#8a7d6b', borderColor: '#ebdcd0', priceColor: '#b85a38', saleColor: '#d4af37', successColor: '#1b4d3e', headerFrom: '#3c2f2f', headerTo: '#2c1f1f', headerText: '#ffffff', navBg: '#ffffff', navActive: '#d4af37', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  coffee: { name: 'قهوة وشوكولاتة', sub: 'ثيم دافئ ومريح بألوان البن والكريمة', accentColor: '#6f4e37', accentHover: '#5c3d2e', bgColor: '#fdfbf7', cardColor: '#ffffff', textColor: '#3d2b1f', textMuted: '#8b7355', borderColor: '#e8e0d5', priceColor: '#6f4e37', saleColor: '#8c6239', successColor: '#10b981', headerFrom: '#6f4e37', headerTo: '#5c3d2e', headerText: '#ffffff', navBg: '#ffffff', navActive: '#6f4e37', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  mint: { name: 'نعناع هادئ', sub: 'ثيم باستيل مريح ومنعش للمنتجات الطبيعية', accentColor: '#0f766e', accentHover: '#115e59', bgColor: '#f0fdfa', cardColor: '#ffffff', textColor: '#115e59', textMuted: '#14b8a6', borderColor: '#ccfbf1', priceColor: '#0f766e', saleColor: '#f59e0b', successColor: '#10b981', headerFrom: '#115e59', headerTo: '#134e4a', headerText: '#ffffff', navBg: '#ffffff', navActive: '#0f766e', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  cyberpunk: { name: 'سايبر بانك', sub: 'ثيم مستقبلي نيون داكن للألعاب والتقنية الحديثة', accentColor: '#f43f5e', accentHover: '#e11d48', bgColor: '#03001e', cardColor: '#12002f', textColor: '#00f2fe', textMuted: '#7300ff', borderColor: '#2d0066', priceColor: '#f43f5e', saleColor: '#00f2fe', successColor: '#10b981', headerFrom: '#12002f', headerTo: '#03001e', headerText: '#00f2fe', navBg: '#12002f', navActive: '#f43f5e', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true },
  sakura: { name: 'أزهار الكرز', sub: 'ثيم وردي لطيف مستوحى من أزهار الساكورا اليابانية', accentColor: '#ec4899', accentHover: '#db2777', bgColor: '#fdf2f8', cardColor: '#ffffff', textColor: '#471825', textMuted: '#db2777', borderColor: '#fce7f3', priceColor: '#ec4899', saleColor: '#f43f5e', successColor: '#10b981', headerFrom: '#db2777', headerTo: '#be185d', headerText: '#ffffff', navBg: '#ffffff', navActive: '#ec4899', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  emerald: { name: 'الزمرد الفاخر', sub: 'ثيم ملكي كلاسيكي لعشاق الفخامة والتميز', accentColor: '#0f5132', accentHover: '#0a3622', bgColor: '#f4f9f6', cardColor: '#ffffff', textColor: '#0a3622', textMuted: '#198754', borderColor: '#d1e7dd', priceColor: '#b8901c', saleColor: '#d4af37', successColor: '#198754', headerFrom: '#0a3622', headerTo: '#082c1c', headerText: '#ffffff', navBg: '#ffffff', navActive: '#0f5132', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  nordic: { name: 'اسكندنافي دافئ', sub: 'ثيم بسيط وعصري بألوان هادئة وطبيعية', accentColor: '#4a5759', accentHover: '#3b4547', bgColor: '#f4ede4', cardColor: '#ffffff', textColor: '#2b303a', textMuted: '#87979a', borderColor: '#ded5c6', priceColor: '#b25a38', saleColor: '#4a5759', successColor: '#10b981', headerFrom: '#4a5759', headerTo: '#3b4547', headerText: '#ffffff', navBg: '#ffffff', navActive: '#4a5759', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  midnight: { name: 'نيون منتصف الليل', sub: 'ثيم داكن وعصري بلمسات نيون بنفسجية وسيانية', accentColor: '#a855f7', accentHover: '#9333ea', bgColor: '#09090b', cardColor: '#18181b', textColor: '#22d3ee', textMuted: '#a855f7', borderColor: '#27272a', priceColor: '#a855f7', saleColor: '#22d3ee', successColor: '#10b981', headerFrom: '#18181b', headerTo: '#09090b', headerText: '#ffffff', navBg: '#18181b', navActive: '#a855f7', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true },
  
  // Original Themes
  perfumes: { name: 'العطور والتجميل', sub: 'ثيم أنيق وناعم للعطور والجمال', accentColor: '#db2777', accentHover: '#be185d', bgColor: '#fff1f2', cardColor: '#ffffff', textColor: '#4c0519', textMuted: '#9f1239', borderColor: '#ffe4e6', priceColor: '#db2777', saleColor: '#e11d48', successColor: '#10b981', headerFrom: '#db2777', headerTo: '#be185d', headerText: '#ffffff', navBg: '#ffffff', navActive: '#db2777', fontHeading: "'Amiri',serif", fontBody: "'Tajawal',sans-serif" },
  games: { name: 'الألعاب والجيمنج', sub: 'ثيم داكن حماسي لعشاق الألعاب والتقنية', accentColor: '#8b5cf6', accentHover: '#7c3aed', bgColor: '#0c0a0f', cardColor: '#171221', textColor: '#f5f3f7', textMuted: '#9ca3af', borderColor: '#2d2240', priceColor: '#8b5cf6', saleColor: '#ef4444', successColor: '#10b981', headerFrom: '#171221', headerTo: '#0c0a0f', headerText: '#f5f3f7', navBg: '#171221', navActive: '#8b5cf6', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true },
  fans: { name: 'المراوح والتبريد', sub: 'ثيم جليدي منعش للأجهزة والمراوح والتكييف', accentColor: '#0ea5e9', accentHover: '#0284c7', bgColor: '#f0f9ff', cardColor: '#ffffff', textColor: '#0369a1', textMuted: '#0ea5e9', borderColor: '#e0f2fe', priceColor: '#0ea5e9', saleColor: '#f97316', successColor: '#10b981', headerFrom: '#0ea5e9', headerTo: '#0284c7', headerText: '#ffffff', navBg: '#ffffff', navActive: '#0ea5e9', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  sweets: { name: 'الحلويات والمأكولات', sub: 'ثيم دافئ ومشهي للمطاعم والحلويات', accentColor: '#f43f5e', accentHover: '#e11d48', bgColor: '#fff5f5', cardColor: '#ffffff', textColor: '#4c0519', textMuted: '#9f1239', borderColor: '#ffe4e6', priceColor: '#f43f5e', saleColor: '#ea580c', successColor: '#10b981', headerFrom: '#f43f5e', headerTo: '#e11d48', headerText: '#ffffff', navBg: '#ffffff', navActive: '#f43f5e', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  sports: { name: 'الرياضة واللياقة', sub: 'ثيم قوي وحماسي للمستلزمات الرياضية والنوادي', accentColor: '#84cc16', accentHover: '#65a30d', bgColor: '#0f172a', cardColor: '#1e293b', textColor: '#f8fafc', textMuted: '#94a3b8', borderColor: '#334155', priceColor: '#84cc16', saleColor: '#f97316', successColor: '#10b981', headerFrom: '#1e293b', headerTo: '#0f172a', headerText: '#f8fafc', navBg: '#1e293b', navActive: '#84cc16', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true },
  cars: { name: 'السيارات والإكسسوارات', sub: 'ثيم كربون رياضي لقطع غيار وزينة السيارات', accentColor: '#e11d48', accentHover: '#be185d', bgColor: '#111111', cardColor: '#1c1c1c', textColor: '#ffffff', textMuted: '#9ca3af', borderColor: '#2e2e2e', priceColor: '#e11d48', saleColor: '#ea580c', successColor: '#10b981', headerFrom: '#1c1c1c', headerTo: '#111111', headerText: '#ffffff', navBg: '#1c1c1c', navActive: '#e11d48', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true },
  makeup: { name: 'المكياج والتجميل', sub: 'ثيم ناعم ومميز لمنتجات العناية والمكياج', accentColor: '#fda4af', accentHover: '#f43f5e', bgColor: '#fff1f2', cardColor: '#ffffff', textColor: '#4c0519', textMuted: '#be185d', borderColor: '#ffe4e6', priceColor: '#f43f5e', saleColor: '#db2777', successColor: '#10b981', headerFrom: '#fda4af', headerTo: '#f43f5e', headerText: '#4c0519', navBg: '#ffffff', navActive: '#fda4af', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  books: { name: 'الكتب والمكتبات', sub: 'ثيم كلاسيكي هادئ للكتب والقرطاسية والمطبوعات', accentColor: '#854d0e', accentHover: '#713f12', bgColor: '#fefcbf', cardColor: '#ffffff', textColor: '#451a03', textMuted: '#854d0e', borderColor: '#fef08a', priceColor: '#854d0e', saleColor: '#b45309', successColor: '#10b981', headerFrom: '#854d0e', headerTo: '#713f12', headerText: '#ffffff', navBg: '#ffffff', navActive: '#854d0e', fontHeading: "'Amiri',serif", fontBody: "'Tajawal',sans-serif" },
  kids: { name: 'الأطفال والألعاب', sub: 'ثيم مرح وملون لمنتجات وألعاب الأطفال', accentColor: '#38bdf8', accentHover: '#0ea5e9', bgColor: '#fffbeb', cardColor: '#ffffff', textColor: '#0f172a', textMuted: '#0ea5e9', borderColor: '#fde68a', priceColor: '#f43f5e', saleColor: '#ea580c', successColor: '#10b981', headerFrom: '#38bdf8', headerTo: '#0ea5e9', headerText: '#ffffff', navBg: '#ffffff', navActive: '#38bdf8', fontHeading: "'Cairo',sans-serif", fontBody: "'Tajawal',sans-serif" },
  watches:{name:'ساعات فاخرة',sub:'ذهبي وأسود ملكي',accentColor:'#d4af37',accentHover:'#b8901c',bgColor:'#090d16',cardColor:'#151b26',textColor:'#ffffff',textMuted:'#a0aec0',borderColor:'#2d3748',priceColor:'#d4af37',saleColor:'#e53e3e',successColor:'#48bb78',headerFrom:'#151b26',headerTo:'#090d16',headerText:'#ffffff',navBg:'#151b26',navActive:'#d4af37',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif",darkMode:true},
  bags:{name:'حقائب وشنط',sub:'جلد دافئ كلاسيكي',accentColor:'#b25a38',accentHover:'#8c4022',bgColor:'#faf7f2',cardColor:'#ffffff',textColor:'#2d1a12',textMuted:'#7a6b65',borderColor:'#ebdcd0',priceColor:'#b25a38',saleColor:'#dd6b20',successColor:'#38a169',headerFrom:'#b25a38',headerTo:'#8c4022',headerText:'#ffffff',navBg:'#ffffff',navActive:'#b25a38',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  jewelry:{name:'مجوهرات وذهب',sub:'زمردي ملكي وذهبي',accentColor:'#1b4d3e',accentHover:'#0e2e24',bgColor:'#fdfcf7',cardColor:'#ffffff',textColor:'#1b4d3e',textMuted:'#8b7d6b',borderColor:'#e2e8f0',priceColor:'#d4af37',saleColor:'#e53e3e',successColor:'#38a169',headerFrom:'#1b4d3e',headerTo:'#0e2e24',headerText:'#ffffff',navBg:'#ffffff',navActive:'#1b4d3e',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  shoes:{name:'أحذية رياضية',sub:'برتقالي رياضي جريء',accentColor:'#ff4500',accentHover:'#cc3700',bgColor:'#f4f4f5',cardColor:'#ffffff',textColor:'#18181b',textMuted:'#71717a',borderColor:'#e4e4e7',priceColor:'#ff4500',saleColor:'#ea580c',successColor:'#10b981',headerFrom:'#18181b',headerTo:'#09090b',headerText:'#ffffff',navBg:'#ffffff',navActive:'#ff4500',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  lighting:{name:'إنارة وإضاءة',sub:'توهج دافئ نيون',accentColor:'#fbbf24',accentHover:'#d97706',bgColor:'#111827',cardColor:'#1f2937',textColor:'#f9fafb',textMuted:'#9ca3af',borderColor:'#374151',priceColor:'#fbbf24',saleColor:'#f59e0b',successColor:'#10b981',headerFrom:'#1f2937',headerTo:'#111827',headerText:'#f9fafb',navBg:'#1f2937',navActive:'#fbbf24',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif",darkMode:true},
  laptops:{name:'لابتوبات وإلكترونيات',sub:'سيان تقني مظلم',accentColor:'#06b6d4',accentHover:'#0891b2',bgColor:'#0b0f19',cardColor:'#161f30',textColor:'#f8fafc',textMuted:'#94a3b8',borderColor:'#1e293b',priceColor:'#06b6d4',saleColor:'#f59e0b',successColor:'#10b981',headerFrom:'#161f30',headerTo:'#0b0f19',headerText:'#f8fafc',navBg:'#161f30',navActive:'#06b6d4',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif",darkMode:true},
  hometools:{name:'أدوات منزلية',sub:'تيل مريح وعملي',accentColor:'#0d9488',accentHover:'#0f766e',bgColor:'#f2f9f9',cardColor:'#ffffff',textColor:'#0f172a',textMuted:'#475569',borderColor:'#e2e8f0',priceColor:'#0d9488',saleColor:'#f59e0b',successColor:'#10b981',headerFrom:'#0d9488',headerTo:'#0f766e',headerText:'#ffffff',navBg:'#ffffff',navActive:'#0d9488',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  clothes:{name:'ملابس وأزياء',sub:'وردي موضة أنثوي',accentColor:'#db2777',accentHover:'#be185d',bgColor:'#fff1f2',cardColor:'#ffffff',textColor:'#4c0519',textMuted:'#9f1239',borderColor:'#ffe4e6',priceColor:'#db2777',saleColor:'#e11d48',successColor:'#10b981',headerFrom:'#db2777',headerTo:'#be185d',headerText:'#ffffff',navBg:'#ffffff',navActive:'#db2777',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  glasses:{name:'نظارات واكسسوارات',sub:'عشبي عصري رترو',accentColor:'#65a30d',accentHover:'#4d7c0f',bgColor:'#f7fee7',cardColor:'#ffffff',textColor:'#1a2e05',textMuted:'#4d7c0f',borderColor:'#ecfccb',priceColor:'#65a30d',saleColor:'#ea580c',successColor:'#10b981',headerFrom:'#65a30d',headerTo:'#4d7c0f',headerText:'#ffffff',navBg:'#ffffff',navActive:'#65a30d',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  classic:{name:'كلاسيكي أحمر',sub:'الافتراضي',accentColor:'#ef4444',accentHover:'#dc2626',bgColor:'#f8fafc',cardColor:'#ffffff',textColor:'#1e293b',textMuted:'#64748b',borderColor:'#e2e8f0',priceColor:'#ef4444',saleColor:'#ef4444',successColor:'#10b981',headerFrom:'#ef4444',headerTo:'#dc2626',headerText:'#ffffff',navBg:'#ffffff',navActive:'#ef4444',fontHeading:"'Tajawal',sans-serif",fontBody:"'Tajawal',sans-serif"},
  blue:{name:'أزرق احترافي',sub:'هادئ وموثوق',accentColor:'#2563eb',accentHover:'#1d4ed8',bgColor:'#f1f5f9',cardColor:'#ffffff',textColor:'#0f172a',textMuted:'#64748b',borderColor:'#e2e8f0',priceColor:'#2563eb',saleColor:'#f97316',successColor:'#10b981',headerFrom:'#3b82f6',headerTo:'#1d4ed8',headerText:'#ffffff',navBg:'#ffffff',navActive:'#2563eb',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  green:{name:'أخضر طبيعي',sub:'طازج وودود',accentColor:'#16a34a',accentHover:'#15803d',bgColor:'#f0fdf4',cardColor:'#ffffff',textColor:'#14532d',textMuted:'#52796f',borderColor:'#d9f99d',priceColor:'#16a34a',saleColor:'#ea580c',successColor:'#10b981',headerFrom:'#22c55e',headerTo:'#15803d',headerText:'#ffffff',navBg:'#ffffff',navActive:'#16a34a',fontHeading:"'Tajawal',sans-serif",fontBody:"'Tajawal',sans-serif"},
  purple:{name:'بنفسجي فاخر',sub:'عصري وجذاب',accentColor:'#7c3aed',accentHover:'#6d28d9',bgColor:'#faf5ff',cardColor:'#ffffff',textColor:'#2e1065',textMuted:'#7c3aed',borderColor:'#ede9fe',priceColor:'#7c3aed',saleColor:'#ec4899',successColor:'#10b981',headerFrom:'#8b5cf6',headerTo:'#6d28d9',headerText:'#ffffff',navBg:'#ffffff',navActive:'#7c3aed',fontHeading:"'Cairo',sans-serif",fontBody:"'Tajawal',sans-serif"},
  sunset:{name:'غروب دافئ',sub:'طاقة وإثارة',accentColor:'#f97316',accentHover:'#ea580c',bgColor:'#fff7ed',cardColor:'#ffffff',textColor:'#431407',textMuted:'#9a3412',borderColor:'#fed7aa',priceColor:'#f97316',saleColor:'#e11d48',successColor:'#10b981',headerFrom:'#fb923c',headerTo:'#e11d48',headerText:'#ffffff',navBg:'#ffffff',navActive:'#f97316',fontHeading:"'Amiri',serif",fontBody:"'Tajawal',sans-serif"},
  ocean:{name:'محيطي',sub:'انسيابي',accentColor:'#0891b2',accentHover:'#0e7490',bgColor:'#ecfeff',cardColor:'#ffffff',textColor:'#083344',textMuted:'#0e7490',borderColor:'#cffafe',priceColor:'#0891b2',saleColor:'#db2777',successColor:'#10b981',headerFrom:'#06b6d4',headerTo:'#0e7490',headerText:'#ffffff',navBg:'#ffffff',navActive:'#0891b2',fontHeading:"'Tajawal',sans-serif",fontBody:"'Noto Sans Arabic',sans-serif"},
  minimal:{name:'أبيض مينيمال',sub:'نظيف وبسيط',accentColor:'#111827',accentHover:'#374151',bgColor:'#ffffff',cardColor:'#ffffff',textColor:'#111827',textMuted:'#9ca3af',borderColor:'#f3f4f6',priceColor:'#111827',saleColor:'#ef4444',successColor:'#10b981',headerFrom:'#ffffff',headerTo:'#f3f4f6',headerText:'#111827',navBg:'#ffffff',navActive:'#111827',fontHeading:"'Almarai',sans-serif",fontBody:"'Almarai',sans-serif"},
  dark: { name: 'داكن أنيق', sub: 'ليلي', accentColor: '#f43f5e', accentHover: '#e11d48', bgColor: '#000000', cardColor: '#101010', textColor: '#f8fafc', textMuted: '#94a3b8', borderColor: '#334155', priceColor: '#f43f5e', saleColor: '#f59e0b', successColor: '#10b981', headerFrom: '#101010', headerTo: '#000000', headerText: '#f8fafc', navBg: '#101010', navActive: '#f43f5e', fontHeading: "'Tajawal',sans-serif", fontBody: "'Tajawal',sans-serif", darkMode: true }
};

function getDefaultAppearance() {
  return {
    accentColor:'#ef4444',accentHover:'#dc2626',bgColor:'#f8fafc',cardColor:'#ffffff',textColor:'#1e293b',textMuted:'#64748b',borderColor:'#e2e8f0',priceColor:'#ef4444',saleColor:'#ef4444',successColor:'#10b981',
    darkMode:false,fontHeading:"'Tajawal',sans-serif",fontBody:"'Tajawal',sans-serif",fontSize:15,headingScale:1,fontWeight:700,lineHeight:1.5,
    showBanners:true,showFlashSales:true,showFeatured:true,showCategories:true,showBrands:true,gridColsDesktop:6,gridColsTablet:3,gridColsMobile:2,gridGap:14,
    imgRatio:'3/4',imgRadius:12,imgHoverZoom:true,imgLazyLoad:true,
    cardRadius:16,btnRadius:12,cardStyle:'outline',btnStyle:'outline',shadows:true,shadowIntensity:1,
    cardImgNav:'dots',
    stickyHeader:true,showSearch:true,showWishlist:true,headerFrom:'#ef4444',headerTo:'#dc2626',headerText:'#ffffff',headerPadding:40,
    navStyle:'default',showCartCount:true,showNavLabels:true,navBg:'#ffffff',navActive:'#ef4444',
    showBrand:true,showOldPrice:true,showDiscountBadge:true,showQuickAdd:true,
    pagePadding:16,sectionGap:24
  };
}

function loadAppearance() {
  const data = Object.assign(getDefaultAppearance(), JSON.parse(localStorage.getItem('mycart_appearance')) || {});
  applyAppearance(data);
}

function applyAppearance(data) {
  const d = Object.assign(getDefaultAppearance(), data || {});
  window.__appearanceData = d;
  const root = document.documentElement;

  root.style.setProperty('--accent', d.accentColor);
  root.style.setProperty('--accent-hover', d.accentHover);
  root.style.setProperty('--bg', d.bgColor);
  root.style.setProperty('--card', d.cardColor);
  root.style.setProperty('--text', d.textColor);
  root.style.setProperty('--text-muted', d.textMuted);
  root.style.setProperty('--border', d.borderColor);
  root.style.setProperty('--price-color', d.priceColor);
  root.style.setProperty('--sale-color', d.saleColor);
  root.style.setProperty('--success-color', d.successColor);
  root.style.setProperty('--whatsapp', d.successColor);

  root.style.setProperty('--font-heading', d.fontHeading);
  root.style.setProperty('--font-body', d.fontBody);
  root.style.setProperty('--font-size-base', d.fontSize + 'px');
  root.style.setProperty('--heading-scale', d.headingScale);
  root.style.setProperty('--font-weight', d.fontWeight);
  root.style.setProperty('--line-height', d.lineHeight);

  root.style.setProperty('--grid-cols-desktop', d.gridColsDesktop);
  root.style.setProperty('--grid-cols-tablet', d.gridColsTablet);
  root.style.setProperty('--grid-cols-mobile', d.gridColsMobile);
  root.style.setProperty('--grid-gap', d.gridGap + 'px');

  root.style.setProperty('--img-ratio', d.imgRatio);
  root.style.setProperty('--img-radius', d.imgRadius + 'px');

  root.style.setProperty('--card-radius', d.cardRadius + 'px');
  root.style.setProperty('--btn-radius', d.btnRadius + 'px');

  const m = (d.shadowIntensity || 1);
  if (d.shadows) {
    root.style.setProperty('--shadow-sm', `0 1px 2px rgba(0,0,0,${0.05*m})`);
    root.style.setProperty('--shadow-md', `0 4px 6px rgba(0,0,0,${0.07*m})`);
    root.style.setProperty('--shadow-lg', `0 10px 25px rgba(0,0,0,${0.1*m})`);
  } else {
    root.style.setProperty('--shadow-sm', 'none');
    root.style.setProperty('--shadow-md', 'none');
    root.style.setProperty('--shadow-lg', 'none');
  }

  root.style.setProperty('--header-from', d.headerFrom);
  root.style.setProperty('--header-to', d.headerTo);
  root.style.setProperty('--header-text', d.headerText);
  root.style.setProperty('--header-padding', d.headerPadding + 'px');

  root.style.setProperty('--nav-bg', d.navBg);
  root.style.setProperty('--nav-active', d.navActive);

  root.style.setProperty('--page-padding', d.pagePadding + 'px');
  root.style.setProperty('--section-gap', d.sectionGap + 'px');

  // Body classes
  document.body.classList.toggle('dark-mode', !!d.darkMode);
  ['show-banners','show-flash-sales','show-featured','show-categories','show-brands','show-search','show-wishlist','show-cart-count','show-brand','show-old-price','show-discount-badge','show-quick-add','show-nav-labels','img-hover-zoom','img-lazy-load','sticky-header'].forEach(c => {
    const key = c.replace(/-([a-z])/g, (_,l) => l.toUpperCase());
    document.body.classList.toggle(c, d[key] !== false);
  });
  document.body.classList.remove('card-style-shadow','card-style-outline','card-style-flat');
  document.body.classList.add('card-style-' + (d.cardStyle || 'shadow'));
  document.body.classList.remove('btn-style-solid','btn-style-outline','btn-style-soft');
  document.body.classList.add('btn-style-' + (d.btnStyle || 'solid'));
  document.body.classList.remove('nav-style-default','nav-style-pill','nav-style-minimal');
  document.body.classList.add('nav-style-' + (d.navStyle || 'default'));

  if (typeof renderProducts === 'function' && typeof getFilteredProducts === 'function') {
    try { renderProducts(getFilteredProducts()); } catch(e) {}
  }
}

function toggleLayoutClass(className, enabled) {
  if (enabled) document.body.classList.add(className);
  else document.body.classList.remove(className);
}

function shadeColor(color, percent) {
  const num = parseInt((color || '#000000').replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function readAppearanceForm() {
  const data = getDefaultAppearance();
  APPEARANCE_FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    if (f.type === 'checkbox') data[f.key] = el.checked;
    else if (f.type === 'range') data[f.key] = parseFloat(el.value) * (f.scale || 1);
    else data[f.key] = el.value;
  });
  return data;
}

function fillAppearanceForm(data) {
  APPEARANCE_FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    let v = data[f.key];
    if (v === undefined) return;
    if (f.type === 'checkbox') el.checked = !!v;
    else if (f.type === 'range') el.value = Math.round((f.scale ? v / f.scale : v));
    else el.value = v;
    const span = document.getElementById(f.id + 'Val');
    if (span) {
      let disp = (f.type === 'color') ? v : (f.scale ? (v / f.scale) : v);
      if (f.id === 'appHeadingScale') span.textContent = Math.round(v*100) + '%';
      else if (f.id === 'appLineHeight') span.textContent = (v).toFixed(1);
      else if (f.id === 'appShadowIntensity') span.textContent = Math.round(v*100) + '%';
      else if (f.type === 'range') span.textContent = disp + (f.id==='appFontSize'||f.id==='appImgRadius'||f.id==='appCardRadius'||f.id==='appBtnRadius'||f.id==='appGridGap'||f.id==='appHeaderPadding'||f.id==='appPagePadding'||f.id==='appSectionGap'?'px':'');
      else if (f.type === 'color') span.textContent = v;
    }
  });
}

function adminRenderAppearance() {
  const host = document.getElementById('admin-appearance');
  if (!host) return;
  if (!host.dataset.rendered) {
    host.innerHTML = `
      <div class="section-header">
        <h3>المظهر والتخطيط</h3>
        <div style="margin-right:auto;display:flex;gap:8px;flex-wrap:wrap">
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="resetAppearance()"><i class="fa-solid fa-rotate-left"></i> إعادة تعيين</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="exportAppearance()"><i class="fa-solid fa-file-export"></i> تصدير</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="document.getElementById('importAppearanceFile').click()"><i class="fa-solid fa-file-import"></i> استيراد</button>
          <input type="file" id="importAppearanceFile" accept=".json" style="display:none" onchange="importAppearance(event)">
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="saveAppearance()"><i class="fa-solid fa-floppy-disk"></i> حفظ المظهر</button>
        </div>
      </div>
      <div class="app-admin-row" style="display:flex;gap:16px;align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div class="appearance-layout">
            <nav class="appearance-nav">
              <button class="app-nav-btn active" data-sec="presets" onclick="switchAppSec(this)"><i class="fa-solid fa-wand-magic-sparkles"></i> الثيمات الجاهزة</button>
              <button class="app-nav-btn" data-sec="colors" onclick="switchAppSec(this)"><i class="fa-solid fa-palette"></i> الألوان</button>
              <button class="app-nav-btn" data-sec="typography" onclick="switchAppSec(this)"><i class="fa-solid fa-font"></i> الخطوط</button>
              <button class="app-nav-btn" data-sec="layout" onclick="switchAppSec(this)"><i class="fa-solid fa-columns"></i> التخطيط</button>
              <button class="app-nav-btn" data-sec="images" onclick="switchAppSec(this)"><i class="fa-solid fa-image"></i> صور المنتجات</button>
              <button class="app-nav-btn" data-sec="cards" onclick="switchAppSec(this)"><i class="fa-solid fa-border-all"></i> البطاقات والأزرار</button>
              <button class="app-nav-btn" data-sec="header" onclick="switchAppSec(this)"><i class="fa-solid fa-mobile-screen"></i> الهيدر</button>
              <button class="app-nav-btn" data-sec="nav" onclick="switchAppSec(this)"><i class="fa-solid fa-bars"></i> التنقل السفلي</button>
              <button class="app-nav-btn" data-sec="product" onclick="switchAppSec(this)"><i class="fa-solid fa-tags"></i> عناصر المنتج</button>
              <button class="app-nav-btn" data-sec="spacing" onclick="switchAppSec(this)"><i class="fa-solid fa-arrows-left-right"></i> المسافات</button>
            </nav>
            <div class="appearance-panels">
              <section class="app-panel active" id="appsec-presets">
                <h4 class="app-sec-title"><i class="fa-solid fa-wand-magic-sparkles"></i> ثيمات جاهزة</h4>
                <p class="app-sec-desc">اختر ثيماً جاهزاً يطبّق مجموعة متناسقة من الألوان والخطوط دفعة واحدة.</p>
                <div class="preset-grid" id="presetGrid"></div>
              </section>
              <section class="app-panel" id="appsec-colors">
                <h4 class="app-sec-title"><i class="fa-solid fa-palette"></i> الألوان</h4>
                <div class="app-fields">
                  <div class="app-field"><label>اللون الأساسي (Accent)</label><div class="color-row"><input type="color" id="appAccent" oninput="updVal('appAccent');previewAppearance();liveAppPreview()"><span id="appAccentVal" class="color-val">#ef4444</span></div></div>
                  <div class="app-field"><label>لون التمرير (Accent Hover)</label><div class="color-row"><input type="color" id="appAccentHover" oninput="updVal('appAccentHover');previewAppearance();liveAppPreview()"><span id="appAccentHoverVal" class="color-val">#dc2626</span></div></div>
                  <div class="app-field"><label>لون الخلفية</label><div class="color-row"><input type="color" id="appBgColor" oninput="updVal('appBgColor');previewAppearance();liveAppPreview()"><span id="appBgColorVal" class="color-val">#f8fafc</span></div></div>
                  <div class="app-field"><label>لون البطاقات</label><div class="color-row"><input type="color" id="appCardColor" oninput="updVal('appCardColor');previewAppearance();liveAppPreview()"><span id="appCardColorVal" class="color-val">#ffffff</span></div></div>
                  <div class="app-field"><label>لون النصوص</label><div class="color-row"><input type="color" id="appTextColor" oninput="updVal('appTextColor');previewAppearance();liveAppPreview()"><span id="appTextColorVal" class="color-val">#1e293b</span></div></div>
                  <div class="app-field"><label>لون النصوص الخافتة</label><div class="color-row"><input type="color" id="appTextMuted" oninput="updVal('appTextMuted');previewAppearance();liveAppPreview()"><span id="appTextMutedVal" class="color-val">#64748b</span></div></div>
                  <div class="app-field"><label>لون الحدود</label><div class="color-row"><input type="color" id="appBorderColor" oninput="updVal('appBorderColor');previewAppearance();liveAppPreview()"><span id="appBorderColorVal" class="color-val">#e2e8f0</span></div></div>
                  <div class="app-field"><label>لون السعر</label><div class="color-row"><input type="color" id="appPriceColor" oninput="updVal('appPriceColor');previewAppearance();liveAppPreview()"><span id="appPriceColorVal" class="color-val">#ef4444</span></div></div>
                  <div class="app-field"><label>لون شارة الخصم</label><div class="color-row"><input type="color" id="appSaleColor" oninput="updVal('appSaleColor');previewAppearance();liveAppPreview()"><span id="appSaleColorVal" class="color-val">#ef4444</span></div></div>
                  <div class="app-field"><label>لون النجاح (تأكيد/وتساب)</label><div class="color-row"><input type="color" id="appSuccessColor" oninput="updVal('appSuccessColor');previewAppearance()"><span id="appSuccessColorVal" class="color-val">#10b981</span></div></div>
                  <div class="app-field app-field-full"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="appDarkMode" onchange="previewAppearance();liveAppPreview()"> تفعيل الوضع الداكن افتراضياً</label></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-typography">
                <h4 class="app-sec-title"><i class="fa-solid fa-font"></i> الخطوط</h4>
                <div class="app-fields">
                  <div class="app-field"><label>خط العناوين</label><select id="appFontHeading" onchange="previewAppearance();liveAppPreview()"><option value="'Tajawal',sans-serif">Tajawal</option><option value="'Cairo',sans-serif">Cairo</option><option value="'Amiri',serif">Amiri</option><option value="'Noto Sans Arabic',sans-serif">Noto Sans Arabic</option><option value="'Almarai',sans-serif">Almarai</option></select></div>
                  <div class="app-field"><label>خط المحتوى</label><select id="appFontBody" onchange="previewAppearance();liveAppPreview()"><option value="'Tajawal',sans-serif">Tajawal</option><option value="'Cairo',sans-serif">Cairo</option><option value="'Amiri',serif">Amiri</option><option value="'Noto Sans Arabic',sans-serif">Noto Sans Arabic</option><option value="'Almarai',sans-serif">Almarai</option></select></div>
                  <div class="app-field"><label>حجم الخط الأساسي</label><div class="color-row"><input type="range" id="appFontSize" min="13" max="18" value="15" oninput="updVal('appFontSize','px');previewAppearance();liveAppPreview()"><span id="appFontSizeVal" class="color-val">15px</span></div></div>
                  <div class="app-field"><label>مقياس العناوين</label><div class="color-row"><input type="range" id="appHeadingScale" min="90" max="130" value="100" oninput="updVal('appHeadingScale','%');previewAppearance()"><span id="appHeadingScaleVal" class="color-val">100%</span></div></div>
                  <div class="app-field"><label>وزن الخط</label><select id="appFontWeight" onchange="previewAppearance();liveAppPreview()"><option value="400">عادي</option><option value="500">متوسط</option><option value="700" selected>عريض</option><option value="800">عريض جداً</option></select></div>
                  <div class="app-field"><label>ارتفاع السطر</label><div class="color-row"><input type="range" id="appLineHeight" min="13" max="20" value="15" oninput="updVal('appLineHeight','.');previewAppearance();liveAppPreview()"><span id="appLineHeightVal" class="color-val">1.5</span></div></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-layout">
                <h4 class="app-sec-title"><i class="fa-solid fa-columns"></i> تخطيط الصفحة الرئيسية</h4>
                <div class="app-fields">
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appShowBanners" onchange="previewAppearance();liveAppPreview()"> البانرات</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowFlashSales" onchange="previewAppearance();liveAppPreview()"> عروض فلاش</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowFeatured" onchange="previewAppearance();liveAppPreview()"> المميزة</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowCategories" onchange="previewAppearance();liveAppPreview()"> التصنيفات</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowBrands" onchange="previewAppearance();liveAppPreview()"> الماركات</label>
                  </div>
                  <div class="app-field"><label>أعمدة (كمبيوتر)</label><select id="appGridColsDesktop" onchange="previewAppearance();liveAppPreview()"><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6" selected>6</option><option value="7">7</option></select></div>
                  <div class="app-field"><label>أعمدة (تابلت)</label><select id="appGridColsTablet" onchange="previewAppearance();liveAppPreview()"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></div>
                  <div class="app-field"><label>أعمدة (جوال)</label><select id="appGridColsMobile" onchange="previewAppearance();liveAppPreview()"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option></select></div>
                  <div class="app-field"><label>تباعد الشبكة</label><div class="color-row"><input type="range" id="appGridGap" min="6" max="24" value="14" oninput="updVal('appGridGap','px');previewAppearance();liveAppPreview()"><span id="appGridGapVal" class="color-val">14px</span></div></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-images">
                <h4 class="app-sec-title"><i class="fa-solid fa-image"></i> صور المنتجات</h4>
                <div class="app-fields">
                  <div class="app-field"><label>نسبة الصورة</label><select id="appImgRatio" onchange="previewAppearance();liveAppPreview()"><option value="1">مربع 1:1</option><option value="4/3">4:3</option><option value="3/4" selected>3:4 عمودي</option><option value="2/3">2:3 عمودي مطول</option><option value="9/16">9:16 عمودي كامل</option><option value="16/9">16:9 عرضي</option><option value="3/2">3:2 عرضي كلاسيكي</option><option value="5/4">5:4 شبه مربع</option></select></div>
                  <div class="app-field"><label>زوايا الصورة</label><div class="color-row"><input type="range" id="appImgRadius" min="0" max="24" value="12" oninput="updVal('appImgRadius','px');previewAppearance();liveAppPreview()"><span id="appImgRadiusVal" class="color-val">12px</span></div></div>
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appImgHoverZoom" onchange="previewAppearance()"> تكبير عند التحويم</label>
                    <label class="app-toggle"><input type="checkbox" id="appImgLazyLoad" onchange="previewAppearance()"> تحميل كسول</label>
                  </div>
                </div>
              </section>
              <section class="app-panel" id="appsec-cards">
                <h4 class="app-sec-title"><i class="fa-solid fa-border-all"></i> البطاقات والأزرار</h4>
                <div class="app-fields">
                  <div class="app-field"><label>زوايا البطاقات</label><div class="color-row"><input type="range" id="appCardRadius" min="0" max="28" value="16" oninput="updVal('appCardRadius','px');previewAppearance();liveAppPreview()"><span id="appCardRadiusVal" class="color-val">16px</span></div></div>
                  <div class="app-field"><label>زوايا الأزرار</label><div class="color-row"><input type="range" id="appBtnRadius" min="0" max="28" value="12" oninput="updVal('appBtnRadius','px');previewAppearance();liveAppPreview()"><span id="appBtnRadiusVal" class="color-val">12px</span></div></div>
                  <div class="app-field"><label>ستايل البطاقة</label><select id="appCardStyle" onchange="previewAppearance();liveAppPreview()"><option value="shadow">ظل</option><option value="outline" selected>إطار</option><option value="flat">مسطح</option></select></div>
                  <div class="app-field"><label>ستايل الزر</label><select id="appBtnStyle" onchange="previewAppearance();liveAppPreview()"><option value="solid">معبأ</option><option value="outline" selected>إطار</option><option value="soft">ناعم</option></select></div>
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appShadows" onchange="previewAppearance();liveAppPreview()"> تفعيل الظلال</label>
                  </div>
                  <div class="app-field"><label>طريقة عرض صور المنتج في البطاقة</label><select id="appCardImgNav" onchange="previewAppearance();liveAppPreview()"><option value="dots" selected>نقاط تنقّل</option><option value="thumbs">صور مصغرة (عيني)</option><option value="none">إيقاف (الصورة الأولى فقط)</option></select></div>
                  <div class="app-field"><label>شدة الظل</label><div class="color-row"><input type="range" id="appShadowIntensity" min="0" max="200" value="100" oninput="updVal('appShadowIntensity','%');previewAppearance();liveAppPreview()"><span id="appShadowIntensityVal" class="color-val">100%</span></div></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-header">
                <h4 class="app-sec-title"><i class="fa-solid fa-mobile-screen"></i> الهيدر</h4>
                <div id="admin-header-deco"></div>
                <div class="app-fields">
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appStickyHeader" onchange="previewAppearance();liveAppPreview()"> هيدر ثابت</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowSearch" onchange="previewAppearance();liveAppPreview()"> زر البحث</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowWishlist" onchange="previewAppearance();liveAppPreview()"> المفضلة</label>
                  </div>
                  <div class="app-field"><label>بداية تدرج الهيدر</label><div class="color-row"><input type="color" id="appHeaderFrom" oninput="updVal('appHeaderFrom');previewAppearance();liveAppPreview()"><span id="appHeaderFromVal" class="color-val">#ef4444</span></div></div>
                  <div class="app-field"><label>نهاية تدرج الهيدر</label><div class="color-row"><input type="color" id="appHeaderTo" oninput="updVal('appHeaderTo');previewAppearance();liveAppPreview()"><span id="appHeaderToVal" class="color-val">#dc2626</span></div></div>
                  <div class="app-field"><label>لون نص الهيدر</label><div class="color-row"><input type="color" id="appHeaderText" oninput="updVal('appHeaderText');previewAppearance();liveAppPreview()"><span id="appHeaderTextVal" class="color-val">#ffffff</span></div></div>
                  <div class="app-field"><label>ارتفاع الهيدر</label><div class="color-row"><input type="range" id="appHeaderPadding" min="20" max="70" value="40" oninput="updVal('appHeaderPadding','px');previewAppearance();liveAppPreview()"><span id="appHeaderPaddingVal" class="color-val">40px</span></div></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-nav">
                <h4 class="app-sec-title"><i class="fa-solid fa-bars"></i> التنقل السفلي</h4>
                <div class="app-fields">
                  <div class="app-field"><label>النمط</label><select id="appNavStyle" onchange="previewAppearance();liveAppPreview()"><option value="default" selected>افتراضي</option><option value="pill">أقراص</option><option value="minimal">مبسط</option></select></div>
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appShowCartCount" onchange="previewAppearance();liveAppPreview()"> عداد السلة</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowNavLabels" onchange="previewAppearance();liveAppPreview()"> تسميات الأيقونات</label>
                  </div>
                  <div class="app-field"><label>خلفية التنقل</label><div class="color-row"><input type="color" id="appNavBg" oninput="updVal('appNavBg');previewAppearance();liveAppPreview()"><span id="appNavBgVal" class="color-val">#ffffff</span></div></div>
                  <div class="app-field"><label>لون العنصر النشط</label><div class="color-row"><input type="color" id="appNavActive" oninput="updVal('appNavActive');previewAppearance();liveAppPreview()"><span id="appNavActiveVal" class="color-val">#ef4444</span></div></div>
                </div>
              </section>
              <section class="app-panel" id="appsec-product">
                <h4 class="app-sec-title"><i class="fa-solid fa-tags"></i> عناصر المنتج</h4>
                <div class="app-fields">
                  <div class="app-field app-field-full app-toggles">
                    <label class="app-toggle"><input type="checkbox" id="appShowBrand" onchange="previewAppearance();liveAppPreview()"> الماركة</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowOldPrice" onchange="previewAppearance();liveAppPreview()"> السعر القديم</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowDiscountBadge" onchange="previewAppearance();liveAppPreview()"> شارة الخصم</label>
                    <label class="app-toggle"><input type="checkbox" id="appShowQuickAdd" onchange="previewAppearance();liveAppPreview()"> زر الإضافة السريعة</label>
                  </div>
                </div>
              </section>
              <section class="app-panel" id="appsec-spacing">
                <h4 class="app-sec-title"><i class="fa-solid fa-arrows-left-right"></i> المسافات</h4>
                <div class="app-fields">
                  <div class="app-field"><label>هامش الصفحة</label><div class="color-row"><input type="range" id="appPagePadding" min="0" max="32" value="16" oninput="updVal('appPagePadding','px');previewAppearance();liveAppPreview()"><span id="appPagePaddingVal" class="color-val">16px</span></div></div>
                  <div class="app-field"><label>تباعد الأقسام</label><div class="color-row"><input type="range" id="appSectionGap" min="8" max="48" value="24" oninput="updVal('appSectionGap','px');previewAppearance();liveAppPreview()"><span id="appSectionGapVal" class="color-val">24px</span></div></div>
                </div>
              </section>
            </div>
          </div>
        </div>
        <!-- Live Preview -->
        <div class="app-preview-col" style="width:240px;flex-shrink:0;position:sticky;top:0">
          <div style="font-size:.65rem;font-weight:800;color:#64748b;margin-bottom:6px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-eye" style="color:#8b5cf6"></i> معاينة حية</div>
          <div class="app-preview-box" id="appPreviewBox">
            <div class="preview-h" id="previewHeaderG"><span><i class="fa-solid fa-store"></i></span><strong id="previewStoreNameG">متجري</strong><i class="fa-solid fa-bars"></i></div>
            <div class="preview-body">
              <div class="preview-card" id="previewCardG">
                <div class="thumb" id="previewThumbG"></div>
                <div class="info"><div class="line" style="width:70%"></div><div class="line" style="width:40%"></div><div class="line" style="width:55%;height:10px;border-radius:4px"></div></div>
              </div>
            </div>
            <div class="preview-nav" id="previewNavG"><span class="active">الرئيسية</span><span>منتجات</span><span>عروض</span><span>اتصل</span></div>
          </div>
          <div style="margin-top:6px;font-size:.55rem;color:#94a3b8;text-align:center">التغييرات تظهر فوراً</div>
        </div>
      </div>
      <div id="appearanceStatus" style="font-size:.8rem;color:var(--text-muted);margin-top:12px"></div>`;
    host.dataset.rendered = '1';
  }
  adminLoadAppearance();
  setTimeout(liveAppPreview, 100);
  setTimeout(adminRenderHeaderDeco, 50);
}

function liveAppPreview() {
  var d = readAppearanceForm();
  var activeSec = document.querySelector('.app-nav-btn.active');
  var sec = activeSec ? activeSec.dataset.sec : 'colors';
  var box = document.getElementById('appPreviewBox');
  if (!box) return;

  var headerDecoClass = '';
  try { var hd = JSON.parse(localStorage.getItem('mycart_header_deco')) || {}; if (hd.style && hd.style !== 'none') headerDecoClass = ' header-deco-' + hd.style; } catch(e) {}
  var headerHtml = '<div class="preview-h'+headerDecoClass+'" id="previewHeaderG" style="background:linear-gradient(135deg,'+d.headerFrom+','+d.headerTo+');color:'+d.headerText+';position:relative;overflow:hidden"><span><i class="fa-solid fa-store"></i></span><strong style="color:'+d.headerText+'">متجري</strong><i class="fa-solid fa-bars"></i></div>';
  var navHtml = '<div class="preview-nav" id="previewNavG" style="background:'+d.navBg+'"><span style="background:'+d.navActive+';color:#fff">الرئيسية</span><span>منتجات</span><span>عروض</span><span>اتصل</span></div>';

  var bodyHtml = '';
  if (sec === 'presets') {
    bodyHtml = '<div style="padding:12px;text-align:center"><i class="fa-solid fa-wand-magic-sparkles" style="font-size:1.5rem;color:'+d.accentColor+';margin-bottom:8px;display:block"></i><div style="font-size:.7rem;color:#64748b">اختر ثيماً لتطبيق ألوان متناسقة</div><div style="display:flex;gap:4px;justify-content:center;margin-top:8px">'+Object.entries(THEME_PRESETS).slice(0,4).map(function(p){return '<div style="width:16px;height:16px;border-radius:50%;background:'+p[1].accentColor+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.15)"></div>';}).join('')+'<div style="font-size:.55rem;color:#94a3b8;margin-right:4px">+أكثر</div></div></div>';
  } else if (sec === 'colors') {
    bodyHtml = '<div style="padding:12px"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.accentColor+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.1)"></div><span style="font-size:.5rem;color:#64748b">أساسي</span></div>'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.bgColor+';border:2px solid #e2e8f0"></div><span style="font-size:.5rem;color:#64748b">خلفية</span></div>'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.cardColor+';border:2px solid #e2e8f0"></div><span style="font-size:.5rem;color:#64748b">بطاقات</span></div>'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.priceColor+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.1)"></div><span style="font-size:.5rem;color:#64748b">سعر</span></div>'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.textColor+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.1)"></div><span style="font-size:.5rem;color:#64748b">نصوص</span></div>'
      + '<div style="text-align:center"><div style="width:100%;height:28px;border-radius:8px;background:'+d.borderColor+';border:2px solid #fff"></div><span style="font-size:.5rem;color:#64748b">حدود</span></div>'
      + '</div></div>';
  } else if (sec === 'typography') {
    bodyHtml = '<div style="padding:12px;text-align:center">'
      + '<div style="font-size:'+Math.round(d.fontSize*1.8)+'px;font-weight:'+d.fontWeight+';line-height:'+d.lineHeight+';color:'+d.textColor+';margin-bottom:4px;font-family:'+d.fontHeading+'">عناوين</div>'
      + '<div style="font-size:'+d.fontSize+'px;font-weight:400;line-height:'+d.lineHeight+';color:'+d.textMuted+';font-family:'+d.fontBody+'">نصوص المحتوى الأساسية تظهر بهذا الشكل</div>'
      + '<div style="margin-top:8px;display:flex;gap:6px;justify-content:center">'
      + '<span style="font-size:.65rem;background:'+d.accentColor+';color:#fff;padding:2px 10px;border-radius:'+d.btnRadius+'px;font-weight:800">زر</span>'
      + '<span style="font-size:.65rem;border:1.5px solid '+d.accentColor+';color:'+d.accentColor+';padding:2px 10px;border-radius:'+d.btnRadius+'px;font-weight:800">إطار</span>'
      + '</div></div>';
  } else if (sec === 'layout') {
    bodyHtml = '<div style="padding:12px">'
      + '<div style="display:grid;grid-template-columns:repeat('+Math.min(d.gridColsDesktop,4)+',1fr);gap:4px;margin-bottom:6px">'
      + Array(Math.min(d.gridColsDesktop,4)).fill(0).map(function(){return '<div style="aspect-ratio:'+d.imgRatio+';background:'+d.borderColor+';border-radius:'+d.imgRadius+'px"></div>';}).join('')
      + '</div>'
      + '<div style="font-size:.55rem;color:#94a3b8;text-align:center">'+d.gridColsDesktop+' أعمدة • تباعد '+d.gridGap+'px</div></div>';
  } else if (sec === 'images') {
    var rat = d.imgRatio.split('/'); var ratioH = rat.length===2 ? Math.round(100 * parseInt(rat[1]) / parseInt(rat[0])) : 100;
    bodyHtml = '<div style="padding:12px;text-align:center">'
      + '<div style="width:100px;height:'+ratioH+'px;background:linear-gradient(135deg,'+d.bgColor+','+d.borderColor+');border-radius:'+d.imgRadius+'px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;border:1px solid '+d.borderColor+'"><i class="fa-solid fa-image" style="color:'+d.textMuted+';opacity:.4;font-size:1.2rem"></i></div>'
      + '<div style="font-size:.55rem;color:#94a3b8">نسبة '+d.imgRatio+' • تدوير '+d.imgRadius+'px</div></div>';
  } else if (sec === 'cards') {
    bodyHtml = '<div style="padding:12px">'
      + '<div style="border:'+(d.cardStyle==='outline'?'1.5px solid '+d.borderColor:'none')+';border-radius:'+d.cardRadius+'px;padding:12px;background:'+d.cardColor+';box-shadow:'+(d.shadows&&d.cardStyle!=='flat'?'0 2px 8px rgba(0,0,0,'+(0.05*d.shadowIntensity)+')':'none')+'">'
      + '<div style="display:flex;gap:8px;align-items:center">'
      + '<div style="width:36px;height:36px;border-radius:'+d.imgRadius+'px;background:'+d.bgColor+';flex-shrink:0"></div>'
      + '<div style="flex:1"><div style="height:6px;width:70%;background:'+d.textMuted+';border-radius:999px;margin-bottom:4px;opacity:.3"></div><div style="height:8px;width:40%;background:'+d.priceColor+';border-radius:4px"></div></div>'
      + '</div></div>'
      + '<div style="display:flex;gap:4px;margin-top:6px;justify-content:center">'
      + '<span style="font-size:.6rem;background:'+d.accentColor+';color:#fff;padding:3px 12px;border-radius:'+d.btnRadius+'px;font-weight:800">صلب</span>'
      + '<span style="font-size:.6rem;border:1.5px solid '+d.accentColor+';color:'+d.accentColor+';padding:3px 12px;border-radius:'+d.btnRadius+'px;font-weight:800">حدود</span>'
      + '</div></div>';
  } else if (sec === 'header') {
    bodyHtml = '<div style="padding:0">'+headerHtml.replace('previewHeaderG','previewHeaderG2').replace('style="','style="padding:10px 14px;font-size:85%;')+'</div>'
      + '<div style="padding:10px 12px;text-align:center"><div style="font-size:.55rem;color:#94a3b8">ارتفاع: '+d.headerPadding+'px • '+(d.stickyHeader?'ثابت':'غير ثابت')+'</div>'
      + '<div style="display:flex;gap:4px;justify-content:center;margin-top:4px"><span style="font-size:.55rem;background:rgba(0,0,0,.05);padding:2px 6px;border-radius:4px"><i class="fa-solid fa-magnifying-glass"></i> '+(d.showSearch?'ظاهر':'مخفي')+'</span><span style="font-size:.55rem;background:rgba(0,0,0,.05);padding:2px 6px;border-radius:4px"><i class="fa-solid fa-heart"></i> '+(d.showWishlist?'ظاهر':'مخفي')+'</span></div></div>';
  } else if (sec === 'nav') {
    bodyHtml = '<div style="padding:0">'
      + '<div class="preview-nav" style="background:'+d.navBg+';justify-content:center">'
      + '<span style="background:'+d.navActive+';color:#fff;border-radius:'+(d.navStyle==='pill'?'999px':'8px')+'">الرئيسية</span>'
      + '<span style="color:'+d.textMuted+'">منتجات</span>'
      + '<span style="color:'+d.textMuted+'">عروض</span>'
      + '<span style="color:'+d.textMuted+'">اتصل</span>'
      + '</div></div>';
  } else if (sec === 'product') {
    bodyHtml = '<div style="padding:12px">'
      + '<div style="display:flex;gap:8px;align-items:center;border:1px solid '+d.borderColor+';border-radius:'+d.cardRadius+'px;padding:8px;background:'+d.cardColor+'">'
      + '<div style="width:40px;height:40px;border-radius:'+d.imgRadius+'px;background:'+d.bgColor+';flex-shrink:0"></div>'
      + '<div style="flex:1"><div style="font-size:.65rem;color:'+d.textColor+';font-weight:'+d.fontWeight+'">منتج تجريبي</div>'
      + (d.showBrand?'<div style="font-size:.5rem;color:'+d.textMuted+'">ماركة</div>':'')
      + '<div style="display:flex;align-items:center;gap:4px;margin-top:2px">'
      + '<span style="font-size:.7rem;font-weight:900;color:'+d.priceColor+'">99 ₪</span>'
      + (d.showOldPrice?'<span style="font-size:.5rem;color:'+d.textMuted+';text-decoration:line-through">120 ₪</span>':'')
      + (d.showDiscountBadge?'<span style="font-size:.45rem;background:'+d.saleColor+';color:#fff;padding:1px 4px;border-radius:4px;font-weight:800">خصم</span>':'')
      + '</div></div>'
      + (d.showQuickAdd?'<div style="margin-top:4px"><span style="font-size:.55rem;background:'+d.accentColor+';color:#fff;padding:2px 8px;border-radius:'+d.btnRadius+'px;display:inline-block">+ أضف للسلة</span></div>':'')
      + '</div></div>';
  } else if (sec === 'spacing') {
    bodyHtml = '<div style="padding:12px">'
      + '<div style="background:'+d.borderColor+';border-radius:8px;padding:8px;opacity:.3">'
      + '<div style="background:'+d.cardColor+';border-radius:6px;padding:6px;display:flex;gap:4px">'
      + '<div style="flex:1;height:20px;background:'+d.bgColor+';border-radius:4px"></div>'
      + '<div style="flex:1;height:20px;background:'+d.bgColor+';border-radius:4px"></div>'
      + '</div></div>'
      + '<div style="font-size:.55rem;color:#94a3b8;text-align:center;margin-top:4px">هامش: '+d.pagePadding+'px • تباعد: '+d.sectionGap+'px</div></div>';
  }

  box.innerHTML = headerHtml + '<div class="preview-body">'+bodyHtml+'</div>' + navHtml;
}

function adminLoadAppearance() {
  const data = Object.assign(getDefaultAppearance(), JSON.parse(localStorage.getItem('mycart_appearance')) || {});
  fillAppearanceForm(data);
  renderPresetGrid(data);
  previewAppearance();
}

function toggleAppearancePanel() {
  var checkLoaded = setInterval(function() {
    if (typeof switchAdminTab === 'function') {
      clearInterval(checkLoaded);
      switchAdminTab('appearance');
    }
  }, 50);
  openAdmin();
}

function previewAppearance() {
  applyAppearance(readAppearanceForm());
}

function saveAppearance() {
  const data = readAppearanceForm();
  try { localStorage.setItem('mycart_appearance', JSON.stringify(data)); }
  catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
  applyAppearance(data);
  // Keep the storewide "اللون الأساسي" in sync with the saved appearance accent
  if (data.accentColor && typeof adminSettings === 'object' && adminSettings) {
    adminSettings.accentColor = data.accentColor;
    try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
  }
  const st = document.getElementById('appearanceStatus');
  if (st) { st.textContent = 'تم حفظ المظهر بنجاح'; st.style.color = '#10b981'; setTimeout(() => { st.textContent=''; }, 3000); }
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  showToast('تم حفظ المظهر', 'success');
}

function resetAppearance() {
  const defaults = getDefaultAppearance();
  localStorage.setItem('mycart_appearance', JSON.stringify(defaults));
  fillAppearanceForm(defaults);
  applyAppearance(defaults);
  renderPresetGrid(defaults);
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  showToast('تمت إعادة تعيين المظهر للافتراضي', 'success');
}

function exportAppearance() {
  const data = localStorage.getItem('mycart_appearance');
  if (!data) { showToast('لا يوجد مظهر للتصدير', 'error'); return; }
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mycart-theme-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير الثيم', 'success');
}

function importAppearance(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = Object.assign(getDefaultAppearance(), JSON.parse(e.target.result));
      localStorage.setItem('mycart_appearance', JSON.stringify(data));
      fillAppearanceForm(data);
      applyAppearance(data);
      renderPresetGrid(data);
      if (typeof adminMarkSaved === 'function') adminMarkSaved();
      showToast('تم استيراد الثيم بنجاح', 'success');
    } catch(err) { showToast('ملف غير صالح', 'error'); }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function switchAppSec(btn) {
  document.querySelectorAll('.app-nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.app-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const sec = document.getElementById('appsec-' + btn.dataset.sec);
  if (sec) sec.classList.add('active');
  liveAppPreview();
}

function updVal(id, suffix) {
  const el = document.getElementById(id);
  const span = document.getElementById(id + 'Val');
  if (!el || !span) return;
  let v = el.value;
  if (suffix === '.') v = (parseFloat(v) / 10).toFixed(1);
  span.textContent = v + (suffix === '.' ? '' : (suffix || ''));
}

function renderPresetGrid(current) {
  const grid = document.getElementById('presetGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(THEME_PRESETS).map(([key,p]) => `
    <div class="preset-card" onclick="applyPreset('${key}')">
      <div class="preset-swatch"><span style="background:${p.headerFrom}"></span><span style="background:${p.accentColor}"></span><span style="background:${p.bgColor}"></span><span style="background:${p.textColor}"></span></div>
      <div class="preset-name">${p.name}</div>
      <div class="preset-sub">${p.sub}</div>
    </div>`).join('');
}

function applyPreset(key) {
  const p = THEME_PRESETS[key];
  if (!p) return;
  // Merge preset color/font values into current settings (keep layout/structure)
  const cur = readAppearanceForm();
  const merged = Object.assign(cur, {
    accentColor:p.accentColor,accentHover:p.accentHover,bgColor:p.bgColor,cardColor:p.cardColor,textColor:p.textColor,textMuted:p.textMuted,borderColor:p.borderColor,priceColor:p.priceColor,saleColor:p.saleColor,successColor:p.successColor,headerFrom:p.headerFrom,headerTo:p.headerTo,headerText:p.headerText,navBg:p.navBg,navActive:p.navActive,fontHeading:p.fontHeading,fontBody:p.fontBody,darkMode:!!p.darkMode
  });
  fillAppearanceForm(merged);
  applyAppearance(merged);

  // Sync the storewide "اللون الأساسي" (admin settings) with the theme so
  // refreshFromCloud / applyAccentColor does not override it afterwards
  if (typeof adminSettings === 'object' && adminSettings) {
    adminSettings.accentColor = p.accentColor;
    try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
  }
  if (typeof applyAccentColor === 'function') applyAccentColor(p.accentColor);

  // Update announcement bar colors to harmonize with preset theme
  const annBar = document.getElementById('announcementBar');
  if (annBar) {
    annBar.style.setProperty('--ann-bg', p.headerFrom || p.accentColor);
    annBar.style.backgroundColor = p.headerFrom || p.accentColor;
    annBar.style.color = p.headerText || '#ffffff';
  }
  try {
    const mktData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
    if (!mktData.announce) mktData.announce = {};
    mktData.announce.bg = p.headerFrom || p.accentColor;
    mktData.announce.color = p.headerText || '#ffffff';
    localStorage.setItem('mycart_marketing', JSON.stringify(mktData));
  } catch(e) {}

  if (typeof adminMarkUnsaved === 'function') adminMarkUnsaved('preset');
  showToast('تم تطبيق ثيم: ' + p.name, 'success');
}

// ===== ADMIN MARKETING =====

function updateAdminSeoPreview() {
  const title = document.getElementById('admMktSeoTitle').value.trim() || 'متجري - أفضل متجر إلكتروني';
  const desc = document.getElementById('admMktSeoDesc').value.trim() || 'وصف مختصر للموقع يظهر في محركات البحث';
  const pTitle = document.getElementById('admMktSeoPreviewTitle');
  const pDesc = document.getElementById('admMktSeoPreviewDesc');
  if (pTitle) pTitle.textContent = title;
  if (pDesc) pDesc.textContent = desc;
}

function adminSaveMarketing(subTab = 'seo') {
  const currentData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  
  if (subTab === 'seo') {
    currentData.seo = {
      title: document.getElementById('admMktSeoTitle').value.trim(),
      description: document.getElementById('admMktSeoDesc').value.trim(),
      keywords: document.getElementById('admMktSeoKeywords').value.trim()
    };
  } 
  else if (subTab === 'social') {
    currentData.social = {
      facebook: document.getElementById('admMktSocialFb').value.trim(),
      instagram: document.getElementById('admMktSocialIg').value.trim(),
      twitter: document.getElementById('admMktSocialX').value.trim(),
      tiktok: document.getElementById('admMktSocialTt').value.trim(),
      whatsapp: document.getElementById('admMktSocialWa').value.trim()
    };
    currentData.tracking = {
      gaId: document.getElementById('admMktGaId').value.trim(),
      fbPixel: document.getElementById('admMktFbPixel').value.trim(),
      ttPixel: document.getElementById('admMktTtPixel').value.trim(),
      snapPixel: document.getElementById('admMktSnapPixel').value.trim(),
      twPixel: document.getElementById('admMktTwPixel').value.trim(),
      pintPixel: document.getElementById('admMktPintPixel').value.trim(),
      headerScript: document.getElementById('admMktHeadScript').value.trim(),
      footerScript: document.getElementById('admMktFooterScript').value.trim()
    };
    currentData.share = {
      show: document.getElementById('admMktShareShow').checked
    };
  } 
  else if (subTab === 'popup') {
    currentData.promoPopup = {
      show: document.getElementById('admMktPromoPopupShow')?.checked,
      title: document.getElementById('admMktPromoPopupTitle')?.value.trim(),
      text: document.getElementById('admMktPromoPopupText')?.value.trim(),
      code: document.getElementById('admMktPromoPopupCode')?.value.trim(),
      color: document.getElementById('admMktPromoPopupColor')?.value.trim() || '#ef4444',
      link: document.getElementById('admMktPromoPopupLink')?.value.trim()
    };
  }
  else if (subTab === 'offers') {
    currentData.volumeDiscount = {
      show: document.getElementById('admMktVolDiscShow')?.checked,
      type: document.getElementById('admMktVolDiscType').value,
      disc2: parseInt(document.getElementById('admMktVolDisc2')?.value) || 5,
      disc3: parseInt(document.getElementById('admMktVolDisc3')?.value) || 10,
      bogoBuy: parseInt(document.getElementById('admMktVolBogoBuy')?.value) || 2,
      bogoGet: parseInt(document.getElementById('admMktVolBogoGet')?.value) || 1
    };
    currentData.fbt = {
      show: document.getElementById('admMktFbtShow')?.checked,
      discount: parseInt(document.getElementById('admMktFbtDiscount')?.value) || 10,
      discountType: document.getElementById('admMktFbtDiscountType').value,
      productIds: window._fbtProductIds || []
    };
    currentData.freeShipping = {
      show: document.getElementById('admMktFreeShippingShow')?.checked,
      goal: parseInt(document.getElementById('admMktFreeShippingGoal')?.value) || 300
    };
    currentData.waNotif = {
      show: document.getElementById('admMktWaNotifShow')?.checked
    };
    currentData.flashSales = {
      show: document.getElementById('admMktFlashSalesShow')?.checked
    };
  } 
  else if (subTab === 'widgets') {
    currentData.announce = {
      show: document.getElementById('admMktAnnounceShow').checked,
      text: Array.from(document.querySelectorAll('.admAnnounceLine')).map(i=>i.value.trim()).filter(t=>t).join('\n'),
      bg: document.getElementById('admMktAnnounceBg').value,
      color: document.getElementById('admMktAnnounceColor').value,
      animation: { type: document.getElementById('admMktAnnounceType').value, direction: document.getElementById('admMktAnnounceDir').value, speed: document.getElementById('admMktAnnounceSpeed').value }
    };
    currentData.seasonalEffect = {
      enabled: document.getElementById('admMktSeasonalShow').checked,
      type: document.getElementById('admMktSeasonalType').value
    };
    currentData.countdown = {
      show: document.getElementById('admMktCountdownShow').checked,
      duration: parseInt(document.getElementById('admMktCountdownDuration').value) || 180
    };
    currentData.liveViewers = {
      show: document.getElementById('admMktLiveViewersShow')?.checked || false
    };
    currentData.waChat = {
      show: document.getElementById('admMktWaChatShow')?.checked || false,
      greeting: document.getElementById('admMktWaChatGreeting')?.value.trim() || ''
    };
    currentData.socialProof = {
      show: document.getElementById('admMktSocialProofShow')?.checked
    };
    currentData.waCheckout = {
      show: document.getElementById('admMktWaCheckoutShow').checked
    };
    currentData.offersSection = {
      show: document.getElementById('admMktOffersSectionShow')?.checked !== false
    };
    currentData.featured = {
      show: document.getElementById('admMktFeaturedShow')?.checked !== false
    };
    currentData.newArrival = {
      show: document.getElementById('admMktNewArrivalShow')?.checked
    };
    currentData.halfPrice = {
      show: document.getElementById('admMktHalfPriceShow')?.checked
    };
    currentData.mostSold = {
      show: document.getElementById('admMktMostSoldShow')?.checked !== false
    };
  } 
  else if (subTab === 'reviews') {
    currentData.reviews = {
      show: document.getElementById('admMktReviewsShow')?.checked
    };
    currentData.spinWin = {
      show: document.getElementById('admMktSpinWinShow')?.checked,
      segments: currentData.spinWin?.segments || []
    };
  }
  else if (subTab === 'pagebuilder') {
    // Save section order from page builder
    const orderList = document.getElementById('pbSectionList');
    if (orderList) {
      const items = orderList.querySelectorAll('.pb-section-item');
      currentData.sectionOrder = Array.from(items).map(function(item) { return item.dataset.id; });
    }
    // Save custom sections data
    currentData.customSections = window._pbCustomSections || currentData.customSections || [];
  }

  try { 
    localStorage.setItem('mycart_marketing', JSON.stringify(currentData)); 
  } catch(e) { 
    showToast('مساحة التخزين ممتلئة', 'error'); 
    return; 
  }
  applyMarketing();
  renderProducts(getFilteredProducts());
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  showToast('تم حفظ إعدادات التسويق', 'success');
}

function loadOffers() {
  try {
    const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    return mkt.offersList || [];
  } catch(e) { return []; }
}
let _editOfferIdx = -1;
function adminAddOffer() {
  const name = document.getElementById('admOfferName')?.value.trim();
  const type = document.getElementById('admOfferType')?.value;
  const value = parseFloat(document.getElementById('admOfferValue')?.value) || 0;
  const applyTo = document.getElementById('admOfferApplyTo')?.value || 'all';
  const badge = document.getElementById('admOfferBadge')?.value.trim();
  const endDate = document.getElementById('admOfferEndDate')?.value;
  const active = document.getElementById('admOfferActive')?.checked !== false;
  if (!name || !value) { showToast('أدخل اسم العرض وقيمة الخصم', 'error'); return; }
  const productIds = applyTo === 'specific' ? [...document.querySelectorAll('.admOfferProdCb:checked')].map(cb => parseInt(cb.value)).filter(id => !isNaN(id)) : [];
  if (applyTo === 'specific' && !productIds.length) { showToast('اختر منتجاً واحداً على الأقل', 'error'); return; }
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  mkt.offersList = mkt.offersList || [];
  if (_editOfferIdx >= 0 && _editOfferIdx < mkt.offersList.length) {
    Object.assign(mkt.offersList[_editOfferIdx], { name, type, value, applyTo, productIds, badge, endDate, active });
    _editOfferIdx = -1;
    try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
    adminRenderMarketing('offers');
    showToast('تم تحديث العرض', 'success');
  } else {
    const offer = { id: Date.now(), name, type, value, applyTo, productIds, badge, endDate, active };
    mkt.offersList.push(offer);
    try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
    adminRenderMarketing('offers');
    showToast('تم إضافة العرض', 'success');
  }
}
function adminEditOffer(idx) {
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const o = mkt.offersList?.[idx];
  if (!o) return;
  _editOfferIdx = idx;
  document.getElementById('admOfferName').value = o.name;
  document.getElementById('admOfferType').value = o.type;
  document.getElementById('admOfferValue').value = o.value;
  document.getElementById('admOfferApplyTo').value = o.applyTo;
  document.getElementById('admOfferBadge').value = o.badge || '';
  document.getElementById('admOfferEndDate').value = o.endDate || '';
  document.getElementById('admOfferActive').checked = o.active !== false;
  document.getElementById('admOfferProdPicker').style.display = o.applyTo === 'specific' ? 'block' : 'none';
  document.querySelectorAll('.admOfferProdCb').forEach(cb => cb.checked = o.productIds?.includes(parseInt(cb.value)));
  adminRefreshOfferSelected();
  document.getElementById('admOfferSubmitBtn').textContent = 'تحديث';
  document.getElementById('admOfferCancelBtn').style.display = 'inline-flex';
  document.getElementById('admOfferFormTitle').textContent = 'تعديل العرض';
  document.getElementById('admOfferFormTitle').scrollIntoView({ behavior: 'smooth' });
}
function adminToggleOffer(idx) {
  const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  if (!mkt.offersList?.[idx]) return;
  mkt.offersList[idx].active = !mkt.offersList[idx].active;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  adminRenderMarketing('offers');
  showToast(mkt.offersList[idx].active ? 'تم تفعيل العرض' : 'تم تعطيل العرض', 'success');
}
function adminCancelEdit() {
  _editOfferIdx = -1;
  adminRenderMarketing('offers');
}
function adminDeleteOffer(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا العرض؟', function() {
    const mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
    if (!mkt.offersList) return;
    mkt.offersList.splice(idx, 1);
    try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
    adminRenderMarketing('offers');
    showToast('تم حذف العرض', 'success');
  });
}
function getProductOffer(p) {
  const offers = loadOffers();
  const now = new Date();
  for (const o of offers) {
    if (!o.active) continue;
    if (o.endDate) {
      const end = new Date(o.endDate);
      end.setHours(23,59,59,999);
      if (now > end) continue;
    }
    if (o.applyTo === 'all') return o;
    if (o.applyTo === 'specific' && o.productIds && o.productIds.includes(p.id)) return o;
  }
  return null;
}

function calcOfferPrice(p) {
  const o = getProductOffer(p);
  if (!o) return null;
  const base = wPrice(p);
  if (o.type === 'percent') return Math.round(base * (1 - o.value / 100));
  if (o.type === 'fixed') return Math.max(0, base - o.value);
  return base;
}
function adminGetBanners() {
  const banners = [];
  document.querySelectorAll('#admBannersList .banner-card').forEach(c => {
    const img = c.querySelector('.banner-img-preview');
    const title = c.querySelector('.banner-title-input');
    const link = c.querySelector('.banner-link-input');
    const btnInput = c.querySelector('.banner-btn-input');
    const activeCb = c.querySelector('.banner-card-header input[type="checkbox"]');
    const showMiniCardCb = c.querySelector('.banner-show-minicard-input');
    const badgeTextVal = c.querySelector('.banner-badge-text-input');
    const badgeAnimVal = c.querySelector('.banner-badge-anim-input');
    const badgeColorVal = c.querySelector('.banner-badge-color-input');
    if (img && img.src && img.src !== '') banners.push({
      image: img.src,
      title: title?title.value:'',
      link: link?link.value:'',
      btnText: btnInput?btnInput.value:'',
      active: activeCb?activeCb.checked:true,
      showMiniCard: showMiniCardCb?showMiniCardCb.checked:false,
      badgeText: badgeTextVal?badgeTextVal.value.trim():'',
      badgeAnim: badgeAnimVal?badgeAnimVal.value:'pulse',
      badgeColor: badgeColorVal?badgeColorVal.value:'#ef4444'
    });
  });
  return banners;
}

async function adminBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('الصورة كبيرة جداً (الحد 5MB)', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  const card = input.closest('.banner-card');
  card.querySelectorAll('.banner-img-preview').forEach(el => { el.src = url; el.style.display = 'block'; });
  card.querySelectorAll('.banner-upload-placeholder').forEach(el => { el.style.display = 'none'; });
  card.querySelectorAll('.banner-view img').forEach(el => { el.src = url; el.style.opacity = '1'; });
}

function admRenderSpinSegmentsList(segs) {
  const container = document.getElementById('admSpinSegmentsList');
  if (!container) return;
  if (!segs || !segs.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.8rem">لا توجد قطاعات بعد</p>';
    return;
  }
  container.innerHTML = segs.map((seg, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 10px">
      <div style="width:18px;height:18px;border-radius:50%;background:${seg.color || '#ef4444'};flex-shrink:0;border:1px solid rgba(0,0,0,.15)"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.8rem;font-weight:700">${seg.label}</div>
        <div style="font-size:.7rem;color:var(--text-muted)">
          ${seg.type === 'discount' ? `خصم ${seg.percent}% — كود: <strong>${seg.code}</strong>` : seg.type === 'freeship' ? 'شحن مجاني' : 'حظ سعيد (لا جائزة)'}
        </div>
      </div>
      <button onclick="admDeleteSpinSegment(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

function admAddSpinSegment() {
  const label = document.getElementById('admNewSegLabel')?.value.trim();
  const type = document.getElementById('admNewSegType')?.value;
  const percent = parseInt(document.getElementById('admNewSegPercent')?.value) || 0;
  const code = document.getElementById('admNewSegCode')?.value.trim().toUpperCase();
  const color = document.getElementById('admNewSegColor')?.value || '#ef4444';
  if (!label) { alert('أدخل اسم الجائزة أولاً'); return; }
  if (type === 'discount' && (!percent || !code)) { alert('أدخل نسبة الخصم والكود'); return; }
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.spinWin = data.spinWin || { show: false, segments: [] };
  data.spinWin.segments = data.spinWin.segments || [];
  data.spinWin.segments.push({ label, type, percent: type === 'discount' ? percent : 0, code: type === 'discount' ? code : (type === 'freeship' ? 'FREESHIP' : ''), color });
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  admRenderSpinSegmentsList(data.spinWin.segments);
  document.getElementById('admNewSegLabel').value = '';
  document.getElementById('admNewSegCode').value = '';
  document.getElementById('admNewSegPercent').value = '10';
}

function admDeleteSpinSegment(idx) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!data.spinWin || !data.spinWin.segments) return;
  data.spinWin.segments.splice(idx, 1);
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  admRenderSpinSegmentsList(data.spinWin.segments);
}

// ===== COPY HELPER =====

function copyText(txt, label) {
  navigator.clipboard.writeText(txt).then(() => {
    showToast(`تم نسخ ${label}`, 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast(`تم نسخ ${label}`, 'success'); } catch(e) {}
    document.body.removeChild(ta);
  });
}

function copyBtn(btn, txt, label) {
  var ok = false;
  var doCopy = function(){
    return navigator.clipboard.writeText(txt).then(function(){ ok = true; showToast('تم نسخ ' + label, 'success'); })
      .catch(function(){
        var ta = document.createElement('textarea');
        ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok = true; showToast('تم نسخ ' + label, 'success'); } catch(e){}
        document.body.removeChild(ta);
      });
  };
  doCopy().finally(function(){
    if (btn.dataset.copying) return;
    var original = btn.dataset.orig || btn.innerHTML;
    btn.dataset.orig = original;
    var w = btn.offsetWidth;
    btn.style.transition = 'transform .2s ease, background .2s ease';
    btn.style.animation = 'copyPop .3s ease';
    btn.dataset.copying = '1';
    btn.style.whiteSpace = 'nowrap';
    btn.innerHTML = '<i class="fa-solid fa-check"></i> تم';
    btn.style.background = '#059669'; btn.style.color = '#fff'; btn.style.borderColor = '#059669';
    if (w > 0) btn.style.minWidth = w + 'px';
    setTimeout(function(){
      btn.innerHTML = original;
      btn.dataset.copying = '';
      btn.style.minWidth = ''; btn.style.whiteSpace = '';
      btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
      btn.style.animation = '';
    }, 1400);
  });
}

// ===== PRINT ORDER =====

function printOrderData(o, currency) {
  const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discAmt = o.discount ? Math.round(subtotal * o.discount / 100) : 0;
  const itemsHTML = o.items.map(item => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px">${item.name}${item.variant ? ` (${item.variant})` : ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center">${item.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:left" dir="ltr">${currency}${item.price.toFixed(2)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:left" dir="ltr">${currency}${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>طلب #${String(o.id).slice(-6)}</title>
    <style>
      @page { margin: 15mm 10mm }
      * { box-sizing: border-box; margin: 0; padding: 0 }
      body { font-family: 'Tajawal', 'Arial', sans-serif; font-size: 14px; color: #1e293b; padding: 20px; background: #fff }
      .header { text-align: center; padding-bottom: 16px; border-bottom: 2px solid #ef4444; margin-bottom: 20px }
      .header h1 { font-size: 20px; color: #ef4444; margin-bottom: 4px }
      .header p { font-size: 12px; color: #64748b }
      .section { margin-bottom: 20px }
      .section h3 { font-size: 14px; font-weight: 800; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0 }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 13px }
      .info-grid .label { color: #64748b }
      .info-grid .value { font-weight: 700 }
      table { width: 100%; border-collapse: collapse; margin-top: 8px }
      th { background: #f8fafc; padding: 8px; font-size: 12px; font-weight: 700; border-bottom: 2px solid #e2e8f0; text-align: center }
      th:first-child { text-align: right }
      .totals { margin-top: 16px; padding-top: 8px; border-top: 2px solid #e2e8f0 }
      .totals .row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0 }
      .totals .grand { font-size: 17px; font-weight: 800; color: #ef4444; border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 6px }
      .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px }
      @media print { body { padding: 0 } }
    </style>
    </head><body>
    <div class="header">
      <h1>طلب #${String(o.id).slice(-6)}</h1>
      <p>${o.date || ''}</p>
    </div>
    <div class="section">
      <h3>معلومات العميل</h3>
      <div class="info-grid">
        <div><span class="label">الاسم:</span> <span class="value">${o.customer?.name || '—'}</span></div>
        <div><span class="label">الهاتف:</span> <span class="value" dir="ltr" style="display:inline-block">${o.customer?.phone || '—'}</span></div>
        <div><span class="label">المدينة:</span> <span class="value">${o.customer?.city || '—'}</span></div>
        <div><span class="label">العنوان:</span> <span class="value">${o.customer?.address || '—'}</span></div>
        ${o.customer?.location ? `<div><span class="label">الموقع:</span> <span class="value" dir="ltr" style="display:inline-block">${o.customer.location}</span></div>` : ''}
        ${o.deliveryZone ? `<div><span class="label">منطقة التوصيل:</span> <span class="value">${o.deliveryZone}</span></div>` : ''}
      </div>
      ${o.note ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #e2e8f0;font-size:13px"><span class="label">ملاحظة:</span> <span class="value">${o.note}</span></div>` : ''}
    </div>
    <div class="section">
      <h3>المنتجات</h3>
      <table>
        <thead><tr><th style="text-align:right">المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span>المجموع الفرعي</span><span dir="ltr">${currency}${subtotal.toFixed(2)}</span></div>
        ${o.discount ? `<div class="row" style="color:#16a34a"><span>الخصم (${o.discount}%)</span><span dir="ltr">-${currency}${discAmt.toFixed(2)}</span></div>` : ''}
        ${o.delivery ? `<div class="row"><span>التوصيل ${o.deliveryZone ? `(${o.deliveryZone})` : ''}</span><span dir="ltr">${currency}${o.delivery.toFixed(2)}</span></div>` : ''}
        <div class="row grand"><span>الإجمالي</span><span dir="ltr">${currency}${(o.total || 0).toFixed(2)}</span></div>
      </div>
    </div>
    <div class="footer">تمت الطباعة من المتجر — ${new Date().toLocaleString('ar-SA')}</div>
    <script>window.onload = function() { window.print(); window.close(); } <\/script>
    </body></html>
  `);
  win.document.close();
}

// ===== ORDER DETAIL/EDIT MODAL (Admin) =====

let adminOrderEditIdx = -1;

let adminOrderEditData = null;

let adminOrderEditMode = false;

function adminShowOrderDetail(idx) {
  const ords = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const o = ords[idx];
  if (!o) return;
  adminOrderEditIdx = idx;
  adminOrderEditData = JSON.parse(JSON.stringify(o));
  adminOrderEditMode = false;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-sidebar button').forEach(b => b.classList.remove('active'));
  document.getElementById('adminPageTitle').textContent = `طلب #${String(o.id).slice(-6)}`;
  document.getElementById('admin-orderDetail').classList.add('active');
  adminRenderOrderDetailPage();
}

function adminBackToOrders() {
  adminOrderEditIdx = -1;
  adminOrderEditData = null;
  if (typeof _joinTraderViewIdx === 'number' && _joinTraderViewIdx >= 0) {
    const backIdx = _joinTraderViewIdx;
    _joinTraderViewIdx = -1;
    switchAdminTab('joinrequests');
    adminShowTraderOrders(backIdx);
    return;
  }
  switchAdminTab('orders');
}

function adminToggleOrderEditMode() {
  adminOrderEditMode = !adminOrderEditMode;
  adminRenderOrderDetailPage();
}

function adminOrderEditChangeQty(idx, val) {
  if (!adminOrderEditData) return;
  const qty = parseInt(val) || 1;
  if (qty < 1) return;
  adminOrderEditData.items[idx].qty = qty;
  adminOrderEditUpdateTotal();
}

function adminOrderEditRemoveItem(idx) {
  if (!adminOrderEditData) return;
  showConfirmModal('إزالة هذا المنتج من الطلب؟', function() {
    adminOrderEditData.items.splice(idx, 1);
    adminRenderOrderEditPage();
  });
}

function adminOrderEditAddItem() {
  if (!adminOrderEditData) return;
  const sel = document.getElementById('oeAddProduct');
  const pid = parseInt(sel.value);
  if (!pid) return;
  const p = products.find(x => x.id === pid);
  if (!p) return;
  const existing = adminOrderEditData.items.findIndex(i => i.id === pid);
  if (existing >= 0) {
    adminOrderEditData.items[existing].qty += 1;
  } else {
    adminOrderEditData.items.push({ id: p.id, name: p.name, price: p.price, image: getProductImages(p)[0], qty: 1 });
  }
  sel.value = '';
  adminRenderOrderEditPage();
}

function adminOrderEditUpdateTotal() {
  const discInput = document.getElementById('oeDiscount');
  if (discInput && adminOrderEditData) {
    adminOrderEditData.discount = parseInt(discInput.value) || 0;
  }
  const d = adminOrderEditData;
  if (!d) return;
  const currency = CURRENCY;
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = d.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (d.delivery || 0);
  const oeTotal = document.getElementById('oeTotal');
  if (oeTotal) oeTotal.textContent = `${currency}${total.toFixed(2)}`;
}

function adminSaveOrderEdit() {
  if (!adminOrderEditData || adminOrderEditIdx < 0) return;
  const ords = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!ords[adminOrderEditIdx]) return;
  if (document.getElementById('oeName')) adminOrderEditData.customer.name = document.getElementById('oeName').value.trim();
  if (document.getElementById('oePhone')) adminOrderEditData.customer.phone = document.getElementById('oePhone').value.trim();
  if (document.getElementById('oeCity')) adminOrderEditData.customer.city = document.getElementById('oeCity').value.trim();
  if (document.getElementById('oeAddr')) adminOrderEditData.customer.address = document.getElementById('oeAddr').value.trim();
  adminOrderEditData._status = document.getElementById('oeStatus')?.checked ? 'done' : 'pending';
  const subtotal = adminOrderEditData.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = adminOrderEditData.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  adminOrderEditData.total = subtotal - discAmt;
  adminOrderEditData.subtotal = subtotal;
  ords[adminOrderEditIdx] = adminOrderEditData;
  try { localStorage.setItem('mycart_orders', JSON.stringify(ords)); } catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
  adminBackToOrders();
  adminRefreshAll();
  if (typeof adminMarkSaved === 'function') adminMarkSaved();
  showToast('تم حفظ التعديلات', 'success');
}

// ===== PRODUCT PICKER =====

function openProductPicker() {
  _offerPickerMode = false;
  document.getElementById('pickerSearch').value = '';
  document.getElementById('productPickerModal').style.display = 'block';
  document.querySelector('#productPickerModal h3').textContent = 'اختر منتج للإضافة';
  renderPickerProducts();
}

function closeProductPicker() {
  document.getElementById('productPickerModal').style.display = 'none';
  _offerPickerMode = false;
  document.querySelector('#productPickerModal h3').textContent = 'اختر منتج للإضافة';
}

let _offerPickerMode = false;

function adminOpenOfferPicker() {
  _offerPickerMode = true;
  document.getElementById('pickerSearch').value = '';
  document.getElementById('productPickerModal').style.display = 'block';
  document.querySelector('#productPickerModal h3').textContent = 'اختر المنتجات للعرض';
  renderPickerProducts();
}

function adminRefreshOfferSelected() {
  const container = document.getElementById('admOfferSelectedProds');
  if (!container) return;
  const checked = [...document.querySelectorAll('.admOfferProdCb:checked')];
  if (!checked.length) {
    container.innerHTML = '<span style="font-size:.72rem;color:var(--text-muted)">لم يتم اختيار أي منتج بعد</span>';
    return;
  }
  container.innerHTML = checked.map(cb => {
    const pid = cb.value;
    const label = cb.closest('label');
    const name = label ? label.textContent.replace(cb.outerHTML,'').trim() : pid;
    const pidNum = parseInt(pid);
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:4px 10px;font-size:.72rem;font-weight:600"><span style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span> <span onclick="adminRemoveOfferProd(${pidNum})" style="cursor:pointer;color:#ef4444;font-size:.85rem;padding:3px 7px;font-weight:800">&times;</span></span>`;
  }).join('');
}
function adminRemoveOfferProd(pid) {
  const cb = document.querySelector('.admOfferProdCb[value="' + pid + '"]');
  if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
  adminRefreshOfferSelected();
}

function renderPickerProducts() {
  const q = (document.getElementById('pickerSearch').value || '').trim().toLowerCase();
  const filtered = q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  document.getElementById('pickerProductsGrid').innerHTML = filtered.map(p => {
    const isSelected = _offerPickerMode && document.querySelector(`.admOfferProdCb[value="${p.id}"]`)?.checked;
    return `<div onclick="pickerAddProduct(${p.id})" style="background:var(--bg);border:2px solid ${isSelected?'#f59e0b':'var(--border)'};border-radius:10px;padding:8px;cursor:pointer;text-align:center;transition:.15s;position:relative" onmouseover="this.style.borderColor='${isSelected?'#f59e0b':'var(--accent)'}" onmouseout="this.style.borderColor='${isSelected?'#f59e0b':'var(--border)'}'">
      ${isSelected?'<span style="position:absolute;top:4px;right:4px;background:#f59e0b;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:800"><i class="fa-solid fa-check"></i></span>':''}
      <img src="${getProductImages(p)[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px;background:#e2e8f0">
      <div style="font-size:.75rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
      <div style="font-size:.7rem;font-weight:800;color:var(--accent)">${CURRENCY}${p.price}</div>
    </div>`;
  }).join('');
}

function pickerAddProduct(pid) {
  if (_offerPickerMode) {
    const cb = document.querySelector(`.admOfferProdCb[value="${pid}"]`);
    if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
    adminRefreshOfferSelected();
    renderPickerProducts();
    return;
  }
  const p = products.find(x => x.id === pid);
  if (!p || !adminOrderEditData) return;
  const existing = adminOrderEditData.items.findIndex(i => i.id === pid);
  if (existing >= 0) {
    adminOrderEditData.items[existing].qty += 1;
  } else {
    adminOrderEditData.items.push({ id: p.id, name: p.name, price: p.price, image: getProductImages(p)[0], qty: 1 });
  }
  closeProductPicker();
  adminRenderOrderEditPage();
}

// ===== NOTIFICATIONS =====

let adminNotifOrderCount = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;

let adminNotifInterval = null;
var adminNotifLastAgency = 0;

function playNotifSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 800; gain.gain.value = 0.3;
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function getReadNotifIdsStore() {
  try { var r = localStorage.getItem('mycart_read_notifications'); return r ? JSON.parse(r) : []; } catch(e) { return []; }
}

function markNotifReadStore(id) {
  var ids = getReadNotifIdsStore();
  if (ids.indexOf(String(id)) === -1) {
    ids.push(String(id));
    try { localStorage.setItem('mycart_read_notifications', JSON.stringify(ids)); } catch(e) {}
  }
}

function handleAdminNotifClick(notifId, actionFn) {
  if (notifId) markNotifReadStore(notifId);
  closeAdminNotifDropdown();
  checkAdminNewOrders();
  if (typeof openQuickAdmin === 'function') openQuickAdmin();
  if (typeof actionFn === 'function') actionFn();
}

function checkAdminNewOrders() {
  const currentOrders = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  var agencyNotifs = [];
  try {
    var r = localStorage.getItem('mycart_store_notifications') || localStorage.getItem('mycart_store_notifications_default');
    if (r) agencyNotifs = JSON.parse(r);
  } catch(e) {}

  var readIds = getReadNotifIdsStore();
  var unreadAgency = agencyNotifs.filter(function(n, i){ return readIds.indexOf(String(n.id || 'agency_'+i)) === -1; }).length;

  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var unreadOrders = orders.filter(function(o){ return readIds.indexOf(String(o.id)) === -1; }).length;

  var feeInfo = typeof getFeeInfo === 'function' ? getFeeInfo() : null;
  var hasFeeWarning = feeInfo && feeInfo.plan === 'free' && feeInfo.accrued > 0 && feeInfo.accrued >= feeInfo.limit;
  var total = unreadAgency + unreadOrders + (hasFeeWarning ? 1 : 0);

  const badge = document.getElementById('adminNotifBadge');
  if (badge) {
    if (total > 0) {
      badge.textContent = total;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  if (currentOrders > adminNotifOrderCount) {
    adminNotifOrderCount = currentOrders;
    playNotifSound();
  } else if (currentOrders < adminNotifOrderCount) {
    adminNotifOrderCount = currentOrders;
  }
}

var _quickAdminNotifFilter = 'all';

function clearAllQuickAdminNotifs() {
  var readIds = getReadNotifIdsStore();
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
  checkAdminNewOrders();
  closeAdminNotifDropdown();
  showAdminNotifPanel();
}

function openClearNotifsConfirm() {
  closeAdminNotifDropdown();
  var overlay = document.createElement('div');
  overlay.id = 'clearNotifsConfirmModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Tajawal,sans-serif;direction:rtl';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.2);text-align:center;animation:fadeUp .25s ease" onclick="event.stopPropagation()">'
    + '<div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.2rem;color:#ef4444"><i class="fa-solid fa-trash-can"></i></div>'
    + '<div style="font-size:1.05rem;font-weight:900;color:#1e293b;margin-bottom:6px">مسح كل الإشعارات؟</div>'
    + '<div style="font-size:.8rem;color:#64748b;line-height:1.7;margin-bottom:18px">سيتم حذف إشعارات المنصة نهائياً وتمييز جميع الطلبات كمقروءة. لا يمكن التراجع عن هذا الإجراء.</div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="confirmClearAllQuickAdminNotifs()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#ef4444;color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">نعم، امسح الكل</button>'
    + '<button onclick="cancelClearNotifsConfirm()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#f1f5f9;color:#64748b;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">إلغاء</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
}

function confirmClearAllQuickAdminNotifs() {
  var overlay = document.getElementById('clearNotifsConfirmModal');
  if (overlay) overlay.remove();
  try { localStorage.removeItem('mycart_store_notifications'); } catch(e) {}
  try { localStorage.removeItem('mycart_store_notifications_default'); } catch(e) {}
  _quickAdminNotifFilter = 'all';
  checkAdminNewOrders();
  closeAdminNotifDropdown();
  showAdminNotifPanel();
}

function cancelClearNotifsConfirm() {
  var overlay = document.getElementById('clearNotifsConfirmModal');
  if (overlay) overlay.remove();
  showAdminNotifPanel();
}

function filterQuickAdminNotifs(filter) {
  _quickAdminNotifFilter = filter;
  closeAdminNotifDropdown();
  showAdminNotifPanel();
}

function showAdminNotifPanel() {
  var existing = document.getElementById('adminNotifDropdown');
  if (existing) { existing.remove(); return; }
  var btn = document.getElementById('adminNotifBtn');
  if (!btn) return;
  var rect = btn.getBoundingClientRect();

  var readIds = getReadNotifIdsStore();
  var orders = JSON.parse(localStorage.getItem('mycart_orders') || '[]');
  var recent = orders.slice(0, 5);

  var agencyNotifs = [];
  try {
    var r = localStorage.getItem('mycart_store_notifications') || localStorage.getItem('mycart_store_notifications_default');
    if (r) agencyNotifs = JSON.parse(r);
  } catch(e) {}

  var drop = document.createElement('div');
  drop.id = 'adminNotifDropdown';
  drop.style.cssText = 'position:fixed;top:'+(rect.bottom+4)+'px;left:'+(rect.left)+'px;min-width:310px;max-width:350px;max-height:450px;overflow-y:auto;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.15);z-index:99999;padding:12px;font-family:Tajawal,sans-serif;direction:rtl';

  var itemsHtml = '';
  var feeInfo = typeof getFeeInfo === 'function' ? getFeeInfo() : null;
  if (feeInfo && feeInfo.plan === 'free' && feeInfo.accrued > 0 && feeInfo.accrued >= feeInfo.limit) {
    itemsHtml += '<div onclick="handleAdminNotifClick(null, function(){ switchAdminTab(\'subscription\'); })" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:#fef2f2;border:1.5px solid #fecaca;cursor:pointer">'
      + '<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.6rem;color:#fff"><i class="fa-solid fa-triangle-exclamation"></i></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.72rem;font-weight:800;color:#991b1b"><i class="fa-solid fa-triangle-exclamation"></i> مستحقات مالية مستحقة</div>'
      + '<div style="font-size:.62rem;color:#b91c1c">رصيدك الحالي: '+feeInfo.accrued+' ₪ (الحد: '+feeInfo.limit+' ₪). سدد لتجنب الإيقاف.</div></div></div>';
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
    window._notifList = agencyNotifs;
    var shownAgency = agencyNotifs.slice(0, 4);
    shownAgency.forEach(function(n, idx){
      var nid = String(n.id || ('agency_' + idx));
      var isRead = readIds.indexOf(nid) !== -1;
      if (_quickAdminNotifFilter === 'unread' && isRead) return;

      var t = ntypes[n.type] || ntypes.general;
      var realIdx = window._notifList.indexOf(n);

      var cardBg = isRead ? '#f8fafc' : t.bg;
      var cardBorder = isRead ? '#e2e8f0' : t.bd;
      var titleColor = isRead ? '#64748b' : t.color;
      var subColor = isRead ? '#94a3b8' : t.sub;

      var actionFnCode = "switchAdminTab('dashboard')";
      if (n.type === 'post' || n.image || n.postBody) actionFnCode = "openNotifArticle("+realIdx+")";
      else if (n.type === 'payment' || n.type === 'warning') actionFnCode = "switchAdminTab('subscription')";
      else if (n.type === 'marketing') actionFnCode = "switchAdminTab('marketing','seo')";
      else if (n.type === 'update') actionFnCode = "switchAdminTab('settings')";
      else if (n.type === 'offer') actionFnCode = "switchAdminTab('marketing','offers')";

      itemsHtml += '<div onclick="handleAdminNotifClick(\''+nid+'\', function(){ '+actionFnCode+'; })" style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:'+cardBg+';border:1.5px solid '+cardBorder+';cursor:pointer;opacity:'+(isRead ? '0.75' : '1')+'">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<div style="width:26px;height:26px;border-radius:50%;background:'+(isRead ? '#94a3b8' : t.icBg)+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.65rem;color:#fff"><i class="fa-solid '+t.icon+'"></i></div>'
        + '<div style="flex:1;min-width:0"><div style="font-size:.78rem;font-weight:800;color:'+titleColor+'">'+(n.type==='payment'?'<i class="fa-solid fa-triangle-exclamation"></i> ':'')+n.title+(isRead ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(مقروء)</span>' : '')+'</div>'
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
    if (_quickAdminNotifFilter !== 'unread' || !isReadOrder) {
      itemsHtml += '<div onclick="handleAdminNotifClick(\''+oid+'\', function(){ adminShowOrderDetail(0); })" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;background:'+(isReadOrder ? '#f8fafc' : '#f0fdf4')+';border:1.5px solid '+(isReadOrder ? '#bbf7d0' : '#bbf7d0')+';cursor:pointer;opacity:'+(isReadOrder ? '0.75' : '1')+'">'
        + '<div style="width:28px;height:28px;border-radius:50%;background:'+(isReadOrder ? '#94a3b8' : '#16a34a')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.7rem;color:#fff"><i class="fa-solid fa-bag-shopping"></i></div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:.78rem;font-weight:800;color:'+(isReadOrder ? '#64748b' : '#166534')+'"><i class="fa-solid fa-cart-shopping"></i> طلب جديد #'+String(newestOrder.id).slice(-6)+(isReadOrder ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(مقروء)</span>' : '')+'</div>'
        + '<div style="font-size:.68rem;color:'+(isReadOrder ? '#94a3b8' : '#15803d')+'">'+(newestOrder.customer?.name || 'عميل جديد')+' • المجموع: '+(newestOrder.total ? newestOrder.total + ' ₪' : '')+'</div>'
        + '</div>'
        + '<span style="font-size:.6rem;background:'+(isReadOrder ? '#94a3b8' : '#16a34a')+';color:#fff;padding:2px 7px;border-radius:999px;font-weight:800">'+(isReadOrder ? 'تمت المعاينة' : 'جديد')+'</span>'
        + '</div>';
    }
  }

  recent.forEach(function(o, i){
    if (i === 0 && orders.length > 0) return;
    var oid = String(o.id);
    var isReadOrder = readIds.indexOf(oid) !== -1;
    if (_quickAdminNotifFilter === 'unread' && isReadOrder) return;

    var st = o.status || 'pending';
    var stColor = isReadOrder ? '#94a3b8' : (st==='completed'?'#10b981':st==='cancelled'?'#ef4444':'#f59e0b');
    var stLabel = st==='completed'?__('statusCompleted'):st==='cancelled'?__('statusCancelled'):__('newOrder');
    itemsHtml += '<div onclick="handleAdminNotifClick(\''+oid+'\', function(){ adminShowOrderDetail('+i+'); })" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:'+(i<recent.length-1?'4px':'0')+';background:'+(isReadOrder ? '#f8fafc' : '#fef2f2')+';border:1px solid '+(isReadOrder ? '#e2e8f0' : '#fecaca')+';opacity:'+(isReadOrder ? '0.75' : '1')+'">'
      + '<div style="width:7px;height:7px;border-radius:50%;background:'+stColor+';flex-shrink:0"></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:700;color:'+(isReadOrder ? '#64748b' : '#1e293b')+'">طلب #'+String(o.id).slice(-6)+(isReadOrder ? ' <span style="font-size:.58rem;color:#94a3b8;font-weight:400">(مقروء)</span>' : '')+'</div>'
      + '<div style="font-size:.65rem;color:#64748b">'+(o.customer?.name || '')+' • '+(o.total?o.total+' ₪':'')+'</div></div>'
      + '<span style="font-size:.6rem;padding:2px 7px;border-radius:999px;background:'+stColor+'15;color:'+stColor+';font-weight:800">'+stLabel+'</span>'
      + '</div>';
  });

  var headerControlHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<button onclick="filterQuickAdminNotifs(\'all\')" style="background:'+(_quickAdminNotifFilter==='all'?'#8b5cf6':'#f1f5f9')+';color:'+(_quickAdminNotifFilter==='all'?'#fff':'#64748b')+';border:none;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;cursor:pointer">الكل</button>'
    + '<button onclick="filterQuickAdminNotifs(\'unread\')" style="background:'+(_quickAdminNotifFilter==='unread'?'#8b5cf6':'#f1f5f9')+';color:'+(_quickAdminNotifFilter==='unread'?'#fff':'#64748b')+';border:none;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;cursor:pointer">غير مقروء <i class="fa-solid fa-bolt"></i></button>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<button onclick="clearAllQuickAdminNotifs()" style="background:none;border:none;color:#ef4444;font-size:.65rem;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-check-double"></i> تعليم الكل كمقروء</button>'
    + '<button onclick="openClearNotifsConfirm()" style="background:none;border:none;color:#dc2626;font-size:.65rem;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-trash-can"></i> مسح الكل</button>'
    + '</div>'
    + '</div>';

  drop.innerHTML = '<div style="font-size:.75rem;font-weight:800;color:#1e293b;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between"><span style="display:flex;align-items:center;gap:6px"><i class="fa-solid fa-bell" style="color:#8b5cf6;font-size:.65rem"></i> الإشعارات</span><button onclick="closeAdminNotifDropdown()" style="background:none;border:none;color:#94a3b8;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + headerControlHtml
    + (itemsHtml || '<div style="font-size:.7rem;color:#94a3b8;text-align:center;padding:16px 0">'+(_quickAdminNotifFilter==='unread'?'لا توجد إشعارات غير مقروءة':'لا توجد إشعارات')+'</div>')
    + '<div style="border-top:1px solid #f1f5f9;margin-top:6px;padding-top:6px;text-align:center">'
    + '<button onclick="handleAdminNotifClick(null, function(){ switchAdminTab(\'orders\'); })" style="background:none;border:none;font-size:.65rem;color:#8b5cf6;font-weight:800;cursor:pointer;font-family:inherit;padding:4px 0">عرض كل الطلبات <i class="fa-solid fa-arrow-left"></i></button></div>';
  document.body.appendChild(drop);
  setTimeout(function(){ document.addEventListener('click', closeAdminNotifOutside); }, 10);
}
function closeAdminNotifDropdown() {
  var d = document.getElementById('adminNotifDropdown');
  if (d) d.remove();
  document.removeEventListener('click', closeAdminNotifOutside);
}
function closeAdminNotifOutside(e) {
  var d = document.getElementById('adminNotifDropdown');
  var btn = document.getElementById('adminNotifBtn');
  if (d && btn && !d.contains(e.target) && !btn.contains(e.target)) closeAdminNotifDropdown();
}

function closeNotifArticleModal() {
  var m = document.getElementById('notifArticleModal');
  if (m) { m.remove(); document.body.style.overflow = ''; }
}

function openNotifArticle(idx) {
  var list = window._notifList || [];
  var n = list[idx];
  if (!n) return;
  var overlay = document.createElement('div');
  overlay.id = 'notifArticleModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Tajawal,sans-serif';
  overlay.onclick = function(e) { if (e.target === overlay) closeNotifArticleModal(); };
  var body = n.postBody || n.message || '';
  overlay.innerHTML = '<div style="background:#fff;border-radius:20px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fadeUp .25s ease" onclick="event.stopPropagation()">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:#fff;border-radius:20px 20px 0 0;z-index:1">'
    + '<div><h3 style="margin:0;font-size:1.1rem;font-weight:900;color:#1e293b">'+(n.title||'')+'</h3>'
    + '<span style="font-size:.7rem;color:#64748b"><i class="fa-solid fa-pen"></i> مقال</span></div>'
    + '<button onclick="closeNotifArticleModal()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#94a3b8;padding:4px"><i class="fa-solid fa-xmark"></i></button></div>'
    + '<div style="padding:20px;font-size:.9rem;line-height:1.8;color:#334155">'
    + (n.image ? '<img src="'+n.image+'" style="width:100%;max-height:300px;object-fit:cover;border-radius:12px;margin-bottom:16px" onerror="this.style.display=\'none\'">' : '')
    + body.replace(/\n/g,'<br>')
    + '</div>'
    + (n.link ? '<div style="padding:0 20px 18px"><a href="'+n.link+'" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#10b981;color:#fff;border-radius:10px;text-decoration:none;font-weight:800;font-size:.85rem"><i class="fa-solid fa-arrow-up-right-from-square"></i> اقرأ المزيد</a></div>' : '')
    + '</div>';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function startAdminNotifCheck() {
  adminNotifOrderCount = JSON.parse(localStorage.getItem('mycart_orders') || '[]').length;
  if (adminNotifInterval) clearInterval(adminNotifInterval);
  checkAdminNewOrders();
  adminNotifInterval = setInterval(checkAdminNewOrders, 3000);
  if (typeof window.__supabaseStartLive === 'function') { try { window.__supabaseStartLive(); } catch(e) {} }
}

// Listen for storage changes from other tabs (same origin)
try { window.addEventListener('storage', function(e) {
  if (e.key === 'mycart_store_notifications' || e.key === 'mycart_orders') {
    checkAdminNewOrders();
  }
}); } catch(se) {}

// Start notification check when admin is opened

// Wrap admin functions after quick-admin.js loads
var _adminLoaded = false;
function wrapAdminFns() {
  if (typeof closeAdmin !== 'function' || _adminLoaded) return;
  _adminLoaded = true;
  var origCA = closeAdmin;
  closeAdmin = function() {
    origCA();
    if (adminNotifInterval) clearInterval(adminNotifInterval);
    if (typeof window.__supabaseStopLive === 'function') { try { window.__supabaseStopLive(); } catch(e) {} }
  };
  initAdminFns();
}
wrapAdminFns();

// Deferred admin function overrides (run after quick-admin.js loads)
function initAdminFns() {
  const origAdminExport = adminExport;
  adminExport = function() {
    const data = {
      products, settings: loadAdminSettings(),
      categories: JSON.parse(localStorage.getItem('mycart_categories') || '[]'),
      discountCodes: JSON.parse(localStorage.getItem('mycart_discount_codes') || '[]'),
      orders: JSON.parse(localStorage.getItem('mycart_orders') || '[]'),
      cart: JSON.parse(localStorage.getItem('mycart_cart') || '[]'),
      customer: JSON.parse(localStorage.getItem('mycart_customer') || '{}'),
      logo: localStorage.getItem('mycart_logo') || '',
      bg: localStorage.getItem('mycart_bg') || '',
      marketing: JSON.parse(localStorage.getItem('mycart_marketing')) || {},
      date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `متجري-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    document.getElementById('adminDataStatus').textContent = 'تم التصدير';
  };
  const origAdminImport = adminImport;
  adminImport = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.categories) { try { localStorage.setItem('mycart_categories', JSON.stringify(data.categories)); } catch(e) {} }
        if (data.discountCodes) { try { localStorage.setItem('mycart_discount_codes', JSON.stringify(data.discountCodes)); } catch(e) {} }
        if (data.products) { products.length = 0; products.push(...data.products); saveProductsToLS(); }
        if (data.settings) { try { localStorage.setItem('mycart_admin_settings', JSON.stringify(data.settings)); } catch(e) {} adminSettings = data.settings; WHOLESALE_CODE = data.settings.wholesaleCode || ''; CURRENCY = data.settings.currency || '₪'; }
        if (data.orders) { try { localStorage.setItem('mycart_orders', JSON.stringify(data.orders)); } catch(e) {} }
        if (data.cart) { try { localStorage.setItem('mycart_cart', JSON.stringify(data.cart)); } catch(e) {} }
        if (data.customer) { try { localStorage.setItem('mycart_customer', JSON.stringify(data.customer)); } catch(e) {} }
        if (data.logo) { try { localStorage.setItem('mycart_logo', data.logo); } catch(e) {} document.getElementById('storeLogo').src = data.logo; }
        if (data.bg) { try { localStorage.setItem('mycart_bg', data.bg); } catch(e) {} document.getElementById('header').style.setProperty('--header-bg', `url(${data.bg})`); document.getElementById('header').classList.add('has-bg'); }
        if (data.marketing) { try { localStorage.setItem('mycart_marketing', JSON.stringify(data.marketing)); } catch(e) {} }
        renderProducts(getFilteredProducts());
        renderCartItems();
        document.getElementById('adminDataStatus').textContent = 'تم الاستيراد';
        adminRefreshAll();
        showToast('تم استيراد البيانات', 'success');
      } catch(err) { showToast('ملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  adminResetAll = function() {
    showConfirmModal('هل أنت متأكد من حذف كل البيانات؟<br><small style="color:#ef4444">لا يمكن التراجع</small>', function() {
      showConfirmModal('تأكيد نهائي — سيتم مسح جميع البيانات؟', function() {
        localStorage.removeItem('mycart_admin_products');
        localStorage.removeItem('mycart_admin_settings');
        localStorage.removeItem('mycart_orders');
        localStorage.removeItem('mycart_cart');
        localStorage.removeItem('mycart_customer');
        localStorage.removeItem('mycart_logo');
        localStorage.removeItem('mycart_bg');
        localStorage.removeItem('mycart_wholesale');
        localStorage.removeItem('mycart_categories');
        localStorage.removeItem('mycart_discount_codes');
        localStorage.removeItem('mycart_marketing');
        products.length = 0;
        adminRefreshAll();
        showToast('تم إعادة تعيين الكل', 'success');
      });
    });
  };
}

window.addEventListener('storage', function(e) {
  if (e.key === 'mycart_admin_products_sync' || e.key === 'mycart_admin_settings_sync' || e.key === 'mycart_admin_categories_sync') {
    products = loadProducts();
    adminSettings = loadAdminSettings();
    CURRENCY = adminSettings.currency || '₪';
    WHOLESALE_CODE = localStorage.getItem('mycart_wholesale_code') || adminSettings.wholesaleCode || '';
    renderCategories();
    renderProducts(getFilteredProducts());
  }
});

// Sync zone change to re-render totals

document.addEventListener('change', function(e) {
  if (e.target.id === 'custZone') {
    renderCartItems();
    renderStep2Summary();
  }
});

// Marketing Helpers

let promoInterval = null;

function startPromoCountdown(durationMinutes) {
  if (promoInterval) clearInterval(promoInterval);
  var storageKey = 'mycart_promo_start';
  var saved = localStorage.getItem(storageKey);
  var startTime = saved ? parseInt(saved) : null;
  var now = Date.now();
  var totalMs = durationMinutes * 60 * 1000;

  if (!startTime || (now - startTime) > totalMs) {
    startTime = now;
    try { localStorage.setItem(storageKey, startTime.toString()); } catch(e) {}
  }

  var elapsed = now - startTime;
  var remainingMs = Math.max(0, totalMs - elapsed);

  function updateTimerDisplay() {
    var totalSec = Math.ceil(remainingMs / 1000);
    if (totalSec <= 0) {
      var el = document.getElementById('countdownTimer');
      if (el) el.textContent = '00:00:00';
      clearInterval(promoInterval);
      return;
    }
    var hrs = Math.floor(totalSec / 3600);
    var mins = Math.floor((totalSec % 3600) / 60);
    var secs = totalSec % 60;
    var pad = function(n) { return String(n).padStart(2, '0'); };
    var timerEl = document.getElementById('countdownTimer');
    if (timerEl) timerEl.textContent = pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
  }

  updateTimerDisplay();
  promoInterval = setInterval(function() {
    remainingMs = Math.max(0, remainingMs - 1000);
    updateTimerDisplay();
  }, 1000);
}

function copyProductLink() {
  if (!currentProduct) return;
  const link = `${window.location.origin}${window.location.pathname}#product/${currentProduct.id}`;
  navigator.clipboard.writeText(link).then(() => {
    showToast('تم نسخ رابط المنتج بنجاح!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = link; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('تم نسخ رابط المنتج بنجاح!', 'success');
  });
}

function quickWaOrder() {
  if (!currentProduct) return;
  const marketingData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const waNumber = marketingData.social?.whatsapp;
  if (!waNumber) {
    showToast('رقم الواتساب غير مضبوط بلوحة التحكم!', 'error');
    return;
  }
  
  let cleanNumber = waNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber.startsWith('972') && !cleanNumber.startsWith('962') && !cleanNumber.startsWith('966') && cleanNumber.startsWith('0')) {
    cleanNumber = '972' + cleanNumber.substring(1);
  }
  
  const quantity = parseInt(document.getElementById('detailQty').textContent) || 1;
  const price = wPrice(currentProduct);
  const total = price * quantity;
  
  let selectedDetails = '';
  if (window._selOptions) {
    const opts = Object.entries(window._selOptions).map(([k, v]) => `${k}: ${v}`).join(', ');
    if (opts) selectedDetails = ` (${opts})`;
  }
  
  const msg = `مرحباً، أود طلب المنتج التالي:\n- المنتج: ${currentProduct.name}${selectedDetails}\n- الكمية: ${quantity}\n- السعر: ${CURRENCY}${total}\n\nيرجى تأكيد الطلب.`;
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ─── Promo Popup ─────────────────────────────────────────────

function copyPromoCode() {
  const code = document.getElementById('promoPopupCode')?.textContent;
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    showToast(`تم نسخ الكود: ${code}`, 'success');
    closePromoPopup();
  }).catch(() => {
    showToast(`الكود: ${code}`, 'success');
    closePromoPopup();
  });
}

// ─── Social Proof Notifications ──────────────────────────────

const _SP_NAMES = ['أحمد','محمد','فاطمة','نور','علي','سارة','عمر','مريم','خالد','لانا'];

const _SP_CITIES = ['القدس','رام الله','نابلس','الخليل','جنين','طولكرم','عمّان','جدة','الرياض','دبي'];

const _SP_TIMES = ['منذ دقيقتين','منذ 5 دقائق','منذ 12 دقيقة','منذ 20 دقيقة','قبل ساعة'];

function showSocialProofToast() {
  const toast = document.getElementById('socialProofToast');
  if (!toast || !products.length) return;
  const rProd = products[Math.floor(Math.random() * products.length)];
  const rName = _SP_NAMES[Math.floor(Math.random() * _SP_NAMES.length)];
  const rCity = _SP_CITIES[Math.floor(Math.random() * _SP_CITIES.length)];
  const rTime = _SP_TIMES[Math.floor(Math.random() * _SP_TIMES.length)];
  document.getElementById('spUser').textContent = `${rName} من ${rCity}`;
  document.getElementById('spAction').textContent = `اشترى "${rProd.name}"`;
  document.getElementById('spTime').textContent = rTime;
  toast.classList.remove('hide');
  toast.style.display = 'flex';
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => { toast.style.display = 'none'; toast.classList.remove('hide'); }, 400);
  }, 5000);
}

// ─── Customer Reviews ─────────────────────────────────────────

function toggleReviewForm() {
  const form = document.getElementById('addReviewForm');
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function submitCustomerReview(e) {
  e.preventDefault();
  if (!currentProduct) return;
  const name = document.getElementById('revName').value.trim();
  const stars = parseInt(document.getElementById('revStars').value);
  const comment = document.getElementById('revComment').value.trim();
  if (!name || !comment) return;
  const allReviews = JSON.parse(localStorage.getItem('mycart_reviews') || '{}');
  if (!allReviews[currentProduct.id]) allReviews[currentProduct.id] = [];
  allReviews[currentProduct.id].unshift({ name, stars, comment, date: new Date().toLocaleDateString('ar') });
  localStorage.setItem('mycart_reviews', JSON.stringify(allReviews));
  loadProductReviews(currentProduct.id);
  document.getElementById('addReviewForm').reset();
  document.getElementById('addReviewForm').style.display = 'none';
  showToast('تم إرسال تقييمك بنجاح!', 'success');
}

// Volume discount applied on cart totals

// Dark Mode

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('mycart_dark_mode', isDark ? '1' : '0');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  if (btn) btn.title = isDark ? 'الوضع النهاري' : 'الوضع الليلي';
}

function applyStoredTheme() {
  const stored = localStorage.getItem('mycart_dark_mode');
  if (stored === '1') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-sun"></i>'; btn.title = 'الوضع النهاري'; }
  }
}

function applyStoreCardVisibility() {
  var btn = document.getElementById('storeInfoBtn');
  if (!btn) return;
  var show = adminSettings.showStoreCard !== false;
  btn.style.display = show ? '' : 'none';
}

function showStoreInfo() {
  var s = loadAdminSettings();
  if (s.showStoreCard === false) return;
  var phone = s.phone || '';
  var whatsapp = s.whatsapp || '';
  var email = s.email || '';
  var address = s.address || '';
  var hours = s.hours || '';
  var storeName = s.storeName || 'متجري';
  var tagline = s.tagline || '';
  var logo = s.logo || '';
  var lat = s.lat || '';
  var lng = s.lng || '';
  var accent = s.accentColor || '#ef4444';
  var h = [];
  // ===== الهيدر المتدرج =====
  h.push('<div style="position:relative;overflow:hidden;background:linear-gradient(135deg,' + accent + ',color-mix(in srgb,' + accent + ' 60%,#000));padding:28px 20px 56px;text-align:center;color:#fff">');
  h.push('<div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08)"></div>');
  h.push('<div style="position:absolute;bottom:-40px;left:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.07)"></div>');
  h.push('<div style="position:absolute;top:14px;left:18px;opacity:.5;font-size:2.6rem"><i class="fa-solid fa-store"></i></div>');
  if (tagline) h.push('<div style="font-size:.8rem;font-weight:700;letter-spacing:.5px;background:rgba(255,255,255,.18);display:inline-block;padding:4px 16px;border-radius:999px;backdrop-filter:blur(4px);position:relative;z-index:1">' + tagline + '</div>');
  h.push('</div>');
  // ===== الشعار فوق الهيدر =====
  if (logo) h.push('<div style="text-align:center;margin-top:-44px;position:relative;z-index:2"><div style="display:inline-block;max-width:200px;width:auto;height:auto;border-radius:16px;background:#fff;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.18)"><div style="width:auto;height:auto;max-height:84px;border-radius:10px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);overflow:hidden;display:flex;align-items:center;justify-content:center;padding:6px"><img src="' + logo + '" alt="' + storeName + '" style="max-width:180px;max-height:72px;width:auto;height:auto;object-fit:contain;display:block" onerror="this.parentElement.style.display=\'none\'"></div></div></div>');
  // ===== اسم المتجر =====
  h.push('<div style="text-align:center;padding:14px 20px 18px">');
  h.push('<div style="display:flex;align-items:center;justify-content:center;gap:8px"><span style="font-weight:900;font-size:1.35rem;color:var(--text)">' + storeName + '</span><span title="متجر موثّق" style="position:relative;display:inline-flex;width:32px;height:32px;flex-shrink:0;filter:drop-shadow(0 2px 5px rgba(24,119,242,.45))"><span style="position:absolute;inset:0;background:#fff;clip-path:polygon(50% 0%, 60% 27%, 85% 15%, 73% 40%, 100% 50%, 73% 60%, 85% 85%, 60% 73%, 50% 100%, 40% 73%, 15% 85%, 27% 60%, 0% 50%, 27% 40%, 15% 15%, 40% 27%)"></span><span style="position:absolute;inset:1.5px;background:linear-gradient(180deg,#1877F2,#1458b3);clip-path:polygon(50% 0%, 60% 27%, 85% 15%, 73% 40%, 100% 50%, 73% 60%, 85% 85%, 60% 73%, 50% 100%, 40% 73%, 15% 85%, 27% 60%, 0% 50%, 27% 40%, 15% 15%, 40% 27%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.78rem;font-weight:900"><i class="fa-solid fa-check"></i></span></span></div>');
  if (!tagline && !logo) h.push('<div style="font-size:.8rem;color:var(--text-muted)">بطاقة تعريفية</div>');
  h.push('</div>');
  // ===== صور توثيق المتجر =====
  var storeImgs = (typeof getAdminStoreImages === 'function') ? getAdminStoreImages() : (s.storeImages || []);
  if (storeImgs.length) {
    h.push('<div style="margin:6px 16px 0"><div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-images" style="color:' + accent + '"></i> صور المتجر <span style="font-size:.62rem;color:var(--text-muted);font-weight:500">(اضغط على الصورة لمعاينتها)</span></div><div id="storeInfoImgsRow" class="store-img-scroll" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch">' + storeImgs.map(function(img, i) { return '<div onclick="showStoreImagePreview(' + i + ')" style="flex:0 0 auto;width:160px;height:160px;overflow:hidden;border-radius:10px;background:var(--border);cursor:pointer" title="معاينة الصورة"><img src="' + img + '" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s" onmouseover="this.style.transform=\'scale(1.08)\'" onmouseout="this.style.transform=\'scale(1)\'"></div>'; }).join('') + '</div><div id="storeInfoImgsDots" style="display:flex;justify-content:center;gap:6px;margin-top:8px"></div></div>');
  }
  // ===== معلومات الاتصال =====
  var tiles = [];
  function infoTile(icon, color, label, text, link) {
    var el = (link ? '<a href="' + link + '" target="_blank" rel="noopener"' : '<div') + ' style="flex:1 1 calc(50% - 6px);min-width:0;display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:14px;text-decoration:none;box-shadow:0 1px 6px rgba(0,0,0,.04);transition:transform .18s,box-shadow .18s,border-color .18s" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 16px rgba(0,0,0,.08)\';this.style.borderColor=\'' + color + '55\'" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 1px 6px rgba(0,0,0,.04)\';this.style.borderColor=\'var(--border)\'"><span style="width:34px;height:34px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,' + color + ' 12%,transparent);color:' + color + ';font-size:.95rem"><i class="' + icon + '"></i></span><span style="min-width:0"><span style="display:block;font-size:.6rem;color:var(--text-muted);font-weight:700">' + label + '</span><span dir="ltr" style="display:block;font-size:.82rem;font-weight:700;color:var(--text);text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + text + '</span></span>' + (link ? '</a>' : '</div>');
    return el;
  }
  if (phone) tiles.push(infoTile('fa-solid fa-phone', accent, 'هاتف', phone, 'tel:' + phone));
  if (whatsapp) tiles.push(infoTile('fa-brands fa-whatsapp', '#25d366', 'واتساب', whatsapp, 'https://wa.me/' + whatsapp.replace(/[^0-9]/g, '')));
  if (email) tiles.push(infoTile('fa-solid fa-envelope', '#ea4335', 'بريد', email, 'mailto:' + email));
  if (address) tiles.push(infoTile('fa-solid fa-location-dot', '#f59e0b', 'العنوان', address, ''));
  if (hours) tiles.push(infoTile('fa-solid fa-clock', '#10b981', 'ساعات العمل', hours, ''));
  if (tiles.length) {
    h.push('<div style="margin:10px 16px 2px;display:flex;flex-wrap:wrap;gap:8px">' + tiles.join('') + '</div>');
  }
  // ===== الخريطة =====
  if (lat && lng) {
    h.push('<div style="margin:12px 16px;border-radius:18px;overflow:hidden;border:1px solid var(--border);box-shadow:0 2px 12px rgba(0,0,0,.06)">');
    h.push('<div style="position:relative"><iframe src="https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=16&output=embed&hl=ar" width="100%" height="160" style="border:0;display:block;pointer-events:auto" allowfullscreen="" loading="lazy"></iframe><span style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.95);border-radius:999px;padding:4px 10px;font-size:.68rem;font-weight:700;color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;gap:5px"><i class="fa-solid fa-location-dot" style="color:#ea4335"></i> ' + (address || 'موقع المتجر') + '</span></div>');
    h.push('<div style="padding:8px 12px;background:var(--card);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><span style="font-size:.72rem;color:var(--text-muted)"><i class="fa-solid fa-route" style="color:' + accent + '"></i> ' + (address || 'موقع المتجر') + '</span><a href="https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '" target="_blank" rel="noopener" style="padding:6px 14px;border-radius:999px;background:color-mix(in srgb,' + accent + ' 12%,transparent);color:' + accent + ';text-decoration:none;font-size:.72rem;font-weight:700"><i class="fa-solid fa-diamond-turn-right"></i> الاتجاهات</a></div>');
    h.push('</div>');
  } else if (address) {
    h.push('<div style="margin:12px 16px;padding:14px;background:var(--card);border:1px dashed var(--border);border-radius:14px;display:flex;align-items:center;gap:10px"><i class="fa-solid fa-location-dot" style="color:#f59e0b;font-size:1rem"></i><span style="font-size:.82rem;color:var(--text);font-weight:600">' + address + '</span></div>');
  }
  // ===== روابط التواصل الاجتماعي =====
  var social = {};
  try { var mktSocial = (JSON.parse(localStorage.getItem('mycart_marketing')) || {}).social || {}; Object.keys(mktSocial).forEach(function(k){ if (mktSocial[k]) social[k] = mktSocial[k]; }); } catch(e) {}
  var cardSocial = s.social || {};
  Object.keys(cardSocial).forEach(function(k){ if (cardSocial[k]) social[k] = cardSocial[k]; });
  var socialDefs = [
    ['facebook', 'fa-brands fa-facebook-f', '#1877f2', '#ffffff', 'تابعنا على فيسبوك'],
    ['instagram', 'fa-brands fa-instagram', 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', '#ffffff', 'تابعنا على انستغرام'],
    ['twitter', 'fa-brands fa-x-twitter', '#0f1419', '#ffffff', 'تابعنا على إكس'],
    ['tiktok', 'fa-brands fa-tiktok', '#010101', '#ffffff', 'تابعنا على تيك توك'],
    ['youtube', 'fa-brands fa-youtube', '#ff0000', '#ffffff', 'قناتنا على يوتيوب'],
    ['telegram', 'fa-brands fa-telegram', '#229ed9', '#ffffff', 'قناتنا على تيليغرام'],
    ['snapchat', 'fa-brands fa-snapchat', '#fffc00', '#000000', 'تابعنا على سناب شات'],
    ['website', 'fa-solid fa-globe', '#0ea5e9', '#ffffff', 'موقعنا الإلكتروني']
  ];
  var socialLinks = socialDefs.filter(function(d) { return social[d[0]]; });
  if (socialLinks.length) {
    h.push('<div style="margin:10px 16px 2px;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:12px 14px;box-shadow:0 2px 12px rgba(0,0,0,.04)"><div style="font-size:.72rem;font-weight:800;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-share-nodes" style="color:' + accent + '"></i> تابعنا على</div><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">' + socialLinks.map(function(d) { return '<a href="' + social[d[0]] + '" target="_blank" rel="noopener" title="' + d[3] + '" style="width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:' + d[2] + ';color:' + d[3] + ';font-size:1.1rem;text-decoration:none;box-shadow:0 4px 12px color-mix(in srgb,' + (d[2].indexOf('gradient') === -1 ? d[2] : '#dc2743') + ' 30%,transparent);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform=\'translateY(-3px) scale(1.06)\';this.style.boxShadow=\'0 10px 20px color-mix(in srgb,' + (d[2].indexOf('gradient') === -1 ? d[2] : '#dc2743') + ' 45%,transparent)\'" onmouseout="this.style.transform=\'translateY(0) scale(1)\';this.style.boxShadow=\'0 4px 12px color-mix(in srgb,' + (d[2].indexOf('gradient') === -1 ? d[2] : '#dc2743') + ' 30%,transparent)\'"><i class="' + d[1] + '"></i></a>'; }).join('') + '</div></div>');
  }
  // ===== أزرار الإجراء =====
  var btns = [];
  if (whatsapp) btns.push('<a href="https://wa.me/' + whatsapp.replace(/[^0-9]/g, '') + '" target="_blank" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 10px;border-radius:14px;background:#25d366;color:#fff;font-size:.85rem;font-weight:800;text-decoration:none;box-shadow:0 6px 16px rgba(37,211,102,.3)"><i class="fa-brands fa-whatsapp" style="font-size:1.1rem"></i> واتساب</a>');
  if (phone) btns.push('<a href="tel:' + phone + '" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 10px;border-radius:14px;background:linear-gradient(135deg,' + accent + ',color-mix(in srgb,' + accent + ' 70%,#000));color:#fff;font-size:.85rem;font-weight:800;text-decoration:none;box-shadow:0 6px 16px color-mix(in srgb,' + accent + ' 35%,transparent)"><i class="fa-solid fa-phone" style="font-size:1rem"></i> اتصل</a>');
  if (btns.length) h.push('<div style="display:flex;gap:10px;padding:6px 16px 4px">' + btns.join('') + '</div>');
  // ===== تذييل =====
  h.push('<div style="text-align:center;padding:16px 16px 10px"><div style="font-size:.68rem;color:var(--text-muted);letter-spacing:.3px">' + storeName + ' &copy; ' + new Date().getFullYear() + '</div></div>');
  var html = '<div style="padding:0 0 10px">' + h.join('') + '</div>';
  var body = document.getElementById('storeInfoBody');
  if (body) body.innerHTML = html;
  if (storeImgs.length > 1) initStoreImgDots(storeImgs.length, accent);
  var sheet = document.getElementById('storeInfoSheet');
  if (sheet) {
    var heading = sheet.querySelector('.sheet-header h2');
    if (heading) heading.innerHTML = (storeName || 'المتجر');
    var avatar = document.getElementById('storeInfoAvatar');
    if (avatar) {
      if (logo) {
        avatar.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;border-radius:12px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);overflow:hidden;padding:5px;box-sizing:border-box"><img src="' + logo + '" alt="' + storeName + '" style="max-width:130px;max-height:38px;width:auto;height:auto;object-fit:contain;display:block" onerror="this.parentElement.parentElement.innerHTML=\'<i class=\\\'fa-solid fa-store\\\'></i>\'"></div>';
        avatar.style.display = 'inline-flex';
        avatar.style.width = 'auto';
        avatar.style.height = 'auto';
        avatar.style.maxWidth = '150px';
        avatar.style.borderRadius = '14px';
        avatar.style.padding = '3px';
        avatar.style.background = '#fff';
        avatar.style.boxShadow = '0 4px 12px rgba(0,0,0,.16)';
      } else {
        avatar.innerHTML = '<i class="fa-solid fa-store" style="z-index:1"></i>';
        avatar.style.background = 'linear-gradient(135deg,' + accent + ',color-mix(in srgb,' + accent + ' 60%,#000))';
        avatar.style.padding = '0';
      }
    }
    sheet.classList.add('show');
  }
  document.body.style.overflow = 'hidden';
}

function closeStoreInfoSheet() {
  var sheet = document.getElementById('storeInfoSheet');
  if (sheet) sheet.classList.remove('show');
  document.body.style.overflow = '';
}

function initStoreImgDots(n, accent) {
  var row = document.getElementById('storeInfoImgsRow');
  var wrap = document.getElementById('storeInfoImgsDots');
  if (!row || !wrap) return;
  var items = Array.prototype.slice.call(row.children);
  var dir = (getComputedStyle(row).direction || 'rtl');
  var dots = [];
  var lockUntil = 0;
  for (var p = 0; p < 2; p++) {
    (function(pg) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'store-img-dot';
      if (pg === 0) d.classList.add('active');
      d.onclick = function() {
        lockUntil = Date.now() + 700;
        markActive(pg);
        var target = pg === 0 ? items[0] : items[items.length - 1];
        target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      };
      wrap.appendChild(d);
      dots.push(d);
    })(p);
  }
  function activePos() {
    var rowRect = row.getBoundingClientRect();
    var idx = 0;
    for (var k = 0; k < items.length; k++) {
      var r = items[k].getBoundingClientRect();
      if (dir === 'rtl') {
        if (r.right >= rowRect.right - 8) idx = k;
      } else {
        if (r.left <= rowRect.left + 8) idx = k;
      }
    }
    return idx >= items.length - 1 ? 1 : 0;
  }
  function markActive(pg) {
    dots.forEach(function(d, k) {
      var on = k === pg;
      d.style.background = on ? accent : '#cbd5e1';
      d.style.transform = on ? 'scale(1.25)' : 'scale(1)';
      d.classList.toggle('active', on);
    });
  }
  markActive(0);
  row.addEventListener('scroll', function() {
    if (Date.now() < lockUntil) return;
    markActive(activePos());
  }, { passive: true });
}

function showStoreImagePreview(idx) {
  var s = loadAdminSettings();
  var imgs = (typeof getAdminStoreImages === 'function') ? getAdminStoreImages() : (s.storeImages || []);
  if (!imgs.length || typeof idx !== 'number') return;
  openStoreImgLightbox(imgs, idx);
}

function openStoreImgLightbox(imgs, idx) {
  var overlay = document.createElement('div');
  overlay.id = 'storeImgLightbox';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;flex-direction:column;padding:20px;animation:fadeIn .2s ease';
  var counter = document.createElement('div');
  counter.style.cssText = 'color:#cbd5e1;font-size:.8rem;font-weight:700;margin-bottom:10px';
  var img = document.createElement('img');
  img.style.cssText = 'max-width:92vw;max-height:74vh;border-radius:14px;object-fit:contain;box-shadow:0 12px 50px rgba(0,0,0,.5);background:#000';
  var navRow = document.createElement('div');
  navRow.style.cssText = 'display:flex;gap:14px;margin-top:16px;align-items:center';
  var btnBase = 'width:46px;height:46px;border:none;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:1.05rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .15s;font-family:inherit';
  var prev = document.createElement('button');
  prev.style.cssText = btnBase;
  prev.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  var next = document.createElement('button');
  next.style.cssText = btnBase;
  next.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;width:42px;height:42px;border:none;border-radius:50%;background:rgba(239,68,68,.85);color:#fff;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  var current = idx;
  function render() {
    var url = imgs[current];
    img.src = url;
    counter.textContent = (current + 1) + ' / ' + imgs.length;
    prev.style.visibility = imgs.length > 1 ? 'visible' : 'hidden';
    next.style.visibility = imgs.length > 1 ? 'visible' : 'hidden';
  }
  function close() {
    if (overlay.parentNode) document.body.removeChild(overlay);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') { current = (current + 1) % imgs.length; render(); }
    if (e.key === 'ArrowRight') { current = (current - 1 + imgs.length) % imgs.length; render(); }
  }
  prev.onclick = function(e) { e.stopPropagation(); current = (current - 1 + imgs.length) % imgs.length; render(); };
  next.onclick = function(e) { e.stopPropagation(); current = (current + 1) % imgs.length; render(); };
  closeBtn.onclick = close;
  overlay.onclick = function(e) { if (e.target === overlay) close(); };
  document.addEventListener('keydown', onKey);

  navRow.appendChild(prev);
  navRow.appendChild(next);
  overlay.appendChild(closeBtn);
  overlay.appendChild(counter);
  overlay.appendChild(img);
  overlay.appendChild(navRow);
  render();
  document.body.appendChild(overlay);
}

// Smart Search

function filterProducts(q) {
  if (!q || q.length < 1) { renderProducts(products); return; }
  renderProducts(products.filter(function(p) {
    var name = (p.name || '').toLowerCase();
    var desc = (p.description || '').toLowerCase();
    var cat = (Array.isArray(p.category) ? p.category.join(' ') : (p.category || '')).toLowerCase();
    return name.indexOf(q) > -1 || desc.indexOf(q) > -1 || cat.indexOf(q) > -1;
  }));
}

function initSmartSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    filterProducts(q);
    if (!q || q.length < 1) { container.style.display = 'none'; return; }
    // dropdown suggestions
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (Array.isArray(p.category) ? p.category.join(' ') : (p.category || '')).toLowerCase().includes(q)
    ).slice(0, 6);
    if (!matches.length) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.innerHTML = matches.map(p => {
      const img = Array.isArray(p.images) ? p.images[0] : p.image;
      return `<div class="suggestion-item" onclick="openSuggestion(${p.id})">
        <img src="${img}" alt="${p.name}" onerror="this.src='https://placehold.co/36x36/ef4444/fff?text=?'">
        <div class="suggestion-info">
          <span class="suggestion-name">${p.name}</span>
          <span class="suggestion-price">${CURRENCY}${p.price}</span>
        </div>
      </div>`;
    }).join('');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#searchBar')) {
      const c = document.getElementById('searchSuggestions');
      if (c) c.style.display = 'none';
    }
  });
}

function openSuggestion(id) {
  const container = document.getElementById('searchSuggestions');
  if (container) container.style.display = 'none';
  document.getElementById('searchInput').value = '';
  if (id) openDetail(id);
}

// Advanced Product Filter

function toggleAdvFilter() {
  const bar = document.getElementById('advFilterBar');
  if (!bar) return;
  const showing = bar.style.display !== 'none';
  bar.style.display = showing ? 'none' : 'block';
  if (!showing) initFilterRange();
}

function initFilterRange() {
  const currentList = getFilteredProducts();
  if (!currentList.length) return;
  const prices = currentList.map(p => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minEl = document.getElementById('filterMinPrice');
  const maxEl = document.getElementById('filterMaxPrice');
  if (minEl) { minEl.min = minP; minEl.max = maxP; minEl.value = minP; }
  if (maxEl) { maxEl.min = minP; maxEl.max = maxP; maxEl.value = maxP; }
  const minLbl = document.getElementById('filterMinLabel');
  const maxLbl = document.getElementById('filterMaxLabel');
  if (minLbl) minLbl.textContent = minP;
  if (maxLbl) maxLbl.textContent = maxP;
}

function applyAdvFilter() {
  const minPrice = parseFloat(document.getElementById('filterMinPrice')?.value || 0);
  const maxPrice = parseFloat(document.getElementById('filterMaxPrice')?.value || 999999);
  const sort = document.getElementById('filterSort')?.value || 'default';
  const inStockOnly = document.getElementById('filterInStock')?.checked;
  const minLbl = document.getElementById('filterMinLabel');
  const maxLbl = document.getElementById('filterMaxLabel');
  if (minLbl) minLbl.textContent = minPrice;
  if (maxLbl) maxLbl.textContent = maxPrice;
  let filtered = getFilteredProducts().filter(p => {
    const inRange = p.price >= minPrice && p.price <= maxPrice;
    const stock = inStockOnly ? (p.stock === undefined || p.stock > 0) : true;
    return inRange && stock;
  });
  if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'discount') filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
  else if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  renderProducts(filtered);
}

function resetAdvFilter() {
  const sortEl = document.getElementById('filterSort');
  const stockEl = document.getElementById('filterInStock');
  if (sortEl) sortEl.value = 'default';
  if (stockEl) stockEl.checked = false;
  initFilterRange();
  renderProducts(getFilteredProducts());
}

// WhatsApp Order Notifications

function sendOwnerWhatsAppNotification(order) {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  // Only redirect if the toggle is enabled (default: true if never set)
  if (!mData.waNotif || mData.waNotif.show !== true) return;
  let waNumber = mData.social?.whatsapp || '';
  if (!waNumber) {
    const waBtn = document.getElementById('waBtn');
    if (waBtn) waNumber = (waBtn.href || '').replace('https://wa.me/', '').split('?')[0];
  }
  if (!waNumber) return;
  const cleanNumber = waNumber.replace(/\D/g, '');
  if (!cleanNumber) return;
  const itemsText = (order.items || []).map(i => `• ${i.name} × ${i.qty} = ${CURRENCY}${(i.price * i.qty).toFixed(2)}`).join('\n');
  const msg = `🛒 *طلب جديد #${String(order.id).slice(-6)}*\n\n` +
    `👤 *العميل:* ${order.customer?.name || '—'}\n` +
    `📞 *الهاتف:* ${order.customer?.phone || '—'}\n` +
    `📍 *العنوان:* ${order.customer?.city || ''} ${order.customer?.address || ''}\n\n` +
    `📦 *المنتجات:*\n${itemsText}\n\n` +
    `💰 *الإجمالي:* ${CURRENCY}${order.total?.toFixed(2) || '0.00'}`;
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function addBundleToCart() {
  const items = window._fbtBundleItems;
  if (!items || !items.length) return;
  const anyOut = items.some(item => item.stock === 0);
  if (anyOut) { showToast( __('outOfStock'), 'error'); return; }
  const marketingData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const discVal = marketingData.fbt?.discount || 10;
  const discType = marketingData.fbt?.discountType || 'percent';
  const totalOrig = items.reduce((s, item) => s + item.price, 0);
  
  items.forEach(item => {
    let discounted = item.price;
    if (discType === 'fixed') {
      discounted = totalOrig > 0 ? Math.round(item.price - (discVal * (item.price / totalOrig))) : item.price;
    } else {
      discounted = Math.round(item.price * (1 - (discVal / 100)));
    }
    addToCartWithPrice(item, Math.max(0, discounted));
  });
  
  const msg = discType === 'fixed' ? `بخصم ${discVal} ${CURRENCY}` : `بخصم ${discVal}%`;
  showToast(`تم إضافة الحزمة بنجاح ${msg}!`, 'success');
  openCartSheet();
}

// Spin & Win Wheel

// Daily Flash Sales

// Hook free delivery win into final price

const origRenderCartItems = renderCartItems;

renderCartItems = function() {
  origRenderCartItems();
  if (sessionStorage.getItem('free_delivery_win') === '1') {
    const delRow = document.getElementById('deliveryRow');
    if (delRow) delRow.style.display = 'none';
    const total = cart.reduce((sum, item) => sum + getVolumeDiscountedPrice(item.price, item.qty), 0);
    const discount = appliedDiscount > 0 ? Math.round(total * appliedDiscount / 100) : 0;
    document.getElementById('cartTotal').textContent = `${CURRENCY}${(total - discount).toFixed(2)}`;
  }
};

// Live Viewers Counter

// WhatsApp Floating Chat Widget

// ====== SUBSCRIPTION / FEE / SUSPENSION ======
var FREE_FEE = 2, FEE_LIMIT = 100, MONTHLY_PRICE = 100, ANNUAL_PRICE = 1000;

function getAgencySettings() {
  var priv = localStorage.getItem('mycart_store_private_config');
  if (priv) { try { return JSON.parse(priv); } catch(e){} }
  var raw = localStorage.getItem('mycart_agency_site_settings');
  if (raw) { try { return JSON.parse(raw); } catch(e){} }
  return { freeFee:'2', feeLimit:'100', monthlyFee:'100', annualFee:'1000', supportWa:'' };
}

function getStoreConfig() {
  var priv = localStorage.getItem('mycart_store_private_config');
  if (priv) { try { return JSON.parse(priv); } catch(e){} }
  return null;
}

function showAlertModal(msg) {
  var ov = document.createElement('div'); ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:99999;display:flex;align-items:center;justify-content:center';
  ov.innerHTML = '<div style="background:#fff;border-radius:18px;padding:28px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)"><div style="margin-bottom:14px;font-size:2.2rem"><i class="fa-solid fa-circle-check" style="color:#10b981"></i></div><p style="font-size:.9rem;font-weight:600;margin:0 0 18px;line-height:1.6">'+msg+'</p><button id="alertModalOk" style="width:100%;padding:10px;border:none;border-radius:10px;background:#06b6d4;color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">موافق</button></div>';
  document.body.appendChild(ov);
  document.getElementById('alertModalOk').onclick = function(){ document.body.removeChild(ov); };
}

function showConfirmModal(msg, fn) {
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  ov.innerHTML = '<div style="background:var(--card,#fff);border-radius:20px;max-width:380px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:28px 24px 22px;text-align:center">' +
    '<div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.5rem;color:#ef4444"><i class="fa-solid fa-trash-can"></i></div>' +
    '<h3 style="font-size:1rem;font-weight:800;margin:0 0 6px;color:var(--text,#1e293b)">تأكيد الحذف</h3>' +
    '<p style="font-size:.85rem;color:var(--text-muted,#64748b);margin:0 0 18px;line-height:1.6">' + msg + '</p>' +
    '<div style="display:flex;gap:10px">' +
      '<button id="confirmModalYes" style="flex:1;padding:10px;border:none;border-radius:12px;background:#ef4444;color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">نعم، احذف</button>' +
      '<button id="confirmModalNo" style="padding:10px 18px;border:1.5px solid var(--border,#e2e8f0);border-radius:12px;background:var(--card,#fff);color:var(--text-muted,#64748b);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit">إلغاء</button>' +
    '</div></div>';
  ov.onclick = function(e) { if (e.target === ov) { document.body.removeChild(ov); } };
  document.body.appendChild(ov);
  document.getElementById('confirmModalYes').onclick = function() { document.body.removeChild(ov); if (fn) fn(); };
  document.getElementById('confirmModalNo').onclick = function() { document.body.removeChild(ov); };
}

function getFeeInfo() {
  var rawCount = localStorage.getItem('mycart_free_orders_count');
  var cnt = rawCount !== null ? parseInt(rawCount, 10) : 0;
  if (cnt === 0) {
    let existingOrders = [];
    try { existingOrders = JSON.parse(localStorage.getItem('mycart_orders') || '[]'); } catch(e) {}
    let subLog = [];
    try { subLog = JSON.parse(localStorage.getItem('mycart_subscription_log') || '[]'); } catch(e) {}
    if (existingOrders.length > 0 && subLog.length === 0) {
      cnt = existingOrders.length;
      localStorage.setItem('mycart_free_orders_count', String(cnt));
    }
  }
  var sett = getAgencySettings();
  var fee = parseFloat(sett.freeFee) || 2, limit = parseFloat(sett.feeLimit) || 100;
  var plan = localStorage.getItem('mycart_subscription_plan') || 'free';
  var accrued = plan === 'free' ? cnt * fee : 0;
  if (plan === 'free' && accrued >= limit && !localStorage.getItem('mycart_fee_threshold_date') && localStorage.getItem('mycart_store_suspended') !== 'true') {
    var grace = new Date(); grace.setDate(grace.getDate() + 7);
    try { localStorage.setItem('mycart_fee_threshold_date', grace.toISOString()); } catch(e) {}
  }
  return { count:cnt, fee:fee, limit:limit, plan:plan, accrued:accrued, remaining:Math.max(0, limit - accrued) };
}

function paySubscriptionFees() {
  var amt = getFeeInfo().accrued;
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  ov.innerHTML = '<div style="background:var(--card,#fff);border-radius:20px;max-width:380px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:28px 24px 22px;text-align:center">' +
    '<div style="width:52px;height:52px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.5rem;color:#10b981"><i class="fa-solid fa-money-bill-transfer"></i></div>' +
    '<h3 style="font-size:1rem;font-weight:800;margin:0 0 4px;color:var(--text,#1e293b)">تسديد المستحقات</h3>' +
    '<p style="font-size:.8rem;color:var(--text-muted,#64748b);margin:0 0 16px;line-height:1.7"><strong style="color:#10b981">'+amt+' ₪</strong> المبلغ المستحق عليك.<br>أدخل كود الدفع الذي حصلت عليه من الشركة'.replace(/<br>/g,'<br>')+'</p>' +
    '<input id="payCodeInp" type="text" placeholder="F7-XXXXXXXX" autocomplete="off" style="width:100%;padding:12px 14px;border:2px solid var(--border,#e2e8f0);border-radius:12px;font-size:.95rem;text-align:center;letter-spacing:1px;font-weight:800;font-family:inherit;box-sizing:border-box;outline:none" oninput="this.value=this.value.toUpperCase()">' +
    '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<button id="payCodeGo" style="flex:1;padding:11px;border:none;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit;box-shadow:0 3px 12px rgba(16,185,129,.25)">تأكيد الدفع</button>' +
      '<button id="payCodeNo" style="padding:11px 18px;border:1.5px solid var(--border,#e2e8f0);border-radius:12px;background:var(--card,#fff);color:var(--text-muted,#64748b);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit">إلغاء</button>' +
    '</div></div>';
  ov.onclick = function(e) { if (e.target === ov) { document.body.removeChild(ov); } };
  document.body.appendChild(ov);
  document.getElementById('payCodeNo').onclick = function() { document.body.removeChild(ov); };
  document.getElementById('payCodeGo').onclick = function() {
    var code = (document.getElementById('payCodeInp').value || '').trim().toUpperCase();
    if (!code) { document.getElementById('payCodeInp').style.borderColor = '#ef4444'; document.getElementById('payCodeInp').focus(); return; }
    var res = verifyFeePayCode(code, amt);
    if (!res.ok) {
      showAlertModal(res.msg);
      return;
    }
    localStorage.removeItem('mycart_fee_threshold_date');
    localStorage.removeItem('mycart_store_suspended');
    localStorage.setItem('mycart_free_orders_count', '0');
    document.body.removeChild(ov);
    showAlertModal('تم تسديد المستحقات بنجاح!');
    location.reload();
  };
}

function verifyFeePayCode(code, amt) {
  var list = [];
  try { list = JSON.parse(localStorage.getItem('fast7_subscription_codes') || '[]'); } catch(e) {}
  var entry = list.find(function(c){ return c.type === 'fee' && c.used !== true && String(c.code).toUpperCase() === code; });
  if (!entry) return { ok:false, msg:'كود الدفع غير صحيح أو منتهي الصلاحية. تأكد من الكود الذي منحته لك الشركة.' };
  var expected = parseFloat(entry.amount);
  if (!isNaN(expected) && Math.abs(expected - amt) > 0.5) return { ok:false, msg:'قيمة هذا الكود ('+expected+' ₪) لا تطابق مستحقاتك الحالية ('+amt+' ₪). تواصل مع الشركة.' };
  entry.used = true;
  entry.usedAt = new Date().toISOString();
  list[list.indexOf(entry)] = entry;
  try { localStorage.setItem('fast7_subscription_codes', JSON.stringify(list)); } catch(e) {}
  var log = [];
  try { log = JSON.parse(localStorage.getItem('mycart_subscription_log') || '[]'); } catch(e) {}
  log.push({ action: 'payment', plan:'free', amount:amt, code:code, date:new Date().toLocaleString('ar-SA') });
  try { localStorage.setItem('mycart_subscription_log', JSON.stringify(log)); } catch(e) {}
  return { ok:true, msg:'تم تسجيل الدفعة' };
}

function renderFeeAlert() {
  var info = getFeeInfo(), container = document.getElementById('feeAlertContainer');
  if (!container) return;
  if (info.plan !== 'free' || info.accrued <= 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  var pct = Math.min(100, (info.accrued / info.limit) * 100);
  var color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
  var suspDate = localStorage.getItem('mycart_fee_threshold_date');
  var daysLeft = '';
  if (suspDate) {
    var diff = Math.ceil((new Date(suspDate) - new Date()) / 86400000);
    daysLeft = diff > 0 ? '<span style="color:#ef4444;font-weight:900">مهلة '+diff+' يوم</span>' : '<span style="color:#dc2626;font-weight:900"><i class="fa-solid fa-triangle-exclamation"></i> منتهي!</span>';
  }
  container.innerHTML = '<div style="background:#fff;border:2px solid '+color+';border-radius:14px;padding:16px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:800;font-size:.85rem">الرسوم: '+info.accrued+'/'+info.limit+' ₪</span><span style="font-size:.75rem;color:var(--text-gray)">'+daysLeft+'</span></div><div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+color+';border-radius:999px;transition:width .5s"></div></div>'+(pct>=100?'<button onclick="paySubscriptionFees()" style="width:100%;margin-top:12px;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#fff;font-weight:900;font-size:.92rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 16px rgba(14,165,233,.35);transition:transform .15s ease,box-shadow .2s ease;position:relative;overflow:hidden"><i class="fa-solid fa-wallet" style="font-size:1.05rem"></i> تسديد '+info.accrued+' ₪ الآن</button>':'')+'</div>';
}

// ====== AGENCY NOTIFICATIONS (storefront) ======
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
  if (ids.indexOf(id) === -1) { ids.push(id); localStorage.setItem('mycart_read_notifications', JSON.stringify(ids)); }
}

function showNotifPanel() {
  var badge = document.getElementById('notifBadge');
  if (badge) badge.style.display = 'none';
  var notifs = getAgencyNotifs();
  notifs.forEach(function(n){ markNotifRead(n.id); });
  var html = '<div id="notifModalOverlay" onclick="closeNotifModal()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center"><div onclick="event.stopPropagation()" style="background:#fff;border-radius:18px;padding:28px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h3 style="font-size:1.1rem;font-weight:900;margin:0"><i class="fa-solid fa-bullhorn"></i> الإشعارات</h3><button onclick="closeNotifModal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-gray)"><i class="fa-solid fa-xmark"></i></button></div>';
  if (!notifs.length) html += '<p style="font-size:.85rem;color:var(--text-gray);padding:20px 0;text-align:center">لا توجد إشعارات</p>';
  else html += notifs.map(function(n){ return '<div style="padding:12px 14px;background:#f8fafc;border-radius:12px;margin-bottom:8px;border:1px solid var(--fast7-border)"><div style="font-weight:900;font-size:.85rem">'+n.title+'</div><div style="font-size:.8rem;color:var(--text-gray);margin:4px 0">'+n.message+'</div><div style="font-size:.7rem;color:var(--text-gray)">'+n.date+'</div></div>';}).join('');
  html += '</div></div>';
  var el = document.createElement('div'); el.id = 'notifModalContainer'; el.innerHTML = html;
  document.body.appendChild(el);
}

function closeNotifModal() {
  var el = document.getElementById('notifModalContainer'); if (el) el.remove();
  var overlay = document.getElementById('notifModalOverlay'); if (overlay) overlay.remove();
}

function closeAdminNotifModal() {
  var el = document.getElementById('adminNotifModalContainer'); if (el) el.remove();
  var overlay = document.getElementById('adminNotifModalOverlay'); if (overlay) overlay.remove();
}

function updateNotifBadge() {
  var badge = document.getElementById('notifBadge');
  if (!badge) return;
  var unread = getAgencyNotifs().filter(function(n){ return getReadNotifIds().indexOf(n.id) === -1; }).length;
  if (unread > 0) { badge.textContent = unread; badge.style.display = 'flex'; }
  else { badge.style.display = 'none'; }
}

function updateAdminNotifBadge() {
  var badge = document.getElementById('adminNotifBadge');
  if (!badge) return;
  var unread = getAgencyNotifs().filter(function(n){ return getReadNotifIds().indexOf(n.id) === -1; }).length;
  if (unread > 0) { badge.textContent = unread; badge.style.display = 'flex'; }
  else { badge.style.display = 'none'; }
}

function checkSuspension() {
  // التحويل بين index وmaintenance يتم حصرياً في panel-link.js (مصدر الحقيقة:
  // لوحة التحكم). هنا فقط نمسح أي علامة قديمة عالقة حتى لا تسبب حلقة ريفرش
  // بين index وmaintenance، بينما panel-link يقرر التحويل من الخادم مباشرة.
  try { localStorage.removeItem('mycart_store_suspended'); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', function(){ renderFeeAlert(); updateNotifBadge(); updateAdminNotifBadge(); checkSuspension(); applyHeaderDecoration(); refreshLoginNavItem(); });

function applyHeaderDecoration() {
  var s = {};
  try { s = JSON.parse(localStorage.getItem('mycart_header_deco')) || {}; } catch(e) {}
  var header = document.getElementById('header');
  if (!header) return;
  var styles = ['dots','lines','grid','waves','glass','border-anim','shadow-anim','shimmer','circles','diagonal','diamonds','confetti','pulse-ring','neon','gradient-shift','stars'];
  styles.forEach(function(k) { header.classList.remove('header-deco-' + k); });
  if (s.style && s.style !== 'none') {
    header.classList.add('header-deco-' + s.style);
  }
}

init();

applyStoredTheme();

// ===== Supabase cloud data refresh =====
function refreshFromCloud() {
  if (window.__supabaseRefreshed) return;
  window.__supabaseRefreshed = true;
  try {
    products = loadProducts();
    adminSettings = loadAdminSettings();
    CURRENCY = adminSettings.currency || '₪';
    if (typeof loadAppearance === 'function') loadAppearance();
    if (typeof applyStoreCardVisibility === 'function') applyStoreCardVisibility();
    if (typeof applyLanguage === 'function') applyLanguage();
    if (typeof applySectionOverrides === 'function') applySectionOverrides();
    if (typeof initFlashSales === 'function') initFlashSales();
    if (typeof reorderHomeSections === 'function') reorderHomeSections();
    if (typeof applyMarketing === 'function') applyMarketing();
    if (typeof applyHeaderDecoration === 'function') applyHeaderDecoration();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderProducts === 'function') renderProducts(typeof getFilteredProducts === 'function' ? getFilteredProducts() : products);
    applyAccentColor(adminSettings.accentColor || '#ef4444');
    const nEl = document.getElementById('storeName');
    if (nEl) nEl.textContent = adminSettings.storeName || 'متجري';
    const tEl = document.getElementById('storeTagline');
    if (tEl) tEl.textContent = adminSettings.tagline || '';
    document.title = adminSettings.storeName || 'متجري';
  } catch (e) {
    console.warn('Cloud refresh error:', e);
  }
}
window.addEventListener('supabase:data-loaded', refreshFromCloud);
if (window.__supabasePreloaded) refreshFromCloud();

initSmartSearch();

initSpinWin();

function initFlashSales() {
  const section = document.getElementById('flashSaleSection');
  const scroll = document.getElementById('flashSaleScroll');
  const timer = document.getElementById('flashSaleTimer');
  if (!section || !scroll) return;
  if (typeof applySectionOverrides === 'function') applySectionOverrides();
  // Hide when filtering by category or brand
  if (currentCat !== 'الكل' || currentBrand) { section.style.display = 'none'; return; }
  // Check page builder and admin settings
  const hidden = adminSettings?.showFlashSales === false || !isSectionEnabled('flashSale');
  document.body.classList.toggle('show-flash-sales', !hidden);
  if (hidden) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const flashProducts = (products || []).filter(p => p && p.oldPrice && p.oldPrice > p.price).slice(0, 10);
  if (!flashProducts.length) { section.style.display = 'none'; return; }
  renderFlashProducts(flashProducts, scroll);
  addSectionArrows('flashSaleScroll');
  startFlashAutoScroll();
  startFlashTimer(timer);
}

function renderFlashProducts(items, container) {
  var html = (items || []).map(function(p) {
    const discount = Math.round((1 - p.price / p.oldPrice) * 100);
    const images = getProductImages(p);
    const imgSrc = images[0] || 'https://placehold.co/400x400/f1f5f9/64748b?text=No+Image';
    const stock = p.stock || 0;
    const stockPct = Math.min(100, Math.max(15, (stock / 50) * 100));
    const _isOut = p.stock === 0;
    return '<div class="flash-card' + (_isOut ? ' out-of-stock' : '') + '" data-id="' + p.id + '" onclick="openDetail(' + p.id + ')">' +
      '<div class="flash-card-img" style="position:relative">' +
        '<img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy">' +
        '<span class="flash-badge">-' + discount + '%</span>' +
        '<div class="flash-stock-bar"><div class="flash-stock-fill" style="width:' + stockPct + '%"></div></div>' +
        (_isOut ? '<div class="out-of-stock-overlay"><span>نفذ<br><small>انتهت الكمية</small></span></div>' : '') +
      '</div>' +
      _cardMiniNavHtml(p) +
      '<div class="flash-card-body">' +
        '<div class="flash-card-name">' + (p.name || '') + '</div>' +
        '<div class="flash-card-prices">' +
          '<span class="flash-current">' + CURRENCY + wPrice(p) + '</span>' + wBadge() +
          '<span class="flash-old">' + CURRENCY + (p.oldPrice || 0).toFixed(2) + '</span>' +
        '</div>' +
        '<div class="flash-card-timer"><i class="fa-regular fa-clock"></i><span class="card-timer-label">متبقي</span><span class="card-timer-val">--:--:--</span></div>' +
        '<button class="flash-add-btn" onclick="' + (_isOut ? '' : 'event.stopPropagation();quickAdd(' + p.id + ',this);') + '" style="' + (_isOut ? 'opacity:.3;pointer-events:none' : '') + '"><i class="fa-solid ' + (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'fa-plus' : 'fa-cart-shopping') + '"></i> ' + (_isOut ? 'نفذ' : (((p.options && p.options.length) || (p.variants && p.variants.length)) ? 'خيارات' : __('quickAdd'))) + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
  html += '<div class="fs-viewall-card" onclick="viewAllSection(\'flashSale\')">' +
    '<div class="fs-viewall-icon"><i class="fa-solid fa-arrow-left"></i></div>' +
    '<div class="fs-viewall-title">شاهد الكل</div>' +
    '<div class="fs-viewall-sub">عروض فلاش اليوم</div>' +
  '</div>';
  container.innerHTML = html;
  // Remove old flash arrows if any (switched to native scroll)
  var sectionEl = container.closest('#flashSaleSection');
  if (sectionEl) {
    sectionEl.querySelectorAll('.flash-arrow, .flash-arrow-prev, .flash-arrow-next').forEach(function(el) { el.remove(); });
  }
}

function startFlashTimer(el) {
  if (_flashTimer) { clearInterval(_flashTimer); }
  _flashTimer = setInterval(function() { updateFlashTimer(el); }, 1000);
  updateFlashTimer(el);
}

function updateFlashTimer(el) {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const diff = end - new Date();
  if (diff <= 0) { el.textContent = '00:00:00'; return; }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const str = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  el.textContent = str;
  el.style.background = diff < 3600000 ? '#dc2626' : 'var(--accent)';
  // Update per-card timers
  document.querySelectorAll('#flashSaleScroll .card-timer-val').forEach(function(sp) { sp.textContent = str; });
}

// ===== Lazy-load quick-admin.js (admin panel) =====
var _quickAdminLoading = false;
function openAdmin() {
  if (_quickAdminLoading) return;
  _quickAdminLoading = true;
  var s = document.createElement('script');
  s.src = 'js/quick-admin.js';
  s.onload = function() {
    _quickAdminLoading = false;
    wrapAdminFns();
    startAdminNotifCheck();
    openAdmin(); // now calls the real openAdmin from quick-admin.js
  };
  s.onerror = function() { _quickAdminLoading = false; };
  document.head.appendChild(s);
}

initFlashSales();
// Dynamically shrink sticky header on scroll down, and keep it small inside product detail page
function updateHeaderShrink() {
  const header = document.getElementById('header');
  if (!header) return;
  const detail = document.getElementById('detailPage');
  const inDetail = detail && detail.classList.contains('active');
  if (inDetail || window.scrollY > 30) {
    header.classList.add('scrolled');
  } else if (window.scrollY < 10) {
    header.classList.remove('scrolled');
  }
  applyScrolledHeaderMode(header);
}
function applyScrolledHeaderMode(header) {
  if (!header) return;
  const mode = (typeof adminSettings !== 'undefined' && adminSettings && adminSettings.scrolledHeader) || 'both';
  header.setAttribute('data-scroll-mode', mode);
}
window.addEventListener('scroll', function() {
  if (document.body.classList.contains('sticky-header')) {
    updateHeaderShrink();
  }
});

// scroll hint animation for filter sections
function triggerScrollHint() {
  var els = document.querySelectorAll('.cat-filters, #brandFilters');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el && el.scrollWidth > el.clientWidth) {
      el.classList.add('hint');
      el.addEventListener('animationend', function(e) {
        e.currentTarget.classList.remove('hint');
      }, { once: true });
    }
  }
}


function switchCategoryTab(tab) {
  const catBtn = document.getElementById('tabCategoriesBtn');
  const brandBtn = document.getElementById('tabBrandsBtn');
  const catGrid = document.getElementById('categoriesPageGrid');
  const brandGrid = document.getElementById('brandsPageGrid');
  
  if (tab === 'categories') {
    if (catBtn) catBtn.classList.add('active');
    if (brandBtn) brandBtn.classList.remove('active');
    if (catGrid) catGrid.style.display = 'grid';
    if (brandGrid) brandGrid.style.display = 'none';
  } else {
    if (catBtn) catBtn.classList.remove('active');
    if (brandBtn) brandBtn.classList.add('active');
    if (catGrid) catGrid.style.display = 'none';
    if (brandGrid) brandGrid.style.display = 'grid';
  }
}

function renderCategoriesPage() {
  const stored = localStorage.getItem('mycart_categories');
  let catMap = {}, brandCats = [], customCatNames = [];
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      parsed.forEach(c => {
        if (c.isBrand) {
          brandCats.push(c.name);
          catMap[c.name] = c.image;
        } else {
          catMap[c.name] = c.image;
          customCatNames.push(c.name);
        }
      });
    } catch(e) {}
  }
  
  // Render Categories
  const allProductCats = products.flatMap(p => getProductCats(p));
  const combinedCats = [...new Set([...customCatNames, ...allProductCats])].filter(c => c && !brandCats.includes(c));
  const catGrid = document.getElementById('categoriesPageGrid');
  if (catGrid) {
    catGrid.innerHTML = combinedCats.map(c => {
      const count = products.filter(p => getProductCats(p).includes(c)).length;
      const imgUrl = catMap[c] || 'https://placehold.co/150x150/e2e8f0/64748b?text=' + encodeURIComponent(c);
      return `<div class="category-card" onclick="location.hash='#category/${encodeURIComponent(c)}'">
        <img src="${imgUrl}">
        <div class="category-name">${c}</div>
        <div class="category-count">${count} ${__('productsCount') || 'منتج'}</div>
      </div>`;
    }).join('');
  }

  // Render Brands
  const allProductBrands = products.filter(p => p.brand).map(p => p.brand);
  const brands = [...new Set([...brandCats, ...allProductBrands])].filter(Boolean);
  const brandGrid = document.getElementById('brandsPageGrid');
  if (brandGrid) {
    brandGrid.innerHTML = brands.map(b => {
      const count = products.filter(p => p.brand === b).length;
      const imgUrl = catMap[b] || 'https://placehold.co/150x150/e2e8f0/64748b?text=' + encodeURIComponent(b);
      return `<div class="brand-card" onclick="location.hash='#brand/${encodeURIComponent(b)}'">
        <img src="${imgUrl}">
        <div class="brand-name">${b}</div>
        <div class="brand-count">${count} ${__('productsCount') || 'منتج'}</div>
      </div>`;
    }).join('');
  }
}

// ── Auto Slideshow for Detail Page ─────────────────────────────
let _detailSlideTimer = null;
const DETAIL_SLIDE_INTERVAL = 3500; // ms

function startDetailSlideshow() {
  stopDetailSlideshow();
  const imgs = window._detailImgs;
  if (!imgs || imgs.length <= 1) return;
  _detailSlideTimer = setInterval(() => {
    currentDetailImg = (currentDetailImg + 1) % imgs.length;
    const imgEl = document.getElementById('detailImage');
    if (imgEl) {
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = imgs[currentDetailImg];
        imgEl.style.opacity = '1';
      }, 180);
    }
    // Sync thumbnails
    document.querySelectorAll('#detailThumbs img').forEach((t, i) => {
      t.classList.toggle('active', i === currentDetailImg);
    });
  }, DETAIL_SLIDE_INTERVAL);
}

function stopDetailSlideshow() {
  if (_detailSlideTimer) {
    clearInterval(_detailSlideTimer);
    _detailSlideTimer = null;
  }
}
