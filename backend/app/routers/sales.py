from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.sale import Sale, SaleDetail
from app.models.product import Product
from app.models.user import User
from app.schemas.transaction import SaleCreate, SaleResponse
from app.dependencies import get_current_user, owner_or_admin
from app.services.stock_service import update_stock
from app.services.log_service import log_activity
from app.services.report_service import generate_sale_receipt

router = APIRouter(prefix="/api/sales", tags=["Sales"])


def _generate_transaction_number(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    count = db.query(Sale).filter(Sale.transaction_number.like(f"TRX-{today}-%")).count()
    return f"TRX-{today}-{count + 1:03d}"


@router.get("", response_model=List[SaleResponse])
def list_sales(
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Sale).options(
        joinedload(Sale.details).joinedload(SaleDetail.product),
    )
    # Kasir hanya lihat transaksi milik sendiri
    if current_user.role == "kasir":
        query = query.filter(Sale.user_id == current_user.id)
    elif user_id:
        query = query.filter(Sale.user_id == user_id)

    if date_from:
        query = query.filter(Sale.date >= date_from)
    if date_to:
        query = query.filter(Sale.date <= date_to)
    return query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = (
        db.query(Sale)
        .options(joinedload(Sale.details).joinedload(SaleDetail.product))
        .filter(Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan.")
    if current_user.role == "kasir" and sale.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    return sale


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(
    body: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.details:
        raise HTTPException(status_code=400, detail="Minimal 1 item barang.")

    # Hitung total
    total = Decimal("0")
    for item in body.details:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Barang ID {item.product_id} tidak ditemukan.")
        if product.stock < item.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Stok '{product.name}' tidak cukup. Tersedia: {product.stock}"
            )
        total += item.qty * item.price

    if body.payment < total:
        raise HTTPException(status_code=400, detail="Jumlah bayar kurang dari total.")

    change_amount = body.payment - total
    sale = Sale(
        transaction_number=_generate_transaction_number(db),
        user_id=current_user.id,
        date=body.date,
        total=total,
        payment=body.payment,
        change_amount=change_amount,
    )
    db.add(sale)
    db.flush()

    for item in body.details:
        detail = SaleDetail(
            sale_id=sale.id,
            product_id=item.product_id,
            qty=item.qty,
            price=item.price,
            subtotal=item.qty * item.price,
        )
        db.add(detail)

        update_stock(
            db=db,
            product_id=item.product_id,
            qty=item.qty,
            movement_type="out",
            reference_id=sale.id,
            reference_type="sale",
            created_by=current_user.id,
        )

    log_activity(
        db, current_user.id, "penjualan",
        f"Transaksi {sale.transaction_number} - Total {total}"
    )
    db.commit()
    db.refresh(sale)

    return (
        db.query(Sale)
        .options(joinedload(Sale.details).joinedload(SaleDetail.product))
        .filter(Sale.id == sale.id)
        .first()
    )


@router.get("/{sale_id}/pdf")
def download_sale_pdf(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = (
        db.query(Sale)
        .options(joinedload(Sale.details).joinedload(SaleDetail.product), joinedload(Sale.user))
        .filter(Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan.")

    pdf_data = {
        "transaction_number": sale.transaction_number,
        "date": sale.date,
        "kasir": sale.user.name,
        "total": sale.total,
        "payment": sale.payment,
        "change_amount": sale.change_amount,
        "details": [
            {
                "name": d.product.name,
                "unit": d.product.unit,
                "qty": d.qty,
                "price": d.price,
                "subtotal": d.subtotal,
            }
            for d in sale.details
        ],
    }

    pdf_bytes = generate_sale_receipt(pdf_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={sale.transaction_number}.pdf"},
    )
