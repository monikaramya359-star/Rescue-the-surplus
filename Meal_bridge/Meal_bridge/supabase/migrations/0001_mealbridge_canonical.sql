-- MealBridge canonical database schema. Single migration, PART 1 of 2 (tables, helpers, triggers, sign-up).
-- Target: Supabase PostgreSQL. NOT EXECUTED YET. Requires owner approval before running.
-- Replaces supabase/schema.sql, supabase/claims.sql, supabase/rls_hardening.sql and supabase/obsolete/0001_phase2_schema.sql (all NOT TO BE EXECUTED).
-- Status and field vocabulary matches src/data/donorData.js, receiverData.js, volunteerData.js, adminData.js and src/lib/demoStore.js.

create extension if not exists pgcrypto;

-- ===== Users and role profiles =====
create table public.users (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            text not null check (role in ('donor', 'receiver', 'volunteer', 'sponsor', 'admin')),
  email           text not null unique,
  phone           text not null default '',
  location        text not null default '',
  account_status  text not null default 'Active' check (account_status in ('Active', 'Suspended')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, role),
  constraint users_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  constraint users_phone_format check (phone = '' or length(regexp_replace(phone, '\D', '', 'g')) between 7 and 15),
  constraint users_location_length check (char_length(btrim(location)) <= 200)
);

create table public.donors (
  user_id         uuid primary key,
  role            text not null default 'donor' check (role = 'donor'),
  restaurant_name text not null check (char_length(btrim(restaurant_name)) > 0),
  owner_name      text not null check (char_length(btrim(owner_name)) > 0),
  donor_type      text not null default 'Restaurant' check (donor_type in ('Restaurant', 'Bakery', 'Grocery', 'Hostel mess', 'Caterer')),
  constraint donors_user_role_fk foreign key (user_id, role) references public.users (id, role) on delete cascade
);

create table public.receivers (
  user_id                 uuid primary key,
  role                    text not null default 'receiver' check (role = 'receiver'),
  organization_name       text not null check (char_length(btrim(organization_name)) > 0),
  contact_person          text not null check (char_length(btrim(contact_person)) > 0),
  organization_type       text not null check (organization_type in ('NGO', 'Community kitchen', 'Shelter', 'Food bank', 'Other')),
  capacity_meals_per_day  integer check (capacity_meals_per_day is null or capacity_meals_per_day >= 0),
  constraint receivers_user_role_fk foreign key (user_id, role) references public.users (id, role) on delete cascade
);

create table public.volunteers (
  user_id      uuid primary key,
  role         text not null default 'volunteer' check (role = 'volunteer'),
  full_name    text not null check (char_length(btrim(full_name)) > 0),
  availability text not null check (availability in ('Weekdays', 'Weekends', 'Evenings', 'Flexible')),
  vehicle      text check (vehicle is null or vehicle in ('On foot', 'Bicycle', 'Scooter', 'Car')),
  constraint volunteers_user_role_fk foreign key (user_id, role) references public.users (id, role) on delete cascade
);

-- Sponsors are created by an administrator only (the app has no sponsor sign-up).
create table public.sponsors (
  user_id           uuid primary key,
  role              text not null default 'sponsor' check (role = 'sponsor'),
  organization_name text not null check (char_length(btrim(organization_name)) > 0),
  constraint sponsors_user_role_fk foreign key (user_id, role) references public.users (id, role) on delete cascade
);

-- ===== Donations (app: listing / donation) =====
create table public.food_listings (
  id                 uuid primary key default gen_random_uuid(),
  donor_id           uuid not null references public.donors (user_id) on delete cascade,
  food_name          text not null,
  category           text not null check (category in ('Cooked Meals', 'Rice', 'Bread', 'Vegetables', 'Fruits', 'Packaged Food', 'Other')),
  quantity           integer not null check (quantity > 0),
  unit               text not null check (unit in ('Meals', 'Kg', 'Packets')),
  claimed_quantity   integer not null default 0 check (claimed_quantity >= 0),
  prepared_at        timestamptz,
  pickup_deadline    timestamptz not null,
  posted_at          timestamptz not null default now(),
  storage_condition  text check (storage_condition is null or storage_condition in ('Hot (above 60°C)', 'Chilled (0-5°C)', 'Room temperature', 'Frozen')),
  allergens          text,
  packaging          text,
  pickup_location    text not null,
  image_url          text,
  status             text not null default 'Active' check (status in ('Active', 'Claimed', 'Collected', 'Delivered', 'Expired', 'Cancelled')),
  created_at         timestamptz not null default now(),
  constraint food_listings_claimed_within_quantity check (claimed_quantity <= quantity),
  constraint food_listings_deadline_after_prepared check (prepared_at is null or pickup_deadline > prepared_at),
  constraint food_name_length check (char_length(btrim(food_name)) between 2 and 120),
  constraint pickup_location_length check (char_length(btrim(pickup_location)) between 2 and 200),
  constraint allergens_length check (allergens is null or char_length(allergens) <= 300),
  constraint packaging_length check (packaging is null or char_length(packaging) <= 200),
  constraint image_url_format check (image_url is null or image_url ~* '^https?://'),
  constraint quantity_max check (quantity <= 10000)
);

-- ===== Claims: a receiver takes part or all of a listing =====
create table public.food_claims (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.food_listings (id) on delete cascade,
  receiver_id       uuid not null references public.receivers (user_id) on delete cascade,
  quantity_claimed  integer not null check (quantity_claimed > 0 and quantity_claimed <= 10000),
  status            text not null default 'Claimed' check (status in ('Claimed', 'Collected', 'Delivered', 'Cancelled')),
  claimed_at        timestamptz not null default now(),
  collected_at      timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- A receiver holds at most one active claim per listing.
create unique index food_claims_one_active_per_receiver on public.food_claims (listing_id, receiver_id) where status = 'Claimed';

-- ===== Volunteer pickup tasks (app: task; one per claim) =====
create table public.pickup_tasks (
  id            uuid primary key default gen_random_uuid(),
  claim_id      uuid not null unique references public.food_claims (id) on delete cascade,
  volunteer_id  uuid references public.volunteers (user_id) on delete restrict,
  status        text not null default 'Claimed' check (status in ('Claimed', 'Pickup Assigned', 'Collected', 'Delivered')),
  assigned_at   timestamptz,
  collected_at  timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now(),
  constraint pickup_tasks_volunteer_matches_status check ((status = 'Claimed') = (volunteer_id is null)),
  constraint pickup_tasks_assigned_at_matches check ((assigned_at is not null) = (status <> 'Claimed')),
  constraint pickup_tasks_collected_at_matches check ((collected_at is not null) = (status in ('Collected', 'Delivered'))),
  constraint pickup_tasks_delivered_at_matches check ((delivered_at is not null) = (status = 'Delivered'))
);

-- ===== Notifications (types match demoStore.js) =====
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  type          text not null check (type in ('general', 'donation_posted', 'new_listing', 'claim_confirmed', 'food_claimed', 'pickup_accepted', 'food_collected', 'food_delivered', 'deadline')),
  title         text not null,
  message       text not null,
  dedupe_key    text,
  is_read       boolean not null default false,
  listing_id    uuid references public.food_listings (id) on delete set null,
  claim_id      uuid references public.food_claims (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint notifications_dedupe_unique unique (user_id, dedupe_key)
);

-- ===== Impact (one row per delivered claim; 0.2 kg per meal, Meals unit only) =====
create table public.impact_records (
  id                          uuid primary key default gen_random_uuid(),
  claim_id                    uuid not null unique references public.food_claims (id) on delete cascade,
  donor_id                    uuid not null references public.donors (user_id) on delete restrict,
  receiver_id                 uuid not null references public.receivers (user_id) on delete restrict,
  category                    text not null,
  quantity                    integer not null check (quantity > 0),
  unit                        text not null check (unit in ('Meals', 'Kg', 'Packets')),
  estimated_waste_avoided_kg  numeric(10, 2) not null default 0 check (estimated_waste_avoided_kg >= 0),
  completed_at                timestamptz not null,
  created_at                  timestamptz not null default now()
);

-- ===== Sponsor CSR reports (one row per sponsor per month; matches sponsorService monthlyTrend) =====
create table public.sponsor_records (
  id                    uuid primary key default gen_random_uuid(),
  sponsor_id            uuid not null references public.sponsors (user_id) on delete cascade,
  period_start          date not null check (extract(day from period_start) = 1),
  donations             integer not null default 0 check (donations >= 0),
  successful_donations  integer not null default 0 check (successful_donations >= 0),
  meals_rescued         integer not null default 0 check (meals_rescued >= 0),
  waste_avoided_kg      numeric(12, 1) generated always as (round(meals_rescued * 0.2, 1)) stored,
  created_at            timestamptz not null default now(),
  constraint sponsor_records_successful_lte_total check (successful_donations <= donations),
  constraint sponsor_records_one_per_month unique (sponsor_id, period_start)
);

create index food_listings_donor_idx        on public.food_listings (donor_id);
create index food_listings_status_idx       on public.food_listings (status, pickup_deadline);
create index food_claims_listing_idx        on public.food_claims (listing_id);
create index food_claims_receiver_idx       on public.food_claims (receiver_id);
create index pickup_tasks_volunteer_idx     on public.pickup_tasks (volunteer_id);
create index notifications_user_read_idx    on public.notifications (user_id, is_read);
create index impact_records_donor_idx       on public.impact_records (donor_id);
create index impact_records_receiver_idx    on public.impact_records (receiver_id);

-- ===== Generic helpers and triggers =====
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Role is fixed for any client session (auth.uid() is set). SQL Editor and service-role
-- calls run without a JWT (auth.uid() is null) and may change it for owner bootstrap only.
create or replace function public.prevent_role_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'Role cannot be changed';
  end if;
  return new;
end;
$$;

create trigger users_prevent_role_change before update on public.users
  for each row execute function public.prevent_role_change();

-- Every new claim gets exactly one pickup task.
create or replace function public.create_pickup_task_for_claim()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.pickup_tasks (claim_id, status) values (new.id, 'Claimed')
  on conflict (claim_id) do nothing;
  return new;
end;
$$;

create trigger food_claims_create_pickup after insert on public.food_claims
  for each row execute function public.create_pickup_task_for_claim();

-- Inserts one notification, ignoring repeats (dedupe per recipient).
create or replace function public.add_notification(
  p_user_id uuid, p_type text, p_title text, p_message text,
  p_dedupe_key text, p_listing_id uuid, p_claim_id uuid
)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, message, dedupe_key, listing_id, claim_id)
  values (p_user_id, p_type, p_title, p_message, p_dedupe_key, p_listing_id, p_claim_id)
  on conflict (user_id, dedupe_key) do nothing;
$$;

create or replace function public.notify_listing_posted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_notification(new.donor_id, 'donation_posted', 'Donation posted',
    new.food_name || ' is now listed for pickup.', 'posted-' || new.id, new.id, null);
  return new;
end;
$$;

create trigger food_listings_notify_posted after insert on public.food_listings
  for each row execute function public.notify_listing_posted();

-- Sign-up: profile rows come from auth metadata only. Admin and sponsor cannot self-register.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := new.raw_user_meta_data ->> 'role';
begin
  -- No role in the sign-up metadata: create no profile. The account has no access until an administrator adds one.
  if r is null then
    return new;
  end if;
  if r not in ('donor', 'receiver', 'volunteer') then
    raise exception 'Invalid role';
  end if;

  if r = 'donor' then
    if coalesce(btrim(new.raw_user_meta_data ->> 'restaurantName'), '') = ''
       or coalesce(btrim(new.raw_user_meta_data ->> 'ownerName'), '') = '' then
      raise exception 'Missing required profile field';
    end if;
  elsif r = 'receiver' then
    if coalesce(btrim(new.raw_user_meta_data ->> 'organizationName'), '') = ''
       or coalesce(btrim(new.raw_user_meta_data ->> 'contactPerson'), '') = ''
       or coalesce(btrim(new.raw_user_meta_data ->> 'organizationType'), '') = '' then
      raise exception 'Missing required profile field';
    end if;
  elsif r = 'volunteer' then
    if coalesce(btrim(new.raw_user_meta_data ->> 'fullName'), '') = ''
       or coalesce(btrim(new.raw_user_meta_data ->> 'availability'), '') = '' then
      raise exception 'Missing required profile field';
    end if;
  end if;

  insert into public.users (id, role, email, phone, location)
  values (new.id, r, new.email,
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          coalesce(new.raw_user_meta_data ->> 'location', ''));

  if r = 'donor' then
    insert into public.donors (user_id, restaurant_name, owner_name, donor_type)
    values (new.id, new.raw_user_meta_data ->> 'restaurantName', new.raw_user_meta_data ->> 'ownerName',
            coalesce(new.raw_user_meta_data ->> 'donorType', 'Restaurant'));
  elsif r = 'receiver' then
    insert into public.receivers (user_id, organization_name, contact_person, organization_type, capacity_meals_per_day)
    values (new.id, new.raw_user_meta_data ->> 'organizationName', new.raw_user_meta_data ->> 'contactPerson',
            new.raw_user_meta_data ->> 'organizationType',
            nullif(new.raw_user_meta_data ->> 'capacityMealsPerDay', '')::integer);
  elsif r = 'volunteer' then
    insert into public.volunteers (user_id, full_name, availability, vehicle)
    values (new.id, new.raw_user_meta_data ->> 'fullName', new.raw_user_meta_data ->> 'availability',
            nullif(new.raw_user_meta_data ->> 'vehicle', ''));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== PART 2 OF 2: access helpers, row level security, grants, functions =====

-- ===== Access helpers =====
-- All are SECURITY DEFINER with a fixed search_path so policies do not recurse into each other.
-- current_user_role() returns NULL for suspended accounts, so every role check below denies them.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select u.role from public.users u where u.id = auth.uid() and u.account_status = 'Active'
$$;

create or replace function public.can_see_listing(p_listing_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() is not null and exists (
    select 1
    from public.food_listings l
    where l.id = p_listing_id
      and (
        public.current_user_role() = 'admin'
        or (l.donor_id = auth.uid() and public.current_user_role() = 'donor')
        or (l.status = 'Active' and public.current_user_role() in ('receiver', 'volunteer'))
        or exists (select 1 from public.food_claims c
                   where c.listing_id = l.id and c.receiver_id = auth.uid())
        or exists (select 1 from public.food_claims c join public.pickup_tasks pk on pk.claim_id = c.id
                   where c.listing_id = l.id and pk.volunteer_id = auth.uid())
        or exists (select 1 from public.food_claims c join public.pickup_tasks pk on pk.claim_id = c.id
                   where c.listing_id = l.id and pk.status = 'Claimed' and pk.volunteer_id is null
                     and c.status = 'Claimed' and public.current_user_role() = 'volunteer')
      )
  )
$$;

create or replace function public.can_see_claim(p_claim_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() is not null and exists (
    select 1
    from public.food_claims c
    join public.food_listings l on l.id = c.listing_id
    left join public.pickup_tasks pk on pk.claim_id = c.id
    where c.id = p_claim_id
      and (
        public.current_user_role() = 'admin'
        or (l.donor_id = auth.uid() and public.current_user_role() = 'donor')
        or (c.receiver_id = auth.uid() and public.current_user_role() = 'receiver')
        or (pk.volunteer_id = auth.uid() and public.current_user_role() = 'volunteer')
        or (public.current_user_role() = 'volunteer' and pk.status = 'Claimed'
            and pk.volunteer_id is null and c.status = 'Claimed')
      )
  )
$$;

-- ===== Enable row level security on every table =====
alter table public.users             enable row level security;
alter table public.donors            enable row level security;
alter table public.receivers         enable row level security;
alter table public.volunteers        enable row level security;
alter table public.sponsors          enable row level security;
alter table public.food_listings     enable row level security;
alter table public.food_claims       enable row level security;
alter table public.pickup_tasks      enable row level security;
alter table public.notifications     enable row level security;
alter table public.impact_records    enable row level security;
alter table public.sponsor_records   enable row level security;

-- ===== Row level security policies =====

-- users: read own row (admin reads all). Update only phone and location (column grant below).
create policy users_select_own on public.users for select to authenticated
  using (id = auth.uid());
create policy users_select_admin on public.users for select to authenticated
  using (public.current_user_role() = 'admin');
create policy users_update_own on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Role profiles: visible to their owner, to admin, and to a counterparty in a visible listing or claim.
create policy donors_select on public.donors for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (select 1 from public.food_listings l
               where l.donor_id = donors.user_id and public.can_see_listing(l.id))
  );
create policy donors_update_own on public.donors for update to authenticated
  using (user_id = auth.uid() and public.current_user_role() = 'donor')
  with check (user_id = auth.uid());

create policy receivers_select on public.receivers for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (select 1 from public.food_claims c
               where c.receiver_id = receivers.user_id and public.can_see_claim(c.id))
  );
create policy receivers_update_own on public.receivers for update to authenticated
  using (user_id = auth.uid() and public.current_user_role() = 'receiver')
  with check (user_id = auth.uid());

create policy volunteers_select on public.volunteers for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (select 1 from public.pickup_tasks pk
               where pk.volunteer_id = volunteers.user_id and public.can_see_claim(pk.claim_id))
  );
create policy volunteers_update_own on public.volunteers for update to authenticated
  using (user_id = auth.uid() and public.current_user_role() = 'volunteer')
  with check (user_id = auth.uid());

create policy sponsors_select on public.sponsors for select to authenticated
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- food_listings (donations): visibility from can_see_listing; donors insert and edit their own.
-- Status is never client-writable; cancel goes through cancel_listing().
create policy food_listings_select on public.food_listings for select to authenticated
  using (public.can_see_listing(id));
create policy food_listings_insert_own on public.food_listings for insert to authenticated
  with check (donor_id = auth.uid() and public.current_user_role() = 'donor');
create policy food_listings_update_own on public.food_listings for update to authenticated
  using (donor_id = auth.uid() and public.current_user_role() = 'donor' and status in ('Active', 'Claimed'))
  with check (donor_id = auth.uid());

-- food_claims and pickup_tasks: read only. Written only by the functions below.
create policy food_claims_select on public.food_claims for select to authenticated
  using (public.can_see_claim(id));
create policy pickup_tasks_select on public.pickup_tasks for select to authenticated
  using (public.can_see_claim(claim_id));

-- notifications: read own; mark own as read. Inserted only by functions.
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- impact_records: read by admin and by the donor or receiver on the record. Written only by advance_pickup().
create policy impact_records_select on public.impact_records for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or donor_id = auth.uid()
    or receiver_id = auth.uid()
  );

-- sponsor_records: a sponsor reads own rows; admin reads and writes all rows.
create policy sponsor_records_select on public.sponsor_records for select to authenticated
  using (sponsor_id = auth.uid() or public.current_user_role() = 'admin');
create policy sponsor_records_insert_admin on public.sponsor_records for insert to authenticated
  with check (public.current_user_role() = 'admin');
create policy sponsor_records_update_admin on public.sponsor_records for update to authenticated
  using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy sponsor_records_delete_admin on public.sponsor_records for delete to authenticated
  using (public.current_user_role() = 'admin');

-- ===== Grants: deny everything, then allow only named columns and reads =====
revoke all privileges on table
  public.users,
  public.donors,
  public.receivers,
  public.volunteers,
  public.sponsors,
  public.food_listings,
  public.food_claims,
  public.pickup_tasks,
  public.notifications,
  public.impact_records,
  public.sponsor_records
from public, anon, authenticated;


grant usage on schema public to authenticated;

grant select on public.users, public.donors, public.receivers, public.volunteers, public.sponsors,
  public.food_listings, public.food_claims, public.pickup_tasks, public.notifications,
  public.impact_records, public.sponsor_records to authenticated;

grant update (phone, location) on public.users to authenticated;
grant update (restaurant_name, owner_name, donor_type) on public.donors to authenticated;
grant update (organization_name, contact_person, organization_type, capacity_meals_per_day) on public.receivers to authenticated;
grant update (full_name, availability, vehicle) on public.volunteers to authenticated;

grant insert (donor_id, food_name, category, quantity, unit, prepared_at, pickup_deadline,
              storage_condition, allergens, packaging, pickup_location, image_url)
  on public.food_listings to authenticated;
grant update (food_name, category, quantity, unit, prepared_at, pickup_deadline,
              storage_condition, allergens, packaging, pickup_location, image_url)
  on public.food_listings to authenticated;

grant update (is_read) on public.notifications to authenticated;

grant insert (sponsor_id, period_start, donations, successful_donations, meals_rescued),
      update (donations, successful_donations, meals_rescued),
      delete
  on public.sponsor_records to authenticated;

-- ===== Functions: helpers used by policies, and the client-callable RPCs =====
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_see_listing(uuid) to authenticated;
grant execute on function public.can_see_claim(uuid) to authenticated;

-- ===== Donation functions =====

-- Receiver claims part or all of an Active listing. Row lock on the listing serialises concurrent claims,
-- so the remaining quantity cannot be oversold. The listing check constraint is a second safety net.
create or replace function public.claim_food(p_listing_id uuid, p_quantity integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid := auth.uid();
  l           public.food_listings%rowtype;
  v_remaining integer;
  v_claim_id  uuid;
begin
  if public.current_user_role() is distinct from 'receiver' then
    raise exception 'Only active receivers can claim food' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be a whole number of at least 1';
  end if;

  select * into l from public.food_listings where id = p_listing_id for update;
  if not found then
    raise exception 'Listing not found';
  end if;
  if l.status <> 'Active' then
    raise exception 'Listing is not available';
  end if;
  if l.pickup_deadline <= now() + interval '30 minutes' then
    raise exception 'Too little time left to collect';
  end if;
  if exists (select 1 from public.food_claims
             where listing_id = p_listing_id and receiver_id = v_uid and status = 'Claimed') then
    raise exception 'You already have an active claim on this listing';
  end if;

  v_remaining := l.quantity - l.claimed_quantity;
  if p_quantity > v_remaining then
    raise exception 'Only % left to claim', v_remaining;
  end if;

  update public.food_listings
  set claimed_quantity = claimed_quantity + p_quantity,
      status = case when claimed_quantity + p_quantity >= quantity then 'Claimed' else status end
  where id = p_listing_id;

  insert into public.food_claims (listing_id, receiver_id, quantity_claimed)
  values (p_listing_id, v_uid, p_quantity)
  returning id into v_claim_id;

  perform public.add_notification(l.donor_id, 'food_claimed', 'Food claimed',
    'A receiver has claimed ' || p_quantity || ' ' || l.unit || ' of ' || l.food_name || '.',
    'food-claimed-' || v_claim_id, p_listing_id, v_claim_id);
  perform public.add_notification(v_uid, 'claim_confirmed', 'Claim confirmed',
    'You claimed ' || p_quantity || ' ' || l.unit || ' of ' || l.food_name || '.',
    'claim-confirmed-' || v_claim_id, p_listing_id, v_claim_id);

  return v_claim_id;
end;
$$;

-- Receiver cancels their own active claim and the quantity returns to the listing.
create or replace function public.cancel_claim(p_claim_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  c     public.food_claims%rowtype;
begin
  if public.current_user_role() is distinct from 'receiver' then
    raise exception 'Only active receivers can cancel claims' using errcode = '42501';
  end if;

  select * into c from public.food_claims where id = p_claim_id for update;
  if not found or c.receiver_id <> v_uid then
    raise exception 'Claim not found';
  end if;
  if c.status <> 'Claimed' then
    raise exception 'This claim can no longer be cancelled';
  end if;

  update public.food_claims set status = 'Cancelled' where id = p_claim_id;

  update public.food_listings
  set claimed_quantity = greatest(claimed_quantity - c.quantity_claimed, 0),
      status = case when status = 'Claimed' and pickup_deadline > now() then 'Active' else status end
  where id = c.listing_id;
end;
$$;

-- Donor cancels their own Active listing, only when no receiver holds an active claim on it.
create or replace function public.cancel_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  l public.food_listings%rowtype;
begin
  if public.current_user_role() is distinct from 'donor' then
    raise exception 'Only active donors can cancel listings' using errcode = '42501';
  end if;

  select * into l from public.food_listings where id = p_listing_id for update;
  if not found or l.donor_id <> auth.uid() then
    raise exception 'Listing not found';
  end if;
  if l.status <> 'Active' then
    raise exception 'Only an Active listing can be cancelled';
  end if;
  if exists (select 1 from public.food_claims where listing_id = p_listing_id and status = 'Claimed') then
    raise exception 'This listing has active claims and cannot be cancelled';
  end if;

  update public.food_listings set status = 'Cancelled' where id = p_listing_id;
end;
$$;

-- ===== Pickup functions =====

-- Volunteer accepts an unassigned pickup. Claimed -> Pickup Assigned.
create or replace function public.accept_pickup(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  t     public.pickup_tasks%rowtype;
  c     public.food_claims%rowtype;
  l     public.food_listings%rowtype;
begin
  if public.current_user_role() is distinct from 'volunteer' then
    raise exception 'Only active volunteers can accept pickups' using errcode = '42501';
  end if;

  select * into t from public.pickup_tasks where id = p_task_id for update;
  if not found then
    raise exception 'Task not found';
  end if;
  if t.volunteer_id is not null or t.status <> 'Claimed' then
    raise exception 'Task is not open for assignment';
  end if;

  select * into c from public.food_claims where id = t.claim_id;
  if c.status <> 'Claimed' then
    raise exception 'Claim is no longer active';
  end if;
  select * into l from public.food_listings where id = c.listing_id;

  update public.pickup_tasks
  set volunteer_id = v_uid, status = 'Pickup Assigned', assigned_at = now()
  where id = t.id;

  perform public.add_notification(l.donor_id, 'pickup_accepted', 'Volunteer assigned',
    'A volunteer has accepted the pickup of ' || l.food_name || '.',
    'accepted-' || t.id, l.id, c.id);
  perform public.add_notification(c.receiver_id, 'pickup_accepted', 'Volunteer assigned',
    'A volunteer has accepted the pickup of ' || l.food_name || '.',
    'accepted-' || t.id, l.id, c.id);
  perform public.add_notification(v_uid, 'pickup_accepted', 'Pickup accepted',
    'You accepted the pickup of ' || l.food_name || '.',
    'accepted-' || t.id, l.id, c.id);
end;
$$;

-- Assigned volunteer moves the pickup forward: Pickup Assigned -> Collected -> Delivered.
-- Delivered writes one impact record per claim. Only Meals count toward meals rescued (0.2 kg per meal).
create or replace function public.advance_pickup(p_task_id uuid, p_next_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  t         public.pickup_tasks%rowtype;
  c         public.food_claims%rowtype;
  l         public.food_listings%rowtype;
  v_now     timestamptz := now();
  v_open    integer;
begin
  if public.current_user_role() is distinct from 'volunteer' then
    raise exception 'Only active volunteers can update pickups' using errcode = '42501';
  end if;

  select * into t from public.pickup_tasks where id = p_task_id for update;
  if not found or t.volunteer_id is distinct from v_uid then
    raise exception 'Task not found';
  end if;

  select * into c from public.food_claims where id = t.claim_id;
  if c.status = 'Cancelled' then
    raise exception 'Claim was cancelled';
  end if;
  select * into l from public.food_listings where id = c.listing_id for update;

  if t.status = 'Pickup Assigned' and p_next_status = 'Collected' then
    update public.pickup_tasks set status = 'Collected', collected_at = v_now where id = t.id;
    update public.food_claims set status = 'Collected', collected_at = v_now where id = c.id;

    if l.status = 'Claimed' and l.claimed_quantity = l.quantity then
      update public.food_listings set status = 'Collected' where id = l.id;
    end if;

    perform public.add_notification(l.donor_id, 'food_collected', 'Food collected',
      'The food has been collected from ' || l.pickup_location || '.',
      'collected-' || t.id, l.id, c.id);
    perform public.add_notification(c.receiver_id, 'food_collected', 'Food collected',
      l.food_name || ' has been collected and is on its way to you.',
      'collected-' || t.id, l.id, c.id);

  elsif t.status = 'Collected' and p_next_status = 'Delivered' then
    update public.pickup_tasks set status = 'Delivered', delivered_at = v_now where id = t.id;
    update public.food_claims set status = 'Delivered', delivered_at = v_now where id = c.id;

    insert into public.impact_records (claim_id, donor_id, receiver_id, category, quantity, unit,
                                       estimated_waste_avoided_kg, completed_at)
    values (c.id, l.donor_id, c.receiver_id, l.category, c.quantity_claimed, l.unit,
            case when l.unit = 'Meals' then round(c.quantity_claimed * 0.2, 2) else 0 end, v_now)
    on conflict (claim_id) do nothing;

    select count(*) into v_open from public.food_claims
    where listing_id = l.id and status in ('Claimed', 'Collected');
    if v_open = 0 and l.status = 'Collected' then
      update public.food_listings set status = 'Delivered' where id = l.id;
    end if;

    perform public.add_notification(l.donor_id, 'food_delivered', 'Food delivered',
      l.food_name || ' was delivered to ' || c.receiver_id || '.', 'delivered-' || t.id, l.id, c.id);
    perform public.add_notification(c.receiver_id, 'food_delivered', 'Food delivered',
      l.food_name || ' was delivered to your organization.', 'delivered-' || t.id, l.id, c.id);
    perform public.add_notification(v_uid, 'food_delivered', 'Delivery complete',
      l.food_name || ' was delivered. Thank you.', 'delivered-' || t.id, l.id, c.id);
  else
    raise exception 'Cannot move pickup from % to %', t.status, p_next_status;
  end if;
end;
$$;

-- ===== Admin functions =====

-- Admin suspends or reactivates an account. Admin cannot change their own status.
create or replace function public.admin_set_account_status(p_user_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can change account status' using errcode = '42501';
  end if;
  if p_status not in ('Active', 'Suspended') then
    raise exception 'Invalid account status';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own account status';
  end if;
  update public.users set account_status = p_status where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

-- Admin cancels an Active listing that has no active claims.
create or replace function public.admin_cancel_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can cancel listings' using errcode = '42501';
  end if;
  if exists (select 1 from public.food_claims where listing_id = p_listing_id and status = 'Claimed') then
    raise exception 'This listing has active claims and cannot be cancelled';
  end if;
  update public.food_listings set status = 'Cancelled'
  where id = p_listing_id and status = 'Active';
  if not found then
    raise exception 'Only an Active listing can be cancelled';
  end if;
end;
$$;

-- Aggregates only. No identities are returned.
create or replace function public.get_impact_summary()
returns table (
  meals_rescued         bigint,
  waste_avoided_kg      numeric,
  successful_donations  bigint,
  completed_deliveries  bigint,
  active_donors         bigint,
  participating_ngos    bigint
)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(i.quantity) filter (where i.unit = 'Meals'), 0),
    coalesce(sum(i.estimated_waste_avoided_kg), 0),
    count(distinct c.listing_id),
    count(*),
    (select count(distinct l.donor_id) from public.food_listings l where l.status = 'Active'),
    count(distinct i.receiver_id)
  from public.impact_records i
  join public.food_claims c on c.id = i.claim_id
$$;

-- Client-callable functions (granted to authenticated only).
grant execute on function public.claim_food(uuid, integer)              to authenticated;
grant execute on function public.cancel_claim(uuid)                     to authenticated;
grant execute on function public.cancel_listing(uuid)                   to authenticated;
grant execute on function public.accept_pickup(uuid)                    to authenticated;
grant execute on function public.advance_pickup(uuid, text)             to authenticated;
grant execute on function public.admin_set_account_status(uuid, text)   to authenticated;
grant execute on function public.admin_cancel_listing(uuid)             to authenticated;
grant execute on function public.get_impact_summary()                   to authenticated;

-- Scheduled-only (run by the database owner or a service job, never by clients).
-- Marks Active listings past their deadline as Expired, but only when no receiver holds an active claim.
create or replace function public.expire_overdue_listings()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  update public.food_listings l
  set status = 'Expired'
  where l.status = 'Active'
    and l.pickup_deadline <= now()
    and not exists (select 1 from public.food_claims c where c.listing_id = l.id and c.status = 'Claimed');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- Final targeted function permission hardening

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_pickup_task_for_claim() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_notification(uuid, text, text, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_listing_posted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_see_listing(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_see_claim(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_food(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_claim(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_listing(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_pickup(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.advance_pickup(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_cancel_listing(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_impact_summary() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_overdue_listings() FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to call approved functions

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_food(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_pickup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_pickup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_impact_summary() TO authenticated;
