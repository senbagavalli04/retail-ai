from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.services.generator import ContentGenerator
from app.services.intelligence import IntelligenceService
from app.database import get_session
from sqlmodel import Session, select
from app.models import Product, SalesData
from typing import Optional

router = APIRouter()

@router.post("/generate")
async def generate_content(
    product_name: str = Form(...),
    description: str = Form(...),
    product_sku: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    generator = ContentGenerator()
    intelligence = IntelligenceService()
    
    sales_context = None
    if product_sku:
        # Check for sales history
        product = session.exec(select(Product).where(Product.sku == product_sku)).first()
        if product:
            sales = session.exec(select(SalesData).where(SalesData.product_id == product.id)).all()
            if sales:
                anomalies = intelligence.detect_sales_anomalies(sales)
                sales_context = intelligence.get_sales_context_summary(anomalies)

    image_bytes = None
    if image:
        image_bytes = await image.read()
    
    result = await generator.generate_listing_content(product_name, description, image_bytes, sales_context=sales_context)
    result["history_factored"] = sales_context is not None
    return result
