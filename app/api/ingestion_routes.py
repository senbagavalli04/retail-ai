from fastapi import APIRouter, UploadFile, File, Depends
from app.database import get_session
from sqlmodel import Session
from app.services.ingestion import IngestionService
from app.models import Product

router = APIRouter()

@router.post("/ingest/csv")
async def ingest_products_csv(file: UploadFile = File(...), session: Session = Depends(get_session)):
    service = IngestionService(session)
    result = await service.ingest_csv(file)
    return result

@router.post("/products/")
async def create_product_manually(product: Product, session: Session = Depends(get_session)):
    service = IngestionService(session)
    created_product = await service.create_product(product)
    return created_product

@router.get("/products/")
async def get_all_products(session: Session = Depends(get_session)):
    from sqlmodel import select
    statement = select(Product)
    results = session.exec(statement).all()
    return results

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        return {"success": False, "message": "Product not found"}
    session.delete(product)
    session.commit()
    return {"success": True, "message": f"Product {product_id} deleted"}

@router.delete("/products/clear/all")
async def clear_all_products(session: Session = Depends(get_session)):
    from sqlmodel import delete
    # Delete all listings first if they exist
    from app.models import Listing, SalesData
    session.exec(delete(Listing))
    session.exec(delete(SalesData))
    session.exec(delete(Product))
    session.commit()
    return {"success": True, "message": "All data cleared successfully"}
