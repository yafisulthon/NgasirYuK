from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from app.schemas.product import ProductSimple
from app.schemas.master import SupplierResponse


class PurchaseDetailCreate(BaseModel):
    product_id: int
    qty: int
    price: Decimal


class PurchaseDetailResponse(BaseModel):
    id: int
    product_id: int
    qty: int
    price: Decimal
    subtotal: Decimal
    product: Optional[ProductSimple] = None

    class Config:
        from_attributes = True


class PurchaseCreate(BaseModel):
    supplier_id: Optional[int] = None
    date: date
    details: List[PurchaseDetailCreate]


class PurchaseResponse(BaseModel):
    id: int
    purchase_number: str
    supplier_id: Optional[int] = None
    date: date
    total: Decimal
    created_by: Optional[int] = None
    created_at: datetime
    supplier: Optional[SupplierResponse] = None
    details: List[PurchaseDetailResponse] = []

    class Config:
        from_attributes = True


# ─── Sale Schemas ─────────────────────────────────────────────────────────────

class SaleDetailCreate(BaseModel):
    product_id: int
    qty: int
    price: Decimal


class SaleDetailResponse(BaseModel):
    id: int
    product_id: int
    qty: int
    price: Decimal
    subtotal: Decimal
    product: Optional[ProductSimple] = None

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    date: date
    payment: Decimal
    details: List[SaleDetailCreate]


class SaleResponse(BaseModel):
    id: int
    transaction_number: str
    user_id: int
    date: date
    total: Decimal
    payment: Decimal
    change_amount: Decimal
    created_at: datetime
    details: List[SaleDetailResponse] = []

    class Config:
        from_attributes = True
