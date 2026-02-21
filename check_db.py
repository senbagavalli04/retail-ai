from sqlmodel import create_engine, Session, select, func
from app.models import Product, SalesData
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def check_stats():
    with Session(engine) as session:
        # Check total products
        prod_count = session.exec(select(func.count(Product.id))).one()
        print(f"Total Products: {prod_count}")
        
        # Check total sales
        sales_count = session.exec(select(func.count(SalesData.id))).one()
        print(f"Total Sales Records: {sales_count}")
        
        # Check specific SKU 85123A
        product = session.exec(select(Product).where(Product.sku == "85123A")).first()
        if product:
            print(f"Product 85123A found with ID: {product.id}")
            count = session.exec(select(func.count(SalesData.id)).where(SalesData.product_id == product.id)).one()
            print(f"Sales records for 85123A: {count}")
            
            # Show top 5 products by sales count
            print("\nTop 5 products by sales count:")
            results = session.exec(text("SELECT product_id, COUNT(*) as c FROM salesdata GROUP BY product_id ORDER BY c DESC LIMIT 5")).all()
            for r in results:
                print(f"Product ID {r[0]}: {r[1]} sales")
        else:
            print("Product 85123A not found in database.")

if __name__ == "__main__":
    from sqlalchemy import text
    check_stats()
