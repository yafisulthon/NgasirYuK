from datetime import date
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.services.log_service import log_activity


def update_stock(
    db: Session,
    product_id: int,
    qty: int,
    movement_type: str,
    reference_id: int = None,
    reference_type: str = None,
    note: str = None,
    created_by: int = None,
):
    """
    Update stok produk dan catat ke stock_movements.
    movement_type: 'in' (tambah) | 'out' (kurangi) | 'opname' (penyesuaian)
    """
    product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
    if not product:
        raise ValueError(f"Produk dengan ID {product_id} tidak ditemukan.")

    if movement_type == "in":
        product.stock += qty
    elif movement_type == "out":
        if product.stock < qty:
            raise ValueError(
                f"Stok '{product.name}' tidak mencukupi. "
                f"Stok tersedia: {product.stock}, diminta: {qty}"
            )
        product.stock -= qty
    elif movement_type == "opname":
        # qty = stok aktual baru, hitung selisih
        diff = qty - product.stock
        product.stock = qty
        qty = diff  # Simpan selisih di stock_movements

    movement = StockMovement(
        product_id=product_id,
        type=movement_type,
        qty=abs(qty),
        reference_id=reference_id,
        reference_type=reference_type,
        note=note,
        created_by=created_by,
        date=date.today(),
    )
    db.add(movement)
    return product
