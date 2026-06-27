"""
Singleton loader for trained sklearn models.
Falls back to a rule-based estimator if .pkl not found.
"""

import os
import pickle
import logging
import numpy as np

logger = logging.getLogger(__name__)

_ORGANIC_MODEL = None
_FRAUD_MODEL   = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def _rule_organic(X: np.ndarray) -> float:
    """
    Rule-based organic probability when model file is absent.
    Mirrors the JS calcOrganicScore logic, normalised to 0-1.
    """
    # indices from FEATURE_COLUMNS
    fert_org  = X[0, 0]   # fertilizer_organic
    fert_mix  = X[0, 1]   # fertilizer_mixed
    soil_exc  = X[0, 3]   # soil_excellent
    soil_good = X[0, 4]   # soil_good
    soil_avg  = X[0, 5]   # soil_average
    soil_poor = X[0, 6]   # soil_poor
    irr_drip  = X[0, 7]   # irrigation_drip
    irr_rain  = X[0, 10]  # irrigation_rainfed
    seasonal  = X[0, 16]  # seasonal_match

    score = 0.0
    score += 40 * fert_org + 20 * fert_mix
    score += 30 * soil_exc + 22 * soil_good + 12 * soil_avg + 4 * soil_poor
    score += 20 * seasonal + (10 * (1 - seasonal))
    score += 10 * (irr_drip + irr_rain)

    return round(min(score / 100.0, 1.0), 4)


def _rule_fraud(X: np.ndarray) -> float:
    """Heuristic fraud risk — inverse of organic plausibility."""
    organic = _rule_organic(X)
    # High organic score but inorganic fertiliser → suspicious
    fert_inorg = X[0, 2]
    risk = 0.0
    if organic > 0.75 and fert_inorg:
        risk += 0.4
    if organic < 0.2:
        risk += 0.3
    return round(min(risk, 1.0), 4)


def load_organic_model():
    global _ORGANIC_MODEL
    if _ORGANIC_MODEL is not None:
        return _ORGANIC_MODEL
    path = os.path.join(MODEL_DIR, "organic_rf_model.pkl")
    if os.path.exists(path):
        with open(path, "rb") as f:
            _ORGANIC_MODEL = pickle.load(f)
        logger.info("Loaded organic RF model from %s", path)
    else:
        logger.warning("organic_rf_model.pkl not found — using rule-based fallback")
        _ORGANIC_MODEL = None
    return _ORGANIC_MODEL


def load_fraud_model():
    global _FRAUD_MODEL
    if _FRAUD_MODEL is not None:
        return _FRAUD_MODEL
    path = os.path.join(MODEL_DIR, "fraud_rf_model.pkl")
    if os.path.exists(path):
        with open(path, "rb") as f:
            _FRAUD_MODEL = pickle.load(f)
        logger.info("Loaded fraud RF model from %s", path)
    else:
        logger.warning("fraud_rf_model.pkl not found — using rule-based fallback")
        _FRAUD_MODEL = None
    return _FRAUD_MODEL


def predict_organic(X: np.ndarray) -> float:
    model = load_organic_model()
    if model is not None:
        prob = model.predict_proba(X)[0]
        # class 1 = organic
        return round(float(prob[1] if len(prob) > 1 else prob[0]), 4)
    return _rule_organic(X)


def predict_fraud(X: np.ndarray) -> float:
    model = load_fraud_model()
    if model is not None:
        prob = model.predict_proba(X)[0]
        return round(float(prob[1] if len(prob) > 1 else prob[0]), 4)
    return _rule_fraud(X)
