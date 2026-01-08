from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.services.validator import ListingValidator
from app.services.intelligence import IntelligenceService
from app.database import get_session
from sqlmodel import Session, select
from app.models import SalesData, Listing

router = APIRouter()

@router.post("/validate/listing")
async def validate_listing(
    title: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...)
):
    validator = ListingValidator()
    image_bytes = await image.read()
    
    img_result = validator.validate_image(image_bytes)
    seo_result = validator.validate_seo_content(title, description)
    
    combined_score = (img_result['score'] + seo_result['score']) / 2
    
    return {
        "overall_score": combined_score,
        "image_analysis": img_result,
        "seo_analysis": seo_result
    }

@router.get("/intelligence/anomalies/{product_id}")
async def get_anomalies(product_id: int, session: Session = Depends(get_session)):
    intelligence = IntelligenceService()
    
    # Fetch sales data
    statement = select(SalesData).where(SalesData.product_id == product_id).order_by(SalesData.date)
    sales = session.exec(statement).all()
    
    anomalies = intelligence.detect_sales_anomalies(sales)
    
    # Fetch listing for checking score (mocking listing check if not found)
    listing = session.get(Listing, product_id)
    listing_score = listing.health_score if listing else 70
    
    recs = []
    if "anomalies" in anomalies:
        recs = intelligence.generate_recommendations(anomalies["anomalies"], listing_score)
        
    return {
        "anomalies_data": anomalies,
        "recommendations": recs
    }
