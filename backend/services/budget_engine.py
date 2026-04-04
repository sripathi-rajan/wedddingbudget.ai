import math
from typing import Dict, Any
from models.cost_tables import (
    WEDDING_TYPE_BASE_COSTS, EVENT_COSTS, VENUE_COSTS_PER_DAY,
    HOTEL_ACCOMMODATION, FOOD_COSTS_PER_HEAD, BAR_COSTS_PER_HEAD,
    SPECIALTY_COUNTER_COSTS, ARTIST_COSTS, LOGISTICS_COSTS,
    SUNDRIES_COSTS, CATERING_STAFF_COST, WEEKEND_SURCHARGE
)

def calculate_full_budget(config: dict) -> dict:
    """Master budget calculator - returns itemised Low/Mid/High breakdown."""
    
    items = {}
    total_low = 0
    total_mid = 0
    total_high = 0

    # ─── 1. Wedding Style / Type ──────────────────────────
    wedding_type = config.get("wedding_type", "Generic")
    base = WEDDING_TYPE_BASE_COSTS.get(wedding_type, WEDDING_TYPE_BASE_COSTS["Generic"])
    weekend_mult = (1 + WEEKEND_SURCHARGE) if config.get("is_weekend") else 1
    
    items["Wedding Type Base"] = {
        "low":  base["low"]  * weekend_mult,
        "mid":  base["mid"]  * weekend_mult,
        "high": base["high"] * weekend_mult,
        "note": f"{wedding_type} + {'Weekend +15%' if config.get('is_weekend') else 'Weekday'}"
    }

    # ─── 2. Events ────────────────────────────────────────
    events = config.get("events", [])
    events_low = events_mid = events_high = 0
    for event in events:
        ec = EVENT_COSTS.get(event, {"low": 0, "mid": 0, "high": 0})
        events_low  += ec["low"]
        events_mid  += ec["mid"]
        events_high += ec["high"]
    
    items["Events & Ceremonies"] = {
        "low": events_low, "mid": events_mid, "high": events_high,
        "note": ", ".join(events) if events else "No events selected"
    }

    # ─── 3. Venue ─────────────────────────────────────────
    venue_type = config.get("venue_type", "Banquet Hall")
    num_days = max(1, len(events) // 2)
    vc = VENUE_COSTS_PER_DAY.get(venue_type, VENUE_COSTS_PER_DAY["Banquet Hall"])
    
    items["Venue"] = {
        "low":  vc["low"]  * num_days * weekend_mult,
        "mid":  vc["mid"]  * num_days * weekend_mult,
        "high": vc["high"] * num_days * weekend_mult,
        "note": f"{venue_type} × {num_days} days"
    }

    # ─── 4. Accommodation ─────────────────────────────────
    outstation = config.get("outstation_guests", 0)
    hotel_tier = config.get("hotel_tier", "4-star")
    hac = HOTEL_ACCOMMODATION.get(hotel_tier, HOTEL_ACCOMMODATION["4-star"])
    rooms_needed = math.ceil(outstation / hac["people_per_room"])
    nights = num_days + 1
    
    items["Accommodation"] = {
        "low":  rooms_needed * hac["per_room_low"]  * nights,
        "mid":  rooms_needed * ((hac["per_room_low"] + hac["per_room_high"]) / 2) * nights,
        "high": rooms_needed * hac["per_room_high"] * nights,
        "note": f"{rooms_needed} rooms × {nights} nights ({hotel_tier})"
    }

    # ─── 5. Food & Beverages ──────────────────────────────
    total_guests = config.get("total_guests", 200)
    food_tier = config.get("food_budget_tier", "High")
    fc = FOOD_COSTS_PER_HEAD.get(food_tier, FOOD_COSTS_PER_HEAD["High"])
    bar_type = config.get("bar_type", "Dry Event")
    bar_per_head = BAR_COSTS_PER_HEAD.get(bar_type, 0)
    specialty = config.get("specialty_counters", [])
    specialty_cost = sum(SPECIALTY_COUNTER_COSTS.get(s, 0) for s in specialty) * max(1, len(events))
    
    # Catering staff
    staff_cost = 80000
    for tier_name, tier in CATERING_STAFF_COST.items():
        if total_guests <= tier["max_guests"]:
            staff_cost = tier["cost"]
            break

    food_base_low  = fc["low"]  * total_guests * len(events)
    food_base_high = fc["high"] * total_guests * len(events)
    
    items["Food & Beverages"] = {
        "low":  food_base_low  + (bar_per_head * total_guests * 0.5) + specialty_cost + staff_cost,
        "mid":  ((food_base_low + food_base_high)/2) + (bar_per_head * total_guests * 0.75) + specialty_cost + staff_cost,
        "high": food_base_high + (bar_per_head * total_guests)       + specialty_cost + staff_cost,
        "note": f"{food_tier} × {total_guests} guests × {len(events)} events | Bar: {bar_type}"
    }

    # ─── 6. Decor ─────────────────────────────────────────
    decor_total = config.get("decor_total", 0)
    if decor_total > 0:
        items["Decor & Design"] = {
            "low":  decor_total * 0.8,
            "mid":  decor_total,
            "high": decor_total * 1.25,
            "note": "Based on selected decor items"
        }
    else:
        # Estimate based on budget tier
        decor_mult = {"Luxury": 0.20, "Modest": 0.15, "Minimalist": 0.10}
        dm = decor_mult.get(config.get("budget_tier", "Modest"), 0.15)
        est = base["mid"] * dm
        items["Decor & Design"] = {
            "low": est * 0.7, "mid": est, "high": est * 1.5,
            "note": "Estimated — select decor in Tab 3 for precise cost"
        }

    # ─── 7. Artists & Entertainment ───────────────────────
    artists_total = config.get("artists_total", 0)
    if artists_total > 0:
        items["Artists & Entertainment"] = {
            "low":  artists_total * 0.9,
            "mid":  artists_total,
            "high": artists_total * 1.1,
            "note": "Based on selected artists"
        }
    else:
        items["Artists & Entertainment"] = {
            "low": 100000, "mid": 350000, "high": 1500000,
            "note": "Estimated — select artists in Tab 5"
        }

    # ─── 8. Logistics ─────────────────────────────────────
    logistics_total = config.get("logistics_total", 0)
    if logistics_total > 0:
        items["Logistics & Transport"] = {
            "low":  logistics_total * 0.9,
            "mid":  logistics_total,
            "high": logistics_total * 1.15,
            "note": "Based on logistics config in Tab 7"
        }
    else:
        innova_est = math.ceil(outstation / 3) * LOGISTICS_COSTS["innova_per_trip"] * 4
        items["Logistics & Transport"] = {
            "low": innova_est * 0.8, "mid": innova_est, "high": innova_est * 1.4,
            "note": f"Estimated fleet for {outstation} outstation guests"
        }

    # ─── 9. Sundries ──────────────────────────────────────
    sc = SUNDRIES_COSTS
    rooms = rooms_needed
    basket = sc["room_basket_standard"]
    hamper = sc["gift_hamper_standard"] * total_guests
    ritual_cost = 0
    for event in events:
        if "Haldi" in event:    ritual_cost += sc["ritual_haldi_per_ceremony"]
        if "Mehendi" in event:  ritual_cost += sc["ritual_mehendi_per_ceremony"]
        if "Wedding" in event:  ritual_cost += sc["ritual_pheras_per_ceremony"]
    stationery = (total_guests * sc["stationery_per_invite"]) + (total_guests * sc["menu_card_per_person"])

    sundries_base = (rooms * basket) + hamper + ritual_cost + stationery
    items["Sundries & Basics"] = {
        "low":  sundries_base * 0.8,
        "mid":  sundries_base,
        "high": sundries_base * 1.3,
        "note": "Room baskets, hampers, rituals, stationery"
    }

    # ─── 10. Contingency ──────────────────────────────────
    running_mid = sum(v["mid"] for v in items.values())
    contingency = running_mid * sc["contingency_pct"]
    items["Contingency Buffer (8%)"] = {
        "low":  contingency * 0.5,
        "mid":  contingency,
        "high": contingency * 1.5,
        "note": "Admin-set 8% buffer"
    }

    # ─── RL Multiplier Adjustment ─────────────────────────
    rl_active   = False
    rl_samples  = 0
    try:
        from ml.rl_agent import get_rl_agent
        agent = get_rl_agent()
        rl_samples = sum(agent.training_counts.values())
        if rl_samples > 0:
            for cat, vals in items.items():
                mult = agent.multipliers.get(cat, 1.0)
                if abs(mult - 1.0) > 0.01:  # only adjust if meaningfully different
                    items[cat] = {
                        "low":          vals["low"]  * mult,
                        "mid":          vals["mid"]  * mult,
                        "high":         vals["high"] * mult,
                        "note":         vals.get("note", ""),
                        "sub_items":    vals.get("sub_items", []),
                        "rl_adjusted":  True,
                        "rl_multiplier": round(mult, 4),
                    }
                    rl_active = True
                else:
                    items[cat]["rl_adjusted"]  = False
                    items[cat]["rl_multiplier"] = round(mult, 4)
        else:
            for cat in items:
                items[cat]["rl_adjusted"]  = False
                items[cat]["rl_multiplier"] = 1.0
    except Exception:
        pass  # RL not yet initialised — degrade gracefully

    # ─── Totals ───────────────────────────────────────────
    total_low  = sum(v["low"]  for v in items.values())
    total_mid  = sum(v["mid"]  for v in items.values())
    total_high = sum(v["high"] for v in items.values())

    confidence = _calculate_confidence(config)

    return {
        "items": items,
        "total": {
            "low":  round(total_low),
            "mid":  round(total_mid),
            "high": round(total_high),
        },
        "confidence_score": confidence,
        "wedding_type":     wedding_type,
        "total_guests":     total_guests,
        "events":           events,
        "rl_active":        rl_active,
        "rl_samples":       rl_samples,
    }

def _calculate_confidence(config: dict) -> float:
    """Returns 0–1 confidence score based on how much data is filled in."""
    fields = ["wedding_type", "events", "venue_type", "total_guests",
              "food_budget_tier", "hotel_tier", "outstation_guests"]
    filled = sum(1 for f in fields if config.get(f))
    if config.get("decor_total", 0) > 0: filled += 1
    if config.get("artists_total", 0) > 0: filled += 1
    return round(filled / (len(fields) + 2), 2)


def run_pso_optimizer(current_config: dict, target_budget: float) -> dict:
    """
    PSO optimizer that finds optimal per-category budget allocation.
    Each dimension = one budget category's multiplier (0.3 to 1.5).
    """
    import numpy as np

    # Get per-category mid values from the base calculation
    base_result = calculate_full_budget(current_config)
    base_items  = base_result["items"]
    base_total  = base_result["total"]["mid"]

    categories = {k: v["mid"] for k, v in base_items.items() if v.get("mid", 0) > 0}

    if not categories:
        return {"error": "No budget categories to optimise"}

    n_dims    = len(categories)
    cat_names = list(categories.keys())
    cat_values = [categories[k] for k in cat_names]

    # PSO hyperparameters
    n_particles = 30
    n_iterations = 50
    w_max, w_min = 0.9, 0.4
    c1, c2 = 2.0, 2.0

    # Each category multiplier between 0.3 and 1.5
    lb = np.array([0.3] * n_dims)
    ub = np.array([1.5] * n_dims)

    pos = lb + np.random.rand(n_particles, n_dims) * (ub - lb)
    vel = np.zeros((n_particles, n_dims))
    pbest_pos  = pos.copy()
    pbest_cost = np.full(n_particles, float('inf'))
    gbest_pos  = pos[0].copy()
    gbest_cost = float('inf')

    initial_cost = None

    def fitness(multipliers):
        allocated = sum(m * v for m, v in zip(multipliers, cat_values))
        cost = abs(allocated - target_budget)
        if allocated > target_budget:
            cost += (allocated - target_budget) * 0.5
        return cost

    for iteration in range(n_iterations):
        w = w_max - (w_max - w_min) * iteration / n_iterations

        for i in range(n_particles):
            cost = fitness(pos[i])

            if initial_cost is None:
                initial_cost = cost if cost > 0 else 1.0

            if cost < pbest_cost[i]:
                pbest_cost[i] = cost
                pbest_pos[i]  = pos[i].copy()

            if cost < gbest_cost:
                gbest_cost = cost
                gbest_pos  = pos[i].copy()

        r1 = np.random.rand(n_particles, n_dims)
        r2 = np.random.rand(n_particles, n_dims)
        vel = (w * vel
               + c1 * r1 * (pbest_pos - pos)
               + c2 * r2 * (gbest_pos - pos))
        pos = np.clip(pos + vel, lb, ub)

    # Convergence: how much the cost improved from initial to best (0–100%)
    if initial_cost and initial_cost > 0:
        convergence = max(0.0, min(100.0, (1 - gbest_cost / initial_cost) * 100))
    else:
        convergence = 78.0

    optimised_total = sum(m * v for m, v in zip(gbest_pos, cat_values))
    savings = max(0, base_total - optimised_total)

    category_results = {}
    recommendations  = []

    for i, name in enumerate(cat_names):
        multiplier  = round(float(gbest_pos[i]), 2)
        original    = round(cat_values[i])
        optimised   = round(cat_values[i] * multiplier)
        delta       = optimised - original

        category_results[name] = {
            "original":   original,
            "current":    original,
            "optimized":  optimised,
            "optimised":  optimised,
            "delta":      delta,
            "change":     delta,
            "multiplier": multiplier,
        }

        pct_change = (multiplier - 1.0) * 100
        if pct_change < -15:
            recommendations.append(
                f"Reduce {name} by {abs(pct_change):.0f}% — saves ₹{abs(delta)/100000:.1f}L"
            )
        elif pct_change > 15:
            recommendations.append(
                f"You can upgrade {name} by {pct_change:.0f}% within budget"
            )
        else:
            recommendations.append(f"{name} is well-optimised at current level")

    return {
        "base_budget":      round(base_total),
        "optimised_budget": round(optimised_total),
        "optimized_budget": round(optimised_total),
        "target_budget":    round(target_budget),
        "savings":          round(savings),
        "convergence":      round(convergence, 1),
        "particles":        n_particles,
        "iterations":       n_iterations,
        "category_results": category_results,
        "recommendations":  recommendations,
    }
