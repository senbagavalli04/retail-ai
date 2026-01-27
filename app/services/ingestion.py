from fastapi import UploadFile
from app.models import Product, Listing, SalesData
from sqlmodel import Session
import pandas as pd
import io
from datetime import datetime

class IngestionService:
    def __init__(self, session: Session):
        self.session = session

    async def ingest_csv(self, file: UploadFile):
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        results = {"success": 0, "errors": 0, "type": "unknown"}
        
        # Determine CSV Type
        columns = [c.lower() for c in df.columns]
        if "units_sold" in columns and "product_id" in columns:
            results["type"] = "sales"
            for _, row in df.iterrows():
                try:
                    sales_entry = SalesData(
                        product_id=int(row.get("product_id")),
                        units_sold=int(row.get("units_sold")),
                        revenue=float(row.get("revenue", 0)),
                        date=pd.to_datetime(row.get("date", datetime.now())).to_pydatetime()
                    )
                    self.session.add(sales_entry)
                    results["success"] += 1
                except Exception as e:
                    results["errors"] += 1
                    print(f"Error ingesting sales row: {e}")
        else:
            results["type"] = "products"
            for _, row in df.iterrows():
                try:
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
                    print(f"Error ingesting product row: {e}")
        
        self.session.commit()
        return results

    async def create_product(self, product_data: Product):
        self.session.add(product_data)
        self.session.commit()
        self.session.refresh(product_data)
        return product_data
