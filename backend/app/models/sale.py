from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    transaction_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    total = Column(Numeric(15, 2), nullable=False, default=0)
    payment = Column(Numeric(15, 2), nullable=False, default=0)
    change_amount = Column(Numeric(15, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="sales")
    details = relationship("SaleDetail", back_populates="sale", cascade="all, delete-orphan")


class SaleDetail(Base):
    __tablename__ = "sale_details"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    price = Column(Numeric(15, 2), nullable=False)
    subtotal = Column(Numeric(15, 2), nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="details")
    product = relationship("Product", back_populates="sale_details")
