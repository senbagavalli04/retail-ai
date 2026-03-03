from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class ProductBase(SQLModel):
    name: str = Field(index=True)
    sku: Optional[str] = Field(default=None, index=True)
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Product(ProductBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listings: List["Listing"] = Relationship(back_populates="product", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sales: List["SalesData"] = Relationship(back_populates="product", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class ListingBase(SQLModel):
    title: str
    description: str
    seo_keywords: Optional[str] = None
    health_score: Optional[float] = None
    is_active: bool = True

class Listing(ListingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")
    product: Optional[Product] = Relationship(back_populates="listings")

class SalesDataBase(SQLModel):
    date: datetime
    units_sold: int
    revenue: float

class SalesData(SalesDataBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")
    product: Optional[Product] = Relationship(back_populates="sales")

class HeaderMapping(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    format_name: str = Field(index=True, unique=True)
    sku_col: str
    date_col: str
    qty_col: str
    price_col: str
    name_col: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
