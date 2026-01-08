from fastapi.testclient import TestClient
from main import app
from app.models import Product
from app.database import get_session, init_db
import io

# Initialize DB explicitly for tests
init_db()

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    print("ROOT: OK")

def test_ingestion():
    # Test manual product creation
    response = client.post("/api/v1/products/", json={
        "name": "Test Product",
        "description": "A test product",
        "price": 100.0,
        "category": "Test"
    })
    assert response.status_code == 200
    print("INGESTION (Manual): OK")

def test_generation():
    # Test content generation (mocked if no key)
    response = client.post("/api/v1/generate", data={
        "product_name": "Test Wireless Headphones",
        "description": "High quality sound, long battery life"
    })
    assert response.status_code == 200
    assert "title" in response.json()
    print("GENERATION: OK")

def test_validation():
    # Create a dummy image
    img_byte_arr = io.BytesIO()
    from PIL import Image
    image = Image.new('RGB', (1000, 1000), color = 'red')
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    response = client.post("/api/v1/validate/listing", 
        data={"title": "Short Title", "description": "Short desc"},
        files={"image": ("test.jpg", img_byte_arr, "image/jpeg")}
    )
    assert response.status_code == 200
    assert "overall_score" in response.json()
    print("VALIDATION: OK")

def test_analysis():
    # Test anomaly detection
    response = client.get("/api/v1/intelligence/anomalies/1")
    assert response.status_code == 200
    print("ANALYSIS: OK")

if __name__ == "__main__":
    print("Starting System Verification...")
    try:
        test_root()
        test_ingestion()
        test_generation()
        test_validation()
        test_analysis()
        print("\nALL SYSTEMS FUNCTIONAL")
    except Exception as e:
        print(f"\nVERIFICATION FAILED: {e}")
