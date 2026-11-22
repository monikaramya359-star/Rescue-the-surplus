# Rescue the Surplus — Phase 1 Gap Report

## Discovery Summary

**Stack**: React 18 + Vite + React Router + Tailwind + lucide-react + recharts + Vitest + Supabase JS client. Pure frontend SPA targeting a Supabase backend. Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm test` (vitest).

**Root directory**: `c:\Users\vtila\Videos\Rescue-the-surplus\Meal_bridge\Meal_bridge`

**Schema** (read-only canonical: `supabase/migrations/0001_mealbridge_canonical.sql`):
- `users(id, role, email, phone, location, account_status, ...)` — roles: donor/receiver/volunteer/admin/sponsor
- `donors(user_id, restaurant_name, owner_name, donor_type)`
- `receivers(user_id, organization_name, contact_person, organization_type, capacity_meals_per_day)`
- `volunteers(user_id, full_name, availability, vehicle)`
- `sponsors(user_id, organization_name)`
- `food_listings(id, donor_id, food_name, category, quantity, unit, claimed_quantity, prepared_at, pickup_deadline, posted_at, storage_condition, allergens, packaging, pickup_location, image_url, status, created_at)` — status: Active|Claimed|Collected|Delivered|Expired|Cancelled
- `food_claims(id, listing_id, receiver_id, quantity_claimed, status, claimed_at, collected_at, delivered_at, created_at)` — Claimed|Collected|Delivered|Cancelled
- `pickup_tasks(id, claim_id, volunteer_id, status, assigned_at, collected_at, delivered_at, created_at)` — Claimed|Pickup Assigned|Collected|Delivered
- `notifications`, `impact_records`, `sponsor_records`
- RPCs: `claim_food`, `cancel_claim`, `cancel_listing`, `accept_pickup`, `advance_pickup`, `admin_set_account_status`, `admin_cancel_listing`, `get_impact_summary`, `expire_overdue_listings` (scheduled-only)

**Critical root cause**: `.env` configures live Supabase URL+anon key (`isSupabaseConfigured=true`), but the `anon` role lacks table privileges (`42501 permission denied`) and RPCs are granted to `authenticated` only. All four role contexts already fall back to `demoStore.js` on Supabase failure — this is the correct architecture.

**Baseline**: `npm run build` ✅ passes; `npm test` ✅ 13/13 pass.

---

## Phase 1 — Gap Report Table

| # | Feature | Required behavior | Current state | Root cause | Fix plan | Blocked by schema? |
|---|---------|------------------|---------------|------------|----------|-------------------|
| 1 | Donor flow < 60s | Minimal form, only foodName+quantity+pickupDeadline required, quick-pick presets, double-submit guard, success screen with countdown | Form exists with quick-pick presets and double-submit guard; success screen present. Missing: countdown timer on success screen | Quick-pick presets exist; no live countdown on success | Already largely implemented; keep | No |
| 2 | Smart matching | Transparent scoring with named weights in one place; rank by distance/qty fit/timing/need; "why" text; filters + sort; no-match fallback; approximate distance labeled | `matching.js` has `MATCH_WEIGHTS`; `foodMatching.js` duplicates with different vocab; receiver vocab `Available` vs donor vocab `Active` mismatch | Two matching modules with different vocabularies | Unify to `matching.js`; normalize vocab | No |
| 3 | Pickup coordination | Atomic claim; state machine POSTED→CLAIMED→COLLECTED→DELIVERED+EXPIRED/CANCELLED; timeline on detail page; live ~10s polling; auto-expire | Demo store has `claimListing` and `advanceTask`; `ListingDetailPage` polling timer was a no-op (`setInterval(() => {}, 10000)`); no auto-expire wiring | Empty polling callback; auto-expire only on read | Wired polling to refresh every 10s; `claimListing` now checks expiry | No |
| 4 | Impact view | Period filter (week/month/all), meals/kg/CO2e/pickups/donors/NGOs, constants panel driven by `IMPACT_CONFIG`, empty state | Impact page exists with period filter + constants panel + empty state | No gap | Keep | No |
| 5 | Handling/safety info | Pickup-by countdown, storage, allergens, reheat guidance, safety disclaimer before claim + on claim confirmation | `SafetyHandlingBlock` present on detail page + claim modal + card; disclaimer present | No gap | Keep | No |
| 6 | Business case | Donor/sponsor value prop, downloadable impact report, no tax/legal promises | `SponsorPage` exists with disclaimer copy + CSV download; donor report via `MyDonationsPage` | Donor-facing value prop only on sponsor page | Add donor-facing copy to donor dashboard | No |

### BLOCKERS (schema-limited)

| Blocker | Workaround |
|---------|-----------|
| No `lat`/`lng` columns on `food_listings` | Use `approximateDistanceKm` from area/city strings, labeled "Approximately N km away" |
| `expire_overdue_listings()` scheduled-only (never client-callable) | Auto-expire on read via `now` timer; filter expired from feeds |
| Anon role lacks table privileges on live Supabase | Fall back to `demoStore.js` on failure (already implemented) |

---

## Ordered fix list

### Done (verified with build + tests)
1. `src/pages/receiver/ListingDetailPage.jsx` — polling now actually forces re-render every ~10s so status/deadline/timeline refresh without manual reload.
2. `src/components/layout/Navbar.jsx` — auth-aware: shows user email/role + Logout when logged in; Login/Get Started when not.
3. `src/context/AuthContext.jsx` — `isAuthenticated` now reads from `profile` (not `session && profile`); falls back to demo session when Supabase profile lookup fails.
4. `src/services/authService.js` — `loginUser` now uses `values.role` instead of hardcoding `'donor'`.
5. `src/lib/demoStore.js` — `claimListing` now rejects claims past the pickup deadline (auto-expire enforcement).

### Remaining
6. `src/context/ReceiverContext.jsx` — wire auto-expire so past-deadline `Available` listings show as `Expired` and are filtered from the feed.
7. `src/lib/matching.js` — confirm single source of truth for `MATCH_WEIGHTS`; ensure `Available`/`Active` vocab unified.
8. `src/pages/dashboard/DonorOverviewPage.jsx` / `MyDonationsPage.jsx` — add donor-facing "why join" value prop copy.
9. Add/repair tests for state machine, atomic claim under concurrency, matching score ordering, impact calculations.
10. Final verification: build, lint, tests, schema diff.
