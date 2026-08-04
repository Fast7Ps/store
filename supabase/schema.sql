-- ============================================================
--  FAST7 Store — Supabase Schema
--  شغّل هذا الكود كاملاً في: SQL Editor داخل مشروعك في Supabase
-- ============================================================

-- جدول كلمة السر التي تُصرَّح بها عمليات الكتابة
-- (سيرسلها الموقع عند حفظ أي بيانات، الزائر العادي لا يملكها)
create table if not exists store_secrets (
  store_id text primary key,
  write_token text not null
);

-- جدول بيانات المتجر (منتجات، طلبات، إعدادات... كلها JSON)
create table if not exists store_data (
  store_id text not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (store_id, key)
);

-- ============================================================
--  ⚠️ مهم: غيّر هذا الـ token بكلمة سرية من اختيارك
--  ثم ضع نفس القيمة في js/supabase-config.js → writeToken
-- ============================================================
insert into store_secrets (store_id, write_token)
values ('default', '77faa02cf18d624a78cf58fa1bc9f845a098b084c771f5e7')
on conflict (store_id) do update set write_token = excluded.write_token;

-- تفعيل حماية مستوى الصف
alter table store_data enable row level security;
alter table store_secrets enable row level security;

-- أي زائر يستطيع قراءة بيانات المتجر (المتجر عام)
create policy "public read store_data" on store_data for select using (true);

-- الكتابة تتم فقط عبر الدالة save_store_data (تتحقق من الـ token)
create or replace function save_store_data(p_store text, p_key text, p_value jsonb, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  select write_token into v_token from store_secrets where store_id = p_store;
  if v_token is null or v_token <> p_token then
    raise exception 'unauthorized write attempt';
  end if;
  insert into store_data (store_id, key, value, updated_at)
  values (p_store, p_key, p_value, now())
  on conflict (store_id, key) do update
    set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

-- السماح بالقراءة فقط عبر الجدول، والكتابة حصراً عبر الدالة
revoke insert, update, delete on store_data from anon, authenticated;
grant select on store_data to anon, authenticated;
grant execute on function save_store_data to anon, authenticated;
