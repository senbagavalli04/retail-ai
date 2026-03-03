from fastapi import UploadFile
from app.models import Product, Listing, SalesData, HeaderMapping
from sqlmodel import Session, select
import pandas as pd
import io
from datetime import datetime

class IngestionService:
    def __init__(self, session: Session):
        self.session = session

    def _map_columns(self, columns):
        """Helper to find matching columns based on common retail keywords with scoring."""
        mapping = {}
        schema = {
            "sku": ["product id", "product_id", "stockcode", "sku", "item_id", "article", "id", "code"],
            "date": ["order date", "order_date", "invoicedate", "transaction date", "date", "time", "timestamp"],
            "qty": ["quantity", "qty", "units_sold", "number items", "units", "count", "sold"],
            "unit_price": ["unitprice", "unit price", "price per item", "rate", "cost per", "sales", "revenue", "price"],
            "total_revenue": ["sales", "revenue", "total price", "total", "amount", "profit", "net sales"],
            "name": ["product name", "product_name", "description", "item_name", "name", "title", "label"]
        }
        
        lowered_cols = [c.lower().replace("_", " ").replace("-", " ").strip() for c in columns]
        
        for key, keywords in schema.items():
            best_match = None
            best_score = -1
            
            for i, col in enumerate(lowered_cols):
                for kw in keywords:
                    score = -1
                    if col == kw:
                        score = 10  # Perfect match
                    elif f" {kw} " in f" {col} ":
                        score = 8   # Word match
                    elif col.startswith(kw) and len(kw) > 4:
                        score = 5   # Significant prefix
                    elif col.endswith(kw) and len(kw) > 4:
                        score = 5   # Significant suffix
                        
                    if score > best_score:
                        best_score = score
                        best_match = columns[i]
            
            if best_match:
                mapping[key] = best_match
        return mapping

    async def ingest_csv(self, file: UploadFile):
        content = await file.read()
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            # Try with different encoding if standard fails
            df = pd.read_csv(io.BytesIO(content), encoding='latin1')

        results = {"success": 0, "errors": 0, "type": "flexible_retail"}
        
        # 1. Try to find an exactly matching custom mapping from DB
        mapping = {}
        custom_mappings = self.session.exec(select(HeaderMapping)).all()
        csv_cols = set(df.columns)
        
        selected_custom = None
        for cm in custom_mappings:
            required = {cm.sku_col, cm.date_col, cm.qty_col, cm.price_col}
            if cm.name_col: required.add(cm.name_col)
            
            if required.issubset(csv_cols):
                selected_custom = cm
                break
        
        if selected_custom:
            mapping = {
                "sku": selected_custom.sku_col,
                "date": selected_custom.date_col,
                "qty": selected_custom.qty_col,
                "unit_price": selected_custom.price_col,
                "name": selected_custom.name_col
            }
            results["type"] = f"custom_{selected_custom.format_name}"
        else:
            # Fallback to heuristic mapping
            mapping = self._map_columns(df.columns)
        
        # Check if we have the bare minimum for intelligence (Date, Qty, and some Identifier)
        if not all(k in mapping for k in ["date", "qty", "sku"]):
            return {"success": 0, "errors": 0, "type": "error", "message": f"Required columns (Date, Qty, SKU) missing. Found: {list(mapping.keys())}"}

        product_cache = {} # Map mapped SKU/StockCode to Database Product ID
        
        for idx, row in df.iterrows():
            try:
                # 1. Clean and Parse SKU
                raw_sku = str(row.get(mapping["sku"], "")).strip()
                if not raw_sku or raw_sku.lower() == "nan":
                    continue

                # 2. Clean and Parse Quantity
                qty_val = str(row.get(mapping["qty"], 0)).replace(",", "")
                raw_qty = int(float(qty_val))
                
                # Ignore returns/negative quantities
                if raw_qty <= 0:
                    continue

                # 3. Clean and Parse Date
                date_val = str(row.get(mapping["date"]))
                try:
                    raw_date = pd.to_datetime(date_val, dayfirst=True).to_pydatetime()
                except:
                    raw_date = pd.to_datetime(date_val).to_pydatetime()
                
                # 4. Clean and Parse Revenue/Price
                rev_val = 0.0
                if "unit_price" in mapping:
                    up = float(str(row.get(mapping["unit_price"], 0)).replace(",", "").replace("$", ""))
                    rev_val = raw_qty * up
                elif "total_revenue" in mapping:
                    rev_val = float(str(row.get(mapping["total_revenue"], 0)).replace(",", "").replace("$", ""))
                
                # 5. Optional Name
                raw_name = str(row.get(mapping.get("name"), "Product " + raw_sku)).strip()

                # 6. Ensure product exists in database
                if raw_sku not in product_cache:
                    existing_prod = self.session.exec(select(Product).where(Product.sku == raw_sku)).first()
                    if not existing_prod:
                        new_prod = Product(
                            name=raw_name, 
                            sku=raw_sku, 
                            description=f"Auto-imported. SKU: {raw_sku}", 
                            price=rev_val / raw_qty if raw_qty > 0 else 0
                        )
                        self.session.add(new_prod)
                        self.session.flush()
                        product_cache[raw_sku] = new_prod.id
                    else:
                        product_cache[raw_sku] = existing_prod.id
                
                # 7. Create Sales Entry
                sales_entry = SalesData(
                    product_id=product_cache[raw_sku],
                    units_sold=raw_qty,
                    revenue=rev_val,
                    date=raw_date
                )
                self.session.add(sales_entry)
                results["success"] += 1

            except Exception as e:
                if results["errors"] < 5: # Log first few errors for debugging
                    print(f"Error at row {idx}: {e}")
                results["errors"] += 1
                continue
        
        self.session.commit()
        return results

    async def create_product(self, product_data: Product):
        self.session.add(product_data)
        self.session.commit()
        self.session.refresh(product_data)
        return product_data
