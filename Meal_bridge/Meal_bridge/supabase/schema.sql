-- ============================================================================
-- OBSOLETE - NOT TO BE EXECUTED.
-- Superseded by supabase/migrations/0001_mealbridge_canonical.sql.
-- This file defines a conflicting database design (different table names,
-- columns and relationships). Running it alongside the canonical migration
-- will fail or corrupt the schema. Kept for reference only.
-- ============================================================================


-- MealBridge (Rescue the Surplus) - Supabase / PostgreSQL schema
-- Run once in: Supabase Dashboard > SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('donor', 'receiver', 'volunteer', 'admin')),
  email       text not null unique,
  phone       text not null,
  location    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, role)
);

create table public.donors (
  user_id         uuid primary key,
  role            text not null default 'donor' check (role = 'donor'),
  restaurant_name text not null,
  owner_name      text not null,
  donor_type      text not null default 'Restaurant',
  constraint donors_user_role_fk foreign key (user_id, role)
    references public.users (id, role) on delete cascade
);

create table public.receivers (
  user_id                 uuid primary key,
  role                    text not null default 'receiver' check (role = 'receiver'),
  organization_name       text not null,
  contact_person          text not null,
  organization_type       text not null check (organization_type in
                            ('NGO', 'Community kitchen', 'Shelter', 'Food bank', 'Other')),
  capacity_meals_per_day  integer check (capacity_meals_per_day >= 0),
  constraint receivers_user_role_fk foreign key (user_id, role)
    references public.users (id, role) on delete cascade
);

create table public.volunteers (
  user_id      uuid primary key,
  role         text not null default 'volunteer' check (role = 'volunteer'),
  full_name    text not null,
  availability text not null check (availability in
                 ('Weekdays', 'Weekends', 'Evenings', 'Flexible')),
  vehicle      text check (vehicle in ('On foot', 'Bicycle', 'Scooter', 'Car')),
  constraint volunteers_user_role_fk foreign key (user_id, role)
    references public.users (id, role) on delete cascade
);

create table public.food_listings (
  id                 uuid primary key default gen_random_uuid(),
  donor_id           uuid not null references public.donors (user_id) on delete cascade,
  food_name          text not null,
  category           text not null check (category in
                       ('Cooked Meals', 'Rice', 'Bread', 'Vegetables', 'Fruits', 'Packaged Food', 'Other')),
  quantity           numeric(10, 2) not null check (quantity > 0),
  unit               text not null check (unit in ('Meals', 'Kg', 'Packets')),
  claimed_quantity   numeric(10, 2) not null default 0 check (claimed_quantity >= 0),
  prepared_at        timestamptz,
  pickup_deadline    timestamptz not null,
  posted_at          timestamptz not null default now(),
  storage_condition  text check (storage_condition in
                       ('Hot (above 60°C)', 'Chilled (0-5°C)', 'Room temperature', 'Frozen')),
  allergens          text,
  packaging          text,
  pickup_location    text not null,
  image_url          text,
  status             text not null default 'Active' check (status in
                       ('Active', 'Claimed', 'Collected', 'Delivered', 'Expired', 'Cancelled')),
  created_at         timestamptz not null default now(),
  constraint food_listings_claimed_within_quantity check (claimed_quantity <= quantity),
  constraint food_listings_deadline_after_prepared check
    (prepared_at is null or pickup_deadline > prepared_at)
);

create table public.food_claims (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.food_listings (id) on delete cascade,
  receiver_id       uuid not null references public.receivers (user_id) on delete cascade,
  quantity_claimed  numeric(10, 2) not null check (quantity_claimed > 0),
  status            text not null default 'Claimed' check (status in
                      ('Claimed', 'Collected', 'Delivered', 'Cancelled')),
  claimed_at        timestamptz not null default now(),
  collected_at      timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now()
);

create table public.pickup_tasks (
  id            uuid primary key default gen_random_uuid(),
  claim_id      uuid not null unique references public.food_claims (id) on delete cascade,
  volunteer_id  uuid references public.volunteers (user_id) on delete set null,
  status        text not null default 'Claimed' check (status in
                  ('Claimed', 'Pickup Assigned', 'Collected', 'Delivered')),
  assigned_at   timestamptz,
  collected_at  timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now(),
  constraint pickup_tasks_assigned_has_volunteer check
    (status = 'Claimed' or volunteer_id is not null)
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  title        text not null,
  message      text not null,
  is_read      boolean not null default false,
  listing_id   uuid references public.food_listings (id) on delete set null,
  claim_id     uuid references public.food_claims (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.impact_records (
  id                         uuid primary key default gen_random_uuid(),
  claim_id                   uuid not null unique references public.food_claims (id) on delete cascade,
  donor_id                   uuid not null references public.donors (user_id) on delete cascade,
  receiver_id                uuid not null references public.receivers (user_id) on delete cascade,
  category                   text not null,
  quantity                   numeric(10, 2) not null check (quantity > 0),
  unit                       text not null check (unit in ('Meals', 'Kg', 'Packets')),
  estimated_waste_avoided_kg numeric(10, 2) not null default 0 check (estimated_waste_avoided_kg >= 0),
  completed_at               timestamptz not null,
  created_at                 timestamptz not null default now()
);

create index food_listings_donor_idx     on public.food_listings (donor_id);
create index food_listings_status_idx    on public.food_listings (status, pickup_deadline);
create index food_claims_listing_idx    on public.food_claims (listing_id);
create index food_claims_receiver_idx   on public.food_claims (receiver_id);
create index pickup_tasks_volunteer_idx  on public.pickup_tasks (volunteer_id);
create index notifications_user_read_idx on public.notifications (user_id, is_read);
create index impact_records_donor_idx    on public.impact_records (donor_id);
create index impact_records_receiver_idx on public.impact_records (receiver_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.users (id, role, email, phone, location)
  values (
    new.id,
    r,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'location', '')
  );

  if r = 'donor' then
    insert into public.donors (user_id, restaurant_name, owner_name, donor_type)
    values (
      new.id,
      new.raw_user_meta_data ->> 'restaurantName',
      new.raw_user_meta_data ->> 'ownerName',
      coalesce(new.raw_user_meta_data ->> 'donorType', 'Restaurant')
    );
  elsif r = 'receiver' then
    insert into public.receivers (user_id, organization_name, contact_person, organization_type, capacity_meals_per_day)
    values (
      new.id,
      new.raw_user_meta_data ->> 'organizationName',
      new.raw_user_meta_data ->> 'contactPerson',
      new.raw_user_meta_data ->> 'organizationType',
      nullif(new.raw_user_meta_data ->> 'capacityMealsPerDay', '')::integer
    );
  elsif r = 'volunteer' then
    insert into public.volunteers (user_id, full_name, availability, vehicle)
    values (
      new.id,
      new.raw_user_meta_data ->> 'fullName',
      new.raw_user_meta_data ->> 'availability',
      new.raw_user_meta_data ->> 'vehicle'
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users          enable row level security;
alter table public.donors         enable row level security;
alter table public.receivers      enable row level security;
alter table public.volunteers     enable row level security;
alter table public.food_listings  enable row level security;
alter table public.food_claims    enable row level security;
alter table public.pickup_tasks   enable row level security;
alter table public.notifications  enable row level security;
alter table public.impact_records enable row level security;

revoke update on public.users from authenticated;
grant update (phone, location, updated_at) on public.users to authenticated;
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

create policy users_select_own on public.users
  for select to authenticated using (id = auth.uid());
create policy users_update_own on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy donors_select_auth on public.donors
  for select to authenticated using (true);
create policy donors_update_own on public.donors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy receivers_select_auth on public.receivers
  for select to authenticated using (true);
create policy receivers_update_own on public.receivers
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy volunteers_select_own on public.volunteers
  for select to authenticated using (user_id = auth.uid());
create policy volunteers_update_own on public.volunteers
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy listings_select on public.food_listings
  for select to authenticated using (
    status = 'Active'
    or donor_id = auth.uid()
    or exists (select 1 from public.food_claims c
               where c.listing_id = food_listings.id and c.receiver_id = auth.uid())
    or exists (select 1 from public.food_claims c
               join public.pickup_tasks t on t.claim_id = c.id
               where c.listing_id = food_listings.id and t.volunteer_id = auth.uid())
  );
create policy listings_insert_own on public.food_listings
  for insert to authenticated with check (donor_id = auth.uid());
create policy listings_update_own on public.food_listings
  for update to authenticated using (donor_id = auth.uid()) with check (donor_id = auth.uid());

create policy claims_select on public.food_claims
  for select to authenticated using (
    receiver_id = auth.uid()
    or exists (select 1 from public.food_listings l
               where l.id = food_claims.listing_id and l.donor_id = auth.uid())
    or exists (select 1 from public.pickup_tasks t
               where t.claim_id = food_claims.id and t.volunteer_id = auth.uid())
  );
create policy claims_insert_own on public.food_claims
  for insert to authenticated with check (receiver_id = auth.uid());
create policy claims_update_own on public.food_claims
  for update to authenticated using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

create policy tasks_select on public.pickup_tasks
  for select to authenticated using (
    volunteer_id = auth.uid()
    or (volunteer_id is null and exists (select 1 from public.volunteers v where v.user_id = auth.uid()))
  );
create policy tasks_claim_unassigned on public.pickup_tasks
  for update to authenticated
  using (volunteer_id is null and exists (select 1 from public.volunteers v where v.user_id = auth.uid()))
  with check (volunteer_id = auth.uid());
create policy tasks_update_own on public.pickup_tasks
  for update to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());

create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy impact_select_party on public.impact_records
  for select to authenticated using (donor_id = auth.uid() or receiver_id = auth.uid());
