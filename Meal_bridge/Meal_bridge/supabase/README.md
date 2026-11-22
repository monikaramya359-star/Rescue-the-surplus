# MealBridge - Supabase setup

## 1. Which SQL to run
Run ONLY this file, once, in a fresh Supabase project:

    supabase/migrations/0001_mealbridge_canonical.sql

Everything else in `supabase/` is OBSOLETE and must NOT be run:
- `obsolete/0001_phase2_schema.sql`
- `schema.sql`
- `claims.sql`
- `rls_hardening.sql`

Each of these starts with a "NOT TO BE EXECUTED" banner. They describe a different database design (different table names and columns) and would conflict with the canonical migration.

## 2. Create a fresh Supabase project
1. Sign in at https://supabase.com and click **New project**.
2. Name it `mealbridge`, set a strong database password and store it safely.
3. Choose a region close to your users (for example Mumbai, ap-south-1).
4. Wait for provisioning to finish.

The migration is not written to re-run over an existing schema. Use a new project. If you need to start over, create another new project rather than dropping tables.

## 3. Authentication settings
1. **Authentication > Providers**: keep Email enabled.
2. Decide on **Confirm email** (keep it on for production).
3. **Authentication > URL Configuration**: set Site URL to the app address, for example `http://localhost:5173`.

## 4. Execution steps (exact)
1. Open **SQL Editor > New query**.
2. Open `supabase/migrations/0001_mealbridge_canonical.sql` from this project, copy the whole file, and paste it into the query window.
3. Click **Run** once. Run it as a single query. Do not run it section by section.
4. Wait for "Success". If it fails, do not run it again on the same project. Create a new project and start again from step 1 of section 2.
5. Run the verification queries in section 9.

## 5. Connect the frontend (later, when the app is wired to Supabase)
Put these in the project-root `.env` file. It is already git-ignored:

    VITE_SUPABASE_URL=<Project URL>
    VITE_SUPABASE_ANON_KEY=<anon public key>

Get both from **Project Settings > API**. Never put the `service_role` or secret key in the frontend or in any committed file. Never commit `.env`.

## 6. Sign-up data
The `on_auth_user_created` trigger builds the profile from `options.data` passed to `signUp`. Only donor, receiver and volunteer can sign up this way.

| Role | Keys in `options.data` |
|---|---|
| donor | `role: "donor"`, `restaurantName`, `ownerName`, `phone`, `location` (optional: `donorType`) |
| receiver | `role: "receiver"`, `organizationName`, `contactPerson`, `organizationType`, `phone`, `location` (optional: `capacityMealsPerDay`) |
| volunteer | `role: "volunteer"`, `fullName`, `availability`, `phone`, `location` (optional: `vehicle`) |

A sign-up with no `role` creates an account with no profile, and so no access, until an administrator adds one.

## 7. Creating an admin or sponsor (SQL Editor only)
Admin and sponsor accounts cannot be created by sign-up, and an existing user's role cannot be changed.

1. **Authentication > Users > Add user**: create the account with an email and password.
2. In **SQL Editor**, create the profile. Replace the email address:

    insert into public.users (id, role, email)
    select id, 'admin', email from auth.users where email = 'admin@example.com';

For a sponsor:

    insert into public.users (id, role, email)
    select id, 'sponsor', email from auth.users where email = 'sponsor@example.com';

    insert into public.sponsors (user_id, organization_name)
    select id, 'Demo Sponsor Foundation' from auth.users where email = 'sponsor@example.com';

## 8. Security model
- **Roles are fixed.** Clients cannot change `users.role`. The column is not granted, and a trigger rejects role changes from a signed-in session.
- **Suspended accounts** (`users.account_status = 'Suspended'`) get no access, because role checks return NULL for them.
- **Status is never written directly.** Claims, cancellations and pickup steps go through functions.
- **Client-callable functions** (granted to `authenticated` only): `current_user_role`, `can_see_listing`, `can_see_claim`, `claim_food`, `cancel_claim`, `cancel_listing`, `accept_pickup`, `advance_pickup`, `admin_set_account_status`, `admin_cancel_listing`, `get_impact_summary`.
- **Not client-callable** (no EXECUTE for PUBLIC, anon or authenticated): `handle_new_user` (auth trigger), `create_pickup_task_for_claim` and `notify_listing_posted` (table triggers), `add_notification` (internal helper), `expire_overdue_listings` (scheduled job).
- **Quantities cannot be oversold.** `claim_food` locks the listing row. A check constraint also stops `claimed_quantity` exceeding `quantity`.
- **Notifications and impact records** are written only by functions.
- **Anon role** has no table access and no function access.

## 9. Verify after running (SQL Editor)
Each query should return the result shown.

    -- Expected: 0
    select count(*) from public.users;

    -- Expected: zero rows (no SECURITY DEFINER function in public is executable by PUBLIC)
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace,
         lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where n.nspname = 'public' and p.prosecdef and a.grantee = 0 and a.privilege_type = 'EXECUTE';

    -- Expected: zero rows (anon can execute no SECURITY DEFINER function in public)
    select p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE');

In **Table Editor**, confirm RowLevelSecurity is enabled on these 11 tables: users, donors, receivers, volunteers, sponsors, food_listings, food_claims, pickup_tasks, notifications, impact_records, sponsor_records.
