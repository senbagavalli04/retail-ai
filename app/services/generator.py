import google.generativeai as genai
from app.core.config import settings
from PIL import Image
import io

class ContentGenerator:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("WARNING: Gemini API Key not found. Content generation will be mocked.")

    async def generate_listing_content(self, product_name: str, basic_description: str, image_bytes: bytes = None):
        """
        Generates SEO optimized title, description, and bullets.
        """
        prompt = f"""
        You are an expert e-commerce copywriter and SEO specialist.
        Create a high-converting product listing for the following product:
        
        Product Name: {product_name}
        Basic Description: {basic_description}
        
        Please generate:
        1. An SEO-optimized Product Title (max 150 chars).
        2. A persuasive, keyword-rich Product Description (2 paragraphs).
        3. 5 Feature Bullet Points.
        4. A list of 10 SEO keywords.
        5. A "Product Health Score" (0-100). 
           CRITICAL: If the input consists of only a few words (like "brush" and "it is good"), the score MUST be low (e.g., below 40) because the input data is insufficient for a high-quality listing.
        
        Format the output as valid JSON.
        """
        
        inputs = [prompt]
        if image_bytes and self.model:
            try:
                image = Image.open(io.BytesIO(image_bytes))
                inputs.append(image)
                inputs.append("Analyze this product image to enhance the description and keywords.")
            except Exception as e:
                print(f"Error processing image for generation: {e}")

        if not self.model:
            # Improved Mock response logic
            input_length = len(product_name) + len(basic_description)
            # Realistic score calculation
            score = 30
            if input_length > 50: score += 20
            if input_length > 150: score += 20
            if image_bytes: score += 30
            
            # Penalize very short inputs
            if len(product_name.split()) < 2 or len(basic_description.split()) < 3:
                score = min(score, 35)

            return {
                "title": f"Professional {product_name.capitalize()} - Premium Quality & Durable Design",
                "description": f"The {product_name} is meticulously designed to provide the best experience. {basic_description}. It combines efficiency with a sleek aesthetic, making it an essential addition to your collection.",
                "bullets": [
                    f"Ergonomic {product_name} design for maximum comfort",
                    "Built with high-quality, sustainable materials",
                    "Lightweight and portable for everyday use",
                    "Easy to clean and maintain for long-term durability",
                    "Unmatched performance in various conditions"
                ],
                "keywords": [product_name, "premium", "quality", "durable", "essential", "accessory", "best", "professional"],
                "health_score": score
            }

        try:
            response = self.model.generate_content(inputs)
            text_response = response.text.replace("```json", "").replace("```", "").strip()
            import json
            return json.loads(text_response)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {"error": "Failed to generate content", "details": str(e)}
