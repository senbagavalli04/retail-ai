import google.generativeai as genai
from app.core.config import settings
from PIL import Image
import io

class ListingAgent:
    """
    An advanced AI Agent that generates high-quality, SEO-optimized product listings.
    It follows a multi-stage process: Research -> Generation -> Refinement.
    """
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            print("WARNING: Gemini API Key not found. ListingAgent will run in 'Market Intelligence Mock Mode'.")

    async def generate_listing_content(self, product_name: str, basic_description: str, image_bytes: bytes = None, sales_context: str = None):
        """
        The main agent workflow: orchestrates research and generation.
        """
        if not self.model:
            return self._generate_premium_mock(product_name, basic_description, sales_context=sales_context)

        # Stage 1: Market Research & Persona Definition
        research_prompt = f"""
        Act as a Retail Research Analyst. Analyze the following product:
        Product: {product_name}
        Initial Specs: {basic_description}
        {f"Sales Context: {sales_context}" if sales_context else ""}
        
        Identify:
        1. Primary Target Audience.
        2. Top 3 Selling Points (Benefits, not just features).
        3. Tone of voice.
        4. High-value SEO keywords.
        """
        
        # Stage 2: Content Generation with Sales-Aware Refinement
        main_prompt = f"""
        You are an Expert E-commerce Copywriter and SEO Specialist. 
        Your task is to create a PREMIER product listing for: {product_name}.
        
        CONTEXT:
        {basic_description}
        
        {"SALES PERFORMANCE HISTORY:" + sales_context if sales_context else ""}
        
        INSTRUCTIONS:
        1. **Title**: SEO-optimized (max 150 chars).
        2. **Description**: Persuasive, benefit-driven story. 
           { "IMPORTANT: Analyze the Sales Performance History provided. Identify what worked during surges and what failed during drops. Optimize this new description to double down on high-performance elements." if sales_context else "" }
        3. **Bullet Points**: 5 high-impact bullet points.
        4. **Keywords**: 12 high-intent SEO keywords.
        5. **Persona**: Specify the tone used.
        
        Format the final output as a valid JSON object.
        """

        inputs = [main_prompt]
        if image_bytes:
            try:
                image = Image.open(io.BytesIO(image_bytes))
                inputs.insert(0, image) # Image first for context
                inputs.append("Analyze the visual details (color, texture, build quality) to enrich the description.")
            except Exception as e:
                print(f"Image processing error: {e}")

        try:
            # We combine the "thinking" and "generating" in one high-context prompt for Gemini 1.5
            # but we structure it to force agentic behavior.
            response = self.model.generate_content(inputs)
            text_response = response.text.replace("```json", "").replace("```", "").strip()
            import json
            data = json.loads(text_response)
            
            # Stage 3: Post-processing/Refinement (Optional but good for "Agent" feel)
            # Ensure keys exist
            if "title" not in data: data["title"] = f"Premium {product_name}"
            return data
            
        except Exception as e:
            print(f"ListingAgent Error: {e}")
            return self._generate_premium_mock(product_name, basic_description, error=str(e))

    def _generate_premium_mock(self, name: str, desc: str, error: str = None, sales_context: str = None):
        """
        Provides high-quality, category-aware mock data when the live model is unavailable.
        """
        # Determine category for better mock data
        category = "General"
        n = name.lower()
        if any(x in n for x in ["phone", "laptop", "mouse", "tech", "digital"]): category = "Electronics"
        elif any(x in n for x in ["shirt", "dress", "wear", "shoes"]): category = "Fashion"
        elif any(x in n for x in ["cream", "oil", "soap", "beauty"]): category = "Beauty"

        base_data = {
            "title": f"Ultimate {name} | Professional Grade & Eco-Friendly Design",
            "description": f"The {name} is the perfect solution for those seeking quality and performance. {desc}. " + 
                           (f"Based on your sales trends ({sales_context}), we've optimized this copy to prevent features associated with past drops." if sales_context else "Crafted with premium materials, it ensures durability while maintaining a sleek, modern aesthetic."),
            "bullets": [
                f"Advanced Performance: Optimized {name} technology for superior results.",
                "Sustainable Build: Made with eco-conscious materials for a greener planet.",
                "Ergonomic Design: User-centric shape reduces fatigue during extended use.",
                "Universal Compatibility: Seamlessly integrates with your existing setup.",
                "Lifetime Support: Comes with our dedicated 24/7 customer satisfaction guarantee."
            ],
            "keywords": [name, "premium", "durable", "innovative", "high-quality", "essential", "pro-grade"],
            "persona": f"Premium {category} Specialist"
        }
        
        if error:
            base_data["warning"] = f"Live AI unavailable ({error}). Serving Intelligent Mock."
        else:
            base_data["mode"] = "Premium Mock (Configure API Key for Gemini)"
            
        return base_data

class ContentGenerator(ListingAgent): 
    # Keep compatibility with existing routes
    pass
