"""
Feature engineering and preprocessing for organic/fraud prediction.
All encoding mirrors the training pipeline exactly.
"""

import numpy as np
from typing import Dict, Any

# ── Feature columns (order must match training) ───────────────────
FEATURE_COLUMNS = [
    "fertilizer_organic",
    "fertilizer_mixed",
    "fertilizer_inorganic",
    "soil_excellent",
    "soil_good",
    "soil_average",
    "soil_poor",
    "irrigation_drip",
    "irrigation_sprinkler",
    "irrigation_canal",
    "irrigation_rainfed",
    "irrigation_borewell",
    "season_kharif",
    "season_rabi",
    "season_zaid",
    "season_annual",
    "seasonal_match",        # 1 if crop suits season
    "area_hectares_norm",    # normalised 0-1
    "fertilizer_qty_norm",   # normalised 0-1
]

# ── Seasonal crop mapping ─────────────────────────────────────────
SEASONAL_MAP = {
    "kharif": ["rice", "maize", "sorghum", "bajra", "cotton",
               "groundnut", "soybean", "sugarcane", "jute", "arhar"],
    "rabi"  : ["wheat", "barley", "mustard", "peas", "gram",
               "linseed", "potato", "onion"],
    "zaid"  : ["cucumber", "muskmelon", "watermelon", "fodder",
               "moong", "urad"],
    "annual": [],
}

def _one_hot(value: str, choices: list) -> list:
    """Return one-hot vector for value in choices."""
    value = (value or "").lower().strip()
    return [1 if value == c.lower() else 0 for c in choices]

def seasonal_match(crop: str, season: str) -> int:
    crop   = (crop   or "").lower()
    season = (season or "").lower()
    crops  = SEASONAL_MAP.get(season, [])
    return int(any(c in crop for c in crops))

def build_feature_vector(data: Dict[str, Any]) -> np.ndarray:
    """
    Convert raw batch fields → fixed-length numpy feature vector.

    Expected keys (all optional, defaults to empty string / 0):
      fertilizerType, soilQuality, irrigationType,
      season, cropName, areaHectares, fertilizerQty
    """
    fert   = (data.get("fertilizerType") or "").lower()
    soil   = (data.get("soilQuality")    or "").lower()
    irrig  = (data.get("irrigationType") or "").lower()
    season = (data.get("season")         or "").lower()
    crop   = (data.get("cropName")       or "").lower()

    area   = float(data.get("areaHectares",   0) or 0)
    qty    = float(data.get("fertilizerQty",  0) or 0)

    # Normalise continuous features (typical max values)
    area_norm = min(area / 20.0, 1.0)
    qty_norm  = min(qty  / 500.0, 1.0)

    vector = [
        # Fertilizer one-hot
        int(fert == "organic"),
        int(fert == "mixed"),
        int(fert == "inorganic"),
        # Soil one-hot
        int(soil == "excellent"),
        int(soil == "good"),
        int(soil == "average"),
        int(soil == "poor"),
        # Irrigation one-hot
        int(irrig == "drip"),
        int(irrig == "sprinkler"),
        int(irrig == "canal"),
        int(irrig == "rainfed"),
        int(irrig == "borewell"),
        # Season one-hot
        int(season == "kharif"),
        int(season == "rabi"),
        int(season == "zaid"),
        int(season == "annual"),
        # Derived
        seasonal_match(crop, season),
        area_norm,
        qty_norm,
    ]

    assert len(vector) == len(FEATURE_COLUMNS), (
        f"Feature length mismatch: {len(vector)} vs {len(FEATURE_COLUMNS)}"
    )

    return np.array(vector, dtype=np.float32).reshape(1, -1)
