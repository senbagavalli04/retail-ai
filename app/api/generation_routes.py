from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.services.generator import ContentGenerator
from typing import Optional

router = APIRouter()

@router.post("/generate")
async def generate_content(
    product_name: str = Form(...),
    description: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    generator = ContentGenerator()
    image_bytes = None
    if image:
        image_bytes = await image.read()
    
    result = await generator.generate_listing_content(product_name, description, image_bytes)
    return result
