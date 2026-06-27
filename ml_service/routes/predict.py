"""
POST /predict/organic
Predicts organic probability (0.0 – 1.0) for a crop batch.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

from ..utils.preprocess  import build_feature_vector
from ..utils.model_loader import predict_organic

logger = logging.getLogger(__name__)
router = APIRouter()


class OrganicRequest(BaseModel):
    fertilizerType : Optional[str] = Field(None, example="Organic")
    soilQuality    : Optional[str] = Field(None, example="Good")
    season         : Optional[str] = Field(None, example="Rabi")
    irrigationType : Optional[str] = Field(None, example="Drip")
    cropName       : Optional[str] = Field(None, example="Wheat")
    areaHectares   : Optional[float] = Field(None, example=3.5)
    fertilizerQty  : Optional[float] = Field(None, example=120.0)

    class Config:
        schema_extra = {
            "example": {
                "fertilizerType": "Organic",
                "soilQuality"   : "Good",
                "season"        : "Rabi",
                "irrigationType": "Canal",
                "cropName"      : "Wheat",
                "areaHectares"  : 3.5,
                "fertilizerQty" : 120.0,
            }
        }


class OrganicResponse(BaseModel):
    organic_probability : float = Field(..., description="0.0 – 1.0 probability the batch is organic")
    organic_percent     : int   = Field(..., description="Rounded percentage 0–100")
    label               : str   = Field(..., description="High Organic | Moderate | Low Organic")
    model_used          : str


def _label(prob: float) -> str:
    pct = prob * 100
    if pct >= 70: return "High Organic"
    if pct >= 40: return "Moderate"
    return "Low Organic"


def _build_organic_response(req: OrganicRequest) -> OrganicResponse:
    X    = build_feature_vector(req.dict())
    prob = predict_organic(X)
    return OrganicResponse(
        organic_probability = prob,
        organic_percent     = round(prob * 100),
        label               = _label(prob),
        model_used          = "random_forest" if _is_model_loaded() else "rule_based",
    )


@router.post("/organic", response_model=OrganicResponse)
def predict_organic_endpoint(req: OrganicRequest):
    try:
        return _build_organic_response(req)
    except Exception as e:
        logger.error("Prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/organic", response_model=OrganicResponse)
def predict_organic_query(
    fertilizerType : Optional[str] = None,
    soilQuality    : Optional[str] = None,
    season         : Optional[str] = None,
    irrigationType : Optional[str] = None,
    cropName       : Optional[str] = None,
    areaHectares   : Optional[float] = None,
    fertilizerQty  : Optional[float] = None,
):
    try:
        req = OrganicRequest(
            fertilizerType = fertilizerType,
            soilQuality    = soilQuality,
            season         = season,
            irrigationType = irrigationType,
            cropName       = cropName,
            areaHectares   = areaHectares,
            fertilizerQty  = fertilizerQty,
        )
        return _build_organic_response(req)
    except Exception as e:
        logger.error("Prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


def _is_model_loaded() -> bool:
    from ..utils.model_loader import _ORGANIC_MODEL
    return _ORGANIC_MODEL is not None
