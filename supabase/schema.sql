create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'Circle',
  color text not null default 'coral',
  type text not null check (type in ('income','expense')),
  grp text not null default 'need' check (grp in ('need','want','saving','reward')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  category_id uuid references categories(id) on delete set null,
  note text,
  txn_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on transactions(user_id, txn_date desc);
create unique index if not exists categories_user_type_name_idx on categories(user_id, type, name);

alter table categories alter column icon set default 'Circle';

alter table categories enable row level security;
alter table transactions enable row level security;

drop policy if exists "own categories" on categories;
create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on transactions;
create policy "own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.seed_default_categories_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, type, grp, sort_order)
  values
    (new.id, 'อาหาร', 'Utensils', 'amber', 'expense', 'need', 0),
    (new.id, 'เดินทาง', 'Bus', 'sky', 'expense', 'need', 1),
    (new.id, 'ช้อปปิ้ง', 'ShoppingBag', 'pink', 'expense', 'want', 2),
    (new.id, 'บิล/ค่าน้ำค่าไฟ', 'ReceiptText', 'mint', 'expense', 'need', 3),
    (new.id, 'ความบันเทิง', 'Gamepad2', 'pink', 'expense', 'want', 4),
    (new.id, 'สุขภาพ', 'HeartPulse', 'mint', 'expense', 'need', 5),
    (new.id, 'เงินออม/ลงทุน', 'PiggyBank', 'sky', 'expense', 'saving', 6),
    (new.id, 'ของขวัญ/รางวัลตัวเอง', 'Gift', 'amber', 'expense', 'reward', 7),
    (new.id, 'อื่นๆ', 'Circle', 'coral', 'expense', 'need', 8),
    (new.id, 'เงินเดือน', 'WalletCards', 'mint', 'income', 'need', 9),
    (new.id, 'งานเสริม', 'BriefcaseBusiness', 'sky', 'income', 'need', 10),
    (new.id, 'โบนัส', 'Sparkles', 'amber', 'income', 'reward', 11),
    (new.id, 'อื่นๆ', 'CircleDollarSign', 'coral', 'income', 'need', 12)
  on conflict (user_id, type, name) do nothing;

  return new;
end;
$$;

drop trigger if exists seed_default_categories_on_signup on auth.users;
create trigger seed_default_categories_on_signup
  after insert on auth.users
  for each row execute function public.seed_default_categories_for_user();
