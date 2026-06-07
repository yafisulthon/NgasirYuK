from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    unit = Column(String(10), nullable=False)  # pcs | sak | kg
    purchase_price = Column(Numeric(15, 2), nullable=False, default=0)
    selling_price = Column(Numeric(15, 2), nullable=False, default=0)
    stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("unit IN ('pcs', 'sak', 'kg')", name="check_unit"),
        CheckConstraint("purchase_price >= 0", name="check_purchase_price"),
        CheckConstraint("selling_price >= 0", name="check_selling_price"),
        CheckConstraint("stock >= 0", name="check_stock"),
    )

    # Relationships
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    purchase_details = relationship("PurchaseDetail", back_populates="product")
    sale_details = relationship("SaleDetail", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
