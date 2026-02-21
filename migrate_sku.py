from sqlmodel import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Checking for 'sku' column in 'product' table...")
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(product)"))
            columns = [row[1] for row in result]
            if "sku" not in columns:
                print("Adding 'sku' column...")
                conn.execute(text("ALTER TABLE product ADD COLUMN sku TEXT"))
                conn.execute(text("CREATE INDEX ix_product_sku ON product (sku)"))
                conn.commit()
                print("Successfully added 'sku' column and index.")
            else:
                print("'sku' column already exists.")
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
