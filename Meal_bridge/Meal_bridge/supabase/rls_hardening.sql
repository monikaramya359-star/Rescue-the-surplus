-- ============================================================================
-- OBSOLETE - NOT TO BE EXECUTED.
-- Superseded by supabase/migrations/0001_mealbridge_canonical.sql.
-- This file defines a conflicting database design (different table names,
-- columns and relationships). Running it alongside the canonical migration
-- will fail or corrupt the schema. Kept for reference only.
-- ============================================================================


-- MealBridge - RLS hardening migration
--
-- Hardens RLS on the MealBridge schema: role immutability, sign-up validation,
-- field validation constraints, restricted donor listing writes, claim and
-- pickup writes routed through security-definer functions, aggregate-only impact
-- reporting, and anon lockdown.
--
-- Run order: supabase/schema.sql, then supabase/claims.sql, then this file.
-- Re-runnable: policies, triggers and constraints are dropped before they are
-- created, and functions use create or replace.
--
-- NOTE: this file has NOT been executed against any database yet.
--
-- What each section closes:
--   1. Role immutability      - a user can no longer change users.role, even via
--                               a direct update that bypasses the column grant.
--   2. Sign-up hardening      - sign-up rejects unknown roles (including 'admin')
--                               and blank required profile fields.
--   3. Field validation       - email, phone, location, listing and claim field
--                               lengths/formats are enforced in the database.
--   4. Donor listing writes   - donors may insert/update only whitelisted columns
--                               on their own listings; cancel goes through
--                               cancel_listing(); status and counters are not
--                               client-writable.
--   5. Claim writes           - claims are written only by claim_food,
--                               confirm_claim and cancel_claim.
--   6. Pickup task creation   - a pickup task is created automatically for each
--                               new claim, so no client insert is needed.
--   7. Pickup task writes     - volunteers accept and advance pickups only through
--                               accept_pickup() and advance_pickup(), which check
--                               ownership and allowed status transitions.
--   8. Impact summary         - get_impact_summary() returns aggregates only, no
--                               identities.
--   9. Anon lockdown          - the anon role has no table or function access.
--  10. (this header)

-- =============================================================================
-- 1. ROLE IMMUTABILITY
-- Blocks any update that changes users.role, so a user cannot promote themselves.
-- =============================================================================

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Role cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists users_prevent_role_change on public.users;
create trigger users_prevent_role_change
  before update on public.users
  for each row execute function public.prevent_role_change();

-- =============================================================================
-- 2. SIGN-UP TRIGGER HARDENING
-- Same inserts as schema.sql, plus role and required-field validation.
-- Phone and location stay coalesced to '' as in schema.sql.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := new.raw_user_meta_data ->> 'role';
begin
  -- A null role must be rejected explicitly: "null not in (...)" is null, not true.
  if r is null or r not in ('donor', 'receiver', 'volunteer') then
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =============================================================================
-- 3. FIELD VALIDATION CONSTRAINTS
-- Each constraint is dropped first so the file can be re-run.
-- =============================================================================

alter table public.users drop constraint if exists users_email_format;
alter table public.users add constraint users_email_format
  check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

alter table public.users drop constraint if exists users_phone_format;
alter table public.users add constraint users_phone_format
  check (phone = '' or length(regexp_replace(phone, '\D', '', 'g')) between 7 and 15);

alter table public.users drop constraint if exists users_location_length;
alter table public.users add constraint users_location_length
  check (char_length(trim(location)) <= 200);

alter table public.food_listings drop constraint if exists food_name_length;
alter table public.food_listings add constraint food_name_length
  check (char_length(trim(food_name)) between 2 and 120);

alter table public.food_listings drop constraint if exists pickup_location_length;
alter table public.food_listings add constraint pickup_location_length
  check (char_length(trim(pickup_location)) between 2 and 200);

alter table public.food_listings drop constraint if exists allergens_length;
alter table public.food_listings add constraint allergens_length
  check (allergens is null or char_length(allergens) <= 300);

alter table public.food_listings drop constraint if exists packaging_length;
alter table public.food_listings add constraint packaging_length
  check (packaging is null or char_length(packaging) <= 200);

alter table public.food_listings drop constraint if exists image_url_format;
alter table public.food_listings add constraint image_url_format
  check (image_url is null or image_url ~* '^https?://');

alter table public.food_listings drop constraint if exists quantity_max;
alter table public.food_listings add constraint quantity_max
  check (quantity <= 10000);

alter table public.food_claims drop constraint if exists quantity_claimed_max;
alter table public.food_claims add constraint quantity_claimed_max
  check (quantity_claimed <= 10000);

-- =============================================================================
-- 4. DONOR LISTING WRITES (food_listings)
-- Donors insert and update only whitelisted columns. status, claimed_quantity,
-- donor_id, id, created_at and posted_at are not client-writable.
-- Cancelling goes through cancel_listing().
-- The schema.sql check claimed_quantity <= quantity stops a donor cutting
-- quantity below what is already claimed.
-- =============================================================================

revoke insert, update, delete on public.food_listings from authenticated;

grant insert (donor_id, food_name, category, quantity, unit, prepared_at, pickup_deadline,
              storage_condition, allergens, packaging, pickup_location, image_url)
  on public.food_listings to authenticated;

grant update (food_name, category, quantity, unit, prepared_at, pickup_deadline,
              storage_condition, allergens, packaging, pickup_location, image_url)
  on public.food_listings to authenticated;

drop policy if exists listings_insert_own on public.food_listings;
create policy listings_insert_own on public.food_listings
  for insert to authenticated
  with check (
    donor_id = auth.uid()
    and exists (select 1 from public.donors d where d.user_id = auth.uid())
  );

drop policy if exists listings_update_own on public.food_listings;
create policy listings_update_own on public.food_listings
  for update to authenticated
  using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

create or replace function public.cancel_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.food_listings%rowtype;
begin
  select * into l
  from public.food_listings
  where id = p_listing_id
  for update;

  if not found or l.donor_id is distinct from auth.uid() then
    raise exception 'Listing not found';
  end if;

  if l.status <> 'Active' then
    raise exception 'Only an Active listing can be cancelled';
  end if;

  update public.food_listings
  set status = 'Cancelled'
  where id = p_listing_id;
end;
$$;

revoke execute on function public.cancel_listing(uuid) from public;
grant execute on function public.cancel_listing(uuid) to authenticated;

-- =============================================================================
-- 5. CLAIM WRITES (food_claims)
-- Claims are written only by claim_food, confirm_claim and cancel_claim
-- (claims.sql). Direct client inserts and updates are removed. claims_select stays.
-- =============================================================================

drop policy if exists claims_insert_own on public.food_claims;
drop policy if exists claims_update_own on public.food_claims;

revoke insert, update, delete on public.food_claims from authenticated;

-- =============================================================================
-- 6. PICKUP TASK AUTO-CREATION
-- Each new claim gets exactly one pickup task, created by a trigger.
-- =============================================================================

create or replace function public.create_pickup_task_for_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pickup_tasks (claim_id, status)
  values (new.id, 'Claimed')
  on conflict (claim_id) do nothing;

  return new;
end;
$$;

drop trigger if exists food_claims_create_pickup on public.food_claims;
create trigger food_claims_create_pickup
  after insert on public.food_claims
  for each row execute function public.create_pickup_task_for_claim();

-- =============================================================================
-- 7. PICKUP TASK WRITES (pickup_tasks)
-- Volunteers accept and advance pickups only through accept_pickup() and
-- advance_pickup(). Direct client updates are removed. tasks_select stays.
-- =============================================================================

drop policy if exists tasks_claim_unassigned on public.pickup_tasks;
drop policy if exists tasks_update_own on public.pickup_tasks;

revoke insert, update, delete on public.pickup_tasks from authenticated;

create or replace function public.accept_pickup(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  t               public.pickup_tasks%rowtype;
  v_claim_status  text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.volunteers v where v.user_id = v_uid) then
    raise exception 'Only volunteers can accept pickups';
  end if;

  select * into t
  from public.pickup_tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if t.volunteer_id is not null then
    raise exception 'Task already assigned';
  end if;

  if t.status <> 'Claimed' then
    raise exception 'Task is not open for assignment';
  end if;

  select c.status into v_claim_status
  from public.food_claims c
  where c.id = t.claim_id;

  if v_claim_status not in ('Claimed', 'Confirmed') then
    raise exception 'Claim is no longer active';
  end if;

  update public.pickup_tasks
  set volunteer_id = v_uid,
      status = 'Pickup Assigned',
      assigned_at = now()
  where id = p_task_id;
end;
$$;

create or replace function public.advance_pickup(p_task_id uuid, p_next_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  t               public.pickup_tasks%rowtype;
  v_claim_status  text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select * into t
  from public.pickup_tasks
  where id = p_task_id
  for update;

  if not found or t.volunteer_id is distinct from v_uid then
    raise exception 'Task not found';
  end if;

  select c.status into v_claim_status
  from public.food_claims c
  where c.id = t.claim_id;

  if v_claim_status = 'Cancelled' then
    raise exception 'Claim was cancelled';
  end if;

  if t.status = 'Pickup Assigned' and p_next_status = 'Collected' then
    update public.pickup_tasks
    set status = 'Collected',
        collected_at = now()
    where id = p_task_id;

    update public.food_claims
    set status = 'Collected'
    where id = t.claim_id;

  elsif t.status = 'Collected' and p_next_status = 'Delivered' then
    update public.pickup_tasks
    set status = 'Delivered',
        delivered_at = now()
    where id = p_task_id;

    update public.food_claims
    set status = 'Delivered'
    where id = t.claim_id;

    insert into public.impact_records (
      claim_id, donor_id, receiver_id, category, quantity, unit,
      estimated_waste_avoided_kg, completed_at
    )
    select c.id,
           l.donor_id,
           c.receiver_id,
           l.category,
           c.quantity_claimed,
           l.unit,
           case when l.unit = 'Meals' then c.quantity_claimed * 0.2 else 0 end,
           now()
    from public.food_claims c
    join public.food_listings l on l.id = c.listing_id
    where c.id = t.claim_id
    on conflict (claim_id) do nothing;

  else
    raise exception 'Invalid status change';
  end if;
end;
$$;

revoke execute on function public.accept_pickup(uuid) from public;
revoke execute on function public.advance_pickup(uuid, text) from public;
grant execute on function public.accept_pickup(uuid) to authenticated;
grant execute on function public.advance_pickup(uuid, text) to authenticated;

-- =============================================================================
-- 8. IMPACT FUNCTION (aggregates only, no identities)
-- Returns exactly one row, including when there are no impact records.
-- =============================================================================

create or replace function public.get_impact_summary()
returns table (
  meals_rescued          numeric,
  waste_avoided_kg       numeric,
  successful_donations   bigint,
  completed_deliveries   bigint,
  active_donors          bigint,
  participating_ngos     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select coalesce(sum(i.quantity) filter (where i.unit = 'Meals'), 0) as meals,
           count(*)                                                    as deliveries,
           count(distinct i.receiver_id)                               as ngos,
           count(distinct c.listing_id)                                as donations
    from public.impact_records i
    join public.food_claims c on c.id = i.claim_id
  )
  select t.meals,
         t.meals * 0.2,
         t.donations,
         t.deliveries,
         (select count(distinct l.donor_id) from public.food_listings l where l.status = 'Active'),
         t.ngos
  from totals t;
$$;

revoke execute on function public.get_impact_summary() from public;
grant execute on function public.get_impact_summary() to authenticated;

-- =============================================================================
-- 9. ANON LOCKDOWN
-- The anon role gets no table or function access. Sign-in and sign-up go through
-- Supabase Auth, not direct table access.
-- =============================================================================

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
