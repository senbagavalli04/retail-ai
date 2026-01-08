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
