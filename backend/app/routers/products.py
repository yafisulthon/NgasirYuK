from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductSimple
from app.dependencies import get_current_user, owner_or_admin
from app.services.log_service import log_activity

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    low_stock: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier),
    )
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.code.ilike(f"%{search}%")
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)
    if low_stock:
        query = query.filter(Product.stock <= Product.minimum_stock)
    return query.order_by(Product.name).offset(skip).limit(limit).all()


@router.get("/search", response_model=List[ProductSimple])
def search_products(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick search untuk UI kasir."""
    return (
        db.query(Product)
        .filter(
            (Product.name.ilike(f"%{q}%") | Product.code.ilike(f"%{q}%"))
            & (Product.stock > 0)
        )
        .limit(20)
        .all()
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.supplier))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    # Validasi kode unik
    if db.query(Product).filter(Product.code == body.code).first():
        raise HTTPException(status_code=400, detail="Kode barang sudah digunakan.")
    if body.unit not in ("pcs", "sak", "kg"):
        raise HTTPException(status_code=400, detail="Satuan tidak valid. Pilih: pcs, sak, kg.")

    product = Product(**body.model_dump())
    db.add(product)
    log_activity(db, current_user.id, "tambah_barang", f"Tambah barang: {body.name} ({body.code})")
    db.commit()
    db.refresh(product)
    return db.query(Product).options(
        joinedload(Product.category), joinedload(Product.supplier)
    ).filter(Product.id == product.id).first()


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
    if body.code and body.code != product.code:
        if db.query(Product).filter(Product.code == body.code).first():
            raise HTTPException(status_code=400, detail="Kode barang sudah digunakan.")
    if body.unit and body.unit not in ("pcs", "sak", "kg"):
        raise HTTPException(status_code=400, detail="Satuan tidak valid.")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    log_activity(db, current_user.id, "edit_barang", f"Edit barang ID: {product_id} ({product.name})")
    db.commit()
    db.refresh(product)
    return db.query(Product).options(
        joinedload(Product.category), joinedload(Product.supplier)
    ).filter(Product.id == product.id).first()


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
    log_activity(db, current_user.id, "hapus_barang", f"Hapus barang: {product.name} ({product.code})")
    db.delete(product)
    db.commit()
