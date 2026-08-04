# متجري — ربط Supabase + رفع على GitHub

متجر ثابت (HTML/JS) يتم ربطه بقاعدة بيانات **Supabase** سحابية، ونشره مجاناً على **GitHub Pages**.

**المزايا بعد الربط:**
- المنتجات والطلبات والإعدادات تُحفظ في Supabase بدل `localStorage`
- أي جهاز/متصفح يشوف نفس البيانات (مدير المتجر يضيف منتج من لوحة التحكم ويظهر فوراً للزوار)
- التحديثات تنتشر مباشرة بعد الرفع على GitHub

---

## الجزء 1 — إنشاء حساب ومشروع Supabase

1. افتح [supabase.com](https://supabase.com) وسجّل الدخول (Gmail أو GitHub أو بريد إلكتروني).
2. اضغط **New Project**:
   - **Name**: اسم مشروعك (مثلاً `my-store`)
   - **Database Password**: كلمة سر قوية واحفظها بمكان آمن
   - **Region**: اختر أقرب منطقة (مثلاً `Central Europe (Frankfurt)` أو `Southeast Asia (Singapore)`)
3. انتظر حتى ينتهي تجهيز المشروع (دقيقتان تقريباً).

## الجزء 2 — إنشاء الجداول

1. من القائمة الجانبية افتح **SQL Editor**.
2. افتح ملف `supabase/schema.sql` من هذا المشروع، وانسخ محتواه كاملاً.
3. **قبل اللصق**: استبدل كلمة `YOUR_SECRET_WRITE_TOKEN` بكلمة سرية تختارها (مثل: `a1b2c3d4...`).
4. الصق الكود واضغط **Run**.
5. تأكد من ظهور "Success".

## الجزء 3 — وضع مفاتيح الاتصال في الكود

1. من القائمة الجانبية افتح **Settings → API**.
2. انسخ:
   - **Project URL** (مثل `https://abc123.supabase.co`)
   - **anon public** key
3. افتح الملف `default/js/supabase-config.js` وعدّله:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abc123.supabase.co",   // Project URL
     anonKey: "eyJhbGciOi...",             // anon public key
     writeToken: "a1b2c3d4",               // نفس token الذي وضعته في schema.sql
     storeId: "default"
   };
   ```
4. احفظ الملف.

> **تنبيه أمني:** `anonKey` و `writeToken` مدمجان في الملف لأن الموقع ثابت بدون خادم. لا تشارك المشروع بشكل خاص مع أي شخص لا تثق به، ولو حسّيت إن الـ token تسرّب غيّره في الجدول `store_secrets` وفي الملف معاً.

## الجزء 4 — اختبار محلي

افتح `default/index.html` في المتصفح (يمكن فتحه مباشرة، أو شغّل خادم محلي):

```bash
npx serve default
```

عند فتح المتجر للمرة الأولى ستُزرع البيانات من الملفات الثابتة في Supabase. جرّب إضافة منتج من `admin.html` ثم أعد فتح المتجر أو افتحه بجهاز آخر — ستجد المنتج موجوداً.

## الجزء 5 — الرفع على GitHub (أنت تنفذه بنفسك)

### أ) إنشاء المستودع
1. افتح [github.com](https://github.com) وسجّل الدخول.
2. اضغط **+** أعلى يمين → **New repository**.
3. اكتب اسماً (مثل `my-store`). **اترك كل الخيارات فارغة** (لا تختار README أو .gitignore أو License — حتى لا يحصل تعارض).
4. اضغط **Create repository**.

### ب) رفع الملفات من جهازك
افتح **Terminal** (PowerShell) في مجلد المشروع `C:\Users\saifp\Desktop\fast7` ونفّذ:

```powershell
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/my-store.git
git push -u origin main
```

> استبدل `USERNAME` و `my-store` باسم مستخدمك واسم المستودع.
> أول مرة ستطلب منك شاشة تسجيل دخول GitHub — سجّل من المتصفح.

### ج) تفعيل GitHub Pages
1. في صفحة المستودع على GitHub افتح **Settings**.
2. من القائمة الجانبية اختر **Pages**.
3. في **Source** اختر **GitHub Actions**.
4. اذهب لتبويب **Actions** — سترى عملية النشر تعمل. انتظر حتى تظهر ✅ خضراء.
5. بعد اكتمالها، سيظهر رابط موقعك في Settings → Pages (مثل `https://USERNAME.github.io/my-store/`).

> التحديثات القادمة: أي `git push` جديد يعيد النشر تلقائياً.

---

## كيف يعمل الربط؟

| الملف | الوظيفة |
|---|---|
| `js/supabase-config.js` | مفاتيح الاتصال (عدّلها أنت) |
| `js/sync.js` | يقرأ كل بيانات المتجر من Supabase عند فتح الصفحة، ويحفظ أي تعديل تلقائياً (مع debounce) |
| `supabase/schema.sql` | الجداول وقواعد الأمان — تُشغَّل مرة واحدة فقط |
| `.github/workflows/deploy.yml` | ينشر محتوى مجلد `default/` على GitHub Pages تلقائياً |

**بدون إعداد Supabase** (المفاتيح فارغة) يعمل المتجر كالسابق بملفات `data/` الثابتة — فلا يتعطل شيء لو نسيت التهيئة.
