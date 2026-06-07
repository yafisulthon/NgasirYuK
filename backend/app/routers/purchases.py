from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.purchase import Purchase, PurchaseDetail
from app.models.product import Product
from app.models.user import User
from app.schemas.transaction import PurchaseCreate, PurchaseResponse
from app.dependencies import get_current_user, owner_or_admin
from app.services.stock_service import update_stock
from app.services.log_service import log_activity
from app.services.report_service import generate_purchase_receipt

router = APIRouter(prefix="/api/purchases", tags=["Purchases"])


def _generate_purchase_number(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    count = db.query(Purchase).filter(Purchase.purchase_number.like(f"PB-{today}-%")).count()
    return f"PB-{today}-{count + 1:03d}"


@router.get("", response_model=List[PurchaseResponse])
def list_purchases(
    supplier_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    query = db.query(Purchase).options(
        joinedload(Purchase.supplier),
        joinedload(Purchase.details).joinedload(PurchaseDetail.product),
    )
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if date_from:
        query = query.filter(Purchase.date >= date_from)
    if date_to:
        query = query.filter(Purchase.date <= date_to)
    return query.order_by(Purchase.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    purchase = (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.details).joinedload(PurchaseDetail.product),
        )
        .filter(Purchase.id == purchase_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Data pembelian tidak ditemukan.")
    return purchase


@router.post("", response_model=PurchaseResponse, status_code=201)
def create_purchase(
    body: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    if not body.details:
        raise HTTPException(status_code=400, detail="Minimal 1 item barang.")

    total = sum(d.qty * d.price for d in body.details)
    purchase = Purchase(
        purchase_number=_generate_purchase_number(db),
        supplier_id=body.supplier_id,
        date=body.date,
        total=total,
        created_by=current_user.id,
    )
    db.add(purchase)
    db.flush()  # Dapatkan purchase.id

    for item in body.details:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Barang ID {item.product_id} tidak ditemukan.")

        detail = PurchaseDetail(
            purchase_id=purchase.id,
            product_id=item.product_id,
            qty=item.qty,
            price=item.price,
            subtotal=item.qty * item.price,
        )
        db.add(detail)

        # Update stok
        update_stock(
            db=db,
            product_id=item.product_id,
            qty=item.qty,
            movement_type="in",
            reference_id=purchase.id,
            reference_type="purchase",
            created_by=current_user.id,
        )

    log_activity(
        db, current_user.id, "pembelian",
        f"Pembelian {purchase.purchase_number} - {len(body.details)} item - Total {total}"
    )
    db.commit()
    db.refresh(purchase)

    return (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.details).joinedload(PurchaseDetail.product),
        )
        .filter(Purchase.id == purchase.id)
        .first()
    )


@router.get("/{purchase_id}/pdf")
def download_purchase_pdf(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    purchase = (
        db.query(Purchase)
        .options(
            joinedload(Purchase.supplier),
            joinedload(Purchase.details).joinedload(PurchaseDetail.product),
        )
        .filter(Purchase.id == purchase_id)
        .first()
    )
    if not purchase:
        raise HTTPException(status_code=404, detail="Data pembelian tidak ditemukan.")

    pdf_data = {
        "purchase_number": purchase.purchase_number,
        "date": purchase.date,
        "supplier_name": purchase.supplier.name if purchase.supplier else "-",
        "total": purchase.total,
        "details": [
            {
                "name": d.product.name,
                "unit": d.product.unit,
                "qty": d.qty,
                "price": d.price,
                "subtotal": d.subtotal,
            }
            for d in purchase.details
        ],
    }

    pdf_bytes = generate_purchase_receipt(pdf_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={purchase.purchase_number}.pdf"},
    )
