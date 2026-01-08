from fastapi import UploadFile
from app.models import Product, Listing
from sqlmodel import Session
import pandas as pd
import io

class IngestionService:
    def __init__(self, session: Session):
        self.session = session

    async def ingest_csv(self, file: UploadFile):
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        results = {"success": 0, "errors": 0}
        
        for _, row in df.iterrows():
            try:
                # Basic mapping, assuming standard columns
                product = Product(
                    name=row.get("name"),
                    description=row.get("description"),
                    price=float(row.get("price", 0)),
                    category=row.get("category")
                )
                self.session.add(product)
                results["success"] += 1
            except Exception as e:
                results["errors"] += 1
                print(f"Error ingesting row: {e}")
        
        self.session.commit()
        return results

    async def create_product(self, product_data: Product):
        self.session.add(product_data)
        self.session.commit()
        self.session.refresh(product_data)
        return product_data
