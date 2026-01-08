# Retail AI Intelligence Platform

A unified AI-powered ecosystem for e-commerce sellers to automate listing creation, validate content quality, and monitor sales performance.

## 🚀 Key Features

*   **Multimodal Content Generation**: Uses Google Gemini (Vision + Text) to turn raw product images and descriptions into high-converting SEO listings.
*   **Listing Validator**: Automated checks for image resolution, aspect ratio, and SEO keyword density.
*   **Retail Intelligence**: Detects sales anomalies (spikes/drops) and provides AI-driven recommendations.
*   **Premium Dashboard**: A modern, glassmorphism-styled Seller UI with a central product catalog.

## 🛠️ Technology Stack

*   **Backend**: FastAPI, SQLModel (SQLite)
*   **AI Engine**: Google Generative AI (Gemini 1.5 Flash)
*   **Frontend**: HTML5, Vanilla JS, CSS3 (Premium Design System)
*   **Icons**: Lucide

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd retail-ai
    ```

2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure API Key** (Optional for Real AI):
    *   Create a `.env` file in the root directory.
    *   Add: `GEMINI_API_KEY=your_api_key_here`
    *   *Note: If no key is provided, the system runs in a sophisticated "Mock Mode" for testing.*

4.  **Run the Server**:
    ```bash
    uvicorn main:app --reload
    ```

5.  **Access Dashboard**:
    Open `http://localhost:8000` in your browser.

## 🧪 Verification

Run the automated system check:
```bash
python verify_system.py
```
This script validates:
*   Database connectivity
*   API Endpoints (Ingestion, Generation, Validation, Intelligence)
*   Dependency integrity

## 📂 Project Structure

*   `app/api`: FastAPI route handlers.
*   `app/services`: Core logic (AI generation, Validation, Anomaly Detection).
*   `app/models.py`: Database schema.
*   `app/static`: CSS and JS assets.
*   `app/templates`: HTML views.
