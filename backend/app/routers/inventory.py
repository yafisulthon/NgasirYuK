from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.inventory import StockMovementResponse, StockOpnameItem, ActivityLogResponse
from app.dependencies import get_current_user, owner_or_admin, owner_only
from app.services.stock_service import update_stock
from app.services.log_service import log_activity

# ─── Inventory Router ─────────────────────────────────────────────────────────

inventory_router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@inventory_router.get("/stock")
def get_stock(
    search: Optional[str] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tampilkan semua stok barang."""
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier),
    )
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.code.ilike(f"%{search}%"))
    if low_stock:
        query = query.filter(Product.stock <= Product.minimum_stock)
    products = query.order_by(Product.name).all()

    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "unit": p.unit,
            "stock": p.stock,
            "minimum_stock": p.minimum_stock,
            "category": p.category.name if p.category else None,
            "status": "habis" if p.stock == 0 else ("menipis" if p.stock <= p.minimum_stock else "normal"),
        }
        for p in products
    ]


@inventory_router.get("/movements", response_model=List[StockMovementResponse])
def get_movements(
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    query = db.query(StockMovement)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(StockMovement.type == movement_type)
    if date_from:
        query = query.filter(StockMovement.date >= date_from)
    if date_to:
        query = query.filter(StockMovement.date <= date_to)
    return query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()


@inventory_router.post("/opname", status_code=200)
def stock_opname(
    items: List[StockOpnameItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    """Stock opname: penyesuaian stok fisik vs sistem."""
    results = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Barang ID {item.product_id} tidak ditemukan.")

        old_stock = product.stock
        update_stock(
            db=db,
            product_id=item.product_id,
            qty=item.actual_stock,
            movement_type="opname",
            note=item.note or f"Stock opname: {old_stock} → {item.actual_stock}",
            created_by=current_user.id,
        )
        results.append({
            "product_id": item.product_id,
            "product_name": product.name,
            "old_stock": old_stock,
            "new_stock": item.actual_stock,
            "diff": item.actual_stock - old_stock,
        })

    log_activity(db, current_user.id, "stock_opname", f"Stock opname untuk {len(items)} produk")
    db.commit()
    return {"message": "Stock opname berhasil.", "results": results}


# ─── Activity Log Router ──────────────────────────────────────────────────────

logs_router = APIRouter(prefix="/api/activity-logs", tags=["Activity Logs"])


@logs_router.get("", response_model=List[ActivityLogResponse])
def get_activity_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only),
):
    query = db.query(ActivityLog)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action:
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))
    if date_from:
        query = query.filter(ActivityLog.created_at >= date_from)
    if date_to:
        query = query.filter(ActivityLog.created_at <= date_to)
    return query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
