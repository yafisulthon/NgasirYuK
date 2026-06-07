from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    type: str
    qty: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    note: Optional[str] = None
    created_by: Optional[int] = None
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


class StockOpnameItem(BaseModel):
    product_id: int
    actual_stock: int
    note: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
