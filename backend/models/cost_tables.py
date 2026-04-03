from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

# ─── Enums ───────────────────────────────────────────────
class WeddingType(str, Enum):
    hindu = "Hindu"
    islam = "Islam"
    sikh = "Sikh"
    christian = "Christian"
    buddhist = "Buddhist"
    jain = "Jain"
    generic = "Generic"

class BudgetTier(str, Enum):
    luxury = "Luxury"
    modest = "Modest"
    minimalist = "Minimalist"

class HotelTier(str, Enum):
    palace_5star = "5-star Palace"
    city_5star = "5-star City"
    four_star = "4-star"
    resort = "Resort"
    farmhouse = "Farmhouse"

class FoodBudget(str, Enum):
    extravaganza = "Extravaganza"
    high = "High"
    modern = "Modern"

# ─── Request Models ───────────────────────────────────────
class WeddingConfigRequest(BaseModel):
    wedding_date: str
    is_weekend: bool
    wedding_type: str
    budget_tier: str
    events: List[str]
    venue_type: str
    wedding_city: str
    seating_capacity: int
    total_guests: int
    outstation_guests: int
    hotel_tier: str
    bride_hometown: str
    groom_hometown: str

class FoodRequest(BaseModel):
    categories: List[str]
    food_budget_tier: str
    bar_type: str
    specialty_counters: List[str]
    guest_count: int
    events: List[str]

class ArtistRequest(BaseModel):
    artist_types: List[str]
    named_artists: List[str]
    generic_tiers: dict

class LogisticsRequest(BaseModel):
    outstation_guests: int
    venue_city: str
    airport_to_venue_km: float
    ghodi: bool
    dholi_count: int
    dholi_hours: int
    sfx_items: List[str]

class BudgetOptimizeRequest(BaseModel):
    current_total: float
    target_budget: float
    wedding_config: dict
    constraints: dict

# ─── Cost Tables (Admin configurable) ─────────────────────

WEDDING_TYPE_BASE_COSTS = {
    "Hindu":     {"low": 800000,  "mid": 2500000, "high": 8000000},
    "Islam":     {"low": 600000,  "mid": 1800000, "high": 5000000},
    "Sikh":      {"low": 700000,  "mid": 2000000, "high": 6000000},
    "Christian": {"low": 500000,  "mid": 1500000, "high": 4000000},
    "Buddhist":  {"low": 400000,  "mid": 1200000, "high": 3500000},
    "Jain":      {"low": 600000,  "mid": 1800000, "high": 5000000},
    "Generic":   {"low": 400000,  "mid": 1500000, "high": 4500000},
}

EVENT_COSTS = {
    "Engagement":              {"low": 50000,  "mid": 150000,  "high": 500000},
    "Haldi":                   {"low": 20000,  "mid": 60000,   "high": 200000},
    "Mehendi":                 {"low": 30000,  "mid": 100000,  "high": 350000},
    "Sangeet":                 {"low": 100000, "mid": 350000,  "high": 1200000},
    "Pre Wedding Cocktail":    {"low": 80000,  "mid": 250000,  "high": 900000},
    "Wedding Day Ceremony":    {"low": 200000, "mid": 600000,  "high": 2000000},
    "Reception":               {"low": 150000, "mid": 500000,  "high": 1800000},
}

VENUE_COSTS_PER_DAY = {
    "Banquet Hall":            {"low": 50000,  "mid": 150000,  "high": 500000},
    "Wedding Lawn":            {"low": 40000,  "mid": 120000,  "high": 400000},
    "Hotel 3-5 Star":          {"low": 100000, "mid": 350000,  "high": 1200000},
    "Resort":                  {"low": 150000, "mid": 500000,  "high": 2000000},
    "Heritage Palace":         {"low": 300000, "mid": 1000000, "high": 5000000},
    "Beach Venue":             {"low": 200000, "mid": 600000,  "high": 2500000},
    "Farmhouse":               {"low": 50000,  "mid": 150000,  "high": 500000},
    "Temple":                  {"low": 10000,  "mid": 40000,   "high": 150000},
    "Home Intimate":           {"low": 10000,  "mid": 30000,   "high": 100000},
}

HOTEL_ACCOMMODATION = {
    "5-star Palace":   {"per_room_low": 25000, "per_room_high": 80000, "people_per_room": 2},
    "5-star City":     {"per_room_low": 10000, "per_room_high": 30000, "people_per_room": 2},
    "4-star":          {"per_room_low": 5000,  "per_room_high": 12000, "people_per_room": 2},
    "Resort":          {"per_room_low": 8000,  "per_room_high": 25000, "people_per_room": 3},
    "Farmhouse":       {"per_room_low": 3000,  "per_room_high": 10000, "people_per_room": 4},
}

FOOD_COSTS_PER_HEAD = {
    "Extravaganza": {"low": 250,  "high": 500},
    "High":         {"low": 700,  "high": 1500},
    "Modern":       {"low": 1500, "high": 5000},
}

BAR_COSTS_PER_HEAD = {
    "Dry Event":   0,
    "Beer-Wine":   300,
    "Full Bar":    800,
}

SPECIALTY_COUNTER_COSTS = {
    "Chaat":            15000,
    "Mocktail":         20000,
    "Ice Cream":        25000,
    "Tea-Coffee (24hr)":30000,
}

ARTIST_COSTS = {
    "Local DJ":              {"low": 50000,   "high": 150000},
    "Professional DJ":       {"low": 200000,  "high": 500000},
    "Bollywood Singer A":    {"low": 800000,  "high": 1200000},
    "Bollywood Singer B":    {"low": 500000,  "high": 900000},
    "Live Band (Local)":     {"low": 100000,  "high": 300000},
    "Live Band (National)":  {"low": 500000,  "high": 1500000},
    "Folk Artist":           {"low": 30000,   "high": 100000},
    "Myra Entertainment":    {"low": 200000,  "high": 600000},
    "Choreographer":         {"low": 50000,   "high": 200000},
    "Anchor / Emcee":        {"low": 30000,   "high": 150000},
}

LOGISTICS_COSTS = {
    "innova_per_trip": 3500,
    "guests_per_vehicle": 3,
    "ghodi_by_city": {
        "Mumbai": 25000, "Delhi": 20000, "Chennai": 15000,
        "Hyderabad": 15000, "Bangalore": 18000, "Kolkata": 12000,
        "default": 12000,
    },
    "dholi_per_hour": 5000,
    "sfx_costs": {
        "Cold Pyro": 15000,
        "Confetti Cannon": 8000,
        "Smoke Machine": 5000,
        "Laser Show": 25000,
    },
}

SUNDRIES_COSTS = {
    "room_basket_luxury":     2500,
    "room_basket_standard":   800,
    "room_basket_minimal":    300,
    "ritual_haldi_per_ceremony": 8000,
    "ritual_mehendi_per_ceremony": 15000,
    "ritual_pheras_per_ceremony": 20000,
    "gift_hamper_luxury":     3000,
    "gift_hamper_standard":   1000,
    "gift_hamper_minimal":    500,
    "stationery_per_invite":  150,
    "menu_card_per_person":   50,
    "contingency_pct":        0.08,
}

CATERING_STAFF_COST = {
    "small":   {"max_guests": 100,  "cost": 30000},
    "medium":  {"max_guests": 300,  "cost": 80000},
    "large":   {"max_guests": 600,  "cost": 150000},
    "xlarge":  {"max_guests": 9999, "cost": 250000},
}

WEEKEND_SURCHARGE = 0.15
