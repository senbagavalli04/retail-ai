from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Retail AI Intelligence"
    DATABASE_URL: str = "sqlite:///./retail.db"
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
