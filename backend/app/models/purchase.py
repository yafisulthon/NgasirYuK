from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    purchase_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    date = Column(Date, nullable=False)
    total = Column(Numeric(15, 2), nullable=False, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="purchases")
    created_by_user = relationship("User", back_populates="purchases")
    details = relationship("PurchaseDetail", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseDetail(Base):
    __tablename__ = "purchase_details"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    price = Column(Numeric(15, 2), nullable=False)
    subtotal = Column(Numeric(15, 2), nullable=False)

    # Relationships
    purchase = relationship("Purchase", back_populates="details")
    product = relationship("Product", back_populates="purchase_details")
