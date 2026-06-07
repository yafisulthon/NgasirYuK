from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.sale import Sale, SaleDetail
from app.models.purchase import Purchase, PurchaseDetail
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.user import User
from app.dependencies import get_current_user, owner_or_admin
from app.services.report_service import (
    generate_sales_report,
    generate_purchases_report,
    generate_inventory_report,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_date_range(period: str, date_from: Optional[date], date_to: Optional[date]):
    today = date.today()
    if date_from and date_to:
        return date_from, date_to
    if period == "harian":
        return today, today
    elif period == "mingguan":
        start = today - timedelta(days=today.weekday())
        return start, today
    elif period == "bulanan":
        return today.replace(day=1), today
    elif period == "tahunan":
        return today.replace(month=1, day=1), today
    return today.replace(day=1), today


@router.get("/sales")
def sales_report(
    period: str = "bulanan",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    start, end = _get_date_range(period, date_from, date_to)
    sales = (
        db.query(Sale)
        .options(joinedload(Sale.user))
        .filter(Sale.date >= start, Sale.date <= end)
        .order_by(Sale.date)
        .all()
    )
    grand_total = sum(float(s.total) for s in sales)
    return {
        "period": f"{start} s/d {end}",
        "sales": [
            {
                "id": s.id,
                "transaction_number": s.transaction_number,
                "date": s.date,
                "kasir": s.user.name,
                "total": float(s.total),
            }
            for s in sales
        ],
        "grand_total": grand_total,
        "total_transactions": len(sales),
    }


@router.get("/sales/pdf")
def sales_report_pdf(
    period: str = "bulanan",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    data = sales_report(period, date_from, date_to, db, current_user)
    pdf_bytes = generate_sales_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=laporan-penjualan.pdf"},
    )


@router.get("/purchases")
def purchases_report(
    period: str = "bulanan",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    start, end = _get_date_range(period, date_from, date_to)
    query = (
        db.query(Purchase)
        .options(joinedload(Purchase.supplier))
        .filter(Purchase.date >= start, Purchase.date <= end)
    )
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    purchases = query.order_by(Purchase.date).all()
    grand_total = sum(float(p.total) for p in purchases)
    return {
        "period": f"{start} s/d {end}",
        "purchases": [
            {
                "id": p.id,
                "purchase_number": p.purchase_number,
                "date": p.date,
                "supplier_name": p.supplier.name if p.supplier else "-",
                "total": float(p.total),
            }
            for p in purchases
        ],
        "grand_total": grand_total,
        "total_purchases": len(purchases),
    }


@router.get("/purchases/pdf")
def purchases_report_pdf(
    period: str = "bulanan",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    data = purchases_report(period, date_from, date_to, supplier_id, db, current_user)
    pdf_bytes = generate_purchases_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=laporan-pembelian.pdf"},
    )


@router.get("/inventory")
def inventory_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .order_by(Product.name)
        .all()
    )
    return {
        "date": date.today(),
        "products": [
            {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "category": p.category.name if p.category else "-",
                "unit": p.unit,
                "stock": p.stock,
                "minimum_stock": p.minimum_stock,
                "status": "habis" if p.stock == 0 else ("menipis" if p.stock <= p.minimum_stock else "normal"),
            }
            for p in products
        ],
    }


@router.get("/inventory/pdf")
def inventory_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    data = inventory_report(db, current_user)
    pdf_bytes = generate_inventory_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=laporan-persediaan.pdf"},
    )


@router.get("/top-products")
def top_products_report(
    limit: int = 10,
    period: str = "bulanan",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    start, end = _get_date_range(period, date_from, date_to)
    results = (
        db.query(
            Product.id,
            Product.code,
            Product.name,
            Product.unit,
            func.sum(SaleDetail.qty).label("total_qty"),
            func.sum(SaleDetail.subtotal).label("total_revenue"),
        )
        .join(SaleDetail, SaleDetail.product_id == Product.id)
        .join(Sale, Sale.id == SaleDetail.sale_id)
        .filter(Sale.date >= start, Sale.date <= end)
        .group_by(Product.id, Product.code, Product.name, Product.unit)
        .order_by(func.sum(SaleDetail.qty).desc())
        .limit(limit)
        .all()
    )
    return {
        "period": f"{start} s/d {end}",
        "products": [
            {
                "rank": i + 1,
                "id": r.id,
                "code": r.code,
                "name": r.name,
                "unit": r.unit,
                "total_qty": r.total_qty,
                "total_revenue": float(r.total_revenue),
            }
            for i, r in enumerate(results)
        ],
    }


@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ringkasan data untuk dashboard."""
    today = date.today()

    # Total penjualan hari ini
    sales_today = (
        db.query(func.sum(Sale.total))
        .filter(Sale.date == today)
        .scalar() or 0
    )
    # Total transaksi hari ini
    transactions_today = db.query(Sale).filter(Sale.date == today).count()
    # Total barang
    total_products = db.query(Product).count()
    # Total supplier
    total_suppliers = db.query(Supplier).count()

    # Stok menipis
    low_stock = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.stock <= Product.minimum_stock, Product.minimum_stock > 0)
        .order_by(Product.stock)
        .limit(10)
        .all()
    )

    # Produk terlaris bulan ini
    month_start = today.replace(day=1)
    top = (
        db.query(
            Product.id,
            Product.name,
            Product.unit,
            func.sum(SaleDetail.qty).label("total_qty"),
        )
        .join(SaleDetail, SaleDetail.product_id == Product.id)
        .join(Sale, Sale.id == SaleDetail.sale_id)
        .filter(Sale.date >= month_start)
        .group_by(Product.id, Product.name, Product.unit)
        .order_by(func.sum(SaleDetail.qty).desc())
        .limit(5)
        .all()
    )

    # Grafik penjualan 7 hari terakhir
    daily_sales = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        total = db.query(func.sum(Sale.total)).filter(Sale.date == d).scalar() or 0
        daily_sales.append({"date": str(d), "total": float(total)})

    # Grafik penjualan 6 bulan terakhir
    monthly_sales = []
    for i in range(5, -1, -1):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        m_start = date(year, month, 1)
        if month == 12:
            m_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            m_end = date(year, month + 1, 1) - timedelta(days=1)
        total = db.query(func.sum(Sale.total)).filter(Sale.date >= m_start, Sale.date <= m_end).scalar() or 0
        monthly_sales.append({"month": f"{year}-{month:02d}", "total": float(total)})

    return {
        "stats": {
            "sales_today": float(sales_today),
            "transactions_today": transactions_today,
            "total_products": total_products,
            "total_suppliers": total_suppliers,
        },
        "low_stock": [
            {
                "id": p.id,
                "name": p.name,
                "stock": p.stock,
                "minimum_stock": p.minimum_stock,
                "unit": p.unit,
                "category": p.category.name if p.category else "-",
            }
            for p in low_stock
        ],
        "top_products": [
            {"id": r.id, "name": r.name, "unit": r.unit, "total_qty": r.total_qty}
            for r in top
        ],
        "daily_sales": daily_sales,
        "monthly_sales": monthly_sales,
    }
