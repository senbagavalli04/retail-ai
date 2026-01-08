from PIL import Image
import io
import re

class ListingValidator:
    def validate_image(self, image_bytes: bytes):
        """
        Validates image resolution and aspect ratio.
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                width, height = img.size
                aspect_ratio = width / height
                
                issues = []
                if width < 1000 or height < 1000:
                    issues.append("Low resolution (recommended > 1000px)")
                
                if not (0.9 <= aspect_ratio <= 1.1):
                    issues.append("Image is not square (1:1 aspect ratio recommended)")
                
                score = 100 - (len(issues) * 20)
                return {
                    "valid": len(issues) == 0,
                    "score": max(0, score),
                    "issues": issues,
                    "resolution": f"{width}x{height}"
                }
        except Exception as e:
            return {"valid": False, "error": str(e)}

    def validate_seo_content(self, title: str, description: str):
        """
        Validates basic SEO requirements.
        """
        issues = []
        score = 100
        
        if len(title) < 50:
            issues.append("Title too short (< 50 chars)")
            score -= 10
        elif len(title) > 200:
            issues.append("Title too long (> 200 chars)")
            score -= 10
            
        if len(description) < 200:
            issues.append("Description too short (thin content)")
            score -= 20
            
        # Basic keyword stuffing check
        words = description.lower().split()
        if len(words) > 0:
            word_counts = {word: words.count(word) for word in set(words) if len(word) > 4}
            repeated_words = [w for w, c in word_counts.items() if c > 5]
            if repeated_words:
                issues.append(f"Potential keyword stuffing: {', '.join(repeated_words)}")
                score -= 10

        return {
            "score": max(0, score),
            "issues": issues
        }
