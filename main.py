from fastapi import FastAPI
from app.database import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Retail AI Intelligence", lifespan=lifespan)

from app.api.ingestion_routes import router as ingestion_router
from app.api.generation_routes import router as generation_router
from app.api.analysis_routes import router as analysis_router

app.include_router(ingestion_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(generation_router, prefix="/api/v1", tags=["Generation"])
app.include_router(analysis_router, prefix="/api/v1", tags=["Analysis"])

from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
