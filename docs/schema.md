# vivah_ai — Database Schema Reference

**Database:** `vivah_ai`  **Engine:** PostgreSQL 15 (Supabase)  **Migration:** `supabase/migrations/001_initial_schema.sql`

---

## Table of Contents

1. [users](#1-users)
2. [wedding_profiles](#2-wedding_profiles)
3. [venue_selections](#3-venue_selections)
4. [event_guest_counts](#4-event_guest_counts)
5. [decor_images](#5-decor_images)
6. [decor_shortlists](#6-decor_shortlists)
7. [model_versions](#7-model_versions)
8. [cost_items](#8-cost_items)
9. [cost_items_audit](#9-cost_items_audit)
10. [food_selections](#10-food_selections)
11. [entertainment_selections](#11-entertainment_selections)
12. [logistics_selections](#12-logistics_selections)
13. [sundries_selections](#13-sundries_selections)
14. [budget_snapshots](#14-budget_snapshots)

---

## 1. `users`

Platform users — clients, planners, and admins.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID (`gen_random_uuid()`) |
| `email` | `VARCHAR(255)` UNIQUE NOT NULL | Login email address |
| `name` | `VARCHAR(200)` | Display name |
| `role` | `VARCHAR(20)` DEFAULT `'client'` | Access level: `client` \| `admin` \| `planner` |
| `password_hash` | `TEXT` | bcrypt/argon2 hash — never store plaintext |
| `phone` | `VARCHAR(20)` | Contact phone number |
| `city` | `VARCHAR(100)` | User's home city |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Account creation timestamp |
| `last_login_at` | `TIMESTAMPTZ` | Timestamp of most recent successful login |

---

## 2. `wedding_profiles`

One record per wedding — master configuration for the entire plan.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `user_id` | `UUID` FK → `users.id` | Owning user; CASCADE on delete |
| `wedding_date` | `DATE` | Ceremony date |
| `is_weekend` | `BOOLEAN` GENERATED STORED | Auto-computed: TRUE when `wedding_date` is Saturday (6) or Sunday (0) |
| `wedding_type` | `VARCHAR(50)` | Ceremony type: `hindu` \| `muslim` \| `sikh` \| `christian` \| `buddhist` \| `jain` \| `generic` |
| `budget_style` | `VARCHAR(20)` | Budget tier: `luxury` \| `modest` \| `minimalist` |
| `selected_events` | `TEXT[]` | Array of planned events, e.g. `{engagement,haldi,sangeet}` |
| `bride_hometown` | `VARCHAR(150)` | Bride's origin city |
| `groom_hometown` | `VARCHAR(150)` | Groom's origin city |
| `outstation_flag` | `BOOLEAN` DEFAULT `FALSE` | TRUE when significant guests travel from another city |
| `venue_city` | `VARCHAR(150)` | City where the wedding takes place |
| `venue_state` | `VARCHAR(100)` | State where the wedding takes place |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Last modification; auto-updated by trigger |

**Trigger:** `trg_wedding_profiles_updated_at` — sets `updated_at = NOW()` on every UPDATE.

---

## 3. `venue_selections`

1:1 with `wedding_profiles` — venue type and accommodation details.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` | Parent wedding profile; CASCADE on delete |
| `venue_type` | `VARCHAR(50)` | `banquet` \| `garden` \| `hotel5` \| `resort` \| `heritage` \| `beach` \| `farmhouse` \| `temple` \| `home` |
| `seating_min` | `INTEGER` DEFAULT `200` | Minimum seated capacity |
| `seating_max` | `INTEGER` DEFAULT `500` | Maximum seated capacity |
| `hotel_tier` | `VARCHAR(20)` | Accommodation tier: `palace` \| `city5` \| `hotel4` \| `resort` \| `farmhouse` |
| `accom_guests` | `INTEGER` DEFAULT `0` | Number of guests requiring overnight accommodation |
| `rooms_required` | `INTEGER` GENERATED STORED | Auto-computed: `CEIL(accom_guests / 2)` — double occupancy |
| `accom_nights` | `INTEGER` DEFAULT `2` | Number of nights accommodation required |

---

## 4. `event_guest_counts`

Per-event guest count ranges; one row per event per wedding.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` | Parent wedding profile; CASCADE on delete |
| `event_id` | `VARCHAR(50)` NOT NULL | Event slug: `sangeet`, `haldi`, `ceremony`, `reception`, etc. |
| `guests_min` | `INTEGER` DEFAULT `50` | Conservative (low) guest count estimate |
| `guests_max` | `INTEGER` DEFAULT `200` | Upper-bound guest count estimate |

**Constraint:** `UNIQUE(profile_id, event_id)` — one row per event per wedding.

---

## 5. `decor_images`

Central ML training and inference table — scraped decor images with labels, embeddings, and cost predictions.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `source` | `VARCHAR(50)` NOT NULL | Origin platform: `pinterest` \| `instagram` \| `wedmegood` \| `weddingwire` \| `upload` |
| `source_url` | `TEXT` UNIQUE NOT NULL | Original URL of the image |
| `image_path` | `TEXT` | S3 key for raw original: `raw/{id}.jpg` |
| `processed_path` | `TEXT` | S3 key for 224×224 model-ready image: `processed/{id}.jpg` |
| `thumbnail_path` | `TEXT` | S3 key for 150×150 UI thumbnail: `thumbnails/{id}.jpg` |
| `image_hash` | `VARCHAR(64)` | Perceptual hash (pHash) for duplicate detection |
| `title` | `TEXT` | Image or board title from source |
| `description` | `TEXT` | Description text from source |
| `raw_tags` | `TEXT[]` | Raw tags scraped from source platform |
| `board_name` | `TEXT` | Pinterest/Instagram board or album name |
| `likes` | `INTEGER` DEFAULT `0` | Engagement count from source platform |
| `scraped_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | When the image was scraped |
| `function_type` | `VARCHAR(50)` | Admin label: `Mandap` \| `Stage` \| `Entrance` \| `Floral` \| `Lighting` \| `Table` \| `Reception` |
| `style` | `VARCHAR(50)` | Aesthetic style: `Traditional` \| `Modern` \| `Rustic` \| `Royal` \| `Minimalist` \| `Floral Garden` \| `Fusion` |
| `complexity` | `VARCHAR(20)` | Setup complexity: `Low` \| `Medium` \| `High` |
| `base_cost` | `INTEGER` | Admin-seeded baseline cost in INR |
| `is_labelled` | `BOOLEAN` DEFAULT `FALSE` | TRUE when admin has applied function/style/complexity labels |
| `labelled_by` | `VARCHAR(100)` | Admin username who applied labels |
| `labelled_at` | `TIMESTAMPTZ` | When labelling was completed |
| `embedding` | `FLOAT8[]` | MobileNetV2 1280-dim feature vector for similarity search |
| `predicted_cost` | `INTEGER` | ML model's point estimate cost in INR |
| `predicted_low` | `INTEGER` | Lower bound of the prediction confidence interval (INR) |
| `predicted_high` | `INTEGER` | Upper bound of the prediction confidence interval (INR) |
| `prediction_confidence` | `FLOAT` | Model confidence score 0–1 |
| `actual_cost` | `INTEGER` | Real-world verified cost in INR — used for continuous retraining |
| `actual_cost_date` | `TIMESTAMPTZ` | When the actual cost was recorded |

---

## 6. `decor_shortlists`

Client-selected decor items shortlisted for their specific wedding profile.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` | Parent wedding profile; CASCADE on delete |
| `decor_image_id` | `UUID` FK → `decor_images.id` | Selected decor image; CASCADE on delete |
| `selected_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | When the client shortlisted this item |
| `client_notes` | `TEXT` | Free-text client notes on customisation requests |
| `confirmed_cost` | `INTEGER` | Vendor-confirmed actual cost in INR after negotiation |

**Constraint:** `UNIQUE(profile_id, decor_image_id)` — each image can be shortlisted once per wedding.

---

## 7. `model_versions`

ML model registry — tracks trained versions, evaluation metrics, and the single active model.

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL` PK | Auto-incrementing integer |
| `version` | `VARCHAR(50)` UNIQUE NOT NULL | Semantic version string, e.g. `v1.0.0`, `v2.3.1` |
| `mae` | `FLOAT` | Mean absolute error in INR on held-out test set |
| `mape` | `FLOAT` | Mean absolute percentage error on held-out test set |
| `n_samples` | `INTEGER` | Number of training samples used |
| `model_path` | `TEXT` | S3 object key for serialised model, e.g. `models/v2.3.1/decor_model.joblib` |
| `is_active` | `BOOLEAN` DEFAULT `FALSE` | TRUE for the currently serving model — only ONE row allowed (partial unique index) |
| `promoted_at` | `TIMESTAMPTZ` | When this version was activated |
| `promoted_by` | `VARCHAR(100)` | Username or system identity that activated this version |
| `notes` | `TEXT` | Release notes / changelog |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | When the model was trained/registered |

**Index:** `CREATE UNIQUE INDEX idx_mv_active ON model_versions(is_active) WHERE is_active = TRUE` — enforces single active model.

---

## 8. `cost_items`

Admin-editable master pricing database — full change history via `cost_items_audit`.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `category` | `VARCHAR(50)` NOT NULL | Top-level group: `artist` \| `catering` \| `logistics` \| `venue` \| `decor` \| `sundries` |
| `subcategory` | `VARCHAR(100)` NOT NULL | Second-level group, e.g. `bollywood`, `dj`, `food`, `bar`, `counter`, `transport`, `sfx` |
| `name` | `VARCHAR(200)` NOT NULL | Human-readable item name |
| `cost_low` | `INTEGER` NOT NULL | Minimum market rate in INR |
| `cost_high` | `INTEGER` NOT NULL | Maximum market rate in INR |
| `unit` | `VARCHAR(50)` | Billing unit: `per_head` \| `per_event` \| `per_hour` \| `per_night` \| `per_unit` \| `per_room` \| `per_trip` |
| `city_tier` | `VARCHAR(20)` DEFAULT `'Tier1'` | Cost tier: `Tier1` (Mumbai/Delhi) \| `Tier2` \| `Tier3` |
| `is_active` | `BOOLEAN` DEFAULT `TRUE` | FALSE to soft-delete without losing audit history |
| `version` | `INTEGER` DEFAULT `1` | Incremented on every UPDATE |
| `notes` | `TEXT` | Admin notes / context |
| `updated_by` | `VARCHAR(100)` | Admin username who last modified this row |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Last modification; auto-updated by trigger |

**Trigger:** `trg_cost_items_updated_at` — sets `updated_at = NOW()` on every UPDATE.
**Trigger:** `trg_cost_items_audit` — writes every INSERT/UPDATE/DELETE to `cost_items_audit`.

---

## 9. `cost_items_audit`

Immutable audit log of all `cost_items` changes — auto-populated by trigger, never insert manually.

| Column | Type | Description |
|---|---|---|
| `audit_id` | `SERIAL` PK | Auto-incrementing audit record ID |
| `item_id` | `UUID` FK → `cost_items.id` | The cost item that was changed |
| `action` | `VARCHAR(20)` | DML operation: `INSERT` \| `UPDATE` \| `DELETE` |
| `old_values` | `JSONB` | Full row snapshot before change (NULL for INSERT) |
| `new_values` | `JSONB` | Full row snapshot after change (NULL for DELETE) |
| `changed_by` | `VARCHAR(100)` | Value of `app.current_user` session variable at time of change |
| `changed_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Exact timestamp of the change |
| `change_note` | `TEXT` | Optional reason from `app.change_note` session variable |

---

## 10. `food_selections`

1:1 with `wedding_profiles` — food preferences, bar type, and specialty counter selections.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` UNIQUE | Parent wedding profile; CASCADE on delete |
| `food_categories` | `TEXT[]` | Dietary types required: `{veg}`, `{veg,nonveg}`, `{jain}`, etc. |
| `food_tier` | `VARCHAR(20)` | Catering quality: `standard` \| `high` \| `modern` |
| `bar_type` | `VARCHAR(20)` | Bar service: `dry` \| `beerwine` \| `fullbar` |
| `specialty_counters` | `TEXT[]` | Add-on stations: `chaat`, `mocktail`, `icecream`, `teacoffee` |
| `catering_cost_low` | `BIGINT` | Estimated minimum total catering cost in INR |
| `catering_cost_high` | `BIGINT` | Estimated maximum total catering cost in INR |

---

## 11. `entertainment_selections`

Many per `wedding_profiles` — each row is one artist or entertainment act selected.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` | Parent wedding profile; CASCADE on delete |
| `cost_item_id` | `UUID` FK → `cost_items.id` | Reference to cost_items for pricing; NULL for custom acts |
| `artist_type` | `VARCHAR(50)` | Category: `dj`, `bollywood_singer`, `folk`, `emcee`, `band` |
| `is_named` | `BOOLEAN` DEFAULT `FALSE` | TRUE when a specific named artist is booked |
| `confirmed_fee` | `INTEGER` | Vendor-confirmed actual fee in INR after negotiation |

---

## 12. `logistics_selections`

1:1 with `wedding_profiles` — guest transport, ghodi, dholi, and SFX logistics.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` UNIQUE | Parent wedding profile; CASCADE on delete |
| `outstation_guests` | `INTEGER` DEFAULT `0` | Guests arriving from another city requiring airport/station transfers |
| `guests_per_vehicle` | `INTEGER` DEFAULT `3` | Occupancy assumption per vehicle |
| `transfer_km` | `INTEGER` DEFAULT `35` | One-way airport/station to venue distance in km |
| `km_rate` | `INTEGER` DEFAULT `18` | Per-km vehicle hire rate in INR |
| `vehicles_required` | `INTEGER` | Calculated number of vehicles needed |
| `transfer_cost` | `INTEGER` | Calculated total transfer cost in INR |
| `ghodi_count` | `INTEGER` DEFAULT `0` | Number of horses (ghodi) for the baraat |
| `ghodi_city_rate` | `INTEGER` DEFAULT `10000` | City-specific ghodi rate per event in INR |
| `dholi_count` | `INTEGER` DEFAULT `2` | Number of dhol players |
| `dholi_hours` | `INTEGER` DEFAULT `3` | Hours of dhol performance |
| `sfx_details` | `JSONB` DEFAULT `'{}'` | SFX items and quantities, e.g. `{"cold_pyro":4,"confetti":2}` |
| `sfx_cost` | `INTEGER` DEFAULT `0` | Calculated total SFX cost in INR |

---

## 13. `sundries_selections`

1:1 with `wedding_profiles` — gift hampers, welcome baskets, invitations, stationery, and miscellaneous.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` UNIQUE | Parent wedding profile; CASCADE on delete |
| `room_basket_tier` | `INTEGER` DEFAULT `1500` | Per-unit cost of welcome basket for hotel rooms in INR |
| `room_basket_count` | `INTEGER` DEFAULT `25` | Number of welcome baskets required |
| `hamper_tier` | `INTEGER` DEFAULT `1500` | Per-unit cost of guest gift hamper in INR |
| `hamper_count` | `INTEGER` DEFAULT `200` | Number of gift hampers required |
| `ritual_materials` | `JSONB` DEFAULT `'{}'` | Pooja/ritual material items and estimated costs |
| `invite_count` | `INTEGER` DEFAULT `300` | Number of wedding invitations to print |
| `invite_cost_each` | `INTEGER` DEFAULT `150` | Per-unit invitation printing cost in INR |
| `menu_count` | `INTEGER` DEFAULT `50` | Number of printed menu cards |
| `signage_count` | `INTEGER` DEFAULT `10` | Number of venue signage / direction boards |
| `contingency_pct` | `FLOAT` DEFAULT `7.0` | Contingency buffer as percentage of total budget |
| `sundries_total` | `INTEGER` | Calculated grand total including contingency in INR |

---

## 14. `budget_snapshots`

Point-in-time versioned budget exports, shareable via unique token.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Auto-generated UUID |
| `profile_id` | `UUID` FK → `wedding_profiles.id` | Parent wedding profile; CASCADE on delete |
| `version` | `INTEGER` DEFAULT `1` | Incrementing version number per profile for revision comparison |
| `total_low` | `BIGINT` | Aggregated minimum total budget estimate in INR |
| `total_mid` | `BIGINT` | Aggregated midpoint total budget estimate in INR |
| `total_high` | `BIGINT` | Aggregated maximum total budget estimate in INR |
| `confidence_score` | `FLOAT` | ML confidence score 0–1 for the predicted cost range accuracy |
| `line_items` | `JSONB` | Full itemised breakdown, e.g. `{"venue":{"low":150000,"high":500000},"catering":{...}}` |
| `scenario` | `VARCHAR(50)` | PSO optimisation scenario label: `palace` \| `city5` \| `hotel4` \| `farmhouse` |
| `is_shared` | `BOOLEAN` DEFAULT `FALSE` | TRUE when a shareable link has been generated |
| `share_token` | `VARCHAR(64)` UNIQUE | Random token for public share link |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | When this snapshot was exported |

---

## Indexes Summary

| Index Name | Table | Column(s) | Type | Notes |
|---|---|---|---|---|
| `idx_wp_user` | `wedding_profiles` | `user_id` | B-tree | Fast lookup by owner |
| `idx_wp_date` | `wedding_profiles` | `wedding_date` | B-tree | Calendar queries |
| `idx_egc_profile` | `event_guest_counts` | `profile_id` | B-tree | Load all events for a wedding |
| `idx_egc_event` | `event_guest_counts` | `event_id` | B-tree | Find all weddings with a given event |
| `idx_di_labelled` | `decor_images` | `is_labelled` | B-tree | Filter unlabelled queue |
| `idx_di_function` | `decor_images` | `function_type` | B-tree | Filter by decor category |
| `idx_di_hash` | `decor_images` | `image_hash` | B-tree | Duplicate detection |
| `idx_di_source` | `decor_images` | `source` | B-tree | Filter by origin platform |
| `idx_mv_active` | `model_versions` | `is_active` | Partial UNIQUE | Enforces single active model |
| `idx_ci_category` | `cost_items` | `category` | B-tree | Filter by category |
| `idx_ci_subcat` | `cost_items` | `subcategory` | B-tree | Filter by subcategory |
| `idx_ci_tier` | `cost_items` | `city_tier` | B-tree | Filter by city tier |
| `idx_bs_token` | `budget_snapshots` | `share_token` | Partial B-tree | Fast share-link lookup |

---

## Triggers Summary

| Trigger | Table | Event | Action |
|---|---|---|---|
| `trg_wedding_profiles_updated_at` | `wedding_profiles` | BEFORE UPDATE | Sets `updated_at = NOW()` |
| `trg_cost_items_updated_at` | `cost_items` | BEFORE UPDATE | Sets `updated_at = NOW()` |
| `trg_cost_items_audit` | `cost_items` | AFTER INSERT OR UPDATE OR DELETE | Inserts row into `cost_items_audit` with full JSONB snapshots |

---

## Entity Relationships

```
users
  └── wedding_profiles (N)
        ├── venue_selections (1:1)
        ├── event_guest_counts (N — one per event)
        ├── food_selections (1:1)
        ├── entertainment_selections (N — one per artist)
        │     └── cost_items (FK)
        ├── logistics_selections (1:1)
        ├── sundries_selections (1:1)
        ├── budget_snapshots (N — one per export version)
        └── decor_shortlists (N)
              └── decor_images (FK)

decor_images ← model_versions (active model scores all images)
cost_items   → cost_items_audit (full audit trail via trigger)
```
