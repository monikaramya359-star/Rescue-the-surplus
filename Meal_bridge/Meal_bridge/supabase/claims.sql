-- ============================================================================
-- OBSOLETE - NOT TO BE EXECUTED.
-- Superseded by supabase/migrations/0001_mealbridge_canonical.sql.
-- This file defines a conflicting database design (different table names,
-- columns and relationships). Running it alongside the canonical migration
-- will fail or corrupt the schema. Kept for reference only.
-- ============================================================================


-- MealBridge - food claiming functions
-- Run AFTER supabase/schema.sql.
--
-- NOTE: this file has NOT been executed against any database yet.
--
-- Design notes:
--   * Each function runs as one transaction. If any check fails, the
--     raised exception rolls back every change made inside that call.
--   * Row locks ("for update") on the food_listings row (claim_food) and on
--     the food_claims row (confirm_claim, cancel_claim) make concurrent calls
--     wait for each other. Two receivers therefore cannot both take the same
--     remaining quantity, and a listing cannot be over-claimed.
--   * 'Confirmed' is added to the food_claims status check here. It is the
--     state a receiver moves a claim into with confirm_claim().
--   * Each function is SECURITY DEFINER with a fixed search_path, and it
--     checks auth.uid() itself. Execute is granted only to "authenticated".

-- 1. Allow 'Confirmed' as a claim status.
alter table public.food_claims drop constraint if exists food_claims_status_check;
alter table public.food_claims add constraint food_claims_status_check check (status in ('Claimed', 'Confirmed', 'Collected', 'Delivered', 'Cancelled'));

-- 2. Claim a quantity of an active listing.
create or replace function public.claim_food(p_listing_id uuid, p_quantity numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  l           public.food_listings%rowtype;
  remaining   numeric;
  v_claim_id  uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.receivers where user_id = v_uid) then
    raise exception 'Only receivers can claim food';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into l
  from public.food_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if l.status <> 'Active' then
    raise exception 'Listing is not available';
  end if;

  if l.pickup_deadline <= now() + interval '30 minutes' then
    raise exception 'Too little time left to collect';
  end if;

  if exists (
    select 1 from public.food_claims
    where listing_id = p_listing_id
      and receiver_id = v_uid
      and status in ('Claimed', 'Confirmed')
  ) then
    raise exception 'You already have an active claim on this listing';
  end if;

  remaining := l.quantity - l.claimed_quantity;
  if p_quantity > remaining then
    raise exception 'Only % left to claim', remaining;
  end if;

  update public.food_listings
  set claimed_quantity = claimed_quantity + p_quantity,
      status = case when claimed_quantity + p_quantity >= quantity then 'Claimed' else status end
  where id = p_listing_id;

  insert into public.food_claims (listing_id, receiver_id, quantity_claimed, status)
  values (p_listing_id, v_uid, p_quantity, 'Claimed')
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

-- 3. Confirm a claim (Claimed -> Confirmed).
create or replace function public.confirm_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  c      public.food_claims%rowtype;
begin
  select * into c
  from public.food_claims
  where id = p_claim_id
  for update;

  if not found or c.receiver_id <> v_uid then
    raise exception 'Claim not found';
  end if;

  if c.status <> 'Claimed' then
    raise exception 'Only a Claimed claim can be confirmed';
  end if;

  update public.food_claims
  set status = 'Confirmed'
  where id = p_claim_id;
end;
$$;

-- 4. Cancel a claim and release its quantity back to the listing.
create or replace function public.cancel_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  c      public.food_claims%rowtype;
  l      public.food_listings%rowtype;
begin
  select * into c
  from public.food_claims
  where id = p_claim_id
  for update;

  if not found or c.receiver_id <> v_uid then
    raise exception 'Claim not found';
  end if;

  if c.status not in ('Claimed', 'Confirmed') then
    raise exception 'This claim can no longer be cancelled';
  end if;

  select * into l
  from public.food_listings
  where id = c.listing_id
  for update;

  update public.food_claims
  set status = 'Cancelled'
  where id = p_claim_id;

  update public.food_listings
  set claimed_quantity = greatest(claimed_quantity - c.quantity_claimed, 0),
      status = case
                 when l.status = 'Claimed'
                  and claimed_quantity - c.quantity_claimed < quantity
                  and pickup_deadline > now()
                 then 'Active'
                 else status
               end
  where id = c.listing_id;
end;
$$;

-- 5. Permissions: only signed-in users may execute these functions.
revoke execute on function public.claim_food(uuid, numeric) from public;
revoke execute on function public.confirm_claim(uuid) from public;
revoke execute on function public.cancel_claim(uuid) from public;

grant execute on function public.claim_food(uuid, numeric) to authenticated;
grant execute on function public.confirm_claim(uuid) to authenticated;
grant execute on function public.cancel_claim(uuid) to authenticated;
