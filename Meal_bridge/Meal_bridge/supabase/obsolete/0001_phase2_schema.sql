-- ============================================================================
-- OBSOLETE - NOT TO BE EXECUTED.
-- Superseded by supabase/migrations/0001_mealbridge_canonical.sql.
-- This file defines a conflicting database design (different table names,
-- columns and relationships). Running it alongside the canonical migration
-- will fail or corrupt the schema. Kept for reference only.
-- ============================================================================


-- MealBridge Phase 2: database schema, part 1 of 2 (tables, constraints, indexes, triggers)
-- DRAFT - NOT APPLIED. Apply to Supabase only after approval.
-- Columns are snake_case. App field mappings are noted in comments.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- profiles: one row per auth user. Created by trigger on signup, never by the client.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('donor', 'receiver', 'volunteer', 'sponsor', 'admin')),
  email text not null,
  phone text,
  location text,
  restaurant_name text,        -- donor: restaurantName
  owner_name text,             -- donor: ownerName
  donor_type text,             -- profile-only field (donorType)
  organization_name text,      -- receiver: organizationName
  contact_person text,         -- receiver: contactPerson
  organization_type text check (organization_type is null or organization_type in ('NGO', 'Community kitchen', 'Shelter', 'Food bank', 'Other')),
  capacity_meals_per_day integer check (capacity_meals_per_day is null or capacity_meals_per_day >= 0),  -- profile-only (capacityMealsPerDay)
  full_name text,              -- volunteer: fullName
  availability text check (availability is null or availability in ('Weekdays', 'Weekends', 'Evenings', 'Flexible')),
  vehicle text,                -- profile-only field
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_donor_fields check (role <> 'donor' or restaurant_name is not null),
  constraint profiles_receiver_fields check (role <> 'receiver' or (organization_name is not null and organization_type is not null)),
  constraint profiles_volunteer_fields check (role <> 'volunteer' or full_name is not null)
);

-- donations: a food listing created by a donor. Status vocabulary matches the app.
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete restrict,
  donor_display_name text not null,   -- copied from restaurant_name at creation so open listings can show the donor
  title text not null check (char_length(btrim(title)) >= 2),   -- app: title / foodName
  category text,
  quantity integer not null check (quantity >= 1),
  unit text not null check (unit in ('Meals', 'Kg', 'Packets', 'Portions', 'Loaves')),
  storage_notes text,
  pickup_address text not null,       -- app: pickupLocation / location
  city text,
  image_url text,
  prepared_at timestamptz not null default now(),   -- app: preparedAt
  pickup_deadline timestamptz not null,             -- app: pickupDeadline / pickupBy
  status text not null default 'Active' check (status in ('Active', 'Claimed', 'Collected', 'Delivered', 'Expired', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donations_deadline_after_prepared check (pickup_deadline > prepared_at)
);

-- food_claims: a receiver claims a donation. One active claim per donation (partial unique index below).
create table public.food_claims (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete restrict,
  quantity_claimed integer not null check (quantity_claimed >= 1),   -- app: quantityClaimed
  status text not null default 'Claimed' check (status in ('Claimed', 'Cancelled')),
  claimed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_claims_cancel_consistent check ((status = 'Cancelled') = (cancelled_at is not null))
);

create unique index food_claims_one_active_per_donation
  on public.food_claims (donation_id)
  where status = 'Claimed';

-- pickups: the volunteer task for a claim. Status vocabulary matches the app's task steps.
create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.food_claims (id) on delete cascade,
  volunteer_id uuid references public.profiles (id) on delete restrict,
  status text not null default 'Claimed' check (status in ('Claimed', 'Pickup Assigned', 'Collected', 'Delivered')),
  assigned_at timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pickups_volunteer_matches_status check ((status = 'Claimed') = (volunteer_id is null)),
  constraint pickups_assigned_at_consistent check ((assigned_at is not null) = (status <> 'Claimed')),
  constraint pickups_collected_at_consistent check ((collected_at is not null) = (status in ('Collected', 'Delivered'))),
  constraint pickups_delivered_at_consistent check ((delivered_at is not null) = (status = 'Delivered'))
);

-- notifications: written only by database functions. Dedupe key prevents repeats per recipient.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('donation_posted', 'claim_confirmed', 'food_claimed', 'pickup_accepted', 'food_collected', 'food_delivered')),
  title text not null,
  message text not null,
  donation_id uuid references public.donations (id) on delete set null,
  claim_id uuid references public.food_claims (id) on delete set null,
  pickup_id uuid references public.pickups (id) on delete set null,
  dedupe_key text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_dedupe_unique unique (recipient_id, dedupe_key)
);

-- sponsor_records: proposed. The app has no monetary sponsor data yet, so these columns are a starting point to confirm.
create table public.sponsor_records (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references public.profiles (id) on delete set null,
  sponsor_name text not null,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  currency char(3) not null default 'INR',
  campaign text,
  status text not null default 'Pledged' check (status in ('Pledged', 'Received', 'Cancelled')),
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_records_period_valid check (period_start is null or period_end is null or period_end >= period_start)
);

-- impact_records: one row per delivered claim, written by the pickup-advance function.
create table public.impact_records (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.food_claims (id) on delete cascade,
  donation_id uuid not null references public.donations (id) on delete cascade,
  donor_id uuid not null references public.profiles (id) on delete restrict,
  receiver_id uuid not null references public.profiles (id) on delete restrict,
  category text,
  quantity integer not null check (quantity >= 1),
  unit text not null,
  meals_rescued integer not null default 0 check (meals_rescued >= 0),   -- counts only unit 'Meals', mirroring the app's mealsFromRecord rule
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index donations_status_deadline_idx on public.donations (status, pickup_deadline);
create index donations_donor_idx on public.donations (donor_id);
create index food_claims_receiver_idx on public.food_claims (receiver_id);
create index food_claims_donation_idx on public.food_claims (donation_id);
create index pickups_volunteer_idx on public.pickups (volunteer_id);
create index pickups_status_idx on public.pickups (status);
create index notifications_recipient_idx on public.notifications (recipient_id, is_read);
create index sponsor_records_sponsor_idx on public.sponsor_records (sponsor_id);
create index impact_records_donor_idx on public.impact_records (donor_id);
create index impact_records_receiver_idx on public.impact_records (receiver_id);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger donations_set_updated_at before update on public.donations for each row execute function public.set_updated_at();
create trigger food_claims_set_updated_at before update on public.food_claims for each row execute function public.set_updated_at();
create trigger pickups_set_updated_at before update on public.pickups for each row execute function public.set_updated_at();
create trigger sponsor_records_set_updated_at before update on public.sponsor_records for each row execute function public.set_updated_at();

-- Signup trigger: creates the profile from auth metadata. Only donor, receiver, volunteer can self-register.
-- Sponsor and admin profiles are assigned manually by an administrator.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', '');
begin
  if v_role not in ('donor', 'receiver', 'volunteer') then
    raise exception 'Invalid signup role: %', v_role;
  end if;

  insert into public.profiles (
    id, role, email, phone, location,
    restaurant_name, owner_name,
    organization_name, contact_person, organization_type,
    full_name, availability
  ) values (
    new.id, v_role, coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'restaurantName',
    new.raw_user_meta_data ->> 'ownerName',
    new.raw_user_meta_data ->> 'organizationName',
    new.raw_user_meta_data ->> 'contactPerson',
    new.raw_user_meta_data ->> 'organizationType',
    new.raw_user_meta_data ->> 'fullName',
    new.raw_user_meta_data ->> 'availability'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
