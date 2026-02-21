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
async def get_anomalies(product_id: str, session: Session = Depends(get_session)):
    intelligence = IntelligenceService()
    
    # Try to find by ID first, then by SKU
    target_id = None
    from app.models import Product
    
    # 1. Try treating it as an internal integer ID
    try:
        int_id = int(product_id)
        statement = select(Product).where(Product.id == int_id)
        product = session.exec(statement).first()
        if product:
            target_id = product.id
    except ValueError:
        pass
        
    # 2. If not found by ID or alphanumeric, try searching by SKU (StockCode)
    if not target_id:
        statement = select(Product).where(Product.sku == product_id)
        product = session.exec(statement).first()
        if product:
            target_id = product.id
            
    if not target_id:
        return {"anomalies_data": {"status": "product_not_found"}, "recommendations": []}

    # Fetch sales data for the internal ID
    statement = select(SalesData).where(SalesData.product_id == target_id).order_by(SalesData.date)
    sales = session.exec(statement).all()
    
    anomalies = intelligence.detect_sales_anomalies(sales)
    
    # Generate recommendations based on anomalies
    recs = []
    if "anomalies" in anomalies:
        recs = intelligence.generate_recommendations(anomalies["anomalies"])
        
    return {
        "anomalies_data": anomalies,
        "recommendations": recs
    }
