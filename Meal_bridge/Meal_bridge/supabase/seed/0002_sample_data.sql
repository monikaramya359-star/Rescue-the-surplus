-- MealBridge sample data (seed).
-- Run AFTER supabase/migrations/0001_mealbridge_canonical.sql, in Supabase Dashboard > SQL Editor, once.
--
-- Loads demo accounts, food listings and one claim from src/data/adminData.js, donorData.js,
-- receiverData.js and volunteerData.js. Accounts are inserted into auth.users; the handle_new_user
-- trigger creates the public.users row and the role profile from raw_user_meta_data.
-- Sample ids map to fixed UUIDs: md5('mb-seed:' || sample_id)::uuid. Re-running is safe (ON CONFLICT DO NOTHING).
-- Samples without enough data for the schema are not inserted (see the report that accompanies this file).

begin;

-- ===== Accounts (auth.users -> trigger creates public.users + donors / receivers / volunteers) =====
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  -- Donors (u-001 .. u-004)
  (md5('mb-seed:u-001')::uuid, 'authenticated', 'authenticated', 'ravi.sharma@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"donor","restaurantName":"Saffron Kitchen","ownerName":"Ravi Sharma","donorType":"Restaurant","phone":"+91 98220 11223","location":"FC Road, Pune"}'::jsonb),
  (md5('mb-seed:u-002')::uuid, 'authenticated', 'authenticated', 'meera.fernandes@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"donor","restaurantName":"Crust & Co. Bakery","ownerName":"Meera Fernandes","donorType":"Bakery","phone":"+91 97634 55102","location":"Baner Road, Pune"}'::jsonb),
  (md5('mb-seed:u-003')::uuid, 'authenticated', 'authenticated', 'suresh.iyer@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"donor","restaurantName":"Hostel Mess Block C","ownerName":"Suresh Iyer","donorType":"Hostel mess","phone":"+91 90110 78345","location":"Hostel Campus, Pune"}'::jsonb),
  (md5('mb-seed:u-004')::uuid, 'authenticated', 'authenticated', 'kavita.mehta@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"donor","restaurantName":"Green Leaf Caterers","ownerName":"Kavita Mehta","donorType":"Caterer","phone":"+91 99221 36740","location":"Aundh, Pune"}'::jsonb),
  -- Receivers (u-005 .. u-007)
  (md5('mb-seed:u-005')::uuid, 'authenticated', 'authenticated', 'anita.desai@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"receiver","organizationName":"Hope Community Kitchen","contactPerson":"Anita Desai","organizationType":"Community kitchen","capacityMealsPerDay":"300","phone":"+91 98900 45678","location":"Kothrud, Pune"}'::jsonb),
  (md5('mb-seed:u-006')::uuid, 'authenticated', 'authenticated', 'farah.khan@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"receiver","organizationName":"Little Hearts Shelter","contactPerson":"Farah Khan","organizationType":"Shelter","phone":"+91 95520 83016","location":"Viman Nagar, Pune"}'::jsonb),
  (md5('mb-seed:u-007')::uuid, 'authenticated', 'authenticated', 'vikram.rao@example.com',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"receiver","organizationName":"Sunrise Food NGO","contactPerson":"Vikram Rao","organizationType":"NGO","phone":"+91 91580 27419","location":"Hadapsar, Pune"}'::jsonb),
  -- Volunteer (vol-1, from volunteerData.js volunteerProfile)
  (md5('mb-seed:vol-1')::uuid, 'authenticated', 'authenticated', 'arjun.mehta@volunteer.example',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"volunteer","fullName":"Arjun Mehta","availability":"Evenings","vehicle":"Bicycle","phone":"+91 98765 01234","location":"Viman Nagar, Pune"}'::jsonb)
on conflict (id) do nothing;

-- Account status is not a sign-up field; apply the sample status after the trigger has run.
update public.users set account_status = 'Suspended' where id = md5('mb-seed:u-003')::uuid;

-- ===== Food listings (adminData.js seedAdminListings) =====
insert into public.food_listings
  (id, donor_id, food_name, category, quantity, unit, claimed_quantity, posted_at, pickup_deadline, pickup_location, status)
values
  (md5('mb-seed:l-101')::uuid, md5('mb-seed:u-001')::uuid, 'Vegetable biryani trays', 'Cooked Meals', 30, 'Meals', 0,
   now() + interval '-45 minutes',  now() + interval '120 minutes',  '12 FC Road, Pune 411004', 'Active'),
  (md5('mb-seed:l-102')::uuid, md5('mb-seed:u-002')::uuid, 'Sourdough loaves', 'Bread', 20, 'Packets', 0,
   now() + interval '-30 minutes',  now() + interval '600 minutes', '45 Baner Road, Pune 411045', 'Active'),
  (md5('mb-seed:l-103')::uuid, md5('mb-seed:u-004')::uuid, 'Garden salad boxes', 'Vegetables', 14, 'Packets', 0,
   now() + interval '-240 minutes', now() + interval '-90 minutes',  '7 Aundh Road, Pune 411007', 'Active'),
  (md5('mb-seed:l-104')::uuid, md5('mb-seed:u-004')::uuid, 'Fresh fruit crates', 'Fruits', 12, 'Kg', 0,
   now() + interval '-900 minutes', now() + interval '-600 minutes', '7 Aundh Road, Pune 411007', 'Expired'),
  (md5('mb-seed:l-105')::uuid, md5('mb-seed:u-001')::uuid, 'Paneer tikka wraps', 'Cooked Meals', 25, 'Meals', 25,
   now() + interval '-200 minutes', now() + interval '180 minutes', '12 FC Road, Pune 411004', 'Claimed'),
  (md5('mb-seed:l-106')::uuid, md5('mb-seed:u-003')::uuid, 'Steamed basmati rice', 'Rice', 15, 'Kg', 0,
   now() + interval '-720 minutes', now() + interval '-240 minutes', 'Block C, Hostel Campus, Pune 411014', 'Collected'),
  (md5('mb-seed:l-107')::uuid, md5('mb-seed:u-001')::uuid, 'Dal rice combo meals', 'Cooked Meals', 40, 'Meals', 0,
   now() + interval '-1440 minutes', now() + interval '-1080 minutes', '12 FC Road, Pune 411004', 'Delivered'),
  (md5('mb-seed:l-108')::uuid, md5('mb-seed:u-002')::uuid, 'Whole wheat bread rolls', 'Bread', 18, 'Packets', 0,
   now() + interval '-360 minutes', now() + interval '-60 minutes', '45 Baner Road, Pune 411045', 'Cancelled')
on conflict (id) do nothing;

-- ===== Claim for pickup pk-201 (Paneer tikka wraps, Hope Community Kitchen, no volunteer yet) =====
-- The food_claims insert trigger creates the pickup_tasks row (status Claimed, no volunteer).
insert into public.food_claims (id, listing_id, receiver_id, quantity_claimed, status)
values (md5('mb-seed:claim:pk-201')::uuid, md5('mb-seed:l-105')::uuid, md5('mb-seed:u-005')::uuid, 25, 'Claimed')
on conflict (id) do nothing;

-- Give the trigger-created pickup task the sample id pk-201.
update public.pickup_tasks set id = md5('mb-seed:pk-201')::uuid
where claim_id = md5('mb-seed:claim:pk-201')::uuid;

commit;
