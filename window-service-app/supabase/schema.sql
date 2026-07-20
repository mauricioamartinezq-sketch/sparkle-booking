-- Run this in the Supabase SQL editor (or via `supabase db push`)

create extension if not exists "uuid-ossp";

-- Customers -----------------------------------------------------
create table customers (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id),
  name text not null,
  email text not null unique,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Properties ------------------------------------------------------
create table properties (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  address text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Bookings ----------------------------------------------------------
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  services jsonb not null,             -- [{ serviceId, quantity }, ...]
  scheduled_date date not null,
  estimated_total numeric(10,2) not null,
  final_total numeric(10,2),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  deposit_paid boolean not null default false,
  balance_paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- Payments ------------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount numeric(10,2) not null,
  type text not null check (type in ('deposit', 'final')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index bookings_customer_idx on bookings(customer_id);
create index bookings_status_idx on bookings(status);
create index payments_booking_idx on payments(booking_id);

-- Row Level Security ------------------------------------------------
alter table customers enable row level security;
alter table properties enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;

-- Anyone (including anonymous booking-form visitors) can create their
-- own customer/property/booking rows. Reads are restricted to the
-- owning authenticated user. Payments are never readable/writable
-- from the client — only the service role (used in API routes) touches them.

create policy "customers can insert themselves"
  on customers for insert
  with check (true);

create policy "customers can read their own row"
  on customers for select
  using (auth.uid() = auth_user_id);

create policy "anyone can create a property"
  on properties for insert
  with check (true);

create policy "customers can read their own properties"
  on properties for select
  using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

create policy "anyone can create a booking"
  on bookings for insert
  with check (true);

create policy "customers can read their own bookings"
  on bookings for select
  using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );

-- No client-facing policies on `payments` — service role only.
