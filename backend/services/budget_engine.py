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
        "wedding_type": wedding_type,
        "total_guests": total_guests,
        "events": events,
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
    Particle Swarm Optimizer — finds optimal tier selections to hit target budget.
    Uses simplified PSO over discrete cost levers.
    """
    import random

    levers = {
        "venue_tier":    [0.5, 0.75, 1.0, 1.5, 2.0],
        "food_tier":     [0.4, 0.7, 1.0, 1.5, 2.5],
        "hotel_tier":    [0.3, 0.6, 1.0, 1.4, 2.0],
        "decor_tier":    [0.4, 0.7, 1.0, 1.4, 1.9],
        "artist_tier":   [0.3, 0.6, 1.0, 1.5, 3.0],
        "logistics_tier":[0.5, 0.8, 1.0, 1.2, 1.5],
    }

    base_budget = calculate_full_budget(current_config)["total"]["mid"]
    
    # Particles
    n_particles = 30
    n_iter = 50
    w, c1, c2 = 0.5, 1.5, 1.5

    particles = [[random.uniform(0.3, 2.5) for _ in levers] for _ in range(n_particles)]
    velocities = [[random.uniform(-0.2, 0.2) for _ in levers] for _ in range(n_particles)]
    pbest = [p[:] for p in particles]
    pbest_cost = [abs(_eval_cost(p, base_budget) - target_budget) for p in particles]
    
    gbest = min(zip(pbest_cost, pbest), key=lambda x: x[0])[1]
    gbest_cost = min(pbest_cost)

    for _ in range(n_iter):
        for i, (p, v) in enumerate(zip(particles, velocities)):
            new_v, new_p = [], []
            for j, (pj, vj) in enumerate(zip(p, v)):
                r1, r2 = random.random(), random.random()
                vj_new = (w * vj +
                          c1 * r1 * (pbest[i][j] - pj) +
                          c2 * r2 * (gbest[j] - pj))
                pj_new = max(0.3, min(3.0, pj + vj_new))
                new_v.append(vj_new)
                new_p.append(pj_new)
            
            particles[i] = new_p
            velocities[i] = new_v
            cost = abs(_eval_cost(new_p, base_budget) - target_budget)
            
            if cost < pbest_cost[i]:
                pbest[i] = new_p[:]
                pbest_cost[i] = cost
            if cost < gbest_cost:
                gbest = new_p[:]
                gbest_cost = cost

    lever_names = list(levers.keys())
    optimized = {lever_names[j]: round(gbest[j], 2) for j in range(len(levers))}
    optimized_budget = _eval_cost(gbest, base_budget)

    label_map = {
        "venue_tier":    ("Venue",           "Consider Banquet Hall or Lawn instead of Palace",          "Upgrade to Heritage / Resort venue"),
        "food_tier":     ("Food & Beverages","Switch to Extravaganza tier (250-500/plate)",              "Upgrade to Modern fine-dining (1500-5000/plate)"),
        "hotel_tier":    ("Accommodation",   "Move to 4-star hotels or Farmhouse stay",                 "Upgrade to 5-star Palace rooms"),
        "decor_tier":    ("Decor",           "Choose Low/Medium complexity items in Decor tab",         "Select High complexity luxury designs"),
        "artist_tier":   ("Artists",         "Use Local DJ + Folk Artist; skip Bollywood headliners",   "Add premium Bollywood singers or Live Band"),
        "logistics_tier":("Logistics",       "Reduce SFX; use fewer Dholis",                           "Add laser show, more SFX, premium fleet"),
    }
    recommendations = []
    for k, v in optimized.items():
        name, reduce_tip, increase_tip = label_map[k]
        if v < 0.82:
            pct = round((1 - v) * 100)
            recommendations.append(f"Reduce {name} by ~{pct}% — {reduce_tip}")
        elif v > 1.18:
            pct = round((v - 1) * 100)
            recommendations.append(f"Upgrade {name} by ~{pct}% — {increase_tip}")
        else:
            recommendations.append(f"Keep {name} at current level — well optimised")

    return {
        "optimized_budget": round(optimized_budget),
        "target_budget": round(target_budget),
        "savings": round(base_budget - optimized_budget),
        "multipliers": optimized,
        "recommendations": recommendations,
        "convergence": round(1 - (gbest_cost / base_budget), 3),
    }


def _eval_cost(multipliers: list, base_budget: float) -> float:
    # Weighted: venue(25%), food(20%), hotel(15%), decor(15%), artist(15%), logistics(10%)
    weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10]
    if len(multipliers) != len(weights):
        weights = [1/len(multipliers)] * len(multipliers)
    weighted = sum(m * w for m, w in zip(multipliers, weights))
    return base_budget * weighted
