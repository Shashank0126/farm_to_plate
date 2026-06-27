"""
POST /predict/fraud
Returns a fraud risk score (0.0 – 1.0) for a crop batch.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

from ..utils.preprocess   import build_feature_vector
from ..utils.model_loader import predict_fraud

logger = logging.getLogger(__name__)
router = APIRouter()


class FraudRequest(BaseModel):
    fertilizerType  : Optional[str]   = None
    soilQuality     : Optional[str]   = None
    season          : Optional[str]   = None
    irrigationType  : Optional[str]   = None
    cropName        : Optional[str]   = None
    areaHectares    : Optional[float] = None
    fertilizerQty   : Optional[float] = None
    # Extra signals
    claimedOrganic  : Optional[bool]  = Field(None, description="Did farmer claim organic?")
    proofCount      : Optional[int]   = Field(None, description="Number of proof docs uploaded")


class FraudResponse(BaseModel):
    fraud_risk   : float = Field(..., description="0.0 (clean) – 1.0 (high risk)")
    risk_level   : str   = Field(..., description="Low | Medium | High")
    flag         : bool  = Field(..., description="True if risk >= 0.6")
    model_used   : str


def _risk_level(score: float) -> str:
    if score >= 0.6: return "High"
    if score >= 0.3: return "Medium"
    return "Low"


def _build_fraud_response(req: FraudRequest) -> FraudResponse:
    X    = build_feature_vector(req.dict())
    risk = predict_fraud(X)

    if req.proofCount is not None and req.proofCount == 0:
        risk = min(risk + 0.2, 1.0)

    if req.claimedOrganic and (req.fertilizerType or "").lower() == "inorganic":
        risk = min(risk + 0.3, 1.0)

    return FraudResponse(
        fraud_risk  = round(risk, 4),
        risk_level  = _risk_level(risk),
        flag        = risk >= 0.6,
        model_used  = "random_forest" if _is_model_loaded() else "rule_based",
    )


@router.post("/fraud", response_model=FraudResponse)
def fraud_risk_endpoint(req: FraudRequest):
    try:
        return _build_fraud_response(req)
    except Exception as e:
        logger.error("Fraud prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fraud", response_model=FraudResponse)
def fraud_risk_query(
    fertilizerType  : Optional[str] = None,
    soilQuality     : Optional[str] = None,
    season          : Optional[str] = None,
    irrigationType  : Optional[str] = None,
    cropName        : Optional[str] = None,
    areaHectares    : Optional[float] = None,
    fertilizerQty   : Optional[float] = None,
    claimedOrganic  : Optional[bool]  = None,
    proofCount      : Optional[int]   = None,
):
    try:
        req = FraudRequest(
            fertilizerType = fertilizerType,
            soilQuality    = soilQuality,
            season         = season,
            irrigationType = irrigationType,
            cropName       = cropName,
            areaHectares   = areaHectares,
            fertilizerQty  = fertilizerQty,
            claimedOrganic = claimedOrganic,
            proofCount     = proofCount,
        )
        return _build_fraud_response(req)
    except Exception as e:
        logger.error("Fraud prediction error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


def _is_model_loaded() -> bool:
    from ..utils.model_loader import _FRAUD_MODEL
    return _FRAUD_MODEL is not None
