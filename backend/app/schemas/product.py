from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.schemas.master import CategoryResponse, SupplierResponse


class ProductBase(BaseModel):
    code: str
    name: str
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit: str  # pcs | sak | kg
    purchase_price: Decimal
    selling_price: Decimal
    minimum_stock: int = 0


class ProductCreate(ProductBase):
    stock: int = 0


class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    minimum_stock: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    stock: int
    created_at: datetime
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True


class ProductSimple(BaseModel):
    """Simplified product for dropdowns and kasir search."""
    id: int
    code: str
    name: str
    unit: str
    selling_price: Decimal
    stock: int

    class Config:
        from_attributes = True
