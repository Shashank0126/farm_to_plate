"""
Farm to Plate — ML Microservice
FastAPI + Scikit-learn Random Forest
Endpoints:
  POST /predict/organic  → organic probability score
  POST /predict/fraud    → fraud risk score
  GET  /health           → service status
  GET  /model/info       → model metadata
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging

from .routes.predict import router as predict_router
from .routes.fraud   import router as fraud_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title       = "Farm to Plate — ML Service",
    description = "Organic probability and fraud risk prediction using Random Forest",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins  = [os.getenv("CLIENT_URL", "http://localhost:5000")],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(predict_router, prefix="/predict", tags=["Prediction"])
app.include_router(fraud_router,   prefix="/predict", tags=["Fraud"])

# ── Health check ─────────────────────────────────────────────────
@app.get("/health", tags=["Status"])
def health():
    return {"status": "ok", "service": "Farm to Plate ML"}

# ── Model info ───────────────────────────────────────────────────
@app.get("/model/info", tags=["Status"])
def model_info():
    from .utils.preprocess import FEATURE_COLUMNS
    return {
        "model"      : "Random Forest Classifier",
        "version"    : "1.0.0",
        "features"   : FEATURE_COLUMNS,
        "outputs"    : ["organic_probability", "fraud_risk"],
        "library"    : "scikit-learn",
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host    = "0.0.0.0",
        port    = int(os.getenv("PORT", 8000)),
        reload  = os.getenv("ENV", "development") == "development",
        workers = 1,
    )
