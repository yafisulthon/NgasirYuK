from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.master import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
)
from app.dependencies import get_current_user, owner_or_admin
from app.services.log_service import log_activity

# ─── Categories ───────────────────────────────────────────────────────────────

categories_router = APIRouter(prefix="/api/categories", tags=["Categories"])


@categories_router.get("", response_model=List[CategoryResponse])
def list_categories(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Category)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    return query.order_by(Category.name).all()


@categories_router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    existing = db.query(Category).filter(Category.name.ilike(body.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nama kategori sudah ada.")
    cat = Category(**body.model_dump())
    db.add(cat)
    log_activity(db, current_user.id, "tambah_kategori", f"Tambah kategori: {body.name}")
    db.commit()
    db.refresh(cat)
    return cat


@categories_router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    if body.name is not None:
        cat.name = body.name
    if body.description is not None:
        cat.description = body.description
    log_activity(db, current_user.id, "edit_kategori", f"Edit kategori ID: {cat_id}")
    db.commit()
    db.refresh(cat)
    return cat


@categories_router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    if cat.products:
        raise HTTPException(status_code=400, detail="Kategori tidak dapat dihapus karena masih digunakan barang.")
    db.delete(cat)
    log_activity(db, current_user.id, "hapus_kategori", f"Hapus kategori: {cat.name}")
    db.commit()


# ─── Suppliers ────────────────────────────────────────────────────────────────

suppliers_router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@suppliers_router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Supplier)
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    return query.order_by(Supplier.name).all()


@suppliers_router.post("", response_model=SupplierResponse, status_code=201)
def create_supplier(
    body: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    supplier = Supplier(**body.model_dump())
    db.add(supplier)
    log_activity(db, current_user.id, "tambah_supplier", f"Tambah supplier: {body.name}")
    db.commit()
    db.refresh(supplier)
    return supplier


@suppliers_router.put("/{sup_id}", response_model=SupplierResponse)
def update_supplier(
    sup_id: int,
    body: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    supplier = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier tidak ditemukan.")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(supplier, field, val)
    log_activity(db, current_user.id, "edit_supplier", f"Edit supplier ID: {sup_id}")
    db.commit()
    db.refresh(supplier)
    return supplier


@suppliers_router.delete("/{sup_id}", status_code=204)
def delete_supplier(
    sup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_or_admin),
):
    supplier = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier tidak ditemukan.")
    db.delete(supplier)
    log_activity(db, current_user.id, "hapus_supplier", f"Hapus supplier: {supplier.name}")
    db.commit()
