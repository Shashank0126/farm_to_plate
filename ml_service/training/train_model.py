"""
Train Random Forest models for:
  1. Organic probability classification
  2. Fraud risk classification

Run:
  python training/train_model.py

Saves:
  ml_service/models/organic_rf_model.pkl
  ml_service/models/fraud_rf_model.pkl
"""

import os
import sys
import pickle
import logging
import numpy as np
import pandas as pd

from sklearn.ensemble         import RandomForestClassifier
from sklearn.model_selection  import train_test_split, cross_val_score
from sklearn.metrics          import classification_report, roc_auc_score
from sklearn.preprocessing    import LabelEncoder

# Ensure parent directory on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from utils.preprocess import build_feature_vector, FEATURE_COLUMNS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── 1. Synthetic dataset generation ──────────────────────────────
def generate_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generate synthetic training data reflecting domain rules.
    In production replace with real historical batch records.
    """
    rng = np.random.default_rng(42)

    fertilizer_types  = ["Organic", "Mixed", "Inorganic"]
    soil_qualities    = ["Excellent", "Good", "Average", "Poor"]
    irrigation_types  = ["Drip", "Sprinkler", "Canal", "Rainfed", "Borewell"]
    seasons           = ["Kharif", "Rabi", "Zaid", "Annual"]
    crops             = [
        "Wheat", "Rice", "Cotton", "Maize", "Sugarcane",
        "Groundnut", "Mustard", "Gram", "Potato", "Soybean"
    ]

    rows = []
    for _ in range(n_samples):
        fert    = rng.choice(fertilizer_types)
        soil    = rng.choice(soil_qualities)
        irrig   = rng.choice(irrigation_types)
        season  = rng.choice(seasons)
        crop    = rng.choice(crops)
        area    = float(rng.uniform(0.5, 15))
        qty     = float(rng.uniform(10, 400))

        # Rule-based organic label with noise
        base = 0
        if fert == "Organic":   base += 40
        elif fert == "Mixed":   base += 20

        soil_map = {"Excellent": 30, "Good": 22, "Average": 12, "Poor": 4}
        base += soil_map[soil]

        irrig_map = {"Drip": 10, "Rainfed": 10, "Sprinkler": 8, "Canal": 5, "Borewell": 3}
        base += irrig_map.get(irrig, 2)
        base += rng.integers(8, 20)     # seasonal noise

        noise   = rng.normal(0, 5)
        score   = np.clip(base + noise, 0, 100)
        is_org  = int(score >= 60)

        # Fraud: inorganic but claiming high organic = suspicious
        fraud = 0
        if fert == "Inorganic" and score > 70:
            fraud = 1
        elif qty > 350 and fert == "Organic":
            fraud = int(rng.random() < 0.3)
        elif rng.random() < 0.05:
            fraud = 1

        rows.append({
            "fertilizerType": fert,
            "soilQuality"   : soil,
            "irrigationType": irrig,
            "season"        : season,
            "cropName"      : crop,
            "areaHectares"  : area,
            "fertilizerQty" : qty,
            "is_organic"    : is_org,
            "is_fraud"      : fraud,
        })

    return pd.DataFrame(rows)


def featurise(df: pd.DataFrame) -> np.ndarray:
    """Convert dataframe rows → feature matrix using preprocess pipeline."""
    X = np.vstack([
        build_feature_vector(row.to_dict())
        for _, row in df.iterrows()
    ])
    return X


# ── 2. Train ─────────────────────────────────────────────────────
def train():
    logger.info("Generating synthetic dataset …")
    df = generate_dataset(n_samples=3000)
    logger.info("Dataset shape: %s", df.shape)
    logger.info("Organic label distribution:\n%s", df["is_organic"].value_counts())
    logger.info("Fraud label distribution:\n%s",   df["is_fraud"].value_counts())

    X = featurise(df)

    # ── Organic model ─────────────────────────────────────────────
    y_org = df["is_organic"].values
    X_tr, X_te, y_tr, y_te = train_test_split(X, y_org, test_size=0.2, random_state=42, stratify=y_org)

    logger.info("\nTraining Organic Random Forest …")
    rf_org = RandomForestClassifier(
        n_estimators = 200,
        max_depth    = 12,
        min_samples_leaf = 5,
        class_weight = "balanced",
        random_state = 42,
        n_jobs       = -1,
    )
    rf_org.fit(X_tr, y_tr)
    y_pred_org = rf_org.predict(X_te)
    logger.info("Organic model — Classification Report:\n%s",
                classification_report(y_te, y_pred_org, target_names=["Non-Organic", "Organic"]))

    cv_scores = cross_val_score(rf_org, X, y_org, cv=5, scoring="roc_auc")
    logger.info("Organic CV ROC-AUC: %.3f ± %.3f", cv_scores.mean(), cv_scores.std())

    # Feature importance
    imp = sorted(zip(FEATURE_COLUMNS, rf_org.feature_importances_), key=lambda x: -x[1])
    logger.info("Top feature importances:")
    for feat, score in imp[:8]:
        logger.info("  %-30s %.4f", feat, score)

    # ── Fraud model ───────────────────────────────────────────────
    y_fraud = df["is_fraud"].values
    Xf_tr, Xf_te, yf_tr, yf_te = train_test_split(X, y_fraud, test_size=0.2, random_state=42)

    logger.info("\nTraining Fraud Risk Random Forest …")
    rf_fraud = RandomForestClassifier(
        n_estimators = 150,
        max_depth    = 8,
        min_samples_leaf = 10,
        class_weight = "balanced",
        random_state = 42,
        n_jobs       = -1,
    )
    rf_fraud.fit(Xf_tr, yf_tr)
    yf_pred = rf_fraud.predict(Xf_te)
    logger.info("Fraud model — Classification Report:\n%s",
                classification_report(yf_te, yf_pred, target_names=["Clean", "Fraud"]))

    # ── Save models ───────────────────────────────────────────────
    org_path   = os.path.join(MODEL_DIR, "organic_rf_model.pkl")
    fraud_path = os.path.join(MODEL_DIR, "fraud_rf_model.pkl")

    with open(org_path,   "wb") as f: pickle.dump(rf_org,   f)
    with open(fraud_path, "wb") as f: pickle.dump(rf_fraud, f)

    logger.info("\n✅ Models saved:")
    logger.info("   %s", org_path)
    logger.info("   %s", fraud_path)


if __name__ == "__main__":
    train()